import { ITENS_POR_PAGINA, MAX_PAGINAS, TIMEOUT_DADOS_MS } from "./config.ts";
import { montarUrl, type ClienteHttpSiconfi, type RespostaBruta } from "./http.ts";
import {
  lerEnvelope,
  lerItemExtrato,
  lerItemRreo,
  PayloadInvalidoError,
  type ItemExtrato,
  type ItemRreo,
} from "./parse.ts";

export type ConsultaRreo = {
  exercicio: number;
  periodo: number;
  demonstrativo: "RREO" | "RREO Simplificado";
  anexo: string;
  codIbge: number;
};

export type Resultado<T> = { itens: T[]; respostas: RespostaBruta[] };

/**
 * Pagina com offset montado localmente: os links do envelope apontam para um
 * host interno inutilizável (docs/data-contract.md).
 */
async function paginar<T>(
  http: ClienteHttpSiconfi,
  montar: (offset: number) => string,
  lerItem: (item: unknown) => T,
): Promise<Resultado<T>> {
  const itens: T[] = [];
  const respostas: RespostaBruta[] = [];
  let offset = 0;
  for (let pagina = 0; pagina < MAX_PAGINAS; pagina++) {
    const resposta = await http.get(montar(offset), TIMEOUT_DADOS_MS);
    respostas.push(resposta);
    const envelope = lerEnvelope(resposta.corpo);
    for (const item of envelope.items) itens.push(lerItem(item));
    if (!envelope.hasMore) return { itens, respostas };
    if (envelope.count === 0) throw new PayloadInvalidoError("hasMore=true com página vazia");
    offset += envelope.count;
  }
  throw new PayloadInvalidoError(`Mais de ${MAX_PAGINAS} páginas; resposta recusada`);
}

export async function buscarRreo(http: ClienteHttpSiconfi, consulta: ConsultaRreo): Promise<Resultado<ItemRreo>> {
  const resultado = await paginar(
    http,
    (offset) =>
      montarUrl("rreo", {
        an_exercicio: consulta.exercicio,
        nr_periodo: consulta.periodo,
        co_tipo_demonstrativo: consulta.demonstrativo,
        no_anexo: consulta.anexo,
        id_ente: consulta.codIbge,
        ...(offset > 0 ? { offset, limit: ITENS_POR_PAGINA } : {}),
      }),
    lerItemRreo,
  );
  for (const item of resultado.itens) {
    if (
      item.exercicio !== consulta.exercicio ||
      item.periodo !== consulta.periodo ||
      item.codIbge !== consulta.codIbge ||
      item.anexo !== consulta.anexo ||
      item.demonstrativo !== consulta.demonstrativo
    ) {
      throw new PayloadInvalidoError("Item de RREO fora do recorte consultado");
    }
  }
  return resultado;
}

export async function buscarExtrato(
  http: ClienteHttpSiconfi,
  codIbge: number,
  exercicio: number,
): Promise<Resultado<ItemExtrato>> {
  const resultado = await paginar(
    http,
    (offset) =>
      montarUrl("extrato_entregas", {
        id_ente: codIbge,
        an_referencia: exercicio,
        ...(offset > 0 ? { offset, limit: ITENS_POR_PAGINA } : {}),
      }),
    lerItemExtrato,
  );
  for (const item of resultado.itens) {
    if (item.codIbge !== codIbge || item.exercicio !== exercicio) {
      throw new PayloadInvalidoError("Item de extrato fora do recorte consultado");
    }
  }
  return resultado;
}
