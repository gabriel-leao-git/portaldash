import type { ItemExtrato } from "../integrations/siconfi/parse.ts";

export const ENTREGAVEL_RREO = "Relatório Resumido de Execução Orçamentária";

export type SnapshotAtivoResumo = {
  statusRelatorio: string | null;
  dataStatus: Date | null;
  ultimaVerificacaoEm: Date;
};

export type ColetaPlanejada = {
  periodo: number;
  demonstrativo: "RREO" | "RREO Simplificado";
  statusRelatorio: string | null;
  dataStatus: Date | null;
  motivo: "sem_snapshot" | "status_mudou" | "reverificacao" | "forcado";
};

export type OpcoesPlanejamento = {
  periodos?: readonly number[];
  forcar: boolean;
  reverificarAposDias: number;
  agora: Date;
};

const DIA_MS = 86_400_000;

/** Entrega mais recente do RREO por bimestre, segundo o extrato. */
export function entregasRreoPorPeriodo(itens: readonly ItemExtrato[]): Map<number, ItemExtrato> {
  const porPeriodo = new Map<number, ItemExtrato>();
  for (const item of itens) {
    if (item.entregavel !== ENTREGAVEL_RREO || item.periodicidade !== "B") continue;
    if (item.periodo < 1 || item.periodo > 6) continue;
    const atual = porPeriodo.get(item.periodo);
    const maisRecente =
      !atual || (item.dataStatus?.getTime() ?? 0) > (atual.dataStatus?.getTime() ?? 0);
    if (maisRecente) porPeriodo.set(item.periodo, item);
  }
  return porPeriodo;
}

/**
 * Decide quais bimestres coletar: só os que o extrato mostra como entregues e
 * que ainda não temos, cujo status mudou, ou cuja última verificação está velha.
 */
export function planejarColetas(
  extrato: readonly ItemExtrato[],
  ativos: ReadonlyMap<number, SnapshotAtivoResumo>,
  opcoes: OpcoesPlanejamento,
): ColetaPlanejada[] {
  const coletas: ColetaPlanejada[] = [];
  for (const [periodo, entrega] of [...entregasRreoPorPeriodo(extrato)].sort(([a], [b]) => a - b)) {
    if (opcoes.periodos && !opcoes.periodos.includes(periodo)) continue;
    const base = {
      periodo,
      demonstrativo: entrega.tipoRelatorio === "S" ? ("RREO Simplificado" as const) : ("RREO" as const),
      statusRelatorio: entrega.statusRelatorio,
      dataStatus: entrega.dataStatus,
    };
    const ativo = ativos.get(periodo);
    if (opcoes.forcar) {
      coletas.push({ ...base, motivo: "forcado" });
    } else if (!ativo) {
      coletas.push({ ...base, motivo: "sem_snapshot" });
    } else if (
      ativo.statusRelatorio !== entrega.statusRelatorio ||
      (ativo.dataStatus?.getTime() ?? null) !== (entrega.dataStatus?.getTime() ?? null)
    ) {
      coletas.push({ ...base, motivo: "status_mudou" });
    } else if (opcoes.agora.getTime() - ativo.ultimaVerificacaoEm.getTime() >= opcoes.reverificarAposDias * DIA_MS) {
      coletas.push({ ...base, motivo: "reverificacao" });
    }
  }
  return coletas;
}
