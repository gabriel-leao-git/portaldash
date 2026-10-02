import { describe, expect, it } from "vitest";
import { lerEnvelope, lerItemRreo } from "../../src/server/integrations/siconfi/parse.ts";
import { montarSnapshot, SnapshotInvalidoError } from "../../src/server/ingestion/snapshot.ts";
import { verificarAnexo01 } from "../../src/server/methodology/verificacoes.ts";
import { fixture, substituirValor } from "../helpers/fixtures.ts";

const itens = (corpo: string) => lerEnvelope(corpo).items.map(lerItemRreo);

describe("verificações do Anexo 01 (metodologia 0.1.0)", () => {
  const reais = [
    "rreo_1_2026_b4_anexo01.json",
    "rreo_1_2025_b6_anexo01.json",
    "rreo_33_2025_b6_anexo01.json",
    "rreo_33_2025_b5_anexo01.json",
    "rreo_33_2026_b4_anexo01.json",
    "rreo_33_2023_b6_anexo01.json",
    "rreo_33_2019_b6_anexo01.json",
    "rreo_35_2026_b4_anexo01.json",
    "rreo_31_2026_b4_anexo01.json",
    "rreo_53_2026_b4_anexo01.json",
  ];

  it.each(reais)("aprova a declaração real %s, com composição consistente", (nome) => {
    const { verificacoes } = montarSnapshot("RREO-Anexo 01", itens(fixture(nome)));
    expect(verificacoes.resultados.filter((r) => r.situacao === "falhou")).toEqual([]);
    expect(verificacoes.aprovado).toBe(true);
    expect(verificacoes.composicaoConsistente).toBe(true);
  });

  const celula = (codConta: string, valor: string) => ({ coluna: "DESPESAS PAGAS ATÉ O BIMESTRE (j)", codConta, valor });
  const base = [
    celula("DespesasExcetoIntraOrcamentarias", "100"),
    celula("DespesasCorrentes", "70"),
    celula("DespesasDeCapital", "30"),
    celula("PessoalEEncargosSociais", "40"),
    celula("JurosEEncargosDaDivida", "10"),
    celula("OutrasDespesasCorrentes", "20"),
    celula("Investimentos", "30"),
  ];

  it("com linha intra presente, exige subtotal único (I2) e bloqueia sem ele", () => {
    expect(verificarAnexo01([...base, celula("DespesasIntraOrcamentariasTotal", "5")]).aprovado).toBe(false);
    expect(
      verificarAnexo01([...base, celula("DespesasIntraOrcamentariasTotal", "5"), celula("SubtotalDasDespesas", "105")]).aprovado,
    ).toBe(true);
    expect(
      verificarAnexo01([
        ...base,
        celula("DespesasIntraOrcamentariasTotal", "5"),
        celula("DespesasIntraOrcamentariasTotal", "5"),
        celula("SubtotalDasDespesas", "105"),
      ]).aprovado,
    ).toBe(false);
    expect(
      verificarAnexo01([...base, celula("DespesasIntraOrcamentariasTotal", "5"), celula("SubtotalDasDespesas", "106")]).aprovado,
    ).toBe(false);
  });

  it("identidade dos grupos não bloqueia a ativação, só marca a composição como inconsistente", () => {
    const r = verificarAnexo01(base.map((c) => (c.codConta === "PessoalEEncargosSociais" ? { ...c, valor: "41" } : c)));
    expect(r.aprovado).toBe(true);
    expect(r.composicaoConsistente).toBe(false);
    expect(r.resultados.find((x) => x.id === "correntes=grupos")).toMatchObject({ situacao: "falhou", bloqueante: false });
  });

  it("rejeita quando o total deixa de bater com as parcelas (adulteração de um centavo)", () => {
    // União 2025 b6, despesas exceto intra pagas
    const corpo = substituirValor(fixture("rreo_1_2025_b6_anexo01.json"), "3606510496180.06", "3606510496180.07");
    const { verificacoes } = montarSnapshot("RREO-Anexo 01", itens(corpo));
    expect(verificacoes.aprovado).toBe(false);
    expect(verificacoes.resultados.find((r) => r.id === "exceto-intra=correntes+capital")?.situacao).toBe("falhou");
  });

  it("não trata linha ausente como zero: total sem parcelas fica não verificável", () => {
    const corpo = JSON.stringify({
      items: [
        {
          exercicio: 2026, periodo: 4, periodicidade: "B", demonstrativo: "RREO", cod_ibge: 33,
          anexo: "RREO-Anexo 01", rotulo: "Padrão", coluna: "DESPESAS PAGAS ATÉ O BIMESTRE (j)",
          cod_conta: "DespesasExcetoIntraOrcamentarias", conta: "DESPESAS (VIII)", valor: 10,
        },
      ],
      hasMore: false,
      count: 1,
    });
    const { verificacoes } = montarSnapshot("RREO-Anexo 01", itens(corpo));
    const identidade = verificacoes.resultados.find((r) => r.id === "exceto-intra=correntes+capital");
    expect(identidade?.situacao).toBe("nao_verificavel");
    expect(verificacoes.resultados.find((r) => r.id === "unica:DespesasCorrentes")?.situacao).toBe("falhou");
    expect(verificacoes.aprovado).toBe(false);
  });
});

describe("montagem do snapshot", () => {
  it("o hash não depende da ordem dos itens", () => {
    const lista = itens(fixture("rreo_35_2026_b4_anexo01.json"));
    const a = montarSnapshot("RREO-Anexo 01", lista);
    const b = montarSnapshot("RREO-Anexo 01", [...lista].reverse());
    expect(a.conteudoSha256).toBe(b.conteudoSha256);
  });

  it("recusa qualquer chave repetida, mesmo com o mesmo valor", () => {
    const lista = itens(fixture("rreo_35_2026_b4_anexo01.json"));
    const primeiro = lista[0];
    if (!primeiro) throw new Error("fixture vazia");
    expect(() => montarSnapshot("RREO-Anexo 01", [...lista, primeiro])).toThrow(SnapshotInvalidoError);
    const conflito = { ...primeiro, valor: "1" as typeof primeiro.valor, valorTexto: "1" };
    expect(() => montarSnapshot("RREO-Anexo 01", [...lista, conflito])).toThrow(SnapshotInvalidoError);
  });

  it("recusa resposta vazia", () => {
    expect(() => montarSnapshot("RREO-Anexo 01", [])).toThrow(SnapshotInvalidoError);
  });
});
