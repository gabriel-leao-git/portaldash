import { compareDecimals, ratioDecimal, shiftDecimal, subtractDecimals } from "../../lib/decimal.ts";
import { formatarEscala, formatarPercentual } from "../../lib/formatacao.ts";
import type { ReferenciaTemporal } from "../../lib/filtros.ts";
import type { IndicadorEnte } from "./despesas.ts";

export type PerguntaCritica = { pergunta: string; base: string };

const grupo = (i: IndicadorEnte, codConta: string) => i.composicao?.grupos.find((g) => g.codConta === codConta);

/**
 * Perguntas derivadas apenas de recortes validados (composição no mesmo ente
 * e comparação nominal do mesmo bimestre entre exercícios). A base factual
 * acompanha cada pergunta; nenhuma afirma causa, desperdício ou irregularidade.
 */
export function perguntasCriticas(
  indicador: IndicadorEnte,
  referencia: ReferenciaTemporal,
  anterior: IndicadorEnte | null,
): PerguntaCritica[] {
  if (indicador.situacao !== "disponivel" || indicador.valor === null) return [];
  const periodo = referencia.descricao;
  const perguntas: PerguntaCritica[] = [];

  const pessoal = grupo(indicador, "PessoalEEncargosSociais");
  const investimentos = grupo(indicador, "Investimentos");
  if (pessoal?.participacaoPercentual && investimentos?.participacaoPercentual) {
    perguntas.push({
      pergunta: `Pessoal e encargos levaram ${formatarPercentual(pessoal.participacaoPercentual)} das despesas pagas; investimentos, ${formatarPercentual(investimentos.participacaoPercentual)}. Essa divisão está de acordo com as prioridades anunciadas?`,
      base: `Despesas pagas de ${periodo}, exceto intraorçamentárias (RREO Anexo 1, Siconfi). Participação calculada sobre o total pago no mesmo recorte.`,
    });
  }

  const juros = grupo(indicador, "JurosEEncargosDaDivida");
  const amortizacao = grupo(indicador, "AmortizacaoDaDivida");
  if (juros?.valor && juros.participacaoPercentual) {
    const amort = amortizacao?.valor
      ? ` e a amortização (exceto refinanciamento), ${formatarEscala(amortizacao.valor).texto}`
      : "";
    perguntas.push({
      pergunta: `Juros e encargos da dívida somaram ${formatarEscala(juros.valor).texto} (${formatarPercentual(juros.participacaoPercentual)} do total pago)${amort}. Quanto da dívida ainda resta e em que prazo vence?`,
      base: `Despesas pagas de ${periodo}. O refinanciamento (rolagem) da dívida não está incluído no total.`,
    });
  }

  if (anterior?.situacao === "disponivel" && anterior.valor !== null && compareDecimals(anterior.valor, "0") > 0) {
    const diferenca = subtractDecimals(indicador.valor, anterior.valor);
    const variacao = ratioDecimal(shiftDecimal(diferenca, -2), anterior.valor, 1);
    const absoluto = variacao.startsWith("-") ? variacao.slice(1) : variacao;
    const comparacao =
      compareDecimals(absoluto, "0") === 0
        ? "praticamente iguais às do mesmo período do ano anterior (variação menor que 0,05%)"
        : `${formatarPercentual(absoluto)} ${compareDecimals(diferenca, "0") > 0 ? "maiores" : "menores"} que no mesmo período do ano anterior`;
    perguntas.push({
      pergunta: `As despesas pagas foram ${comparacao}, em valores nominais. A variação acompanha a inflação e o que foi orçado?`,
      base: `Comparação de ${periodo} com o mesmo bimestre de ${referencia.exercicio - 1}, sem correção pela inflação. Qualquer um dos dois períodos pode ser retificado pelo ente.`,
    });
  }
  return perguntas;
}
