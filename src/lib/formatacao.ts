import { compareDecimals, roundDecimal, shiftDecimal } from "./decimal.ts";

type NumeroTexto = `${number}`;

const REAIS = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const DATA_HORA = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});
const DATA = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

/** Valor exato em reais. Intl formata a string sem convertê-la em float. */
export function formatarReais(valor: string): string {
  return REAIS.format(valor as NumeroTexto);
}

const ESCALAS = [
  { potencia: 12, nome: "tri", singular: "trilhão", plural: "trilhões", casas: 2 },
  { potencia: 9, nome: "bi", singular: "bilhão", plural: "bilhões", casas: 1 },
  { potencia: 6, nome: "mi", singular: "milhão", plural: "milhões", casas: 1 },
] as const;

export type ValorEscalado = { texto: string; extenso: string; arredondado: boolean };

/**
 * Ex.: "R$ 2,82 tri" — sempre acompanhado do valor exato na interface.
 * Arredonda antes de escolher a escala (999,96 bi vira "R$ 1,00 tri").
 */
export function formatarEscala(valor: string): ValorEscalado {
  const negativo = valor.startsWith("-");
  const magnitude = negativo ? valor.slice(1) : valor;
  const sinal = negativo ? "-" : "";
  const escalas = [...ESCALAS].reverse();
  let escolhida: (typeof ESCALAS)[number] | undefined;
  let reduzido = "";
  for (const escala of escalas) {
    const r = roundDecimal(shiftDecimal(magnitude, escala.potencia), escala.casas);
    if (compareDecimals(r, "1") < 0) break;
    escolhida = escala;
    reduzido = r;
    if (compareDecimals(r, "1000") < 0) break;
  }
  if (!escolhida) return { texto: formatarReais(valor), extenso: formatarReais(valor), arredondado: false };
  const numero = new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: escolhida.casas,
    maximumFractionDigits: escolhida.casas,
  }).format(reduzido as NumeroTexto);
  const unidade = compareDecimals(reduzido, "2") < 0 ? escolhida.singular : escolhida.plural;
  return {
    texto: `${sinal}R$ ${numero} ${escolhida.nome}`,
    extenso: `${negativo ? "menos " : ""}${numero} ${unidade} de reais`,
    arredondado: true,
  };
}

export function formatarPercentual(valor: string): string {
  return `${new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(valor as NumeroTexto)}%`;
}

export function formatarDataHora(iso: string): string {
  return DATA_HORA.format(new Date(iso));
}

export function formatarData(iso: string): string {
  return DATA.format(new Date(iso));
}
