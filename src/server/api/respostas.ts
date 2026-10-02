import type { ErroFiltro } from "../../lib/filtros.ts";
import { dbLeitura, type Db } from "../db/pool.ts";

/** Os dados só mudam após uma ingestão; a URL inclui todos os filtros. */
const CACHE_PUBLICO = "public, max-age=300";

const CABECALHOS_BASE = {
  "content-type": "application/json; charset=utf-8",
  "x-content-type-options": "nosniff",
};

export function jsonOk(dados: unknown, cache: "publico" | "nenhum" = "publico"): Response {
  return new Response(JSON.stringify(dados), {
    status: 200,
    headers: { ...CABECALHOS_BASE, "cache-control": cache === "publico" ? CACHE_PUBLICO : "no-store" },
  });
}

export function jsonErro(status: number, codigo: string, mensagem: string, detalhes?: ErroFiltro[]): Response {
  return new Response(JSON.stringify({ erro: { codigo, mensagem, ...(detalhes ? { detalhes } : {}) } }), {
    status,
    headers: { ...CABECALHOS_BASE, "cache-control": "no-store" },
  });
}

export const erroParametros = (detalhes: ErroFiltro[]) =>
  jsonErro(400, "parametro_invalido", "Parâmetros inválidos", detalhes);

export const semDados = () =>
  jsonErro(404, "sem_dados", "Não há dados validados para o recorte solicitado");

/**
 * Executa a consulta e converte falhas de banco em 503 genérico. O log
 * registra só o tipo do erro: mensagens do driver podem conter host e porta.
 */
export async function comBanco(rota: string, consulta: (db: Db) => Promise<Response>): Promise<Response> {
  try {
    return await consulta(dbLeitura());
  } catch (erro) {
    const tipo = erro instanceof Error ? erro.name : "desconhecido";
    const codigo = (erro as { code?: unknown })?.code;
    console.error(`[api] ${rota}: falha ao consultar dados (${tipo}${typeof codigo === "string" ? ` ${codigo}` : ""})`);
    return jsonErro(503, "indisponivel", "Dados temporariamente indisponíveis");
  }
}
