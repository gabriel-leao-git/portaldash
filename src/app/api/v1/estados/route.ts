import type { NextRequest } from "next/server";
import { ESTADOS } from "@/lib/entes.ts";
import { lerFiltros } from "@/lib/filtros.ts";
import { anoAtualBrasilia } from "@/lib/tempo.ts";
import { comBanco, erroParametros, jsonOk, semDados } from "@/server/api/respostas.ts";
import { painelEstados, resolverPeriodo } from "@/server/services/despesas.ts";

export const dynamic = "force-dynamic";

const CODIGOS_ESTADOS = ESTADOS.map((e) => e.codIbge);

export async function GET(request: NextRequest) {
  const lidos = lerFiltros(request.nextUrl.searchParams, { estrito: true, anoAtual: anoAtualBrasilia() });
  if (!lidos.ok) return erroParametros(lidos.erros);
  const { filtros } = lidos;
  return comBanco("estados", async (db) => {
    const periodo = await resolverPeriodo(db, filtros, { codIbges: CODIGOS_ESTADOS });
    if (!periodo) return semDados();
    return jsonOk(await painelEstados(db, periodo, filtros.conceito));
  });
}
