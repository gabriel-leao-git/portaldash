import { and, eq, sql } from "drizzle-orm";
import { ENTES_NO_ESCOPO } from "../../lib/entes.ts";
import type { Db } from "../db/pool.ts";
import {
  celulasRreo,
  entes,
  entregasObservadas,
  execucoesIngestao,
  fontes,
  requisicoes,
  respostasBrutas,
  snapshotsRreo,
} from "../db/schema.ts";
import {
  SICONFI_BASE_PATH,
  SICONFI_DOC_URL,
  SICONFI_FONTE_ID,
  SICONFI_HOST,
} from "../integrations/siconfi/config.ts";
import type { RegistroRequisicao, RespostaBruta } from "../integrations/siconfi/http.ts";
import type { ItemExtrato } from "../integrations/siconfi/parse.ts";
import type { Verificacoes } from "../methodology/verificacoes.ts";
import { ENTREGAVEL_RREO, type SnapshotAtivoResumo } from "./planejamento.ts";
import type { Celula } from "./snapshot.ts";

export type ChaveDeclaracao = {
  codIbge: number;
  exercicio: number;
  periodo: number;
  demonstrativo: string;
  anexo: string;
};

/** Fonte e entes vêm da allowlist em código; a ingestão só os sincroniza. */
export async function sincronizarReferencias(db: Db): Promise<void> {
  await db
    .insert(fontes)
    .values({
      id: SICONFI_FONTE_ID,
      instituicao: "Secretaria do Tesouro Nacional",
      dataset: "Siconfi — API de dados abertos (RREO e extrato de entregas)",
      urlDocumentacao: SICONFI_DOC_URL,
      urlBase: `https://${SICONFI_HOST}${SICONFI_BASE_PATH}`,
    })
    .onConflictDoUpdate({
      target: fontes.id,
      set: {
        instituicao: sql`excluded.instituicao`,
        dataset: sql`excluded.dataset`,
        urlDocumentacao: sql`excluded.url_documentacao`,
        urlBase: sql`excluded.url_base`,
      },
    });
  await db
    .insert(entes)
    .values(ENTES_NO_ESCOPO.map((e) => ({ codIbge: e.codIbge, nome: e.nome, uf: e.uf, esfera: e.esfera })))
    .onConflictDoUpdate({
      target: entes.codIbge,
      set: { nome: sql`excluded.nome`, uf: sql`excluded.uf`, esfera: sql`excluded.esfera` },
    });
}

export async function iniciarExecucao(db: Db, origem: string, escopo: unknown): Promise<number> {
  const [linha] = await db
    .insert(execucoesIngestao)
    .values({ fonteId: SICONFI_FONTE_ID, origem, escopo, situacao: "em_execucao" })
    .returning({ id: execucoesIngestao.id });
  if (!linha) throw new Error("Falha ao registrar execução");
  return linha.id;
}

export type Contadores = {
  requisicoes: number;
  snapshotsCriados: number;
  snapshotsAtivados: number;
  snapshotsRejeitados: number;
  snapshotsSemMudanca: number;
};

export async function finalizarExecucao(
  db: Db,
  id: number,
  situacao: "concluida" | "concluida_com_falhas" | "falhou",
  contadores: Contadores,
  erros: readonly { contexto: string; mensagem: string }[],
): Promise<void> {
  await db
    .update(execucoesIngestao)
    .set({ situacao, finalizadaEm: new Date(), ...contadores, erros })
    .where(eq(execucoesIngestao.id, id));
}

export async function registrarRequisicao(db: Db, execucaoId: number, r: RegistroRequisicao): Promise<number> {
  const [linha] = await db
    .insert(requisicoes)
    .values({
      execucaoId,
      url: r.url,
      iniciadaEm: r.iniciadaEm,
      duracaoMs: r.duracaoMs,
      httpStatus: r.httpStatus,
      etag: r.etag,
      xCache: r.xCache,
      erro: r.erro,
    })
    .returning({ id: requisicoes.id });
  if (!linha) throw new Error("Falha ao registrar requisição");
  return linha.id;
}

/** Guarda o corpo exato uma única vez por (URL, hash) e liga à requisição. */
export async function salvarRespostaBruta(db: Db, resposta: RespostaBruta, requisicaoId?: number): Promise<number> {
  const [inserida] = await db
    .insert(respostasBrutas)
    .values({
      fonteId: SICONFI_FONTE_ID,
      url: resposta.url,
      sha256: resposta.sha256,
      bytes: resposta.bytes,
      corpo: resposta.corpo,
      primeiraColetaEm: resposta.iniciadaEm,
    })
    .onConflictDoNothing({ target: [respostasBrutas.url, respostasBrutas.sha256] })
    .returning({ id: respostasBrutas.id });
  let id = inserida?.id;
  if (id === undefined) {
    const [existente] = await db
      .select({ id: respostasBrutas.id })
      .from(respostasBrutas)
      .where(and(eq(respostasBrutas.url, resposta.url), eq(respostasBrutas.sha256, resposta.sha256)));
    if (!existente) throw new Error("Resposta bruta não encontrada após conflito");
    id = existente.id;
  }
  if (requisicaoId !== undefined) {
    await db.update(requisicoes).set({ respostaId: id }).where(eq(requisicoes.id, requisicaoId));
  }
  return id;
}

/** Acumula o histórico de status do RREO; repetir a mesma observação só atualiza a data. */
export async function registrarEntregas(db: Db, itens: readonly ItemExtrato[], agora: Date): Promise<void> {
  const rreo = itens.filter((i) => i.entregavel === ENTREGAVEL_RREO);
  if (rreo.length === 0) return;
  await db
    .insert(entregasObservadas)
    .values(
      rreo.map((i) => ({
        codIbge: i.codIbge,
        exercicio: i.exercicio,
        periodo: i.periodo,
        periodicidade: i.periodicidade,
        entregavel: i.entregavel,
        instituicao: i.instituicao,
        statusRelatorio: i.statusRelatorio,
        dataStatus: i.dataStatus,
        formaEnvio: i.formaEnvio,
        tipoRelatorio: i.tipoRelatorio,
        primeiraObservacaoEm: agora,
        ultimaObservacaoEm: agora,
      })),
    )
    .onConflictDoUpdate({
      target: [
        entregasObservadas.codIbge,
        entregasObservadas.exercicio,
        entregasObservadas.periodo,
        entregasObservadas.periodicidade,
        entregasObservadas.entregavel,
        entregasObservadas.instituicao,
        entregasObservadas.statusRelatorio,
        entregasObservadas.dataStatus,
      ],
      set: { ultimaObservacaoEm: agora },
    });
}

const condicaoChave = (c: ChaveDeclaracao) =>
  and(
    eq(snapshotsRreo.codIbge, c.codIbge),
    eq(snapshotsRreo.exercicio, c.exercicio),
    eq(snapshotsRreo.periodo, c.periodo),
    eq(snapshotsRreo.demonstrativo, c.demonstrativo),
    eq(snapshotsRreo.anexo, c.anexo),
  );

export type SnapshotAtivo = SnapshotAtivoResumo & { id: number; conteudoSha256: string; periodo: number };

export async function snapshotsAtivos(
  db: Db,
  codIbge: number,
  exercicio: number,
  anexo: string,
): Promise<Map<number, SnapshotAtivo>> {
  const linhas = await db
    .select({
      id: snapshotsRreo.id,
      periodo: snapshotsRreo.periodo,
      conteudoSha256: snapshotsRreo.conteudoSha256,
      statusRelatorio: snapshotsRreo.statusRelatorio,
      dataStatus: snapshotsRreo.dataStatus,
      ultimaVerificacaoEm: snapshotsRreo.ultimaVerificacaoEm,
    })
    .from(snapshotsRreo)
    .where(
      and(
        eq(snapshotsRreo.codIbge, codIbge),
        eq(snapshotsRreo.exercicio, exercicio),
        eq(snapshotsRreo.anexo, anexo),
        eq(snapshotsRreo.situacao, "ativo"),
      ),
    );
  return new Map(linhas.map((l) => [l.periodo, { ...l, conteudoSha256: l.conteudoSha256.trim() }]));
}

/**
 * Conteúdo idêntico ao ativo: registra a nova conferência. O status do
 * extrato só é promovido quando `status` vem informado (ver executar.ts).
 */
export async function marcarVerificado(
  db: Db,
  snapshotId: number,
  agora: Date,
  status?: { statusRelatorio: string | null; dataStatus: Date | null },
): Promise<void> {
  await db
    .update(snapshotsRreo)
    .set({ ultimaVerificacaoEm: agora, ...(status ?? {}) })
    .where(eq(snapshotsRreo.id, snapshotId));
}

export async function buscarRejeitadoIgual(db: Db, chave: ChaveDeclaracao, conteudoSha256: string): Promise<number | null> {
  const [linha] = await db
    .select({ id: snapshotsRreo.id })
    .from(snapshotsRreo)
    .where(
      and(
        condicaoChave(chave),
        eq(snapshotsRreo.conteudoSha256, conteudoSha256),
        eq(snapshotsRreo.situacao, "rejeitado"),
      ),
    )
    .limit(1);
  return linha?.id ?? null;
}

export type NovoSnapshot = {
  chave: ChaveDeclaracao;
  conteudoSha256: string;
  celulas: readonly Celula[];
  verificacoes: Verificacoes;
  statusRelatorio: string | null;
  dataStatus: Date | null;
  respostaIds: readonly number[];
  execucaoId: number;
  agora: Date;
};

const LOTE_CELULAS = 500;

/**
 * Grava a nova versão e, se aprovada, troca o ativo na mesma transação:
 * leitores nunca veem a declaração sem versão ou com duas versões ativas.
 */
export async function gravarSnapshot(db: Db, novo: NovoSnapshot): Promise<{ id: number; ativado: boolean }> {
  const ativar = novo.verificacoes.aprovado;
  return db.transaction(async (tx) => {
    if (ativar) {
      await tx
        .update(snapshotsRreo)
        .set({ situacao: "substituido", substituidoEm: novo.agora })
        .where(and(condicaoChave(novo.chave), eq(snapshotsRreo.situacao, "ativo")));
    }
    const [linha] = await tx
      .insert(snapshotsRreo)
      .values({
        ...novo.chave,
        conteudoSha256: novo.conteudoSha256,
        totalCelulas: novo.celulas.length,
        situacao: ativar ? "ativo" : "rejeitado",
        verificacoes: novo.verificacoes,
        statusRelatorio: novo.statusRelatorio,
        dataStatus: novo.dataStatus,
        respostaIds: [...novo.respostaIds],
        execucaoId: novo.execucaoId,
        coletadoEm: novo.agora,
        ultimaVerificacaoEm: novo.agora,
        ativadoEm: ativar ? novo.agora : null,
      })
      .returning({ id: snapshotsRreo.id });
    if (!linha) throw new Error("Falha ao gravar snapshot");
    for (let i = 0; i < novo.celulas.length; i += LOTE_CELULAS) {
      await tx.insert(celulasRreo).values(
        novo.celulas.slice(i, i + LOTE_CELULAS).map((c) => ({
          snapshotId: linha.id,
          rotulo: c.rotulo,
          coluna: c.coluna,
          codConta: c.codConta,
          conta: c.conta,
          valorTexto: c.valorTexto,
          valor: c.valor,
        })),
      );
    }
    return { id: linha.id, ativado: ativar };
  });
}

export async function atualizarVerificacaoRejeitado(db: Db, snapshotId: number, agora: Date): Promise<void> {
  await db.update(snapshotsRreo).set({ ultimaVerificacaoEm: agora }).where(eq(snapshotsRreo.id, snapshotId));
}
