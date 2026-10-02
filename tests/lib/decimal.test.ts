import { describe, expect, it } from "vitest";
import {
  addDecimals,
  compareDecimals,
  decimalsEqual,
  InvalidDecimalError,
  parseDecimal,
  ratioDecimal,
  roundDecimal,
  shiftDecimal,
  subtractDecimals,
} from "../../src/lib/decimal.ts";

describe("decimal exato", () => {
  it("preserva valores acima da precisão de float", () => {
    expect(addDecimals("12345678901234567.89", "0.01")).toBe("12345678901234567.9");
    expect(String(Number("12345678901234567.89"))).not.toBe("12345678901234567.89");
    expect(addDecimals("0.1", "0.2")).toBe("0.3");
  });

  it("normaliza zeros à direita e sinal de zero", () => {
    expect(parseDecimal("31840769325.80")).toBe("31840769325.8");
    expect(parseDecimal("-0.00")).toBe("0");
    expect(decimalsEqual("196232085973.5", "196232085973.50")).toBe(true);
  });

  it("recusa formatos que não são decimal simples", () => {
    for (const invalido of ["1e5", "1,5", " 1", "01", "+1", "", ".5", "1.", "NaN"]) {
      expect(() => parseDecimal(invalido)).toThrow(InvalidDecimalError);
    }
  });

  it("soma e subtrai valores reais da fonte sem erro de centavo", () => {
    // União 2025 b6, coluna (j): IX + X = XI (docs/validacao-fonte-siconfi-2026-10.md)
    expect(addDecimals("3606510496180.06", "30097098735.26")).toBe("3636607594915.32");
    expect(subtractDecimals("112864466427.83", "85488479292.41")).toBe("27375987135.42");
    expect(compareDecimals("-442945342.36", "0")).toBe(-1);
  });

  it("arredonda meio para longe do zero, como NUMERIC no PostgreSQL", () => {
    expect(roundDecimal("1.005", 2)).toBe("1.01");
    expect(roundDecimal("2.675", 2)).toBe("2.68");
    expect(roundDecimal("-2.5", 0)).toBe("-3");
    expect(roundDecimal("5054245956.51839", 0)).toBe("5054245957");
  });

  it("converte escala e calcula razões sem float", () => {
    expect(shiftDecimal("5054245956518.39", 9)).toBe("5054.24595651839");
    expect(ratioDecimal("1", "3", 4)).toBe("0.3333");
    expect(ratioDecimal("2", "3", 1)).toBe("0.7");
    expect(() => ratioDecimal("1", "0", 2)).toThrow(RangeError);
  });
});
