import { sql } from "drizzle-orm";
import {
  bigint,
  bigserial,
  char,
  check,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  unique,
  uniqueIndex,
} from "drizzle-orm/pg-core";

const timestamptz = (name: string) => timestamp(name, { withTimezone: true, mode: "date" });

export const fontes = pgTable("fontes", {
  id: text("id").primaryKey(),
  instituicao: text("instituicao").notNull(),
  dataset: text("dataset").notNull(),
  urlDocumentacao: text("url_documentacao").notNull(),
  urlBase: text("url_base").notNull(),
});

export const entes = pgTable(
  "entes",
  {
    codIbge: integer("cod_ibge").primaryKey(),
    nome: text("nome").notNull(),
    uf: char("uf", { length: 2 }),
    esfera: text("esfera").notNull(),
  },
  (t) => [check("entes_esfera_chk", sql`${t.esfera} in ('uniao', 'estado', 'distrito_federal')`)],
);

export const execucoesIngestao = pgTable(
  "execucoes_ingestao",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    fonteId: text("fonte_id").notNull().references(() => fontes.id),
    origem: text("origem").notNull(),
    escopo: jsonb("escopo").notNull(),
    situacao: text("situacao").notNull(),
    iniciadaEm: timestamptz("iniciada_em").notNull().defaultNow(),
    finalizadaEm: timestamptz("finalizada_em"),
    requisicoes: integer("requisicoes").notNull().default(0),
    snapshotsCriados: integer("snapshots_criados").notNull().default(0),
    snapshotsAtivados: integer("snapshots_ativados").notNull().default(0),
    snapshotsRejeitados: integer("snapshots_rejeitados").notNull().default(0),
    snapshotsSemMudanca: integer("snapshots_sem_mudanca").notNull().default(0),
    erros: jsonb("erros").notNull().default(sql`'[]'::jsonb`),
  },
  (t) => [
    check(
      "execucoes_situacao_chk",
      sql`${t.situacao} in ('em_execucao', 'concluida', 'concluida_com_falhas', 'falhou')`,
    ),
    index("execucoes_iniciada_idx").on(t.iniciadaEm),
  ],
);

/** Corpo exato de cada resposta distinta da fonte (deduplicado por URL + hash). */
export const respostasBrutas = pgTable(
  "respostas_brutas",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    fonteId: text("fonte_id").notNull().references(() => fontes.id),
    url: text("url").notNull(),
    sha256: char("sha256", { length: 64 }).notNull(),
    bytes: integer("bytes").notNull(),
    corpo: text("corpo").notNull(),
    primeiraColetaEm: timestamptz("primeira_coleta_em").notNull().defaultNow(),
  },
  (t) => [unique("respostas_brutas_url_sha_uq").on(t.url, t.sha256)],
);

/** Toda requisição feita à fonte, com ou sem sucesso. */
export const requisicoes = pgTable(
  "requisicoes",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    execucaoId: bigint("execucao_id", { mode: "number" })
      .notNull()
      .references(() => execucoesIngestao.id),
    url: text("url").notNull(),
    iniciadaEm: timestamptz("iniciada_em").notNull(),
    duracaoMs: integer("duracao_ms").notNull(),
    httpStatus: smallint("http_status"),
    etag: text("etag"),
    xCache: text("x_cache"),
    respostaId: bigint("resposta_id", { mode: "number" }).references(() => respostasBrutas.id),
    erro: text("erro"),
  },
  (t) => [index("requisicoes_execucao_idx").on(t.execucaoId)],
);

/**
 * Histórico do extrato de entregas: uma linha por combinação distinta de
 * status e data observada. O extrato da fonte só mostra o último status.
 */
export const entregasObservadas = pgTable(
  "entregas_observadas",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    codIbge: integer("cod_ibge")
      .notNull()
      .references(() => entes.codIbge),
    exercicio: smallint("exercicio").notNull(),
    periodo: smallint("periodo").notNull(),
    periodicidade: text("periodicidade").notNull(),
    entregavel: text("entregavel").notNull(),
    instituicao: text("instituicao").notNull(),
    statusRelatorio: text("status_relatorio"),
    dataStatus: timestamptz("data_status"),
    formaEnvio: text("forma_envio"),
    tipoRelatorio: text("tipo_relatorio"),
    primeiraObservacaoEm: timestamptz("primeira_observacao_em").notNull().defaultNow(),
    ultimaObservacaoEm: timestamptz("ultima_observacao_em").notNull().defaultNow(),
  },
  (t) => [
    unique("entregas_observadas_uq")
      .on(
        t.codIbge,
        t.exercicio,
        t.periodo,
        t.periodicidade,
        t.entregavel,
        t.instituicao,
        t.statusRelatorio,
        t.dataStatus,
      )
      .nullsNotDistinct(),
    index("entregas_ente_periodo_idx").on(t.codIbge, t.exercicio, t.periodo),
  ],
);

/**
 * Uma versão do conteúdo de uma declaração (ente × exercício × bimestre ×
 * demonstrativo × anexo). Só uma versão "ativa" por declaração; a troca é
 * transacional e versões anteriores ficam como "substituido".
 */
export const snapshotsRreo = pgTable(
  "snapshots_rreo",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    codIbge: integer("cod_ibge")
      .notNull()
      .references(() => entes.codIbge),
    exercicio: smallint("exercicio").notNull(),
    periodo: smallint("periodo").notNull(),
    demonstrativo: text("demonstrativo").notNull(),
    anexo: text("anexo").notNull(),
    conteudoSha256: char("conteudo_sha256", { length: 64 }).notNull(),
    totalCelulas: integer("total_celulas").notNull(),
    situacao: text("situacao").notNull(),
    verificacoes: jsonb("verificacoes").notNull(),
    statusRelatorio: text("status_relatorio"),
    dataStatus: timestamptz("data_status"),
    respostaIds: bigint("resposta_ids", { mode: "number" }).array().notNull(),
    execucaoId: bigint("execucao_id", { mode: "number" })
      .notNull()
      .references(() => execucoesIngestao.id),
    coletadoEm: timestamptz("coletado_em").notNull(),
    ultimaVerificacaoEm: timestamptz("ultima_verificacao_em").notNull(),
    ativadoEm: timestamptz("ativado_em"),
    substituidoEm: timestamptz("substituido_em"),
  },
  (t) => [
    check("snapshots_situacao_chk", sql`${t.situacao} in ('ativo', 'substituido', 'rejeitado')`),
    check("snapshots_periodo_chk", sql`${t.periodo} between 1 and 6`),
    uniqueIndex("snapshots_ativo_uq")
      .on(t.codIbge, t.exercicio, t.periodo, t.demonstrativo, t.anexo)
      .where(sql`${t.situacao} = 'ativo'`),
    index("snapshots_declaracao_idx").on(t.codIbge, t.exercicio, t.periodo, t.demonstrativo, t.anexo),
    index("snapshots_periodo_idx").on(t.exercicio, t.periodo),
  ],
);

export const celulasRreo = pgTable(
  "celulas_rreo",
  {
    snapshotId: bigint("snapshot_id", { mode: "number" })
      .notNull()
      .references(() => snapshotsRreo.id, { onDelete: "cascade" }),
    rotulo: text("rotulo").notNull(),
    coluna: text("coluna").notNull(),
    codConta: text("cod_conta").notNull(),
    conta: text("conta").notNull(),
    valorTexto: text("valor_texto").notNull(),
    valor: numeric("valor").notNull(),
  },
  (t) => [
    primaryKey({
      name: "celulas_rreo_pk",
      columns: [t.snapshotId, t.rotulo, t.coluna, t.codConta, t.conta],
    }),
    index("celulas_rreo_coluna_conta_idx").on(t.snapshotId, t.coluna, t.codConta),
  ],
);
