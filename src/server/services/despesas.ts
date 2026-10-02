import { compareDecimals, ratioDecimal, shiftDecimal } from "../../lib/decimal.ts";
import { ESTADOS, UNIAO, type Ente } from "../../lib/entes.ts";
import { referenciaTemporal, type FiltrosSolicitados, type ReferenciaTemporal } from "../../lib/filtros.ts";
import type { Db } from "../db/pool.ts";
import { SICONFI_FONTE_ID } from "../integrations/siconfi/config.ts";
import { montarUrl } from "../integrations/siconfi/http.ts";
import {
  ANEXO_BALANCO_ORCAMENTARIO,
  AVISO_SEM_SOMA_ESFERAS,
  AVISOS_INDICADOR,
  CATEGORIAS,
  CONTA_EXCETO_INTRA,
  DEMONSTRATIVO_RREO,
  GRUPOS,
  INDICADOR_PRINCIPAL,
  METODOLOGIA_VERSAO,
} from "../methodology/indicador.ts";
import {
  declaracoesAtivas,
  entregasDoExercicio,
  periodosDisponiveis,
  type DeclaracaoAtiva,
  type EntregaResumo,
  type PeriodoDisponivel,
} from "../repositories/rreo.ts";

/**
 * - disponivel: há versão validada e ativa.
 * - sem_dado_validado: o extrato coletado registra a entrega, mas não há
 *   versão validada (ainda não coletada ou rejeitada nas verificações).
 * - sem_registro_de_entrega: o extrato do ente foi coletado e não registra
 *   entrega deste bimestre.
 * - nao_coletado: o PortalDash não tem extrato desse ente e exercício; nada
 *   se pode afirmar sobre a entrega.
 */
export type SituacaoIndicador = "disponivel" | "sem_dado_validado" | "sem_registro_de_entrega" | "nao_coletado";

export type ItemComposicao = {
  codConta: string;
  nome: string;
  categoria: "corrente" | "capital";
  valor: string | null;
  participacaoPercentual: string | null;
};

export type Proveniencia = {
  fonte: string;
  consulta: string;
  statusEntrega: "homologado" | "retificado" | null;
  dataStatusSiconfi: string | null;
  coletadoEm: string;
  verificadoEm: string;
};

export type IndicadorEnte = {
  ente: { codIbge: number; uf: string | null; nome: string; esfera: Ente["esfera"] };
  situacao: SituacaoIndicador;
  valor: string | null;
  proveniencia: Proveniencia | null;
  composicao?: { categorias: ItemComposicao[]; grupos: ItemComposicao[] } | null;
};

export type Cobertura = {
  totalEntes: number;
  comDado: number;
  semDado: { uf: string | null; nome: string; situacao: Exclude<SituacaoIndicador, "disponivel"> }[];
};

export type Metadados = {
  versaoApi: "1";
  metodologia: { versao: string; url: string };
  definicaoIndicador: { id: string; nome: string; qualificador: string; conceito: string };
  filtros: { ano: number; bimestre: number; conceito: string };
  referenciaTemporal: ReferenciaTemporal;
  unidade: { moeda: "BRL"; base: "nominal" };
  avisos: string[];
};

const STATUS: Record<string, Proveniencia["statusEntrega"]> = { HO: "homologado", RE: "retificado" };

export const AVISO_COMPOSICAO_OCULTA =
  "A composição por grupo não é exibida para esta declaração: a soma dos grupos não confere com o total de despesas correntes ou de capital.";

function unico(d: DeclaracaoAtiva | undefined, codConta: string): string | null {
  const valores = d?.pagas.get(codConta);
  return valores?.length === 1 ? (valores[0] ?? null) : null;
}

function proveniencia(d: DeclaracaoAtiva): Proveniencia {
  return {
    fonte: SICONFI_FONTE_ID,
    consulta: montarUrl("rreo", {
      an_exercicio: d.exercicio,
      nr_periodo: d.periodo,
      co_tipo_demonstrativo: DEMONSTRATIVO_RREO,
      no_anexo: ANEXO_BALANCO_ORCAMENTARIO,
      id_ente: d.codIbge,
    }),
    statusEntrega: d.statusRelatorio ? (STATUS[d.statusRelatorio] ?? null) : null,
    dataStatusSiconfi: d.dataStatus?.toISOString() ?? null,
    coletadoEm: d.coletadoEm.toISOString(),
    verificadoEm: d.ultimaVerificacaoEm.toISOString(),
  };
}

function composicao(d: DeclaracaoAtiva, total: string): NonNullable<IndicadorEnte["composicao"]> {
  const totalZero = compareDecimals(total, "0") === 0;
  const item = (codConta: string, nome: string, categoria: "corrente" | "capital"): ItemComposicao => {
    const valor = unico(d, codConta);
    return {
      codConta,
      nome,
      categoria,
      valor,
      participacaoPercentual: valor === null || totalZero ? null : ratioDecimal(shiftDecimal(valor, -2), total, 1),
    };
  };
  return {
    categorias: [
      item(CATEGORIAS.corrente.codConta, CATEGORIAS.corrente.nome, "corrente"),
      item(CATEGORIAS.capital.codConta, CATEGORIAS.capital.nome, "capital"),
    ],
    grupos: GRUPOS.map((g) => item(g.codConta, g.nome, g.categoria)),
  };
}

function situacaoSemDado(entregasDoEnte: ReadonlyMap<number, EntregaResumo> | undefined, periodo: number) {
  if (!entregasDoEnte) return "nao_coletado" as const;
  return entregasDoEnte.has(periodo) ? ("sem_dado_validado" as const) : ("sem_registro_de_entrega" as const);
}

export function indicadorDoEnte(
  ente: Ente,
  declaracao: DeclaracaoAtiva | undefined,
  entregasDoEnte: ReadonlyMap<number, EntregaResumo> | undefined,
  periodo: number,
  comComposicao: boolean,
): IndicadorEnte {
  const valor = unico(declaracao, CONTA_EXCETO_INTRA);
  const base = { ente: { codIbge: ente.codIbge, uf: ente.uf, nome: ente.nome, esfera: ente.esfera } };
  if (!declaracao || valor === null) {
    return {
      ...base,
      situacao: situacaoSemDado(entregasDoEnte, periodo),
      valor: null,
      proveniencia: null,
      ...(comComposicao ? { composicao: null } : {}),
    };
  }
  return {
    ...base,
    situacao: "disponivel",
    valor,
    proveniencia: proveniencia(declaracao),
    ...(comComposicao ? { composicao: declaracao.composicaoConsistente ? composicao(declaracao, valor) : null } : {}),
  };
}

export type PeriodoResolvido = { exercicio: number; bimestre: number };

/**
 * Período do recorte. Com ano e bimestre explícitos, exige que o período
 * tenha dado validado para algum dos entes; sem bimestre, usa o mais recente
 * disponível (preferindo os que têm a União, se pedido). Devolve null quando
 * não há dado no recorte (404 na API, estado vazio na página).
 */
export async function resolverPeriodo(
  db: Db,
  filtros: FiltrosSolicitados,
  opcoes: { codIbges?: readonly number[]; preferirUniao?: boolean } = {},
): Promise<PeriodoResolvido | null> {
  const disponiveis = await periodosDisponiveis(db, opcoes.codIbges);
  return escolherPeriodo(disponiveis, filtros, opcoes.preferirUniao ?? false);
}

export function escolherPeriodo(
  disponiveis: readonly PeriodoDisponivel[],
  filtros: FiltrosSolicitados,
  preferirUniao: boolean,
): PeriodoResolvido | null {
  const doAno = disponiveis.filter((p) => filtros.ano === undefined || p.exercicio === filtros.ano);
  if (filtros.bimestre !== undefined) {
    const existe = doAno.some((p) => p.periodo === filtros.bimestre);
    return existe && filtros.ano !== undefined ? { exercicio: filtros.ano, bimestre: filtros.bimestre } : null;
  }
  const escolhido = (preferirUniao ? doAno.find((p) => p.temUniao) : undefined) ?? doAno[0];
  return escolhido ? { exercicio: escolhido.exercicio, bimestre: escolhido.periodo } : null;
}

function metadados(periodo: PeriodoResolvido, conceito: string, avisosExtras: string[] = []): Metadados {
  return {
    versaoApi: "1",
    metodologia: { versao: METODOLOGIA_VERSAO, url: "/metodologia" },
    definicaoIndicador: {
      id: INDICADOR_PRINCIPAL.id,
      nome: INDICADOR_PRINCIPAL.nome,
      qualificador: INDICADOR_PRINCIPAL.qualificador,
      conceito,
    },
    filtros: { ano: periodo.exercicio, bimestre: periodo.bimestre, conceito },
    referenciaTemporal: referenciaTemporal(periodo.exercicio, periodo.bimestre),
    unidade: { moeda: "BRL", base: "nominal" },
    avisos: [...AVISOS_INDICADOR, ...avisosExtras],
  };
}

function cobertura(itens: readonly IndicadorEnte[]): Cobertura {
  return {
    totalEntes: itens.length,
    comDado: itens.filter((i) => i.situacao === "disponivel").length,
    semDado: itens
      .filter((i): i is IndicadorEnte & { situacao: Exclude<SituacaoIndicador, "disponivel"> } => i.situacao !== "disponivel")
      .map((i) => ({ uf: i.ente.uf, nome: i.ente.nome, situacao: i.situacao })),
  };
}

export type PainelEstados = Metadados & { cobertura: Cobertura; estados: IndicadorEnte[] };

export async function painelEstados(db: Db, periodo: PeriodoResolvido, conceito: string): Promise<PainelEstados> {
  const codigos = ESTADOS.map((e) => e.codIbge);
  const [declaracoes, entregas] = await Promise.all([
    declaracoesAtivas(db, { exercicio: periodo.exercicio, periodo: periodo.bimestre, codIbges: codigos }),
    entregasDoExercicio(db, periodo.exercicio, codigos),
  ]);
  const porEnte = new Map(declaracoes.map((d) => [d.codIbge, d]));
  const estados = ESTADOS.map((e) =>
    indicadorDoEnte(e, porEnte.get(e.codIbge), entregas.get(e.codIbge), periodo.bimestre, false),
  );
  return { ...metadados(periodo, conceito), cobertura: cobertura(estados), estados };
}

export type PontoSerie = { bimestre: number; situacao: SituacaoIndicador; valor: string | null };

export type PainelEnte = Metadados & { indicador: IndicadorEnte; serieExercicio: PontoSerie[] };

/** Painel de um ente com a série cumulativa do exercício (b1 → b6, sem diferenças). */
export async function painelEnte(db: Db, ente: Ente, periodo: PeriodoResolvido, conceito: string): Promise<PainelEnte> {
  const [declaracoes, entregas] = await Promise.all([
    declaracoesAtivas(db, { exercicio: periodo.exercicio, codIbges: [ente.codIbge] }),
    entregasDoExercicio(db, periodo.exercicio, [ente.codIbge]),
  ]);
  const porBimestre = new Map(declaracoes.map((d) => [d.periodo, d]));
  const entregasDoEnte = entregas.get(ente.codIbge);
  const serieExercicio: PontoSerie[] = [];
  for (let b = 1; b <= 6; b++) {
    const ponto = indicadorDoEnte(ente, porBimestre.get(b), entregasDoEnte, b, false);
    if (ponto.situacao === "disponivel" || b <= periodo.bimestre) {
      serieExercicio.push({ bimestre: b, situacao: ponto.situacao, valor: ponto.valor });
    }
  }
  const indicador = indicadorDoEnte(ente, porBimestre.get(periodo.bimestre), entregasDoEnte, periodo.bimestre, true);
  const avisos = [
    ...(ente.esfera === "uniao" ? [] : [AVISO_SEM_SOMA_ESFERAS]),
    ...(indicador.situacao === "disponivel" && indicador.composicao === null ? [AVISO_COMPOSICAO_OCULTA] : []),
  ];
  return { ...metadados(periodo, conceito, avisos), indicador, serieExercicio };
}

export type PainelBrasil = Metadados & {
  uniao: IndicadorEnte;
  serieUniao: PontoSerie[];
  estados: { cobertura: Cobertura; itens: IndicadorEnte[] };
};

export async function painelBrasil(db: Db, periodo: PeriodoResolvido, conceito: string): Promise<PainelBrasil> {
  const [uniao, estados] = await Promise.all([
    painelEnte(db, UNIAO, periodo, conceito),
    painelEstados(db, periodo, conceito),
  ]);
  const avisosUniao = uniao.avisos.filter((a) => !AVISOS_INDICADOR.includes(a));
  return {
    ...metadados(periodo, conceito, [AVISO_SEM_SOMA_ESFERAS, ...avisosUniao]),
    uniao: uniao.indicador,
    serieUniao: uniao.serieExercicio,
    estados: { cobertura: estados.cobertura, itens: estados.estados },
  };
}
