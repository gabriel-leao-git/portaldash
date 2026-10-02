CREATE TABLE "celulas_rreo" (
	"snapshot_id" bigint NOT NULL,
	"rotulo" text NOT NULL,
	"coluna" text NOT NULL,
	"cod_conta" text NOT NULL,
	"conta" text NOT NULL,
	"valor_texto" text NOT NULL,
	"valor" numeric NOT NULL,
	CONSTRAINT "celulas_rreo_pk" PRIMARY KEY("snapshot_id","rotulo","coluna","cod_conta","conta")
);
--> statement-breakpoint
CREATE TABLE "entes" (
	"cod_ibge" integer PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"uf" char(2),
	"esfera" text NOT NULL,
	CONSTRAINT "entes_esfera_chk" CHECK ("entes"."esfera" in ('uniao', 'estado', 'distrito_federal'))
);
--> statement-breakpoint
CREATE TABLE "entregas_observadas" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"cod_ibge" integer NOT NULL,
	"exercicio" smallint NOT NULL,
	"periodo" smallint NOT NULL,
	"periodicidade" text NOT NULL,
	"entregavel" text NOT NULL,
	"instituicao" text NOT NULL,
	"status_relatorio" text,
	"data_status" timestamp with time zone,
	"forma_envio" text,
	"tipo_relatorio" text,
	"primeira_observacao_em" timestamp with time zone DEFAULT now() NOT NULL,
	"ultima_observacao_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "entregas_observadas_uq" UNIQUE NULLS NOT DISTINCT("cod_ibge","exercicio","periodo","periodicidade","entregavel","instituicao","status_relatorio","data_status")
);
--> statement-breakpoint
CREATE TABLE "execucoes_ingestao" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"fonte_id" text NOT NULL,
	"origem" text NOT NULL,
	"escopo" jsonb NOT NULL,
	"situacao" text NOT NULL,
	"iniciada_em" timestamp with time zone DEFAULT now() NOT NULL,
	"finalizada_em" timestamp with time zone,
	"requisicoes" integer DEFAULT 0 NOT NULL,
	"snapshots_criados" integer DEFAULT 0 NOT NULL,
	"snapshots_ativados" integer DEFAULT 0 NOT NULL,
	"snapshots_rejeitados" integer DEFAULT 0 NOT NULL,
	"snapshots_sem_mudanca" integer DEFAULT 0 NOT NULL,
	"erros" jsonb DEFAULT '[]'::jsonb NOT NULL,
	CONSTRAINT "execucoes_situacao_chk" CHECK ("execucoes_ingestao"."situacao" in ('em_execucao', 'concluida', 'concluida_com_falhas', 'falhou'))
);
--> statement-breakpoint
CREATE TABLE "fontes" (
	"id" text PRIMARY KEY NOT NULL,
	"instituicao" text NOT NULL,
	"dataset" text NOT NULL,
	"url_documentacao" text NOT NULL,
	"url_base" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "requisicoes" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"execucao_id" bigint NOT NULL,
	"url" text NOT NULL,
	"iniciada_em" timestamp with time zone NOT NULL,
	"duracao_ms" integer NOT NULL,
	"http_status" smallint,
	"etag" text,
	"x_cache" text,
	"resposta_id" bigint,
	"erro" text
);
--> statement-breakpoint
CREATE TABLE "respostas_brutas" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"fonte_id" text NOT NULL,
	"url" text NOT NULL,
	"sha256" char(64) NOT NULL,
	"bytes" integer NOT NULL,
	"corpo" text NOT NULL,
	"primeira_coleta_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "respostas_brutas_url_sha_uq" UNIQUE("url","sha256")
);
--> statement-breakpoint
CREATE TABLE "snapshots_rreo" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"cod_ibge" integer NOT NULL,
	"exercicio" smallint NOT NULL,
	"periodo" smallint NOT NULL,
	"demonstrativo" text NOT NULL,
	"anexo" text NOT NULL,
	"conteudo_sha256" char(64) NOT NULL,
	"total_celulas" integer NOT NULL,
	"situacao" text NOT NULL,
	"verificacoes" jsonb NOT NULL,
	"status_relatorio" text,
	"data_status" timestamp with time zone,
	"resposta_ids" bigint[] NOT NULL,
	"execucao_id" bigint NOT NULL,
	"coletado_em" timestamp with time zone NOT NULL,
	"ultima_verificacao_em" timestamp with time zone NOT NULL,
	"ativado_em" timestamp with time zone,
	"substituido_em" timestamp with time zone,
	CONSTRAINT "snapshots_situacao_chk" CHECK ("snapshots_rreo"."situacao" in ('ativo', 'substituido', 'rejeitado')),
	CONSTRAINT "snapshots_periodo_chk" CHECK ("snapshots_rreo"."periodo" between 1 and 6)
);
--> statement-breakpoint
ALTER TABLE "celulas_rreo" ADD CONSTRAINT "celulas_rreo_snapshot_id_snapshots_rreo_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "public"."snapshots_rreo"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entregas_observadas" ADD CONSTRAINT "entregas_observadas_cod_ibge_entes_cod_ibge_fk" FOREIGN KEY ("cod_ibge") REFERENCES "public"."entes"("cod_ibge") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "execucoes_ingestao" ADD CONSTRAINT "execucoes_ingestao_fonte_id_fontes_id_fk" FOREIGN KEY ("fonte_id") REFERENCES "public"."fontes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requisicoes" ADD CONSTRAINT "requisicoes_execucao_id_execucoes_ingestao_id_fk" FOREIGN KEY ("execucao_id") REFERENCES "public"."execucoes_ingestao"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requisicoes" ADD CONSTRAINT "requisicoes_resposta_id_respostas_brutas_id_fk" FOREIGN KEY ("resposta_id") REFERENCES "public"."respostas_brutas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "respostas_brutas" ADD CONSTRAINT "respostas_brutas_fonte_id_fontes_id_fk" FOREIGN KEY ("fonte_id") REFERENCES "public"."fontes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "snapshots_rreo" ADD CONSTRAINT "snapshots_rreo_cod_ibge_entes_cod_ibge_fk" FOREIGN KEY ("cod_ibge") REFERENCES "public"."entes"("cod_ibge") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "snapshots_rreo" ADD CONSTRAINT "snapshots_rreo_execucao_id_execucoes_ingestao_id_fk" FOREIGN KEY ("execucao_id") REFERENCES "public"."execucoes_ingestao"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "celulas_rreo_coluna_conta_idx" ON "celulas_rreo" USING btree ("snapshot_id","coluna","cod_conta");--> statement-breakpoint
CREATE INDEX "entregas_ente_periodo_idx" ON "entregas_observadas" USING btree ("cod_ibge","exercicio","periodo");--> statement-breakpoint
CREATE INDEX "execucoes_iniciada_idx" ON "execucoes_ingestao" USING btree ("iniciada_em");--> statement-breakpoint
CREATE INDEX "requisicoes_execucao_idx" ON "requisicoes" USING btree ("execucao_id");--> statement-breakpoint
CREATE UNIQUE INDEX "snapshots_ativo_uq" ON "snapshots_rreo" USING btree ("cod_ibge","exercicio","periodo","demonstrativo","anexo") WHERE "snapshots_rreo"."situacao" = 'ativo';--> statement-breakpoint
CREATE INDEX "snapshots_declaracao_idx" ON "snapshots_rreo" USING btree ("cod_ibge","exercicio","periodo","demonstrativo","anexo");--> statement-breakpoint
CREATE INDEX "snapshots_periodo_idx" ON "snapshots_rreo" USING btree ("exercicio","periodo");