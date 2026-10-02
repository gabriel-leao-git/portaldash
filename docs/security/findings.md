# Registro de achados de segurança

Formato do prompt mestre (seção 9). Severidade considera explorabilidade,
exposição e impacto no PortalDash, não só a pontuação publicada. Um registro
sem achados abertos não prova ausência de vulnerabilidades.

Ferramentas executadas em 2026-10-02 (máquina de desenvolvimento, Windows, e
CI no GitHub Actions):

| Verificação | Ferramenta | Resultado |
| --- | --- | --- |
| SCA | `pnpm audit` (pnpm 11.28.2), local e na CI (`--audit-level=high`) | 1 achado moderado (PD-SEC-004); nenhum alto ou crítico. Na CI, o run [36960791336](https://github.com/gabriel-leao-git/portaldash/actions/runs/36960791336) (commit `0223974`) registrou o mesmo "1 moderate" e o job passou |
| Segredos (local) | gitleaks 8.30.1 (`dir`, checksum do binário conferido) sobre os arquivos a versionar | nenhum achado |
| Segredos (CI) | gitleaks 8.30.1, binário oficial com o SHA-256 conferido contra o arquivo de checksums publicado; `gitleaks git` sobre todo o histórico | "no leaks found" nos runs [36960089801](https://github.com/gabriel-leao-git/portaldash/actions/runs/36960089801) (6 commits) e 36960791336 (7 commits) |
| SAST | ESLint 10 com regras de React, hooks, a11y e TypeScript; `tsc --noEmit` | sem erros (local; na CI, `pnpm lint` e `pnpm typecheck` passaram no run 36960791336) |
| DAST | não executado (só verificação manual de cabeçalhos e rotas com `curl` no build local) | **NÃO EXECUTADO** |
| Testes | Vitest 5.0.3 (`pnpm test`, PostgreSQL embutido localmente; PostgreSQL 18 descartável na CI), depois do commit `0223974` | 72 testes em 11 arquivos passaram, inclusive o novo `tests/db/papel-leitura.test.ts`; na CI, "Tests 72 passed (72)" no run 36960791336 |

Na CI (`.github/workflows/ci.yml`), em push no `main` e em pull request:
`pnpm audit --audit-level=high` no job `qualidade` e, no job `segredos`, o
binário oficial do gitleaks 8.30.1 (SHA-256 conferido) varrendo todo o
histórico com `gitleaks git`. A action `gitleaks/gitleaks-action` foi retirada
no commit `ec726c5`: no primeiro push do repositório ela montou o intervalo
`<primeiro commit>^..`, que o git recusa, e a varredura nem rodou (run com
falha: [36959948352](https://github.com/gabriel-leao-git/portaldash/actions/runs/36959948352);
run verde depois da troca: [36960089801](https://github.com/gabriel-leao-git/portaldash/actions/runs/36960089801)).

## Resumo

| ID | Achado | Severidade | Status |
| --- | --- | --- | --- |
| PD-SEC-001 | Advisories do Next.js na linha 16 | Crítica a baixa (upstream) | Mitigado (16.3.8) |
| PD-SEC-002 | Node local atrás de releases de segurança | Média (dev) | Aberto — ação do usuário |
| PD-SEC-003 | Plugins do eslint-config-next sem suporte declarado ao ESLint 10 | Baixa | Mitigado em parte |
| PD-SEC-004 | esbuild 0.18.20 transitivo do drizzle-kit (GHSA-67mh-4wv8-2f99) | Baixa | Aceito como não aplicável, monitorado |
| PD-SEC-005 | Drizzle GHSA-gpj5-g38j-94v9 | Alta (upstream) | Mitigado (0.45.3 + regra de uso) |
| PD-SEC-006 | Quarentena de 24 h do pnpm contra patch urgente | Média (processo) | Aberto — política proposta |
| PD-SEC-007 | CSP com `base-uri 'self'` | Baixa | Corrigido |
| PD-SEC-008 | Cache público da API com `stale-while-revalidate` | Baixa | Corrigido |
| PD-SEC-009 | `.gitignore` ignorava `.env.example` | Baixa | Corrigido |
| PD-SEC-010 | Ritmo da ingestão abaixo do limite real da CDN (HTTP 429) | Baixa (disponibilidade da coleta) | Corrigido |
| PD-SEC-011 | CVEs da stack no catálogo KEV | Crítica (upstream) | Não aplicável às versões fixadas |
| PD-SEC-012 | Migrations no pre-deploy do web exigiam a credencial de DDL no serviço público | Média | Corrigido — conferido no primeiro deploy (web com papel somente leitura) |
| PD-SEC-013 | Cron do Railway podia herdar a configuração do site e rodar `next start` | Média (operação) | Corrigido (arquivos de configuração removidos; configuração por serviço conferida no primeiro deploy) — risco residual coberto por regra (RR-12) |
| PD-SEC-014 | Falha total da coleta saía com código 0 e contava como atualização concluída | Baixa (proveniência e alerta) | Corrigido |
| PD-SEC-015 | Caminho 503 (banco indisponível) sem testes | Baixa (garantia de teste) | Corrigido |
| PD-SEC-016 | Teste do lock da ingestão passava sem `pg_advisory_unlock` | Baixa (garantia de teste) | Corrigido |

## Detalhes

### PD-SEC-001 — Next.js

- **Componente:** `next`.
- **Evidência:** `package.json` e `pnpm-lock.yaml` com `next@16.3.8`.
- **Referência oficial:** [Next.js security advisories](https://github.com/vercel/next.js/security/advisories),
  post "September 2026 security release" (nextjs.org/blog). Lotes listados em
  `docs/evidencias/2026-10-01-etapa1/versions.json`, entre eles
  GHSA-cjq9-62q9-8jv4 (SSRF no otimizador de imagens), GHSA-vcvr-r3jv-pc5j
  (RCE em `next/og`), GHSA-2xp9-vwfh-vxw4 (RCE com AVIF), GHSA-p293-qw3h-jr36
  (RCE em servidores Windows) e os bypasses de middleware/proxy de 2026.
- **Versões afetadas:** anteriores a 16.3.8 na linha 16 (varia por advisory).
- **Aplicabilidade:** o portal é self-hosted (Railway), o que torna aplicáveis
  os advisories de cache em hospedagem própria.
- **Correção/mitigação:** versão fixa 16.3.8; otimizador de imagens desligado
  (`images.unoptimized`), sem `remotePatterns`, sem `next/og`, sem Server
  Actions, sem catch-all na raiz, sem `cacheComponents`/Draft Mode; o proxy só
  define cabeçalhos.
- **Teste de regressão:** `pnpm audit` na CI; revisão do feed de advisories a
  cada atualização.
- **Status:** mitigado.

### PD-SEC-002 — Node.js local

- **Componente:** runtime de desenvolvimento.
- **Evidência:** `node -v` → `v24.13.1`; `engines.node` exige `>=24.21.0 <25`.
- **Referência oficial:** releases de segurança 24.14.1, 24.17.0 e 24.18.1
  (`https://nodejs.org/dist/index.json`, campo `security`).
- **Aplicabilidade:** só a máquina local; Railway e CI usam a versão fixada.
- **Correção:** atualizar o Node local para 24.21.0 ou superior na linha 24.
- **Status:** aberto (ação do usuário).

### PD-SEC-003 — ESLint 10 e plugins

- **Componente:** `eslint@10.11.0`, `eslint-config-next@16.3.8`
  (`eslint-plugin-react@7.37.5`, `eslint-plugin-import@2.32.0`,
  `eslint-plugin-jsx-a11y@6.10.2`, que declaram peer do ESLint 9).
- **Evidência:** `pnpm peers check`; sem `settings.react.version` a regra
  `react/display-name` falhava com `contextOrFilename.getFilename is not a function`.
- **Aplicabilidade:** risco de qualidade (regra que deixa de rodar), não de
  exposição.
- **Mitigação:** `settings.react.version` fixo; verificado que o lint analisa os
  30 arquivos e bloqueia `any` e `parseFloat` com um arquivo de prova.
- **Status:** mitigado em parte; reavaliar quando os plugins declararem suporte.

### PD-SEC-004 — esbuild transitivo do drizzle-kit

- **Componente:** `drizzle-kit@0.31.11` → `@esbuild-kit/esm-loader@2.6.5` →
  `@esbuild-kit/core-utils@3.3.2` → `esbuild@0.18.20`.
- **Evidência:** `pnpm audit` em 2026-10-02.
- **Referência oficial:** [GHSA-67mh-4wv8-2f99](https://github.com/advisories/GHSA-67mh-4wv8-2f99)
  (moderate; afeta `<=0.24.2`; corrigido em 0.25.0).
- **Aplicabilidade:** a falha está no servidor de desenvolvimento do esbuild
  (`serve`). O drizzle-kit só usa o esbuild para carregar o arquivo de
  configuração ao gerar migrations, sem servidor. É dependência de
  desenvolvimento e não entra no processo web nem na ingestão. Inferência
  baseada no uso; não auditamos o código do drizzle-kit.
- **Correção:** não forçar override (risco de quebra); acompanhar a migração do
  drizzle-kit para a linha 1.x.
- **Status:** aceito como não aplicável, monitorado pela CI (que só falha em
  alto ou crítico).

### PD-SEC-005 — Drizzle ORM

- **Componente:** `drizzle-orm`.
- **Referência oficial:** GHSA-gpj5-g38j-94v9 / CVE-2026-39356 (High), escape
  incorreto de identificadores em `sql.identifier()` e `.as()`; corrigido em
  0.45.2.
- **Evidência:** versão fixa 0.45.3; nenhum `sql.identifier`, `.as()` com
  entrada externa ou `sql.raw` em `src/`.
- **Regra:** entrada externa nunca chega a identificadores; ordenação dinâmica
  só por allowlist.
- **Status:** mitigado.

### PD-SEC-006 — Quarentena do pnpm e patches urgentes

- **Componente:** processo de dependências (pnpm 11, `minimumReleaseAge` de
  1440 minutos).
- **Evidência:** na instalação, o pnpm incluiu sozinho exceções para
  `vite@8.3.2` e `@types/node@24.19.1` (publicados há menos de 24 h); as
  exceções foram removidas e as versões trocadas por `vite@8.3.1` e
  `@types/node@24.19.0`.
- **Política proposta:** exceção à quarentena só para patch de segurança
  urgente, registrada neste arquivo com motivo e data.
- **Status:** aberto (política aguarda confirmação de Gabriel); exceções
  ativas: nenhuma.

### PD-SEC-007 — CSP `base-uri`

- **Componente:** `src/proxy.ts`.
- **Referência:** OWASP ASVS 5.0.0, capítulo de segurança de navegador (CSP).
- **Correção:** `base-uri 'none'`.
- **Teste:** verificação dos cabeçalhos com `curl` no build local.
- **Status:** corrigido.

### PD-SEC-008 — Cache da API

- **Componente:** `src/server/api/respostas.ts`.
- **Risco:** dados velhos por até 15 minutos com `stale-while-revalidate=600`;
  mistura de recortes só se um intermediário ignorar a query string.
- **Correção:** `Cache-Control: public, max-age=300`; erros e `/health` com
  `no-store`. Não há CDN configurada hoje; se houver, a query string precisa
  fazer parte da chave de cache.
- **Status:** corrigido.

### PD-SEC-009 — `.env.example` ignorado

- **Componente:** `.gitignore`.
- **Correção:** `!.env.example`; o arquivo só tem placeholders.
- **Status:** corrigido.

### PD-SEC-010 — Limite de taxa da fonte

- **Componente:** `src/server/integrations/siconfi/`.
- **Evidência:** `docs/evidencias/2026-10-02-ingestao-completa/requisicoes.csv`:
  81 de 407 respostas HTTP 429 com intervalo de 1,1 s (seção 17 de
  `docs/validacao-fonte-siconfi-2026-10.md`).
- **Risco:** coleta incompleta e possível bloqueio pela fonte (disponibilidade
  dos dados, não exposição).
- **Correção:** intervalo base de 1,5 s, desaceleração adaptativa e espera em
  429; execução seguinte com 2 respostas 429 em 60 e nenhuma falha.
- **Teste:** `tests/ingestion/http.test.ts` (429 com e sem `Retry-After`).
- **Status:** corrigido.

### PD-SEC-011 — CVEs no catálogo KEV

- **Referência oficial:** CISA KEV — CVE-2025-55182 (React Server Components) e
  CVE-2025-31125 (Vite).
- **Aplicabilidade:** não aplicável às versões fixadas (Vite 8.3.1 e o React
  que o Next 16.3.8 embute, ambos fora das faixas afetadas). Inferência a
  partir das faixas publicadas. Correção desta atualização: o React embutido
  não é o 19.2.8 do `package.json`; `dist/compiled/react` e
  `dist/compiled/react-dom` do Next 16.3.8 instalado trazem
  `19.3.0-canary-cbb046ab-20260731` (conferido em 2026-10-02, depois das
  03:16Z), e o lockfile não tem nenhum `react-server-dom-*`.
- **Status:** não aplicável.

### PD-SEC-012 — Migrations no pre-deploy do serviço web

- **Componente:** configuração dos serviços `portaldash` (web) e `ingestao` no
  Railway, registrada em `docs/architecture.md`, "Deploy no Railway";
  `scripts/migrate.ts`, `src/server/config/env.ts`,
  `src/server/db/papel-leitura.ts`.
- **Evidência:** revisão adversarial de código (2026-10-02). O `railway.json`
  da raiz, que na época configurava o serviço web (o arquivo foi removido
  depois, no commit `0223974`; ver PD-SEC-013), rodava `pnpm db:migrate` no
  pre-deploy, e as migrations usavam `INGEST_DATABASE_URL` com fallback para
  `DATABASE_URL` (registrado na versão 0.1 de `controls.md`, C-11, revisão das
  02:30Z).
  Para o pre-deploy aplicar DDL, o serviço web precisava ter uma credencial
  com DDL entre as suas variáveis, ao alcance do processo público
  (`next start`).
- **Referência:** OWASP ASVS 5.0.0, 13.2.2 (menor privilégio entre
  componentes, nível 2); CWE-250.
- **Versões afetadas:** código anterior a esta correção, nunca commitado nem
  publicado: o primeiro commit (`e1e672e`) já trazia o web sem pre-deploy.
- **Aplicabilidade:** exposição só em caso de falha no web (injeção ou RCE):
  com a credencial de DDL, o atacante poderia alterar dados e schema (ativos
  A1 e A2 de `threat-model.md`).
- **Correção:** as migrations só rodam no pre-deploy do serviço `ingestao`
  (`pnpm db:migrate`); o serviço web não tem pre-deploy. Desde o commit
  `0223974`, essa configuração fica na própria instância de cada serviço no
  Railway, sem arquivo no repositório (a primeira versão da correção usava
  `railway.json` sem pre-deploy e `railway.ingest.json` com ele; os dois
  foram removidos, PD-SEC-013). `urlBancoMigracao()` exige
  `INGEST_DATABASE_URL`, sem fallback, e essa variável
  (`${{Postgres.DATABASE_URL}}`) existe só no serviço `ingestao`. O web
  recebe `DATABASE_URL` montada por referência com o papel somente leitura
  `portaldash_leitura`: a senha vem de `${{ingestao.LEITURA_DB_PASSWORD}}` e
  host, porta e banco de `${{Postgres.*}}`. O papel é provisionado por
  `pnpm db:migrate` quando `LEITURA_DB_PASSWORD` existe
  (`src/server/db/papel-leitura.ts`): `CREATE ROLE` ou `ALTER ROLE` com a
  senha passada como parâmetro e montada com `format` (`%L`), `GRANT CONNECT`,
  `USAGE` no schema `public`, `SELECT` em todas as tabelas e
  `ALTER DEFAULT PRIVILEGES` para as futuras; idempotente; recusa senha fora
  de 32 a 128 caracteres alfanuméricos. Em produção, `LEITURA_DB_PASSWORD` foi
  gerada aleatoriamente (64 caracteres hexadecimais) e nunca exibida nem
  versionada.
- **Teste de regressão:** `tests/db/papel-leitura.test.ts`: o papel lê, não
  insere, não cria tabela, pode ser provisionado de novo (idempotente) e senha
  fraca é recusada; passa entre os 72 testes de 2026-10-02, também na CI (run
  36960791336). Conferido em 2026-10-02: `node scripts/migrate.ts` só com
  `DATABASE_URL` termina com código 1 e a mensagem cita só o nome da variável.
  No primeiro deploy (2026-10-02, projeto "portal dash", ambiente
  `production`), os logs do serviço `ingestao` registraram
  "[migrate] migrations aplicadas" e
  "[migrate] papel portaldash_leitura provisionado". A ausência de pre-deploy
  no web é configuração do serviço, sem teste no repositório; a referência é
  a tabela de `docs/architecture.md`.
- **Risco residual:** a configuração e as variáveis de cada serviço ficam fora
  do repositório; uma troca no painel (pre-deploy no web, `INGEST_DATABASE_URL`
  ou a credencial do administrador na `DATABASE_URL` do web) não aparece em
  diff (RR-04 em `threat-model.md`). A ingestão (`urlBancoEscrita()`) ainda cai
  para `DATABASE_URL` se `INGEST_DATABASE_URL` faltar, o que serve ao
  desenvolvimento local.
- **Status:** corrigido; conferido no primeiro deploy.

### PD-SEC-013 — Cron do Railway herdando a configuração do web

- **Componente:** configuração dos serviços `portaldash` (web) e `ingestao` no
  Railway, registrada em `docs/architecture.md`, "Deploy no Railway". Antes do
  commit `0223974`: `railway.json` e `railway.ingest.json`, hoje removidos.
- **Evidência:** revisão adversarial de código (2026-10-02): o `railway.json`
  da raiz era a configuração padrão de todo serviço ligado ao repositório, e
  o serviço `ingestao`, sem o caminho apontado para `/railway.ingest.json`,
  herdaria esse arquivo e subiria `next start` no lugar de
  `pnpm ingest --origem=cron`. Na configuração do deploy (2026-10-02), essa
  mitigação deixou de ser possível: o Railway descontinuou o Config as Code, e
  a API recusa definir arquivo de configuração por serviço ("Config as Code
  (railway.json / railway.toml) is deprecated"). Com os dois serviços no mesmo
  repositório, o arquivo da raiz se aplicaria a ambos, e o cron herdaria o
  start do site (commit `0223974`; `docs/architecture.md`, "Deploy no
  Railway").
- **Referência:** comportamento do cron do Railway registrado em
  `docs/evidencias/2026-10-01-etapa1/versions.json` (seção railway): uma nova
  execução é pulada se a anterior seguir rodando. Sem CWE correspondente.
- **Aplicabilidade:** `next start` não termina, então nenhuma execução
  seguinte do cron roda; as migrations do pre-deploy da ingestão também não
  rodam. Os dados envelhecem sem erro explícito; `/fontes` mostra a data da
  última atualização concluída, que deixa de avançar.
- **Correção:** `railway.json` e `railway.ingest.json` removidos do
  repositório (commit `0223974`). Cada serviço tem a sua configuração na
  própria instância do Railway (painel/API), registrada na tabela de
  `docs/architecture.md`: `portaldash` (web) com Railpack, build `pnpm build`,
  start `pnpm start`, healthcheck `/api/v1/health` (120 s), reinício
  `ON_FAILURE` (5) e sem pre-deploy; `ingestao` com build `node --version`,
  pre-deploy `pnpm db:migrate`, start `pnpm ingest --origem=cron`, cron
  `0 9 * * *` e reinício `NEVER`. Sem arquivo na raiz, não há configuração a
  herdar.
- **Teste de regressão:** não automatizável no repositório. Conferido no
  primeiro deploy (2026-10-02, projeto "portal dash", ambiente `production`):
  o pre-deploy do serviço `ingestao` registrou
  "[migrate] migrations aplicadas" e
  "[migrate] papel portaldash_leitura provisionado", e a ingestão rodou até o
  fim, com 340 requisições, 280 declarações ativadas, 0 rejeitadas, situação
  `concluida` e sem erros; ou seja, o serviço rodou a ingestão, e não
  `next start`. A consulta a `/api/v1/fontes` no domínio público
  (`portaldash-production.up.railway.app`) não foi registrada.
- **Risco residual:** se alguém voltar a pôr um `railway.json` (ou
  `railway.toml`) na raiz, ele se aplicaria aos dois serviços, e o cron
  herdaria o start do site. Regra: não versionar `railway.json` nem
  `railway.toml` enquanto os dois serviços compartilharem o repositório. A
  configuração fica fora do repositório, sem revisão por diff; a referência é
  a tabela de `docs/architecture.md`. A migração para Infrastructure as Code
  (`.railway/railway.ts`) fica pendente até o formato documentar cron e
  política de reinício (RR-12 em `threat-model.md`).
- **Status:** corrigido; configuração por serviço conferida no primeiro
  deploy; risco residual coberto pela regra acima.

### PD-SEC-014 — Falha total da coleta registrada como concluída

- **Componente:** `src/server/ingestion/executar.ts`, `scripts/ingest.ts`.
- **Evidência:** revisão adversarial de código (2026-10-02): quando nenhuma
  coleta dava certo, a execução saía com código 0 e aparecia como atualização
  concluída.
- **Referência:** OWASP ASVS 5.0.0, 16.3.4 (registrar erros inesperados e
  falhas de controles, nível 2); CWE-754.
- **Aplicabilidade:** os valores publicados e o `coletadoEm` de cada
  declaração continuam corretos, mas a "última atualização concluída" de
  `/fontes` ficaria mais recente que a última coleta real, e o cron não
  sinalizaria falha ao operador.
- **Correção:** a execução fica `falhou` se nenhum extrato foi lido ou se
  havia coletas planejadas e nenhuma foi concluída (ativada ou sem mudança);
  `scripts/ingest.ts` define `process.exitCode = 1` nesse caso; a "última
  atualização concluída" só considera execuções `concluida` e
  `concluida_com_falhas` (`ultimaExecucao` em
  `src/server/repositories/rreo.ts`).
- **Teste de regressão:** `tests/ingestion/ingestao.test.ts`, "extrato
  indisponível deixa a execução como falha" e "falha da fonte não apaga a
  última versão válida" (situação `falhou` com o ativo preservado).
- **Risco residual:** uma execução em que só parte das coletas dá certo
  continua `concluida_com_falhas`, conta como última atualização e sai com
  código 0; os erros ficam registrados na execução.
- **Status:** corrigido.

### PD-SEC-015 — Caminho de banco indisponível sem testes

- **Componente:** `tests/api/`; `src/server/api/respostas.ts`,
  `src/app/api/v1/health/route.ts`.
- **Evidência:** revisão adversarial de código (2026-10-02): nenhum teste
  exercitava a falha de banco, embora `AGENTS.md` exija testar "válido,
  inválido e indisponível" em toda rota.
- **Referência:** OWASP ASVS 5.0.0, 16.5.1 (mensagem genérica em erro, nível
  2); CWE-209.
- **Aplicabilidade:** sem teste, uma regressão poderia vazar host, porta ou
  usuário do banco numa resposta pública sem ser percebida.
- **Correção:** `tests/api/indisponivel.test.ts` aponta `DATABASE_URL` para
  uma porta local livre, sem nada escutando, e confere nas 5 rotas: HTTP 503,
  `cache-control: no-store`, `erro.codigo = "indisponivel"` e ausência de
  host, porta, usuário, senha, `postgres` e `ECONNREFUSED` no corpo. Também
  confere que parâmetro inválido continua 400 sem tocar no banco.
- **Lacunas:** não há teste automatizado das páginas em erro
  (`src/app/error.tsx`) nem da redação dos logs.
- **Status:** corrigido.

### PD-SEC-016 — Teste do lock da ingestão sem poder de detecção

- **Componente:** `tests/ingestion/ingestao.test.ts`;
  `src/server/ingestion/executar.ts` (`pg_try_advisory_lock` e
  `pg_advisory_unlock` no `finally`).
- **Evidência:** revisão adversarial de código (2026-10-02): o teste de
  liberação do lock continuava passando com o `pg_advisory_unlock` removido.
- **Referência:** controle C-21 e ameaça AM-18 (`controls.md`,
  `threat-model.md`); CWE-362.
- **Aplicabilidade:** risco de garantia, não de exposição. Sem um teste que
  detecte lock retido, uma regressão poderia fazer execuções seguintes
  terminarem como `bloqueada` num processo que reaproveite a sessão.
  **Inferência:** no CLI, `pool.end()` encerra as sessões e o PostgreSQL
  libera locks consultivos de sessão, o que limita o efeito prático.
- **Correção:** `lockLivre()` abre uma conexão própria (`pg.Client`, sessão
  distinta do pool da ingestão) e tenta `pg_try_advisory_lock`; o teste
  confere a liberação depois de uma execução normal e depois de uma exceção
  que escapa do laço (log que lança), e que essa execução fica registrada
  como `falhou`. O teste de execução concorrente segura o lock por outra
  conexão e espera `bloqueada`.
- **Teste de regressão:** o próprio teste; passou às 2026-10-02T03:16Z e
  continua entre os 72 aprovados depois do commit `0223974`, também na CI (run
  36960791336).
- **Status:** corrigido.
