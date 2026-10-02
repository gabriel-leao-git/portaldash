/**
 * Aritmética decimal exata sobre strings, sem float.
 *
 * Valores monetários entram como texto exato da fonte e são operados como
 * inteiros escalados (BigInt). Arredondamento: meio para longe do zero, igual
 * ao ROUND() de NUMERIC no PostgreSQL.
 */

export type DecimalString = string & { readonly __decimal: unique symbol };

const DECIMAL_PATTERN = /^-?(0|[1-9]\d*)(\.\d+)?$/;

export class InvalidDecimalError extends Error {
  constructor(input: string) {
    super(`Valor decimal inválido: ${JSON.stringify(input.slice(0, 40))}`);
    this.name = "InvalidDecimalError";
  }
}

export function isDecimalText(text: string): boolean {
  return DECIMAL_PATTERN.test(text);
}

type Scaled = { units: bigint; scale: number };

function toScaled(text: string): Scaled {
  if (!DECIMAL_PATTERN.test(text)) throw new InvalidDecimalError(text);
  const negative = text.startsWith("-");
  const unsigned = negative ? text.slice(1) : text;
  const [intPart = "0", fracPart = ""] = unsigned.split(".");
  const units = BigInt(intPart + fracPart);
  return { units: negative ? -units : units, scale: fracPart.length };
}

function rescale(value: Scaled, scale: number): bigint {
  return value.units * 10n ** BigInt(scale - value.scale);
}

function fromScaled(units: bigint, scale: number): DecimalString {
  const negative = units < 0n;
  const digits = (negative ? -units : units).toString().padStart(scale + 1, "0");
  const intPart = scale === 0 ? digits : digits.slice(0, -scale);
  let fracPart = scale === 0 ? "" : digits.slice(-scale);
  fracPart = fracPart.replace(/0+$/, "");
  const body = fracPart ? `${intPart}.${fracPart}` : intPart;
  const isZero = /^0(\.0*)?$/.test(body);
  return (negative && !isZero ? `-${body}` : body) as DecimalString;
}

/** Valida e devolve a forma canônica (sem zeros à direita na fração, sem "-0"). */
export function parseDecimal(text: string): DecimalString {
  const scaled = toScaled(text);
  return fromScaled(scaled.units, scaled.scale);
}

export function addDecimals(...values: readonly string[]): DecimalString {
  const scaled = values.map(toScaled);
  const scale = Math.max(0, ...scaled.map((v) => v.scale));
  const total = scaled.reduce((acc, v) => acc + rescale(v, scale), 0n);
  return fromScaled(total, scale);
}

export function subtractDecimals(a: string, b: string): DecimalString {
  const left = toScaled(a);
  const right = toScaled(b);
  const scale = Math.max(left.scale, right.scale);
  return fromScaled(rescale(left, scale) - rescale(right, scale), scale);
}

export function compareDecimals(a: string, b: string): -1 | 0 | 1 {
  const left = toScaled(a);
  const right = toScaled(b);
  const scale = Math.max(left.scale, right.scale);
  const diff = rescale(left, scale) - rescale(right, scale);
  return diff === 0n ? 0 : diff < 0n ? -1 : 1;
}

export function decimalsEqual(a: string, b: string): boolean {
  return compareDecimals(a, b) === 0;
}

/** Arredonda para `places` casas, meio para longe do zero. */
export function roundDecimal(value: string, places: number): DecimalString {
  if (!Number.isInteger(places) || places < 0) {
    throw new RangeError("places deve ser inteiro não negativo");
  }
  const scaled = toScaled(value);
  if (scaled.scale <= places) return fromScaled(scaled.units, scaled.scale);
  const factor = 10n ** BigInt(scaled.scale - places);
  const magnitude = scaled.units < 0n ? -scaled.units : scaled.units;
  let quotient = magnitude / factor;
  if ((magnitude % factor) * 2n >= factor) quotient += 1n;
  return fromScaled(scaled.units < 0n ? -quotient : quotient, places);
}

/** Divide por uma potência de dez (ex.: reais → bilhões), exato. */
export function shiftDecimal(value: string, powerOfTen: number): DecimalString {
  const scaled = toScaled(value);
  if (powerOfTen >= 0) return fromScaled(scaled.units, scaled.scale + powerOfTen);
  return fromScaled(scaled.units * 10n ** BigInt(-powerOfTen), scaled.scale);
}

/** Razão a/b arredondada a `places` casas (para percentuais de composição). */
export function ratioDecimal(a: string, b: string, places: number): DecimalString {
  const num = toScaled(a);
  const den = toScaled(b);
  if (den.units === 0n) throw new RangeError("divisão por zero");
  const scale = Math.max(num.scale, den.scale);
  const n = rescale(num, scale);
  const d = rescale(den, scale);
  const extra = 10n ** BigInt(places + 1);
  const raw = (n * extra) / d;
  const negative = raw < 0n;
  const magnitude = negative ? -raw : raw;
  let rounded = magnitude / 10n;
  if (magnitude % 10n >= 5n) rounded += 1n;
  return fromScaled(negative ? -rounded : rounded, places);
}
