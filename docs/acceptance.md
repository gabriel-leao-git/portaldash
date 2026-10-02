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
  surge versão nova nem célula duplicada. *(teste `ingestao.test.ts`)*
- Dado um ativo, quando a fonte devolve 5xx, então o ativo permanece.
- Dado um conteúdo que quebra uma identidade, quando importado, então fica
  `rejeitado` uma única vez e o ativo anterior permanece.
- Dada uma retificação válida, quando importada, então vira o novo ativo e o
  anterior vira `substituido`.
- Dada uma execução em andamento, quando outra começa, então a segunda é
  bloqueada.
- **Evidência:** `pnpm test` (53 testes, 8 arquivos) e execução real de
  2026-10-02 (270 versões ativas, 0 rejeitadas; reexecução sem mudanças).
- **Status:** aprovado.

### A-003 — API v1 (Etapa 3)

- Dado `?ano=2026&bimestre=4`, quando `GET /api/v1/brasil`, então o valor da
  União vem como string idêntica à fonte, com referência temporal, cobertura,
  proveniência, avisos e versão da metodologia.
- Dado parâmetro desconhecido, repetido ou fora do intervalo, então 400 com
  detalhes; UF fora da allowlist, 404; banco indisponível, 503 sem detalhes.
- Dado estado sem coleta, então `valor: null` e situação explícita (nunca 0).
- Nenhuma resposta expõe ids internos, hashes, corpo bruto ou configuração.
- **Evidência:** `tests/api/*.test.ts`; verificação manual com `curl` contra
  build de produção local.
- **Status:** aprovado.

### A-004 — Interface mínima (Etapa 4)

- Dado o recorte padrão, quando abro `/`, então vejo a União (arredondado e
  exato), proveniência, composição por grupo com tabela, evolução no ano com
  tabela, estados lado a lado sem soma e perguntas com a base factual.
- Filtros na URL (`?ano=&bimestre=`), formulário GET sem JavaScript.
- Estados de erro, vazio, filtro inválido, fonte indisponível e 404.
- Sem rolagem horizontal a 390 px (medido via emulação de dispositivo em `/`,
  `/estados`, `/estados/rj`, `/metodologia` e `/fontes`).
- **Evidência:** capturas headless (desktop e 390 px), build de produção local.
- **Pendências:** mapa de estados; teste automatizado de acessibilidade
  (axe) **NÃO EXECUTADO**; revisão de contraste feita só por tokens.
- **Status:** aprovado com pendências.
