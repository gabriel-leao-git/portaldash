# Modelo de ameaças — PortalDash

| Campo | Valor |
| --- | --- |
| Versão do documento | 0.1 (rascunho inicial) |
| Data | 2026-10-01 (horário de Brasília). Verificações desta tarefa: 2026-10-02T02:05Z a 02:18Z (UTC) |
| Revisão adversarial | 2026-10-02T02:30Z a 02:45Z (UTC). Estado do código, citações das evidências, IDs de CWE/GHSA/CVE e KEV reconferidos. Correções incorporadas abaixo |
| Etapa | 2 — Fundação. Não há deploy nem CI. Há código de aplicação em construção, ainda sem commits; nenhum teste ou build foi executado na revisão (seção 2) |
| Revisão | Pendente de Gabriel |
| Documentos relacionados | [controls.md](controls.md) (controles C-xx) · [findings.md](findings.md) (achados PD-SEC-xxx; **arquivo ainda não criado** na revisão de 02:43Z; índice provisório em controls.md, seção 10) |

## 1. Como ler este documento

- **Fato**: verificado em arquivo, comando ou fonte citada, com data/hora.
- **Inferência**: conclusão tirada de fatos, ainda não verificada diretamente.
- **Hipótese**: possibilidade plausível, sem evidência.
- **Lacuna**: algo que não sabemos e que afeta a análise.
- Ameaças têm ID `AM-xx`, riscos residuais `RR-xx` e controles `C-xx` (definidos em [controls.md](controls.md)).
- **Classificação OWASP Top 10:2025.** As categorias foram conferidas em https://top10.owasp.org/2025/ (redirecionada de https://owasp.org/Top10/2025/) às 2026-10-02T02:08:27Z: A01 Broken Access Control, A02 Security Misconfiguration, A03 Software Supply Chain Failures, A04 Cryptographic Failures, A05 Injection, A06 Insecure Design, A07 Authentication Failures, A08 Software or Data Integrity Failures, A09 Security Logging and Alerting Failures, A10 Mishandling of Exceptional Conditions. A página não informa se a edição é final ou candidata. **O enquadramento de cada ameaça numa categoria é julgamento deste documento**: não li as listas de CWE mapeadas pelo OWASP em cada categoria.
- **CWE.** Só cito IDs cujo título conferi em https://cwe.mitre.org/ (CWE 4.20) às 2026-10-02T02:10:36Z. Quando não há CWE que corresponda bem, não cito nenhum. Na revisão, os títulos de CWE-1395, CWE-1339, CWE-636 e CWE-436 foram reconferidos às 2026-10-02T02:35Z; as páginas exibem "(4.20)".

## 2. Escopo e estado atual

O PortalDash é um portal público, sem cadastro, login, cookies, perfis ou comentários. Ele mostra despesas pagas declaradas no Siconfi pela União, pelos 26 estados e pelo DF, lado a lado. Não há total nacional consolidado nem soma de estados (decisão de arquitetura).

> **Correção da revisão.** A versão anterior desta seção dizia que em `src/` havia apenas `src/app/favicon.ico`, que a API e a ingestão não estavam implementadas e que o `next.config.ts` estava vazio. Às 2026-10-02T02:30Z isso não era mais verdade: os arquivos de código têm data de modificação a partir de 2026-10-01 23:06 BRT (02:06Z), ou seja, foram criados em paralelo à redação. A tabela abaixo mostra o estado conferido na revisão. **Nenhum build, teste ou servidor foi executado na revisão (NÃO EXECUTADO)**: "código presente" não significa controle verificado.

| Componente | Descrição (decisão de arquitetura) | Estado na revisão (2026-10-02T02:30Z a 02:37Z) |
| --- | --- | --- |
| Serviço web | Next.js 16.3.8 (App Router) + React 19.2.8, Node 24 LTS, no Railway | Código presente (**fato**): páginas em `src/app/**`, `src/proxy.ts` com CSP por nonce, `src/app/layout.tsx` com `await connection()` (todas as páginas dinâmicas) e `next.config.ts` com cabeçalhos |
| API própria v1 | `GET /api/v1/{brasil, estados, estados/{uf}, fontes, health}`, somente leitura | Cinco route handlers em `src/app/api/v1/**/route.ts`, todos exportando só `GET` (**fato**). Validação em `src/lib/filtros.ts`, respostas em `src/server/api/respostas.ts`. Não existe `tests/api/` |
| Ingestão | `scripts/ingest.ts`, executado com `node` via CLI e cron do Railway, nunca por HTTP | `scripts/ingest.ts`, `src/server/ingestion/*` e `src/server/integrations/siconfi/*` presentes; testes em `tests/ingestion/*` (**fato**; não executados) |
| Banco | PostgreSQL 18 no Railway (tag de major fixa); embedded-postgres 18.4.0-beta.17 nos testes | Migration `database/migrations/0000_inicial.sql`, com o índice único parcial `snapshots_ativo_uq` (**fato**). Produção não provisionada |
| Fonte | API Siconfi em `https://apidatalake.tesouro.gov.br/ords/cdwhprd/siconfi/tt/` | Investigada na Etapa 1 e reconciliada só em parte (RR-02; evidências em `scratchpad/etapa1/*.json`) |
| CI | GitHub Actions (planejada) | Não existe (`.github/` ausente). O repositório não tem commits: `git log` responde "your current branch 'main' does not have any commits yet" (**fato**, reconferido às 02:30Z) |
| Deploy | Railway: serviço web e serviço cron. O agente não publica | Não existe |

Já na configuração (**fato**, conferido nos arquivos às 02:30Z):

- versões exatas no `package.json` (exceto `"@types/pg": "^8.23.1"`), `engines.node` `>=24.21.0 <25` e `packageManager` `pnpm@11.28.2`;
- `allowBuilds` restrito em `pnpm-workspace.yaml`;
- `settings.react.version` e a proibição de `parseFloat` no `eslint.config.mjs`;
- `next.config.ts` sem `images.remotePatterns`, com `images: { unoptimized: true }`, `poweredByHeader: false` e cabeçalhos para todas as rotas (`X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Cross-Origin-Opener-Policy`, `Cross-Origin-Resource-Policy`, `Permissions-Policy`, e HSTS só quando `NODE_ENV=production`), mais CSP `default-src 'none'; frame-ancestors 'none'` em `/api/*`;
- `.gitignore` com `.env*`.

**Divergências entre o código e o plano ou as decisões** (encontradas na revisão; o código não foi alterado):

1. `src/proxy.ts` usa `base-uri 'self'`. O plano (C-14) e o ASVS 5.0.0 3.4.3 pedem `base-uri 'none'` (PD-SEC-007).
2. `src/server/api/respostas.ts` envia `Cache-Control: public, max-age=300, stale-while-revalidate=600` nas respostas 200 da API. O plano dizia "sem cache" (AM-06, PD-SEC-008).
3. `src/server/integrations/siconfi/config.ts` usa intervalo mínimo de **1,5 s** e `http.ts` também retenta **HTTP 429**. A decisão de arquitetura é intervalo mínimo de 1,1 s (1,5 s a respeita, por ser maior) e retentativa só para erro de rede, timeout e 5xx (429 fica de fora). O comentário do código justifica a mudança com "429 em ~20% das requisições a 1,1 s (execução de 2026-10-02)". Isso **não consta das evidências da Etapa 1**: docs.json registra que nenhum 429 foi observado. Não foi verificado nesta revisão (PD-SEC-010).
4. `next.config.ts` já envia HSTS com `includeSubDomains` e `Referrer-Policy: strict-origin-when-cross-origin`, embora domínio e política estejam como decisões pendentes em [controls.md](controls.md), seção 9.
5. `src/server/config/env.ts` faz a credencial de escrita cair para `DATABASE_URL` quando `INGEST_DATABASE_URL` falta. Nenhum módulo usa `import 'server-only'` (C-07).
6. Caminhos diferentes do plano, sem efeito de segurança por si: a validação de filtros está em `src/lib/filtros.ts` (o plano previa `src/server/validation/*`) e os erros da API em `src/server/api/respostas.ts` (o plano previa `src/server/http/errors.ts`).

Fora o que está marcado como "Parcial" nas ameaças, o resto deste documento é **planejado**.

## 3. Fluxos de dados e fronteiras

```text
                 F1                                        F2
[Visitante] ==HTTPS==> [Borda Railway] --> [web: Next.js 16.3.8] --rede privada--> [PostgreSQL 18]
 (anônimo)                                  páginas + GET /api/v1/*   (papel de leitura)      ^
                                                                                              | papel de escrita
                 F3                                                                           |
[Cron Railway] --> [ingestão: node scripts/ingest.ts] -----------------------------------------+
                          |
                          +==HTTPS GET, sequencial, >= 1,1 s==> [apidatalake.tesouro.gov.br]
                                                                 (Azure Front Door -> ORDS)
                 F4
[Dev / agentes de IA (Windows)] --git--> [GitHub] --> [CI planejada] --> [build Railway (Railpack)]
[registry.npmjs.org] --pnpm install pelo lockfile--> [dev, CI, build]     pre-deploy: pnpm db:migrate
```

| Fronteira | Lado confiável | Lado não confiável | O que atravessa |
| --- | --- | --- | --- |
| F1 Navegador ↔ API/web | Serviço web | Qualquer cliente HTTP | Query strings, cabeçalhos, volume de requisições; HTML/JSON de resposta |
| F2 API/web ↔ banco | Banco (dono dos dados) | Processo web, exposto a F1 | Consultas SQL, credencial de leitura |
| F3 Ingestão ↔ fonte | Processo de ingestão | Respostas da fonte, rede, CDN | JSON bruto (até cerca de 1,9 MB por página: **inferência** do docs.json), cabeçalhos, erros, redirects |
| F4 CI/deploy | Repositório revisado, lockfile | Pacotes npm, ações de CI, contas, máquina local | Código de terceiros, segredos de deploy, migrations |

## 4. Ativos

| ID | Ativo | Por que importa | Propriedade principal |
| --- | --- | --- | --- |
| A1 | Integridade dos números publicados e da proveniência: valor, recorte (ente, exercício, bimestre), as datas de referência, status e coleta, e a versão da metodologia | É o produto. Um número errado ou mal rotulado num portal crítico vira desinformação | Integridade |
| A2 | Banco PostgreSQL: respostas brutas, snapshots, células, histórico do extrato e execuções de ingestão | Base de A1 e trilha de auditoria | Integridade, disponibilidade |
| A3 | Disponibilidade do portal, da API e da ingestão, incluindo a relação com a fonte (não ser bloqueado) | Sem ingestão, o dado fica velho. Sem portal, não há publicação | Disponibilidade |
| A4 | Credenciais: `DATABASE_URL` (leitura, web), `INGEST_DATABASE_URL` (escrita e migrations) e contas/tokens do Railway, do GitHub e da CI | Quem tem a credencial de escrita adultera A1/A2 | Confidencialidade |
| A5 | Cadeia de build: código, `pnpm-lock.yaml`, dependências npm, CI, configuração do Railway | Comprometimento aqui atinge todos os ativos | Integridade |

A aplicação não guarda dados pessoais de visitantes: não há login, cookies nem formulários. **Lacuna:** os logs de acesso da plataforma podem conter IP; a retenção e o acesso a esses logs no Railway não foram verificados.

## 5. Atores

| ID | Ator | Capacidade | Observação |
| --- | --- | --- | --- |
| ATR-1 | Visitante legítimo anônimo | Navegador, links compartilhados | Não há usuário autenticado |
| ATR-2 | Atacante remoto anônimo (bots, scanners, DoS, tentativas de XSS, injeção e envenenamento de cache) | Qualquer requisição HTTP para F1 | **Hipótese:** por ser um portal crítico sobre gastos públicos, pode atrair tentativas de desfiguração ou de adulterar números. Não há evidência de ameaça concreta |
| ATR-3 | Atacante de cadeia de suprimentos (pacote npm malicioso ou comprometido, mantenedor comprometido, typosquatting) | Executa código em dev, CI e build | Atinge F4 e, por ela, todo o resto |
| ATR-4 | Fonte (STN/Siconfi) e entes declarantes | Definem o dado. Podem retificar, mudar o contrato (spec "versão beta", Swagger 1.1.0) e ficar indisponíveis | Não são adversários. Geram risco de integridade e disponibilidade |
| ATR-5 | Intermediários de rede (CDN Azure Front Door da fonte, borda do Railway) | Cache, terminação de TLS | A fonte serve respostas do cache do CDN com TTL desconhecido (docs.json) |
| ATR-6 | Pessoas e agentes de IA com acesso ao repositório e ao Railway | Commit, deploy, variáveis, migrations | Riscos principais: erro operacional (segredo commitado, migration destrutiva, deploy indevido) ou conta comprometida |
| ATR-7 | Contribuidor externo via pull request | Código não confiável na CI | **Lacuna:** a visibilidade do repositório não foi definida |

## 6. Ameaças por fronteira

Formato: cenário → classificação → mitigação planejada (com a decisão de arquitetura e o controle C-xx) → verificação → status → risco residual.

### F1 — Navegador ↔ API/web

#### AM-01 — XSS (refletido ou a partir de textos da fonte)

- **Cenário.** Parâmetros da URL são refletidos na página. Textos da fonte (`conta`, `rotulo`, `coluna`, `instituicao`) são renderizados. Uma falha do framework contorna a proteção.
- **Classificação.** A05:2025 Injection · CWE-79.
- **Mitigação planejada.**
  - O React escapa o JSX. `dangerouslySetInnerHTML`, `innerHTML` e `eval` ficam proibidos por lint (C-13).
  - Textos da fonte são tratados sempre como texto puro. HTML externo nunca é renderizado.
  - Parâmetros são validados por allowlist antes de qualquer uso (C-08).
  - CSP com nonce gerado em `src/proxy.ts`, conforme a convenção do Next 16 (C-14). O guia embutido no Next 16.3.8 (`dist/docs/01-app/02-guides/content-security-policy.md`) diz que o nonce exige renderização dinâmica, o que é compatível com o fato de o build do Railway não alcançar o banco (versions.json, seção railway).
- **Verificação.** Teste de renderização com texto contendo `<script>` vindo de fixture da fonte. Teste de cabeçalho: CSP presente, nonce diferente a cada requisição, sem `'unsafe-inline'`/`'unsafe-eval'` em produção.
- **Status.** Parcial. `src/proxy.ts` gera nonce por requisição e monta a CSP com `'strict-dynamic'`, `object-src 'none'` e `frame-ancestors 'none'`, sem `'unsafe-eval'` nem `'unsafe-inline'` fora de desenvolvimento (**fato**, arquivo lido). Diverge do plano em `base-uri 'self'` (PD-SEC-007). Nenhum `dangerouslySetInnerHTML` em `src/` (busca às 02:30Z). As regras de lint do C-13 e os testes não existem.
- **Residual.** XSS por falha do próprio framework. Exemplo histórico: GHSA-ffhc-5mcf-pf4q / CVE-2026-44581, "XSS com nonces de CSP", corrigido no lote de 2026-05-11 (versions.json). Depende de manter o Next atualizado (C-31).

#### AM-02 — Injeção SQL via parâmetros da API

- **Cenário.** `ano`, `bimestre`, `uf` ou `conceito`, ou uma ordenação dinâmica, chegam ao SQL.
- **Classificação.** A05:2025 Injection · CWE-89.
- **Mitigação planejada.**
  - Allowlist e tipo estrito (`bimestre` 1 a 6, `conceito` só `'pago'`, UF por allowlist). Parâmetros desconhecidos ou duplicados devolvem 400 (C-08).
  - Consultas parametrizadas do Drizzle (C-09). Entrada externa nunca chega a `sql.identifier()`, `.as()` ou `sql.raw`. O motivo é o GHSA-gpj5-g38j-94v9 (ver PD-SEC-005).
  - O web usa um papel somente leitura (C-10).
- **Verificação.** Testes de API com cargas de injeção. Regra de lint para os usos proibidos. Teste de integração mostrando que o pool do web não escreve.
- **Status.** Parcial. `src/lib/filtros.ts` valida por allowlist (`ano` com 4 dígitos entre 2015 e o ano corrente, `bimestre` 1 a 6, `conceito` só `pago`; desconhecido ou repetido gera erro); a UF passa por `estadoPorUf` e UF desconhecida devolve 404. Nenhum uso de `sql.raw`, `sql.identifier()` ou `.as()` em `src/` (busca às 02:30Z). Lint e testes de injeção não existem.
- **Residual.** Baixo, desde que a regra do Drizzle seja seguida em revisões futuras.

#### AM-03 — Abuso de consultas e negação de serviço

- **Cenário.** Volume alto de requisições ou combinações de parâmetros que forçam consultas caras. Toda página é renderizada no servidor, porque o nonce exige renderização dinâmica (guia de CSP do Next 16.3.8: "Static optimization and Incremental Static Regeneration (ISR) are disabled").
- **Classificação.** A06:2025 Insecure Design (julgamento) · CWE-400, CWE-770.
- **Mitigação planejada.**
  - O espaço de parâmetros é pequeno e fechado (C-08). As respostas têm tamanho limitado e conhecido, sem paginação aberta.
  - `statement_timeout` e pool com teto (C-10). Índices pela chave real. Indicadores calculados na leitura sobre snapshots ativos (C-24).
  - A limitação de taxa global fica na plataforma ou CDN. Não confiamos em contador local, porque ele não protege com várias instâncias (C-24).
- **Verificação.** Teste de que uma consulta acima do timeout é abortada (com `pg_sleep` em banco descartável). Teste de tamanho máximo da resposta.
- **Status.** Parcial: o pool do web tem `statement_timeout=5000` e `max: 5` (`src/server/db/pool.ts`). Testes não existem. **Lacuna:** não verifiquei quais recursos de limitação de taxa ou WAF o Railway oferece.
- **Residual.** RR-01.

#### AM-04 — Exposição de informação em erros, health e cabeçalhos

- **Cenário.** Stack trace, host do banco, string de conexão ou versão interna vazam em erro, em `/api/v1/health` ou em cabeçalhos como `x-powered-by`.
- **Classificação.** A02:2025 Security Misconfiguration e A10:2025 Mishandling of Exceptional Conditions · CWE-209, CWE-200.
- **Mitigação planejada (C-23, C-26).**
  - Health mínimo, sem credenciais, host ou configuração.
  - Erros JSON genéricos e consistentes. Logs sanitizados, sem `DATABASE_URL`.
  - `poweredByHeader: false`. O guia `poweredByHeader.md` do Next 16.3.8 diz que o cabeçalho vem ligado por padrão.
  - Source maps de produção continuam desligados, que é o padrão segundo `productionBrowserSourceMaps.md`.
- **Verificação.** Teste do corpo exato do health. Teste com o banco indisponível: resposta 503 genérica. Teste de que os logs não contêm a string de conexão.
- **Status.** Parcial. `poweredByHeader: false` está no `next.config.ts`. `src/server/api/respostas.ts` devolve erros JSON genéricos (503 "indisponivel" em falha de banco) e registra no log só o tipo e o código do erro. O health devolve `{"status":"ok"}` com `no-store`. `src/app/error.tsx` não exibe a mensagem do erro. Testes não existem.

#### AM-05 — Publicação indevida de rotas e funções internas

- **Cenário.** Uma rota para disparar a ingestão ou as migrations. Server Actions, que são endpoints públicos: GHSA-955p-x3mx-jcvp / CVE-2026-64643 mostrou endpoints internos de Server Functions descobríveis (versions.json). Rotas de debug. `next dev`, a UI do Vitest ou o Drizzle Studio expostos na rede.
- **Classificação.** A01:2025 Broken Access Control · CWE-306, CWE-749.
- **Mitigação planejada.**
  - A ingestão é um processo separado, só por CLI e cron, sem rota HTTP (C-18).
  - Nenhuma Server Action. A diretiva `'use server'` é proibida por lint e por checagem na CI.
  - Route handlers só exportam `GET`.
  - Teste de inventário de rotas compara a árvore `src/app` com a lista aprovada (C-17).
  - Servidores de desenvolvimento nunca expostos na rede (C-27).
- **Verificação.** Teste de inventário de rotas. Regra `no-restricted-imports` impedindo `src/app` de importar `src/server/ingestion`.
- **Status.** Parcial. As cinco rotas da API só exportam `GET`. Não há `'use server'` em `src/` nem importação de `src/server/ingestion` a partir de `src/app` ou `src/components` (busca às 02:30Z). O teste de inventário e a regra de lint não existem.

#### AM-06 — Cache misturando filtros

- **Cenário.** Uma resposta calculada para `ano=2025` ou `uf=sp` é servida para outro recorte, por chave de cache incompleta ou parâmetros equivalentes não normalizados (`uf=SP` e `uf=sp`). Isso afeta diretamente A1.
- **Classificação.** A06:2025 Insecure Design (julgamento). Não adoto CWE: nenhum que conferi descreve bem a falha.
- **Mitigação planejada (C-25).**
  - Sem cache de aplicação no início, com indicadores calculados na leitura. O guia embutido `01-getting-started/15-route-handlers.md` diz: "Route Handlers are not cached by default".
  - Se algum cache for introduzido, a chave inclui todos os filtros normalizados.
  - Parâmetros desconhecidos devolvem 400, o que reduz as variantes. `Cache-Control` explícito por rota.
  - A resposta ecoa os filtros aplicados e a data de coleta, para cliente e testes conferirem.
- **Verificação.** Teste com requisições alternadas e filtros diferentes, conferindo o eco e o valor esperado de cada fixture.
- **Estado do código (revisão, 02:30Z).** Não há cache de aplicação no servidor (rotas com `dynamic = "force-dynamic"`). Mas as respostas 200 da API saem com `Cache-Control: public, max-age=300, stale-while-revalidate=600`; erros e health saem com `no-store` (`src/server/api/respostas.ts`). Consequências:
  - **Inferência:** um cache HTTP compartilhado com configuração padrão usa a URL completa, com a query string, como chave; filtros diferentes não se misturariam. Nenhum CDN foi escolhido, então isso não foi verificado. Se um CDN for configurado para **ignorar a query string**, respostas `public` de recortes diferentes se misturam. A configuração do CDN precisa ser conferida antes de ativá-lo.
  - Defasagem: depois de uma ingestão ou de uma correção, uma resposta antiga pode ser servida por até 300 s, e por mais 600 s durante a revalidação.
  - Sem `ano` e `bimestre`, a API resolve o período mais recente com dado validado (`resolverPeriodo` em `src/server/services/despesas.ts`). A mesma URL muda de recorte depois de uma ingestão. A resposta ecoa os `filtros` resolvidos e `proveniencia.coletadoEm`, o que mantém o recorte e a defasagem explícitos.
- **Status.** Parcial. A política de cache HTTP da API é decisão pendente (PD-SEC-008).

#### AM-07 — Envenenamento de cache do Next em self-hosting

- **Cenário.** O Railway é self-hosting do ponto de vista do Next (versions.json, riscos). Segundo versions.json, os advisories GHSA-4jqv-mc3x-m676 e GHSA-mcj8-r9mp-w47p (SSG/ISR) e GHSA-h694-7cp9-m8p3 e GHSA-3w37-wq28-93x7 (`'use cache'` e Draft Mode) afetam esse tipo de hospedagem e não afetam a Vercel. Também são de cache, mas versions.json **não** diz se dependem do tipo de hospedagem: GHSA-wfc6-r584-vfw7 (cache poisoning de RSC) e GHSA-68g3-v927-f742 e GHSA-4633-3j49-mh5q ("Cache confusion of response bodies for requests with bodies", título conferido na API do repositório do Next às 2026-10-02T02:36Z).
- **Classificação.** A03:2025 Software Supply Chain Failures, por ser componente vulnerável (julgamento), e A02:2025 · CWE-1395. O mantenedor classificou o GHSA-wfc6-r584-vfw7 como CWE-436 (consulta via `gh api` às 2026-10-02T02:10:48Z; reconferido às 02:36Z, com CVE-2026-44576).
- **Mitigação planejada.**
  - Next 16.3.8, versão mínima corrigida (PD-SEC-001).
  - Não usar Pages Router, ISR, catch-all na raiz, `cacheComponents`/`'use cache'` nem Draft Mode (C-26).
  - Páginas dinâmicas recebem `Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate` (guia `self-hosting.md` do Next 16.3.8).
  - API só com `GET`.
- **Verificação.** Checagem de versão mínima na CI. Teste do `Cache-Control` das páginas.
- **Status.** Mitigado na versão, com regras de uso planejadas.
- **Residual.** RR-03.

#### AM-08 — Vulnerabilidades do framework exploráveis remotamente (RCE, SSRF, bypass do Proxy)

- **Cenário.** Os advisories que versions.json lista até 2026-09-30, entre eles:
  - RCE em `next/og` (GHSA-vcvr-r3jv-pc5j);
  - RCE na Image Optimization com AVIF (GHSA-2xp9-vwfh-vxw4);
  - SSRF na Image Optimization com `remotePatterns` (GHSA-cjq9-62q9-8jv4);
  - bypass de Middleware/Proxy (GHSA-267c-6grr-h53f, GHSA-26hh-7cqf-hhc6, GHSA-492v-c6pp-mqqv, GHSA-6gpp-xcg3-4w24).
- **Exploração conhecida (KEV).** No feed KEV `catalogVersion` 2026.10.01, baixado às 2026-10-02T02:36Z, consta o CVE-2025-55182 (RCE em React Server Components, GHSA-fv66-9v8q-g76r), adicionado em 2025-12-05. As faixas afetadas na GitHub Advisory Database são de `react-server-dom-webpack`/`-turbopack`/`-parcel` 19.0.0, 19.1.0 a 19.1.1 e 19.2.0. O projeto não instala esses pacotes (0 ocorrências no lockfile) e o Next 16.3.8 embute React `19.3.0-canary-cbb046ab-20260731` (`dist/compiled/react`). **Inferência:** a versão embutida fica fora das faixas listadas. Ver PD-SEC-011.
- **Classificação.** A03:2025 (julgamento) · CWE-1395. As fraquezas de fundo variam por advisory; por exemplo, SSRF é CWE-918.
- **Mitigação planejada.**
  - Versão 16.3.8. Sem `images.remotePatterns` e com `images.unoptimized: true` (opção documentada no guia `image.md`), ambos já no `next.config.ts` (conferido às 02:30Z; C-26).
  - Sem `next/og`, sem Server Actions, sem custom server, sem rewrites para hosts externos.
  - O `proxy.ts` serve só para gerar o nonce e os cabeçalhos; não é barreira de autorização. Um bypass enfraqueceria a CSP daquela resposta, mas não abriria dados ou funções.
- **Verificação.** SCA na CI (C-04). Teste de configuração do `next.config.ts`.
- **Status.** Mitigado na versão.
- **Residual.** RR-03.

#### AM-09 — Clickjacking e rebaixamento de transporte

- **Cenário.** O portal é embutido em página maliciosa, ou acessado por HTTP sem TLS.
- **Classificação.** A02:2025 (CWE-1021) e A04:2025 Cryptographic Failures (CWE-319).
- **Mitigação planejada.** `frame-ancestors 'none'` na CSP. HSTS em produção. `X-Content-Type-Options`, `Referrer-Policy` e `Permissions-Policy` (C-14, C-15).
- **Verificação.** Teste de cabeçalhos contra o servidor de produção local (`next start`).
- **Status.** Parcial. Os cabeçalhos estão no `next.config.ts` (HSTS `max-age=31536000; includeSubDomains` só em produção, mais `X-Frame-Options: DENY`) e `frame-ancestors 'none'` está na CSP de `src/proxy.ts`. Testes não existem.
- **Lacunas.** A configuração de TLS da borda do Railway e o domínio ainda não foram definidos nem verificados. O `includeSubDomains` já está no código antes de o domínio ser definido.

### F2 — API/web ↔ banco

#### AM-10 — Escrita indevida pela credencial do serviço web

- **Cenário.** Uma injeção ou RCE no web consegue escrever no banco porque o web usa uma credencial com privilégio de escrita. Isso altera A1 diretamente.
- **Classificação.** A02:2025 · CWE-250.
- **Mitigação planejada.**
  - Credenciais separadas: `DATABASE_URL` (leitura) no web e `INGEST_DATABASE_URL` na ingestão e nas migrations (C-11).
  - Papel somente leitura em produção, criado por passo manual documentado. Ele não fica em migration, para não versionar senha (C-10).
  - Pool do web com `default_transaction_read_only=on` e `statement_timeout`.
- **Importante.** `default_transaction_read_only` é uma **proteção contra erro, não uma barreira de privilégio**. A documentação do PostgreSQL 18 (https://www.postgresql.org/docs/18/runtime-config-client.html, lida às 2026-10-02T02:17:53Z) diz que o parâmetro "controls the default read-only status of each new transaction" e remete a SET TRANSACTION. **Inferência:** uma sessão pode pedir READ WRITE explicitamente. A barreira real é o papel sem privilégio de escrita.
- **Verificação.** Teste de integração em embedded-postgres: INSERT pelo pool do web falha. Conferência manual dos GRANTs em produção, registrada.
- **Status.** Parcial. `src/server/db/pool.ts` abre o pool do web com `default_transaction_read_only=on`, `statement_timeout=5000` e `max: 5`, e o web lê só `DATABASE_URL` (`src/server/config/env.ts`). O papel somente leitura e o teste de INSERT não existem.
- **Residual.** RR-04.

#### AM-11 — Exposição de campos internos pela API

- **Cenário.** A API devolve sha256, IDs de snapshot ou de requisição, ETag, X-Cache ou colunas do banco que não fazem parte do contrato.
- **Classificação.** A01:2025 (julgamento) · CWE-200.
- **Mitigação planejada.** Contrato de saída com DTO explícito. Valores monetários serializados como string decimal (C-12). A URL **pública** da consulta à fonte pode e deve aparecer como proveniência: a API do Siconfi não exige credencial (docs.json: "sem autenticação, sem chave").
- **Verificação.** Teste de contrato com allowlist exata de chaves por rota.
- **Status.** Parcial. `src/server/services/despesas.ts` monta um DTO explícito: ente, situação, `valor` como string, e `proveniencia` com `fonte`, `consulta` (URL pública montada por `montarUrl`), status, `dataStatusSiconfi`, `coletadoEm` e `verificadoEm`. Não expõe sha256, IDs internos nem ETag (arquivo lido às 02:30Z). O teste de contrato não existe.

#### AM-12 — Esgotamento de conexões e consultas lentas

- **Cenário.** Requisições simultâneas esgotam o pool ou prendem o banco, afetando também a ingestão.
- **Classificação.** A06:2025 (julgamento) · CWE-400.
- **Mitigação planejada.** Uma única instância de Pool por processo (versions.json, `camada_banco.recomendacao`), com teto de conexões. `statement_timeout`. Consultas indexadas (C-10, C-24).
- **Verificação.** Teste de timeout. Revisão dos planos de consulta (EXPLAIN) das rotas, em banco descartável.
- **Status.** Parcial: instância única por processo (`dbLeitura()` guarda o pool em `globalThis`), `max: 5`, `connectionTimeoutMillis: 5000` e `statement_timeout=5000` em `src/server/db/pool.ts`. Testes e revisão de EXPLAIN não existem.

#### AM-13 — Transporte entre web e banco

- **Cenário.** O tráfego web↔banco é interceptado dentro da plataforma.
- **Classificação.** A04:2025 · CWE-319.
- **Mitigação planejada.**
  - Usar a `DATABASE_URL` privada por referência. Segundo versions.json, ela usa `<service>.railway.internal`.
  - Nunca usar `DATABASE_PUBLIC_URL` em runtime. O mesmo versions.json diz que ela expõe um TCP Proxy e gera custo de egress (C-29).
- **Status.** Planejado.
- **Lacuna.** Não verifiquei se a rede privada do Railway cifra o tráfego, nem se a imagem `postgres-ssl` exige TLS na conexão privada. Ver RR-05.

### F3 — Ingestão ↔ fonte (e ingestão ↔ banco)

#### AM-14 — SSRF ou requisição a destino não pretendido

- **Cenário.** O cliente HTTP segue os `links` do envelope ORDS. Esses links apontam para o host interno `host-5hrds-scan.prosubnet.vcndados.oraclevcn.com` (docs.json, seção paginação). O cliente também poderia seguir um redirect, ou montar URL a partir de dados.
- **Classificação.** A01:2025 (julgamento) · CWE-918.
- **Mitigação planejada (C-19).**
  - Host fixo em allowlist (`apidatalake.tesouro.gov.br`) e base fixa `/ords/cdwhprd/siconfi/tt/`. O caminho legado `/ords/siconfi/tt/`, também ativo segundo critic.json, fica fora da allowlist.
  - Só `https`. Redirect é tratado como erro.
  - Parâmetros só a partir de enums internos. O offset é calculado localmente, sem seguir links do payload.
  - Como a ingestão não está exposta por HTTP, o visitante não influencia nenhuma URL.
- **Verificação.** Testes do cliente contra servidor falso local: redirect 3xx, host fora da allowlist e link interno no payload. **Nunca testar contra o portal governamental.**
- **Status.** Parcial. `src/server/integrations/siconfi/http.ts` recusa URL fora de `https:`, do host, da porta padrão e da base, ou com usuário/senha; usa `redirect: "error"`; e só monta URL por `montarUrl`, com endpoints em allowlist (`rreo`, `extrato_entregas`, `entes`) e nomes de parâmetro `^[a-z_]+$` (arquivos lidos às 02:30Z). Testes em `tests/ingestion/http.test.ts`, não executados nesta revisão.

#### AM-15 — Contaminação dos dados da fonte (payload inválido ou inesperado)

**Cenários observados na Etapa 1:**

| Cenário | Evidência |
| --- | --- |
| a) Corpo HTML em vez de JSON | A coleta da União recebeu HTTP 502 com página HTML "Service unavailable" em `https://apidatalake.tesouro.gov.br/ords/cdwhprd/siconfi/tt/anexos-relatorios` às 2026-10-02T01:19:22Z (uniao-investigacao.json). Em outro site, que **não** é fonte da ingestão (o portal da SEFAZ-RJ, `https://portal.fazenda.rj.gov.br/contabilidade/relatorios-fiscais/`, usado na tentativa de reconciliação), a resposta foi **HTTP 200** com página de bloqueio por IP às 2026-10-02T01:25:31Z (rj-investigacao.json). Lição aplicável à ingestão: o status HTTP sozinho não valida a coleta |
| b) Contrato divergente do spec | Campos `exercicio`/`cnpj` em vez de `an_exercicio`/`co_cnpj`; `esfera` presente no `/rreo` sem constar no spec (docs.json). O spec é "versão beta" 1.1.0 |
| c) Linhas que não são pagamento na coluna de pagas | `Superavit` e `TotalDespesasComSuperavit`; por exemplo, MG 2026 b4 `'16805443364.65'` e `'101999476074.35'` (critic.json). Colunas de percentual também ocupam `valor` (docs.json) |
| d) Precisão | `valor` vem como número JSON com 0, 1 ou 2 casas decimais, por exemplo `'31840769325.8'` (docs.json). `JSON.parse` converteria em float |
| e) Chave não única fora do Anexo 01 | No Anexo 02, até 174 repetições sem `conta` (critic.json) |
| f) Resposta vazia | `items=[]` com HTTP 200 para parâmetro fora do enum (`nr_periodo=7`), às 2026-10-02T01:22:30Z (docs.json) |

**Cenário não observado na Etapa 1 (hipótese): adulteração em trânsito.** Um intermediário altera a resposta entre a fonte e a ingestão. A fonte serve TLS com certificado público (emissor GeoTrust TLS RSA CA G1, validade de 2026-06-22 a 2026-12-22) e o `http://` responde 307 para `https://` (docs.json). Mitigação: só `https` com validação padrão de certificado e redirect tratado como erro (C-19). docs.json recomenda **não** fixar certificado (pinning), porque a validade é de 6 meses. **Residual:** adulteração no CDN ou na origem da própria fonte não é detectável pelo TLS; só a reconciliação externa pode apontá-la (RR-02).

- **Classificação.** A08:2025 Software or Data Integrity Failures · CWE-20, CWE-345, CWE-1339, CWE-681.
- **Mitigação planejada (C-19, C-20, C-21, C-33).**
  - Exigir `Content-Type` JSON e validar o esquema em runtime, tolerando campos extras.
  - Limite de tamanho do corpo. `Accept-Encoding: identity`.
  - Números lidos preservando o texto exato do JSON, sem float, gravados como `valor_texto` + NUMERIC.
  - Seleção exata por coluna e `cod_conta` (`'DESPESAS PAGAS ATÉ O BIMESTRE (j)'`, `'DespesasExcetoIntraOrcamentarias'`).
  - Falha explícita se a chave natural se repetir. Tratamento de `hasMore`. Resposta vazia não vira zero.
  - Antes de ativar, conferir as identidades `ExcetoIntra = DespesasCorrentes + DespesasDeCapital` e, quando a linha intra existir, `SubtotalDasDespesas = ExcetoIntra + DespesasIntraOrcamentariasTotal`.
  - Snapshot inválido não é ativado.
  - **Decisão pendente:** a linha-manchete (`DespesasExcetoIntraOrcamentarias`, metodologia v0.1.0) é provisória e depende de confirmação de Gabriel (critic.json, `decisoes_para_gabriel`). Se mudar, as identidades verificadas antes da ativação mudam junto.
- **Verificação.** Testes de ingestão com fixtures derivadas das amostras da Etapa 1: corpo HTML, 502, campo extra, valor com 1 casa, chave duplicada, identidade violada e `items=[]`.
- **Status.** Parcial. No código (arquivos lidos às 02:30Z): `http.ts` exige `Content-Type` `application/json`, limita o corpo a 16 MiB, decodifica UTF-8 em modo estrito e calcula o sha256; `parse.ts` lê os números pelo texto-fonte do `JSON.parse` (sem float); `src/server/methodology/verificacoes.ts` confere as identidades antes da ativação e exige exatamente uma célula de `DespesasExcetoIntraOrcamentarias`, `DespesasCorrentes` e `DespesasDeCapital`. Testes em `tests/ingestion/*` e `tests/methodology/*`, não executados nesta revisão.

#### AM-16 — Mudanças não maliciosas da fonte: retificação, republicação e cache do CDN

- **Cenário.**
  - Retificações (status RE) chegam sem versão no `/rreo`.
  - Republicações oficiais não aparecem no Siconfi. Na União 2025 b6, o PDF republicado ('12_ RREODez2025 (REPUBL_).pdf', Last-Modified 2026-07-17) diverge do Siconfi em 12 células de empenhado e saldo do Anexo 01, por 7 a 8 unidades de R$ mil, e o extrato mostra o b6 como HO em 2026-01-30T22:36:41Z, sem RE (critic.json). As despesas pagas do Anexo 01, que são a base do indicador, batem dentro do arredondamento em R$ mil (critic.json; uniao-investigacao.json). Fora do indicador, o "TOTAL DAS DESPESAS PREVIDENCIÁRIAS DO FCDF (II)" pago aparece como 10.050.645 (R$ milhares) no PDF republicado, contra `4940304484.05` na API (RREO-Anexo 04.2, cod_conta `TotalDasDespesasRPPSPrevidenciarioFCDF`). **Inferência** registrada em uniao-investigacao.json: a API mantém a versão homologada em jan/2026.
  - O CDN da fonte serve cache com TTL desconhecido (docs.json).
- **Classificação.** Não é vulnerabilidade de software. É risco de integridade editorial de A1, sem CWE.
- **Mitigação planejada (C-21, C-22).**
  - Snapshots versionados por hash canônico. Histórico do extrato (HO/RE e `data_status`) gravado a cada coleta. ETag e X-Cache registrados.
  - A interface mostra as datas de referência, de status e de coleta.
  - Os avisos obrigatórios do indicador seguem critic.json, `indicador_proposto.avisos_obrigatorios`.
- **Status.** Planejado.
- **Residual.** RR-02.

#### AM-17 — Sobrecarga e bloqueio da fonte

- **Cenário.** O limite documentado é de 1 requisição por segundo (spec siconfi.yaml, segundo docs.json). Na Etapa 1, agentes rodando em paralelo somaram 98 requisições entre 01:18Z e 01:41Z, 25 delas no minuto 01:21, e houve 8 segundos com 2 requisições simultâneas. Um 502 coincidiu com acessos concorrentes (critic.json). A política de bloqueio da fonte é desconhecida.
- **Classificação.** A06:2025 (julgamento) · CWE-770 (falta de limitação do nosso lado).
- **Mitigação planejada (C-19, C-21).**
  - Limitador global com intervalo mínimo de 1,1 s, sequencial.
  - `pg_advisory_lock` impede execuções simultâneas.
  - Até 3 retentativas com backoff, só para erro de rede, timeout e 5xx. Timeouts de 60 s para dados e 180 s para metadados.
- **Verificação.** Teste do limitador com relógio simulado. Teste de que um segundo processo não adquire o lock.
- **Status.** Parcial, com divergência. O código usa `pg_try_advisory_lock` (`src/server/ingestion/executar.ts`), timeouts de 60 s e 180 s e no máximo 3 tentativas. Mas o intervalo mínimo é 1,5 s e o cliente também retenta 429, dobrando o intervalo até 6 s (`config.ts`, `http.ts`). Ver divergência 3 da seção 2 e PD-SEC-010. Os 429 citados no comentário do código não estão nas evidências da Etapa 1.

#### AM-18 — Execução concorrente e ativação parcial

- **Cenário.** O cron e uma execução manual se sobrepõem, ou a ingestão falha no meio do lote e expõe uma mistura de versões.
- **Classificação.** A08:2025 · CWE-362, CWE-636.
- **Mitigação planejada (C-21).**
  - `pg_advisory_lock`.
  - Ativação transacional do snapshot validado, com índice único parcial para o ativo.
  - Falha na fonte mantém o último ativo. Ingestão idempotente.
- **Verificação.** Testes de reimportação sem duplicação, de falha no meio do lote com o ativo preservado, e de concorrência.
- **Status.** Parcial. `pg_try_advisory_lock` em `executar.ts` (uma segunda execução termina como "bloqueada"); índice único parcial `snapshots_ativo_uq` na migration; troca do ativo dentro de `db.transaction` em `store.ts`, com snapshot reprovado gravado como `rejeitado`. Testes em `tests/ingestion/ingestao.test.ts`, não executados nesta revisão.

#### AM-19 — Esgotamento ou travamento do processo de ingestão

- **Cenário.** Corpo enorme (resposta chunked, sem Content-Length segundo docs.json), timeout longo da origem (69,26 s observados) ou processo que não encerra. Versions.json, seção railway: o Railway "will skip the new cron job" se a execução anterior seguir rodando, e o dado envelhece em silêncio.
- **Classificação.** A10:2025 · CWE-400, CWE-754.
- **Mitigação planejada (C-19, C-22).** Limite de tamanho do corpo. Timeouts. Fechamento do Pool e saída explícita do processo. Registro de cada execução (status, duração, erros). A interface mostra a data da coleta.
- **Status.** Parcial: corpo limitado a 16 MiB e no máximo 10 páginas por consulta (`config.ts`); `scripts/ingest.ts` fecha o pool no `finally` e define `process.exitCode`. Testes não executados nesta revisão.

### F4 — CI/deploy e cadeia de suprimentos

#### AM-20 — Dependência comprometida ou maliciosa

- **Cenário.** Uma versão recém-publicada com código malicioso. Um script de instalação malicioso. Typosquatting.
- **Classificação.** A03:2025 · CWE-506, CWE-494, CWE-829.
- **Mitigação planejada.**
  - Lockfile com hashes de integridade e versões exatas (C-01).
  - Quarentena de 24 h do pnpm 11 (`minimumReleaseAge` 1440 por padrão, segundo versions.json), com exceção só para patch de segurança urgente e registrada (C-02, PD-SEC-006).
  - `allowBuilds` restrito (C-03). `pnpm install --frozen-lockfile` na CI. SCA (C-04).
- **Status.** Parcial. Implementados: versões exatas, `allowBuilds` e a quarentena padrão. Planejados: CI e SCA.
- **Residual.** RR-06.

#### AM-21 — Componentes vulneráveis ou desatualizados

- **Cenário.** O Next recebeu 3 releases de segurança em cerca de 5 semanas (versions.json). O Node local está desatualizado (PD-SEC-002). O drizzle-kit traz `@esbuild-kit` deprecated e esbuild 0.18.20 (PD-SEC-004).
- **Classificação.** A03:2025 · CWE-1395, CWE-1104.
- **Mitigação planejada.** Registro de achados (C-32). Política de remediação com prazos (C-31). Monitoramento de advisories. SCA na CI (C-04).
- **Status.** Em andamento. `findings.md` ainda não existe; o índice provisório dos achados está em [controls.md](controls.md), seção 10. SCA planejado.
- **Residual.** RR-03.

#### AM-22 — Exposição de segredos

- **Cenário.** `.env` commitado. Credencial em variável `NEXT_PUBLIC_*`: o guia `environment-variables.md` do Next 16.3.8 diz que essas variáveis "will be inlined into the JavaScript bundle during `next build`". Credencial em logs de CI, em payloads ou em documentação.
- **Classificação.** A02:2025 (julgamento) · CWE-798, CWE-532, CWE-200.
- **Mitigação planejada.**
  - `.gitignore` com `.env*`, já implementado. Atenção: o mesmo padrão ignora `.env.example` (PD-SEC-009).
  - `.env.example` só com placeholders (C-06).
  - Segredos só no servidor, com módulo de banco marcado com `import 'server-only'` (C-07).
  - Secret scanning (C-05). CI de PR sem segredos de produção (C-28).
- **Status.** Parcial. Implementado: `.gitignore` com `.env*`. No código: a leitura das URLs de banco está centralizada em `src/server/config/env.ts`, sem prefixo `NEXT_PUBLIC_`, e as mensagens de erro citam só o nome da variável. Faltam `import 'server-only'`, `.env.example`, a correção do PD-SEC-009 e o secret scanning.

#### AM-23 — Deploy indevido e CI com permissões excessivas

- **Cenário.** Um token de CI com escrita, uma ação de terceiros comprometida ou um auto-deploy disparado por push sem revisão.
- **Classificação.** A08:2025 (julgamento) · CWE-284.
- **Mitigação planejada (C-28, C-29).**
  - `GITHUB_TOKEN` com permissões mínimas. Ações fixadas por SHA. Sem segredos de produção em CI de contribuições não confiáveis.
  - O agente não faz deploy.
  - Proteção de branch só quando houver acesso e autorização; documentação não equivale a proteção ativa.
- **Status.** Planejado.
- **Lacuna.** Ainda não está definido se o Railway fará auto-deploy a partir do GitHub.

#### AM-24 — Migration destrutiva em produção

- **Cenário.** O pre-deploy executa `pnpm db:migrate` com a credencial de escrita. Segundo versions.json, o pre-deploy roda num container separado, não tem nova tentativa e, se falhar, o deploy não segue.
- **Classificação.** Risco operacional de integridade (A2), sem CWE.
- **Mitigação planejada (C-30).** Migrations SQL geradas, revisadas e testadas em banco descartável. Mudança destrutiva só com autorização específica e backup.
- **Status.** Planejado.

#### AM-25 — Máquina de desenvolvimento (Windows) como vetor

- **Cenário.** Advisories que atingem o ambiente local: RCE em servidores Next em Windows (GHSA-p293-qw3h-jr36), endpoint MCP do `next dev` (GHSA-39w2-rjm5-chcv), Vite no Windows (GHSA-fx2h-pf6j-xcff, GHSA-v6wh-96g9-6wx3) e Vitest UI (GHSA-5xrq-8626-4rwp). Além disso, o Node local está desatualizado.
- **Classificação.** A03:2025 · CWE-1395.
- **Mitigação planejada (C-27).** Versões corrigidas já fixadas. Servidores locais só em localhost. Vitest UI não usada. Atualizar o Node local (pendente do usuário, PD-SEC-002).
- **Status.** Parcial.

## 7. Matriz resumida

| Ameaça | Fronteira | Top 10:2025 (julgamento) | CWE | Controles | Status |
| --- | --- | --- | --- | --- | --- |
| AM-01 XSS | F1 | A05 | 79 | C-08, C-13, C-14 | Parcial (CSP no código; PD-SEC-007) |
| AM-02 Injeção SQL | F1/F2 | A05 | 89 | C-08, C-09, C-10 | Parcial (código; sem testes) |
| AM-03 Abuso de consultas / DoS | F1 | A06 | 400, 770 | C-08, C-10, C-24 | Parcial; lacuna na borda |
| AM-04 Informação em erros/health | F1 | A02, A10 | 209, 200 | C-23, C-26 | Parcial (código; sem testes) |
| AM-05 Rotas internas publicadas | F1 | A01 | 306, 749 | C-17, C-18, C-27 | Parcial (código; sem testes) |
| AM-06 Cache misturando filtros | F1 | A06 | — | C-08, C-25 | Parcial; cache HTTP público (PD-SEC-008) |
| AM-07 Cache poisoning do Next | F1 | A03, A02 | 1395 | C-26, C-31 | Mitigado (versão) |
| AM-08 Falhas do framework | F1 | A03 | 1395 | C-04, C-26, C-31 | Mitigado (versão) |
| AM-09 Clickjacking / transporte | F1 | A02, A04 | 1021, 319 | C-14, C-15 | Parcial (código; sem testes) |
| AM-10 Escrita pela credencial do web | F2 | A02 | 250 | C-10, C-11 | Parcial (pool; papel não criado) |
| AM-11 Campos internos expostos | F2 | A01 | 200 | C-12 | Parcial (DTO; sem teste) |
| AM-12 Esgotamento do banco | F2 | A06 | 400 | C-10, C-24 | Parcial (código; sem testes) |
| AM-13 Transporte web↔banco | F2 | A04 | 319 | C-29 | Lacuna |
| AM-14 SSRF | F3 | A01 | 918 | C-18, C-19 | Parcial (código; testes não executados) |
| AM-15 Contaminação do payload | F3 | A08 | 20, 345, 1339, 681 | C-19, C-20, C-21, C-33 | Parcial (código; testes não executados) |
| AM-16 Retificação/republicação/CDN | F3 | — | — | C-21, C-22 | Planejado |
| AM-17 Sobrecarga/bloqueio da fonte | F3 | A06 | 770 | C-19, C-21 | Parcial; diverge da decisão (PD-SEC-010) |
| AM-18 Concorrência/ativação parcial | F3 | A08 | 362, 636 | C-21 | Parcial (código; testes não executados) |
| AM-19 Ingestão travada/esgotada | F3 | A10 | 400, 754 | C-19, C-22 | Parcial (código; testes não executados) |
| AM-20 Dependência maliciosa | F4 | A03 | 506, 494, 829 | C-01, C-02, C-03, C-04 | Parcial |
| AM-21 Componentes vulneráveis | F4 | A03 | 1395, 1104 | C-04, C-31, C-32 | Em andamento |
| AM-22 Exposição de segredos | F4 | A02 | 798, 532, 200 | C-05, C-06, C-07, C-28 | Parcial |
| AM-23 Deploy/CI indevidos | F4 | A08 | 284 | C-28, C-29 | Planejado |
| AM-24 Migration destrutiva | F4 | — | — | C-30 | Planejado |
| AM-25 Máquina de desenvolvimento | F4 | A03 | 1395 | C-27 | Parcial |

## 8. Riscos residuais

A coluna "Quem decide" segue o prompt mestre: exceções a itens bloqueantes exigem decisão explícita de Gabriel, com justificativa, responsável e prazo. O agente não aceita risco sozinho.

| ID | Risco residual | Por que permanece | Quem decide |
| --- | --- | --- | --- |
| RR-01 | DoS volumétrico contra o portal e a API | A limitação de taxa global depende da plataforma ou de um CDN, ainda não escolhidos nem verificados. Páginas dinâmicas (por causa do nonce) custam CPU a cada requisição | Gabriel (plataforma/CDN) |
| RR-02 | Erro, retificação ou republicação na fonte autoritativa, internamente consistente | Não é detectável tecnicamente. A reconciliação externa cobre só a União (2025 b6 e 2026 b4, com precisão de R$ mil) e o RJ 2023 b6, só nas linhas de total (critic.json) | Gabriel (política editorial e de versões, listada em `decisoes_para_gabriel` no critic.json) |
| RR-03 | Novo advisory do Next ou do React antes do patch, somado à quarentena de 24 h do pnpm | Cadência alta (3 releases de segurança em cerca de 5 semanas). A 16.3.8 saiu em 2026-09-30 às 16:07 UTC (versions.json), e a quarentena atrasaria a instalação sem exceção | Gabriel (aprova a política de exceção do C-02) |
| RR-04 | O web pode rodar com credencial privilegiada até o papel somente leitura existir | A criação do papel é manual. `default_transaction_read_only` não é barreira | Gabriel (executa o passo manual em produção) |
| RR-05 | Tráfego interno web↔banco e ingestão↔banco | Não verifiquei se a rede privada do Railway ou a conexão ao Postgres usam TLS | A verificar antes do deploy |
| RR-06 | Scripts de instalação de `@embedded-postgres/windows-x64` e `@embedded-postgres/linux-x64` executam em dev e CI | Necessários para os testes (`allowBuilds: true` em `pnpm-workspace.yaml`) | Gabriel. Proposta: aceitar como necessário para os testes e revisar a cada atualização. O agente não aceita risco sozinho |
| RR-07 | Dependência da plataforma: TLS de borda, logs, retenção e contas do Railway e do GitHub | Fora do código | Gabriel |
| RR-08 | Plugins de lint sem suporte declarado ao ESLint 10 podem falhar ou silenciar regras | PD-SEC-003 | Monitorar |
| RR-09 | Nenhum SCA, secret scanning, SAST ou DAST foi executado | Ferramentas entram nas próximas etapas. Um relatório sem achados também não provaria ausência de vulnerabilidade | Próximas etapas |
| RR-10 | Leitura errada de números corretos (acumulado tratado como valor do bimestre, ou soma de União com estados) | Integridade de apresentação, não técnica | Gabriel (textos e avisos obrigatórios) |
| RR-11 | Resposta antiga da API servida por cache HTTP depois de uma ingestão ou correção | `Cache-Control: public, max-age=300, stale-while-revalidate=600` no código (AM-06, PD-SEC-008) | Gabriel (política de cache e CDN) |

## 9. Premissas, fora de escopo e lacunas

**Premissas** (decisões tomadas; se mudarem, este documento precisa ser revisto):

- Sem autenticação, sessões, cookies, Server Actions, upload de arquivos, WebSocket, scripts de terceiros, analytics e imagens remotas.
- Uma instância web no início. Com várias réplicas, o cache de ISR é local a cada instância (versions.json, riscos). O PortalDash não usa ISR (C-26).

**Decisões pendentes de Gabriel que afetam este modelo:**

- Linha-manchete do indicador: `DespesasExcetoIntraOrcamentarias` é **provisória** (metodologia v0.1.0) até a confirmação de Gabriel. Afeta as identidades verificadas antes da ativação (AM-15).
- Política de versões e de retificações na interface (AM-16; critic.json, `decisoes_para_gabriel`).
- Política de cache HTTP da API (AM-06, PD-SEC-008).
- Intervalo e retentativa em 429 na ingestão, que divergem da decisão de arquitetura (AM-17, PD-SEC-010).

**Fora de escopo agora:** municípios, parlamentares, emendas, contratos e fornecedores (prompt mestre, seção 1).

**Lacunas:**

- Visibilidade do repositório.
- Domínio e HSTS preload.
- Recursos de limitação de taxa ou WAF do Railway.
- TLS na rede privada.
- Retenção de logs da plataforma.
- Política de bloqueio da fonte (duração e código HTTP; critic.json).
- Auto-deploy do Railway.
- Quem tem acesso ao projeto no Railway.

## 10. Quando revisar este modelo

- Nova rota, novo parâmetro ou nova página com dado.
- Nova integração ou nova fonte. Municípios exigiriam reavaliar volume e custo: `/entes` trouxe 5.598 entes, dos quais 5.570 com esfera 'M', e percorrer os 5.598 levaria cerca de 93 minutos por combinação de período e anexo a 1 req/s (docs.json, inferência por aritmética).
- Nova dependência ou atualização de major.
- Ativação de qualquer cache (`'use cache'`, ISR, CDN), múltiplas réplicas, analytics ou scripts de terceiros.
- Qualquer proposta de autenticação ou área administrativa: mudaria o modelo inteiro.
- Achado novo de severidade Alta ou Crítica em [findings.md](findings.md) (enquanto o arquivo não existir, no índice provisório de [controls.md](controls.md), seção 10).
