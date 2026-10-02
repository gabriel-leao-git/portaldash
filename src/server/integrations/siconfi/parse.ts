import { isDecimalText, parseDecimal, type DecimalString } from "../../../lib/decimal.ts";

/**
 * Leitura do JSON da fonte como entrada não confiável.
 *
 * O campo "valor" chega como número JSON; o reviver captura o texto exato do
 * número (JSON.parse source text access) para nunca passar por float.
 */

export class PayloadInvalidoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PayloadInvalidoError";
  }
}

class NumeroFonte {
  readonly texto: string;
  constructor(texto: string) {
    this.texto = texto;
  }
}

type ReviverComFonte = (this: unknown, key: string, value: unknown, context?: { source?: string }) => unknown;
const parseComFonte = JSON.parse as (text: string, reviver: ReviverComFonte) => unknown;

function parseJsonPreservandoValor(corpo: string): unknown {
  try {
    return parseComFonte(corpo, function (key, value, context) {
      if (key === "valor" && typeof value === "number") {
        if (typeof context?.source !== "string") {
          throw new PayloadInvalidoError("Runtime sem acesso ao texto original dos números");
        }
        return new NumeroFonte(context.source);
      }
      return value;
    });
  } catch (erro) {
    if (erro instanceof PayloadInvalidoError) throw erro;
    throw new PayloadInvalidoError("JSON inválido");
  }
}

const isObjeto = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

function inteiro(obj: Record<string, unknown>, campo: string): number {
  const v = obj[campo];
  if (typeof v !== "number" || !Number.isSafeInteger(v)) {
    throw new PayloadInvalidoError(`Campo ${campo} ausente ou não inteiro`);
  }
  return v;
}

function texto(obj: Record<string, unknown>, campo: string): string {
  const v = obj[campo];
  if (typeof v !== "string" || v.length === 0 || v.length > 1_000) {
    throw new PayloadInvalidoError(`Campo ${campo} ausente ou inválido`);
  }
  return v;
}

function textoOuNulo(obj: Record<string, unknown>, campo: string): string | null {
  const v = obj[campo];
  if (v === null || v === undefined) return null;
  if (typeof v !== "string" || v.length > 1_000) throw new PayloadInvalidoError(`Campo ${campo} inválido`);
  return v.trim() === "" ? null : v.trim();
}

export type Envelope = {
  items: unknown[];
  hasMore: boolean;
  count: number;
};

export function lerEnvelope(corpo: string): Envelope {
  const json = parseJsonPreservandoValor(corpo);
  if (!isObjeto(json) || !Array.isArray(json.items)) {
    throw new PayloadInvalidoError("Envelope sem items");
  }
  if (typeof json.hasMore !== "boolean") throw new PayloadInvalidoError("Envelope sem hasMore");
  const count = inteiro(json, "count");
  if (count !== json.items.length) throw new PayloadInvalidoError("count difere do número de items");
  return { items: json.items, hasMore: json.hasMore, count };
}

export type ItemRreo = {
  exercicio: number;
  periodo: number;
  periodicidade: string;
  demonstrativo: string;
  codIbge: number;
  anexo: string;
  rotulo: string;
  coluna: string;
  codConta: string;
  conta: string;
  valorTexto: string;
  valor: DecimalString;
};

export function lerItemRreo(item: unknown): ItemRreo {
  if (!isObjeto(item)) throw new PayloadInvalidoError("Item de RREO não é objeto");
  const bruto = item.valor;
  if (!(bruto instanceof NumeroFonte) || !isDecimalText(bruto.texto)) {
    throw new PayloadInvalidoError("Campo valor ausente ou fora do formato decimal");
  }
  return {
    exercicio: inteiro(item, "exercicio"),
    periodo: inteiro(item, "periodo"),
    periodicidade: texto(item, "periodicidade"),
    demonstrativo: texto(item, "demonstrativo"),
    codIbge: inteiro(item, "cod_ibge"),
    anexo: texto(item, "anexo"),
    rotulo: texto(item, "rotulo"),
    coluna: texto(item, "coluna"),
    codConta: texto(item, "cod_conta"),
    conta: texto(item, "conta"),
    valorTexto: bruto.texto,
    valor: parseDecimal(bruto.texto),
  };
}

export type ItemExtrato = {
  exercicio: number;
  codIbge: number;
  instituicao: string;
  entregavel: string;
  periodo: number;
  periodicidade: string;
  statusRelatorio: string | null;
  dataStatus: Date | null;
  formaEnvio: string | null;
  tipoRelatorio: string | null;
};

function dataOuNulo(obj: Record<string, unknown>, campo: string): Date | null {
  const v = textoOuNulo(obj, campo);
  if (v === null) return null;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/.test(v)) {
    throw new PayloadInvalidoError(`Campo ${campo} fora do formato ISO 8601 UTC`);
  }
  const data = new Date(v);
  if (Number.isNaN(data.getTime())) throw new PayloadInvalidoError(`Campo ${campo} com data inválida`);
  return data;
}

export function lerItemExtrato(item: unknown): ItemExtrato {
  if (!isObjeto(item)) throw new PayloadInvalidoError("Item de extrato não é objeto");
  return {
    exercicio: inteiro(item, "exercicio"),
    codIbge: inteiro(item, "cod_ibge"),
    instituicao: texto(item, "instituicao"),
    entregavel: texto(item, "entregavel"),
    periodo: inteiro(item, "periodo"),
    periodicidade: texto(item, "periodicidade"),
    statusRelatorio: textoOuNulo(item, "status_relatorio"),
    dataStatus: dataOuNulo(item, "data_status"),
    formaEnvio: textoOuNulo(item, "forma_envio"),
    tipoRelatorio: textoOuNulo(item, "tipo_relatorio"),
  };
}
