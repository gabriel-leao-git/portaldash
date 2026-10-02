# Registro de achados de segurança

Formato do prompt mestre (seção 9). Severidade considera explorabilidade,
exposição e impacto no PortalDash, não só a pontuação publicada. Um registro
sem achados abertos não prova ausência de vulnerabilidades.

Ferramentas executadas em 2026-10-02 (máquina de desenvolvimento, Windows):

| Verificação | Ferramenta | Resultado |
| --- | --- | --- |
| SCA | `pnpm audit` (pnpm 11.28.2) | 1 achado moderado (PD-SEC-004); nenhum alto ou crítico |
| Segredos | gitleaks 8.30.1 (`dir`, checksum do binário conferido) sobre os arquivos a versionar | nenhum achado |
| SAST | ESLint 10 com regras de React, hooks, a11y e TypeScript; `tsc --noEmit` | sem erros |
| DAST | não executado (só verificação manual de cabeçalhos e rotas com `curl` no build local) | **NÃO EXECUTADO** |

Na CI (`.github/workflows/ci.yml`): `pnpm audit --audit-level=high` e
gitleaks-action em todo push e pull request.

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
- **Aplicabilidade:** não aplicável às versões fixadas (React 19.2.8 embutido no
  Next 16.3.8; Vite 8.3.1, fora das faixas afetadas). Inferência a partir das
  faixas publicadas.
- **Status:** não aplicável.
