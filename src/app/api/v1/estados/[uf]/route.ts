import type { NextRequest } from "next/server";
import { estadoPorUf } from "@/lib/entes.ts";
import { lerFiltros } from "@/lib/filtros.ts";
import { anoAtualBrasilia } from "@/lib/tempo.ts";
import { comBanco, erroParametros, jsonErro, jsonOk, semDados } from "@/server/api/respostas.ts";
import { painelEnte, resolverPeriodo } from "@/server/services/despesas.ts";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, ctx: { params: Promise<{ uf: string }> }) {
  const { uf } = await ctx.params;
  const ente = estadoPorUf(uf);
  if (!ente) return jsonErro(404, "nao_encontrado", "UF desconhecida");
  const lidos = lerFiltros(request.nextUrl.searchParams, { estrito: true, anoAtual: anoAtualBrasilia() });
  if (!lidos.ok) return erroParametros(lidos.erros);
  const { filtros } = lidos;
  return comBanco("estados/uf", async (db) => {
    const periodo = await resolverPeriodo(db, filtros, { codIbges: [ente.codIbge] });
    if (!periodo) return semDados();
    return jsonOk(await painelEnte(db, ente, periodo, filtros.conceito));
  });
}
