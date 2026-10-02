import { addDecimals, decimalsEqual } from "../../lib/decimal.ts";
import {
  CATEGORIAS,
  COLUNA_DESPESAS_PAGAS,
  CONTA_EXCETO_INTRA,
  CONTA_INTRA_TOTAL,
  CONTA_SUBTOTAL,
  GRUPOS,
  METODOLOGIA_VERSAO,
} from "./indicador.ts";

export type ResultadoVerificacao = {
  readonly id: string;
  readonly descricao: string;
  readonly situacao: "ok" | "falhou" | "nao_verificavel";
  /** Bloqueante impede a ativação; não bloqueante só oculta a composição. */
  readonly bloqueante: boolean;
  readonly detalhe?: string;
};

export type Verificacoes = {
  readonly metodologia: string;
  readonly aprovado: boolean;
  /** Falso quando uma identidade dos grupos falha: a composição não é exibida. */
  readonly composicaoConsistente: boolean;
  readonly resultados: readonly ResultadoVerificacao[];
};

type CelulaAnexo01 = { coluna: string; codConta: string; valor: string };

export const ID_COMPOSICAO = ["correntes=grupos", "capital=grupos"] as const;

/**
 * Verificações do Anexo 01 (metodologia 0.1.0, docs/methodology.md seção 7).
 *
 * Bloqueantes (impedem a ativação): presença única de exceto intra, correntes
 * e capital; I1 exceto intra = correntes + capital; I2 subtotal = exceto
 * intra + intra quando a linha intra existir (aí as duas linhas são
 * obrigatórias e únicas). As identidades dos grupos não bloqueiam: se
 * falharem, a composição por grupo deixa de ser exibida.
 *
 * Parcela de grupo ausente não vira zero: a identidade é conferida só com as
 * parcelas presentes e o detalhe registra quais faltaram.
 */
export function verificarAnexo01(celulas: readonly CelulaAnexo01[]): Verificacoes {
  const pagas = new Map<string, string[]>();
  for (const c of celulas) {
    if (c.coluna !== COLUNA_DESPESAS_PAGAS) continue;
    const lista = pagas.get(c.codConta) ?? [];
    lista.push(c.valor);
    pagas.set(c.codConta, lista);
  }
  const quantas = (codConta: string) => pagas.get(codConta)?.length ?? 0;
  const unico = (codConta: string): string | undefined => {
    const valores = pagas.get(codConta);
    return valores?.length === 1 ? valores[0] : undefined;
  };

  const resultados: ResultadoVerificacao[] = [];
  const exigirUnica = (codConta: string) => {
    const n = quantas(codConta);
    resultados.push({
      id: `unica:${codConta}`,
      descricao: `Exatamente uma célula de ${codConta} na coluna de pagas`,
      situacao: n === 1 ? "ok" : "falhou",
      bloqueante: true,
      detalhe: n === 1 ? undefined : `encontradas ${n}`,
    });
  };

  const identidade = (id: string, descricao: string, total: string, parcelas: readonly string[], bloqueante: boolean) => {
    const valorTotal = unico(total);
    const presentes = parcelas.map(unico).filter((v): v is string => v !== undefined);
    if (valorTotal === undefined || presentes.length === 0) {
      resultados.push({ id, descricao, situacao: "nao_verificavel", bloqueante, detalhe: "total ou parcelas ausentes" });
      return;
    }
    const soma = addDecimals(...presentes);
    const confere = decimalsEqual(soma, valorTotal);
    const ausentes = parcelas.filter((p) => unico(p) === undefined);
    const detalhe = [
      confere ? undefined : `total ${valorTotal} ≠ soma ${soma}`,
      ausentes.length ? `parcelas não informadas: ${ausentes.join(", ")}` : undefined,
    ]
      .filter(Boolean)
      .join("; ");
    resultados.push({ id, descricao, situacao: confere ? "ok" : "falhou", bloqueante, detalhe: detalhe || undefined });
  };

  exigirUnica(CONTA_EXCETO_INTRA);
  exigirUnica(CATEGORIAS.corrente.codConta);
  exigirUnica(CATEGORIAS.capital.codConta);

  identidade(
    "exceto-intra=correntes+capital",
    "I1: despesas exceto intra = correntes + capital",
    CONTA_EXCETO_INTRA,
    [CATEGORIAS.corrente.codConta, CATEGORIAS.capital.codConta],
    true,
  );

  if (quantas(CONTA_INTRA_TOTAL) > 0) {
    exigirUnica(CONTA_INTRA_TOTAL);
    exigirUnica(CONTA_SUBTOTAL);
    if (unico(CONTA_INTRA_TOTAL) !== undefined && unico(CONTA_SUBTOTAL) !== undefined) {
      identidade(
        "subtotal=exceto-intra+intra",
        "I2: subtotal = exceto intra + intraorçamentárias",
        CONTA_SUBTOTAL,
        [CONTA_EXCETO_INTRA, CONTA_INTRA_TOTAL],
        true,
      );
    }
  }

  identidade(
    "correntes=grupos",
    "Correntes = pessoal + juros + outras correntes",
    CATEGORIAS.corrente.codConta,
    GRUPOS.filter((g) => g.categoria === "corrente").map((g) => g.codConta),
    false,
  );
  identidade(
    "capital=grupos",
    "Capital = investimentos + inversões + amortização",
    CATEGORIAS.capital.codConta,
    GRUPOS.filter((g) => g.categoria === "capital").map((g) => g.codConta),
    false,
  );

  return {
    metodologia: METODOLOGIA_VERSAO,
    aprovado: resultados.every((r) => !r.bloqueante || r.situacao !== "falhou"),
    composicaoConsistente: resultados.every((r) => r.bloqueante || r.situacao !== "falhou"),
    resultados,
  };
}
