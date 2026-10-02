import { describe, expect, it } from "vitest";
import { lerFiltros, referenciaTemporal } from "../../src/lib/filtros.ts";

const ler = (q: string, estrito = true) => lerFiltros(new URLSearchParams(q), { estrito, anoAtual: 2026 });

describe("filtros públicos", () => {
  it("aceita o recorte completo e o vazio", () => {
    expect(ler("ano=2025&bimestre=6&conceito=pago")).toEqual({ ok: true, filtros: { ano: 2025, bimestre: 6, conceito: "pago" } });
    expect(ler("")).toEqual({ ok: true, filtros: { ano: undefined, bimestre: undefined, conceito: "pago" } });
  });

  it("recusa valores fora da allowlist e formatos ambíguos", () => {
    for (const q of ["ano=2014", "ano=2027", "ano=20256", "ano=2025.0", "ano=2025&bimestre=0", "ano=2025&bimestre=7", "ano=2025&bimestre=1a", "conceito=empenhado", "conceito=PAGO", "bimestre=3"]) {
      expect(ler(q).ok, q).toBe(false);
    }
  });

  it("recusa parâmetro repetido e, na API, parâmetro desconhecido", () => {
    expect(ler("ano=2025&ano=2026").ok).toBe(false);
    expect(ler("ano=2025&ordem=desc").ok).toBe(false);
    expect(ler("ano=2025&utm_source=x", false).ok).toBe(true);
  });

  it("descreve o período acumulado sem ambiguidade", () => {
    expect(referenciaTemporal(2026, 4)).toMatchObject({ inicio: "2026-01-01", fim: "2026-08-31", descricao: "janeiro a agosto de 2026" });
    expect(referenciaTemporal(2024, 1).fim).toBe("2024-02-29");
    expect(referenciaTemporal(2025, 6).fim).toBe("2025-12-31");
  });
});
