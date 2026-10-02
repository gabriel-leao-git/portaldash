# Arquitetura

Versão do software: 0.1.0 (não publicada). Metodologia: 0.1.0.

## Visão geral

```
                   ┌──────────────────────────────────────────────┐
  Siconfi (STN)    │ Processo de ingestão (scripts/ingest.ts)      │
  apidatalake ◄────┤  cliente HTTP sequencial, host fixo,          │
  .tesouro.gov.br  │  ≥ 1,5 s entre requisições, desacelera em 429 │
                   │  → valida → guarda bruto → versiona → ativa   │
                   └───────────────┬──────────────────────────────┘
                                   │ escrita (INGEST_DATABASE_URL)
                                   ▼
                            ┌─────────────┐
                            │ PostgreSQL  │
                            └──────┬──────┘
                                   │ leitura (DATABASE_URL, sessão read-only)
                                   ▼
                   ┌──────────────────────────────────────────────┐
  Navegador ──────►│ Next.js 16 (App Router)                        │
                   │  páginas server-rendered + /api/v1 (só GET)    │
                   │  proxy.ts: CSP com nonce por requisição        │
                   └──────────────────────────────────────────────┘
```

- O navegador nunca consulta a fonte oficial; as páginas não consultam a fonte
  em tempo de requisição.
- A ingestão é um processo separado do servidor web, no mesmo repositório, e
  não tem rota HTTP.
- Não há autenticação, sessão, cookies, Server Actions, CMS, fila, cache
  externo nem microserviço.

## Stack (verificada em 2026-10-01)

| Componente | Versão | Motivo |
| --- | --- | --- |
| Node.js | 24 LTS (`>=24.21.0 <25`, `.nvmrc`) | LTS ativa; versão fixa evita troca automática para 26 no Railway |
| pnpm | 11.28.2 (`packageManager`) | lockfile único; quarentena de 24 h para pacotes novos |
| Next.js | 16.3.8 | mínima sem advisories conhecidos da linha 16 |
| React | 19.2.8 | versão do template do Next 16.3.8, com correções de RSC |
| TypeScript | 6.0.3 | a 7.x não tem API JS e quebra o typescript-eslint |
| ESLint | 10.11.0 + eslint-config-next 16.3.8 | a 9 é EOL; `settings.react.version` fixo |
| Drizzle ORM / drizzle-kit | 0.45.3 / 0.31.11 | consultas parametrizadas, NUMERIC como string, migrations SQL |
| pg | 8.23.1 | driver de produção, NUMERIC e int8 como string |
| Vitest / Vite | 5.0.3 / 8.3.1 | testes; Vite com correções para Windows |
| embedded-postgres | 18.4.0-beta.17 | PostgreSQL real nos testes e no dev, sem Docker |

Fontes e advisories: [docs/security/findings.md](security/findings.md).

### Camada de acesso ao banco: Drizzle + pg

Escolhido por: consultas parametrizadas por padrão, `numeric()` devolvendo
string (verificado), migrations em SQL versionado e revisável, transações
simples e baixo peso. Alternativas avaliadas: Prisma (mais pesado, `Decimal`
como objeto), Kysely (migrations em TS, sem SQL gerado), driver puro (sem
migrations). Regra: nunca passar entrada externa para `sql.identifier()` ou
`.as()`; ordenação dinâmica só por allowlist.

## Organização

```
src/
  app/                 páginas e rotas /api/v1 (Next.js)
  components/          layout, dashboard, charts, states, ui
  lib/                 decimal exato, entes (allowlist IBGE), filtros, formatação
  proxy.ts             CSP com nonce
  server/
    api/               respostas e erros padronizados da API
    config/            variáveis de ambiente (só servidor)
    db/                schema Drizzle e pools
    integrations/siconfi/  cliente HTTP, parser, consultas
    ingestion/         planejamento, snapshot, gravação, orquestração
    methodology/       definição do indicador e verificações
    repositories/      leitura (só snapshots ativos)
    services/          montagem dos painéis, perguntas críticas, fontes
scripts/               ingest.ts, migrate.ts, dev-db.ts (rodam com node)
database/migrations/   SQL gerado pelo drizzle-kit
tests/                 ingestion, methodology, api, lib (+ fixtures reais)
```

Código usado pelos scripts (`src/server`, `src/lib`) importa com caminho
relativo e extensão `.ts` e usa só sintaxe apagável de TypeScript: o Node 24
executa esses arquivos diretamente, sem etapa de build.

## Modelo de dados

| Tabela | Conteúdo |
| --- | --- |
| `fontes`, `entes` | referência, sincronizada pela ingestão a partir do código (allowlist) |
| `execucoes_ingestao` | uma linha por execução: escopo, situação, contadores, erros |
| `requisicoes` | toda requisição à fonte: URL, status, duração, ETag, X-Cache, erro |
| `respostas_brutas` | corpo exato de cada resposta distinta (único por URL + sha256) |
| `entregas_observadas` | histórico do extrato de entregas (status HO/RE e data) |
| `snapshots_rreo` | versões de cada declaração (ente × exercício × bimestre × demonstrativo × anexo) |
| `celulas_rreo` | células de cada versão: texto exato + `NUMERIC` |

Regras de integridade:

- Chave natural das células: `(snapshot, rótulo, coluna, cod_conta, conta)`.
- Só uma versão `ativo` por declaração (índice único parcial). A troca de
  versão é feita numa transação: a anterior vira `substituido`.
- Uma versão nova só é ativada se passar nas verificações da metodologia; caso
  contrário fica `rejeitado` e a anterior continua ativa.
- Conteúdo idêntico ao ativo (mesmo hash canônico) não cria versão nova.
- Falha na fonte não altera dados.

## Ingestão

1. Lock consultivo (`pg_try_advisory_lock`) impede execuções simultâneas.
2. Para cada ente e exercício: extrato de entregas → planejamento (coleta só o
   que é novo, mudou de status ou não é conferido há 7 dias) → RREO Anexo 1 →
   snapshot → verificações → ativação.
3. Falhas ficam isoladas por declaração e registradas na execução.

Execução completa medida em 2026-10-02 (28 entes, 2025 e 2026): 407
requisições, 270 versões ativadas, 0 rejeitadas, 81 respostas 429 da CDN com o
intervalo de 1,1 s (2 falhas finais). Com 1,5 s e desaceleração adaptativa a
execução seguinte teve 2 respostas 429 em 60 e nenhuma falha.

Regras adicionais:

- Mudança de status no extrato (ex.: HO → RE) com conteúdo igual ao ativo não
  promove o status por 10 dias contados da data do status; a declaração é
  recoletada a cada execução nesse período, porque o `/rreo` pode demorar a
  refletir a retificação.
- Conteúdo já rejeitado só é ignorado se continuar falhando nas verificações
  atuais; se passar (por exemplo, após nova versão da metodologia), é ativado.
- A execução é `falhou` (código de saída 1) se nenhum extrato for lido ou se
  havia coletas planejadas e nenhuma foi concluída; só execuções concluídas
  aparecem como "última atualização" em `/fontes`.

## API v1

Somente GET. Parâmetros por allowlist (`ano`, `bimestre` 1–6, `conceito=pago`);
parâmetro desconhecido ou repetido → 400; UF fora da allowlist → 404; banco
indisponível → 503 genérico. Valores monetários como string decimal. Contrato:
[data-contract.md](data-contract.md), Parte 2.

## Segurança HTTP

- `proxy.ts`: CSP com nonce (`script-src 'self' 'nonce-…' 'strict-dynamic'`,
  `style-src` com nonce, `frame-ancestors 'none'`, `object-src 'none'`).
- `next.config.ts`: HSTS (produção), `X-Content-Type-Options`, `Referrer-Policy`,
  `X-Frame-Options`, COOP, CORP, `Permissions-Policy`; API com
  `default-src 'none'`; sem `X-Powered-By`; otimizador de imagens desligado.
- Todas as páginas são dinâmicas (nonce por requisição e banco inacessível no
  build).

## Banco de dados em produção

Recomendado: dois papéis.

```sql
-- executar uma vez, manualmente, como administrador (não versionar senhas)
CREATE ROLE portaldash_leitura LOGIN PASSWORD '<gerar>';
GRANT CONNECT ON DATABASE <nome_do_banco> TO portaldash_leitura;
GRANT USAGE ON SCHEMA public TO portaldash_leitura;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO portaldash_leitura;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO portaldash_leitura;
```

O serviço web usa esse papel em `DATABASE_URL`; ingestão e migrations usam o
usuário administrador em `INGEST_DATABASE_URL`, que só existe no serviço de
ingestão. Mesmo sem o papel separado, o
pool do site abre sessões com `default_transaction_read_only=on` e
`statement_timeout=5000`.

## Deploy no Railway

Projeto "portal dash" (ambiente `production`), configurado em 2026-10-02 pela
CLI e pela API do Railway. Nenhum deploy é disparado por este repositório além
do deploy automático que o próprio Railway faz a cada push no `main`.

O formato `railway.json` (Config as Code) foi descontinuado pelo Railway:
desde 2026-10 a API recusa definir arquivo de configuração por serviço, e os
arquivos existentes só valem até 2026-12-01. Como os dois serviços usam o mesmo
repositório e o arquivo da raiz se aplicaria a ambos, as configurações ficam
nas próprias instâncias de serviço (painel/API), registradas abaixo. A
migração para Infrastructure as Code (`.railway/railway.ts`) fica pendente até
o formato documentar cron e política de reinício.

| Serviço | Origem | Configuração | Variáveis |
| --- | --- | --- | --- |
| `Postgres` | imagem `ghcr.io/railwayapp-templates/postgres-ssl:18` (major fixo) | volume `postgres-volume` | geradas pelo Railway |
| `portaldash` (web) | GitHub `gabriel-leao-git/portaldash`, `main` | builder Railpack; build `pnpm build`; start `pnpm start`; healthcheck `/api/v1/health` (120 s); reinício `ON_FAILURE` (5) | `DATABASE_URL` (papel somente leitura) |
| `ingestao` | GitHub `gabriel-leao-git/portaldash`, `main` | builder Railpack; build `node --version` (não precisa do build do Next); pre-deploy `pnpm db:migrate`; start `pnpm ingest --origem=cron`; cron `0 9 * * *` (06:00 em Brasília); reinício `NEVER` | `INGEST_DATABASE_URL=${{Postgres.DATABASE_URL}}` |

Regras:

- Só o serviço `ingestao` recebe `INGEST_DATABASE_URL` (escrita e DDL). As
  migrations rodam no pre-deploy dele; o web nunca roda migrations
  (`pnpm db:migrate` exige `INGEST_DATABASE_URL`).
- O web usa o papel `portaldash_leitura` (seção anterior), nunca a credencial
  de administrador. Além disso, o pool do site abre sessões somente leitura.
- Mudanças de schema devem ser compatíveis com a versão anterior do site
  (expandir antes de contrair): web e ingestão fazem deploy de forma
  independente.
- Para recriar o ambiente: criar o PostgreSQL com a imagem acima; criar
  `ingestao` vazio, definir variável e configuração, e só então conectar o
  repositório (o primeiro deploy aplica as migrations); rodar a ingestão uma
  vez; criar o papel de leitura; configurar o web e gerar o domínio.

A rede privada do Railway só existe em tempo de execução; por isso nenhuma
página consulta o banco durante o build.
