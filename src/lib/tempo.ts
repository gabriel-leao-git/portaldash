const FORMATO_ANO = new Intl.DateTimeFormat("en-US", { timeZone: "America/Sao_Paulo", year: "numeric" });

/** Ano corrente no horário de Brasília (limite superior dos filtros de ano). */
export function anoAtualBrasilia(agora: Date = new Date()): number {
  return Number(FORMATO_ANO.format(agora));
}
