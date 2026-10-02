import type { NextRequest } from "next/server";
import { comBanco, erroParametros, jsonOk } from "@/server/api/respostas.ts";
import { situacaoFontes } from "@/server/services/fontes.ts";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const extras = [...new Set(request.nextUrl.searchParams.keys())];
  if (extras.length > 0) {
    return erroParametros(extras.map((campo) => ({ campo: campo.slice(0, 40), mensagem: "Parâmetro desconhecido" })));
  }
  return comBanco("fontes", async (db) => jsonOk(await situacaoFontes(db)));
}
