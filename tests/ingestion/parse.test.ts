import { describe, expect, it } from "vitest";
import { lerEnvelope, lerItemExtrato, lerItemRreo, PayloadInvalidoError } from "../../src/server/integrations/siconfi/parse.ts";
import { fixture } from "../helpers/fixtures.ts";

const item = (valor: string, extra = "") =>
  `{"items":[{"exercicio":2025,"periodo":6,"periodicidade":"B","demonstrativo":"RREO","cod_ibge":1,"anexo":"RREO-Anexo 01","rotulo":"Padrão","coluna":"DESPESAS PAGAS ATÉ O BIMESTRE (j)","cod_conta":"TotalDespesas","conta":"TOTAL","valor":${valor}${extra}}],"hasMore":false,"count":1}`;

describe("leitura do payload do Siconfi", () => {
  it("preserva o texto exato do número, sem passar por float", () => {
    const env = lerEnvelope(item("12345678901234567.89"));
    const lido = lerItemRreo(env.items[0]);
    expect(lido.valorTexto).toBe("12345678901234567.89");
    expect(lido.valor).toBe("12345678901234567.89");
  });

  it("lê a fixture real da União com o valor publicado", () => {
    const env = lerEnvelope(fixture("rreo_1_2025_b6_anexo01.json"));
    const itens = env.items.map(lerItemRreo);
    const exceto = itens.find(
      (i) => i.codConta === "DespesasExcetoIntraOrcamentarias" && i.coluna === "DESPESAS PAGAS ATÉ O BIMESTRE (j)",
    );
    expect(exceto?.valor).toBe("3606510496180.06");
  });

  it("recusa notação exponencial e valor ausente", () => {
    expect(() => lerItemRreo(lerEnvelope(item("1e5")).items[0])).toThrow(PayloadInvalidoError);
    expect(() => lerItemRreo(lerEnvelope(item('"100"')).items[0])).toThrow(PayloadInvalidoError);
    expect(() => lerItemRreo(lerEnvelope(item("null")).items[0])).toThrow(PayloadInvalidoError);
  });

  it("recusa envelope inconsistente", () => {
    expect(() => lerEnvelope('{"items":[],"hasMore":false,"count":3}')).toThrow(PayloadInvalidoError);
    expect(() => lerEnvelope('{"hasMore":false,"count":0}')).toThrow(PayloadInvalidoError);
    expect(() => lerEnvelope("<html>bloqueado</html>")).toThrow(PayloadInvalidoError);
  });

  it("lê o extrato com status, data e tipo de relatório", () => {
    const env = lerEnvelope(fixture("extrato_33_2026.json"));
    const linhas = env.items.map(lerItemExtrato);
    const b1 = linhas.find((l) => l.periodo === 1);
    expect(b1?.statusRelatorio).toBe("RE");
    expect(b1?.dataStatus?.toISOString()).toBe("2026-03-30T11:28:18.000Z");
    expect(b1?.tipoRelatorio).toBe("P");
  });
});
