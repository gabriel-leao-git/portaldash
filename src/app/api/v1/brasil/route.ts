import type { NextRequest } from "next/server";
import { lerFiltros } from "@/lib/filtros.ts";
import { anoAtualBrasilia } from "@/lib/tempo.ts";
import { comBanco, erroParametros, jsonOk, semDados } from "@/server/api/respostas.ts";
import { painelBrasil, resolverPeriodo } from "@/server/services/despesas.ts";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const lidos = lerFiltros(request.nextUrl.searchParams, { estrito: true, anoAtual: anoAtualBrasilia() });
  if (!lidos.ok) return erroParametros(lidos.erros);
  const { filtros } = lidos;
  return comBanco("brasil", async (db) => {
    const periodo = await resolverPeriodo(db, filtros, { preferirUniao: true });
    if (!periodo) return semDados();
    return jsonOk(await painelBrasil(db, periodo, filtros.conceito));
  });
}
