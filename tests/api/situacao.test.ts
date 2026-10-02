import { describe, expect, it } from "vitest";
import { estadoPorUf } from "../../src/lib/entes.ts";
import { formatarEscala } from "../../src/lib/formatacao.ts";
import type { DeclaracaoAtiva, PeriodoDisponivel } from "../../src/server/repositories/rreo.ts";
import { escolherPeriodo, indicadorDoEnte } from "../../src/server/services/despesas.ts";
import { perguntasCriticas } from "../../src/server/services/perguntas.ts";
import { referenciaTemporal } from "../../src/lib/filtros.ts";

const rj = estadoPorUf("RJ")!;

const declaracao = (valores: Record<string, string>, composicaoConsistente = true): DeclaracaoAtiva => ({
  snapshotId: 1,
  codIbge: 33,
  exercicio: 2026,
  periodo: 4,
  statusRelatorio: "HO",
  dataStatus: new Date("2026-09-30T22:36:35Z"),
  coletadoEm: new Date("2026-10-02T02:18:51Z"),
  ultimaVerificacaoEm: new Date("2026-10-02T02:18:51Z"),
  composicaoConsistente,
  pagas: new Map(Object.entries(valores).map(([k, v]) => [k, [v]])),
});

describe("situação de cada ente", () => {
  const entregas = new Map([[4, { periodo: 4, statusRelatorio: "HO", dataStatus: null }]]);

  it("distingue não coletado, sem entrega no extrato e entregue sem versão validada", () => {
    expect(indicadorDoEnte(rj, undefined, undefined, 4, false).situacao).toBe("nao_coletado");
    expect(indicadorDoEnte(rj, undefined, entregas, 5, false).situacao).toBe("sem_registro_de_entrega");
    expect(indicadorDoEnte(rj, undefined, entregas, 4, false).situacao).toBe("sem_dado_validado");
    expect(indicadorDoEnte(rj, declaracao({ DespesasExcetoIntraOrcamentarias: "10.5" }), entregas, 4, false)).toMatchObject({
      situacao: "disponivel",
      valor: "10.5",
    });
  });

  it("oculta a composição quando as identidades dos grupos falharam", () => {
    const d = declaracao({ DespesasExcetoIntraOrcamentarias: "100", PessoalEEncargosSociais: "40" }, false);
    expect(indicadorDoEnte(rj, d, entregas, 4, true).composicao).toBeNull();
    expect(indicadorDoEnte(rj, { ...d, composicaoConsistente: true }, entregas, 4, true).composicao?.grupos[0]).toMatchObject({
      valor: "40",
      participacaoPercentual: "40",
    });
  });
});

describe("escolha do período", () => {
  const disponiveis: PeriodoDisponivel[] = [
    { exercicio: 2026, periodo: 4, entes: 20, temUniao: false },
    { exercicio: 2026, periodo: 3, entes: 28, temUniao: true },
    { exercicio: 2025, periodo: 6, entes: 28, temUniao: true },
  ];

  it("recorte explícito só vale se houver dado", () => {
    expect(escolherPeriodo(disponiveis, { ano: 2026, bimestre: 4, conceito: "pago" }, false)).toEqual({ exercicio: 2026, bimestre: 4 });
    expect(escolherPeriodo(disponiveis, { ano: 2026, bimestre: 5, conceito: "pago" }, false)).toBeNull();
    expect(escolherPeriodo(disponiveis, { ano: 2024, conceito: "pago" }, false)).toBeNull();
  });

  it("sem bimestre, usa o mais recente (preferindo a União quando pedido)", () => {
    expect(escolherPeriodo(disponiveis, { conceito: "pago" }, false)).toEqual({ exercicio: 2026, bimestre: 4 });
    expect(escolherPeriodo(disponiveis, { conceito: "pago" }, true)).toEqual({ exercicio: 2026, bimestre: 3 });
    expect(escolherPeriodo(disponiveis, { ano: 2025, conceito: "pago" }, true)).toEqual({ exercicio: 2025, bimestre: 6 });
  });
});

describe("textos derivados dos números", () => {
  it("escala arredonda antes de escolher a unidade e concorda em número", () => {
    expect(formatarEscala("999960000000").texto).toBe("R$ 1,00 tri");
    expect(formatarEscala("1500000000").extenso).toBe("1,5 bilhão de reais");
    expect(formatarEscala("2821965337713.47").extenso).toBe("2,82 trilhões de reais");
    expect(formatarEscala("-442945342.36").texto).toBe("-R$ 442,9 mi");
    expect(formatarEscala("999").arredondado).toBe(false);
  });

  it("variação anual usa o sinal real e não chama queda de aumento", () => {
    const ref = referenciaTemporal(2026, 4);
    const atual = indicadorDoEnte(rj, declaracao({ DespesasExcetoIntraOrcamentarias: "99960" }), undefined, 4, true);
    const anterior = indicadorDoEnte(rj, declaracao({ DespesasExcetoIntraOrcamentarias: "100000" }), undefined, 4, false);
    const textos = perguntasCriticas(atual, ref, anterior).map((p) => p.pergunta).join(" ");
    expect(textos).toContain("praticamente iguais");
    expect(textos).not.toContain("maiores");

    const queda = indicadorDoEnte(rj, declaracao({ DespesasExcetoIntraOrcamentarias: "90000" }), undefined, 4, true);
    expect(perguntasCriticas(queda, ref, anterior).map((p) => p.pergunta).join(" ")).toContain("10,0% menores");
  });
});
