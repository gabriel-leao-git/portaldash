import { afterAll, beforeEach, describe, expect, inject, it } from "vitest";
import { and, eq, sql } from "drizzle-orm";
import pg from "pg";
import { celulasRreo, execucoesIngestao, respostasBrutas, snapshotsRreo } from "../../src/server/db/schema.ts";
import { executarIngestao, LOCK_INGESTAO, type EscopoIngestao } from "../../src/server/ingestion/executar.ts";
import { montarSnapshot } from "../../src/server/ingestion/snapshot.ts";
import { gravarSnapshot, iniciarExecucao, sincronizarReferencias } from "../../src/server/ingestion/store.ts";
import { lerEnvelope, lerItemRreo } from "../../src/server/integrations/siconfi/parse.ts";
import { conectarBancoTeste, limparBanco } from "../helpers/banco.ts";
import { fixture, fonteSimulada, respostaJson, substituirValor, type RespostaSimulada } from "../helpers/fixtures.ts";

const { pool, db } = conectarBancoTeste();
afterAll(() => pool.end());

const escopoRj: EscopoIngestao = { exercicios: [2026], codIbges: [33], periodos: [4], forcar: false, reverificarAposDias: 7 };
const semEspera = async () => undefined;
const AGORA = new Date("2026-10-02T12:00:00Z");

function respostasRj(extrato = fixture("extrato_33_2026.json")) {
  return new Map<string, RespostaSimulada>([
    ["extrato:33:2026", extrato],
    ["rreo:33:2026:4", fixture("rreo_33_2026_b4_anexo01.json")],
  ]);
}

async function rodar(respostas: Map<string, RespostaSimulada>, escopo = escopoRj, agora = AGORA) {
  const fonte = fonteSimulada(respostas);
  const resumo = await executarIngestao(
    { db, pool, fetch: fonte.fetch, esperar: semEspera, intervaloMinimoMs: 0, agora: () => agora },
    escopo,
    "teste",
  );
  return { resumo, chamadas: fonte.chamadas };
}

const ativosRj = () =>
  db
    .select({
      id: snapshotsRreo.id,
      periodo: snapshotsRreo.periodo,
      status: snapshotsRreo.statusRelatorio,
      dataStatus: snapshotsRreo.dataStatus,
    })
    .from(snapshotsRreo)
    .where(and(eq(snapshotsRreo.codIbge, 33), eq(snapshotsRreo.situacao, "ativo")));

const valorDaFixture = (corpo: string, codConta: string) => {
  const json = JSON.parse(corpo, (k, v, ctx?: { source?: string }) => (k === "valor" ? ctx?.source : v)) as {
    items: { coluna: string; cod_conta: string; valor: string }[];
  };
  return json.items.find((i) => i.coluna === "DESPESAS PAGAS ATÉ O BIMESTRE (j)" && i.cod_conta === codConta)?.valor ?? "";
};

/** Simula uma retificação HO → RE do bimestre 4 no extrato do RJ. */
const extratoRetificado = (dataStatus: string) =>
  fixture("extrato_33_2026.json").replace(
    /("periodo": 4,[\s\S]*?"status_relatorio": )"HO"(,[\s\S]*?"data_status": )"[^"]+"/,
    `$1"RE"$2"${dataStatus}"`,
  );

const lockLivre = async () => {
  const cliente = new pg.Client({ connectionString: inject("databaseUrl") });
  await cliente.connect();
  try {
    const { rows } = await cliente.query<{ ok: boolean }>("select pg_try_advisory_lock($1) as ok", [LOCK_INGESTAO]);
    if (rows[0]?.ok) await cliente.query("select pg_advisory_unlock($1)", [LOCK_INGESTAO]);
    return rows[0]?.ok === true;
  } finally {
    await cliente.end();
  }
};

beforeEach(() => limparBanco(db));

describe("ingestão idempotente e versionada", () => {
  it("ativa a declaração validada e guarda o valor exato da fonte", async () => {
    const { resumo } = await rodar(respostasRj());
    expect(resumo.situacao).toBe("concluida");
    expect(resumo.contadores.snapshotsAtivados).toBe(1);
    const [ativo] = await ativosRj();
    const [celula] = await db
      .select({ valor: celulasRreo.valor, texto: celulasRreo.valorTexto })
      .from(celulasRreo)
      .where(
        and(
          eq(celulasRreo.snapshotId, ativo!.id),
          eq(celulasRreo.coluna, "DESPESAS PAGAS ATÉ O BIMESTRE (j)"),
          eq(celulasRreo.codConta, "DespesasExcetoIntraOrcamentarias"),
        ),
      );
    const esperado = valorDaFixture(fixture("rreo_33_2026_b4_anexo01.json"), "DespesasExcetoIntraOrcamentarias");
    expect(celula?.texto).toBe(esperado);
    expect(celula?.valor).toBe(esperado);
  });

  it("reimportar o mesmo conteúdo não cria versões nem duplica dados", async () => {
    await rodar(respostasRj());
    const antes = await db.select({ n: sql<number>`count(*)::int` }).from(celulasRreo);
    const { resumo } = await rodar(respostasRj(), { ...escopoRj, forcar: true });
    expect(resumo.contadores.snapshotsCriados).toBe(0);
    expect(resumo.contadores.snapshotsSemMudanca).toBe(1);
    const depois = await db.select({ n: sql<number>`count(*)::int` }).from(celulasRreo);
    expect(depois[0]?.n).toBe(antes[0]?.n);
    const brutas = await db.select({ n: sql<number>`count(*)::int` }).from(respostasBrutas);
    expect(brutas[0]?.n).toBe(2);
  });

  it("sem mudança de status nem verificação vencida, não consulta o RREO de novo", async () => {
    await rodar(respostasRj());
    const { chamadas } = await rodar(respostasRj());
    expect(chamadas.filter((c) => c.includes("/rreo"))).toEqual([]);
  });

  it("retificação no extrato com conteúdo igual: status não é promovido e a coleta se repete dentro da janela", async () => {
    await rodar(respostasRj());
    const retificado = respostasRj(extratoRetificado("2026-10-01T22:30:00Z"));

    const primeira = await rodar(retificado);
    expect(primeira.resumo.contadores.snapshotsSemMudanca).toBe(1);
    expect((await ativosRj())[0]?.status).toBe("HO");

    const segunda = await rodar(retificado, escopoRj, new Date("2026-10-03T12:00:00Z"));
    expect(segunda.chamadas.some((c) => c.includes("/rreo"))).toBe(true);
    expect((await ativosRj())[0]?.status).toBe("HO");

    await rodar(retificado, escopoRj, new Date("2026-10-15T12:00:00Z"));
    expect((await ativosRj())[0]?.status).toBe("RE");
    const quarta = await rodar(retificado, escopoRj, new Date("2026-10-16T12:00:00Z"));
    expect(quarta.chamadas.some((c) => c.includes("/rreo"))).toBe(false);
  });

  it("retificação no extrato com conteúdo novo vira nova versão ativa, sem --forcar", async () => {
    await rodar(respostasRj());
    const [original] = await ativosRj();
    let corpo = fixture("rreo_33_2026_b4_anexo01.json");
    const pessoal = valorDaFixture(corpo, "PessoalEEncargosSociais");
    const outras = valorDaFixture(corpo, "OutrasDespesasCorrentes");
    corpo = substituirValor(corpo, pessoal, "__P__");
    corpo = substituirValor(corpo, outras, pessoal);
    corpo = substituirValor(corpo, "__P__", outras);
    const respostas = respostasRj(extratoRetificado("2026-10-01T22:30:00Z"));
    respostas.set("rreo:33:2026:4", corpo);

    const { resumo } = await rodar(respostas);
    expect(resumo.contadores.snapshotsAtivados).toBe(1);
    const ativos = await ativosRj();
    expect(ativos).toHaveLength(1);
    expect(ativos[0]?.id).not.toBe(original?.id);
    expect(ativos[0]?.status).toBe("RE");
    const [anterior] = await db.select().from(snapshotsRreo).where(eq(snapshotsRreo.id, original!.id));
    expect(anterior?.situacao).toBe("substituido");
  });

  it("falha da fonte não apaga a última versão válida", async () => {
    await rodar(respostasRj());
    const [antes] = await ativosRj();
    const respostas = respostasRj();
    respostas.set("rreo:33:2026:4", 503);
    const { resumo } = await rodar(respostas, { ...escopoRj, forcar: true });
    expect(resumo.situacao).toBe("falhou");
    const [depois] = await ativosRj();
    expect(depois?.id).toBe(antes?.id);
  });

  it("lote incompleto (2ª página falha) não grava nada e mantém o ativo", async () => {
    await rodar(respostasRj());
    const [antes] = await ativosRj();
    const itens = (JSON.parse(fixture("rreo_33_2026_b4_anexo01.json")) as { items: unknown[] }).items;
    const respostas = respostasRj();
    respostas.set("rreo:33:2026:4", (url) => {
      const offset = Number(url.searchParams.get("offset") ?? "0");
      if (offset > 0) return respostaJson("{}", 503);
      const pagina = itens.slice(0, 10);
      return respostaJson(JSON.stringify({ items: pagina, hasMore: true, count: pagina.length }));
    });
    await rodar(respostas, { ...escopoRj, forcar: true });
    const snapshots = await db.select({ n: sql<number>`count(*)::int` }).from(snapshotsRreo);
    expect(snapshots[0]?.n).toBe(1);
    expect((await ativosRj())[0]?.id).toBe(antes?.id);
  });

  it("conteúdo que falha nas verificações não substitui o ativo e não se acumula", async () => {
    await rodar(respostasRj());
    const [antes] = await ativosRj();
    const corpo = fixture("rreo_33_2026_b4_anexo01.json");
    const respostas = respostasRj();
    respostas.set(
      "rreo:33:2026:4",
      substituirValor(corpo, valorDaFixture(corpo, "DespesasExcetoIntraOrcamentarias"), "1.00"),
    );
    await rodar(respostas, { ...escopoRj, forcar: true });
    await rodar(respostas, { ...escopoRj, forcar: true });
    const rejeitados = await db.select().from(snapshotsRreo).where(eq(snapshotsRreo.situacao, "rejeitado"));
    expect(rejeitados).toHaveLength(1);
    expect((await ativosRj())[0]?.id).toBe(antes?.id);
  });

  it("conteúdo antes rejeitado é ativado quando passa nas verificações atuais", async () => {
    await sincronizarReferencias(db);
    const execucaoId = await iniciarExecucao(db, "teste", {});
    const corpo = fixture("rreo_33_2026_b4_anexo01.json");
    const montado = montarSnapshot("RREO-Anexo 01", lerEnvelope(corpo).items.map(lerItemRreo));
    await gravarSnapshot(db, {
      chave: { codIbge: 33, exercicio: 2026, periodo: 4, demonstrativo: "RREO", anexo: "RREO-Anexo 01" },
      conteudoSha256: montado.conteudoSha256,
      celulas: montado.celulas,
      verificacoes: { ...montado.verificacoes, metodologia: "0.0.0-anterior", aprovado: false },
      statusRelatorio: "HO",
      dataStatus: null,
      respostaIds: [],
      execucaoId,
      agora: AGORA,
    });

    const { resumo } = await rodar(respostasRj());
    expect(resumo.contadores.snapshotsAtivados).toBe(1);
    expect(await ativosRj()).toHaveLength(1);
  });

  it("extrato indisponível deixa a execução como falha, sem tocar nos dados", async () => {
    const respostas = new Map<string, RespostaSimulada>([["extrato:33:2026", new TypeError("fetch failed")]]);
    const { resumo } = await rodar(respostas);
    expect(resumo.situacao).toBe("falhou");
    const [exec] = await db.select().from(execucoesIngestao);
    expect(exec?.situacao).toBe("falhou");
    expect(await ativosRj()).toEqual([]);
  });

  it("libera o lock ao terminar, inclusive quando a execução lança erro", async () => {
    await rodar(respostasRj());
    expect(await lockLivre()).toBe(true);

    // Extrato falha e o log lança: a exceção escapa do laço depois do lock adquirido.
    const quebrada = new Map<string, RespostaSimulada>([["extrato:33:2026", 503]]);
    await expect(
      executarIngestao(
        {
          db,
          pool,
          fetch: fonteSimulada(quebrada).fetch,
          esperar: semEspera,
          intervaloMinimoMs: 0,
          log: () => {
            throw new Error("falha simulada");
          },
        },
        escopoRj,
        "teste",
      ),
    ).rejects.toThrow("falha simulada");
    expect(await lockLivre()).toBe(true);
    const execucoes = await db.select({ situacao: execucoesIngestao.situacao }).from(execucoesIngestao);
    expect(execucoes.at(-1)?.situacao).toBe("falhou");
  });

  it("não permite duas execuções simultâneas", async () => {
    const outro = new pg.Client({ connectionString: inject("databaseUrl") });
    await outro.connect();
    try {
      await outro.query("select pg_advisory_lock($1)", [LOCK_INGESTAO]);
      const { resumo } = await rodar(respostasRj());
      expect(resumo.situacao).toBe("bloqueada");
    } finally {
      await outro.query("select pg_advisory_unlock($1)", [LOCK_INGESTAO]);
      await outro.end();
    }
  });
});
