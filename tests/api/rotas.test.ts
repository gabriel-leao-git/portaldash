import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import { NextRequest } from "next/server";
import { executarIngestao } from "../../src/server/ingestion/executar.ts";
import { conectarBancoTeste, limparBanco } from "../helpers/banco.ts";
import { fixture, fonteSimulada } from "../helpers/fixtures.ts";

process.env.DATABASE_URL = inject("databaseUrl");

const { GET: getBrasil } = await import("../../src/app/api/v1/brasil/route.ts");
const { GET: getEstados } = await import("../../src/app/api/v1/estados/route.ts");
const { GET: getEstado } = await import("../../src/app/api/v1/estados/[uf]/route.ts");
const { GET: getFontes } = await import("../../src/app/api/v1/fontes/route.ts");
const { GET: getHealth } = await import("../../src/app/api/v1/health/route.ts");

const { pool, db } = conectarBancoTeste();
const req = (caminho: string) => new NextRequest(`http://localhost${caminho}`);
const ctx = (uf: string) => ({ params: Promise.resolve({ uf }) });

const valorDaFixture = (nome: string, codConta: string) => {
  const json = JSON.parse(fixture(nome), (k, v, c?: { source?: string }) => (k === "valor" ? c?.source : v)) as {
    items: { coluna: string; cod_conta: string; valor: string }[];
  };
  return json.items.find((i) => i.coluna === "DESPESAS PAGAS ATÉ O BIMESTRE (j)" && i.cod_conta === codConta)?.valor;
};

beforeAll(async () => {
  await limparBanco(db);
  const fonte = fonteSimulada(
    new Map([
      ["extrato:1:2026", fixture("extrato_1_2026.json")],
      ["rreo:1:2026:4", fixture("rreo_1_2026_b4_anexo01.json")],
      ["extrato:33:2026", fixture("extrato_33_2026.json")],
      ["rreo:33:2026:4", fixture("rreo_33_2026_b4_anexo01.json")],
    ]),
  );
  await executarIngestao(
    { db, pool, fetch: fonte.fetch, esperar: async () => undefined, intervaloMinimoMs: 0 },
    { exercicios: [2026], codIbges: [1, 33], periodos: [4], forcar: false, reverificarAposDias: 7 },
    "teste",
  );
});
afterAll(() => pool.end());

describe("API v1", () => {
  it("/brasil devolve a União com valor exato em string e estados sem soma", async () => {
    const res = await getBrasil(req("/api/v1/brasil?ano=2026&bimestre=4"));
    expect(res.status).toBe(200);
    const corpo = await res.json();
    expect(corpo.uniao.valor).toBe(valorDaFixture("rreo_1_2026_b4_anexo01.json", "DespesasExcetoIntraOrcamentarias"));
    expect(typeof corpo.uniao.valor).toBe("string");
    expect(corpo.referenciaTemporal).toMatchObject({ tipo: "acumulado_no_exercicio", fim: "2026-08-31" });
    expect(corpo.metodologia.versao).toBe("0.1.0");
    expect(corpo.estados.cobertura).toMatchObject({ totalEntes: 27, comDado: 1 });
    expect(JSON.stringify(corpo)).not.toMatch(/total(Nacional|Brasil|Consolidado)/i);
    expect(corpo.avisos.length).toBeGreaterThanOrEqual(5);
  });

  it("ausência não vira zero: estado sem coleta aparece como não coletado", async () => {
    const corpo = await (await getEstados(req("/api/v1/estados?ano=2026&bimestre=4"))).json();
    const sp = corpo.estados.find((e: { ente: { uf: string } }) => e.ente.uf === "SP");
    expect(sp).toMatchObject({ situacao: "nao_coletado", valor: null, proveniencia: null });
    const rj = corpo.estados.find((e: { ente: { uf: string } }) => e.ente.uf === "RJ");
    expect(rj.situacao).toBe("disponivel");
    expect(rj.proveniencia).toMatchObject({ statusEntrega: "homologado", fonte: "siconfi" });
  });

  it("/estados/{uf} traz composição, série e proveniência, sem campos internos", async () => {
    const res = await getEstado(req("/api/v1/estados/rj?ano=2026&bimestre=4"), ctx("rj"));
    const texto = await res.text();
    for (const interno of ["snapshotId", "snapshot_id", "conteudoSha256", "respostaIds", "execucao", "corpo", "DATABASE_URL", "postgres"]) {
      expect(texto).not.toContain(interno);
    }
    const corpo = JSON.parse(texto);
    expect(corpo.indicador.composicao.grupos).toHaveLength(6);
    expect(corpo.serieExercicio.find((p: { bimestre: number }) => p.bimestre === 4).situacao).toBe("disponivel");
    expect(corpo.serieExercicio.find((p: { bimestre: number }) => p.bimestre === 1)).toMatchObject({
      valor: null,
      situacao: "sem_dado_validado",
    });
  });

  it("filtros inválidos devolvem 400 com detalhes; UF fora da allowlist devolve 404", async () => {
    const r400 = await getEstados(req("/api/v1/estados?ano=2026&bimestre=9&x=1"));
    expect(r400.status).toBe(400);
    expect((await r400.json()).erro.codigo).toBe("parametro_invalido");
    expect((await getEstado(req("/api/v1/estados/zz"), ctx("zz"))).status).toBe(404);
    expect((await getEstado(req("/api/v1/estados/r%27j"), ctx("r'j"))).status).toBe(404);
    expect((await getBrasil(req("/api/v1/brasil?ano=2016"))).status).toBe(404);
    // Recorte explícito sem dado validado: 404, não painel vazio com 200.
    expect((await getBrasil(req("/api/v1/brasil?ano=2026&bimestre=3"))).status).toBe(404);
    expect((await getBrasil(req("/api/v1/brasil?ano=2026&bimestre=6"))).status).toBe(404);
    expect((await getEstado(req("/api/v1/estados/sp?ano=2026&bimestre=4"), ctx("sp"))).status).toBe(404);
  });

  it("/fontes e /health expõem só informação pública mínima", async () => {
    const fontes = await (await getFontes(req("/api/v1/fontes"))).json();
    expect(fontes.fontes[0].periodosDisponiveis).toEqual([{ ano: 2026, bimestre: 4, entesComDado: 2 }]);
    expect(JSON.stringify(fontes)).not.toMatch(/erro|mensagem|127\.0\.0\.1/);
    const health = await getHealth();
    expect(health.status).toBe(200);
    expect(await health.json()).toEqual({ status: "ok" });
  });
});
