import { and, desc, eq, inArray, isNotNull, sql } from "drizzle-orm";
import type { Db } from "../db/pool.ts";
import { celulasRreo, entregasObservadas, execucoesIngestao, fontes, snapshotsRreo } from "../db/schema.ts";
import { ENTREGAVEL_RREO } from "../ingestion/planejamento.ts";
import {
  ANEXO_BALANCO_ORCAMENTARIO,
  COLUNA_DESPESAS_PAGAS,
  CONTAS_LIDAS,
  DEMONSTRATIVO_RREO,
} from "../methodology/indicador.ts";

export type DeclaracaoAtiva = {
  snapshotId: number;
  codIbge: number;
  exercicio: number;
  periodo: number;
  statusRelatorio: string | null;
  dataStatus: Date | null;
  coletadoEm: Date;
  ultimaVerificacaoEm: Date;
  /** Falso quando as identidades dos grupos falharam (composição oculta). */
  composicaoConsistente: boolean;
  /** cod_conta → valores (mais de um valor significa célula ambígua). */
  pagas: Map<string, string[]>;
};

const ativoDoAnexo01 = and(
  eq(snapshotsRreo.situacao, "ativo"),
  eq(snapshotsRreo.anexo, ANEXO_BALANCO_ORCAMENTARIO),
  eq(snapshotsRreo.demonstrativo, DEMONSTRATIVO_RREO),
);

/** Declarações ativas com as células de pagas que o portal usa. */
export async function declaracoesAtivas(
  db: Db,
  filtro: { exercicio: number; periodo?: number; codIbges: readonly number[] },
): Promise<DeclaracaoAtiva[]> {
  if (filtro.codIbges.length === 0) return [];
  const linhas = await db
    .select({
      snapshotId: snapshotsRreo.id,
      codIbge: snapshotsRreo.codIbge,
      exercicio: snapshotsRreo.exercicio,
      periodo: snapshotsRreo.periodo,
      statusRelatorio: snapshotsRreo.statusRelatorio,
      dataStatus: snapshotsRreo.dataStatus,
      coletadoEm: snapshotsRreo.coletadoEm,
      ultimaVerificacaoEm: snapshotsRreo.ultimaVerificacaoEm,
      composicaoConsistente: sql<boolean>`coalesce((${snapshotsRreo.verificacoes} ->> 'composicaoConsistente')::boolean, true)`,
      codConta: celulasRreo.codConta,
      valor: sql<string>`${celulasRreo.valor}::text`,
    })
    .from(snapshotsRreo)
    .innerJoin(celulasRreo, eq(celulasRreo.snapshotId, snapshotsRreo.id))
    .where(
      and(
        ativoDoAnexo01,
        eq(snapshotsRreo.exercicio, filtro.exercicio),
        filtro.periodo === undefined ? undefined : eq(snapshotsRreo.periodo, filtro.periodo),
        inArray(snapshotsRreo.codIbge, [...filtro.codIbges]),
        eq(celulasRreo.coluna, COLUNA_DESPESAS_PAGAS),
        inArray(celulasRreo.codConta, [...CONTAS_LIDAS]),
      ),
    )
    .limit(5_000);

  const porSnapshot = new Map<number, DeclaracaoAtiva>();
  for (const l of linhas) {
    let d = porSnapshot.get(l.snapshotId);
    if (!d) {
      d = {
        snapshotId: l.snapshotId,
        codIbge: l.codIbge,
        exercicio: l.exercicio,
        periodo: l.periodo,
        statusRelatorio: l.statusRelatorio,
        dataStatus: l.dataStatus,
        coletadoEm: l.coletadoEm,
        ultimaVerificacaoEm: l.ultimaVerificacaoEm,
        composicaoConsistente: l.composicaoConsistente,
        pagas: new Map(),
      };
      porSnapshot.set(l.snapshotId, d);
    }
    const lista = d.pagas.get(l.codConta) ?? [];
    lista.push(l.valor);
    d.pagas.set(l.codConta, lista);
  }
  return [...porSnapshot.values()];
}

export type PeriodoDisponivel = { exercicio: number; periodo: number; entes: number; temUniao: boolean };

/** Períodos com declaração ativa; com `codIbges`, só os desses entes. */
export async function periodosDisponiveis(db: Db, codIbges?: readonly number[]): Promise<PeriodoDisponivel[]> {
  const linhas = await db
    .select({
      exercicio: snapshotsRreo.exercicio,
      periodo: snapshotsRreo.periodo,
      entes: sql<number>`count(distinct ${snapshotsRreo.codIbge})::int`,
      temUniao: sql<boolean>`bool_or(${snapshotsRreo.codIbge} = 1)`,
    })
    .from(snapshotsRreo)
    .where(and(ativoDoAnexo01, codIbges ? inArray(snapshotsRreo.codIbge, [...codIbges]) : undefined))
    .groupBy(snapshotsRreo.exercicio, snapshotsRreo.periodo)
    .orderBy(desc(snapshotsRreo.exercicio), desc(snapshotsRreo.periodo))
    .limit(200);
  return linhas;
}

export type EntregaResumo = { periodo: number; statusRelatorio: string | null; dataStatus: Date | null };

/**
 * Última entrega do RREO observada por ente e bimestre no exercício. Ente
 * ausente do mapa = o PortalDash não tem extrato coletado desse exercício.
 */
export async function entregasDoExercicio(
  db: Db,
  exercicio: number,
  codIbges: readonly number[],
): Promise<Map<number, Map<number, EntregaResumo>>> {
  const resultado = new Map<number, Map<number, EntregaResumo>>();
  if (codIbges.length === 0) return resultado;
  const linhas = await db
    .selectDistinctOn([entregasObservadas.codIbge, entregasObservadas.periodo], {
      codIbge: entregasObservadas.codIbge,
      periodo: entregasObservadas.periodo,
      statusRelatorio: entregasObservadas.statusRelatorio,
      dataStatus: entregasObservadas.dataStatus,
    })
    .from(entregasObservadas)
    .where(
      and(
        eq(entregasObservadas.exercicio, exercicio),
        eq(entregasObservadas.periodicidade, "B"),
        eq(entregasObservadas.entregavel, ENTREGAVEL_RREO),
        inArray(entregasObservadas.codIbge, [...codIbges]),
      ),
    )
    .orderBy(
      entregasObservadas.codIbge,
      entregasObservadas.periodo,
      desc(entregasObservadas.ultimaObservacaoEm),
      sql`${entregasObservadas.dataStatus} desc nulls last`,
    )
    .limit(2_000);
  for (const l of linhas) {
    const doEnte = resultado.get(l.codIbge) ?? new Map<number, EntregaResumo>();
    doEnte.set(l.periodo, { periodo: l.periodo, statusRelatorio: l.statusRelatorio, dataStatus: l.dataStatus });
    resultado.set(l.codIbge, doEnte);
  }
  return resultado;
}

export type ExecucaoResumo = { situacao: string; iniciadaEm: Date; finalizadaEm: Date | null };

export async function ultimaExecucao(db: Db, somenteBemSucedida: boolean): Promise<ExecucaoResumo | null> {
  const [linha] = await db
    .select({
      situacao: execucoesIngestao.situacao,
      iniciadaEm: execucoesIngestao.iniciadaEm,
      finalizadaEm: execucoesIngestao.finalizadaEm,
    })
    .from(execucoesIngestao)
    .where(
      somenteBemSucedida
        ? and(inArray(execucoesIngestao.situacao, ["concluida", "concluida_com_falhas"]), isNotNull(execucoesIngestao.finalizadaEm))
        : undefined,
    )
    .orderBy(desc(execucoesIngestao.iniciadaEm))
    .limit(1);
  return linha ?? null;
}

export async function listarFontes(db: Db) {
  return db.select().from(fontes).limit(20);
}

export async function bancoDisponivel(db: Db): Promise<boolean> {
  await db.execute(sql`select 1`);
  return true;
}
