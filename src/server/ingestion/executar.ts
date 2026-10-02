import type pg from "pg";
import { entePorCodigo } from "../../lib/entes.ts";
import type { Db } from "../db/pool.ts";
import { buscarExtrato, buscarRreo } from "../integrations/siconfi/client.ts";
import {
  ClienteHttpSiconfi,
  type FetchLike,
  type RegistroRequisicao,
  type RespostaBruta,
} from "../integrations/siconfi/http.ts";
import { ANEXO_BALANCO_ORCAMENTARIO } from "../methodology/indicador.ts";
import { planejarColetas, type ColetaPlanejada } from "./planejamento.ts";
import { montarSnapshot } from "./snapshot.ts";
import {
  atualizarVerificacaoRejeitado,
  buscarRejeitadoIgual,
  finalizarExecucao,
  gravarSnapshot,
  iniciarExecucao,
  marcarVerificado,
  registrarEntregas,
  registrarRequisicao,
  salvarRespostaBruta,
  sincronizarReferencias,
  snapshotsAtivos,
  type Contadores,
  type SnapshotAtivo,
} from "./store.ts";

/** Chave arbitrária e fixa do lock consultivo que impede execuções simultâneas. */
export const LOCK_INGESTAO = 7_340_211;

/**
 * Por quantos dias depois de uma mudança de status no extrato a declaração
 * continua sendo recoletada se o conteúdo não mudar. A defasagem observada
 * entre homologação e /rreo chegou a ~38 h e o TTL da CDN é desconhecido.
 */
export const JANELA_CONFIRMACAO_RETIFICACAO_DIAS = 10;
const DIA_MS = 86_400_000;

export type EscopoIngestao = {
  exercicios: readonly number[];
  codIbges: readonly number[];
  periodos?: readonly number[];
  forcar: boolean;
  reverificarAposDias: number;
};

export type DependenciasIngestao = {
  db: Db;
  pool: pg.Pool;
  fetch?: FetchLike;
  esperar?: (ms: number) => Promise<void>;
  intervaloMinimoMs?: number;
  agora?: () => Date;
  log?: (mensagem: string) => void;
};

export type ErroIngestao = { contexto: string; mensagem: string };

export type ResumoIngestao = {
  execucaoId: number | null;
  situacao: "concluida" | "concluida_com_falhas" | "falhou" | "bloqueada";
  contadores: Contadores;
  erros: ErroIngestao[];
};

const mensagemSegura = (erro: unknown) =>
  erro instanceof Error ? `${erro.name}: ${erro.message}`.slice(0, 500) : "erro desconhecido";

type Execucao = {
  deps: DependenciasIngestao;
  execucaoId: number;
  http: ClienteHttpSiconfi;
  agora: () => Date;
  log: (mensagem: string) => void;
  contadores: Contadores;
  erros: ErroIngestao[];
  salvarRespostas: (respostas: readonly RespostaBruta[]) => Promise<number[]>;
  coletasPlanejadas: number;
  /** Declarações conferidas com sucesso (ativadas ou sem mudança). */
  coletasConcluidas: number;
};

async function processarDeclaracao(
  ex: Execucao,
  codIbge: number,
  exercicio: number,
  coleta: ColetaPlanejada,
  ativo: SnapshotAtivo | undefined,
): Promise<void> {
  const chave = {
    codIbge,
    exercicio,
    periodo: coleta.periodo,
    demonstrativo: coleta.demonstrativo,
    anexo: ANEXO_BALANCO_ORCAMENTARIO,
  };
  const contexto = `ente ${codIbge}, exercício ${exercicio}, bimestre ${coleta.periodo}`;
  const { db } = ex.deps;

  const resultado = await buscarRreo(ex.http, chave);
  const respostaIds = await ex.salvarRespostas(resultado.respostas);
  const montado = montarSnapshot(chave.anexo, resultado.itens);
  const momento = ex.agora();

  if (ativo && ativo.conteudoSha256 === montado.conteudoSha256) {
    // Retificação recém-registrada com o mesmo conteúdo: o /rreo pode ainda
    // servir a versão anterior (defasagem e CDN). Dentro da janela, o status
    // não é promovido, para a declaração continuar sendo recoletada.
    const recente =
      coleta.motivo === "status_mudou" &&
      coleta.dataStatus !== null &&
      momento.getTime() - coleta.dataStatus.getTime() < JANELA_CONFIRMACAO_RETIFICACAO_DIAS * DIA_MS;
    await marcarVerificado(
      db,
      ativo.id,
      momento,
      recente ? undefined : { statusRelatorio: coleta.statusRelatorio, dataStatus: coleta.dataStatus },
    );
    ex.contadores.snapshotsSemMudanca += 1;
    ex.coletasConcluidas += 1;
    return;
  }

  if (!montado.verificacoes.aprovado) {
    const rejeitadoIgual = await buscarRejeitadoIgual(db, chave, montado.conteudoSha256);
    if (rejeitadoIgual !== null) {
      await atualizarVerificacaoRejeitado(db, rejeitadoIgual, momento);
      ex.contadores.snapshotsRejeitados += 1;
      ex.erros.push({ contexto, mensagem: "Conteúdo já rejeitado antes; as verificações continuam falhando" });
      return;
    }
  }

  const gravado = await gravarSnapshot(db, {
    chave,
    conteudoSha256: montado.conteudoSha256,
    celulas: montado.celulas,
    verificacoes: montado.verificacoes,
    statusRelatorio: coleta.statusRelatorio,
    dataStatus: coleta.dataStatus,
    respostaIds,
    execucaoId: ex.execucaoId,
    agora: momento,
  });
  ex.contadores.snapshotsCriados += 1;
  if (gravado.ativado) {
    ex.contadores.snapshotsAtivados += 1;
    ex.coletasConcluidas += 1;
  } else {
    ex.contadores.snapshotsRejeitados += 1;
    const falhas = montado.verificacoes.resultados
      .filter((r) => r.situacao === "falhou")
      .map((r) => `${r.id}${r.detalhe ? ` (${r.detalhe})` : ""}`);
    ex.erros.push({ contexto, mensagem: `Verificações falharam: ${falhas.join("; ")}` });
  }
  ex.log(`${contexto}: ${gravado.ativado ? "ativado" : "rejeitado"} (${coleta.motivo})`);
}

/** Devolve true se o extrato do ente foi lido (mesmo que alguma declaração falhe). */
async function processarEnte(ex: Execucao, escopo: EscopoIngestao, codIbge: number, exercicio: number): Promise<boolean> {
  const contexto = `ente ${codIbge}, exercício ${exercicio}`;
  let extrato;
  try {
    extrato = await buscarExtrato(ex.http, codIbge, exercicio);
    await ex.salvarRespostas(extrato.respostas);
    await registrarEntregas(ex.deps.db, extrato.itens, ex.agora());
  } catch (erro) {
    ex.erros.push({ contexto: `${contexto} (extrato)`, mensagem: mensagemSegura(erro) });
    ex.log(`Falha no extrato: ${contexto}`);
    return false;
  }

  const ativos = await snapshotsAtivos(ex.deps.db, codIbge, exercicio, ANEXO_BALANCO_ORCAMENTARIO);
  const coletas = planejarColetas(extrato.itens, ativos, {
    periodos: escopo.periodos,
    forcar: escopo.forcar,
    reverificarAposDias: escopo.reverificarAposDias,
    agora: ex.agora(),
  });
  ex.coletasPlanejadas += coletas.length;
  for (const coleta of coletas) {
    try {
      await processarDeclaracao(ex, codIbge, exercicio, coleta, ativos.get(coleta.periodo));
    } catch (erro) {
      ex.erros.push({ contexto: `${contexto}, bimestre ${coleta.periodo}`, mensagem: mensagemSegura(erro) });
      ex.log(`Falha: ${contexto}, bimestre ${coleta.periodo}`);
    }
  }
  return true;
}

export async function executarIngestao(
  deps: DependenciasIngestao,
  escopo: EscopoIngestao,
  origem: "cli" | "cron" | "teste",
): Promise<ResumoIngestao> {
  const contadores: Contadores = {
    requisicoes: 0,
    snapshotsCriados: 0,
    snapshotsAtivados: 0,
    snapshotsRejeitados: 0,
    snapshotsSemMudanca: 0,
  };
  const erros: ErroIngestao[] = [];
  for (const codIbge of escopo.codIbges) {
    if (!entePorCodigo(codIbge)) throw new Error(`Ente fora do escopo: ${codIbge}`);
  }

  const lockClient = await deps.pool.connect();
  try {
    const { rows } = await lockClient.query<{ ok: boolean }>("select pg_try_advisory_lock($1) as ok", [LOCK_INGESTAO]);
    if (!rows[0]?.ok) {
      deps.log?.("Outra ingestão está em andamento; nada foi feito.");
      return { execucaoId: null, situacao: "bloqueada", contadores, erros };
    }

    await sincronizarReferencias(deps.db);
    const execucaoId = await iniciarExecucao(deps.db, origem, escopo);
    const requisicaoPorChave = new Map<string, number>();
    const chaveRequisicao = (url: string, iniciadaEm: Date) => `${iniciadaEm.getTime()} ${url}`;

    const ex: Execucao = {
      deps,
      execucaoId,
      agora: deps.agora ?? (() => new Date()),
      log: deps.log ?? (() => undefined),
      contadores,
      erros,
      coletasPlanejadas: 0,
      coletasConcluidas: 0,
      http: new ClienteHttpSiconfi({
        fetch: deps.fetch,
        esperar: deps.esperar,
        intervaloMinimoMs: deps.intervaloMinimoMs,
        aoRegistrar: async (registro: RegistroRequisicao) => {
          contadores.requisicoes += 1;
          const id = await registrarRequisicao(deps.db, execucaoId, registro);
          requisicaoPorChave.set(chaveRequisicao(registro.url, registro.iniciadaEm), id);
        },
      }),
      salvarRespostas: async (respostas) => {
        const ids: number[] = [];
        for (const r of respostas) {
          ids.push(await salvarRespostaBruta(deps.db, r, requisicaoPorChave.get(chaveRequisicao(r.url, r.iniciadaEm))));
        }
        return ids;
      },
    };

    let entesComExtrato = 0;
    try {
      for (const exercicio of escopo.exercicios) {
        for (const codIbge of escopo.codIbges) {
          if (await processarEnte(ex, escopo, codIbge, exercicio)) entesComExtrato += 1;
        }
      }
    } catch (erro) {
      erros.push({ contexto: "execução", mensagem: mensagemSegura(erro) });
      await finalizarExecucao(deps.db, execucaoId, "falhou", contadores, erros).catch(() => undefined);
      throw erro;
    }

    // Sem extrato lido, ou com coletas planejadas e nenhuma concluída, a
    // execução falhou: não pode aparecer como "última atualização concluída".
    const nadaColetado = ex.coletasPlanejadas > 0 && ex.coletasConcluidas === 0;
    const situacao =
      entesComExtrato === 0 || nadaColetado ? "falhou" : erros.length > 0 ? "concluida_com_falhas" : "concluida";
    await finalizarExecucao(deps.db, execucaoId, situacao, contadores, erros);
    return { execucaoId, situacao, contadores, erros };
  } finally {
    await lockClient.query("select pg_advisory_unlock($1)", [LOCK_INGESTAO]).catch(() => undefined);
    lockClient.release();
  }
}
