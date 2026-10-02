import { describe, expect, it } from "vitest";
import { lerEnvelope, lerItemExtrato } from "../../src/server/integrations/siconfi/parse.ts";
import { planejarColetas } from "../../src/server/ingestion/planejamento.ts";
import { fixture } from "../helpers/fixtures.ts";

const extrato = lerEnvelope(fixture("extrato_33_2026.json")).items.map(lerItemExtrato);
const agora = new Date("2026-10-02T12:00:00Z");
const opcoes = { forcar: false, reverificarAposDias: 7, agora };

describe("planejamento das coletas", () => {
  it("sem snapshots, coleta todos os bimestres entregues e nada além deles", () => {
    const plano = planejarColetas(extrato, new Map(), opcoes);
    expect(plano.map((p) => p.periodo)).toEqual([1, 2, 3, 4]);
    expect(plano.every((p) => p.motivo === "sem_snapshot" && p.demonstrativo === "RREO")).toBe(true);
  });

  it("não recoleta o que não mudou e foi verificado recentemente", () => {
    const ativos = new Map(
      extrato.map((e) => [e.periodo, { statusRelatorio: e.statusRelatorio, dataStatus: e.dataStatus, ultimaVerificacaoEm: agora }]),
    );
    expect(planejarColetas(extrato, ativos, opcoes)).toEqual([]);
  });

  it("recoleta quando o extrato mostra retificação ou a verificação envelheceu", () => {
    const antigo = new Date("2026-09-01T00:00:00Z");
    const ativos = new Map([
      [1, { statusRelatorio: "HO", dataStatus: new Date("2026-03-01T00:00:00Z"), ultimaVerificacaoEm: agora }],
      [2, { statusRelatorio: "RE", dataStatus: new Date("2026-05-29T12:32:07Z"), ultimaVerificacaoEm: antigo }],
    ]);
    const plano = planejarColetas(extrato, ativos, { ...opcoes, periodos: [1, 2] });
    expect(plano.map((p) => [p.periodo, p.motivo])).toEqual([
      [1, "status_mudou"],
      [2, "reverificacao"],
    ]);
  });
});
