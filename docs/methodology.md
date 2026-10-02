# Metodologia

| | |
|---|---|
| **Versão da metodologia** | **0.1.0** |
| **Situação** | Rascunho para revisão de Gabriel. Nenhum número foi publicado com esta metodologia. |
| **Linha-manchete** | **PROVISÓRIA**. Depende de confirmação de Gabriel (seção 15, D1). |
| **Versão do software na data da redação** | `0.1.0` (`package.json`). A numeração da metodologia é independente da do software. Hoje as duas coincidem por acaso. |
| **Data da redação** | 2026-10-01 (horário de Brasília) |
| **Última revisão** | 2026-10-02: alinhamento às regras já implementadas no código, sem mudar a versão (seção 17.2) |
| **Implementação** | `src/server/methodology/indicador.ts` (`METODOLOGIA_VERSAO = "0.1.0"`, linhas, rótulos e avisos) e `src/server/methodology/verificacoes.ts` (verificações de ativação) |
| **Base factual** | Evidências da Etapa 1 (validação da fonte), coletadas entre 2026-10-02T01:18Z e 2026-10-02T01:51Z (UTC), ou seja, na noite de 2026-10-01 em Brasília. O registro completo está na seção 19. Os resultados da primeira ingestão completa (2026-10-02, banco local de desenvolvimento) estão em `docs/validacao-fonte-siconfi-2026-10.md`, seção 17. |
| **Fonte de dados** | Siconfi / Tesouro Nacional: API de dados abertos (`apidatalake.tesouro.gov.br`), Relatório Resumido da Execução Orçamentária (RREO). |

## Como ler este documento

- **Fato observado:** vem sempre com a referência da evidência, por exemplo `[E08, R2]`. `Exx` identifica uma coleta, com URL e horário UTC. `Rx` identifica o relatório da Etapa 1 que a analisou. As duas listas estão na seção 19. Valores da fonte aparecem em `código`, exatamente como vieram no JSON.
- **Inferência:** conclusão tirada dos dados e não confirmada em texto normativo.
- **Hipótese:** possibilidade plausível que não foi testada.
- **Lacuna:** algo que não foi verificado.
- **Pendente (Gabriel):** decisão de produto ainda não tomada.
- **Proposta:** regra sugerida neste documento que ainda não foi aprovada.
- **Implementado:** regra que o código atual já aplica. O arquivo é sempre indicado; em caso de divergência entre este documento e o código, a divergência é um defeito a corrigir, não uma escolha.
- **Conferido na revisão:** dado lido diretamente numa amostra bruta da Etapa 1 durante a revisão deste documento (2026-10-01), sem nenhuma nova consulta à fonte. O arquivo é sempre indicado e a coleta original é a da evidência citada.
- Os valores da fonte estão em reais (R$ 1,00), salvo indicação contrária. Horários em UTC, com sufixo `Z`.
- Quando a revisão crítica (R7) corrigiu outro relatório, este documento segue a revisão crítica.

## Sumário

1. [Escopo da versão 0.1.0](#1-escopo-da-versão-010)
2. [Conceitos](#2-conceitos)
3. [Indicador principal (provisório)](#3-indicador-principal-provisório)
4. [Composição por grupos](#4-composição-por-grupos)
5. [Natureza temporal](#5-natureza-temporal)
6. [O que o indicador inclui e o que não inclui](#6-o-que-o-indicador-inclui-e-o-que-não-inclui)
7. [Regras de validação antes de publicar](#7-regras-de-validação-antes-de-publicar)
8. [Ausência de dado](#8-ausência-de-dado)
9. [Retificações, versões e datas](#9-retificações-versões-e-datas)
10. [Comparabilidade](#10-comparabilidade)
11. [Valores nominais, per capita e precisão](#11-valores-nominais-per-capita-e-precisão)
12. [Reconciliações realizadas e seus limites](#12-reconciliações-realizadas-e-seus-limites)
13. [Recortes validados e não validados](#13-recortes-validados-e-não-validados)
14. [Avisos obrigatórios na interface](#14-avisos-obrigatórios-na-interface)
15. [Decisões pendentes de Gabriel](#15-decisões-pendentes-de-gabriel)
16. [Lacunas abertas e próximos passos de validação](#16-lacunas-abertas-e-próximos-passos-de-validação)
17. [Versionamento da metodologia](#17-versionamento-da-metodologia)
18. [Correções](#18-correções)
19. [Registro de evidências](#19-registro-de-evidências)

---

## 1. Escopo da versão 0.1.0

**O que esta versão cobre:**

- Um indicador principal: **"Despesas pagas no exercício, acumuladas até o bimestre (exceto intraorçamentárias)"** (seção 3).
- A composição desse indicador por categoria econômica e grupo de natureza da despesa (seção 4).
- Um conceito: `pago`, o único valor aceito no parâmetro `conceito` da API v1.
- Entes: a União e as 27 unidades da federação (26 estados e o Distrito Federal).
- Período: exercício (ano) e bimestre (1 a 6), sempre explícitos.

**O que fica fora:** municípios e consórcios; total nacional consolidado; soma de estados; despesa por função ou subfunção; empenhado e liquidado como indicadores; restos a pagar; valores corrigidos pela inflação; per capita; séries mensais.

**Cálculo na leitura.** Nesta versão, o indicador é calculado na leitura a partir dos snapshots ativos (seção 7). Não há tabela de indicadores persistida. Por isso, uma mudança de metodologia altera na hora todos os valores exibidos, de todos os períodos, e precisa ser registrada no histórico (seção 17).

**Verificações na ingestão.** Já o resultado das verificações (seção 7) é calculado na ingestão e gravado com a versão da metodologia no campo `verificacoes` do snapshot (`metodologia`, `aprovado`, `composicaoConsistente` e a lista de resultados). Implementado em `src/server/methodology/verificacoes.ts` e `src/server/ingestion/snapshot.ts`. Consequência: uma mudança nas regras de verificação **não** reavalia sozinha as versões já ativas. Quando a recoleta traz conteúdo igual ao ativo, só a data da última conferência é atualizada (`src/server/ingestion/executar.ts`). Um conteúdo antes rejeitado é reavaliado pelas regras vigentes sempre que é coletado de novo (seção 7.5).

### 1.1 Entes e identificação

O identificador do ente é o `id_ente`, que o contrato da API define como código IBGE [E01, R1]. Lista dos entes no escopo, com os nomes do cadastro `/entes` [E04, R2]:

- **1**: União
- **11** Rondônia · **12** Acre · **13** Amazonas · **14** Roraima · **15** Pará · **16** Amapá · **17** Tocantins
- **21** Maranhão · **22** Piauí · **23** Ceará · **24** Rio Grande do Norte · **25** Paraíba · **26** Pernambuco · **27** Alagoas · **28** Sergipe · **29** Bahia
- **31** Minas Gerais · **32** Espírito Santo · **33** Rio de Janeiro · **35** São Paulo
- **41** Paraná · **42** Santa Catarina · **43** Rio Grande do Sul
- **50** Mato Grosso do Sul · **51** Mato Grosso · **52** Goiás · **53** Distrito Federal

Cuidados de identificação:

- **DF = `53`.** Brasília (`5300108`) aparece em `/entes` como município, com 0 itens no extrato de entregas de 2025, enquanto o `53` teve 71 [R1].
- **Estado do RJ = `33`.** O município do Rio de Janeiro (`3304557`) tem o mesmo nome em `/entes` e está fora do escopo [R5].
- **Nunca usar `esfera`, `uf`, `instituicao` ou `populacao` como chave.**
  - O DF vem com `esfera` `D` em `/entes` e `E` no `/rreo` [E16, R7].
  - Em `/entes`, os estados vêm com `uf` `BR`; no `/rreo`, vêm com a sigla (por exemplo `RJ`, `SP`, `MG`, `DF`).
  - A União tem `uf` nulo em `/entes` e `BR` no `/rreo` [R7].
- **Siglas de UF.** Só foram observadas no campo `uf` do `/rreo` as de SP, RJ, MG e DF. As demais seguem a correspondência padrão do código IBGE, mas não foram vistas na Etapa 1 [R7].

---

## 2. Conceitos

As definições gerais abaixo são as usuais das finanças públicas brasileiras, que têm base na Lei nº 4.320/1964 e no Manual de Demonstrativos Fiscais (MDF) da STN.

**Lacuna:** nenhum desses textos normativos foi lido na Etapa 1, e o link do MDF indicado no contrato da API não resolve no DNS [E03, R1]. As definições servem só para orientar a leitura. Tudo o que se afirma sobre a fonte vem das evidências.

### 2.1 Estágios da despesa: empenho, liquidação e pagamento

- **Dotação:** o valor autorizado no orçamento para gastar, inicial ou atualizado.
- **Empenho:** a reserva formal de parte da dotação para uma despesa específica. É o compromisso; ainda não houve entrega nem pagamento.
- **Liquidação:** a verificação de que o bem ou serviço foi entregue e de quanto é devido. Reconhece a obrigação do ente com o credor.
- **Pagamento:** a saída do dinheiro para o credor. **É o estágio medido pelo indicador.**

No RREO-Anexo 01, cada estágio corresponde a colunas próprias [E05, E11, R3, R5]:

| Estágio | Coluna no Anexo 01 (texto exato) | Há valor "no bimestre"? | Há valor "até o bimestre"? |
|---|---|---|---|
| Dotação | `DOTAÇÃO INICIAL (d)`, `DOTAÇÃO ATUALIZADA (e)` | não se aplica | não se aplica |
| Empenho | `DESPESAS EMPENHADAS ATÉ O BIMESTRE (f)` | sim (`DESPESAS EMPENHADAS NO BIMESTRE`) | sim |
| Liquidação | `DESPESAS LIQUIDADAS ATÉ O BIMESTRE (h)` | sim (`DESPESAS LIQUIDADAS NO BIMESTRE`) | sim |
| **Pagamento** | **`DESPESAS PAGAS ATÉ O BIMESTRE (j)`** | **não existe** | sim |
| Inscrição em restos a pagar não processados | `INSCRITAS EM RESTOS A PAGAR NÃO PROCESSADOS (k)` | não se aplica | só no 6º bimestre [R3, R5] |

**Exemplo:** RJ, 2025, 6º bimestre, linha `TotalDespesas` [E11, R5]. Esta linha não é a do indicador; serve apenas para mostrar os estágios.

- Empenhado (f): `116553974377.47`
- Liquidado (h): `114992739081.78`
- Pago (j): `112864466427.83`
- Inscrito em restos a pagar não processados (k): `1561235295.69`, igual a (f) − (h)

Na União (2025, 6º bimestre), o pago (j) é menor ou igual ao liquidado (h) em todas as linhas [E05, R3].

"Executada" não quer dizer "paga". O RREO da União publicado pelo Tesouro traz a nota: *"Durante o exercício, somente as despesas liquidadas são consideradas executadas. No encerramento do exercício, as despesas não liquidadas inscritas em restos a pagar não processados são também consideradas"* [E21, R3]. O PortalDash usa "pago" no sentido estrito da coluna (j).

### 2.2 Restos a pagar

Despesa empenhada num ano e não paga até 31 de dezembro pode ser inscrita em **restos a pagar** e paga em anos seguintes. Há dois tipos:

- **Processados:** já liquidados.
- **Não processados:** empenhados, mas ainda não liquidados.

A fonte mostra essa passagem de um ano para o outro no RJ [E11, E13, R5]:

- Liquidado menos pago em 2025 dá `2128272653.95`. Esse valor reaparece como restos a pagar processados inscritos, coluna `Em 31 de dezembro de 2025 (b)`, no Anexo 07 de 2026, 4º bimestre.
- A coluna (k) de 2025, `1561235295.69`, reaparece como `Em 31 de dezembro de 2025 (g)` no mesmo Anexo 07.

O pagamento de restos a pagar de anos anteriores fica no **RREO-Anexo 07**, nas colunas `Pagos (c)` (processados) e `Pagos (i)` (não processados), e não na coluna (j) do Anexo 01:

- RJ 2025, 6º bimestre: `2354653359.26` e `831650212.62` [E11, R5].
- União 2025, 6º bimestre: `94643805352.64` e `136567347228.29` [E05, R3].

**Inferência:** a coluna (j) exclui o pagamento de restos a pagar de anos anteriores. Os indícios:

- esses pagamentos ficam em colunas e anexos próprios;
- no Anexo 06 do RJ, a fórmula do resultado primário soma explicitamente as pagas do exercício e os restos a pagar pagos, o que indica conjuntos distintos [R5].

**Lacuna:** a definição normativa da coluna (j) no MDF não foi lida [R7].

### 2.3 Despesas intraorçamentárias

**Inferência conceitual** [R3, R5]: são operações entre órgãos e entidades do mesmo ente, dentro do próprio orçamento, em que uma parte do governo paga a outra. Somá-las ao restante conta duas vezes o mesmo dinheiro dentro do ente.

No Anexo 01 elas ficam numa linha separada:

- União 2025, 6º bimestre, pagas: `30097098735.26` [E05, R3].
- RJ 2025, 6º bimestre, pagas: `8709254764.43` [E11, R5].

**Armadilha da fonte:** a mesma linha aparece com dois `cod_conta`, `DespesasIntraOrcamentariasTotal` e `DespesasIntraOrcamentarias`, com o mesmo rótulo e o mesmo valor. Somar os dois conta em dobro [R2, R3, R5].

### 2.4 Juros, amortização e refinanciamento da dívida

- **Juros e encargos da dívida:** o custo da dívida. No Anexo 01, ficam dentro de Despesas Correntes.
- **Amortização da dívida:** o pagamento do principal. Fica dentro de Despesas de Capital.
- **Refinanciamento (rolagem):** amortização paga com recursos de dívida nova. É a definição geral, não verificada no MDF. No Anexo 01, aparece numa linha separada, `AMORTIZAÇÃO DA DÍVIDA / REFINANCIAMENTO` (`cod_conta` `AmortizacaoRefinanciamentoDaDivida`). Essa linha fica **fora** do subtotal e **dentro** de `TotalDespesas` [R3, R5].

Valores pagos na linha de refinanciamento:

| Ente | Período | Valor (j) | Evidência |
|---|---|---|---|
| União | 2025, 6º bimestre | `1417638361603.07` (cerca de 28% do `TotalDespesas` pago em 2025, `5054245956518.39`, que inclui o próprio refinanciamento) | [E05, R3] |
| União | 2026, até o 4º bimestre | `1141059765822.79` | [E08, R2] |
| RJ | 2025, 6º bimestre | `1555292452.73` | [E11, R5, R7] |
| RJ | 2026, até o 4º bimestre | `1175684863.78` | [E13, R5, R7] |
| SP, MG, DF | 2026, 4º bimestre | linha ausente | [E09, E16, R7] |

O relatório de cobertura dizia que só a União tinha essa linha. A revisão crítica corrigiu: o RJ também tem [R7].

No RJ (2025, 6º bimestre), a linha `Amortização da Dívida (XXVII)` do Anexo 06 vale `1785620944.63`. É exatamente a soma da amortização ordinária (`230165335.57`), da amortização intraorçamentária (`163156.33`) e do refinanciamento (`1555292452.73`) [E11, R5]. Por isso, "amortização" e "refinanciamento" precisam de rótulos distintos na interface.

**Implementado:** o grupo `AmortizacaoDaDivida` é exibido como "Amortização da dívida (exceto refinanciamento)" (`GRUPOS` em `src/server/methodology/indicador.ts`), e o refinanciamento não aparece na composição.

### 2.5 Acumulado no exercício

Valor acumulado de 1º de janeiro até o fim do bimestre de referência. Zera a cada exercício, e o 6º bimestre equivale ao ano fechado. As colunas "ATÉ O BIMESTRE" são acumuladas: a diferença entre dois bimestres seguidos reproduz a coluna "NO BIMESTRE", em geral exatamente, mas nem sempre ao centavo.

- União, liquidadas, `TotalDespesas`: `5154743999733.52` (6º bim.) − `4529774522116.31` (5º bim.) = `624969477617.21`, igual a `DESPESAS LIQUIDADAS NO BIMESTRE` do 6º bimestre [E05, E07, R3].
- União, empenhadas, mesma linha: `5379398670922.43` − `4952505222559.41` = `426893448363.02`, contra `426893448363.03` informado. A diferença é de 1 centavo [E05, E07, R3]. Por isso essa relação não serve como regra de validação exata.
- RJ, liquidadas, `TotalDespesas`: `114992739081.78` − `89034619683.15` = `25958119398.63`. Nas empenhadas, a diferença também bateu exatamente [E11, E12, R5].
- União, pagas, `TotalDespesas`: `4429066733156.81` no 5º bimestre e `5054245956518.39` no 6º, um valor crescente [E05, E07, R3].

Para "pagas" **não existe** a coluna "no bimestre": só "até o bimestre" [R1, R2, R3, R5].

### 2.6 Termos próprios do PortalDash

- **Declaração:** o conteúdo de uma combinação (ente, exercício, bimestre, demonstrativo, anexo). Exemplo: (33, 2026, 4, `RREO`, `RREO-Anexo 01`).
- **Snapshot:** o conteúdo de uma declaração obtido numa coleta, identificado por um hash canônico. Há no máximo um snapshot **ativo** por declaração.
- **Status no Siconfi:** `HO` (homologado) ou `RE` (retificado), com a data do status (`data_status`), lidos no extrato de entregas [R3, R5].
- **Datas:** referência, status, publicação oficial e coleta (seção 5.2).

---

## 3. Indicador principal (provisório)

> **Atenção: a escolha da linha-manchete é provisória.** Ela foi recomendada pela revisão crítica da Etapa 1 [R7] e depende de confirmação de Gabriel (seção 15, D1). Enquanto não houver decisão, a interface mostra o aviso AV-09.

### 3.1 Definição exata

| Item | Definição |
|---|---|
| Nome | Despesas pagas no exercício, acumuladas até o bimestre (exceto intraorçamentárias) |
| Conceito na API v1 | `conceito=pago` |
| Versão | Metodologia 0.1.0 |
| Fonte | Siconfi / Tesouro Nacional, endpoint `/rreo` da API de dados abertos [E01] |
| Requisição | `GET https://apidatalake.tesouro.gov.br/ords/cdwhprd/siconfi/tt/rreo?an_exercicio={ano}&nr_periodo={bimestre}&co_tipo_demonstrativo=RREO&no_anexo=RREO-Anexo%2001&id_ente={id_ente}` [R7] |
| Demonstrativo | `RREO` |
| Anexo (texto exato) | `RREO-Anexo 01` (Balanço Orçamentário) |
| Coluna (texto exato) | `DESPESAS PAGAS ATÉ O BIMESTRE (j)` |
| Linha (`cod_conta` exato) | `DespesasExcetoIntraOrcamentarias` |
| Campos que **não** entram na seleção | `conta`, cujo texto varia (`DESPESAS (EXCETO INTRA-ORÇAMENTÁRIAS) (VIII)` nos estados e `(IX)` na União) [R2, R7]; `rotulo`; `esfera`; `uf`; `instituicao`; `populacao` |
| Unidade | Reais correntes (nominais), com até 2 casas decimais na fonte (seção 11.3) |
| Natureza temporal | Acumulado de 1º de janeiro até o fim do bimestre informado (seção 5) |
| Entes | União (1), 26 estados e DF (53) |
| Cálculo | Leitura direta de **uma** célula do snapshot ativo. Nenhuma soma de linhas. |
| Agregação | Nenhuma. Um valor por ente, exercício e bimestre. Sem total nacional e sem soma de estados. |

A chave da célula do indicador é (`cod_ibge`, `exercicio`, `periodo`, `demonstrativo`=`RREO`, `anexo`=`RREO-Anexo 01`, `coluna`=`DESPESAS PAGAS ATÉ O BIMESTRE (j)`, `cod_conta`=`DespesasExcetoIntraOrcamentarias`) [R7].

O contrato da API é Swagger 2.0, `info.version` 1.1.0, descrito como "versão beta" [E01, R1]. O caminho legado `/ords/siconfi/tt/` também respondeu, com bytes idênticos, no único teste feito: `/extrato_entregas` do RJ, 2026, às 2026-10-02T01:26:23Z [R5, R7]. Mesmo assim, o PortalDash usa só o caminho documentado, `/ords/cdwhprd/siconfi/tt/`.

### 3.2 Por que esta linha, e quais as alternativas

| Linha (`cod_conta`) | O que contém | Problema | Situação na v0.1.0 |
|---|---|---|---|
| `TotalDespesas` | Subtotal + refinanciamento. No RJ, até 2019, o mesmo código era `TOTAL (XIV) = (XII + XIII)` e incluía o superávit [R7]. | O refinanciamento pesa muito na União (`1141059765822.79` até 2026 b4 [E08, R2]). O significado mudou no tempo: RJ 2018 b6, `69352345037.11` = `58665749815.77` + superávit `10686595221.34` [E16, R7]. | **Descartada** |
| `SubtotalDasDespesas` | Exceto intra + intraorçamentárias | As intraorçamentárias contam em dobro dentro do ente (seção 2.3). | Alternativa para decisão de Gabriel |
| **`DespesasExcetoIntraOrcamentarias`** | Despesas correntes + despesas de capital, sem intraorçamentárias e sem refinanciamento | Nenhum problema conhecido. A linha é homogênea entre os entes observados, tenham ou não a linha de refinanciamento [R7]. | **Provisória (recomendada)** |
| `Superavit`, `TotalDespesasComSuperavit` | Superávit e "total com superávit", que ocupam a coluna (j) mas não são pagamento | MG 2026 b4: `TotalDespesas` `85194032709.7` + `Superavit` `16805443364.65` = `TotalDespesasComSuperavit` `101999476074.35` [E16, R7]. | **Proibidas** |

Ordem de grandeza da escolha, União, 2026, até o 4º bimestre [E08, R2]:

| Linha | Valor (j) |
|---|---|
| `DespesasExcetoIntraOrcamentarias` | `2821965337713.47` |
| `SubtotalDasDespesas` | `2858865426569.12` |
| `TotalDespesas` | `3999925192391.91` |

Em SP, no mesmo período, `SubtotalDasDespesas` = `TotalDespesas` = `231294096928.76`, porque não há linha de refinanciamento, e `DespesasExcetoIntraOrcamentarias` = `224014883002.29` [E09, R2].

Estabilidade observada. O `cod_conta` e o texto da coluna estavam presentes e iguais em todos os casos verificados [R7]:

- União: 2019 b6, 2025 b5 e b6, 2026 b4;
- RJ: 2015, 2018, 2019, 2020, 2021 e 2023 (todos b6), 2025 b5 e b6, 2026 b4;
- SP: 2025 b6 e 2026 b4;
- MG e DF: só 2026 b4.

(R7 resume a estabilidade como "SP, MG e DF em 2025/2026", mas a lista de lacunas do próprio R7 mostra que MG e DF só foram observados em 2026 b4.)

Para a União, a linha foi reconciliada com o RREO oficial do Tesouro (seção 12).

### 3.3 Estrutura das despesas no Anexo 01

A API não traz campo de pai, nível ou ordem. A hierarquia abaixo foi montada a partir de `cod_conta`, das fórmulas nos rótulos e das identidades conferidas [R3, R5]. Os numerais romanos dos estados observados (RJ, SP) diferem dos da União [R2]:

```text
SubtotalDasDespesas ............................ estados (X) = (VIII + IX) | União (XI) = (IX + X)
├── DespesasExcetoIntraOrcamentarias ........... estados (VIII) | União (IX)    <- INDICADOR
│   ├── DespesasCorrentes
│   │   ├── PessoalEEncargosSociais
│   │   ├── JurosEEncargosDaDivida
│   │   └── OutrasDespesasCorrentes            (União: inclui TransferenciasAEstados...,
│   │                                            BeneficiosPrevidenciarios, DemaisDespesasCorrentes)
│   └── DespesasDeCapital
│       ├── Investimentos
│       ├── InversoesFinanceiras
│       └── AmortizacaoDaDivida                 (amortização ordinária, sem refinanciamento)
└── DespesasIntraOrcamentariasTotal ............ estados (IX) | União (X)
                                                 (repetida como DespesasIntraOrcamentarias: não somar)
AmortizacaoRefinanciamentoDaDivida ............. estados (XI) | União (XII)   só em alguns entes
TotalDespesas .................................. Subtotal + refinanciamento   (antes de 2020, no RJ, incluía superávit)
Superavit / TotalDespesasComSuperavit .......... não são despesa: proibidas
ReservaDeContingencia .......................... sem célula na coluna (j)
```

Regra prática: **use uma única linha e nunca some linhas do quadro**.

### 3.4 Valores observados na Etapa 1

Estes valores servem para validação e testes. **Não são números publicados pelo PortalDash.**

| Ente | Exercício e bimestre | `DespesasExcetoIntraOrcamentarias`, coluna (j) | Status no extrato na coleta | Evidência |
|---|---|---|---|---|
| União | 2025, 6º | `3606510496180.06` | HO `2026-01-30T22:36:41Z` | [E05, E06, R3, R4] |
| União | 2026, 4º | `2821965337713.47` | HO `2026-09-30T14:28:06Z` | [E08, E18, R2] |
| SP | 2026, 4º | `224014883002.29` | HO `2026-09-30T11:45:11Z` | [E09, E18, R2] |
| RJ | 2025, 6º | `102599919210.67` | RE `2026-05-06T17:14:12Z` | [E11, E19, R5] |
| RJ | 2026, 4º | `65960575113.15` | HO `2026-09-30T22:36:35Z` | [E13, E18, R5] |
| MG | 2026, 4º | `76054500238.07` (não consta nos relatórios; conferido na revisão em `siconfi\revisao\rreo_31_2026_b4_a01.json`) | HO `2026-09-30T22:30:39Z` | [E16, E18, R2, R7] |
| DF | 2026, 4º | `23359230712.8` (não consta nos relatórios; conferido na revisão em `siconfi\revisao\rreo_53_2026_b4_a01.json`) | HO `2026-09-30T15:42:12Z` | [E16, E18, R2, R7] |

---

## 4. Composição por grupos

A composição detalha o indicador principal dentro de **um** ente, usando só os `cod_conta` comuns a todos os entes observados [R7]. Os rótulos abaixo são os implementados em `CATEGORIAS` e `GRUPOS` (`src/server/methodology/indicador.ts`):

| Nível | `cod_conta` | Rótulo de exibição | Observação |
|---|---|---|---|
| Categoria | `DespesasCorrentes` | Despesas correntes | |
| Grupo | `PessoalEEncargosSociais` | Pessoal e encargos sociais | |
| Grupo | `JurosEEncargosDaDivida` | Juros e encargos da dívida | |
| Grupo | `OutrasDespesasCorrentes` | Outras despesas correntes | Na União, inclui transferências a estados, DF e municípios e benefícios previdenciários [R3] |
| Categoria | `DespesasDeCapital` | Despesas de capital | |
| Grupo | `Investimentos` | Investimentos | |
| Grupo | `InversoesFinanceiras` | Inversões financeiras | |
| Grupo | `AmortizacaoDaDivida` | Amortização da dívida (exceto refinanciamento) | Não confundir com `AmortizacaoRefinanciamentoDaDivida`, que fica fora do indicador (seção 2.4) |

Regras:

1. **Mesma coluna e mesmo snapshot.** Todos os valores da composição vêm da coluna `DESPESAS PAGAS ATÉ O BIMESTRE (j)` do mesmo snapshot ativo que fornece o indicador.
2. **Identidade obrigatória.** `DespesasExcetoIntraOrcamentarias` = `DespesasCorrentes` + `DespesasDeCapital` (I1, seção 7.4). É condição para ativar o snapshot (bloqueante).
3. **Identidades dos grupos (Implementado, não bloqueante).** Duas identidades foram observadas com aritmética decimal na União 2025 b6 [R3] e no RJ 2025 b6 e 2026 b4 [R5]:
   - `DespesasCorrentes` = `PessoalEEncargosSociais` + `JurosEEncargosDaDivida` + `OutrasDespesasCorrentes` (verificação `correntes=grupos`)
   - `DespesasDeCapital` = `Investimentos` + `InversoesFinanceiras` + `AmortizacaoDaDivida` (verificação `capital=grupos`)

   Elas são conferidas em toda declaração (`src/server/methodology/verificacoes.ts`), mas **não** impedem a ativação: o indicador principal continua publicado mesmo que falhem. Se qualquer uma falhar, o snapshot é gravado com `composicaoConsistente` = `false` e a composição por grupo dessa declaração **não é exibida** (regra 8). Parcela ausente não vira zero: a identidade é conferida só com as parcelas presentes, e o detalhe do resultado registra quais faltaram.
4. **Nunca somar níveis diferentes.** Não somar uma categoria com seus grupos, nem grupos com o total. Não calcular "outros" por diferença.
5. **Grupo ausente = "sem dado".** Um grupo sem célula aparece como "sem dado", nunca como zero. A fonte omite células que a publicação mostra como 0: a Reserva de Contingência da União 2025 b6 tem pagas 0 no PDF e nenhuma célula no Siconfi [R4, R7].
6. **Subcontas exclusivas ficam de fora.** `TransferenciasAEstadosDistritoFederalEMunicipios`, `BeneficiosPrevidenciarios`, `TransferenciasAMunicipios` e `DemaisDespesasCorrentes` não existem em todos os entes. Não entram na composição nem em comparações entre entes [R2, R7].
7. **Percentuais.** Se a participação de cada grupo for exibida, ela é um cálculo do PortalDash, não da fonte. Deve ser feita em decimal a partir do mesmo snapshot e rotulada como cálculo derivado.
8. **Composição oculta (Implementado).** Com `composicaoConsistente` = `false`, a API devolve `composicao: null` para o ente, a página não mostra a seção por grupo e o aviso AV-13 passa a acompanhar o recorte (`AVISO_COMPOSICAO_OCULTA` em `src/server/services/despesas.ts`):

   > "A composição por grupo não é exibida para esta declaração: a soma dos grupos não confere com o total de despesas correntes ou de capital."

   Só o resultado `falhou` oculta a composição. O resultado `nao_verificavel` (nenhuma parcela do grupo presente) não a oculta, e os grupos ausentes aparecem como "sem dado" (regra 5). Uma célula de grupo repetida na coluna (j) é tratada como não informada: nunca é somada nem escolhida.

---

## 5. Natureza temporal

### 5.1 Bimestres e acumulação

| Bimestre (`nr_periodo`) | Meses do bimestre | O valor acumulado cobre | Como se sabe |
|---|---|---|---|
| 1 | jan–fev | jan–fev | Convenção da LRF (**inferência**: a API não informa os meses [R5]) |
| 2 | mar–abr | jan–abr | Convenção (inferência) |
| 3 | mai–jun | jan–jun | Convenção (inferência) |
| 4 | jul–ago | jan–ago | Confirmado: a União 2026 b4 bate com o PDF do Tesouro "JANEIRO A AGOSTO DE 2026" [E22, R3] |
| 5 | set–out | jan–out | Convenção (inferência) |
| 6 | nov–dez | jan–dez (ano fechado) | Confirmado: União 2025 b6 = "JANEIRO A DEZEMBRO DE 2025" [E21, R3]; RJ 2023 b6 = "JANEIRO A DEZEMBRO 2023/BIMESTRE NOVEMBRO-DEZEMBRO" [E23, R6] |

Regras:

1. **O valor é acumulado.** O 4º bimestre já contém o 1º, o 2º e o 3º. **Bimestres não se somam.**
2. **"Pago no bimestre" não existe na fonte.** O PortalDash não o publica na v0.1.0. Ele só sairia pela diferença b(n) − b(n−1), que pode misturar versões diferentes das duas declarações, porque o `/rreo` não permite rastrear retificações [R7]. Publicar ou não essa diferença está pendente (seção 15, D6).
3. **Sem séries mensais.** O Siconfi é bimestral. O RREO oficial da União é mensal, com colunas "No Mês" e "Até o Mês". As colunas "No Mês" do PDF não equivalem às colunas "NO BIMESTRE" do Siconfi, e só os acumulados dos meses pares coincidem [E21, E22, R3, R7]. Nenhum valor mensal é derivado de dados bimestrais. A MSC (mensal) não foi validada para "despesa paga" [R7].
4. **Evolução no ano** = curva acumulada b1→b6 do mesmo ente e exercício, ponto a ponto, sem interpolar e sem calcular diferenças.
5. **Comparação entre anos:** só no mesmo bimestre e no mesmo ente (por exemplo, 4º bim. 2026 × 4º bim. 2025), em valores nominais e com aviso de possível retificação (AV-11).
6. **Exercício em andamento.** Bimestres ainda não entregues aparecem como "sem dado", com a situação `sem_registro_de_entrega` quando o extrato coletado não registra a entrega (seção 8). O RJ 2026 b5 devolveu HTTP 200 com `items` vazio [E14, R5]. Na coleta, o 5º bimestre de 2026 não aparecia em nenhum extrato [R2, R3]. Isso é esperado: pela convenção da LRF, o 5º bimestre (set–out) nem tinha terminado na data da coleta (inferência). Implementado: na série do exercício (`serieExercicio`), bimestres posteriores ao selecionado só aparecem se tiverem dado; e um recorte explícito sem nenhuma declaração ativa no escopo, como um bimestre futuro, não é exibido (HTTP 404 `sem_dados` na API, seção 8.2).

### 5.2 As datas não se confundem

| Data | O que é | De onde vem | Observações |
|---|---|---|---|
| **Referência** | Exercício + bimestre (fim do bimestre) | Parâmetros e campos `exercicio` e `periodo` | |
| **Status no Siconfi** | Data do status atual, HO ou RE | Campo `data_status` de `/extrato_entregas` | Não é a data da entrega original nem a da publicação legal [R7]. Vem com sufixo `Z`, mas o fuso real não foi verificado; várias homologações caem perto das 22:30Z do dia do prazo, como MG em todos os bimestres de 2026 [R2, R7]. |
| **Publicação oficial** | Data em que o ente publicou o relatório (diário oficial ou site) | Fora da API | Não está disponível pela API. Exemplo: a página do Tesouro do RREO de agosto de 2026 diz "publicado em 30/09/2026" [E22, R3]. |
| **Coleta** | Momento em que o PortalDash obteve o conteúdo | Relógio próprio, em UTC | Não usar o cabeçalho `Date` de terceiros: o do Tesouro Transparente veio de cache, defasado cerca de 5,5 h [R1]. |

A data de coleta exibida é a do conteúdo do snapshot ativo. Coletas posteriores podem confirmar o mesmo conteúdo. **Implementado:** a interface mostra as duas datas, "Coletado em …; conferido em …" (`src/components/ui/SourceBadge.tsx`). Na API, são os campos `proveniencia.coletadoEm` (coleta do conteúdo ativo) e `proveniencia.verificadoEm` (última coleta que confirmou o mesmo conteúdo, coluna `ultima_verificacao_em`), montados em `src/server/services/despesas.ts`. O formato está no contrato de dados (`docs/data-contract.md`).

**Defasagem entre homologação e disponibilidade.** Só se conhecem limites superiores, e o momento da primeira disponibilidade não foi medido [R7]:

- União 2026 b4: homologada em `2026-09-30T14:28:06Z` e já presente no `/rreo` em `2026-10-02T01:23:10Z` (cerca de 34h55m).
- SP 2026 b4: homologado em `2026-09-30T11:45:11Z` e presente em `2026-10-02T01:23:22Z` (cerca de 37h38m).

O relatório de cobertura falava em "11 a 14 h"; a revisão crítica corrigiu esse número [R7].

Pelos mesmos carimbos, outros três limites superiores (diferenças calculadas na revisão; não constam nos relatórios):

- RJ 2026 b4: HO em `2026-09-30T22:36:35Z` [E18, R5] e presente em `2026-10-02T01:23:46Z` [E13, R5] (cerca de 26h47m);
- MG 2026 b4: HO em `2026-09-30T22:30:39Z` [E18, R2] e presente em `2026-10-02T01:49:16Z` [E16] (cerca de 27h19m);
- DF 2026 b4: HO em `2026-09-30T15:42:12Z` [E18, R2] e presente em `2026-10-02T01:48:57Z` [E16] (cerca de 34h07m).

Todos são limites superiores, porque nenhuma coleta tentou o `/rreo` antes. Não servem como estimativa da defasagem.

---

## 6. O que o indicador inclui e o que não inclui

**Inclui** (coluna (j), linha `DespesasExcetoIntraOrcamentarias`):

| Componente | Observação |
|---|---|
| Despesas correntes pagas no exercício | Pessoal e encargos; juros e encargos da dívida; outras despesas correntes. Na União, "outras" inclui transferências a estados, DF e municípios (`531673082300.42` pagos até 2026 b4 [E08, R2]) e benefícios previdenciários [R3]. |
| Despesas de capital pagas no exercício | Investimentos; inversões financeiras; amortização da dívida **não refinanciada** [R3, R5]. |
| Serviço da dívida | Juros e amortização ordinária estão **dentro** do indicador. Exemplo União 2025 b6: juros `363469278379.43`, amortização `353978003798.13` [E05, R3]. Destacá-los ou não é decisão pendente (D1). |
| Abrangência institucional | Quadros dos "orçamentos fiscal e da seguridade social" do ente [E21, E23]. No RREO estadual, a instituição informante é o Governo do Estado, consolidado [R5]. **Inferência:** inclui todos os poderes e órgãos do ente nesses orçamentos, já que o Anexo 07 do mesmo RREO detalha restos a pagar por poder [R5]. |

**Não inclui:**

| Excluído | Por quê, ou onde está | Evidência |
|---|---|---|
| Despesas intraorçamentárias | Evitar dupla contagem dentro do ente (`DespesasIntraOrcamentariasTotal`) | [R3, R5, R7] |
| Refinanciamento da dívida | Linha `AmortizacaoRefinanciamentoDaDivida`, fora do subtotal | [R3, R5, R7] |
| Superávit e "total com superávit" | Ocupam a coluna (j), mas não são pagamento | [R5, R7] |
| Restos a pagar de anos anteriores pagos no ano | Ficam no Anexo 07. **Inferência**; a confirmação no MDF está pendente. | [R3, R5, R7] |
| Valores empenhados ou liquidados e ainda não pagos | Colunas (f) e (h); inscrição em restos a pagar na (k) | [R3, R5] |
| Reserva de contingência | Não tem célula na coluna de pagas | [R3, R5] |
| Consolidação entre esferas | Transferências contam como despesa de quem paga; não há eliminação | [R7] |
| Municípios e consórcios | Fora do escopo | [R7] |
| Colunas de percentual | Também ocupam o campo `valor`; são descartadas pelo texto exato da coluna | [R1, R7] |
| Correção monetária e per capita | Fora do escopo (seção 11) | [R7] |

**Mesmo nome, outro conteúdo.** "Despesas Exceto Intraorçamentárias" na DCA-Anexo I-E **inclui** o refinanciamento, ao contrário do RREO. RJ 2025: DCA `104155211663.4` = RREO `102599919210.67` + refinanciamento `1555292452.73` [E17, R7]. Nunca misturar as duas fontes sob o mesmo rótulo.

---

## 7. Regras de validação antes de publicar

O fluxo tem cinco passos:

1. coleta;
2. resposta bruta guardada, deduplicada pelo sha256 do corpo, com URL, parâmetros, ETag, X-Cache e data de coleta;
3. snapshot candidato da declaração, com hash canônico do conteúdo, independente da ordem dos itens (a fonte não garante ordem estável [R1]);
4. validações (7.1 a 7.4);
5. ativação transacional, ou rejeição mantendo o snapshot ativo anterior (7.5).

As verificações se dividem em dois tipos, ambos implementados em `src/server/methodology/verificacoes.ts` (campo `bloqueante` de cada resultado):

- **Bloqueantes:** presença única de `DespesasExcetoIntraOrcamentarias`, `DespesasCorrentes` e `DespesasDeCapital`; identidade I1; e, quando a linha `DespesasIntraOrcamentariasTotal` existir, presença única dela e de `SubtotalDasDespesas` mais a identidade I2. Qualquer falha impede a ativação.
- **Não bloqueantes:** as identidades dos grupos (`correntes=grupos` e `capital=grupos`). Uma falha não impede a ativação; só oculta a composição por grupo (seção 4, regras 3 e 8).

Antes delas, a montagem do snapshot recusa a resposta inteira se houver chave repetida (seção 7.3).

### 7.1 Integridade da resposta

- A resposta deve ser HTTP 200 com JSON no envelope ORDS: `items`, `hasMore`, `limit`, `offset`, `count`, `links` [R1]. Implementado em `src/server/integrations/siconfi/parse.ts`: o envelope precisa ter `items`, `hasMore` booleano e `count` igual ao número de itens.
- Se `hasMore` for `true`, a paginação continua no host público com `offset` montado localmente. Os `links` da resposta apontam para um host interno e nunca são seguidos [R1, R3]. Implementado em `src/server/integrations/siconfi/client.ts`, que também recusa `hasMore` com página vazia e respostas com mais de 10 páginas.
- `items` vazio não é zero. Na fonte, significa declaração indisponível (seção 8). Também chegam como 200 vazio: parâmetro fora do enum, `id_ente` ausente e período não entregue [R1, R5]. Na ingestão, o `/rreo` só é consultado para bimestres que o extrato registra como entregues (`src/server/ingestion/planejamento.ts`); se essa consulta vier vazia, a coleta da declaração falha ("Resposta sem células", `src/server/ingestion/snapshot.ts`), nada é gravado e o ativo anterior, se houver, continua.
- Cada item precisa pertencer à declaração pedida: `exercicio`, `periodo`, `cod_ibge`, `demonstrativo` e `anexo` iguais aos da requisição. Esses campos repetem os parâmetros [R3, R5]. Implementado em `client.ts`: um item fora do recorte invalida a resposta inteira.
- `valor` chega como **número** JSON, não como string [R2, R3, R5]. É lido preservando o texto exato do token, validado como decimal e gravado como texto (`valor_texto`) e como `NUMERIC`. Nenhum passo usa ponto flutuante (seção 11.3).
- Só valem células cujo texto de `coluna` seja exatamente `DESPESAS PAGAS ATÉ O BIMESTRE (j)`. As colunas de percentual também ocupam `valor` [R1].

### 7.2 Presença das células

| Célula (coluna (j)) | Exigência | Tipo |
|---|---|---|
| `DespesasExcetoIntraOrcamentarias` | Obrigatória, exatamente uma | Bloqueante |
| `DespesasCorrentes` | Obrigatória, exatamente uma (identidade I1) | Bloqueante |
| `DespesasDeCapital` | Obrigatória, exatamente uma (identidade I1) | Bloqueante |
| `DespesasIntraOrcamentariasTotal` | Opcional. Se existir, precisa ser única, e `SubtotalDasDespesas` passa a ser obrigatória e única (identidade I2) | Bloqueante quando a linha intra existe |
| Os 6 grupos da seção 4 | Opcionais. Grupo ausente aparece como "sem dado". | Não bloqueante |

- Resposta não vazia sem uma célula obrigatória, ou com uma delas repetida na coluna (j) sob chaves distintas (outro `rotulo` ou `conta`; a chave idêntica é tratada na seção 7.3), gera um snapshot **rejeitado**: ele é gravado com a situação `rejeitado` e o resultado das verificações, e não é ativado.
- **Hipótese e risco:** a fonte omite células em vez de enviar zero. No RJ não se observou nenhum valor igual a 0 [R5]. Se um ente não pagar nada numa categoria inteira (por exemplo, capital no 1º bimestre), a célula pode faltar e o snapshot será rejeitado. Isso não foi observado. O comportamento é conservador de propósito: a rejeição é registrada para revisão manual.
- **Lacuna (Etapa 1):** a célula do indicador foi observada no `/rreo` só na União, em SP, no RJ, em MG e no DF. Para os outros 23 estados, a presença era apenas inferida pelo extrato [R7]. A ingestão a confirma resposta a resposta, ao aplicar esta seção 7, e nenhum estado é publicado antes disso. **Atualização (2026-10-02):** a primeira ingestão completa, em banco local de desenvolvimento, ativou 280 declarações (os 28 entes, 2025 b1 a b6 e 2026 b1 a b4), todas aprovadas nas verificações, sem nenhum resultado `falhou` registrado (`docs/validacao-fonte-siconfi-2026-10.md`, seção 17.1; contagem conferida no banco na mesma data).

### 7.3 Unicidade

- Na resposta do Anexo 01, cada par (`coluna`, `cod_conta`) usado pelo indicador deve aparecer **exatamente uma vez**. Não houve duplicatas de (`rotulo`, `coluna`, `cod_conta`) no Anexo 01 da União 2025 b6 nem do RJ 2025 b6 [R7]. Conferido na revisão: nas 8 amostras de E16 (`siconfi\revisao\rreo_*.json`), nenhum `cod_conta` se repete na coluna (j). Implementado como verificação bloqueante para as linhas obrigatórias (seção 7.2); nos grupos, uma célula repetida é tratada como não informada (seção 4, regra 8).
- A chave bruta (`cod_ibge`, `exercicio`, `periodo`, `demonstrativo`, `anexo`, `rotulo`, `coluna`, `cod_conta`, `conta`) não pode se repetir na resposta, porque a unicidade só foi testada em amostras [R7]. **Implementado** (`montarSnapshot` em `src/server/ingestion/snapshot.ts`): **qualquer** chave repetida, mesmo com o mesmo valor e em qualquer coluna, invalida a resposta inteira. Os cinco primeiros campos já são conferidos item a item contra a requisição (seção 7.1), e por isso a montagem compara (`rotulo`, `coluna`, `cod_conta`, `conta`). Motivo: sem ordem garantida entre páginas, uma linha repetida pode indicar que outra foi pulada. Efeito: a coleta da declaração falha de forma explícita, nenhum snapshot é gravado (nem como rejeitado), a resposta bruta fica guardada, o erro é registrado na execução e o ativo anterior, se houver, continua.
- Conferido em 2026-10-02 nas respostas brutas guardadas das 280 declarações ativas da primeira ingestão completa (banco local de desenvolvimento): nenhuma chave (`rotulo`, `coluna`, `cod_conta`, `conta`) se repete, e o número de células de cada snapshot é igual ao número de itens da resposta.
- Para o intraorçamentário, usa-se só `DespesasIntraOrcamentariasTotal`, nunca junto com `DespesasIntraOrcamentarias`, que tem o mesmo valor [R2, R3, R5].
- No banco, há no máximo um snapshot ativo por declaração, garantido por índice único parcial.

### 7.4 Identidades exatas em decimal

| ID | Identidade | Quando | Se falhar | Identificador no código |
|---|---|---|---|---|
| **I1** | `DespesasExcetoIntraOrcamentarias` = `DespesasCorrentes` + `DespesasDeCapital` | Sempre | Bloqueia a ativação | `exceto-intra=correntes+capital` |
| **I2** | `SubtotalDasDespesas` = `DespesasExcetoIntraOrcamentarias` + `DespesasIntraOrcamentariasTotal` | Quando a linha intraorçamentária existir. Nesse caso é **estrita**: sem `SubtotalDasDespesas` único, a declaração é rejeitada (seção 7.2). | Bloqueia a ativação | `subtotal=exceto-intra+intra` |
| Grupos (correntes) | `DespesasCorrentes` = `PessoalEEncargosSociais` + `JurosEEncargosDaDivida` + `OutrasDespesasCorrentes` | Sempre | Não bloqueia; oculta a composição (seção 4) | `correntes=grupos` |
| Grupos (capital) | `DespesasDeCapital` = `Investimentos` + `InversoesFinanceiras` + `AmortizacaoDaDivida` | Sempre | Não bloqueia; oculta a composição (seção 4) | `capital=grupos` |

- Implementado em `src/server/methodology/verificacoes.ts`. Cada resultado tem `situacao` (`ok`, `falhou` ou `nao_verificavel`) e `bloqueante`. A versão é aprovada quando nenhuma verificação bloqueante tem `falhou`; `composicaoConsistente` é verdadeiro quando nenhuma verificação não bloqueante tem `falhou`.
- A comparação é **exata** em `NUMERIC`: sem tolerância e sem arredondamento. Valores como `111309173975.1` e `111309173975.10` são numericamente iguais.
- As identidades foram conferidas com aritmética decimal nas evidências:
  - União 2025 b6 [R3] e 2026 b4 [R2];
  - SP 2025 b6 e 2026 b4 [R2];
  - RJ 2025 b6 e 2026 b4 [R5].
- Para MG e DF (2026 b4), a revisão crítica registra a presença da célula, mas não a conferência das identidades [R7]. Conferido na revisão, com aritmética decimal sobre as amostras brutas de E16: I1 e I2 valem exatamente para MG e DF 2026 b4 e também para o RJ (b6 de 2015, 2018, 2019, 2020 e 2021) e a União (2019 b6). Exemplos:
  - MG 2026 b4: `65774134688.99` + `10280365549.08` = `76054500238.07` (I1); `76054500238.07` + `9139532471.63` = `85194032709.7` (I2), em `rreo_31_2026_b4_a01.json`.
  - DF 2026 b4: `22130960819.03` + `1228269893.77` = `23359230712.8` (I1); `23359230712.8` + `2106786216.6` = `25466016929.4` (I2), em `rreo_53_2026_b4_a01.json`.
- Exemplos:
  - União 2025 b6: `3606510496180.06` + `30097098735.26` = `3636607594915.32` [E05, E06, R3].
  - RJ 2026 b4: `65960575113.15` + `5171255819.15` = `71131830932.30` [E13, R5].
- **Não são regras de ativação:**
  - `TotalDespesas` = Subtotal + refinanciamento. Serve só como informação, e a linha de refinanciamento falta em vários entes.
  - Conferências entre anexos diferentes, que podem divergir em centavos. Exemplo: liquidado (IX) da União com `3705420381699.75` no Anexo 01 e `3705420381699.76` no Anexo 02 [R3].

### 7.5 Ativação e falhas

Implementado em `src/server/ingestion/executar.ts` e `src/server/ingestion/store.ts`.

| Situação | Resultado |
|---|---|
| Todas as verificações bloqueantes passam | O snapshot é ativado numa transação: o anterior passa a `substituido` e o novo a `ativo`, sem estado intermediário visível. O anterior fica no histórico; nada é apagado. |
| Verificações bloqueantes passam, mas uma identidade dos grupos falha | Ativado do mesmo modo, com `composicaoConsistente` = `false`: o indicador é publicado e a composição por grupo fica oculta (seção 4, regra 8). |
| Conteúdo igual ao do snapshot ativo (mesmo hash canônico) | Nenhum snapshot novo é criado; só a data da última conferência é atualizada. Repetir a ingestão não muda os totais. O status do extrato é promovido para o ativo, exceto dentro da janela de confirmação de retificação (seção 9.3). |
| Alguma verificação bloqueante falha | O snapshot é gravado como `rejeitado`, com o resultado das verificações, e não é ativado. O motivo é registrado na execução e o ativo anterior continua valendo. Sem ativo anterior, a interface mostra "sem dado" (situação `sem_dado_validado`, seção 8). |
| Conteúdo idêntico a um snapshot já rejeitado | **Reavaliação.** As verificações rodam de novo com as regras vigentes. Se o conteúdo ainda falha, nenhum snapshot novo é gravado: o rejeitado só ganha nova data de conferência e o erro é registrado de novo. Se agora passa (por exemplo, depois de uma mudança das regras), é gravado e ativado como versão nova. |
| Chave repetida ou resposta sem células | A resposta bruta fica guardada, mas nenhum snapshot é gravado (seções 7.1 e 7.3). O erro é registrado e o ativo anterior continua. |
| Payload inválido, item fora do recorte, paginação anômala ou lote incompleto (uma página falha) | Nada é gravado para a declaração além do registro de cada requisição. O ativo anterior continua. |
| Falha na fonte (rede, timeout, 5xx ou HTTP 429 depois das retentativas) | Nada muda: o último ativo continua. Um HTTP 502 já foi observado num endpoint de metadados [R7]. Os 429 da CDN estão descritos na seção 9.3. |
| Extrato de entregas | É coletado e guardado como histórico a cada execução, independentemente da ativação de snapshots. Se o extrato de um ente falhar, nenhuma declaração desse ente e exercício é coletada naquela execução. |
| Situação da execução | `falhou` (código de saída 1) se nenhum extrato foi lido, ou se havia coletas planejadas e nenhuma foi concluída (ativada ou sem mudança). Caso contrário, `concluida_com_falhas` se houve algum erro e `concluida` se não houve. Só execuções `concluida` ou `concluida_com_falhas` finalizadas contam como última atualização concluída em `/fontes` (`ultimaExecucao` em `src/server/repositories/rreo.ts`, usada por `src/server/services/fontes.ts`). |

---

## 8. Ausência de dado

**Ausência não é zero.** O PortalDash exibe "sem dado" e o motivo. Um "sem dado" nunca vira 0 em somas, ordenações ou gráficos, e o ente continua visível nas tabelas comparativas. O cartão do indicador sem dado, o aviso de cobertura e o estado de recorte vazio trazem também a frase "Ausência de dado não significa despesa zero." (`src/components/dashboard/ExpenseIndicator.tsx`, `src/components/dashboard/CoverageNotice.tsx` e `src/components/ui/estados.tsx`).

### 8.1 Situação de cada ente, por período (Implementado)

Cada valor de ente e período tem uma `situacao` na API v1, decidida em `src/server/services/despesas.ts` (`indicadorDoEnte`). A série do exercício (`serieExercicio`) usa a mesma regra, ponto a ponto. Os textos exibidos estão em `src/lib/situacao.ts`: o rótulo curto aparece na tabela comparativa de estados e na tabela do gráfico de evolução (nesta, como "sem dado (rótulo curto)"); a explicação aparece no cartão do indicador.

| `situacao` | Quando | Rótulo curto | Explicação exibida |
|---|---|---|---|
| `disponivel` | Há versão validada e ativa com a célula do indicador | — (mostra o valor) | — |
| `sem_dado_validado` | O extrato coletado registra a entrega do bimestre, mas não há versão validada: ainda não coletada, coleta com falha ou conteúdo rejeitado nas verificações | "entregue; sem versão validada" | "O extrato do Siconfi registra a entrega deste período, mas o PortalDash ainda não tem uma versão coletada e validada." |
| `sem_registro_de_entrega` | O PortalDash tem extrato coletado do ente e do exercício, e ele não registra a entrega deste bimestre | "sem entrega no extrato coletado" | "O extrato do Siconfi coletado pelo PortalDash não registra a entrega deste período. A situação pode ter mudado depois da última coleta." |
| `nao_coletado` | O PortalDash não tem extrato coletado do ente e do exercício | "não coletado pelo PortalDash" | "O PortalDash não coletou o extrato de entregas deste ente para este exercício. Nada se pode afirmar sobre a entrega." |

Detalhes da regra:

- A decisão usa a observação mais recente do extrato guardada em `entregas_observadas` (`entregasDoExercicio` em `src/server/repositories/rreo.ts`), só com entregas bimestrais do RREO. Como só essas entregas são guardadas, um extrato coletado sem nenhuma entrega bimestral do RREO no exercício também resulta em `nao_coletado`.
- O extrato só registra a entrega; não prova que o `/rreo` já serve o conteúdo (defasagem, seção 5.2).
- Fonte indisponível **com** versão ativa anterior: o valor ativo continua `disponivel`, com as datas de coleta e de última conferência visíveis (seção 5.2), o que torna explícito há quanto tempo o dado não é confirmado.
- Fonte indisponível **sem** versão ativa: `sem_dado_validado` se o extrato já registrou a entrega; `nao_coletado` se nem o extrato foi coletado. Não há situação própria de "fonte indisponível".
- Célula ausente numa declaração existente: a célula simplesmente não vem; não chega como `null` [R1, R3, R5]. Célula obrigatória ausente rejeita a versão (seção 7.2); grupo da composição ausente aparece como "sem dado" no grupo (seção 4).
- Na fonte, um período ainda não entregue ou inexistente devolve HTTP 200 com `items` vazio; exemplo RJ 2026 b5 [E14, R5]. A ingestão não consulta o `/rreo` para bimestres sem entrega no extrato (seção 7.1).

### 8.2 Recorte sem dados e indisponibilidade (Implementado)

- **Períodos disponíveis por escopo** (`periodosDisponiveis` e `escolherPeriodo`): `/brasil` considera todos os entes e, sem bimestre explícito, prefere o período mais recente que tenha a União; `/estados` considera só os 27 entes estaduais (26 estados e o DF); `/estados/{uf}` considera só o próprio ente. O seletor de período da interface lista só os períodos com dado no escopo.
- **Recorte explícito sem dados.** Com `ano` e `bimestre` informados e nenhuma declaração ativa no escopo, inclusive para um bimestre que ainda não terminou, a API responde HTTP 404 com o código `sem_dados` ("Não há dados validados para o recorte solicitado", `src/server/api/respostas.ts`). A página mostra "Ainda não há dados validados para este recorte" (`src/components/ui/estados.tsx`). Nenhum valor é inventado nem substituído por outro período.
- **Banco indisponível.** A API responde HTTP 503 com o código `indisponivel` ("Dados temporariamente indisponíveis"), sem detalhes internos. As páginas lançam erro para o error boundary (`src/app/error.tsx`), que mostra "Dados temporariamente indisponíveis" e um botão para tentar de novo, sem exibir número algum.

### 8.3 Ausência na fonte e publicação oficial

Ausência na fonte não é zero **nem** prova de que a linha não existe na publicação oficial. No RREO da União 2025 b6 [R4, R7]:

- a Reserva de Contingência tem pagas 0 no PDF e nenhuma célula no Siconfi;
- a linha intraorçamentária "Demais Despesas Correntes" (1.227.470 mil pagos) existe no PDF e não tem `cod_conta` próprio no Siconfi. O mesmo valor aparece no Siconfi na linha-mãe `OutrasDespesasCorrentesIntra` [R4]. A subdivisão some, mas o valor não se perde.

---

## 9. Retificações, versões e datas

### 9.1 O que a fonte oferece, e o que não oferece

- O `/rreo` **não tem** campo de versão, de status nem de data, e devolve uma única versão de cada célula. **Inferência:** é a versão vigente [R3, R5].
- O `/extrato_entregas` traz `status_relatorio` (`HO` ou `RE`), `data_status`, `forma_envio` e `tipo_relatorio`, com uma linha por (entregável, período, instituição). Não guarda histórico nem a data original da entrega [R2, R7]. A falta de histórico é inferida pela ausência de linhas repetidas [R5].
- O significado de `data_status` é ambíguo. Em SP, o 1º bimestre de 2026 está RE em `2026-06-02T16:09:31Z`, depois do 2º bimestre (HO em `2026-05-29T14:14:24Z`). Na União, o 1º bimestre de 2025 está HO em `2025-05-09T22:31:07Z`, data posterior ao fim do bimestre seguinte. Uma data HO, portanto, pode não ser a da entrega original [R2].
- As respostas passam por um CDN com TTL desconhecido. `ETag` e `If-None-Match` funcionam: foi observado um 304 [R1].
- **Conclusão:** só pela fonte não dá para saber se um valor coletado é anterior ou posterior a uma retificação, nem recuperar versões antigas [R7]. O histórico existe apenas a partir do que o PortalDash coletou.

### 9.2 Retificações observadas no RREO

Fonte: extratos [E18, E19, E20, R2, R5, R6].

| Ente | Exercício e bimestre | Status | `data_status` |
|---|---|---|---|
| RJ (33) | 2023, 6º | RE | `2024-07-03T22:30:39Z` |
| RJ (33) | 2025, 1º | RE | `2025-06-18T22:31:27Z` |
| RJ (33) | 2025, 6º | RE | `2026-05-06T17:14:12Z` |
| RJ (33) | 2026, 1º | RE | `2026-03-30T11:28:18Z` |
| RJ (33) | 2026, 2º | RE | `2026-05-29T12:32:07Z` |
| SP (35) | 2025, 1º | RE | `2025-07-28T17:56:58Z` |
| SP (35) | 2025, 6º | RE | `2026-04-16T16:07:44Z` |
| SP (35) | 2026, 1º | RE | `2026-06-02T16:09:31Z` |
| DF (53) | 2025, 6º | RE | `2026-05-08T16:59:04Z` |
| União (1) | 2025, 1º a 6º; 2026, 1º a 4º | todos HO | 6º/2025: `2026-01-30T22:36:41Z` |

Os demais estados estão com 2026, 1º a 4º bimestre, todos HO. O 6º bimestre de 2025 **não foi verificado** para 24 dos 28 entes [R2, R7].

- **Fato:** no 6º bimestre de 2025, SP, RJ e DF estão RE com `data_status` entre `2026-04-16` e `2026-05-08`, na mesma data ou a um dia da MSC de Encerramento, e no DF também da DCA [R2]. **Inferência:** os valores do 6º bimestre podem mudar meses depois do prazo. Nenhum valor anterior ou posterior a uma retificação foi observado [R2, R7].
- **Retificação sem mudança visível nos totais (RJ 2023 b6).** A declaração está RE desde `2024-07-03T22:30:39Z`, depois da emissão do PDF (24/01/2024), e ainda assim as linhas de total do Anexo 01 do Siconfi são idênticas ao PDF [E15, E20, E23, R6]. **Inferência de R6:** a retificação mexeu em outros anexos ou subcontas. **Ressalva de R7:** isso não prova que o Anexo 01 ficou intacto. Não se sabe qual versão o `/rreo` serve, e o PDF lido é uma cópia do Wayback (captura de 2025-01-18) de um arquivo da pasta `/2024/01/`. Não dá para saber quais células mudaram.
- **Republicação sem RE (União).** O RREO de dezembro de 2025 foi republicado pelo Tesouro: arquivo `12_ RREODez2025 (REPUBL_).pdf`, página "Publicado em 30/05/2026", `Last-Modified` 2026-07-17. Mesmo assim, o extrato continua com HO em `2026-01-30T22:36:41Z`, sem RE [E21, R3, R7]. No PDF, só as páginas do Anexo 4/FCDF e do Anexo 14 trazem a marca de republicação; a do Anexo 1 não traz [R4]. Há duas divergências com a API, com explicações diferentes e nenhuma verificada:
  - **FCDF:** as despesas previdenciárias pagas somam 10.050.645 mil no PDF, contra `4940304484.05` na API [R3, R7]. **Inferência de R3:** a API mantém a versão homologada em jan/2026 e não reflete a republicação.
  - **Empenhado do Anexo 1:** 12 células de empenhado e saldo divergem de 7 a 8 mil; no total (XIII), PDF 5.379.398.678 mil contra API `5379398670922.43`. O Anexo 14 do mesmo PDF traz 5.379.398.671 mil, igual à API [R4, R7]. **Hipótese de R4:** aqui é o PDF que mantém um valor anterior ao enviado ao Siconfi.

  Conclusão: a publicação oficial e o Siconfi podem divergir em qualquer sentido. O PortalDash informa o valor do Siconfi e não supõe qual dos dois é o mais novo.

### 9.3 Como o PortalDash trata as versões

1. Cada coleta de uma declaração gera uma resposta bruta (deduplicada) e, se o conteúdo mudou, um snapshot novo. Ele só é ativado depois de passar pela seção 7. Snapshots anteriores ficam no histórico e nunca são apagados.
2. O extrato (`status_relatorio`, `data_status`) é registrado a cada coleta, o que cria um histórico próprio de status que a fonte não oferece.
3. A interface mostra:
   - o valor do snapshot ativo;
   - o status mais recente coletado (Homologado ou Retificado);
   - a `data_status`;
   - a data de coleta.
4. Mudança de `status_relatorio` ou de `data_status` no extrato dispara nova coleta da declaração. Também há recoleta periódica com `If-None-Match`/`ETag`, numa frequência pendente (D10). As requisições são sempre sequenciais, com intervalo mínimo de 1,1 s, abaixo do limite documentado de 1 requisição por segundo [E01].
5. **Lacuna:** não há garantia de que o conteúdo servido pelo `/rreo` e o status do extrato sejam do mesmo instante, por causa do cache do CDN e da defasagem desconhecida [R7]. O par status e valor exibido é uma aproximação.
6. Uma retificação feita pelo ente **não é** uma correção do PortalDash. Correções do PortalDash ficam na seção 18.

**Exibição do histórico (provisória até a decisão D5):** na v0.1.0, o histórico de snapshots fica guardado e não é exibido.

---

## 10. Comparabilidade

### 10.1 União × estados: lado a lado, nunca somados

- **Mesma estrutura.** No Anexo 01 de 2026 b4, União e SP têm os mesmos 15 campos, as mesmas 16 colunas e 21 `cod_conta` comuns na coluna de pagas [E08, E09, R2].
- **Nunca somados.** Não há total nacional consolidado nem soma de estados (seção 13).
- **Dupla contagem.** Transferências intergovernamentais aparecem como despesa paga de quem transfere:
  - a União pagou `531673082300.42` em "Transferências a Estados, DF e Municípios" até 2026 b4 [E08, R2];
  - SP tem a linha `TransferenciasAMunicipios` [R2].

  **Inferência conceitual** (R2 a registra como "inferência, a validar"; R7 a adota como motivo para não somar): se o estado gasta o dinheiro recebido, ele reaparece como despesa do estado, e somar União e estados contaria duas vezes. A receita correspondente nos entes recebedores não foi levantada [R2, R7].
- **Estruturas diferentes, mesma linha.** União e RJ têm linha de refinanciamento; SP, MG e DF (2026 b4) não têm [R7]. O indicador exclui o refinanciamento em todos, o que torna a linha comparável [R7]. Os numerais romanos diferem: "(IX)" na União e "(VIII)" nos estados. A seleção usa o `cod_conta`, não o texto [R2].
- **Subcontas exclusivas não se comparam** (seção 4).
- **Cobertura.** A célula do indicador foi confirmada em 5 dos 28 entes (seção 7.2). Os demais dependem da ingestão.

### 10.2 Distrito Federal e FCDF: lacuna

- O DF é o `id_ente` `53`, com `esfera` `D` em `/entes` e `E` no `/rreo` [R7].
- Há um "demonstrativo do FCDF" no RREO da União, e o Anexo 04.2 da União traz receitas e despesas previdenciárias do RPPS civil e do FCDF [R3, R7].
- A interação entre as despesas da União pelo Fundo Constitucional do DF e as despesas do DF **não foi investigada** [R7].
- **Hipótese não verificada:** parte do gasto público ligado ao DF pode ser executada no orçamento da União via FCDF. Nesse caso, o valor do DF no Siconfi não representaria todo o gasto público no DF, e uma soma União + DF poderia duplicar ou omitir valores.
- **Enquanto a lacuna estiver aberta:** o DF aparece com o aviso AV-12, e nenhuma conclusão sobre o "tamanho" do gasto do DF frente aos estados é apresentada.

### 10.3 Entre estados

- Compara-se só o mesmo indicador no mesmo (exercício, bimestre).
- Cada ente aparece com seu próprio status (HO ou RE) e suas próprias datas. Diferenças de situação não são escondidas.
- Ente sem dado aparece como "sem dado". Nunca é excluído em silêncio nem tratado como zero.

### 10.4 No tempo

- **Validado:** ano contra ano no mesmo bimestre e no mesmo ente, para 2025 e 2026. O `cod_conta` e a coluna estão estáveis nesses anos na União, em SP e no RJ [R7].
- **Quebras históricas conhecidas** [R7]:
  - `TotalDespesas` mudou de significado entre 2019 e 2020: antes incluía o superávit (seção 3.2). Conferido na revisão (amostras de E16): nos anos observados até 2019, o rótulo é `TOTAL (XIV) = (XII + XIII)` no RJ (2015, 2018, 2019) e `TOTAL (XV) = (XIII + XIV)` na União (2019). O efeito numérico depende de haver célula de superávit na coluna (j): há no RJ 2018 e 2019, mas não no RJ 2015 nem na União 2019. Nesses dois casos, o `TotalDespesas` coincide com o subtotal mais o refinanciamento, quando existe essa linha;
  - em 2019, valores inteiros. No RJ, 577 de 696 valores do Anexo 01 são inteiros [R7]. Na União, 587 de 878, e entre eles está a própria célula do indicador: `DespesasExcetoIntraOrcamentarias` (j) = `2198252453508` (conferido na revisão em `rreo_1_2019_b6_a01.json`; R7 chama esse valor de "total pago", mas o `TotalDespesas` (j) da amostra é `2710907655987`). Como a fonte omite zeros finais, um inteiro isolado pode ser `,00`. A proporção é que indica valores sem centavos (interpretação de R7).
- O conjunto de anexos e colunas também varia com o período: a coluna (k) e os anexos 09, 10 e 11 só aparecem no 6º bimestre [R3, R5]. A ingestão não pode supor um esquema fixo. Sobre uma afirmação de R7 a respeito da coluna (k) em anos antigos, ver a seção 16, item 10.
- **Séries de muitos anos não estão validadas** (seção 13).

### 10.5 Entre demonstrativos e com publicações oficiais

- **DCA × RREO:** mesmo rótulo, escopo diferente (seção 6). A DCA é anual e sai cerca de 4 meses depois do fim do exercício [R2, R7].
- **Anexo 02 (função e subfunção) não tem coluna de pagas** [R3, R5].
- **RREO oficial da União × Siconfi:** o PDF é mensal e em R$ mil; o Siconfi é bimestral e em reais com centavos [R3, R4, R7].

---

## 11. Valores nominais, per capita e precisão

### 11.1 Valores nominais

Todos os valores estão em **reais correntes** de cada período, sem correção pela inflação. A comparação entre anos é nominal (aviso AV-06). Valores reais dependem de decisão sobre índice, data-base e fonte, e a fonte do índice não foi validada (D4) [R7].

### 11.2 Sem per capita

O PortalDash não calcula valores per capita na v0.1.0. Motivos [R1, R3, R5, R7]:

- o campo `populacao` do Siconfi não tem fonte nem safra documentadas;
- o valor da União (`8569324`) é anômalo. R1, R2 e R3 registram que não corresponde à população do país, mas nenhuma fonte de população foi consultada;
- no estado do RJ, o mesmo `16615526` aparece no RREO de 2025 e de 2026, na DCA de 2025 e em `/entes` 2026.

Calcular per capita exigiria uma fonte externa de população (IBGE) e uma decisão (D4).

### 11.3 Precisão

**Na fonte:**

- `valor` vem como número JSON, com até 2 casas decimais e zeros finais omitidos (por exemplo `111309173975.1`) [R5].
- O contrato declara o campo como "type: integer, format: float" [R2].
- Há valores negativos em outras linhas [R1, R5].
- Não foi observada notação exponencial [R1].

**No PortalDash:**

- O texto exato do token é preservado em `valor_texto`, e o valor é gravado também em `NUMERIC`. Nenhum cálculo usa ponto flutuante.
- A API v1 serializa valores monetários como **string decimal**.
- O arredondamento acontece só na exibição. Armazenamento, cálculos e identidades usam o valor exato.

**Precisão variável por ano e ente.** Em 2019 há valores inteiros (seção 10.4). Esses anos estão fora do escopo validado.

**Publicações oficiais:**

- A da União é em R$ mil, e a reconciliação vale só com precisão de R$ 1 mil [R4].
- O PDF do RJ de 2023 é em R$ 1,00 e bateu ao centavo [R6].

A precisão de exibição (por exemplo, R$ bilhões com uma casa decimal) está pendente (D11).

---

## 12. Reconciliações realizadas e seus limites

| # | Item | Siconfi | Publicação oficial | Resultado | Limites |
|---|---|---|---|---|---|
| 1 | **União, 2025, 6º bim.**, Anexo 01, coluna (j) | `TotalDespesas` `5054245956518.39`; `DespesasExcetoIntraOrcamentarias` `3606510496180.06` [E05, E06] | RREO dez/2025 (republicação), Anexo 1, p. 14 impressa, "Até o Mês (j)": 5.054.245.957 e 3.606.510.496 (R$ mil) [E21] | Igual após arredondar o Siconfi ao milhar (half-up). Resíduo do total: R$ −481,61. As 28 linhas de pagas presentes nos dois lados batem; o maior resíduo é 0,48 mil [R4]. | Precisão de R$ 1 mil; centavos não verificáveis. O PDF é uma republicação, e a versão original não foi comparada; a página do Anexo 1 não traz a marca de republicação [R4]. Duas linhas do PDF não têm célula própria no Siconfi: a Reserva de Contingência e a "Demais Despesas Correntes" intraorçamentária, cujo valor aparece em `OutrasDespesasCorrentesIntra` [R4, R7]. **Inferência:** isso explica por que R4 cita 28 linhas comparadas e R7 cita 30 linhas de pagas. Empenhado e saldo divergem de 7 a 8 mil em 12 células [R7]: conciliar uma coluna não valida as outras. |
| 2 | **União, 2026, 4º bim.**, Anexo 01, coluna (j) | `TotalDespesas` `3999925192391.91`; `DespesasExcetoIntraOrcamentarias` `2821965337713.47`; refinanciamento `1141059765822.79` [E08] | RREO ago/2026, Anexo 1, p. 15 impressa: 3.999.925.192; 2.821.965.338; 1.141.059.766 (R$ mil) [E22] | 13 linhas conferidas pela revisão crítica, todas iguais após o arredondamento [R3, R7] | Precisão de R$ 1 mil |
| 3 | **RJ, 2023, 6º bim.**, Anexo 01 | `TotalDespesas` (j) `99217095187.47` [E15] | SEFAZ-RJ, RREO Anexo 1, emissão 24/01/2024, em R$ 1,00: 99.217.095.187,47 [E23] | Igual ao centavo. Nas linhas de total (I, II, III, V, VIII, IX, X, XI, XII, XIV), 86 de 88 células são iguais, inclusive a linha VIII do indicador. As 2 diferentes estão na linha XIV ("total com superávit"), sem célula no Siconfi [R6]. | Cópia do Internet Archive, não do servidor da SEFAZ. Só linhas de total. Subcontas do refinanciamento e percentuais não conferem [R6]. Exercício antigo, fora do escopo atual. A declaração está RE desde 2024-07-03 [E20]. |
| 4 | **RJ, 2025** (só corroboração) | `TotalDespesas` (j), 2025 b6: `112864466427.83` [E11] | Prestação de Contas 2025, Vol. 01, p. 62, "Despesa Paga 112.864.466" (R$ mil, inclui intraorçamentárias) [E24] | Coerente ao milhar | **Não é o RREO e não é reconciliação exata** [R6] |

**Conferências internas** (dentro da própria fonte, não contra publicação externa):

- O Anexo 14 ("Despesas Pagas") repete o `TotalDespesas` do Anexo 01 na União 2025 b6 e no RJ, nos dois períodos [R3, R5].
- No RJ, a soma das pagas do Anexo 06 bate com a linha XII do Anexo 01 [R5].
- O Anexo 14 da União tem inconsistências próprias e não deve ser usado como fonte primária [R3].

**Limites gerais:**

- Nenhum estado foi reconciliado para 2025 ou 2026. A SEFAZ-RJ bloqueou o IP da coleta, devolvendo HTTP 200 com página de bloqueio [E25, R5, R6]. As edições do diário oficial do RJ consultadas não traziam o RREO [R6].
- SP, MG e DF não foram reconciliados com publicações oficiais [R7].
- A célula do indicador não foi observada nos outros 23 estados [R7].
- Parte dos relatórios da Etapa 1 chegou truncada à revisão crítica. Afirmações que só existiam no texto truncado não foram checadas [R7].

---

## 13. Recortes validados e não validados

### 13.1 Validados (podem ser publicados com os avisos da seção 14)

| Recorte | Condições e ressalvas | Evidência |
|---|---|---|
| União: indicador acumulado até o bimestre | Reconciliado com o RREO oficial do Tesouro em R$ mil (2025 b6 e 2026 b4) | [E05, E06, E08, E21, E22, R4, R7] |
| Estados e DF: mesmo indicador e mesmo (exercício, bimestre), **lado a lado, sem soma** | Célula confirmada em SP, RJ, MG e DF. Para cada UF, a ingestão confirma presença e identidades antes de publicar. Reconciliação externa estadual só no RJ 2023 b6. | [R2, R6, R7] |
| Curva acumulada no ano (b1→b6) do mesmo ente e exercício | Acumulados em sequência, sem diferenças entre bimestres | [R7] |
| Ano contra ano, mesmo bimestre e ente | Nominal; aviso de possível retificação; `cod_conta` e coluna estáveis em 2025 e 2026 (União, SP, RJ) | [R7] |
| Composição pelos grupos comuns do Anexo 01, dentro de um ente | Os 8 `cod_conta` da seção 4; reconciliados na União; subcontas exclusivas fora | [R4, R7] |

### 13.2 Não validados (não são publicados)

| Recorte | Motivo | Evidência |
|---|---|---|
| Despesas pagas "no bimestre" (valor isolado) | Não existe na fonte. Pela diferença b(n) − b(n−1), mistura versões possivelmente distintas, porque retificações não são rastreáveis no `/rreo`. | [R1, R7] |
| Séries mensais (derivadas ou via MSC) | A fonte é bimestral. O mapeamento da MSC para "despesa paga" é desconhecido e não foi reconciliado com o RREO. | [R2, R7] |
| Soma dos 27 estados | Anexo 01 baixado só para 4 entes estaduais. Não há regra para UF faltante ou retificada. As estruturas diferem (linha de refinanciamento). Transferências a municípios entram como despesa. | [R7] |
| Total nacional consolidado (União + estados + municípios) | A fonte não consolida. Há dupla contagem (`531673082300.42` transferidos pela União até 2026 b4). Municípios não foram cobertos. FCDF e DF não foram investigados. | [E08, R7] |
| Pagas por função ou subfunção, bimestral | O RREO-Anexo 02 não tem coluna de pagas. O `cod_conta` é genérico, e a função só aparece como texto. | [R3, R5, R7] |
| Pagas por função, anual (DCA-Anexo I-E) | Os dados existem, mas são anuais, saem cerca de 4 meses depois do exercício, e o "exceto intra" da DCA inclui refinanciamento. Exige definição própria e decisão. | [E17, R2, R7] |
| `TotalDespesas` como manchete | Inclui refinanciamento e incluía superávit até 2019. O significado não é estável. | [R7] |
| Série histórica de vários exercícios (6º bimestre de vários anos) | Verificada só no RJ (2015, 2018 a 2021, 2023, 2025) e na União (2019, 2025). Há quebra entre 2019 e 2020 (significado de `TotalDespesas`), valores sem centavos em 2019 e o 6º bimestre retificado meses depois. Sem reconciliação externa para anos antigos, exceto RJ 2023. | [R7] |
| Per capita | `populacao` sem fonte nem safra; valor anômalo na União; exige IBGE e decisão | [R7] |
| Valores reais (corrigidos pela inflação) | Índice, data-base e fonte do índice não validados; é decisão de produto | [R7] |
| Comparação de subcontas exclusivas de um ente | As subcontas não são comuns entre entes | [R2, R7] |
| Educação e saúde (mínimos constitucionais) | Os Anexos 08 e 12 do RREO não constam no contrato nem em `/anexos-relatorios`; nenhuma consulta foi tentada | [R1, R7] |
| Restos a pagar pagos somados às pagas do exercício | É outro conceito (Anexo 07, colunas próprias) e não foi reconciliado | [R3, R5, R7] |
| Municípios e consórcios | Fora do escopo. O RREO Simplificado não foi observado. São 5.570 municípios, a 1 requisição por segundo. | [R1, R7] |

---

## 14. Avisos obrigatórios na interface

Os textos abaixo são a base. A redação final pode ser ajustada, mas não pode perder conteúdo. Os mesmos avisos acompanham as respostas da API v1.

| ID | Onde aparece | Texto-base |
|---|---|---|
| AV-01 | Sempre junto ao indicador | "Valor acumulado de 1º de janeiro até o fim do {n}º bimestre de {ano}. Não é o gasto do bimestre; não some bimestres." |
| AV-02 | Sempre junto ao indicador | "Fonte: Siconfi/Tesouro Nacional, RREO Anexo 01 (Balanço Orçamentário), coluna 'Despesas pagas até o bimestre (j)', linha 'Despesas (exceto intraorçamentárias)'. Dados declarados pelo próprio ente." |
| AV-03 | Sempre junto ao valor de cada ente | "Situação no Siconfi: {homologado \| retificado} em {data_status}. Coletado pelo PortalDash em {data_coleta}. O ente pode retificar a declaração depois." Exibir a data do status sem sugerir precisão de fuso, que não foi confirmado [R7]. |
| AV-04 | Sempre junto ao indicador | "Não inclui refinanciamento da dívida, despesas intraorçamentárias nem pagamento de restos a pagar de anos anteriores." |
| AV-05 | Sempre que União e estados aparecem juntos | "União e estados aparecem lado a lado e não devem ser somados: transferências da União a estados e municípios são despesa da União e podem reaparecer como despesa de quem as recebe (dupla contagem)." |
| AV-06 | Sempre junto ao indicador | "Valores nominais, em reais correntes, sem correção pela inflação." |
| AV-07 | Onde houver "sem dado" | "Sem dado: a fonte não tem este valor, ou ele ainda não foi validado pelo PortalDash. Ausência não significa zero." |
| AV-08 | Visões da União | "O relatório oficial da União publicado pelo Tesouro é mensal e em R$ mil. Aqui aparecem só os acumulados de fim de bimestre, em reais, como estão no Siconfi." |
| AV-09 | Sempre, enquanto D1 estiver pendente | "Metodologia v0.1.0: a escolha da linha principal é provisória e pode mudar." |
| AV-10 | Composição por grupos | "Os grupos são partes do total exibido; não some grupos com o total." |
| AV-11 | Comparação entre anos | "Comparação em valores nominais. Um dos períodos pode ter sido retificado pelo ente." |
| AV-12 | Visões do DF | "A relação entre as despesas do DF e o Fundo Constitucional do DF, pago pela União, ainda não foi investigada." |

O valor exato, em reais e centavos, fica disponível na tabela e na API, mesmo quando a exibição principal é arredondada.

Observações sobre os avisos:

- **AV-04:** a exclusão do pagamento de restos a pagar de anos anteriores é uma **inferência**, ainda não confirmada no MDF (seções 2.2 e 16, item 1). Se a leitura do MDF a contrariar, o AV-04 e a seção 6 mudam, e a mudança entra no histórico (seção 17).
- R7 propõe também um aviso sobre valores sem centavos em exercícios antigos. Ele não entra na lista porque a v0.1.0 não publica anos anteriores a 2025 (D3). Volta a ser obrigatório se D3 incluir esses anos (seção 10.4).

---

## 15. Decisões pendentes de Gabriel

| ID | Decisão | Opções registradas na Etapa 1 [R7] | Comportamento na v0.1.0 enquanto pendente |
|---|---|---|---|
| **D1** | **Linha-manchete** | (a) `DespesasExcetoIntraOrcamentarias`, recomendada pela revisão crítica; (b) `SubtotalDasDespesas`, que inclui intraorçamentárias. `TotalDespesas` foi descartada. Sub-decisão: juros e amortização ficam dentro da manchete ou aparecem destacados? | (a), marcada como provisória (AV-09) |
| **D2** | **Agregações** | Permitir "soma dos estados" ou "Brasil"? Se sim: rótulo, aviso de dupla contagem e regra para UF que não entregou ou está desatualizada | Nenhuma agregação; só lado a lado |
| **D3** | **Profundidade histórica** | A partir de qual exercício? Há quebra estrutural entre 2019 e 2020 e valores sem centavos em 2019. | **Proposta:** publicar só 2025 e 2026, cuja estrutura foi verificada |
| **D4** | **Valores reais e per capita** | Índice, data-base e fonte para correção. Fonte de população externa ao Siconfi. | Só valores nominais; sem per capita |
| **D5** | **Política de exibição de retificações** | Mostrar só o último valor com selo "retificado em", ou também o histórico de versões coletadas? O que mostrar quando o 6º bimestre for retificado meses depois? | Valor do snapshot ativo + status + `data_status` + data de coleta; histórico guardado e não exibido |
| D6 | Apresentação temporal | Mostrar só o acumulado (recomendado) ou também derivar "no bimestre" por diferença, com aviso | Só o acumulado |
| D7 | Escopo de entes | Planejar municípios? (RREO Simplificado; cerca de 1,5 h de ingestão por período a 1 req/s) | Só União, estados e DF |
| D8 | Visão anual por função (DCA) | Incluir ou não. O conceito difere do RREO, e a defasagem é de cerca de 4 meses. | Não incluída |
| D9 | Tratamento do DF | `esfera` `D` × `E`; possível interação com o FCDF pago pela União | DF exibido com aviso AV-12 |
| D10 | Frequência de atualização | Com que frequência recoletar, e o que mostrar entre a homologação e a disponibilidade no `/rreo` | A definir na operação; data de coleta sempre exibida |
| D11 | Precisão de exibição | Por exemplo, R$ bilhões com 1 casa | Valor exato na tabela e na API; formato de destaque a definir |

---

## 16. Lacunas abertas e próximos passos de validação

Os itens 1 a 8 foram extraídos de R7. Os itens 9 a 11 foram levantados na redação e na revisão deste documento.

1. Ler o MDF vigente da STN para confirmar a definição da coluna (j), inclusive a exclusão de restos a pagar, e a quebra estrutural de 2020.
2. Ingestão-piloto do Anexo 01 para os 28 entes (2026 b1 a b4 e 2025 b1 a b6), aplicando as validações da seção 7 a cada resposta.
3. Rodar `/extrato_entregas` de 2025 para os 24 entes ainda não verificados.
4. Reconciliar ao centavo pelo menos 3 estados (2026 b4 ou 2025 b6) com a publicação oficial de cada SEFAZ ou diário oficial, com e sem linha de refinanciamento (por exemplo RJ, MG e um estado do Nordeste).
5. Investigar a relação entre DF e FCDF.
6. Monitorar retificações e medir a defasagem real entre `data_status` e a disponibilidade no `/rreo`.
7. Consultar a STN (E-Serviços) sobre:
   - qual versão o `/rreo` serve depois de uma retificação;
   - o fuso de `data_status`;
   - como republicações se propagam (caso da União 2025 b6);
   - a origem do campo `populacao`;
   - a política de bloqueio por excesso de requisições.
8. Mapear a estrutura do Anexo 01 nos anos desejados antes de decidir a profundidade histórica (D3).
9. As evidências brutas da Etapa 1 estão no diretório temporário da sessão de trabalho, fora do repositório. Arquivá-las num local durável e versionado é uma pendência.
10. **Inconsistência nas evidências.** R7 afirma que a coluna `INSCRITAS EM RESTOS A PAGAR NÃO PROCESSADOS (k)` não existe no Anexo 01 do 6º bimestre do RJ em 2019, 2020 e 2021, nem da União em 2019. As amostras brutas salvas pela própria revisão (`siconfi\revisao\rreo_33_2019_b6_a01.json`, `rreo_33_2020_b6_a01.json`, `rreo_33_2021_b6_a01.json` e `rreo_1_2019_b6_a01.json`, coleta E16) contêm uma coluna com esse texto exato. Conferido na revisão: de 15 a 26 células nessa coluna em cada uma das quatro amostras. Este documento não usa essa afirmação de R7. A coluna (k) não interfere no indicador.
11. **Rótulo trocado em R7.** R7 chama de "total pago" da União em 2019 o valor `2198252453508`. Na amostra bruta (`rreo_1_2019_b6_a01.json`), esse é o valor de `DespesasExcetoIntraOrcamentarias` na coluna (j); o `TotalDespesas` é `2710907655987` (seção 10.4). O argumento de R7 sobre valores inteiros continua válido, e a célula afetada é justamente a do indicador.

---

## 17. Versionamento da metodologia

### 17.1 Política (Proposta, a aprovar)

- A metodologia tem versão própria no formato `MAJOR.MINOR.PATCH`, **independente da versão do software**. A versão aparece na página de metodologia e em toda resposta da API v1 que traga indicadores.
- **PATCH:** esclarecimento de texto, avisos ou exemplos, sem efeito em nenhum número exibido.
- **MINOR:** novo recorte ou indicador, nova regra de validação, ampliação de cobertura (por exemplo, novos exercícios), sem mudar a definição de um indicador existente. Durante a fase 0.x, mudanças de definição, como trocar a linha-manchete, também sobem o MINOR e são **destacadas como quebra**.
- **MAJOR** (a partir de 1.0.0): mudança na definição de um indicador existente.
- **1.0.0** quando Gabriel confirmar a linha-manchete (D1) e as decisões que afetam o significado dos números (D2 e D5).
- Toda nova versão gera uma entrada no histórico com data real, o que mudou, a evidência e o efeito nos números exibidos. Como os indicadores são calculados na leitura (seção 1), o efeito alcança na hora todos os períodos já exibidos.

### 17.2 Histórico de versões

| Versão | Data | Situação | Resumo | Efeito em números exibidos |
|---|---|---|---|---|
| 0.1.0 | 2026-10-01 | Rascunho para revisão de Gabriel; não publicada. Revisado contra as evidências da Etapa 1 na mesma data, sem mudança de definição. | Primeira definição: indicador principal provisório (RREO-Anexo 01, coluna (j), `DespesasExcetoIntraOrcamentarias`); composição por 8 grupos comuns; regras de validação (presença, unicidade, identidades I1 e I2); ausência como "sem dado"; tratamento de retificações por snapshots; regras de comparabilidade; avisos obrigatórios; decisões pendentes | Nenhum: nada foi publicado |

---

## 18. Correções

Esta seção registra erros do **PortalDash**: números exibidos errados, metodologia aplicada de forma incorreta ou texto que induziu a erro. Retificações feitas pelos entes na fonte não são correções do PortalDash; elas aparecem como status Retificado (seção 9).

**Nenhuma correção registrada até a versão 0.1.0.**

Modelo de registro:

| Data | Versão da metodologia | O que estava errado | Números afetados (antes → depois, ente, período) | Causa | Como foi detectado | Ação tomada |
|---|---|---|---|---|---|---|

---

## 19. Registro de evidências

### 19.1 Relatórios da Etapa 1

Arquivos gerados na sessão de validação, fora do repositório (seção 16, item 9). A pasta é `<scratchpad>\etapa1\`, e as amostras brutas e logs estão em `...\scratchpad\siconfi\`.

| ID | Arquivo | Conteúdo |
|---|---|---|
| R1 | `docs.json` | API: endpoints, parâmetros, paginação, limites, erros, divergências do contrato |
| R2 | `cobertura.json` | Entregas por ente (extratos), comparabilidade União × SP |
| R3 | `uniao-investigacao.json` | União: anexos, colunas, hierarquia, despesa paga, retificações |
| R4 | `uniao-reconciliacao.json` | Reconciliação da União 2025 b6 com o RREO do Tesouro |
| R5 | `rj-investigacao.json` | Estado do RJ: anexos, colunas, hierarquia, despesa paga, retificações |
| R6 | `rj-reconciliacao.json` | Reconciliação do RJ 2023 b6 com o PDF da SEFAZ-RJ |
| R7 | `critic.json` | Revisão crítica: inconsistências, lacunas, indicador proposto, recortes. **Prevalece** quando corrige outro relatório. |

### 19.2 Coletas citadas

Todas as coletas da API Siconfi deram HTTP 200, salvo indicação. Os horários são do relógio da coleta, em UTC.

| ID | O quê | URL | Coleta (UTC) | Detalhe | Relatório |
|---|---|---|---|---|---|
| E01 | Contrato da API (OpenAPI) | `https://apidatalake.tesouro.gov.br/docs/siconfi.yaml` | 2026-10-02T01:19:11Z | Swagger 2.0, `info.version` 1.1.0, "versão beta"; `Last-Modified` Wed, 24 Jun 2026 14:31:16 GMT; `ETag` "80534262"; limite de 1 requisição/s | R1 |
| E02 | Página de entrada da API | `https://www.tesourotransparente.gov.br/consultas/consultas-siconfi/siconfi-api-de-dados-abertos` | 2026-10-02T01:18:45Z | Cabeçalho `Date` vindo de cache, defasado | R1 |
| E03 | Link "MDF" do contrato | `http://www.tesouro.fazenda.gov.br/mdf` | 2026-10-02T01:24:59Z | Falha: o host não resolve no DNS | R1 |
| E04 | Cadastro de entes | `https://apidatalake.tesouro.gov.br/ords/cdwhprd/siconfi/tt/entes` | 2026-10-02T01:19:43Z (R1); também 01:19:07Z (R3), 01:19:09Z (R5) e 01:20:02Z (R2) | 5598 itens | R1, R2, R3, R5 |
| E05 | União, RREO 2025 b6, completo (2 páginas) | `https://apidatalake.tesouro.gov.br/ords/cdwhprd/siconfi/tt/rreo?an_exercicio=2025&nr_periodo=6&co_tipo_demonstrativo=RREO&id_ente=1` (e `&offset=5000`) | 2026-10-02T01:21:57Z e 01:22:11Z | 6893 linhas | R3 |
| E06 | União, RREO 2025 b6, Anexo 01 (confirmação) | `https://apidatalake.tesouro.gov.br/ords/cdwhprd/siconfi/tt/rreo?an_exercicio=2025&nr_periodo=6&co_tipo_demonstrativo=RREO&no_anexo=RREO-Anexo%2001&id_ente=1` | 2026-10-02T01:34:44Z | 869 itens; idêntica, linha a linha, ao Anexo 01 de E05 | R4 |
| E07 | União, RREO 2025 b5, Anexo 01 | `https://apidatalake.tesouro.gov.br/ords/cdwhprd/siconfi/tt/rreo?an_exercicio=2025&nr_periodo=5&co_tipo_demonstrativo=RREO&no_anexo=RREO-Anexo%2001&id_ente=1` | 2026-10-02T01:24:13Z | 846 itens | R3 |
| E08 | União, RREO 2026 b4, Anexo 01 | `https://apidatalake.tesouro.gov.br/ords/cdwhprd/siconfi/tt/rreo?an_exercicio=2026&nr_periodo=4&co_tipo_demonstrativo=RREO&no_anexo=RREO-Anexo%2001&co_esfera=U&id_ente=1` | 2026-10-02T01:23:10Z | 834 itens. O RREO completo do mesmo período foi coletado às 01:24:23Z (4626 linhas, R3). | R2, R3 |
| E09 | SP, RREO 2026 b4, Anexo 01 | `https://apidatalake.tesouro.gov.br/ords/cdwhprd/siconfi/tt/rreo?an_exercicio=2026&nr_periodo=4&co_tipo_demonstrativo=RREO&no_anexo=RREO-Anexo%2001&co_esfera=E&id_ente=35` | 2026-10-02T01:23:22Z | 703 itens | R2 |
| E10 | SP, RREO 2025 b6, Anexo 01 | `https://apidatalake.tesouro.gov.br/ords/cdwhprd/siconfi/tt/rreo?an_exercicio=2025&nr_periodo=6&co_tipo_demonstrativo=RREO&no_anexo=RREO-Anexo%2001&co_esfera=E&id_ente=35` | 2026-10-02T01:24:14Z | 707 itens | R2 |
| E11 | RJ, RREO 2025 b6, completo | `https://apidatalake.tesouro.gov.br/ords/cdwhprd/siconfi/tt/rreo?an_exercicio=2025&nr_periodo=6&co_tipo_demonstrativo=RREO&id_ente=33` | 2026-10-02T01:22:05Z | 4682 itens; versão RE | R5 |
| E12 | RJ, RREO 2025 b5, Anexo 01 | `https://apidatalake.tesouro.gov.br/ords/cdwhprd/siconfi/tt/rreo?an_exercicio=2025&nr_periodo=5&co_tipo_demonstrativo=RREO&no_anexo=RREO-Anexo%2001&id_ente=33` | 2026-10-02T01:23:35Z | 658 itens | R5 |
| E13 | RJ, RREO 2026 b4, completo | `https://apidatalake.tesouro.gov.br/ords/cdwhprd/siconfi/tt/rreo?an_exercicio=2026&nr_periodo=4&co_tipo_demonstrativo=RREO&id_ente=33` | 2026-10-02T01:23:46Z | 3711 itens | R5 |
| E14 | RJ, RREO 2026 b5, Anexo 01 (vazio) | `https://apidatalake.tesouro.gov.br/ords/cdwhprd/siconfi/tt/rreo?an_exercicio=2026&nr_periodo=5&co_tipo_demonstrativo=RREO&no_anexo=RREO-Anexo%2001&id_ente=33` | 2026-10-02T01:26:16Z | 0 itens (`items` vazio, sem erro) | R5 |
| E15 | RJ, RREO 2023 b6, Anexo 01 | `https://apidatalake.tesouro.gov.br/ords/cdwhprd/siconfi/tt/rreo?an_exercicio=2023&nr_periodo=6&co_tipo_demonstrativo=RREO&no_anexo=RREO-Anexo%2001&id_ente=33` | 2026-10-02T01:41:16Z | 677 itens | R6 |
| E16 | Revisão crítica, RREO Anexo 01 | `https://apidatalake.tesouro.gov.br/ords/cdwhprd/siconfi/tt/rreo?an_exercicio={ano}&nr_periodo={b}&co_tipo_demonstrativo=RREO&no_anexo=RREO-Anexo%2001&id_ente={id}` | DF 2026 b4: 01:48:57Z · MG 2026 b4: 01:49:16Z · RJ b6 2015: 01:49:26Z · RJ b6 2018: 01:50:23Z · RJ b6 2021: 01:50:38Z · RJ b6 2019: 01:50:49Z · RJ b6 2020: 01:50:59Z · União b6 2019: 01:51:31Z | 8 chamadas | R7 |
| E17 | Revisão crítica, DCA-Anexo I-E 2025 | `https://apidatalake.tesouro.gov.br/ords/cdwhprd/siconfi/tt/dca?an_exercicio=2025&no_anexo=DCA-Anexo%20I-E&id_ente={33 ou 1}` | RJ: 01:49:53Z · União: 01:51:19Z | 2 chamadas | R7 |
| E18 | Extrato de entregas 2026 (28 entes) | `https://apidatalake.tesouro.gov.br/ords/cdwhprd/siconfi/tt/extrato_entregas?id_ente={id}&an_referencia=2026` | R2: de 01:20:45Z (União) a 01:22:16Z (DF), por exemplo RJ 01:22:00Z e SP 01:22:01Z. Coletas independentes do mesmo extrato: União 01:21:47Z (R3) e RJ 01:21:51Z (R5) | R2 fez 1 requisição por ente (28 no total; log `siconfi\cobertura\log_requisicoes.jsonl`) | R2, R3, R5 |
| E19 | Extrato de entregas 2025 (União, SP, RJ, DF) | `https://apidatalake.tesouro.gov.br/ords/cdwhprd/siconfi/tt/extrato_entregas?id_ente={id}&an_referencia=2025` | União 01:21:36Z (R3) e 01:22:49Z (R2) · RJ 01:21:32Z (R5) e 01:23:52Z (R2) · SP 01:23:51Z (R2) · DF 01:23:54Z (R2) | Os outros 24 entes não foram consultados | R2, R3, R5 |
| E20 | Extrato de entregas 2023, RJ | `https://apidatalake.tesouro.gov.br/ords/cdwhprd/siconfi/tt/extrato_entregas?id_ente=33&an_referencia=2023` | 2026-10-02T01:41:18Z | 103 itens | R6 |
| E21 | Tesouro, RREO dez/2025 da União (republicação) | `https://cdn.tesouro.gov.br/sistemas-internos/apex/producao/sistemas/thot/arquivos/publicacoes/53743_1693038/12_%20RREODez2025%20(REPUBL_).pdf`; página: `https://www.tesourotransparente.gov.br/publicacoes/relatorio-resumido-da-execucao-orcamentaria-rreo/2025/12` | PDF 01:26:08Z; página 01:25:23Z | `Last-Modified` Fri, 17 Jul 2026 19:40:58 GMT; "Publicado em 30/05/2026"; R$ milhares | R3, R4 |
| E22 | Tesouro, RREO ago/2026 da União | `https://cdn.tesouro.gov.br/sistemas-internos/apex/producao/sistemas/thot/arquivos/publicacoes/55944_1800407/08_RREOAgo2026%20-%20Com%20Portaria%20Publicada.pdf`; página: `https://www.tesourotransparente.gov.br/publicacoes/relatorio-resumido-da-execucao-orcamentaria-rreo/2026/8` | PDF 01:27:45Z; página 01:27:30Z | `Last-Modified` Wed, 30 Sep 2026 17:17:48 GMT; "publicado em 30/09/2026"; R$ milhares | R3, R7 |
| E23 | SEFAZ-RJ, RREO Anexo 01, 6º bim./2023 (cópia do Internet Archive) | `https://web.archive.org/web/20250118032313id_/https://portal.fazenda.rj.gov.br/contabilidade/wp-content/uploads/sites/25/2024/01/Anexo-01_6oBim_RREO_-2023_MDF-13aEd..pdf` | 2026-10-02T01:40:18Z | sha256 `d9965a65039a4d4d72efe8795a4e0689d7cd95369984101998b8fd9a97e3d271`; emissão impressa 24/01/2024; R$ 1,00 | R6 |
| E24 | SEFAZ-RJ, Prestação de Contas 2025, Vol. 01 (cópia do Internet Archive) | `https://web.archive.org/web/20260504170515id_/https://portal.fazenda.rj.gov.br/contabilidade/wp-content/uploads/sites/25/2026/04/Volume-01.pdf` | 2026-10-02T01:36:28Z | sha256 `3a472c1e3a113df4e3ec50be716d25fc1b059ce8af3eaed01b326b9042003d7e`; R$ mil; não é o RREO | R6 |
| E25 | SEFAZ-RJ, página de relatórios fiscais | `https://portal.fazenda.rj.gov.br/contabilidade/relatorios-fiscais/` | 2026-10-02T01:25:31Z | HTTP 200 com página de bloqueio por IP | R5 |
