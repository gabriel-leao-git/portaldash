import { jsonErro, jsonOk } from "@/server/api/respostas.ts";
import { dbLeitura } from "@/server/db/pool.ts";
import { bancoDisponivel } from "@/server/repositories/rreo.ts";

export const dynamic = "force-dynamic";

/** Informação mínima: sem versão, host, configuração ou detalhes do erro. */
export async function GET() {
  try {
    await bancoDisponivel(dbLeitura());
    return jsonOk({ status: "ok" }, "nenhum");
  } catch {
    return jsonErro(503, "indisponivel", "Serviço indisponível");
  }
}
