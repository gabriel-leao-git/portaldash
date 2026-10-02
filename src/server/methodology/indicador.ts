/**
 * Metodologia 0.1.0 — ver docs/methodology.md.
 *
 * A linha-manchete é provisória até decisão editorial (docs/methodology.md,
 * "Decisões pendentes"). Mudar qualquer constante deste arquivo é mudança de
 * cálculo: exige nova versão de metodologia e registro de correção.
 */

export const METODOLOGIA_VERSAO = "0.1.0";

export const DEMONSTRATIVO_RREO = "RREO";
export const ANEXO_BALANCO_ORCAMENTARIO = "RREO-Anexo 01";
export const COLUNA_DESPESAS_PAGAS = "DESPESAS PAGAS ATÉ O BIMESTRE (j)";

export const CONTA_EXCETO_INTRA = "DespesasExcetoIntraOrcamentarias";
export const CONTA_INTRA_TOTAL = "DespesasIntraOrcamentariasTotal";
export const CONTA_SUBTOTAL = "SubtotalDasDespesas";

export type GrupoDespesa = {
  readonly codConta: string;
  readonly nome: string;
  readonly categoria: "corrente" | "capital";
};

export const CATEGORIAS = {
  corrente: { codConta: "DespesasCorrentes", nome: "Despesas correntes" },
  capital: { codConta: "DespesasDeCapital", nome: "Despesas de capital" },
} as const;

/** Grupos comuns a União e estados no Anexo 01 (recorte validado na Etapa 1). */
export const GRUPOS: readonly GrupoDespesa[] = [
  { codConta: "PessoalEEncargosSociais", nome: "Pessoal e encargos sociais", categoria: "corrente" },
  { codConta: "JurosEEncargosDaDivida", nome: "Juros e encargos da dívida", categoria: "corrente" },
  { codConta: "OutrasDespesasCorrentes", nome: "Outras despesas correntes", categoria: "corrente" },
  { codConta: "Investimentos", nome: "Investimentos", categoria: "capital" },
  { codConta: "InversoesFinanceiras", nome: "Inversões financeiras", categoria: "capital" },
  { codConta: "AmortizacaoDaDivida", nome: "Amortização da dívida (exceto refinanciamento)", categoria: "capital" },
];

/** Contas da coluna de pagas que o portal lê; todas as demais ficam só no bruto. */
export const CONTAS_LIDAS: readonly string[] = [
  CONTA_EXCETO_INTRA,
  CONTA_INTRA_TOTAL,
  CONTA_SUBTOTAL,
  CATEGORIAS.corrente.codConta,
  CATEGORIAS.capital.codConta,
  ...GRUPOS.map((g) => g.codConta),
];

export const INDICADOR_PRINCIPAL = {
  id: "despesas-pagas-exceto-intra",
  nome: "Despesas pagas no exercício, acumuladas até o bimestre",
  nomeCurto: "Despesas pagas",
  qualificador: "exceto intraorçamentárias",
  conceito: "pago",
  codConta: CONTA_EXCETO_INTRA,
  unidade: "BRL",
} as const;

export const CONCEITOS = ["pago"] as const;
export type Conceito = (typeof CONCEITOS)[number];

/** Avisos obrigatórios que acompanham qualquer exibição do indicador. */
export const AVISOS_INDICADOR: readonly string[] = [
  "Valor acumulado de 1º de janeiro até o fim do bimestre indicado. Não é o gasto do bimestre, e bimestres não devem ser somados.",
  "Não inclui refinanciamento da dívida, despesas intraorçamentárias nem restos a pagar de exercícios anteriores.",
  "Valores nominais, em reais correntes, sem correção pela inflação.",
  "Dados declarados por cada ente ao Siconfi; podem ser retificados depois da coleta.",
];

export const AVISO_SEM_SOMA_ESFERAS =
  "União e estados aparecem lado a lado e não são somados: transferências da União aos estados contam como despesa de quem paga e podem reaparecer como despesa de quem recebe.";
