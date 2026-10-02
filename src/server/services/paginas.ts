import { connection } from "next/server";
import { lerFiltros, type ErroFiltro, type FiltrosSolicitados } from "../../lib/filtros.ts";
import { anoAtualBrasilia } from "../../lib/tempo.ts";
import { dbLeitura, type Db } from "../db/pool.ts";
import { periodosDisponiveis } from "../repositories/rreo.ts";
import { escolherPeriodo, type PeriodoResolvido } from "./despesas.ts";

export type PeriodoOpcao = { ano: number; bimestre: number };

export type Carregado<T> =
  | { tipo: "ok"; dados: T; periodo: PeriodoResolvido; periodos: PeriodoOpcao[] }
  | { tipo: "filtros_invalidos"; erros: ErroFiltro[] }
  | { tipo: "sem_dados"; periodos: PeriodoOpcao[] };

type Busca = Record<string, string | string[] | undefined>;

export class DadosIndisponiveisError extends Error {
  constructor() {
    super("Dados temporariamente indisponíveis");
    this.name = "DadosIndisponiveisError";
  }
}

/**
 * Lê os filtros da URL (tolerando parâmetros alheios) e carrega o recorte.
 * `escopo` restringe a disponibilidade aos entes da página. Falha de banco
 * vira erro para o error boundary (resposta de erro, não página "normal").
 */
export async function carregarRecorte<T>(
  busca: Busca,
  escopo: { codIbges?: readonly number[]; preferirUniao?: boolean },
  carregar: (db: Db, periodo: PeriodoResolvido, filtros: FiltrosSolicitados) => Promise<T>,
): Promise<Carregado<T>> {
  // O banco só é acessível em tempo de requisição (sem rede privada no build).
  await connection();
  const lidos = lerFiltros(busca, { estrito: false, anoAtual: anoAtualBrasilia() });
  if (!lidos.ok) return { tipo: "filtros_invalidos", erros: lidos.erros };
  try {
    const db = dbLeitura();
    const disponiveis = await periodosDisponiveis(db, escopo.codIbges);
    const periodos = disponiveis.map((p) => ({ ano: p.exercicio, bimestre: p.periodo }));
    const periodo = escolherPeriodo(disponiveis, lidos.filtros, escopo.preferirUniao ?? false);
    if (!periodo) return { tipo: "sem_dados", periodos };
    return { tipo: "ok", dados: await carregar(db, periodo, lidos.filtros), periodo, periodos };
  } catch (erro) {
    const tipo = erro instanceof Error ? erro.name : "desconhecido";
    console.error(`[pagina] falha ao carregar recorte (${tipo})`);
    throw new DadosIndisponiveisError();
  }
}

export function queryDoPeriodo(periodo: PeriodoResolvido): string {
  return `?ano=${periodo.exercicio}&bimestre=${periodo.bimestre}`;
}
