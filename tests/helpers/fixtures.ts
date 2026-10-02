import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { FetchLike } from "../../src/server/integrations/siconfi/http.ts";

const DIR = join(import.meta.dirname, "..", "fixtures", "siconfi");

export function fixture(nome: string): string {
  return readFileSync(join(DIR, nome), "utf8");
}

export function respostaJson(corpo: string, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(corpo, {
    status,
    headers: { "content-type": "application/json", etag: '"fixture"', "x-cache": "TCP_MISS", ...headers },
  });
}

export const ENVELOPE_VAZIO = JSON.stringify({ items: [], hasMore: false, limit: 5000, offset: 0, count: 0 });

export type RespostaSimulada = string | Error | number | ((url: URL) => Response | Promise<Response>);

/**
 * Fonte simulada: responde a partir de um mapa mutável chave → corpo, onde a
 * chave é "rreo:<ente>:<exercício>:<bimestre>" ou "extrato:<ente>:<exercício>".
 * Um valor Error ou número (status HTTP) simula falha; uma função recebe a URL
 * (útil para paginação).
 */
export function fonteSimulada(respostas: Map<string, RespostaSimulada>) {
  const chamadas: string[] = [];
  const fetch: FetchLike = async (input) => {
    const url = new URL(input);
    chamadas.push(url.pathname + url.search);
    const p = url.searchParams;
    const endpoint = url.pathname.split("/").pop();
    const chave =
      endpoint === "rreo"
        ? `rreo:${p.get("id_ente")}:${p.get("an_exercicio")}:${p.get("nr_periodo")}`
        : endpoint === "extrato_entregas"
          ? `extrato:${p.get("id_ente")}:${p.get("an_referencia")}`
          : `outro:${endpoint}`;
    const resposta = respostas.get(chave);
    if (typeof resposta === "function") return resposta(url);
    if (resposta instanceof Error) throw resposta;
    if (typeof resposta === "number") return respostaJson("{}", resposta);
    return respostaJson(resposta ?? ENVELOPE_VAZIO);
  };
  return { fetch, chamadas };
}

/** Troca o texto exato de um valor numa fixture (simula retificação). */
export function substituirValor(corpo: string, antigo: string, novo: string): string {
  const escapado = antigo.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const alvo = new RegExp(`"valor": ${escapado}(?=[,\\r\\n}])`, "g");
  if (!alvo.test(corpo)) throw new Error(`valor ${antigo} não encontrado na fixture`);
  return corpo.replace(alvo, `"valor": ${novo}`);
}
