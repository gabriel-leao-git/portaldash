# Diretrizes editoriais do PortalDash

> **Status:** rascunho para revisão de Gabriel · **Data:** 01/10/2026 · **Metodologia de referência:** v0.1.0 (indicador principal provisório) · **Escopo:** MVP (dashboard Brasil e páginas estaduais)

Este documento define como o PortalDash escreve, mostra números e formula perguntas. Vale para textos de página, cartões, rótulos de gráficos, perguntas críticas, avisos da API própria (campo `avisos`), legendas de capturas para vídeo e notas de correção.

Base: prompt mestre do projeto (`PortalDash_Prompt_Mestre_Claude.md`, §1 Produto, §4 Páginas, §5 Integridade dos dados, §8 Gatilhos) e evidências da Etapa 1 (validação da fonte Siconfi). Toda afirmação sobre a fonte cita uma evidência `EV-nn` ou um relatório `E-...`, listados na [seção 11](#11-evidências-citadas). Os horários de coleta estão em UTC. Todas as coletas da Etapa 1 aconteceram na noite de 01/10/2026 pelo horário de Brasília, embora registradas como 2026-10-02T01:xxZ.

Documentos relacionados: `docs/methodology.md` (definição técnica do indicador), `docs/data-contract.md` (contrato da API própria), `docs/validacao-fonte-siconfi-2026-10.md` (registro consolidado da Etapa 1), `AGENTS.md` (gatilhos operacionais).

### Convenções de marcação

| Marca | Significado |
|---|---|
| **[Dado]** | Observado na fonte, com evidência. |
| **[Inferência]** | Conclusão tirada de dados observados, sem confirmação da fonte ou de norma. |
| **[Hipótese]** | Explicação possível, não verificada. |
| **[Lacuna]** | Algo que não sabemos. |
| **[Proposta]** | Regra sugerida por este documento, ainda não aprovada. |
| **[Pendente — Gabriel]** | Decisão de produto em aberto (lista na [seção 10](#10-decisões-pendentes-e-decisões-fechadas)). |

Regras sem marca vêm do prompt mestre ou das decisões de arquitetura já tomadas e são obrigatórias.

## Sumário

1. [Identidade](#1-identidade)
2. [Tom](#2-tom)
3. [Regras fundamentais](#3-regras-fundamentais)
4. [Perguntas críticas](#4-perguntas-críticas)
5. [Vocabulário](#5-vocabulário)
6. [Números, datas e unidades (pt-BR)](#6-números-datas-e-unidades-pt-br)
7. [Ausência, retificação e cobertura parcial](#7-ausência-retificação-e-cobertura-parcial)
8. [Correções públicas](#8-correções-públicas)
9. [Checklist editorial antes de publicar](#9-checklist-editorial-antes-de-publicar)
10. [Decisões pendentes e decisões fechadas](#10-decisões-pendentes-e-decisões-fechadas)
11. [Evidências citadas](#11-evidências-citadas)

---

## 1. Identidade

- **Assinatura:** "O dinheiro é público. A cobrança também."
- **Mensagem de abertura:** "Você paga. Acompanhe para onde vai." O prompt mestre a apresenta como proposta. **[Pendente — Gabriel]** confirmar o texto final.

O que a identidade promete, e o que não promete:

| Frase | Significa | Não significa |
|---|---|---|
| "O dinheiro é público." | Os números vêm de declarações oficiais dos entes e aparecem com proveniência. | Que o PortalDash produz ou audita os dados. |
| "A cobrança também." | O portal entrega fatos e perguntas para o cidadão cobrar explicações do poder público. | Acusar, julgar ou sugerir culpa. Cobrar é perguntar com base em dado. |
| "Você paga." | A despesa pública é financiada pela sociedade. | Um valor por pessoa ("você pagou R$ X"). O MVP não tem cálculo per capita ([seção 3.7](#37-o-que-o-mvp-pode-publicar)). |
| "Acompanhe para onde vai." | No MVP, "para onde" é a composição por **grupos de natureza de despesa** (pessoal, juros, investimentos etc.) de cada ente. | Despesa por área (saúde, educação). No RREO, o Anexo 02 (função e subfunção) só tem empenhado e liquidado, sem coluna de pagas, nos entes em que foi observado: União e estado do RJ **[Dado]** (E-uniao-inv, E-rj-inv). A DCA tem pagas por função, mas é anual e usa outro conceito; não foi validada (E-critic). Os anexos 08 e 12 não constam no contrato da API nem na tabela `/anexos-relatorios`, e nenhuma consulta a eles foi tentada **[Lacuna]** (E-critic). Não prometer esse recorte em chamadas. |

Uso:

- A assinatura vai no cabeçalho ou rodapé e na página /sobre; a abertura, no item 2 do dashboard central.
- Nenhum número é inserido nas frases de identidade.
- A página /sobre só traz informações de autoria confirmadas (prompt mestre §4).

## 2. Tom

Direto, questionador e crítico, sempre a partir de fatos verificáveis.

- **Direto.** Sujeito claro, verbo concreto, número com período: "Até agosto de 2026, a União pagou R$ 2.822,0 bilhões em despesas do exercício, exceto intraorçamentárias (valor arredondado)". Frases curtas. Primeiro o fato, depois a ressalva.
- **Questionador.** O portal faz as perguntas que o dado sustenta ([seção 4](#4-perguntas-críticas)) e não responde por quem deve responder.
- **Crítico.** Aponta o que merece explicação pública: composição dos pagamentos, mudança em relação ao mesmo bimestre do ano anterior, retificações, falta de dados. A crítica recai sobre o uso do dinheiro e a transparência, nunca sobre pessoas.
- **Sóbrio na forma.** Sem adjetivos de juízo ("absurdo", "escandaloso", "assustador"), sem caixa alta para ênfase, sem ponto de exclamação, sem emojis, sem ironia. Vermelho só para alerta contextualizado; âmbar para ressalvas (prompt mestre §4).
- **Honesto com a incerteza.** "Não sabemos", "a fonte não informa" e "sem dado" são respostas legítimas.
- **Pessoa gramatical.** "Você" na abertura e nas chamadas; terceira pessoa nos dados ("o governo do estado de São Paulo pagou").

Antes e depois (números de EV-01, EV-03, EV-06 e EV-07):

| Evite | Prefira |
|---|---|
| "Rombo! Governo federal torrou trilhões em 2026." | "Até agosto de 2026, a União pagou R$ 2.822,0 bilhões em despesas do exercício, exceto intraorçamentárias (valor arredondado)." |
| "Um assustador R$ 363,5 bilhões em juros." | "Juros e encargos da dívida: R$ 363,5 bilhões em 2025, 10,1% das despesas pagas pela União, exceto intraorçamentárias (valores arredondados)." |
| "O Rio gastou menos este ano." | "Comparação indisponível: os períodos são diferentes (jan–ago/2026 e jan–dez/2025)." |

## 3. Regras fundamentais

### 3.1 Separar dado, hipótese e interpretação

Três camadas, nunca misturadas na mesma frase:

| Camada | O que é | Como aparece |
|---|---|---|
| Dado | O que a fonte declara, com proveniência: ente, exercício, bimestre, linha, coluna, valor, status e data de coleta. | Texto principal, cartões, tabelas. |
| Hipótese | Explicação possível, não verificada. | Rotulada "Hipótese (não verificada)". Nunca em título, manchete ou pergunta crítica. |
| Interpretação | Leitura editorial do PortalDash. | Rotulada "Leitura do PortalDash", dizendo em que dado se apoia e o que não se pode concluir. |

Exemplo com dados reais:

- **Dado:** "O RREO do 6º bimestre de 2025 do estado do Rio de Janeiro está como retificado (RE) no Siconfi, com data de status 06/05/2026." (EV-09: `status_relatorio` 'RE', `data_status` '2026-05-06T17:14:12Z')
- **Hipótese (não verificada):** "A retificação pode ter alterado valores do Anexo 01." O Siconfi não informa o que mudou, e não há versão anterior coletada (E-critic, lacuna "Versionamento invisível").
- **Leitura do PortalDash:** "Os números de fechamento de 2025 do estado do RJ devem ser lidos como sujeitos a revisão. Mostramos o status e a data para que o leitor saiba disso."

### 3.2 Não inventar

- **Resultados.** Só se publica número que vem de snapshot ativo e validado (decisão de arquitetura). Nada de estimativa, de número "aproximado" sem fonte ou de dado de demonstração. Dados fictícios de desenvolvimento levam a marca "FICTÍCIO" visível e nunca vão para produção (prompt mestre §4).
- **Acusações.** Nenhum texto afirma ou sugere crime, irregularidade ou má-fé.
- **Causalidade.** O dado mostra quanto foi pago, não por quê nem com que efeito. É proibido ligar valores a causas ou consequências ("por causa de", "graças a", "resultou em", "enquanto falta para...").
- **Desperdício e corrupção.** O Anexo 01 do RREO traz dotação, empenho, liquidação e pagamento por categoria e grupo de despesa **[Dado]** (E-uniao-inv, `anexos_observados`). Não traz informação sobre eficiência, legalidade ou regularidade. Por isso nenhum texto do MVP fala em desperdício, corrupção, desvio, superfaturamento ou "má gestão". Fontes de controle (auditorias, decisões judiciais) estão fora do MVP e exigirão diretriz própria.

### 3.3 Valor alto isolado não fundamenta conclusão

- R$ 363,5 bilhões de juros pagos pela União em 2025 ('363469278379.43', EV-03) é um valor grande, mas sozinho não indica erro, excesso nem má gestão.
- Contexto mínimo para transformar um número em pergunta: a participação no total do mesmo ente e período (composição) ou a comparação com o mesmo bimestre do ano anterior. Mesmo com contexto, o resultado é uma **pergunta**, não uma conclusão.
- Valores absolutos de entes de tamanhos diferentes não se comparam como mérito. O PortalDash não tem cálculo per capita: a origem e a safra do campo `populacao` do Siconfi não estão documentadas **[Lacuna]**, e para a União o campo traz '8569324' **[Dado]**, valor que não corresponde à população do país **[Inferência]** (E-uniao-inv, E-critic, recortes não validados).
- União e estados não se comparam como entes do mesmo tipo. Até o 4º bimestre de 2026, a União pagou '531673082300.42' em "Transferências a Estados, DF e Municípios" (EV-01), valor que pode reaparecer como despesa de quem recebeu **[Inferência]** (E-cob, comparabilidade, item g). A União fica em bloco próprio. Nunca entra em ranking com estados nem aparece como múltiplo ou fração deles.

### 3.4 Não atribuir despesas de órgãos a pessoas

- Os dados do MVP são por ente. No `/rreo`, o declarante é a instituição ('Governo Federal', 'Governo do Estado do Rio de Janeiro') **[Dado]** (E-uniao-inv, E-rj-inv). A fonte não vincula despesa a nenhuma pessoa.
- Proibido: "o governador gastou", "o presidente pagou", nome ou foto de autoridade junto a um número, recorte por mandato ou "gestão de Fulano".
- Use: "a União", "o governo federal", "o governo do estado de São Paulo".
- Os PDFs oficiais usados na reconciliação são assinados por servidores de cargos de contabilidade (por exemplo, o Coordenador-Geral de Contabilidade da União; na SEFAZ-RJ, a Subsecretaria de Contabilidade Geral) **[Dado]** (E-uniao-rec, E-rj-rec). A assinatura atesta o demonstrativo; nada na fonte a liga à decisão de cada despesa. Não citar signatários.

### 3.5 Nada de "tempo real"

- O indicador é acumulado até o fim de um bimestre, declarado pelo ente depois desse fim e coletado depois da declaração. O 4º bimestre de 2026 (jan–ago) foi homologado pelos 28 entes entre 18/09 e 30/09/2026 **[Dado]** (EV-16). A defasagem entre a homologação e a disponibilidade na API é desconhecida **[Lacuna]**: só há limites superiores, de cerca de 35 a 38 horas, para União e SP no 4º bimestre de 2026 (E-critic).
- Proibido: contador que incrementa, painel no estilo "impostômetro", animação de contagem e expressões como "ao vivo", "agora", "neste momento", "por segundo", "por dia". **[Proposta]** A proibição vale também para a animação de entrada (de zero até o valor).
- Todo número mostra o período de referência ("até o 4º bimestre de 2026") e a data de coleta.

### 3.6 Sem projeções no MVP

- Proibido: "deve fechar o ano em", "no ritmo atual", extrapolação, linha de tendência além do último bimestre declarado, média mensal ou diária derivada.
- Também fica fora a comparação "previsto × pago" (dotação × pagamento). A dotação existe no Anexo 01, mas não está entre os recortes validados (E-critic, `recortes_validados`).

### 3.7 O que o MVP pode publicar

Indicador principal (metodologia v0.1.0, **provisório**, **[Pendente — Gabriel]**): **"Despesas pagas no exercício, acumuladas até o bimestre (exceto intraorçamentárias)"**. É a célula do RREO-Anexo 01 com coluna 'DESPESAS PAGAS ATÉ O BIMESTRE (j)' e `cod_conta` 'DespesasExcetoIntraOrcamentarias'. Entes: União, 26 estados e Distrito Federal. Definição técnica em `docs/methodology.md`.

Recortes publicáveis (validados na Etapa 1; E-critic, `recortes_validados`):

| Recorte | Condições editoriais |
|---|---|
| Total pago da União, acumulado até o bimestre | Conferido com o RREO publicado pelo Tesouro com precisão de R$ mil, em 2025 b6 e 2026 b4 (EV-02, EV-04). |
| Total pago de cada estado e do DF, no mesmo exercício e bimestre, lado a lado | Sem soma. Cada UF só aparece se o seu snapshot passou nas verificações (célula presente e identidades conferidas). Na Etapa 1 a célula foi confirmada só em SP, RJ, MG e DF, e nenhum estado foi conferido com publicação própria para 2025 ou 2026 (E-critic, lacunas). |
| Composição por grupos de natureza, dentro do mesmo ente | Só os grupos comuns do Anexo 01: Despesas correntes (Pessoal e encargos sociais; Juros e encargos da dívida; Outras despesas correntes) e Despesas de capital (Investimentos; Inversões financeiras; Amortização da dívida). Subcontas exclusivas de um ente não entram em comparação entre entes. |
| Ano contra ano, mesmo ente e mesmo bimestre | Valores nominais, com aviso de possível retificação (AV-08). |
| Série intra-anual cumulativa (b1 a b6 do mesmo ente e exercício) | Pontos acumulados em sequência; nunca diferenças entre bimestres. Status de cada ponto visível (AV-10). |

Não publicáveis no MVP (E-critic, `recortes_nao_validados`; decisões de arquitetura):

| Recorte | Por quê |
|---|---|
| "Brasil" como total nacional; soma União + estados; soma dos estados | Não há consolidação na fonte, e as transferências seriam contadas duas vezes (decisão de arquitetura; EV-01). |
| Pago "no bimestre" (valor isolado) | Não existe na fonte. A diferença entre acumulados mistura versões possivelmente retificadas. |
| Mensal | A fonte é bimestral; não se derivam meses. |
| Por função (saúde, educação etc.) | O RREO-Anexo 02 não tem coluna de pagas nos entes observados; a DCA é anual e usa outro conceito. |
| Série de vários exercícios | Quebra estrutural entre 2019 e 2020 e retificações tardias do b6. |
| Per capita | O campo `populacao` não tem fonte documentada. |
| Valores reais (corrigidos pela inflação) | Índice e data-base não decididos nem validados. |
| `TotalDespesas` como "total das despesas" | Inclui o refinanciamento da dívida nos entes que têm essa linha (União e estado do RJ; SP, MG e DF não têm). Até 2019 incluía o superávit nos casos observados (estado do RJ e União); a mudança não foi verificada nos demais entes. |
| Restos a pagar pagos somados ao indicador | Outro conceito, em outro anexo. |

Avisos-padrão, reutilizáveis na interface e no campo `avisos` da API (base: E-critic, `avisos_obrigatorios`):

| ID | Quando | Texto |
|---|---|---|
| AV-01 | Sempre | "Valor acumulado de janeiro até o fim do {n}º bimestre de {ano}. Não é o valor do bimestre; bimestres não devem ser somados." |
| AV-02 | Sempre | "Fonte: Siconfi/Tesouro Nacional — RREO, Anexo 01, coluna 'Despesas pagas até o bimestre (j)', linha 'Despesas (exceto intraorçamentárias)'. Dados declarados por cada ente, que podem ser retificados depois." |
| AV-03 | Sempre | Texto provisório: "Não inclui despesas intraorçamentárias nem refinanciamento da dívida. Pela estrutura do relatório, também não inclui restos a pagar de anos anteriores (confirmação no manual oficial pendente)." Texto final, só depois da confirmação: "Não inclui despesas intraorçamentárias, refinanciamento da dívida nem restos a pagar de anos anteriores." A exclusão de intraorçamentárias e de refinanciamento decorre das linhas do Anexo 01 **[Dado]**; a de restos a pagar é **[Inferência]** feita pela estrutura dos anexos, e a confirmação no Manual de Demonstrativos Fiscais (MDF) está pendente (E-critic; decisão pendente 10). |
| AV-04 | Toda vista com União e estados | "União e estados não são somados. Transferências da União aos estados aparecem como despesa da União e podem reaparecer como despesa do estado." |
| AV-05 | Sempre | "Valores nominais, em reais correntes, sem correção pela inflação." |
| AV-06 | Quando houver ausência | "'Sem dado' não significa zero." |
| AV-07 | Vistas da União | "O Tesouro publica o RREO da União mês a mês; aqui aparecem só os fechamentos de bimestre declarados ao Siconfi." |
| AV-08 | Ano contra ano | "Comparação nominal entre o mesmo bimestre de dois anos. Qualquer dos dois valores pode ter sido retificado; confira o status de cada um." |
| AV-09 | Comparação entre estados | "Valores absolutos. Os estados têm tamanhos diferentes, e o PortalDash ainda não publica valores por habitante." |
| AV-10 | Série intra-anual | **[Proposta]** "Cada ponto é o acumulado de janeiro até o fim do bimestre, com o status da sua própria declaração. Pontos diferentes podem ter sido retificados em datas diferentes; a distância entre dois pontos não é o valor pago no bimestre." |

## 4. Perguntas críticas

### 4.1 O que é

A pergunta crítica transforma um recorte publicado em algo que o cidadão pode cobrar. Há dois tipos:

- **De exploração:** o próprio portal responde com outro recorte validado (por exemplo, "quanto desse total foi para pessoal?").
- **De cobrança:** dirigida ao ente; o portal não tem a resposta (por exemplo, "que explicação pública o governo dá para...?").

### 4.2 Requisitos

Toda pergunta crítica:

1. **Cita o recorte que a sustenta:** ente, exercício, bimestre, indicador (ou grupo), valor arredondado com o valor exato acessível, status no Siconfi (HO ou RE, com data) e data de coleta. O cartão aparece na página depois do recorte e leva a ele.
2. **Usa só recortes validados** ([seção 3.7](#37-o-que-o-mvp-pode-publicar)). Se destaca alguns entes de uma tabela lado a lado, linka a tabela completa.
3. **Não embute resposta acusatória:** nada de pressuposto de culpa ("por que desperdiçou", "quem desviou", "até quando vão..."), adjetivo de juízo, causa presumida ou pessoa.
4. **Passa no teste da resposta neutra:** continua honesta se a resposta for "não houve nada de errado".
5. **Compara só o comparável:** mesmo ente (ou entes do mesmo tipo), mesmo bimestre, mesmo conceito e dado dos dois lados.
6. **Diz o que o dado não mostra**, em uma linha.
7. **É curta:** até duas frases de contexto e uma pergunta. **[Proposta]** A pergunta em si tem até 200 caracteres.
8. **Usa "por que" só quando a premissa é um dado** (por exemplo, o status RE de uma declaração), nunca quando a premissa é uma interpretação.

### 4.3 Modelo do cartão (`CriticalQuestionCard`)

```text
Pergunta: {pergunta}
Tipo: exploração | cobrança
Recorte: {ente} · {exercício} · até o {n}º bimestre ({jan–mês}) · {indicador ou grupo}
Números: {valor arredondado} (valor exato: {valor exato}) [· {segundo valor}]
Fonte e datas: Siconfi/Tesouro Nacional, RREO-Anexo 01 · {homologado|retificado} em {dd/mm/aaaa}
               · coletado em {dd/mm/aaaa, hh:mm} (horário de Brasília)
O que o dado não diz: {uma linha}
Metodologia: v{x.y.z} · link para /metodologia
```

### 4.4 Seis exemplos bons

Os exemplos 1 a 4 usam valores reais da Etapa 1. Os exemplos 5 e 6 são **modelos**: os valores entre chaves não foram coletados na Etapa 1 **[Lacuna]** e só podem ser publicados quando a ingestão tiver os snapshots ativos correspondentes.

#### Exemplo bom 1 — Total da União (exploração)

> Até agosto de 2026, a União pagou R$ 2.822,0 bilhões em despesas do exercício, exceto intraorçamentárias (valor arredondado). Quanto desse valor foi para pessoal e encargos sociais, para juros e encargos da dívida e para investimentos?

- **Recorte:** União · 2026 · até o 4º bimestre (jan–ago) · indicador principal. Valor exato: R$ 2.821.965.337.713,47 ('2821965337713.47', EV-01). Homologado em 30/09/2026 (EV-10). Coletado em 01/10/2026, 22:23, horário de Brasília ('2026-10-02T01:23:10Z', EV-01). Conferido com o RREO publicado pelo Tesouro: 2.821.965.338 em R$ mil (EV-02).
- **O que o dado não diz:** não inclui o refinanciamento da dívida, que no mesmo período somou R$ 1.141,1 bilhões ('1141059765822.79', EV-01) e fica fora do indicador.
- **Por que é boa:** cita o recorte, não presume juízo e leva a outro recorte validado (composição).

#### Exemplo bom 2 — Estados lado a lado (exploração)

> Até agosto de 2026, o governo do estado de São Paulo pagou R$ 224,0 bilhões e o do estado do Rio de Janeiro, R$ 66,0 bilhões em despesas do exercício, exceto intraorçamentárias (valores arredondados). Em cada estado, quais grupos de despesa concentram esses pagamentos?

- **Recorte:** SP e RJ · 2026 · até o 4º bimestre · indicador principal, lado a lado, sem soma. SP: R$ 224.014.883.002,29 ('224014883002.29', EV-05; coleta '2026-10-02T01:23:22Z'; homologado em 30/09/2026, EV-12). RJ: R$ 65.960.575.113,15 ('65960575113.15', EV-06; coleta '2026-10-02T01:23:46Z'; homologado em 30/09/2026, EV-08). Link para a tabela com as 27 UFs.
- **O que o dado não diz:** qual estado paga mais por habitante (AV-09). Nenhum dos dois valores foi conferido com publicação do próprio estado.
- **Por que é boa:** não transforma diferença de tamanho em juízo e pede a composição de cada um.

#### Exemplo bom 3 — Composição da União (cobrança)

> Em 2025, a União pagou R$ 363,5 bilhões em juros e encargos da dívida: 10,1% dos R$ 3.606,5 bilhões em despesas do exercício, exceto intraorçamentárias (valores arredondados). Que explicação pública o governo federal dá para a participação dos juros nesses pagamentos?

- **Recorte:** União · 2025 · até o 6º bimestre (jan–dez) · grupo "Juros e encargos da dívida" dentro do indicador. Valores exatos: R$ 363.469.278.379,43 ('363469278379.43') e R$ 3.606.510.496.180,06 ('3606510496180.06') (EV-03). Percentual calculado com os valores exatos. Homologado em 30/01/2026 (EV-11). Coletado em '2026-10-02T01:34:44Z' (EV-03). Total conferido com o RREO de dez/2025 republicado pelo Tesouro (EV-04).
- **O que o dado não diz:** se 10,1% é muito ou pouco em relação a outros anos (a série de vários exercícios não foi validada). Não inclui o refinanciamento da dívida (R$ 1.417,6 bilhões em 2025, '1417638361603.07', EV-03).
- **Por que é boa:** a participação é um fato (percentual calculado sobre o mesmo ente, exercício e snapshot). A pergunta usa a palavra descritiva "participação", e não "peso" (ver [seção 6.9](#69-gráficos)), e pede explicação sem presumir que ela falta.

#### Exemplo bom 4 — Composição de um estado, com retificação (cobrança)

> Em 2025, o governo do estado do Rio de Janeiro pagou R$ 102,6 bilhões em despesas do exercício, exceto intraorçamentárias; R$ 3,0 bilhões (2,9%) foram juros e encargos da dívida (valores arredondados). A declaração desse período foi retificada em 06/05/2026. Onde o governo estadual informa o que mudou na retificação?

- **Recorte:** estado do RJ · 2025 · até o 6º bimestre (jan–dez) · indicador e grupo "Juros e encargos da dívida". Valores exatos: R$ 102.599.919.210,67 ('102599919210.67') e R$ 2.957.181.316,06 ('2957181316.06') (EV-07; coleta '2026-10-02T01:22:05Z'). Retificado em '2026-05-06T17:14:12Z' (EV-09).
- **O que o dado não diz:** o que a retificação alterou (o Siconfi não informa, e o PortalDash não tem versão anterior coletada). Retificar não é, por si, indício de irregularidade.
- **Por que é boa:** a premissa ("foi retificada") é um dado. A pergunta cobra transparência sem presumir problema.

#### Exemplo bom 5 — Ano contra ano (exploração) — MODELO

> Até agosto de 2026, a União pagou R$ 2.822,0 bilhões em despesas do exercício, exceto intraorçamentárias; até agosto de 2025, R$ {B} bilhões (valores arredondados). A variação nominal foi de {±x,x}%, sem correção pela inflação. Como esses pagamentos se dividem entre os grupos de despesa em cada um dos dois anos?

- **Recorte:** União · 4º bimestre de 2026 × 4º bimestre de 2025 · indicador principal. 2026: '2821965337713.47' (EV-01), homologado em 30/09/2026 (EV-10). 2025: {valor exato}, não coletado na Etapa 1 **[Lacuna]**. O extrato mostra o 4º bimestre de 2025 homologado em 30/09/2025 ('2025-09-30T10:18:41Z', EV-11).
- **Aviso obrigatório:** AV-08, com o status e a data de cada um dos dois valores.
- **O que o dado não diz:** se houve crescimento real (os valores são nominais) nem a causa da diferença.
- **Por que é boa:** mesmo ente, mesmo bimestre, mesmo conceito; a variação vem rotulada como nominal. A pergunta leva à composição de cada ano (recorte validado) mostrada lado a lado, sem atribuir a diferença a um grupo como se fosse causa.

#### Exemplo bom 6 — Série intra-anual (cobrança) — MODELO

> Em 2026, o acumulado pago pelo governo do estado do Rio de Janeiro chegou a R$ {b1} bilhões até fevereiro, R$ {b2} bilhões até abril, R$ {b3} bilhões até junho e R$ 66,0 bilhões até agosto (valores arredondados). Em que publicação própria o governo estadual divulga esses mesmos acumulados, para que o cidadão possa conferi-los com o que foi declarado ao Siconfi?

- **Recorte:** estado do RJ · 2026 · série acumulada do 1º ao 4º bimestre · indicador principal. b4: '65960575113.15' (EV-06). b1 a b3: não coletados na Etapa 1 **[Lacuna]**. Status de cada ponto (EV-08): b1 retificado em 30/03/2026; b2 retificado em 29/05/2026; b3 homologado em 30/07/2026; b4 homologado em 30/09/2026. Cada ponto do gráfico mostra o seu status.
- **Aviso obrigatório:** AV-10.
- **O que o dado não diz:** quanto foi pago em cada bimestre isoladamente (não publicamos diferenças entre acumulados) nem se o ritmo é adequado.
- **Por que é boa:** usa a curva acumulada sem derivar valores. A pergunta pede um documento sem presumir que ele não existe e não sugere comparação com valores previstos (fora do MVP, [seção 3.6](#36-sem-projeções-no-mvp)). Contexto: na Etapa 1, nenhum valor estadual de 2025 ou 2026 foi conferido com publicação do próprio estado, e a página de relatórios fiscais da SEFAZ-RJ respondeu com bloqueio por IP (E-rj-inv, E-rj-rec, E-critic). Isso é limitação da nossa coleta, não indício de que a publicação não existe.

### 4.5 Quatro exemplos ruins

#### Exemplo ruim 1 — Soma entre esferas

> "Até agosto de 2026, União, São Paulo e Rio de Janeiro já gastaram R$ 3,1 trilhões. Quem vai pagar essa conta?"

Problemas:

- Soma União e estados (R$ 2.822,0 + R$ 224,0 + R$ 66,0 bilhões), o que é proibido. Não há total consolidado, e no mesmo período a União pagou '531673082300.42' em transferências a estados, DF e municípios (EV-01), valor que pode reaparecer como despesa dos estados.
- "Gastaram" e "já" sugerem contagem contínua; a escala em trilhões foge do padrão ([seção 6.3](#63-escalas)).
- "Quem vai pagar essa conta?" embute uma resposta (alguém está sendo lesado) e não é verificável.

Como corrigir: mostrar cada ente separado, como nos exemplos bons 1 e 2.

#### Exemplo ruim 2 — Períodos diferentes e intenção presumida

> "O Rio cortou 35,7% dos pagamentos: R$ 66,0 bilhões em 2026 contra R$ 102,6 bilhões em 2025. Quem foi prejudicado pelo corte?"

Problemas:

- Compara jan–ago/2026 (4º bimestre, EV-06) com jan–dez/2025 (6º bimestre, EV-07). Os períodos são incompatíveis: a "queda" é efeito do calendário.
- "Cortou" atribui intenção; "prejudicado" presume dano.
- "Rio" é ambíguo entre o estado e o município (E-critic).
- Omite que o valor de 2025 vem de uma declaração retificada (EV-09).

Como corrigir: comparar o 4º bimestre de 2026 com o 4º bimestre de 2025, com AV-08 (modelo do exemplo bom 5).

#### Exemplo ruim 3 — Juízo, causalidade e recorte não validado

> "Por que a União desperdiçou R$ 363,5 bilhões com juros em 2025, enquanto falta dinheiro para a saúde?"

Problemas:

- "Desperdiçou" é juízo sem base: o RREO não mede desperdício.
- Liga juros e saúde por uma causalidade não demonstrada.
- "Falta dinheiro para a saúde" não tem sustentação: despesa paga por função não é recorte validado.
- Valor isolado, sem participação nem comparação.

Como corrigir: exemplo bom 3.

#### Exemplo ruim 4 — Comparação absoluta como mérito e atribuição a pessoa

> "São Paulo gasta 3,4 vezes mais que o Rio. O governador vai explicar essa gastança?"

Problemas:

- A razão de 3,4 vem de valores absolutos (EV-05, EV-06) e é apresentada como excesso. Sem per capita, não diz nada sobre eficiência (AV-09).
- "Gasta", no presente, sugere fluxo contínuo; ano e bimestre não aparecem.
- Atribui a despesa a uma pessoa ("o governador"); "gastança" é juízo.
- "Rio" é ambíguo.

Como corrigir: exemplo bom 2.

### 4.6 Teste rápido antes de publicar uma pergunta

1. Consigo apontar o recorte exato (ente, exercício, bimestre, linha, valor, status, coleta)?
2. O recorte está na lista de validados?
3. Se a resposta for "não houve nada de errado", a pergunta continua honesta?
4. Há pessoa, adjetivo de juízo, causa presumida ou palavra proibida?
5. Os dois lados da comparação têm o mesmo período, o mesmo conceito e dado disponível?

Um "não" nos itens 1, 2, 3 ou 5, ou um "sim" no item 4, bloqueia a publicação.

**[Pendente — Gabriel]** Perguntas novas passam por revisão de Gabriel antes de ir ao ar?

## 5. Vocabulário

### 5.1 Recomendado

| Use | Em vez de | Por quê |
|---|---|---|
| despesas pagas, pagou, pagamentos | gasto, gastou (com número) | O Anexo 01 traz empenhado (f), liquidado (h) e pago (j) **[Dado]** (E-uniao-inv). "Gasto" não diz de qual etapa se trata. |
| acumulado no ano; até o 4º bimestre (jan–ago) | no bimestre; em agosto | Na fonte, o pago só existe acumulado **[Dado]** (E-docs, E-cob). |
| exceto intraorçamentárias | total; tudo | O indicador exclui intraorçamentárias e refinanciamento. |
| União (governo federal) | Brasil; o país | A União é um ente; "Brasil" sugere total nacional. |
| governo do estado do Rio de Janeiro; estado do RJ | Rio | Evita confusão com o município (E-critic). O mesmo vale para "estado de São Paulo". |
| 26 estados e o Distrito Federal; 27 UFs | 27 estados | O DF não é estado. |
| declarado ao Siconfi pelo ente | dado do Tesouro; número oficial do governo | Cada ente declara; o Tesouro mantém o sistema. |
| homologado em / retificado em dd/mm/aaaa | atualizado; corrigido | É o status no Siconfi; "corrigido" sugere erro. |
| coletado em dd/mm/aaaa, hh:mm | atualizado em | Separa coleta, referência e status. |
| sem dado (com o motivo) | 0; R$ 0; —; n/d | Ausência não é zero. |
| variação nominal | crescimento; alta real | Os valores não são corrigidos pela inflação. |
| lado a lado, sem soma | ranking de gastos; total dos estados | Não há soma nem juízo de mérito. |
| 4º bimestre | período 4; P4 | O tipo de período é sempre explícito; o contrato da API usa o parâmetro `bimestre`. |
| valor arredondado | ~; cerca de (sem mais) | Indica a regra aplicada ([seção 6](#6-números-datas-e-unidades-pt-br)). |

### 5.2 Proibido

| Proibido | Motivo | Alternativa |
|---|---|---|
| "Brasil gastou", "o país gastou", "gasto nacional", "total do Brasil" | Não há total nacional consolidado; somar União e estados conta transferências duas vezes (EV-01; decisão de arquitetura). | "A União pagou... Os estados, lado a lado: ..." |
| "os estados gastaram juntos", "soma dos estados", "média dos estados" | Não há soma de estados (decisão de arquitetura; E-critic, recortes não validados). A média depende dessa soma, por isso também fica fora **[Proposta]**. | Tabela lado a lado. |
| "gastou no bimestre", "pagou em agosto", "por mês", "média mensal", "por dia" | A fonte é acumulada e bimestral; derivar períodos é proibido. | "acumulado até o 4º bimestre (jan–ago)". |
| "em tempo real", "ao vivo", "agora", "neste momento", "a cada segundo" | Não há transação em tempo real; há defasagem de declaração e de coleta. | "até o fim do 4º bimestre; coletado em ..." |
| "desperdício", "rombo", "farra", "gastança", "torrou", "esbanjou", "sangria" | Juízo sem base na fonte. | Fato + pergunta ([seção 4](#4-perguntas-críticas)). |
| "corrupção", "desvio", "roubo", "superfaturamento", "irregular", "ilegal", "má gestão" | A fonte não contém essa informação. | Não usar no MVP. |
| "por causa de", "graças a", "resultou em", "enquanto falta para..." | Causalidade não demonstrada. | Fatos separados, sem ligação causal. |
| "o governador/presidente gastou"; nome de autoridade junto a valor | A fonte não vincula despesa a pessoa. | "o governo do estado...", "a União". |
| "per capita", "por habitante", "cada brasileiro paga", "você pagou R$ X" | Não há população confiável na fonte (E-critic). | AV-09. |
| "real", "corrigido pela inflação", "acima da inflação", "em valores de hoje" | Valores nominais; correção não validada. | "variação nominal". |
| "recorde", "maior da história", "nunca antes" | Série de vários exercícios não validada. | Comparar só com o mesmo bimestre do ano anterior. |
| "previsão", "projeção", "tendência", "vai fechar o ano em", "no ritmo atual" | Projeções fora do MVP. | Nenhuma. |
| "despesa total", "total das despesas", "total de gastos" (para o indicador) | `TotalDespesas` é outra linha: inclui o refinanciamento onde ele existe e, nos casos observados até 2019, incluía o superávit (E-critic). | "despesas pagas (exceto intraorçamentárias)". |
| Chamar "Superávit" ou "Total com superávit" de despesa | Aparecem na coluna de pagas, mas não são pagamento. Exemplo: MG, 2026 b4, Superavit '16805443364.65' e TotalDespesasComSuperavit '101999476074.35' (EV-14). | Não exibir essas linhas. |
| "orçamento" como sinônimo de pago | Orçamento é dotação; o indicador é pagamento. | "pago". |
| "cortou", "aumentou gastos", "economizou" | Atribuem intenção. | "pagou x,x% a menos (ou a mais) que no mesmo bimestre de {ano}, em valores nominais". |
| "auditado", "verificado pelo PortalDash" | Fazemos verificações de consistência e, em poucos casos, conferência com a publicação oficial; não auditoria. | "conferido com a publicação oficial", só onde houve ([seção 7.3](#73-cobertura-parcial)). |
| "zero", "R$ 0", "nada" para ausência | Ausência não é zero (prompt mestre §5). | "sem dado" + motivo. |
| "gasto público" junto a um número | Ambíguo. | "Gasto público" só como tema geral, sem número ("portal sobre gastos públicos"). |

### 5.3 Rótulos fixos

- **Nome completo do indicador:** "Despesas pagas no exercício, acumuladas até o bimestre (exceto intraorçamentárias)".
- **Rótulo curto** (cartões e eixos): "Despesas pagas (acumulado no ano)", sempre com o subtítulo "exceto intraorçamentárias · até o {n}º bimestre de {ano} ({jan–mês})".
- **Página central:** "Brasil: União, estados e DF lado a lado". Nunca "Gasto do Brasil".
- **Status:** "Homologado" (HO) e "Retificado" (RE), sempre com "em dd/mm/aaaa".

### 5.4 Glossário para o leitor (revisar junto com a metodologia)

- **Despesa paga:** valor efetivamente pago. No RREO, a coluna de pagas vem depois das de empenhadas e liquidadas, e em todas as linhas observadas da União (2025, 6º bimestre) o pago foi menor ou igual ao liquidado **[Dado]** (E-uniao-inv).
- **Acumulado até o bimestre:** soma de janeiro até o fim do bimestre informado; recomeça a cada ano.
- **Bimestre:** 1º = jan–fev, 2º = mar–abr, 3º = mai–jun, 4º = jul–ago, 5º = set–out, 6º = nov–dez. **[Inferência]** É a convenção da LRF; os títulos dos PDFs confirmam os acumulados que correspondem ao 4º e ao 6º bimestres da União ("JANEIRO A AGOSTO DE 2026", "JANEIRO A DEZEMBRO DE 2025"; E-uniao-inv) e o 6º bimestre de 2023 do estado do RJ ("JANEIRO A DEZEMBRO 2023/BIMESTRE NOVEMBRO-DEZEMBRO"; E-rj-rec). A API não informa os meses de cada bimestre (E-rj-inv).
- **Intraorçamentárias:** operações entre órgãos e entidades do mesmo ente. **[Inferência]** conceitual (E-uniao-inv, E-rj-inv), a confirmar no MDF. Ficam fora para não contar duas vezes dentro do mesmo ente.
- **Refinanciamento da dívida:** linha própria do Anexo 01 ("Amortização da dívida / refinanciamento"), fora do indicador.
- **Homologado (HO) / Retificado (RE):** status da declaração no extrato de entregas do Siconfi **[Dado]** (E-cob, E-rj-inv). "Retificado" é o status de uma declaração que passou por retificação; o Siconfi não informa o que mudou, e o extrato não mostra a data original (E-cob, E-critic). Não indica, por si, erro ou irregularidade.
- **Siconfi:** sistema do Tesouro Nacional que recebe as declarações fiscais dos entes.

## 6. Números, datas e unidades (pt-BR)

### 6.1 Origem do número

- Todo número exibido vem do texto decimal preservado (`valor_texto`) ou da string decimal da API própria, que serializa valores monetários como string. Nunca de `float` ou `Number` (decisão de arquitetura; prompt mestre §5).
- O arredondamento é feito em aritmética decimal, **meio para cima** (ROUND_HALF_UP). Foi essa regra que reproduziu os valores do PDF da União em R$ mil (E-uniao-rec). Isso não prova que o Tesouro use a mesma regra; a escolha é do PortalDash.
- Percentuais e variações são calculados com os valores exatos e só depois arredondados.

### 6.2 Moeda e separadores

- "R$" + espaço não separável + número. Milhar com ponto, decimal com vírgula: R$ 2.821.965.337.713,47.
- O valor exato sempre tem duas casas, mesmo quando a fonte omite zeros finais. A fonte enviou, por exemplo, '196232085973.5' (União, 2025 b6, Anexo 02; E-uniao-inv) e '39754264807' (E-docs), que se exibem como R$ 196.232.085.973,50 e R$ 39.754.264.807,00.
- Negativo com sinal de menos antes do símbolo: −R$ 442.945.342,36. Há valores negativos na fonte, como '-442945342.36' (E-docs).
- Atenção: '39754264807' e '-442945342.36' vêm de uma amostra do **município** do Rio de Janeiro (`cod_ibge` 3304557, RREO-Anexo 01 de 2025 b6, linhas de receita), arquivo `siconfi\docs\raw\rreo_2025_p6_anexo01_3304557.json`. Servem só como exemplo de formato; municípios estão fora do escopo, e esses valores nunca aparecem como dado do estado.

### 6.3 Escalas

Regra pedida na especificação destas diretrizes: valores em bilhões com uma casa decimal quando arredondados, sempre indicando o arredondamento. O E-critic ainda lista a precisão de exibição entre as decisões de Gabriel, então a regra segue para confirmação **[Pendente — Gabriel]**. As faixas de milhões e de valor exato e a ausência de "trilhões" são **[Proposta]** deste documento.

| Valor exato | Exibição arredondada | Exemplo |
|---|---|---|
| ≥ R$ 1 bilhão | bilhões, 1 casa decimal fixa | '2821965337713.47' → R$ 2.822,0 bilhões |
| ≥ R$ 1 milhão e < R$ 1 bilhão | milhões, 1 casa decimal fixa | '230165335.57' → R$ 230,2 milhões |
| < R$ 1 milhão | valor exato | — |

- Escala única em bilhões para União e estados, também acima de R$ 1 trilhão, para que todos fiquem na mesma régua. Não usar "trilhões" no MVP.
- A casa decimal é fixa: "R$ 66,0 bilhões", não "R$ 66 bilhões".
- A escala é escolhida depois do arredondamento: se o valor em milhões arredondar para 1.000,0, exibir em bilhões.
- Singular abaixo de 2 ("R$ 1,5 bilhão", "R$ 1,2 milhão"); plural a partir de 2 ("R$ 2,0 bilhões").
- Abreviações "bi" e "mi" só em eixos, rótulos de gráfico e tabelas estreitas, com a legenda "R$ bi = bilhões de reais, valores arredondados".

### 6.4 Indicação de arredondamento

Todo valor arredondado sinaliza que foi arredondado e dá acesso ao exato:

- **Cartão:** valor arredondado em destaque, nota "valor arredondado" visível e valor exato logo abaixo ou num detalhe acessível por teclado e leitor de tela. Tooltip que só abre com mouse não basta.
- **Texto corrido:** "(valor arredondado)" na primeira menção do bloco; "(valores arredondados)" quando houver vários.
- **Gráficos:** legenda com a regra; a tabela alternativa traz os valores exatos.
- **API própria:** entrega o valor exato (string). Arredondar é tarefa da interface.

### 6.5 Percentuais

- Uma casa decimal, vírgula, sem espaço: "10,1%".
- Sempre com a base: "10,1% das despesas pagas pela União em 2025 (exceto intraorçamentárias)".
- Só entre valores do mesmo ente, exercício, bimestre e snapshot.
- Diferença entre dois percentuais é dada em "pontos percentuais (p.p.)", nunca em "%".
- Na composição, os grupos se somam dentro de cada nível (Correntes = Pessoal + Juros + Outras; Capital = Investimentos + Inversões + Amortização), e os dois níveis não se empilham no mesmo gráfico. Por causa do arredondamento, as partes podem não somar exatamente 100,0%; avisar ("a soma pode diferir de 100% por arredondamento").
- **[Proposta]** Só exibir a composição como partes de um todo se a soma dos grupos conferir com o total naquele snapshot. Pelas decisões de arquitetura, a ingestão verifica Exceto-intra = Correntes + Capital (e Subtotal = Exceto-intra + Intra, quando a linha intra existe) antes de ativar o snapshot. A soma dos grupos dentro de cada categoria só foi conferida nos entes observados: União 2025 b6 e estado do RJ 2025 b6 e 2026 b4 (E-uniao-inv, E-rj-inv).

### 6.6 Variação ano contra ano

- Mostrar os dois valores (arredondados, com os exatos acessíveis), os dois status e a variação: "+x,x% (variação nominal)" ou "−x,x% (variação nominal)", acompanhada de AV-08.
- Sinal sempre explícito; a palavra "nominal" sempre escrita.
- Só calcular quando os dois lados tiverem dado. Caso contrário, "comparação indisponível" e o motivo.

### 6.7 Datas e períodos

Três datas, sempre separadas e rotuladas (prompt mestre §5; E-critic, `natureza_temporal`):

| Data | Rótulo | Formato | Exemplo |
|---|---|---|---|
| Referência | "Referência" | {n}º bimestre de {aaaa} ({jan–mês}), acumulado | 4º bimestre de 2026 (jan–ago) |
| Status no Siconfi | "Homologado em" / "Retificado em" | dd/mm/aaaa | Homologado em 30/09/2026 |
| Coleta | "Coletado em" | dd/mm/aaaa, hh:mm (horário de Brasília) | 01/10/2026, 22:23 |

- A coleta é registrada em UTC pelo nosso relógio e exibida no horário de Brasília. Atenção: as coletas da Etapa 1 têm data UTC de 02/10/2026, mas aconteceram em 01/10/2026 no horário de Brasília ('2026-10-02T01:23:10Z' = 01/10/2026, 22:23).
- `data_status` vem com sufixo 'Z', mas o fuso real não foi verificado **[Lacuna]** (E-critic). **[Proposta]** Exibir só a data como registrada pela fonte, sem hora e sem conversão de fuso, até que isso seja verificado.
- `data_status` é a data do status atual (HO ou RE) no Siconfi, segundo o relatório crítico (E-critic). O extrato traz uma única linha por entregável, período e instituição, sem histórico e, nos itens RE, sem a data original de homologação **[Dado]** (E-cob, E-rj-inv). Um status HO pode não coincidir com a entrega original: o 1º bimestre de 2025 da União aparece como HO em '2025-05-09T22:31:07Z', depois do fim do bimestre seguinte **[Dado]** (E-cob). Também não é a data de publicação no diário oficial. Nunca chamá-la de "data de publicação".
- Meses abreviados em minúsculas, com meia-risca: "jan–ago/2026".
- Ordinal com "º": "4º bimestre".

### 6.8 Casos de teste de formatação

Servem como testes da camada de formatação (`src/lib/formatting/`).

| Entrada (string) | Exato | Arredondado |
|---|---|---|
| '2821965337713.47' | R$ 2.821.965.337.713,47 | R$ 2.822,0 bilhões |
| '3606510496180.06' | R$ 3.606.510.496.180,06 | R$ 3.606,5 bilhões |
| '224014883002.29' | R$ 224.014.883.002,29 | R$ 224,0 bilhões |
| '65960575113.15' | R$ 65.960.575.113,15 | R$ 66,0 bilhões |
| '2957181316.06' | R$ 2.957.181.316,06 | R$ 3,0 bilhões |
| '230165335.57' | R$ 230.165.335,57 | R$ 230,2 milhões |
| '196232085973.5' | R$ 196.232.085.973,50 | R$ 196,2 bilhões |
| '39754264807' | R$ 39.754.264.807,00 | R$ 39,8 bilhões |
| '-442945342.36' | −R$ 442.945.342,36 | −R$ 442,9 milhões |
| '999950000' (valor sintético de teste, não vem da fonte) | R$ 999.950.000,00 | R$ 1,0 bilhão (troca de escala após arredondar) |
| '363469278379.43' ÷ '3606510496180.06' | — | 10,1% |

### 6.9 Gráficos

- Barras começam em zero.
- Série acumulada rotulada "acumulado no ano". Pontos ligados só entre bimestres com dado, sem interpolação.
- Não empilhar o total com as suas subcategorias; não exibir as linhas intraorçamentárias duplicadas da fonte.
- A cor nunca é a única forma de informação; toda visualização tem tabela ou lista alternativa (prompt mestre §4).
- Títulos descritivos, não opinativos: "Despesas pagas por grupo — União, 2025 (jan–dez)", e não "O peso da dívida".
- Capturas para vídeo incluem no enquadramento ente, período, fonte, status e data de coleta.

### 6.10 Cartão do indicador: exemplo com dados da Etapa 1

```text
Despesas pagas (acumulado no ano)
União · exceto intraorçamentárias · até o 4º bimestre de 2026 (jan–ago)

R$ 2.822,0 bilhões                                    valor arredondado
Valor exato: R$ 2.821.965.337.713,47

Homologado em 30/09/2026 · Coletado em 01/10/2026, 22:23 (horário de Brasília)
Fonte: Siconfi/Tesouro Nacional — RREO, Anexo 01 · Metodologia v0.1.0
Conferido com a publicação oficial do Tesouro (precisão de R$ mil)
Não inclui intraorçamentárias nem refinanciamento da dívida. Pela estrutura do
relatório, também não inclui restos a pagar de anos anteriores (confirmação pendente).
Valores nominais.
```

Base: EV-01, EV-02 e EV-10. Em produção, "Coletado em" é a data da ingestão que gerou o snapshot ativo. A linha sobre restos a pagar segue o texto provisório do AV-03 até a confirmação no MDF.

## 7. Ausência, retificação e cobertura parcial

### 7.1 Ausência

Regra: ausência não é zero. Na interface, "Sem dado" + motivo. Em gráfico, lacuna (sem barra, sem ponto, sem interpolação). Em listas ordenadas, no fim, com rótulo.

| Situação | Como se detecta | Texto exibido | Evidência do comportamento |
|---|---|---|---|
| Bimestre ainda não declarado | Não há linha do RREO no extrato do ente. | "Sem dado: o {n}º bimestre de {ano} ainda não consta no Siconfi para {ente} (coleta de dd/mm/aaaa)." | O 5º bimestre de 2026 não constava em nenhum extrato **[Dado]** (EV-16). O `/rreo` respondeu HTTP 200 com zero itens, sem erro (EV-13). |
| Declaração registrada, valores ainda não disponíveis na API | Extrato com HO ou RE; `/rreo` vazio. | "Sem dado: a declaração consta no Siconfi, mas os valores ainda não estavam disponíveis na coleta de dd/mm/aaaa." | A defasagem real é desconhecida **[Lacuna]** (E-critic). |
| Linha ausente na declaração | A célula do indicador não veio. | "Sem dado: a linha não consta na declaração de {ente}." | No `/rreo`, células sem valor não vêm no JSON **[Dado]** (E-docs, E-rj-inv). Nenhum valor zero foi observado no RREO do estado do RJ (E-rj-inv), e a "Reserva de Contingência" aparece com pagas 0 no PDF da União, mas sem célula de pagas no Siconfi (EV-03, EV-04). Que a fonte sempre omita o zero em vez de enviá-lo é **[Inferência]**. |
| Declaração reprovada nas verificações | Identidades não fecham ou a chave se repete. | Com snapshot anterior: "Exibindo a versão coletada em dd/mm/aaaa; a coleta mais recente está em verificação." Sem snapshot anterior: "Sem dado: declaração em verificação." | Decisão de arquitetura: só snapshot válido é ativado. |
| Fonte indisponível na coleta | Erro de rede, timeout ou 5xx. | Mantém o último ativo: "Fonte indisponível na última tentativa (dd/mm/aaaa, hh:mm). Valores da coleta de dd/mm/aaaa." | Houve HTTP 502 em `/anexos-relatorios` em '2026-10-02T01:19:22Z' (EV-17) e, no mesmo endpoint, uma tentativa sem resposta (timeout de 120 s) iniciada às 01:19:21Z (E-rj-inv). |
| UF ainda não confirmada | A ingestão ainda não verificou a célula. | "Em verificação." | Na Etapa 1 a célula só foi confirmada para União, SP, RJ, MG e DF (E-critic). |

Nunca: exibir "0", "R$ 0,00", "—" sem legenda ou "n/d" sem explicação; preencher com o valor de outro bimestre; somar ou ordenar como se a ausência fosse zero.

### 7.2 Retificação

O que sabemos da fonte:

- O extrato traz o status (HO ou RE) e `data_status`, com uma linha por entregável, período e instituição, sem histórico **[Dado]** (E-cob, E-rj-inv).
- O `/rreo` não informa versão nem data **[Dado]** (E-uniao-inv, E-rj-inv). Presume-se que sirva só a versão vigente **[Inferência]** (E-rj-inv), e não dá para saber se um valor coletado é anterior ou posterior a uma retificação **[Lacuna]** (E-critic).
- Há retificações tardias. Os RREOs do 6º bimestre de 2025 de SP, RJ e DF estavam como retificados, com `data_status` entre 16/04 e 08/05/2026 ('2026-04-16T16:07:44Z', '2026-05-06T17:14:12Z', '2026-05-08T16:59:04Z'; EV-09, EV-12). Só 4 dos 28 entes tiveram o extrato de 2025 consultado (União, SP, RJ e DF); a situação do 6º bimestre de 2025 dos outros 24 não foi verificada **[Lacuna]** (E-critic). Em 2026, o RJ (1º e 2º bimestres) e SP (1º bimestre) estavam com status retificado na coleta (EV-08, EV-12). Que os valores do b6 possam mudar meses depois do prazo é **[Inferência]**: nenhum valor de antes e de depois de uma retificação foi observado (E-critic).
- A publicação e o Siconfi podem divergir. O RREO de dez/2025 da União foi republicado pelo Tesouro (página com "Publicado em 30/05/2026"; arquivo com Last-Modified de 17/07/2026), e o extrato não mostra RE. As despesas pagas bateram em R$ mil, mas 12 células de empenhado e saldo divergiram (EV-04; E-critic).
- O PortalDash grava o extrato a cada coleta (decisão de arquitetura). O nosso histórico de status começa na primeira coleta.

Como exibir:

- Todo valor tem um selo de status: "Homologado em dd/mm/aaaa" ou "Retificado em dd/mm/aaaa".
- Texto para RE: "Declaração retificada pelo ente em dd/mm/aaaa. O Siconfi não informa o que mudou."
- Quando o PortalDash tiver duas versões coletadas com valores diferentes: "Valor alterado entre as coletas de dd/mm/aaaa (R$ X) e dd/mm/aaaa (R$ Y), após retificação declarada em dd/mm/aaaa." O valor exibido é o do snapshot ativo. **[Pendente — Gabriel]** Política de versões: só o último valor com selo, ou também o histórico.
- Sem versão anterior coletada: "Não temos versão anterior coletada para comparar."
- Comparação ano contra ano e série: status de cada ponto, com AV-08 (ano contra ano) ou AV-10 (série intra-anual).
- Linguagem: "retificou", "a declaração consta como retificada". Nunca "maquiou", "alterou às escondidas" ou "corrigiu erro".
- O valor exibido é o declarado ao Siconfi. Se soubermos de divergência com a publicação do próprio ente, avisamos no recorte e em /fontes, sem escolher um lado sem metodologia.
- Mudança de valor por retificação da fonte é **atualização de dados**, não correção do PortalDash. Fica no histórico do recorte (tipo B da [seção 8.2](#82-tipos)).

### 7.3 Cobertura parcial

- Toda vista com vários entes declara a cobertura: "{N} de 27 UFs com dado para o {n}º bimestre de {ano} (coleta de dd/mm/aaaa)". Na página central, a União é informada à parte.
- Entes sem dado continuam na tabela, com o motivo. Nunca somem em silêncio.
- Não há total em nenhum caso, com cobertura completa ou parcial.
- Mapa: UF sem dado com hachura e rótulo, não só cor; a tabela alternativa traz o motivo.
- Série incompleta no ano: só os pontos existentes, com a nota "{ano}: dados até o {n}º bimestre". Bimestres futuros aparecem como "ainda não declarado", sem linha que chegue até eles.
- **[Proposta]** Selo "Conferido com a publicação oficial" só onde houve reconciliação externa, com a precisão alcançada: União 2025 b6 e 2026 b4, em R$ mil (EV-02, EV-04); estado do RJ 2023 b6, só nas linhas de total, ao centavo (EV-15). No caso do RJ 2023, o selo precisa dizer que a publicação foi lida numa cópia do Internet Archive, e não no site da SEFAZ-RJ, e que a declaração está como retificada em '2024-07-03T22:30:39Z', depois da emissão do PDF (24/01/2024) (E-rj-rec). A coincidência das linhas de total não se estende a outras linhas nem a outros anos (E-critic). Nos demais casos: "Declarado ao Siconfi; não conferido com publicação do ente".

## 8. Correções públicas

### 8.1 Princípios

- Corrigir assim que o erro for confirmado, com o mesmo destaque que o erro teve.
- Nunca apagar em silêncio: o registro diz o que foi publicado, o que é correto e por quê.
- **[Proposta]** Número sabidamente errado não fica no ar durante a investigação: o recorte passa a "em revisão".
- Distinguir erro do PortalDash de mudança na fonte.

### 8.2 Tipos

| Tipo | Exemplo | Onde se registra |
|---|---|---|
| A — Erro do PortalDash | Cálculo, linha errada, rótulo, texto, gráfico, formatação. | Registro de correções + CHANGELOG (Fixed) + nota no recorte. |
| B — Atualização por retificação da fonte | O ente retificou e o valor mudou. | Histórico do recorte (snapshots e extrato). Não é "correção". |
| C — Mudança de metodologia | Gabriel troca a linha-manchete. | Nova versão da metodologia + CHANGELOG + registro de correções com os efeitos nos números já publicados (prompt mestre §8). |
| D — Inconsistência da fonte | Divergência entre publicação e Siconfi (EV-04). | Aviso no recorte e em /fontes. Se afetar a validação, o recorte não é publicado. |

### 8.3 Campos do registro

| Campo | Conteúdo |
|---|---|
| ID | COR-{aaaa}-{nnn} |
| Data do registro | dd/mm/aaaa, horário de Brasília |
| Tipo | A, C ou D |
| Onde apareceu | Páginas, rotas da API e recortes (ente, exercício, bimestre, conceito) |
| Período no ar | De dd/mm/aaaa a dd/mm/aaaa |
| O que foi publicado | Valor exato e texto |
| O que é correto | Valor exato e texto |
| Causa | Descrição objetiva |
| Como foi detectado | Teste, revisão, leitor ou fonte |
| Evidência | URL, data de coleta, valor da fonte |
| Versões | Software (`package.json`) e metodologia, antes e depois |
| Teste de regressão | O teste que impede a repetição, quando couber |
| Aprovação | Quem aprovou (Gabriel, no tipo C) |

### 8.4 Onde e como exibir

- **No recorte afetado:** selo "Corrigido em dd/mm/aaaa", com link para o registro.
- **Em /metodologia, seção "Correções":** lista completa, da mais recente para a mais antiga (o prompt mestre §4 inclui correções em /metodologia).
- **Na API própria:** aviso no campo `avisos` das respostas do recorte afetado. **[Proposta]** Por 90 dias.
- **CHANGELOG.md:** tipos A e C (seções Fixed ou Changed), explicando o impacto nos dados.
- **[Proposta]** Registro versionado no repositório, criado na primeira correção (por exemplo `docs/correcoes.md`) e lido pela página /metodologia.
- **[Pendente — Gabriel]** Canais externos (vídeos, redes): se um número errado foi usado ali, a correção sai no mesmo canal. Canal para leitores apontarem erros: a definir, já que não há comentários nem cadastro.

### 8.5 Modelo de nota (EXEMPLO FICTÍCIO — não ocorreu)

> **Correção COR-2026-001 (EXEMPLO FICTÍCIO), registrada em dd/mm/aaaa.** Entre dd/mm e dd/mm/aaaa, esta página exibiu R$ 3.111,9 bilhões como "despesas pagas", somando a União e dois estados. A soma não deveria ter sido publicada: não existe total consolidado, e as transferências da União seriam contadas duas vezes. Os valores corretos aparecem separados, até o 4º bimestre de 2026: União, R$ 2.822,0 bilhões; estado de São Paulo, R$ 224,0 bilhões; estado do Rio de Janeiro, R$ 66,0 bilhões (valores arredondados). Causa: erro de agregação na interface. Um teste de regressão foi adicionado.

## 9. Checklist editorial antes de publicar

Aplica-se a todo texto, cartão, pergunta, gráfico, aviso da API e captura para vídeo. Um item não cumprido bloqueia a publicação.

**Número e fonte**

- [ ] O número vem de snapshot ativo e validado (célula presente, identidades conferidas), não de fixture.
- [ ] Linha e coluna certas: `DespesasExcetoIntraOrcamentarias` na coluna 'DESPESAS PAGAS ATÉ O BIMESTRE (j)', ou um grupo comum do Anexo 01. Nunca `TotalDespesas`, `Superavit` ou `TotalDespesasComSuperavit`.
- [ ] O valor exato confere com `valor_texto`, e a formatação partiu de string decimal.
- [ ] Fonte citada (Siconfi/Tesouro Nacional, RREO-Anexo 01) e versão da metodologia visível.

**Período e datas**

- [ ] Ente, exercício e bimestre explícitos, com "acumulado" e os meses (jan–mês).
- [ ] Três datas separadas: referência; status no Siconfi (HO ou RE, com data); coleta (horário de Brasília).
- [ ] Nenhum "no bimestre", "mensal" ou "por dia"; nenhuma soma de bimestres.

**Agregação e comparação**

- [ ] Nenhuma soma entre entes; nenhum "Brasil gastou"; AV-04 presente onde União e estados aparecem juntos.
- [ ] Comparações com o mesmo bimestre, o mesmo conceito e dado dos dois lados; "nominal" escrito; status de cada lado; AV-08.
- [ ] Composição só com grupos comuns, sem somar total com subcategorias e sem as linhas intraorçamentárias duplicadas.
- [ ] União fora de rankings com estados; comparação entre estados acompanhada de AV-09.

**Texto**

- [ ] Dado, hipótese e interpretação separados e rotulados.
- [ ] Sem acusação, causalidade, desperdício, corrupção ou juízo; nenhuma pessoa ligada a despesa.
- [ ] Nenhum termo da lista proibida ([seção 5.2](#52-proibido)).
- [ ] Sem projeção, contador ou animação de contagem; nada que sugira tempo real.
- [ ] "Estado do Rio de Janeiro", "estado de São Paulo"; nunca "Rio" sozinho.
- [ ] Nenhuma promessa fora do MVP ("saúde", "educação", "por habitante").

**Perguntas críticas**

- [ ] Recorte citado por completo e validado.
- [ ] Passa no teste da resposta neutra ([seção 4.6](#46-teste-rápido-antes-de-publicar-uma-pergunta)).
- [ ] Linha "o que o dado não diz" presente.
- [ ] Revisão de Gabriel, se for adotada como regra **[Pendente — Gabriel]**.

**Formatação**

- [ ] pt-BR, R$, escala da [seção 6.3](#63-escalas), uma casa decimal fixa, arredondamento indicado, valor exato acessível.
- [ ] Percentuais com a base declarada.

**Ausência, retificação e cobertura**

- [ ] Ausência exibida como "sem dado" + motivo; nenhum zero inventado.
- [ ] Status RE visível, com data e texto padrão.
- [ ] Cobertura declarada ("N de 27 UFs") e entes sem dado listados.
- [ ] Selo "conferido" só onde houve reconciliação.

**Visual e acessibilidade**

- [ ] A cor não é a única informação; há tabela alternativa; foco e nomes acessíveis.
- [ ] Título do gráfico descritivo; barras a partir de zero; sem interpolação.
- [ ] Captura para vídeo com ente, período, fonte, status e coleta no enquadramento.

**Depois de publicar**

- [ ] Se algo publicado estiver errado, seguir a [seção 8](#8-correções-públicas).

## 10. Decisões pendentes e decisões fechadas

### Pendentes (Gabriel)

| # | Decisão | Situação atual | Efeito editorial |
|---|---|---|---|
| 1 | Linha-manchete do indicador | Provisória: `DespesasExcetoIntraOrcamentarias`. Alternativa: `SubtotalDasDespesas` (inclui intraorçamentárias). Decidir também se juros e amortização da dívida ficam dentro da manchete ou aparecem destacados (E-critic). | Nome, avisos e exemplos mudam. A troca é correção do tipo C ([seção 8](#8-correções-públicas)). |
| 2 | Mensagem de abertura | "Você paga. Acompanhe para onde vai." é proposta do prompt mestre. | [Seção 1](#1-identidade). |
| 3 | Precisão e escala | Bilhões com 1 casa e arredondamento sinalizado, como pede a especificação destas diretrizes; o E-critic ainda pede confirmação. Proposta: sem trilhões e milhões abaixo de R$ 1 bilhão. | [Seção 6.3](#63-escalas). |
| 4 | Política de versões | Último valor com selo HO/RE; histórico de versões em aberto. | [Seção 7.2](#72-retificação). |
| 5 | Revisão humana de perguntas críticas | Proposta: obrigatória para perguntas novas. | [Seção 4.6](#46-teste-rápido-antes-de-publicar-uma-pergunta). |
| 6 | Canais | Para leitores apontarem erros e para publicar correções fora do portal. | [Seção 8.4](#84-onde-e-como-exibir). |
| 7 | Exibição de `data_status` | Proposta: só a data, sem conversão de fuso, até verificar o fuso. | [Seção 6.7](#67-datas-e-períodos). |
| 8 | Selo "conferido com a publicação oficial" | Proposta: só nas reconciliações feitas, com a precisão alcançada. | [Seção 7.3](#73-cobertura-parcial). |
| 9 | Animação de entrada | Proposta: proibida no MVP. | [Seção 3.5](#35-nada-de-tempo-real). |
| 10 | Texto público sobre restos a pagar | A exclusão é inferida; confirmar no MDF antes de afirmar sem ressalva. Até lá vale o texto provisório do AV-03. | AV-03 e [seção 6.10](#610-cartão-do-indicador-exemplo-com-dados-da-etapa-1). |
| 11 | Frequência de atualização e o que mostrar entre a homologação e a disponibilidade na API | Em aberto (E-critic). | [Seção 7.1](#71-ausência). |
| 12 | Prazos de correção | Proposta: "em revisão" imediato; aviso na API por 90 dias. | [Seção 8](#8-correções-públicas). |
| 13 | Apresentação temporal | Só o acumulado no ano (recomendação do E-critic e regra deste documento). A alternativa, "no bimestre" por diferença com aviso, é decisão de Gabriel. | [Seção 3.7](#37-o-que-o-mvp-pode-publicar). |
| 14 | Per capita e valores reais | Fora do MVP por falta de fonte validada. Se e como entram depois (fonte de população, índice de preços, data-base) é decisão de Gabriel (E-critic). | [Seções 3.3](#33-valor-alto-isolado-não-fundamenta-conclusão) e [3.7](#37-o-que-o-mvp-pode-publicar). |
| 15 | Profundidade histórica | Em aberto: há quebra estrutural entre 2019 e 2020 no Anexo 01 dos casos observados (E-critic). Enquanto isso, nada de série de vários exercícios. | [Seção 3.7](#37-o-que-o-mvp-pode-publicar). |
| 16 | Tratamento do DF | Em aberto: a esfera do DF é 'D' em `/entes` e 'E' no `/rreo`, e a relação entre o Fundo Constitucional do DF (pago pela União) e as despesas do DF não foi investigada (E-critic). Pode exigir aviso próprio além do AV-04. | [Seção 3.7](#37-o-que-o-mvp-pode-publicar). |
| 17 | Visão anual por função (DCA) | Em aberto: a DCA tem pagas por função, mas é anual, sai cerca de 4 meses depois do fim do exercício e usa outro conceito de "exceto intraorçamentárias" (E-critic). | [Seção 1](#1-identidade). |

### Fechadas (não reabrir sem Gabriel)

- Sem total nacional consolidado e sem soma de estados.
- Conceito único 'pago'; bimestre explícito (1 a 6) no contrato da API e no texto, nunca "período".
- Entes: União, 26 estados e DF. Municípios ficam fora.
- Sem projeções e sem contadores que sugiram tempo real no MVP.
- No MVP, sem per capita e sem valores reais, porque não há fonte validada (recortes não validados; E-critic). A inclusão futura é a decisão pendente 14.
- Indicadores calculados na leitura a partir dos snapshots ativos; falha na fonte ou snapshot inválido mantém o último ativo.

## 11. Evidências citadas

### Relatórios da Etapa 1

Os JSON abaixo e as amostras brutas estão fora do repositório, no scratchpad local da sessão **[Lacuna]**: enquanto não forem arquivados no projeto, os caminhos só valem nesta máquina. O registro consolidado da Etapa 1 está no repositório, em `docs/validacao-fonte-siconfi-2026-10.md`. Quando o crítico corrige outro relatório, prevalece o crítico.

| Sigla | Arquivo |
|---|---|
| E-docs | `<scratchpad>\etapa1\docs.json` |
| E-cob | `...\scratchpad\etapa1\cobertura.json` |
| E-uniao-inv | `...\scratchpad\etapa1\uniao-investigacao.json` |
| E-uniao-rec | `...\scratchpad\etapa1\uniao-reconciliacao.json` |
| E-rj-inv | `...\scratchpad\etapa1\rj-investigacao.json` |
| E-rj-rec | `...\scratchpad\etapa1\rj-reconciliacao.json` |
| E-critic | `...\scratchpad\etapa1\critic.json` |

Amostras brutas e logs: `...\scratchpad\siconfi\` (subpastas `docs`, `cobertura`, `uniao`, `rj`, `reconciliacao-uniao`, `reconciliacao-rj`, `revisao`).

### Evidências pontuais

Todas as respostas da API listadas abaixo voltaram com HTTP 200, salvo indicação contrária. Os valores aparecem exatamente como texto da fonte.

| ID | Consulta | Coleta (UTC) | O que sustenta | Relatório |
|---|---|---|---|---|
| EV-01 | `https://apidatalake.tesouro.gov.br/ords/cdwhprd/siconfi/tt/rreo?an_exercicio=2026&nr_periodo=4&co_tipo_demonstrativo=RREO&no_anexo=RREO-Anexo%2001&co_esfera=U&id_ente=1` | 2026-10-02T01:23:10Z (mesma célula também na coleta de 01:24:23Z, sem `no_anexo`) | União, 2026 b4, coluna (j): DespesasExcetoIntraOrcamentarias '2821965337713.47'; TransferenciasAEstadosDistritoFederalEMunicipios '531673082300.42'; refinanciamento (XII) '1141059765822.79'. | E-cob, E-uniao-inv, E-critic |
| EV-02 | `https://cdn.tesouro.gov.br/sistemas-internos/apex/producao/sistemas/thot/arquivos/publicacoes/55944_1800407/08_RREOAgo2026%20-%20Com%20Portaria%20Publicada.pdf` (página: `https://www.tesourotransparente.gov.br/publicacoes/relatorio-resumido-da-execucao-orcamentaria-rreo/2026/8`, "publicado em 30/09/2026") | 2026-10-02T01:27:45Z | RREO da União de agosto de 2026, Anexo 1, linha IX, pagas "Até o Mês": 2.821.965.338 (R$ mil). | E-uniao-inv, E-critic |
| EV-03 | `https://apidatalake.tesouro.gov.br/ords/cdwhprd/siconfi/tt/rreo?an_exercicio=2025&nr_periodo=6&co_tipo_demonstrativo=RREO&no_anexo=RREO-Anexo%2001&id_ente=1` | 2026-10-02T01:34:44Z (idêntica, linha a linha, à coleta paginada de 01:21:57Z) | União, 2025 b6, coluna (j): DespesasExcetoIntraOrcamentarias '3606510496180.06'; JurosEEncargosDaDivida '363469278379.43'; AmortizacaoDaDivida '353978003798.13'; refinanciamento '1417638361603.07'. Reserva de Contingência sem célula de pagas. | E-uniao-inv, E-uniao-rec |
| EV-04 | `https://cdn.tesouro.gov.br/sistemas-internos/apex/producao/sistemas/thot/arquivos/publicacoes/53743_1693038/12_%20RREODez2025%20(REPUBL_).pdf` | 2026-10-02T01:26:08Z | RREO da União de dez/2025, republicação (Last-Modified 2026-07-17): linha IX pagas 3.606.510.496 (R$ mil); Reserva de Contingência com pagas 0; divergência de 7 a 8 unidades de R$ mil em 12 células de empenhado e saldo; extrato sem RE. | E-uniao-rec, E-uniao-inv, E-critic |
| EV-05 | `https://apidatalake.tesouro.gov.br/ords/cdwhprd/siconfi/tt/rreo?an_exercicio=2026&nr_periodo=4&co_tipo_demonstrativo=RREO&no_anexo=RREO-Anexo%2001&co_esfera=E&id_ente=35` | 2026-10-02T01:23:22Z | Estado de SP, 2026 b4, coluna (j): DespesasExcetoIntraOrcamentarias '224014883002.29'. | E-cob, E-critic |
| EV-06 | `https://apidatalake.tesouro.gov.br/ords/cdwhprd/siconfi/tt/rreo?an_exercicio=2026&nr_periodo=4&co_tipo_demonstrativo=RREO&id_ente=33` | 2026-10-02T01:23:46Z | Estado do RJ, 2026 b4, coluna (j): linha VIII (DespesasExcetoIntraOrcamentarias) '65960575113.15'. | E-rj-inv |
| EV-07 | `https://apidatalake.tesouro.gov.br/ords/cdwhprd/siconfi/tt/rreo?an_exercicio=2025&nr_periodo=6&co_tipo_demonstrativo=RREO&id_ente=33` | 2026-10-02T01:22:05Z | Estado do RJ, 2025 b6, coluna (j): linha VIII '102599919210.67'; JurosEEncargosDaDivida '2957181316.06'; AmortizacaoDaDivida '230165335.57'. | E-rj-inv |
| EV-08 | `https://apidatalake.tesouro.gov.br/ords/cdwhprd/siconfi/tt/extrato_entregas?id_ente=33&an_referencia=2026` | 2026-10-02T01:21:51Z | RREO 2026 do estado do RJ: b1 RE '2026-03-30T11:28:18Z'; b2 RE '2026-05-29T12:32:07Z'; b3 HO '2026-07-30T16:23:58Z'; b4 HO '2026-09-30T22:36:35Z'. | E-rj-inv, E-cob |
| EV-09 | `https://apidatalake.tesouro.gov.br/ords/cdwhprd/siconfi/tt/extrato_entregas?id_ente=33&an_referencia=2025` | 2026-10-02T01:21:32Z | RREO 2025 b6 do estado do RJ: RE '2026-05-06T17:14:12Z'. | E-rj-inv, E-cob |
| EV-10 | `https://apidatalake.tesouro.gov.br/ords/cdwhprd/siconfi/tt/extrato_entregas?id_ente=1&an_referencia=2026` | 2026-10-02T01:21:47Z | RREO 2026 b4 da União: HO '2026-09-30T14:28:06Z'. | E-uniao-inv |
| EV-11 | `https://apidatalake.tesouro.gov.br/ords/cdwhprd/siconfi/tt/extrato_entregas?id_ente=1&an_referencia=2025` | 2026-10-02T01:21:36Z | RREO 2025 da União: b4 HO '2025-09-30T10:18:41Z'; b6 HO '2026-01-30T22:36:41Z'. | E-uniao-inv, E-cob |
| EV-12 | `https://apidatalake.tesouro.gov.br/ords/cdwhprd/siconfi/tt/extrato_entregas?id_ente=35&an_referencia=2026`; `...?id_ente=35&an_referencia=2025`; `...?id_ente=53&an_referencia=2025` | 01:22:01Z; 01:23:51Z; 01:23:54Z (2026-10-02, log `siconfi\cobertura\log_requisicoes.jsonl`) | SP: 2026 b4 HO '2026-09-30T11:45:11Z'; 2026 b1 RE '2026-06-02T16:09:31Z'; 2025 b6 RE '2026-04-16T16:07:44Z'. DF: 2025 b6 RE '2026-05-08T16:59:04Z'. | E-cob |
| EV-13 | `https://apidatalake.tesouro.gov.br/ords/cdwhprd/siconfi/tt/rreo?an_exercicio=2026&nr_periodo=5&co_tipo_demonstrativo=RREO&no_anexo=RREO-Anexo%2001&id_ente=33` | 2026-10-02T01:26:16Z | Período não entregue: HTTP 200 com `items=[]` e `count=0`, sem erro. | E-rj-inv |
| EV-14 | `https://apidatalake.tesouro.gov.br/ords/cdwhprd/siconfi/tt/rreo?an_exercicio=2026&nr_periodo=4&co_tipo_demonstrativo=RREO&no_anexo=RREO-Anexo%2001&id_ente=31` | 2026-10-02T01:49:16Z | MG, 2026 b4, coluna (j): Superavit '16805443364.65'; TotalDespesasComSuperavit '101999476074.35'; TotalDespesas '85194032709.7'. | E-critic |
| EV-15 | Siconfi: `https://apidatalake.tesouro.gov.br/ords/cdwhprd/siconfi/tt/rreo?an_exercicio=2023&nr_periodo=6&co_tipo_demonstrativo=RREO&no_anexo=RREO-Anexo%2001&id_ente=33`. Publicação (cópia do Internet Archive): `https://web.archive.org/web/20250118032313id_/https://portal.fazenda.rj.gov.br/contabilidade/wp-content/uploads/sites/25/2024/01/Anexo-01_6oBim_RREO_-2023_MDF-13aEd..pdf` | Siconfi 2026-10-02T01:41:16Z; PDF 2026-10-02T01:40:18Z | Estado do RJ, 2023 b6: 86 de 88 células das linhas de total iguais ao centavo (as 2 restantes são células que o Siconfi não traz); TotalDespesas '99217095187.47'. | E-rj-rec, E-critic |
| EV-16 | `https://apidatalake.tesouro.gov.br/ords/cdwhprd/siconfi/tt/extrato_entregas?id_ente={id}&an_referencia=2026` para os 28 entes | Entre 2026-10-02T01:20:45Z (União) e 01:22:16Z (DF), 28 requisições (log `siconfi\cobertura\log_requisicoes.jsonl`) | RREO 2026 b1 a b4 entregue pelos 28 entes; b4 homologado de '2026-09-18T14:47:08Z' (RN) a '2026-09-30T22:36:35Z' (RJ), 27 de 28 entre 24/09 e 30/09/2026; 5º bimestre ausente em todos. | E-cob, E-critic (contagem corrigida pelo crítico) |
| EV-17 | `https://apidatalake.tesouro.gov.br/ords/cdwhprd/siconfi/tt/anexos-relatorios` | 2026-10-02T01:19:22Z | HTTP 502 ("Service unavailable"); nova tentativa às 01:25:00Z com HTTP 200. | E-uniao-inv, E-critic |
