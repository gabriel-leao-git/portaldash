# Critérios de aceitação

Modelo por tarefa, seguido de Definition of Ready / Done e do registro das
entregas.

## Modelo

```
Identificador e objetivo:
Dado [condição], quando [ação], então [resultado observável].
Casos de falha:
Evidência de validação (comandos e resultados):
Impacto em dados / API / segurança:
Status: aprovado | reprovado | pendente
```

Check que não pôde rodar (ferramenta, rede, banco ou fonte indisponível) é
registrado como **NÃO EXECUTADO**, com o motivo, e a tarefa não é declarada
concluída.

## Definition of Ready

Objetivo, escopo, fonte ou contrato necessário, critérios e riscos entendidos.

## Definition of Done

Comportamento implementado; critérios cumpridos; `pnpm check` aprovado;
números reconciliados quando aplicável; rotas revisadas; documentação e
changelog atualizados; achados bloqueantes resolvidos; nenhum segredo ou
fixture apresentado como dado oficial.

## Entregas

### A-001 — Validação da fonte (Etapa 1)

- **Objetivo:** confirmar que o Siconfi sustenta o indicador "despesas pagas".
- Dado o RREO Anexo 1 da União de 2025 (6º bim.), quando comparado ao PDF do
  Tesouro, então as 28 linhas de pagas coincidem com precisão de R$ 1 mil.
- **Evidência:** [validacao-fonte-siconfi-2026-10.md](validacao-fonte-siconfi-2026-10.md).
- **Status:** aprovado com ressalvas (estados reconciliados só no RJ 2023;
  SEFAZ-RJ bloqueia o IP da coleta).

### A-002 — Ingestão idempotente e versionada (Etapa 3)

- Dado um lote já importado, quando a mesma resposta é reimportada, então não
  surge versão nova nem célula ou resposta bruta duplicada.
- Dado um ativo sem mudança de status no extrato e com verificação recente,
  quando a ingestão roda, então o `/rreo` não é consultado de novo.
- Dado um ativo, quando a fonte devolve 5xx, então o ativo permanece e a
  execução termina `falhou` (havia coleta planejada e nenhuma foi concluída).
- Dado um lote paginado, quando a 2ª página falha, então nada é gravado e o
  ativo permanece.
- Dada uma resposta com qualquer chave de célula repetida, mesmo com o mesmo
  valor, quando montada, então a resposta inteira é inválida.
- Dado um conteúdo que quebra uma verificação bloqueante (presença única de
  exceto intra, correntes e capital; I1; I2 quando a linha intra existir,
  com intra e subtotal únicos), quando importado, então fica `rejeitado` uma
  única vez e o ativo anterior permanece.
- Dado um conteúdo que só quebra as identidades dos grupos, quando importado,
  então é ativado com `composicaoConsistente` falso e a composição por grupo
  não é exibida.
- Dado um conteúdo rejeitado antes, quando volta da fonte, então só é
  ignorado se ainda falhar nas verificações atuais; se passar, é ativado.
- Dada uma retificação com conteúdo novo, quando importada, então vira o novo
  ativo (sem `--forcar`) e o anterior vira `substituido`.
- Dada uma mudança de status no extrato com conteúdo igual ao ativo, quando
  importada, então o status não é promovido por 10 dias contados de
  `data_status` e a declaração é recoletada a cada execução; depois disso o
  status é promovido e a recoleta para.
- Dado o extrato indisponível, quando nenhum extrato é lido, então a execução
  termina `falhou` sem tocar nos dados (`pnpm ingest` sai com código 1).
- Dada uma execução em andamento, quando outra começa, então a segunda termina
  `bloqueada`; o lock é liberado ao fim, inclusive quando a execução lança
  erro.
- Cliente HTTP: só host e base oficiais; intervalo mínimo de 1,5 s; em 429,
  respeita o `Retry-After` (ou 10 s × tentativa) e dobra o intervalo até 6 s;
  retenta rede, timeout, 5xx e 429, mas não outros 4xx; recusa redirect, HTML,
  corpo acima do limite (inclusive em streaming sem `Content-Length`),
  paginação anômala (`hasMore` com página vazia, excesso de páginas) e item de
  outro ente.
- **Evidência:** `pnpm test` em 2026-10-02, depois do commit `0223974`: 72
  testes em 11 arquivos, todos aprovados (`tests/ingestion/*.test.ts` e
  `tests/methodology/verificacoes.test.ts` cobrem os itens acima); o mesmo
  resultado ("72 passed") no job `qualidade` da CI, run
  [36960791336](https://github.com/gabriel-leao-git/portaldash/actions/runs/36960791336).
  Ambiente local com Node 24.13.1, abaixo do mínimo de `engines` (24.21.0); o
  pnpm só emitiu aviso. Execuções reais de 2026-10-02
  ([validacao-fonte-siconfi-2026-10.md](validacao-fonte-siconfi-2026-10.md),
  seção 17): 280 declarações ativas, 0 rejeitadas, reexecução sem mudanças.
  Releitura do banco local dessas execuções em 2026-10-02, sem nova consulta à
  fonte: as 280 versões ativas passam nas verificações atuais, todas com
  composição consistente, e nenhuma das 280 respostas brutas tem chave de
  célula repetida. Em produção (Railway, projeto "portal dash", ambiente
  `production`), a primeira ingestão do serviço `ingestao`, em 2026-10-02, fez
  340 requisições e terminou com 280 declarações ativadas, 0 rejeitadas,
  situação `concluida` e nenhum erro.
- **Impacto em segurança e deploy:** `pnpm db:migrate` exige
  `INGEST_DATABASE_URL`, sem recorrer a `DATABASE_URL`, e, se
  `LEITURA_DB_PASSWORD` existir, provisiona o papel somente leitura
  `portaldash_leitura` (`src/server/db/papel-leitura.ts`; testado em
  `tests/db/papel-leitura.test.ts`: lê, não insere, não cria tabela,
  reprovisionamento idempotente, senha fraca recusada). As migrations só rodam
  no pre-deploy do serviço `ingestao`; o serviço web não tem pre-deploy e usa
  `DATABASE_URL` com o papel de leitura. A configuração fica nas instâncias de
  serviço do Railway, sem arquivo no repositório: `railway.json` e
  `railway.ingest.json` foram removidos no commit `0223974`, porque o Railway
  descontinuou o Config as Code e o arquivo da raiz valeria para os dois
  serviços (não versionar `railway.json` nem `railway.toml` enquanto os dois
  serviços compartilharem o repositório). No primeiro deploy, os logs do
  `ingestao` registraram "[migrate] migrations aplicadas" e
  "[migrate] papel portaldash_leitura provisionado". Ver
  [architecture.md](architecture.md), "Deploy no Railway", e
  [security/findings.md](security/findings.md), PD-SEC-012 e PD-SEC-013.
- **Status:** aprovado.

### A-003 — API v1 (Etapa 3)

- Dado `?ano=2026&bimestre=4`, quando `GET /api/v1/brasil`, então o valor da
  União vem como string idêntica à fonte, com referência temporal, cobertura,
  proveniência, avisos e versão da metodologia, e os estados aparecem lado a
  lado, sem soma.
- Período por rota: `/brasil` prefere os períodos que têm a União; `/estados`
  considera só os 27 entes estaduais; `/estados/{uf}`, só o ente.
- Dado um recorte explícito (`ano` e `bimestre`) sem nenhuma declaração ativa
  no escopo da rota, inclusive bimestre futuro, então 404 `sem_dados`. Um ano
  sem dado no escopo também dá 404.
- Dado parâmetro desconhecido, repetido ou fora do intervalo, então 400 com
  detalhes; UF fora da allowlist, 404; banco indisponível, 503 genérico com
  `no-store`, sem host, porta, usuário, senha ou código de erro do driver.
  Com o banco fora do ar, parâmetro inválido continua dando 400.
- Dado um ente sem valor, então `valor: null` e uma situação explícita:
  `sem_dado_validado`, `sem_registro_de_entrega` ou `nao_coletado` (nunca 0).
- Dada uma versão cujas identidades dos grupos falharam, então
  `composicao: null` e o aviso de composição oculta em `avisos`.
- `/brasil` traz `serieUniao`, com a mesma regra de `serieExercicio`.
- As respostas 200 de dados levam `Cache-Control: public, max-age=300`.
- Nenhuma resposta expõe ids internos, hashes, corpo bruto ou configuração.
- **Evidência:** `tests/api/rotas.test.ts`, `situacao.test.ts`,
  `indisponivel.test.ts` e `filtros.test.ts`, dentro dos 72 testes (11
  arquivos) de 2026-10-02. Contrato em [data-contract.md](data-contract.md),
  Parte 2.
- **Pendências:** sem teste automatizado para `serieUniao`, para o aviso de
  composição oculta na resposta da rota e para o `Cache-Control` das respostas
  200; esses itens foram conferidos só na leitura do código. A verificação
  manual com `curl` contra build de produção local foi feita na versão anterior
  às correções da revisão e não foi repetida (**NÃO EXECUTADO** nesta
  atualização).
- **Status:** aprovado com pendências.

### A-004 — Interface mínima (Etapa 4)

- Dado o recorte padrão, quando abro `/`, então vejo a União (arredondado e
  exato), proveniência, composição por grupo com tabela (só quando os grupos
  conferem com o total; senão, um aviso), evolução no ano com tabela, estados
  lado a lado sem soma e perguntas com a base factual.
- Seletor de período por links (`?ano=&bimestre=`), só com os períodos que têm
  dado validado no escopo da página; o período atual vem marcado com
  `aria-current`; funciona sem JavaScript.
- Dada uma falha de banco, quando a página carrega, então o erro vai para o
  error boundary (`src/app/error.tsx`): "Dados temporariamente indisponíveis",
  nenhum número exibido, botão "Tentar novamente" (`retry()`) e link para
  `/fontes`.
- Navegação: `aria-current="page"` só na página exata e `"true"` na seção (por
  exemplo, "Estados" em `/estados/rj`); a trilha de `/estados/{uf}` volta para
  `/estados` com o mesmo recorte.
- Textos derivados dos números: a escala arredonda antes de escolher a
  unidade, concorda em número e põe o sinal antes do `R$` (`R$ 1,00 tri`,
  `1,5 bilhão de reais`, `-R$ 442,9 mi`); a comparação anual usa o sinal real e
  diz "praticamente iguais" quando a variação arredonda a zero; nenhum texto diz
  "neste ano"; o grupo de amortização se chama "Amortização da dívida (exceto
  refinanciamento)".
- Estados de vazio, filtro inválido, dados parciais (cobertura), erro e 404.
- Sem rolagem horizontal a 390 px (medido via emulação de dispositivo em `/`,
  `/estados`, `/estados/rj`, `/metodologia` e `/fontes`).
- **Evidência:** `tests/api/situacao.test.ts` (escala e comparação anual);
  leitura do código (`DashboardFilters.tsx`, `NavLinks.tsx`, `error.tsx`,
  `estados/[uf]/page.tsx`, `indicador.ts`); capturas headless (desktop e
  390 px) e build de produção local feitas antes das correções da revisão.
- **Pendências:** capturas a 390 px e revisão visual não repetidas depois das
  correções; status HTTP da página de erro com o banco fora do ar (a
  implementação espera 500) sem teste automatizado nem conferência no build de
  produção (**NÃO EXECUTADO** nesta atualização); mapa de estados; teste
  automatizado de acessibilidade (axe) **NÃO EXECUTADO**; revisão de contraste
  feita só por tokens.
- **Status:** aprovado com pendências.
