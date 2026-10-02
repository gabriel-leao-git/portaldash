export type SituacaoSemDado = "sem_dado_validado" | "sem_registro_de_entrega" | "nao_coletado";

/** Rótulos curtos (tabelas) e explicações (cartões) para cada tipo de ausência. */
export const SITUACAO_SEM_DADO: Record<SituacaoSemDado, { curto: string; explicacao: string }> = {
  sem_dado_validado: {
    curto: "entregue; sem versão validada",
    explicacao:
      "O extrato do Siconfi registra a entrega deste período, mas o PortalDash ainda não tem uma versão coletada e validada.",
  },
  sem_registro_de_entrega: {
    curto: "sem entrega no extrato coletado",
    explicacao:
      "O extrato do Siconfi coletado pelo PortalDash não registra a entrega deste período. A situação pode ter mudado depois da última coleta.",
  },
  nao_coletado: {
    curto: "não coletado pelo PortalDash",
    explicacao:
      "O PortalDash não coletou o extrato de entregas deste ente para este exercício. Nada se pode afirmar sobre a entrega.",
  },
};
