# Validação da fonte Siconfi: registro da Etapa 1

| Campo | Valor |
|---|---|
| Data do registro | 2026-10-01 (horário de Brasília) |
| Janela de coleta | 2026-10-02T01:18:45Z a 2026-10-02T01:51:31Z (UTC). Em Brasília, noite de 2026-10-01, das 22:18 às 22:51 |
| Fonte | API de dados abertos do Siconfi (Tesouro Nacional), `https://apidatalake.tesouro.gov.br/ords/cdwhprd/siconfi/tt/` |
| Contrato lido | `https://apidatalake.tesouro.gov.br/docs/siconfi.yaml` (Swagger 2.0, `info.version` 1.1.0, descrito como "versão beta"; `Last-Modified: Wed, 24 Jun 2026 14:31:16 GMT`; ETag `"80534262"`; lido em 2026-10-02T01:19:11Z, HTTP 200) |
| Situação | Validação **parcial**. O indicador candidato existe e é estável nos entes observados, e foi reconciliado com publicação oficial para a União (precisão de R$ mil) e para o RJ 2023 (ao centavo). A cobertura das 27 UFs está confirmada só pelo extrato de entregas. Detalhes na seção 1.2 |
| Metodologia do indicador | v0.1.0. A linha-manchete é **provisória** e depende de confirmação de Gabriel (seção 14) |
| Revisão | Pendente de Gabriel |

## Convenções deste documento

- **Fato observado**: consta de uma resposta coletada, com URL e horário UTC. Valores monetários aparecem entre crases e copiados do JSON exatamente como vieram (por exemplo `'111309173975.1'`, sem o zero final). Nada foi arredondado ou reformatado.
- **Valor de PDF**: copiado como impresso, com a unidade do documento. Por exemplo, `'3.606.510.496'` em R$ milhares.
- **Inferência**: conclusão tirada dos dados, mas não confirmada por documentação oficial. Vem marcada como tal.
- **Hipótese**: explicação possível, não testada.
- **Lacuna**: algo que não foi verificado.
- **Calculado nesta redação**: aritmética feita localmente sobre as amostras brutas salvas, sem nova consulta à fonte (por exemplo, identidades com `Decimal` ou diferenças entre horários).
- `BASE` significa `https://apidatalake.tesouro.gov.br/ords/cdwhprd/siconfi/tt/`.
- Todos os horários estão em UTC (sufixo `Z`). Os carimbos `data_status` da fonte também vêm com `Z`, mas o fuso real deles **não foi verificado** (lacuna L5).
- Quando o relatório crítico (`critic.json`) corrige outro relatório, vale a versão do crítico. Os casos estão na seção 9. Quando uma afirmação do próprio crítico é contrariada pelas amostras brutas, o texto diz isso e cita os arquivos (seções 5.4 e 9, I15).

---

## 1. Objetivo

Cumprir a Etapa 1 do prompt mestre, que pede consultar um recorte real, mapear os campos e reconciliar um valor, antes de definir qualquer indicador. Em concreto:

1. Ler a documentação e o contrato da API do Siconfi e registrar endpoints, paginação, limites, erros e divergências em relação ao spec.
2. Encontrar, no RREO, a célula que representa "despesas pagas" e documentar conceito, unidade, anexo, classificação, natureza temporal e o que ela inclui ou exclui.
3. Verificar se a União (1), os 26 estados e o DF (53) são comparáveis nesse recorte.
4. Reconciliar ao menos um valor com a publicação oficial correspondente.
5. Levantar a cobertura de entregas.
6. Registrar inconsistências, lacunas e decisões pendentes antes da ingestão (Etapa 3).

### 1.1 Critérios do prompt mestre (seção 5) e situação

| Critério | Situação | Onde |
|---|---|---|
| Verificar a documentação | Feito | Seção 3 |
| Consultar uma resposta real | Feito: 108 requisições ao host `apidatalake.tesouro.gov.br` (documentação e API), todas registradas em log | Seções 2 e 4 |
| Registrar URL, parâmetros, período, campos e referência de coleta | Feito | Seções 4 e 6 |
| Confirmar conceito, unidade, anexo, classificação e natureza temporal | **Parcial**. O Manual de Demonstrativos Fiscais (MDF) da STN não foi lido. A exclusão de restos a pagar da coluna (j) é inferência | Seção 5, lacuna L8 |
| Confirmar cobertura | **Parcial**. 2026 b1 a b4: 28 de 28 entes, pelo extrato. 2025 b6: só 4 de 28. Célula do indicador vista em 5 de 28 entes | Seção 8 |
| Reconciliar ao menos um valor com a publicação oficial | Feito. União 2025 b6 e 2026 b4 com precisão de R$ mil; RJ 2023 b6 ao centavo | Seção 7 |
| Verificar comparabilidade União × subnacionais | **Parcial**. Célula do indicador, identidades e os 8 grupos comuns presentes em União, SP, RJ, MG e DF (conferido nesta redação nas amostras); campos e colunas idênticos comparados só entre União e SP (2026 b4); nos outros 23 estados, não verificada | Seções 6 e 8.4 |
| Não prometer cobertura mensal, despesas por categoria ou total nacional antes da validação | Respeitado. Ver recortes não validados | Seção 12 |

### 1.2 Resumo dos resultados

- **Existe** uma célula de "despesas pagas" adequada: RREO-Anexo 01, coluna `'DESPESAS PAGAS ATÉ O BIMESTRE (j)'`. Ela é **acumulada no ano**; a fonte não tem "pagas no bimestre".
- A linha `cod_conta = 'DespesasExcetoIntraOrcamentarias'` estava presente e com a mesma chave em todos os casos observados: União 2019 b6, 2025 b5/b6 e 2026 b4; RJ b6 de 2015, 2018, 2019, 2020, 2021, 2023 e 2025, mais 2025 b5 e 2026 b4; SP 2025 b6 e 2026 b4; MG e DF 2026 b4. Os exercícios não listados (por exemplo RJ 2016, 2017, 2022 e 2024) não foram consultados. As identidades contábeis fecharam com aritmética exata em todos eles (seção 6.1).
- **União**: os valores de pagas batem com o RREO publicado pela STN com precisão de R$ mil, em 2025 b6 (28 de 30 linhas do PDF; as outras 2 não têm célula no Siconfi) e 2026 b4 (13 linhas). O PDF de 2025 é uma republicação, e o empenhado diverge de 7 a 8 unidades de R$ mil em 12 células.
- **RJ**: as linhas de total do Anexo 01 de 2023 b6, inclusive a linha do indicador, batem ao centavo com o PDF da SEFAZ-RJ (lido via cópia do Internet Archive): 86 de 88 células; as 2 restantes são saldos da linha XIV que o Siconfi não traz. 2025 tem só uma corroboração aproximada. A SEFAZ-RJ bloqueou o IP de coleta.
- **Cobertura**: o RREO de 2026 b1 a b4 consta do extrato para os 28 entes. O 2025 b6 só foi verificado para 4 entes.
- **Etiqueta da fonte**: cada agente foi sequencial, mas os agentes rodaram em paralelo. No agregado, o limite documentado de 1 req/s foi ultrapassado em 8 segundos, e houve um HTTP 502 (seção 2.2).

---

## 2. Método

### 2.1 Agentes e volume de requisições

A validação foi feita por agentes independentes, cada um com escopo próprio e log de requisições. A contagem abaixo considera só as linhas de log com o host `apidatalake.tesouro.gov.br` e foi recalculada com o script do crítico (`siconfi/revisao_log.py`) sobre os logs salvos.

| Agente | Escopo | Requisições ao apidatalake | Janela UTC | Ritmo declarado | Log |
|---|---|---|---|---|---|
| docs | Documentação, contrato, comportamento da API, erros | 31 (4 de documentação, incluindo o `http://` que devolveu 307) | 01:18:59Z a 01:29:43Z | Sequencial, intervalo de 1 s ou mais (na prática ~10 s) | `siconfi/docs/log_requisicoes.tsv` |
| cobertura | Entes, extrato 2026 dos 28 entes, extrato 2025 de 4 entes, comparabilidade União × SP | 40 (2 de documentação, 38 à API) | 01:19:23Z a 01:24:14Z | Sequencial, pausa de 1,1 s antes de cada uma (no log, ~2 s entre extratos) | `siconfi/cobertura/log_requisicoes.jsonl` |
| união | Investigação da União; PDFs da STN | 11 | 01:18:50Z a 01:25:00Z | Sequencial | `siconfi/uniao/requests.log` |
| rj | Investigação do Estado do RJ | 13 | 01:18:55Z a 01:26:23Z | Sequencial | `siconfi/rj/requests.log` |
| reconciliação União | Confirmação do Anexo 01 de 2025 b6 | 1 | 01:34:44Z | Uma chamada | `siconfi/reconciliacao-uniao/requests.log` |
| reconciliação RJ | Anexo 01 de 2023 b6 e extrato 2023 | 2 | 01:41:16Z a 01:41:18Z | Sequencial, intervalo de 1,5 s | `siconfi/reconciliacao-rj/requests.log` |
| **Subtotal das coletas** | | **98** | **01:18:50Z a 01:41:18Z** | | |
| revisão crítica | Conferência de DF, MG, RJ histórico, União 2019 e DCA | 10, todas HTTP 200 | 01:48:57Z a 01:51:31Z | Sequencial (~10 a 30 s) | `siconfi/revisao/requests.log` |
| versões | Versões da stack, advisories, Railway, OWASP e NIST | 0 (não consultou a fonte) | 2026-10-01, ~22h a 23h BRT | n/a | `etapa1/versions.json` |
| **Total ao host apidatalake** | | **108** | | | |

Fora da API, também houve requisições a: Tesouro Transparente, `thot-arquivos.tesouro.gov.br` e `cdn.tesouro.gov.br` (PDFs da STN), `siconfi.tesouro.gov.br` (página "Veja mais"), `www.tesouro.fazenda.gov.br` (DNS não resolveu), portal da SEFAZ-RJ, Portal da Transparência RJ, Internet Archive (`web.archive.org` e `archive.org`: Wayback, CDX e `available`) e IOERJ (DOERJ). Segundo os logs, foram sequenciais dentro de cada agente. Esses hosts não entram na contagem da tabela.

### 2.2 Etiqueta: o que de fato aconteceu

O spec diz: `'ATENÇÃO: Para fins de performance, o limite é de uma (01) requisição por segundo.'`. A página de entrada pede `'obedecer às orientações de uso para evitar o bloqueio do serviço'` (coletada em 2026-10-02T01:18:45Z).

**Registro honesto**: cada agente foi sequencial, mas os agentes de coleta rodaram **em paralelo** contra o mesmo host, e a soma passou de 1 req/s em alguns segundos.

| Medida (logs agregados) | Valor |
|---|---|
| Requisições ao apidatalake entre 01:18 e 01:41Z | 98 |
| Requisições no minuto 01:21Z | 25 |
| Segundos com 2 requisições registradas | 8: `01:18:59Z`, `01:21:32Z`, `01:21:43Z`, `01:21:47Z`, `01:21:51Z`, `01:22:05Z`, `01:23:46Z`, `01:26:16Z` |
| HTTP 502 | 1: `GET BASE/anexos-relatorios` às 2026-10-02T01:19:22Z (agente união), página HTML `'Service unavailable'` (amostra `siconfi/uniao/anexos_relatorios_502.html`) |
| Falha sem resposta no mesmo endpoint | Agente rj às 01:19:21Z: status `000`, timeout do curl após 120 s, 0 bytes |
| Mesmo endpoint, agente docs | 01:20:24Z: HTTP 200 depois de `69.26` s (`X-Cache: TCP_MISS`) |
| HTTP 429 ou cabeçalhos de rate limit | Nenhum observado |

- **Hipótese, não verificada**: o 502 foi causado pela concorrência. O que se observou é que três agentes chamaram a mesma rota lenta, sem cache, em chamadas sobrepostas, e um deles recebeu 502. A relação causal não foi testada.
- **Sobreposição (calculado nesta redação, supondo que o horário do log é o de início; ver seção 2.4)**: rj às 01:19:21Z (aberta até o timeout de 120 s, por volta de 01:21:21Z), união às 01:19:22Z (502) e docs às 01:20:24Z (resposta em `69.26` s, por volta de 01:21:33Z).
- As conclusões dos relatórios sobre ausência de bloqueio (por exemplo, "sem 429 com ~31 requisições") **não consideram** esse agregado. O comportamento de bloqueio da fonte continua desconhecido (lacuna L11).
- **Consequência para o projeto**: a ingestão terá um limitador **global** de taxa, sequencial, com intervalo mínimo de 1,1 s, e `pg_advisory_lock` para impedir execuções simultâneas (seção 13). Nenhum smoke test ou coleta futura deve rodar agentes em paralelo contra a fonte.

### 2.3 Tratamento numérico

- O campo `valor` vem como **número JSON** (não string), com a quantidade de casas variável. Exemplos do relatório docs: `'39754264807'`, `'31840769325.8'`, `'35863674442.81'` e negativos como `'-442945342.36'`. Nenhuma notação exponencial foi vista.
- Os agentes leram os JSON com `parse_float=str` ou `Decimal`, e fizeram os cálculos com `Decimal`. Os valores deste documento são o texto bruto do JSON.
- As identidades da seção 6.1 foram **conferidas nesta redação** com `Decimal`, sobre as amostras brutas salvas.

### 2.4 Limitações do método

- Os relatórios da União, do RJ e da reconciliação chegaram truncados ao crítico. Ele conferiu as afirmações pelos artefatos salvos (logs, JSON, scripts e saídas), e o que só existia no texto truncado não pôde ser checado (fonte: `critic.json`, lacunas).
- Os PDFs com mais de 2 MB (RREO da União de dez/2025, Prestação de Contas RJ 2025 Volume 01 e DOERJ de 30/01/2026) foram apagados depois da extração. A rastreabilidade fica pela URL, `Last-Modified`, ETag e, quando houve, sha256.
- Os logs registram um horário por requisição, sem dizer se é o início ou o fim da chamada. Isso só importa nas chamadas longas, como a de `69.26` s. **Inferência** (calculada nesta redação): nos logs do docs e do rj, o horário é o de início. Se fosse o de término, a chamada de `69.26` s do docs (01:20:24Z) teria começado por volta de 01:19:15Z, antes da chamada anterior do mesmo agente (01:20:14Z), e o timeout de 120 s do rj (01:19:21Z) teria começado antes da primeira chamada desse agente (01:18:55Z). Nenhum dos dois casos é possível num agente sequencial.

---

## 3. Contrato e comportamento observado da API

| Aspecto | Observado | Evidência |
|---|---|---|
| Protocolo | Só GET, sem autenticação, chave ou captcha. JSON em UTF-8, com `Content-Type: application/json` sem charset. HTTP/1.1 chunked, sem `Content-Length` | docs.json, `protocolo` |
| Host e base | Spec: `host: apidatalake.tesouro.gov.br/ords/cdwhprd/siconfi/tt/`. Atrás dele há CDN Azure Front Door (`x-azure-ref`, `X-Cache`) e, na origem, Oracle REST Data Services (ORDS) | docs.json |
| Caminho legado | `https://apidatalake.tesouro.gov.br/ords/siconfi/tt/extrato_entregas?id_ente=33&an_referencia=2026` (sem `cdwhprd`) devolveu bytes idênticos aos do caminho documentado (2026-10-02T01:26:23Z, 63 itens). **Há dois caminhos ativos e só um está no spec** | rj-investigacao.json; critic.json |
| Endpoints no spec (9) | `/rreo`, `/rgf`, `/dca`, `/msc_patrimonial`, `/msc_orcamentaria`, `/msc_controle`, `/entes`, `/extrato_entregas`, `/anexos-relatorios` | docs.json |
| Envelope | `{"items":[...],"hasMore":bool,"limit":n,"offset":n,"count":n,"links":[...]}`. `count` é o número de itens da página, não o total | docs.json, `paginacao` |
| Paginação | `limit` e `offset` funcionam, embora não estejam no spec. `limit` padrão: 5000 em `/rreo`, `/extrato_entregas` e `/anexos-relatorios`; 6000 em `/entes`. `limit=10000` foi aceito (01:23:46Z). Os `links` apontam para um host interno da Oracle (`host-5hrds-scan.prosubnet.vcndados.oraclevcn.com`), inutilizável, então o cliente monta `offset` sozinho | docs.json; uniao-investigacao.json |
| Paginação real | `BASE/rreo?an_exercicio=2025&nr_periodo=6&co_tipo_demonstrativo=RREO&id_ente=1` (sem anexo): 5000 itens com `hasMore=true` às 01:21:57Z; com `&offset=5000`, 1893 itens com `hasMore=false` às 01:22:11Z. Total: 6893 linhas | uniao-investigacao.json |
| Ordenação | Não há parâmetro de ordenação nem garantia de ordem estável. **Inferência**: paginar sem ordem pode duplicar ou pular linhas | docs.json |
| Limite de taxa | Documentado: 1 req/s. Não há cabeçalhos `X-RateLimit-*` ou `Retry-After`. Bloqueio não descrito | docs.json |
| Compressão | Sem compressão. Com `Accept-Encoding: gzip`, `/extrato_entregas` veio identity (01:29:43Z), e `/anexos-relatorios` esgotou 120 s sem bytes (01:27:29Z). **Hipótese** do docs (fraca, segundo o crítico): a variante gzip tem outra chave de cache e cai na origem lenta | docs.json; critic.json |
| Cache e ETag | Respostas com ETag; `If-None-Match` devolveu 304 em `0.19` s (01:24:28Z). `X-Cache` `TCP_MISS` ou `TCP_REMOTE_HIT`; os HIT observados podem vir de requisições anteriores dos próprios agentes (lacuna L17). Sem `Cache-Control`, então o TTL do CDN é desconhecido | docs.json; logs |
| Latência | Chamadas de dados do agente docs: de `0.19` a `1.09` s. Na revisão, as 10 chamadas (RREO e DCA) levaram de `0.942226` a `1.673927` s. Exceção: `/anexos-relatorios` levou `69.26` s sem cache e `0.22` s com cache | docs.json; `revisao/requests.log` |
| Erro 400 | `BASE/rreo?an_exercicio=abc&...` às 01:22:23Z: HTTP 400, `application/problem+json`, `"code": "BadRequest"`, com `instance` (ecid) | docs.json |
| Erro 404 | `BASE/rreo_inexistente` às 01:26:28Z: HTTP 404, `application/problem+json` | docs.json |
| Respostas vazias (200) | `nr_periodo=7` (01:22:30Z); `/rreo` com `co_tipo_demonstrativo=RREO Simplificado` e sem `id_ente` (01:23:09Z); `co_esfera=E` sem `id_ente` (01:20:23Z e 01:23:19Z); `/extrato_entregas?id_ente=11` sem `an_referencia` (01:20:54Z, 473 bytes); RJ 2026 b5 ainda não entregue (01:26:16Z, `count=0`). **Resposta vazia não é erro nem zero** | docs.json; cobertura.json; rj-investigacao.json |
| Consulta em lote | `id_ente` é obrigatório na prática. Sem ele, a resposta vem vazia. É preciso uma requisição por ente × período (× anexo). Afirmação de cobertura.json; o crítico a classifica como "plausível, mas não esgotada" | cobertura.json; critic.json |
| Redirects e TLS | `http://apidatalake.tesouro.gov.br/docs/siconfi/` devolve 307 para `https://` (01:18:59Z). Por https, nenhuma rota da API redirecionou. Certificado CN=apidatalake.tesouro.gov.br, emissor GeoTrust TLS RSA CA G1, válido de 2026-06-22 a 2026-12-22 | docs.json |
| Links externos do spec | `http://www.tesouro.fazenda.gov.br/mdf`: o DNS não resolve (01:24:59Z). O "Veja mais" do Siconfi leva a uma notícia de 2017 sobre XBRL. Não há documentação oficial da API além do spec | docs.json |

### 3.1 Divergências entre spec e resposta

| Divergência | Evidência |
|---|---|
| `/entes` devolve `exercicio` e `cnpj`; o spec diz `an_exercicio` e `co_cnpj` | docs.json; uniao-investigacao.json |
| `/entes`: `capital` vem como string com espaços (`'0  '`, `'1  '`). Nos estados vem `uf='BR'` com a região real; na União, `regiao='BR'` e `uf=null` | docs.json |
| `/rreo` e `/rgf` trazem o campo `esfera`, ausente do spec; `/msc_orcamentaria` traz `complemento_fonte`; `/rgf` não traz `demonstrativo` | docs.json |
| Enum `no_anexo` desatualizado: faltam `'RREO-Anexo 04.3'`, `'RREO-Anexo 04.4 - RGPS'`, `'RREO-Anexo 10.1 - RPPS'` e `'RREO-Anexo 10.2 - RGPS'` (vistos nos dados ou em `/anexos-relatorios` para a União) | docs.json; uniao-investigacao.json |
| `/anexos-relatorios` rotula todos os anexos RREO-* e RGF-* com `demonstrativo='QDCC'` e inclui a esfera `C` (Consórcio), fora do enum | docs.json |
| O spec se contradiz: diz que `'Apenas o parâmetro no_anexo é opcional'`, mas declara `co_esfera` como `required:false`. Na prática, o `/rreo` funciona sem `co_esfera` | critic.json |
| O spec declara `valor` como `type: integer, format: float`, mas vem número com casas decimais | cobertura.json |
| Não há RREO-Anexo 08 nem 12 (MDE e Saúde) no enum nem em `/anexos-relatorios`. **Afirmação fraca**: nenhuma consulta a esses anexos foi tentada | docs.json; critic.json |

### 3.2 Códigos e identificação de entes

| Ente | `/entes` (2026-10-02, 5598 itens) | `/rreo` | Observação |
|---|---|---|---|
| União | `cod_ibge` 1, `esfera='U'`, `regiao='BR'`, `uf=null`, `populacao` `8569324` | `instituicao='Governo Federal'`, `uf='BR'`, `esfera='U'` | A população não corresponde à do país (**inferência**: valor de cadastro). Não usar |
| Estado do RJ | `cod_ibge` 33, `esfera='E'`, `uf='BR'`, `regiao='SE'`, `populacao` `16615526` | `instituicao='Governo do Estado do Rio de Janeiro'`, `uf='RJ'`, `esfera='E'` | Homônimo do município do Rio de Janeiro (3304557). Filtrar por `cod_ibge` |
| DF | `cod_ibge` 53, `esfera='D'` | `esfera='E'`, `uf='DF'`, `instituicao='Governo do Distrito Federal'` (01:48:57Z, 614 itens) | Brasília (5300108) também existe, com `esfera='M'`, e teve 0 entregas em 2025 (01:26:05Z). O DF (53) teve 71 itens no extrato 2025 (01:26:16Z) |
| Estados | 26 com `esfera='E'` e `uf='BR'` | Sigla real em `uf` (vistas: `'RJ'`, `'SP'`, `'MG'`, `'DF'`) | As siglas das outras 23 UFs foram **inferidas** do código IBGE, não observadas |

`esfera` e `uf` **não servem como chave de junção entre endpoints** (crítico).

---

## 4. Consultas principais

`BASE` = `https://apidatalake.tesouro.gov.br/ords/cdwhprd/siconfi/tt/`. Os logs completos estão em `...\scratchpad\siconfi\<agente>\` (seção 16).

### 4.1 Documentação e metadados

| URL | Coleta (UTC) | Status | Contagem ou tamanho | Agente |
|---|---|---|---|---|
| `https://www.tesourotransparente.gov.br/consultas/consultas-siconfi/siconfi-api-de-dados-abertos` | 01:18:45Z | 200 | 26673 bytes | docs |
| `http://apidatalake.tesouro.gov.br/docs/siconfi/` | 01:18:59Z | 307 para https | 0 bytes | docs |
| `https://apidatalake.tesouro.gov.br/docs/siconfi/` | 01:19:06Z | 200 | 2139 bytes | docs |
| `https://apidatalake.tesouro.gov.br/docs/siconfi.yaml` | 01:19:11Z | 200 | 44465 bytes | docs |
| `BASE/entes` | 01:19:07Z, 01:19:09Z e 01:20:02Z | 200 | 5598 itens, 866510 bytes cada | união, rj e cobertura |
| `BASE/entes` | 01:19:43Z | 200 (`TCP_REMOTE_HIT`) | 5598 itens, `limit` 6000 | docs |
| `BASE/anexos-relatorios` | 01:19:21Z | 000 (timeout de 120 s) | 0 bytes | rj |
| `BASE/anexos-relatorios` | 01:19:22Z | **502** | 1602 bytes (HTML) | união |
| `BASE/anexos-relatorios` | 01:20:24Z | 200 em `69.26` s (`TCP_MISS`) | 168 itens | docs |
| `BASE/anexos-relatorios` | 01:24:39Z | 200 em `0.22` s (`TCP_REMOTE_HIT`) | 168 itens | docs |
| `BASE/anexos-relatorios` com `Accept-Encoding: gzip` | 01:27:29Z | timeout (curl 28, 120 s) | 0 bytes | docs |
| `http://www.tesouro.fazenda.gov.br/mdf` | 01:24:59Z | falha de DNS (curl 6) | — | docs |

### 4.2 Testes de comportamento

| URL | Coleta (UTC) | Status | Resultado |
|---|---|---|---|
| `BASE/rreo?an_exercicio=abc&nr_periodo=6&co_tipo_demonstrativo=RREO&no_anexo=RREO-Anexo%2001&id_ente=3304557` | 01:22:23Z | 400 | `application/problem+json`, 372 bytes |
| `BASE/rreo?an_exercicio=2025&nr_periodo=7&...&id_ente=3304557` | 01:22:30Z | 200 | `items=[]` |
| `BASE/rreo?an_exercicio=2025&nr_periodo=6&co_tipo_demonstrativo=RREO&no_anexo=RREO-Anexo%2001&co_esfera=E` | 01:20:23Z | 200 | 613 bytes, sem itens |
| `BASE/extrato_entregas?id_ente=11` (sem `an_referencia`) | 01:20:54Z | 200 | 473 bytes, sem itens |
| `BASE/rreo?...&id_ente=3304557` com `If-None-Match` | 01:24:28Z | 304 | `0.19` s |
| `BASE/rreo?an_exercicio=2025&nr_periodo=6&co_tipo_demonstrativo=RREO&id_ente=33&limit=2&offset=1500` | 01:24:12Z | 200 | `hasMore=true` |
| `BASE/rreo_inexistente` | 01:26:28Z | 404 | `application/problem+json` |
| `BASE/extrato_entregas?id_ente=3304557&an_referencia=2025` com `Accept-Encoding: gzip` | 01:29:43Z | 200 | identity, sem compressão |

### 4.3 RREO-Anexo 01 (base do indicador)

Padrão da URL: `BASE/rreo?an_exercicio={AAAA}&nr_periodo={1..6}&co_tipo_demonstrativo=RREO&no_anexo=RREO-Anexo%2001&id_ente={id}`. Algumas chamadas também passaram `co_esfera`, e outras não passaram `no_anexo` e trouxeram todos os anexos (indicado na tabela).

| Ente | Exercício e bimestre | Coleta (UTC) | Status | Itens | Agente e amostra |
|---|---|---|---|---|---|
| União (1) | 2025 b6, todos os anexos (2 páginas) | 01:21:57Z e 01:22:11Z | 200 | 5000 + 1893 | união, `uniao/rreo_2025_p6_all_p0.json` e `_p1.json` |
| União (1) | 2025 b6, Anexo 01 | 01:34:44Z | 200 | 869 | reconciliação União, `reconciliacao-uniao/siconfi_rreo_2025_p6_anexo01_confirm.json` |
| União (1) | 2025 b5, Anexo 01 | 01:24:13Z | 200 | 846 | união, `uniao/rreo_2025_p5_anexo01.json` |
| União (1) | 2026 b4, Anexo 01 (`co_esfera=U`) | 01:23:10Z | 200 | 834 | cobertura, `cobertura/rreo_2026_b4_a01_uniao.json` |
| União (1) | 2026 b4, todos os anexos | 01:24:23Z | 200 | 4626 | união, `uniao/rreo_2026_p4_all_p0.json` |
| União (1) | 2019 b6, Anexo 01 | 01:51:31Z | 200 | 878 | revisão, `revisao/rreo_1_2019_b6_a01.json` |
| SP (35) | 2026 b4, Anexo 01 (`co_esfera=E`) | 01:23:22Z | 200 | 703 | cobertura, `cobertura/rreo_2026_b4_a01_SP.json` |
| SP (35) | 2025 b6, Anexo 01 (`co_esfera=E`) | 01:24:14Z | 200 | 707 | cobertura, `cobertura/rreo_2025_b6_a01_SP.json` |
| RJ (33) | 2025 b6, todos os anexos | 01:22:05Z | 200 | 4682 (Anexo 01: 674) | rj, `rj/rreo_2025_p6_all_page1.json` |
| RJ (33) | 2025 b5, Anexo 01 | 01:23:35Z | 200 | 658 | rj, `rj/rreo_2025_p5_anexo01.json` |
| RJ (33) | 2026 b4, todos os anexos | 01:23:46Z | 200 | 3711 (Anexo 01: 657) | rj, `rj/rreo_2026_p4_all.json` |
| RJ (33) | 2026 b5, Anexo 01 | 01:26:16Z | 200 | 0 (ainda não entregue) | rj, `rj/rreo_2026_p5_anexo01_vazio.json` |
| RJ (33) | 2023 b6, Anexo 01 | 01:41:16Z | 200 | 677 | reconciliação RJ, `reconciliacao-rj/siconfi_rreo_2023_p6_anexo01.json` |
| RJ (33) | 2015, 2018, 2019, 2020 e 2021 b6, Anexo 01 | 01:49:26Z, 01:50:23Z, 01:50:49Z, 01:50:59Z, 01:50:38Z | 200 | 636, 692, 696, 652, 673 | revisão, `revisao/rreo_33_{ano}_b6_a01.json` |
| MG (31) | 2026 b4, Anexo 01 | 01:49:16Z | 200 | 673 | revisão, `revisao/rreo_31_2026_b4_a01.json` |
| DF (53) | 2026 b4, Anexo 01 | 01:48:57Z | 200 | 614 | revisão, `revisao/rreo_53_2026_b4_a01.json` |

As contagens das amostras da revisão (636 a 878) foram lidas nesta redação no campo `count` de cada arquivo. Todas vieram com `hasMore=false`.

### 4.4 Extrato de entregas

| URL | Coleta (UTC) | Status | Itens | Agente |
|---|---|---|---|---|
| `BASE/extrato_entregas?id_ente=1&an_referencia=2026` | 01:20:45Z (cobertura), 01:21:47Z (união) | 200 | 722 | cobertura, união |
| `BASE/extrato_entregas?id_ente={11..53}&an_referencia=2026`, 27 entes | 01:21:22Z a 01:22:16Z | 200 (todas) | 12537 a 23181 bytes por resposta | cobertura |
| `BASE/extrato_entregas?id_ente=1&an_referencia=2025` | 01:21:36Z (união), 01:22:49Z (cobertura) | 200 | 1157 | união, cobertura |
| `BASE/extrato_entregas?id_ente=33&an_referencia=2025` | 01:21:32Z (rj), 01:23:52Z (cobertura) | 200 | 103 | rj, cobertura |
| `BASE/extrato_entregas?id_ente=35&an_referencia=2025` | 01:23:51Z | 200 | 33772 bytes | cobertura |
| `BASE/extrato_entregas?id_ente=53&an_referencia=2025` | 01:23:54Z (cobertura), 01:26:16Z (docs) | 200 | 71 | cobertura, docs |
| `BASE/extrato_entregas?id_ente=5300108&an_referencia=2025` (Brasília, município) | 01:26:05Z | 200 | 0 | docs |
| `BASE/extrato_entregas?id_ente=33&an_referencia=2023` | 01:41:18Z | 200 | 103 | reconciliação RJ |

### 4.5 Publicações oficiais (fora da API)

| URL | Coleta (UTC) | Status | Observação |
|---|---|---|---|
| `https://www.tesourotransparente.gov.br/publicacoes/relatorio-resumido-da-execucao-orcamentaria-rreo/2025/12` | 01:25:23Z | 200 | `'Publicado em 30/05/2026'`. O título da página diz `'2026 - Dezembro'`, que não corresponde à URL (`/2025/12`) nem ao PDF (dez/2025) |
| `https://cdn.tesouro.gov.br/sistemas-internos/apex/producao/sistemas/thot/arquivos/publicacoes/53743_1693038/12_%20RREODez2025%20(REPUBL_).pdf` | 01:26:08Z | 200 | 4858314 bytes; `Last-Modified: Fri, 17 Jul 2026 19:40:58 GMT`; ETag `"0x8DEE43B5306987F"`. Apagado depois da extração |
| `https://www.tesourotransparente.gov.br/publicacoes/relatorio-resumido-da-execucao-orcamentaria-rreo/2026/8` | 01:27:30Z | 200 | `'RREO - 2026 - Agosto'`, publicado em 30/09/2026 |
| `https://cdn.tesouro.gov.br/sistemas-internos/apex/producao/sistemas/thot/arquivos/publicacoes/55944_1800407/08_RREOAgo2026%20-%20Com%20Portaria%20Publicada.pdf` | 01:27:45Z | 200 | 1628746 bytes, 52 páginas; `Last-Modified: Wed, 30 Sep 2026 17:17:48 GMT` |
| `https://portal.fazenda.rj.gov.br/contabilidade/relatorios-fiscais/` | 01:25:31Z | 200, **página de bloqueio por IP** | 1605 bytes |
| `https://portal.fazenda.rj.gov.br/contabilidade/wp-content/uploads/sites/25/2026/02/6bimAnexo-02_6oBim_RREO_-2025_MDF-14a_2Ed.pdf` | 01:31:26Z | 200, **página de bloqueio por IP** | 1605 bytes, não é PDF |
| `https://web.archive.org/web/20260504170515id_/https://portal.fazenda.rj.gov.br/contabilidade/wp-content/uploads/sites/25/2026/04/Volume-01.pdf` | 01:36:28Z | 200 | 3786949 bytes; sha256 `3a472c1e3a113df4e3ec50be716d25fc1b059ce8af3eaed01b326b9042003d7e` |
| `https://www.ioerj.com.br/portal/modules/conteudoonline/mostra_edicao.php?k=2CD8A0E7-DBFP9-4919-8EF5-222C22757AB2` | 01:37:58Z | 200 | DOERJ Parte I, Edição Extra 020-A de 30/01/2026, 5411641 bytes. Não contém o RREO |
| `https://web.archive.org/web/20250118032313id_/https://portal.fazenda.rj.gov.br/contabilidade/wp-content/uploads/sites/25/2024/01/Anexo-01_6oBim_RREO_-2023_MDF-13aEd..pdf` | 01:40:18Z | 200 | 65245 bytes; sha256 `d9965a65039a4d4d72efe8795a4e0689d7cd95369984101998b8fd9a97e3d271` |

---

## 5. Indicador candidato e estrutura do Anexo 01

### 5.1 Definição (metodologia v0.1.0, provisória)

**Nome**: "Despesas pagas no exercício, acumuladas até o bimestre (exceto intraorçamentárias)".

**Célula**: um item do `/rreo` com:

| Campo | Valor exato |
|---|---|
| `anexo` | `'RREO-Anexo 01'` |
| `coluna` | `'DESPESAS PAGAS ATÉ O BIMESTRE (j)'` |
| `cod_conta` | `'DespesasExcetoIntraOrcamentarias'` |
| chave | (`cod_ibge`, `exercicio`, `periodo`, `demonstrativo='RREO'`) |

O texto de `conta` **não** entra na seleção do indicador, porque varia entre entes (`'DESPESAS (EXCETO INTRA-ORÇAMENTÁRIAS) (VIII)'` nos estados e `'(IX)'` na União) e entre anos (crítico, `chave_unicidade_proposta`). Na camada bruta, a chave precisa incluir `conta`: no Anexo 02, sem ela houve até 174 chaves repetidas.

**Identidades verificadas antes de ativar** (decisão de arquitetura):

1. `DespesasExcetoIntraOrcamentarias = DespesasCorrentes + DespesasDeCapital`.
2. Quando a linha intra existir: `SubtotalDasDespesas = DespesasExcetoIntraOrcamentarias + DespesasIntraOrcamentariasTotal`.

**Composição** por grupos comuns do Anexo 01: `DespesasCorrentes`, `PessoalEEncargosSociais`, `JurosEEncargosDaDivida`, `OutrasDespesasCorrentes`, `DespesasDeCapital`, `Investimentos`, `InversoesFinanceiras`, `AmortizacaoDaDivida`.

### 5.2 Natureza temporal

- **Acumulado no exercício** (de janeiro até o fim do bimestre `nr_periodo`). Zera a cada exercício. Não existe coluna "pagas no bimestre", ao contrário de empenhadas e liquidadas.
- Prova de acumulação (União, `TotalDespesas`, liquidadas): ATÉ(b6) `'5154743999733.52'` − ATÉ(b5) `'4529774522116.31'` = `'624969477617.21'`, igual a `'DESPESAS LIQUIDADAS NO BIMESTRE'` do b6 (uniao-investigacao.json). No RJ: `'114992739081.78'` − `'89034619683.15'` = `'25958119398.63'` (rj-investigacao.json).
- Pagas crescentes entre bimestres. União `TotalDespesas`: b5 `'4429066733156.81'` e b6 `'5054245956518.39'`. RJ `TotalDespesas`: b5 `'85488479292.41'` e b6 `'112864466427.83'`.
- Bimestres **não se somam**. Um valor isolado do bimestre só sairia por diferença entre versões possivelmente distintas (recorte não validado, seção 12).
- Há três datas distintas: (1) **referência**, isto é, exercício + bimestre; (2) **status no Siconfi**, o `data_status` do extrato, que é a data do último HO/RE e **não** é a entrega original nem a publicação no DOE (crítico); (3) **coleta**, pelo relógio próprio em UTC. Para a União há ainda uma quarta: a publicação da STN ("Publicado em" no Tesouro Transparente).
- A União publica o RREO **mensal** (colunas `'No Mês'` e `'Até o Mês'`), e o Siconfi é bimestral. Só os acumulados de meses pares coincidem (observado em dez/2025 e ago/2026). Exemplo: União 2026 b4, linha IX (`DespesasExcetoIntraOrcamentarias`), `'DESPESAS EMPENHADAS NO BIMESTRE'` = `'615832878707.67'` contra empenhado `'No Mês'` (agosto) da mesma linha no PDF = `'260.773.213'` mil (crítico; a linha foi identificada nesta redação na amostra `uniao/rreo_2026_p4_all_p0.json` e no texto extraído `uniao/tmp_pdf/RREOAgo2026_p10.txt`).
- Valores nominais, em R$ correntes.

### 5.3 O que a linha inclui e exclui

| Componente | Na linha `DespesasExcetoIntraOrcamentarias` (j)? | Base |
|---|---|---|
| Despesas do exercício pagas, correntes e de capital | Sim | Identidade 1, verificada (seção 6.1) |
| Juros e encargos da dívida | Sim, dentro de `DespesasCorrentes`. União 2025 b6: `'363469278379.43'`; RJ 2025 b6: `'2957181316.06'` | uniao-investigacao.json; rj-investigacao.json |
| Amortização da dívida (não refinanciada) | Sim, dentro de `DespesasDeCapital`. União 2025 b6: `'353978003798.13'`; RJ 2025 b6: `'230165335.57'` | idem |
| Transferências a outros entes | Sim. União `'TransferenciasAEstadosDistritoFederalEMunicipios'`: `'752199427482.35'` (2025 b6) e `'531673082300.42'` (2026 b4). SP tem `TransferenciasAMunicipios` | amostras; cobertura.json; critic.json |
| Intraorçamentárias | Não; ficam na linha separada `DespesasIntraOrcamentariasTotal` | Definição; identidade 2 |
| Amortização da dívida / refinanciamento (`AmortizacaoRefinanciamentoDaDivida`) | Não; fica fora do subtotal. União: `'1417638361603.07'` (2025 b6) e `'1141059765822.79'` (2026 b4). RJ: `'1555292452.73'` (2025 b6) e `'1175684863.78'` (2026 b4). SP, MG e DF não têm essa linha nas amostras | uniao-investigacao.json; critic.json |
| Restos a pagar de exercícios anteriores pagos no ano | Não. **Inferência**: eles têm colunas próprias no Anexo 07 (`'Pagos (c)'`, `'Pagos (i)'`) e no Anexo 06. O MDF não foi lido para confirmar | lacuna L8 |
| Liquidado não pago e RPNP inscritos | Não (são outras colunas) | rj-investigacao.json |
| Superávit e total com superávit | Não, embora apareçam na **mesma coluna** (j) com outros `cod_conta` | critic.json |
| Reserva de contingência | Não tem célula de pagas no Siconfi (no PDF da União, pagas = `0`) | reconciliação da União |
| Colunas de percentual | Não; ocupam o campo `valor` em outras colunas | docs.json |

### 5.4 Armadilhas no Anexo 01 (não somar linhas)

| Armadilha | Exemplo observado | Fonte |
|---|---|---|
| A mesma linha intra aparece com dois `cod_conta` e o mesmo valor | `DespesasIntraOrcamentariasTotal` e `DespesasIntraOrcamentarias`, ambos `'8709254764.43'` (RJ 2025 b6) | rj-investigacao.json |
| `TotalDespesas` inclui o refinanciamento | União 2026 b4: `'3999925192391.91'` = Subtotal `'2858865426569.12'` + Refin `'1141059765822.79'` | cobertura.json |
| `TotalDespesas` muda de significado com o ano | Nas amostras anteriores a 2020 (RJ b6 de 2015, 2018 e 2019; União b6 de 2019), o `cod_conta` `TotalDespesas` é a linha `'TOTAL (XIV) = (XII + XIII)'` (na União, `'TOTAL (XV) = (XIII + XIV)'`), que soma o superávit. RJ 2018 b6: `'69352345037.11'` = `SubtotalDespesasComRefinanciamento` `'58665749815.77'` + Superavit `'10686595221.34'`. Nas amostras de 2020 em diante (RJ 2020 b6 e posteriores), vira `'TOTAL DAS DESPESAS (XII) = (X + XI)'`. União 2019: `'TOTAL (XV) = (XIII + XIV)'` = `'2710907655987'`, igual a `SubtotalDespesasComRefinanciamento`, porque não há linha de superávit na coluna (j) dessa amostra (conferido nesta redação). Anos não amostrados não foram verificados | critic.json; amostras da revisão |
| Linhas que não são pagamento, na coluna de pagas | MG 2026 b4: Superavit `'16805443364.65'` e `TotalDespesasComSuperavit` `'101999476074.35'`, contra `TotalDespesas` `'85194032709.7'`. RJ 2025 b6: `TotalDespesasComSuperavit` `'117852863573.26'` | critic.json |
| Colunas variam por bimestre | `'INSCRITAS EM RESTOS A PAGAR NÃO PROCESSADOS (k)'` só aparece no b6 (ausente em União 2025 b5 e 2026 b4, RJ 2025 b5 e 2026 b4, SP, MG e DF 2026 b4). **Correção ao crítico**: o critic.json diz que a coluna (k) não existe no RJ b6 de 2019, 2020 e 2021 nem na União b6 de 2019. Conferido nesta redação nas mesmas amostras da revisão (`revisao/rreo_33_{2019,2020,2021}_b6_a01.json` e `revisao/rreo_1_2019_b6_a01.json`), a coluna está presente em todas, com 15, 16, 17 e 26 linhas. Nas amostras b6 de 2015 a 2025, o Anexo 01 tem as mesmas 17 colunas | amostras; critic.json |
| Precisão varia | RJ 2019: 577 de 696 valores inteiros; União 2019: `DespesasExcetoIntraOrcamentarias` `'2198252453508'` | critic.json; amostra |
| Célula ausente não é zero | Colunas com números de linhas diferentes (de 16 a 66); no PDF da União há células sem par no Siconfi | docs.json; seção 7.1 |

---

## 6. Resultados por ente (só o observado)

### 6.1 Célula do indicador e identidades

Coluna `'DESPESAS PAGAS ATÉ O BIMESTRE (j)'`. Valores copiados do JSON bruto. A coluna "Identidades" foi **conferida nesta redação** com `Decimal`: (1) ExcetoIntra = Correntes + Capital; (2) Subtotal = ExcetoIntra + IntraTotal.

| Ente | Exerc./bim. | Coleta (UTC) | `DespesasExcetoIntraOrcamentarias` | `DespesasCorrentes` | `DespesasDeCapital` | `DespesasIntraOrcamentariasTotal` | `SubtotalDasDespesas` | Identidades | Origem do valor |
|---|---|---|---|---|---|---|---|---|---|
| União | 2019 b6 | 01:51:31Z | `'2198252453508'` | `'1841364275287'` | `'356888178221'` | `'35879957704'` | `'2234132411212'` | (1) ok (2) ok | amostra da revisão |
| União | 2025 b5 | 01:24:13Z | `'3002586890436.31'` | `'2517935842564.56'` | `'484651047871.75'` | `'22611723900.99'` | `'3025198614337.3'` | (1) ok (2) ok | amostra (valor não citado nos relatórios) |
| União | 2025 b6 | 01:34:44Z | `'3606510496180.06'` | `'3041799343879.79'` | `'564711152300.27'` | `'30097098735.26'` | `'3636607594915.32'` | (1) ok (2) ok | uniao-investigacao.json; amostra |
| União | 2026 b4 | 01:23:10Z | `'2821965337713.47'` | `'2329730336233.25'` | `'492235001480.22'` | `'36900088855.65'` | `'2858865426569.12'` | (1) ok (2) ok | cobertura.json; amostra |
| SP | 2025 b6 | 01:24:14Z | `'335617652049.38'` | `'303396713812.92'` | `'32220938236.46'` | `'13243265756.51'` | `'348860917805.89'` | (1) ok (2) ok | amostra (valor não citado nos relatórios) |
| SP | 2026 b4 | 01:23:22Z | `'224014883002.29'` | `'197027989151.71'` | `'26986893850.58'` | `'7279213926.47'` | `'231294096928.76'` | (1) ok (2) ok | cobertura.json; amostra |
| RJ | 2015 b6 | 01:49:26Z | `'56641094514.46'` | `'47469953488.65'` | `'9171141025.81'` | `'3270936428.39'` | `'59912030942.85'` | (1) ok (2) ok | amostra da revisão |
| RJ | 2018 b6 | 01:50:23Z | `'54091158886.6'` | `'52600610804.2'` | `'1490548082.4'` | `'4564564463.61'` | `'58655723350.21'` | (1) ok (2) ok | amostra da revisão |
| RJ | 2019 b6 | 01:50:49Z | `'55370586741'` | `'53943103569'` | `'1427483172'` | `'7144228137'` | `'62514814878'` | (1) ok (2) ok | amostra da revisão |
| RJ | 2020 b6 | 01:50:59Z | `'56574681203.26'` | `'55289521529.3'` | `'1285159673.96'` | `'4313769751.52'` | `'60888450954.78'` | (1) ok (2) ok | amostra da revisão |
| RJ | 2021 b6 | 01:50:38Z | `'68559488531.2'` | `'66283578076.6'` | `'2275910454.6'` | `'5415403100.49'` | `'73974891631.69'` | (1) ok (2) ok | amostra da revisão |
| RJ | 2023 b6 | 01:41:16Z | `'90514724821.26'` | `'85273158130.95'` | `'5241566690.31'` | `'7043209898.7'` | `'97557934719.96'` | (1) ok (2) ok | reconciliação RJ (arquivo de comparação); amostra |
| RJ | 2025 b5 | 01:23:35Z | `'77839018216.16'` | `'74343570098.19'` | `'3495448117.97'` | `'6685928514.54'` | `'84524946730.7'` | (1) ok (2) ok | amostra (valor não citado nos relatórios) |
| RJ | 2025 b6 | 01:22:05Z | `'102599919210.67'` | `'97020635761.99'` | `'5579283448.68'` | `'8709254764.43'` | `'111309173975.1'` | (1) ok (2) ok | rj-investigacao.json; amostra |
| RJ | 2026 b4 | 01:23:46Z | `'65960575113.15'` | `'62339342625.64'` | `'3621232487.51'` | `'5171255819.15'` | `'71131830932.3'` | (1) ok (2) ok | rj-investigacao.json; amostra |
| MG | 2026 b4 | 01:49:16Z | `'76054500238.07'` | `'65774134688.99'` | `'10280365549.08'` | `'9139532471.63'` | `'85194032709.7'` | (1) ok (2) ok | amostra da revisão (valor não citado nos relatórios) |
| DF | 2026 b4 | 01:48:57Z | `'23359230712.8'` | `'22130960819.03'` | `'1228269893.77'` | `'2106786216.6'` | `'25466016929.4'` | (1) ok (2) ok | amostra da revisão (valor não citado nos relatórios) |

Notas:

- O relatório do RJ escreve o subtotal de 2025 b6 como `'111309173975.10'` e o de 2026 b4 como `'71131830932.30'`, mas o JSON bruto traz `'111309173975.1'` e `'71131830932.3'`. Vale o JSON bruto.
- Além das duas identidades, conferiu-se nesta redação, nas 17 amostras desta tabela, que os 8 grupos comuns da seção 5.1 estão presentes na coluna (j) e que `DespesasCorrentes` = `PessoalEEncargosSociais` + `JurosEEncargosDaDivida` + `OutrasDespesasCorrentes` e `DespesasDeCapital` = `Investimentos` + `InversoesFinanceiras` + `AmortizacaoDaDivida`, com aritmética exata.
- As linhas marcadas "valor não citado nos relatórios" foram extraídas nesta redação das amostras brutas salvas pelos agentes (mesma URL e horário do log). Não houve nova consulta à fonte.
- **Esta tabela não é uma comparação entre entes nem uma série publicável.** Mistura bimestres e versões (HO/RE) diferentes, e os valores são nominais.

### 6.2 União (`id_ente=1`)

| Item | Observado | Fonte |
|---|---|---|
| Extrato 2025 (01:21:36Z, 1157 itens) | RREO b1 a b6, todos HO. b6 HO em `2026-01-30T22:36:41Z`, `forma_envio` P. Os 8 registros RE do ano são todos de RGF | uniao-investigacao.json |
| Extrato 2026 (01:21:47Z, 722 itens) | b1 HO `2026-03-31T10:56:42Z`; b2 HO `2026-05-29T14:59:49Z`; b3 HO `2026-07-29T17:45:03Z`; b4 HO `2026-09-30T14:28:06Z` (forma M) | uniao-investigacao.json; cobertura.json |
| Data de status atípica | O b1 2025 está HO em `2025-05-09T22:31:07Z`, depois do prazo e perto do b2. **Inferência**: pode ter havido re-homologação, mas o extrato não permite confirmar | uniao-investigacao.json |
| Valores (j), 2025 b6 | Subtotal `'3636607594915.32'`; Refin `'1417638361603.07'`; `TotalDespesas` `'5054245956518.39'` | uniao-investigacao.json |
| Valores (j), 2026 b4 | Subtotal `'2858865426569.12'`; Refin `'1141059765822.79'`; `TotalDespesas` `'3999925192391.91'` | uniao-investigacao.json |
| Contas exclusivas da União (coluna j) | `TransferenciasAEstadosDistritoFederalEMunicipios`, `BeneficiosPrevidenciarios` e o bloco `AmortizacaoRefinanciamentoDaDivida` (7 subcontas) | cobertura.json |
| Outros anexos com pagas | Anexo 06: `'DESPESA PRIMÁRIA TOTAL (VII) = (IV + V + VI)'`, coluna `'DESPESAS PAGAS (a)'`, `'2760222716956.23'` (2025 b6, sem juros e amortização). Anexo 07 (RP pagos): `'Pagos (c)'` `'94643805352.64'` e `'Pagos (i)'` `'136567347228.29'`. Anexo 14: `'Despesas Pagas'` = `TotalDespesas` do Anexo 01 | uniao-investigacao.json |
| Anexo 02 | Não tem coluna de pagas (só empenhado, liquidado e RPNP no b6) | uniao-investigacao.json |
| Anexo 14 na API | Inconsistências internas em 2025 b6: `'Despesas Liquidadas'` = `'624969477617.21'` (é o liquidado **no** bimestre); o FCDF repete valores do RPPS civil. Não usar como fonte primária | uniao-investigacao.json |
| FCDF | O PDF republicado traz pagas do FCDF = `'10.050.645'` mil; a API (Anexo 04.2, `TotalDasDespesasRPPSPrevidenciarioFCDF`) traz `'4940304484.05'`. **Inferência**: a API mantém a versão homologada em jan/2026 | uniao-investigacao.json |
| `populacao` | `8569324` em `/entes`, no extrato, no RREO e na DCA. Não usar | uniao-investigacao.json; critic.json |
| DCA × RREO | DCA − RREO (despesas exceto intra) = `'1417638361603.07'`, que é o refinanciamento. Intra difere R$ 0,02: DCA `'30097098735.24'` contra RREO `'30097098735.26'` | critic.json |

### 6.3 Estado do Rio de Janeiro (`id_ente=33`)

| Item | Observado | Fonte |
|---|---|---|
| Extrato 2025 (01:21:32Z, 103 itens) | b1 RE `2025-06-18T22:31:27Z`; b2 HO `2025-05-30T14:29:56Z`; b3 HO `2025-07-30T17:54:44Z`; b4 HO `2025-09-30T22:31:44Z`; b5 HO `2025-11-27T11:22:08Z`; **b6 RE `2026-05-06T17:14:12Z`** (forma M). DCA 2025 RE `2026-05-08T10:22:12Z` | rj-investigacao.json; cobertura.json |
| Extrato 2026 (01:21:51Z, 63 itens) | b1 RE `2026-03-30T11:28:18Z`; b2 RE `2026-05-29T12:32:07Z`; b3 HO `2026-07-30T16:23:58Z`; b4 HO `2026-09-30T22:36:35Z` | rj-investigacao.json |
| Extrato 2023 (01:41:18Z, 103 itens) | b6 RE `2024-07-03T22:30:39Z`, forma M | rj-reconciliacao.json |
| Valores (j), 2025 b6 | Refin (XI) `'1555292452.73'`; `TotalDespesas` (XII) `'112864466427.83'`; `TotalDespesasComSuperavit` (XIV) `'117852863573.26'` | rj-investigacao.json; critic.json |
| Valores (j), 2026 b4 | Refin (XI) `'1175684863.78'`; `TotalDespesas` (XII) `'72307515796.08'` | rj-investigacao.json; critic.json |
| Linha de refinanciamento | **Existe** no RJ, ao contrário de SP, MG e DF. No RJ, então, `TotalDespesas` ≠ `SubtotalDasDespesas` (crítico, corrigindo cobertura.json) | critic.json |
| Conferência cruzada | Anexo 06 `'DESPESAS PAGAS (a)'` (correntes + capital, exceto e com RPPS) = XII do Anexo 01: `'112864466427.83'` (2025 b6) e `'72307515796.08'` (2026 b4). Anexo 14 `'Despesas Pagas'` = XII nos dois períodos | rj-investigacao.json |
| RP pagos de exercícios anteriores (2025 b6) | Anexo 07 TOTAL (III): `'Pagos (c)'` `'2354653359.26'` + `'Pagos (i)'` `'831650212.62'`; Anexo 14: `'3186303571.88'` | rj-investigacao.json |
| DCA × RREO (2025) | DCA `'Despesas Exceto Intraorçamentárias'` `'104155211663.4'` = RREO `'102599919210.67'` + Refin `'1555292452.73'`, exato. O mesmo rótulo tem escopo diferente nos dois demonstrativos | critic.json |
| DCA por função (2025) | `'10 - Saúde'`, `'Despesas Pagas'` = `'10203968994.83'` (anual) | critic.json |
| `populacao` | `16615526` no RREO 2025, no RREO 2026, na DCA 2025 e em `/entes` 2026 (crítico). Nas amostras b6 mais antigas, o valor muda a cada exercício: 2015 `16461173`, 2018 `16635996`, 2019 `17159960`, 2020 `17264943`, 2021 `17366189` e 2023 `17463349` (lido nesta redação nas amostras da revisão e da reconciliação). Ou seja, o campo varia entre alguns exercícios, mas não entre 2025 e 2026. A regra de atualização não está documentada | critic.json; amostras |
| Série histórica | A linha do indicador e a coluna (j) estão presentes em 2015, 2018, 2019, 2020, 2021, 2023, 2025 e 2026 | seção 6.1 |

### 6.4 São Paulo (`id_ente=35`)

| Item | Observado | Fonte |
|---|---|---|
| Extrato 2025 (01:23:51Z) | b1 RE `2025-07-28T17:56:58Z`; b2 a b5 HO; **b6 RE `2026-04-16T16:07:44Z`**. DCA 2025 HO `2026-04-30T14:38:12Z` | cobertura.json |
| Extrato 2026 (01:22:01Z) | b1 RE `2026-06-02T16:09:31Z` (posterior ao b2); b2 HO `2026-05-29T14:14:24Z`; b3 HO `2026-07-30T13:05:10Z`; b4 HO `2026-09-30T11:45:11Z` | cobertura.json |
| Estrutura | Mesmos 15 campos e mesmas 16 colunas do Anexo 01 da União em 2026 b4; 21 `cod_conta` comuns na coluna de pagas. Contas exclusivas de SP: `TransferenciasAMunicipios`, `JurosEEncargosDaDividaIntra` e `AmortizacaoDaDividaIntra` | cobertura.json |
| Totais | Sem linha de refinanciamento: `TotalDespesas` = `SubtotalDasDespesas` = `'231294096928.76'` (2026 b4) e `'348860917805.89'` (2025 b6, lido na amostra) | cobertura.json; amostra |
| Rótulos | `'(VIII)'` e `TOTAL (XII)` em SP, contra `'(IX)'` e `TOTAL (XIII)` na União. Iguais em SP entre 2025 b6 e 2026 b4 | cobertura.json |

### 6.5 Minas Gerais (`id_ente=31`)

| Item | Observado | Fonte |
|---|---|---|
| Extrato 2026 | b1 a b4 HO: `2026-03-30T22:41:22Z`, `2026-05-30T22:33:26Z`, `2026-07-30T22:31:34Z`, `2026-09-30T22:30:39Z`. Todas perto das 22:30Z do último dia | cobertura.json |
| Anexo 01 2026 b4 (01:49:16Z, 673 itens) | Sem linha de refinanciamento: `TotalDespesas` = `SubtotalDasDespesas` = `'85194032709.7'`. Superavit `'16805443364.65'` e `TotalDespesasComSuperavit` `'101999476074.35'` na mesma coluna (j) | critic.json; amostra |
| 2025 | Não verificado (nem extrato nem `/rreo`) | cobertura.json |

### 6.6 Distrito Federal (`id_ente=53`)

| Item | Observado | Fonte |
|---|---|---|
| Identificação | `/entes`: `esfera='D'`. `/rreo`: `esfera='E'`, `uf='DF'`, `instituicao='Governo do Distrito Federal'` (614 itens, 01:48:57Z). Brasília (5300108, `esfera='M'`): 0 entregas em 2025 | critic.json; docs.json; amostra |
| Extrato 2025 (01:23:54Z pelo cobertura e 01:26:16Z pelo docs; 71 itens nas duas) | b1 a b5 HO; **b6 RE `2026-05-08T16:59:04Z`** (forma M). DCA 2025 RE `2026-05-08T16:59:48Z` | cobertura.json |
| Extrato 2026 | b1 a b4 HO, forma F: `2026-03-30T12:45:20Z`, `2026-05-29T17:41:02Z`, `2026-07-29T17:12:55Z`, `2026-09-30T15:42:12Z` | cobertura.json |
| Anexo 01 2026 b4 | Sem linha de refinanciamento: `TotalDespesas` = `SubtotalDasDespesas` = `'25466016929.4'` (lido na amostra). Não tem `DemaisDespesasCorrentes` | amostra; critic.json |
| FCDF | A interação entre o Fundo Constitucional do DF (pago pela União) e as despesas do DF **não foi investigada** | lacuna L14 |

---

## 7. Reconciliações com publicações oficiais

### 7.1 União, 2025 b6: reconciliada com precisão de R$ mil

| Campo | Valor |
|---|---|
| Siconfi | `https://apidatalake.tesouro.gov.br/ords/cdwhprd/siconfi/tt/rreo?an_exercicio=2025&nr_periodo=6&co_tipo_demonstrativo=RREO&no_anexo=RREO-Anexo%2001&id_ente=1`, coletado em 2026-10-02T01:34:44Z (HTTP 200, 298830 bytes, `count=869`, `hasMore=false`). Idêntico, linha a linha, à coleta das 01:21:57Z |
| Publicação | `'12_ RREODez2025 (REPUBL_).pdf'` (STN), baixado em 2026-10-02T01:26:08Z. Página do Tesouro Transparente: `'Publicado em 30/05/2026'`. Arquivo: `Last-Modified: Fri, 17 Jul 2026 19:40:58 GMT`. Anexo 1, página 9 do arquivo (página impressa 14), em R$ milhares |
| Regra | Siconfi ÷ 1000, arredondado half-up, igual ao inteiro do PDF |
| Linha do indicador | `DespesasExcetoIntraOrcamentarias`: PDF `'3.606.510.496'`; Siconfi `'3606510496180.06'`; resíduo `0.18006` mil |
| Total | `TotalDespesas`: PDF `'5.054.245.957'`; Siconfi `'5054245956518.39'`; resíduo `-0.48161` mil (R$ -481,61) |
| Abrangência | 30 linhas do PDF na coluna (j): **28 conferem** (maior resíduo `0.48235` mil, em `TransferenciasAEstadosDistritoFederalEMunicipios`) e **2 não têm célula no Siconfi**: Reserva de Contingência (pagas `0` no PDF) e a linha intra `'Demais Despesas Correntes'` (`'1.227.470'` mil no PDF). Para esta última, o Siconfi só traz `OutrasDespesasCorrentesIntra`, com `'1227470030.75'`, o mesmo valor ao milhar. Na comparação de 8 colunas, 211 células batem, 12 divergem e 17 estão ausentes no Siconfi |
| Saída | `siconfi/reconciliacao-uniao/compare_out.txt` e `compare_all_cols_out.txt` |

**Ressalvas** (crítico e relatório de reconciliação):

1. **Precisão de R$ mil, não ao centavo.** "OK" significa diferença menor que 0,5 unidade de R$ mil (cerca de R$ 500). Os centavos do Siconfi não são verificáveis contra o PDF.
2. **O PDF é uma republicação**, mas o extrato mostra o b6 2025 da União HO em `2026-01-30T22:36:41Z`, sem RE. Só as páginas do Anexo 4/FCDF e do Anexo 14 estão marcadas "REPUBLICADO"; a do Anexo 1 não. Neste caso, o extrato não registra a republicação da STN. Como isso foi visto num único caso, não se sabe se vale para outras republicações (lacuna L4).
3. **Divergência no empenhado.** Em 12 células de empenhado (f) e saldo (g), o PDF fica 7 a 8 unidades de R$ mil distante do Siconfi, em toda a cadeia Demais Despesas Correntes → ODC → Correntes → IX → XI → XIII. Exemplos: `DespesasExcetoIntraOrcamentarias` (f), PDF `'3.901.652.475'` contra Siconfi `'3901652467673.24'`; `TotalDespesas` (f), PDF `'5.379.398.678'` contra Siconfi `'5379398670922.43'`. O Anexo 14 do mesmo PDF traz `'5.379.398.671'`, que bate com o Siconfi. Isso não é arredondamento. **Hipótese** (não verificada): o Anexo 1 não foi republicado e mantém um empenho anterior. **Lição: conciliar uma coluna não valida as outras.**
4. **Extração do PDF.** A camada de texto do Anexo 1 usa fonte com codificação embaralhada. O mapa de dígitos foi validado em 211 células e por leitura visual (`page9.png`, `crop_total_xiii_p14.png`). A camada de texto também tem um número oculto (`'564.704.184'` na linha de superávit) que não aparece renderizado. Extração automática de PDFs é arriscada.
5. A versão original do RREO de dez/2025 (jan/2026) não foi localizada nem comparada.

### 7.2 União, 2026 b4: reconciliada com precisão de R$ mil

| Campo | Valor |
|---|---|
| Siconfi | `BASE/rreo?an_exercicio=2026&nr_periodo=4&co_tipo_demonstrativo=RREO&no_anexo=RREO-Anexo%2001&co_esfera=U&id_ente=1` às 01:23:10Z (834 itens) e `BASE/rreo?an_exercicio=2026&nr_periodo=4&co_tipo_demonstrativo=RREO&id_ente=1` às 01:24:23Z (4626 itens) |
| Publicação | `'08_RREOAgo2026 - Com Portaria Publicada.pdf'` (STN), baixado em 2026-10-02T01:27:45Z; `Last-Modified: Wed, 30 Sep 2026 17:17:48 GMT`; publicado em 30/09/2026. Anexo 1, p. 15 do relatório, em R$ milhares |
| Linha do indicador | IX: PDF `'2.821.965.338'`; Siconfi `'2821965337713.47'` |
| Outras linhas | `TotalDespesas`: PDF `'3.999.925.192'`, Siconfi `'3999925192391.91'`. XII (refinanciamento): PDF `'1.141.059.766'`, Siconfi `'1141059765822.79'` |
| Abrangência | 13 linhas conferidas pelo crítico, todas iguais depois do arredondamento |
| Ressalva | Mesma precisão de R$ mil. Comparação só dos acumulados: o PDF é mensal (`'No Mês'` de agosto), o Siconfi é bimestral. As colunas de empenhado e saldo não foram comparadas para 2026 b4 nos relatórios disponíveis (lacuna) |

### 7.3 Estado do RJ, 2023 b6: reconciliado ao centavo (via Wayback)

| Campo | Valor |
|---|---|
| Siconfi | `https://apidatalake.tesouro.gov.br/ords/cdwhprd/siconfi/tt/rreo?an_exercicio=2023&nr_periodo=6&co_tipo_demonstrativo=RREO&no_anexo=RREO-Anexo%2001&id_ente=33`, coletado em 2026-10-02T01:41:16Z (HTTP 200, `count=677`, `hasMore=false`) |
| Publicação original | `https://portal.fazenda.rj.gov.br/contabilidade/wp-content/uploads/sites/25/2024/01/Anexo-01_6oBim_RREO_-2023_MDF-13aEd..pdf` (SEFAZ-RJ, Subsecretaria de Contabilidade Geral) |
| Cópia lida | `https://web.archive.org/web/20250118032313id_/https://portal.fazenda.rj.gov.br/contabilidade/wp-content/uploads/sites/25/2024/01/Anexo-01_6oBim_RREO_-2023_MDF-13aEd..pdf`, coletada em 2026-10-02T01:40:18Z (HTTP 200). 2 páginas, 65.245 bytes, sha256 `d9965a65039a4d4d72efe8795a4e0689d7cd95369984101998b8fd9a97e3d271` |
| Datas do documento | Emissão impressa 24/01/2024, em R$ 1,00; `Last-Modified` original `'Wed, 31 Jan 2024 15:54:22 GMT'` (cabeçalho `x-archive-orig-last-modified`); captura do Wayback em 2025-01-18T03:23:13Z. Data de publicação no DOERJ não verificada |
| Linha do indicador (VIII, j) | PDF `'90.514.724.821,26'`; Siconfi `'90514724821.26'`: **iguais** |
| Total (XII, j) | PDF `'99.217.095.187,47'`; Siconfi `'99217095187.47'`: **iguais** |
| Abrangência | Linhas de total I, II, III, V, VIII, IX, X, XI, XII e XIV: 86 de 88 células coincidem. Dessas 86, 3 são células da linha XI (SALDO (g), SALDO (i) e coluna (k)) que estão vazias no PDF (`'-'`) e ausentes no Siconfi; o script contou essas como coincidentes (conferido nesta redação no arquivo de comparação). As 2 diferenças estão em `'TOTAL COM SUPERÁVIT (XIV)'` (SALDO (g) e (i)), que existem no PDF e não no Siconfi. Aritmética do próprio PDF conferida: e−f=g, f−h=k, e−h=i |
| Teste de presença (fraco) | 662 dos 677 valores do Siconfi, formatados em pt-BR, aparecem no texto do PDF |
| Saída | `siconfi/reconciliacao-rj/comparacao_2023_p6_anexo01_linhas_totais.txt` |

**Ressalvas**:

1. A cópia veio do Internet Archive, não do servidor da SEFAZ. A proveniência se apoia na URL original e nos cabeçalhos `x-archive-orig-*`, e o hash não pôde ser comparado com o arquivo vivo.
2. O extrato mostra o b6 2023 do RJ como RE em `2024-07-03T22:30:39Z`, depois da emissão do PDF (24/01/2024). As linhas de total são idênticas, mas isso **não prova** que a retificação deixou o Anexo 01 intacto: subcontas não foram comparadas (crítico).
3. Diferenças de detalhe: nas subcontas do refinanciamento (XI), o Siconfi distribui os valores entre `...ExternaContratual` e `...InternaContratual` de um jeito diferente do PDF; percentuais de receita aparecem como `'-'` no PDF e calculados no Siconfi. Conclusão do agente: "os totais são confiáveis; subcontas do XI e percentuais não são".
4. **Não se generaliza** para 2025 e 2026 nem para outros estados (crítico).

### 7.4 Estado do RJ, 2025: corroboração não exata

| Campo | Valor |
|---|---|
| Documento | Prestação de Contas 2025, Volume 01 (SEFAZ-RJ, Subsecretaria de Contabilidade Geral). Cópia do Wayback `20260504170515` de `https://portal.fazenda.rj.gov.br/contabilidade/wp-content/uploads/sites/25/2026/04/Volume-01.pdf`, coletada às 01:36:28Z. `Last-Modified` original 22/04/2026; 261 páginas; sha256 `3a472c1e3a113df4e3ec50be716d25fc1b059ce8af3eaed01b326b9042003d7e` |
| Valor | p. 62, quadro `'EXECUÇÃO ORÇAMENTÁRIA DA DESPESA'`, em R$ mil, `'Fonte: SIAFERIO'`, considerando as intraorçamentárias: `'Despesa Paga 112.864.466'` |
| Siconfi | `TotalDespesas` (XII) 2025 b6 = `'112864466427.83'` (inclui intra e refinanciamento; **não** é a linha do indicador) |
| Outros números coerentes a menos do arredondamento | Empenhada `'116.553.974'`; Liquidada `'114.992.739'`; Dotação Atualizada `'137.259.489'`; Dotação Inicial `'122.184.862'` |
| Classificação | **Não é o RREO e não é reconciliação exata.** Só corrobora a ordem de grandeza do total, não a linha do indicador |

### 7.5 Bloqueio por IP da SEFAZ-RJ e tentativas

| Tentativa | Coleta (UTC) | Resultado |
|---|---|---|
| `https://portal.fazenda.rj.gov.br/contabilidade/relatorios-fiscais/` (curl e WebFetch) | 01:25:31Z | HTTP 200 com página de bloqueio: `'nosso serviço de segurança da informação bloqueia acessos provenientes desses endereços IP'`. **O status 200 não basta para validar a coleta** |
| PDF do Anexo 02 de 2025 b6 (`.../2026/02/6bimAnexo-02_6oBim_RREO_-2025_MDF-14a_2Ed.pdf`) | 01:31:26Z | Página de bloqueio (1605 bytes) |
| PDF do Anexo 01 de 2025 b6 (`.../2026/02/6bimAnexo-01_6oBim_RREO_-2025_MDF-14_2aEd.pdf`), via WebFetch | sem horário no log | Página de bloqueio |
| Wayback `available` para o Anexo 01 2025 | 01:34:09Z | `archived_snapshots={}` (sem captura) |
| Wayback CDX das pastas 2025 e 2026/02 | 01:31:51Z a 01:33:56Z | Nenhum RREO de 2025/2026. Uma chamada CDX devolveu 504 às 01:32:35Z |
| DOERJ/IOERJ: edições de 30/01/2026 (regular e extra) e 20/03/2026 (regular e extra) | 01:34:46Z a 01:38:56Z | Os sumários não listam o RREO. A Edição Extra 020-A de 30/01/2026 (20 páginas) foi baixada e não contém o RREO |
| Resumo de buscador dizendo que o RREO 2025 b6 saiu no DOERJ em 30/01/2026 e foi republicado em 20/03/2026 | — | **Não verificado** |

Não se tentou contornar o bloqueio (proxy ou Save Page Now). Para fechar 2025, alguém em outra rede precisa baixar o `6bimAnexo-01_6oBim_RREO_-2025_MDF-14_2aEd.pdf` e repetir a comparação (seção 15).

### 7.6 Síntese das reconciliações

| Recorte | Publicação | Precisão | Resultado | Ressalva principal |
|---|---|---|---|---|
| União 2025 b6, coluna (j) | STN, PDF republicado | R$ mil | 28 de 30 linhas iguais; 2 sem célula no Siconfi | Republicação sem RE no extrato; empenhado diverge 7 a 8 mil |
| União 2026 b4, coluna (j) | STN, PDF de ago/2026 | R$ mil | 13 linhas iguais (crítico) | Só acumulados comparáveis (mensal × bimestral) |
| RJ 2023 b6, linhas de total | SEFAZ-RJ, via Wayback | R$ 0,01 | 86 de 88 células coincidem (3 delas vazias nos dois lados), incluindo VIII (j) e XII (j) | Cópia de arquivo; RE posterior ao PDF; não se generaliza |
| RJ 2025 | Prestação de Contas (não é RREO) | R$ mil | Coerente com XII | Não é reconciliação |
| RJ 2025 e 2026 no RREO; SP, MG, DF e demais estados | — | — | **NÃO EXECUTADO** | Bloqueio por IP (RJ); não tentado (demais) |

---

## 8. Cobertura

### 8.1 Extrato de entregas: RREO 2026, b1 a b4, dos 28 entes

Fonte: `BASE/extrato_entregas?id_ente={id}&an_referencia=2026`, coletado de 01:20:45Z a 01:22:16Z (cobertura.json). Linha `entregavel='Relatório Resumido de Execução Orçamentária'`. `tipo_relatorio` P em 112 de 112 linhas de 2026 (crítico). As siglas, exceto as de RJ, SP, MG, DF e União, foram **inferidas do código IBGE**.

| UF | id | b1 | b2 | b3 | b4 |
|---|---|---|---|---|---|
| União | 1 | HO 2026-03-31T10:56:42Z | HO 2026-05-29T14:59:49Z | HO 2026-07-29T17:45:03Z | HO 2026-09-30T14:28:06Z |
| RO | 11 | HO 2026-03-27T15:05:08Z | HO 2026-05-29T09:45:09Z | HO 2026-07-28T09:41:55Z | HO 2026-09-29T16:11:28Z |
| AC | 12 | HO 2026-03-30T16:59:31Z | HO 2026-05-28T17:51:51Z | HO 2026-07-29T19:40:55Z | HO 2026-09-29T16:36:57Z |
| AM | 13 | HO 2026-03-30T22:00:44Z | HO 2026-05-20T14:24:35Z | HO 2026-07-30T20:42:51Z | HO 2026-09-25T16:22:08Z |
| RR | 14 | HO 2026-03-27T17:15:11Z | HO 2026-05-29T10:11:58Z | HO 2026-07-28T12:56:14Z | HO 2026-09-30T09:53:57Z |
| PA | 15 | HO 2026-03-30T18:05:36Z | HO 2026-05-29T09:18:01Z | HO 2026-07-30T18:59:30Z | HO 2026-09-29T09:20:46Z |
| AP | 16 | HO 2026-03-30T20:14:33Z | HO 2026-05-30T22:22:34Z | HO 2026-07-27T14:50:50Z | HO 2026-09-28T16:20:05Z |
| TO | 17 | HO 2026-03-27T11:35:07Z | HO 2026-05-28T10:51:27Z | HO 2026-07-30T09:13:40Z | HO 2026-09-30T08:53:43Z |
| MA | 21 | HO 2026-03-30T16:25:29Z | HO 2026-05-29T17:32:34Z | HO 2026-07-30T16:52:39Z | HO 2026-09-29T20:37:48Z |
| PI | 22 | HO 2026-03-30T16:20:20Z | HO 2026-05-28T07:23:16Z | HO 2026-07-29T17:14:46Z | HO 2026-09-29T08:01:28Z |
| CE | 23 | HO 2026-03-30T13:45:09Z | HO 2026-05-29T11:13:10Z | HO 2026-07-30T14:35:00Z | HO 2026-09-30T13:25:56Z |
| RN | 24 | HO 2026-03-30T16:32:28Z | HO 2026-05-29T17:54:32Z | HO 2026-07-29T14:42:25Z | HO 2026-09-18T14:47:08Z |
| PB | 25 | HO 2026-03-30T09:44:19Z | HO 2026-05-29T14:19:09Z | HO 2026-07-30T11:11:12Z | HO 2026-09-30T15:41:25Z |
| PE | 26 | HO 2026-03-30T14:13:18Z | HO 2026-05-29T09:02:24Z | HO 2026-07-30T15:38:33Z | HO 2026-09-30T11:59:58Z |
| AL | 27 | HO 2026-03-30T17:35:13Z | HO 2026-05-28T20:36:27Z | HO 2026-07-30T18:05:13Z | HO 2026-09-29T18:08:23Z |
| SE | 28 | HO 2026-03-30T22:43:57Z | HO 2026-05-29T16:02:34Z | HO 2026-07-29T19:54:36Z | HO 2026-09-30T22:34:57Z |
| BA | 29 | HO 2026-03-27T15:59:59Z | HO 2026-05-28T15:41:13Z | HO 2026-07-27T18:59:21Z | HO 2026-09-30T17:09:29Z |
| MG | 31 | HO 2026-03-30T22:41:22Z | HO 2026-05-30T22:33:26Z | HO 2026-07-30T22:31:34Z | HO 2026-09-30T22:30:39Z |
| ES | 32 | HO 2026-03-30T18:57:38Z | HO 2026-05-29T17:20:02Z | HO 2026-07-30T16:54:29Z | HO 2026-09-30T15:27:26Z |
| RJ | 33 | **RE** 2026-03-30T11:28:18Z | **RE** 2026-05-29T12:32:07Z | HO 2026-07-30T16:23:58Z | HO 2026-09-30T22:36:35Z |
| SP | 35 | **RE** 2026-06-02T16:09:31Z | HO 2026-05-29T14:14:24Z | HO 2026-07-30T13:05:10Z | HO 2026-09-30T11:45:11Z |
| PR | 41 | HO 2026-03-30T22:57:03Z | HO 2026-05-30T22:31:22Z | HO 2026-07-29T13:35:46Z | HO 2026-09-30T22:33:51Z |
| SC | 42 | HO 2026-03-27T16:40:55Z | HO 2026-05-27T17:45:16Z | HO 2026-07-20T14:39:44Z | HO 2026-09-29T16:42:29Z |
| RS | 43 | HO 2026-03-30T11:35:09Z | HO 2026-05-29T16:10:48Z | HO 2026-07-29T10:49:34Z | HO 2026-09-30T09:40:35Z |
| MS | 50 | HO 2026-03-30T09:34:48Z | HO 2026-05-29T16:44:24Z | HO 2026-07-30T11:24:44Z | HO 2026-09-29T12:24:53Z |
| MT | 51 | HO 2026-03-27T18:59:30Z | HO 2026-05-28T10:42:08Z | HO 2026-07-29T12:06:45Z | HO 2026-09-24T16:33:07Z |
| GO | 52 | HO 2026-03-27T17:18:27Z | HO 2026-05-29T14:46:16Z | HO 2026-07-29T16:31:03Z | HO 2026-09-29T17:34:48Z |
| DF | 53 | HO 2026-03-30T12:45:20Z | HO 2026-05-29T17:41:02Z | HO 2026-07-29T17:12:55Z | HO 2026-09-30T15:42:12Z |

Leitura:

- **2026 b1 a b4**: presentes no extrato para os 28 entes, sem ausência.
- **b4 de 2026**: as homologações vão de `2026-09-18T14:47:08Z` (RN) a `2026-09-30T22:36:35Z` (RJ). **27 de 28** caíram entre 2026-09-24 e 2026-09-30; só o RN fica fora. (O relatório de cobertura dizia "26 dos 28"; o crítico corrigiu pelos arquivos `extrato_2026`.)
- **b5 de 2026**: não aparece em nenhum extrato. O `/rreo` do RJ para 2026 b5 veio vazio (01:26:16Z). **Inferência**: o prazo ainda não venceu.
- Retificações em 2026: RJ b1 e b2; SP b1.
- **Ressalva**: o extrato mostra homologação e retificação, mas não garante que o `/rreo` já tenha os dados. A célula do indicador em 2026 b4 só foi **vista** no `/rreo` para União, SP, RJ, MG e DF. Nos outros 23 estados, a presença do `cod_conta` e da coluna é **inferida** pelo extrato (crítico, lacuna L1).

### 8.2 Exercício 2025, b6: só 4 de 28 entes verificados

| Ente | Status do RREO 2025 b6 | Coincidências |
|---|---|---|
| União | HO `2026-01-30T22:36:41Z` | DCA 2025 HO `2026-04-29T14:38:58Z`; MSC de Encerramento entregue em 2026-04-01 |
| SP | **RE** `2026-04-16T16:07:44Z` | Um dia antes da MSC de Encerramento (2026-04-17) |
| RJ | **RE** `2026-05-06T17:14:12Z` | Mesmo dia da MSC de Encerramento (2026-05-06); DCA RE `2026-05-08T10:22:12Z` |
| DF | **RE** `2026-05-08T16:59:04Z` | Mesmo dia da MSC de Encerramento e da DCA RE (`2026-05-08T16:59:48Z`) |
| Outros 24 estados | **Não verificado** | Custaria 24 requisições ao extrato 2025 |

- **Inferência**, rotulada assim pelo próprio relatório e considerada fraca pelo crítico: "os números do b6 podem mudar meses depois do prazo". Nenhum valor anterior ou posterior a uma retificação foi observado. O único fato é que, no RJ, o b6 RE de 2025 bate exatamente com a DCA RE de 2025 (critic.json).
- O extrato tem **uma linha** por (entregável, período, instituição), sem histórico e sem a data da entrega original.

### 8.3 Disponibilidade no `/rreo` depois da homologação (limites superiores)

Diferença entre `data_status` do b4 2026 e a primeira coleta do Anexo 01 2026 b4. **Calculado nesta redação.** Supõe que o sufixo `Z` de `data_status` é UTC (não verificado). São **limites superiores**: ninguém mediu quando o dado apareceu pela primeira vez.

| Ente | Homologação (b4) | Primeira coleta com dados | Limite superior |
|---|---|---|---|
| União | 2026-09-30T14:28:06Z | 2026-10-02T01:23:10Z | 34h55m04s |
| SP | 2026-09-30T11:45:11Z | 2026-10-02T01:23:22Z | 37h38m11s |
| RJ | 2026-09-30T22:36:35Z | 2026-10-02T01:23:46Z | 26h47m11s |
| MG | 2026-09-30T22:30:39Z | 2026-10-02T01:49:16Z | 27h18m37s |
| DF | 2026-09-30T15:42:12Z | 2026-10-02T01:48:57Z | 34h06m45s |

O relatório de cobertura dizia "cerca de 11 a 14 horas após a homologação" para União e SP. O crítico mostrou que a conta estava errada (cerca de 34h55m e 37h38m) e que se trata só de um limite superior.

### 8.4 Comparabilidade União × estados

| Aspecto | Observado | Consequência |
|---|---|---|
| Campos e colunas | Mesmos 15 campos e mesmas 16 colunas no Anexo 01 (União × SP, 2026 b4); `rotulo` único `'Padrão'` | Mesma chave de seleção |
| `cod_conta` do indicador | Presente e com a mesma chave em União, SP, RJ, MG e DF | Comparação lado a lado possível para esses 5 entes |
| Rótulos de linha | Numeração romana difere: `(IX)` na União, `(VIII)` nos estados | Selecionar por `cod_conta`, nunca por `conta` |
| Refinanciamento | Linha presente na União e no RJ; ausente em SP, MG e DF | `TotalDespesas` não é comparável entre entes |
| Subcontas exclusivas | União: `TransferenciasAEstados...` e `BeneficiosPrevidenciarios`. SP: `TransferenciasAMunicipios`. DF e o município do Rio: sem `DemaisDespesasCorrentes` | Comparar só os grupos comuns (seção 5.1) |
| Consolidação | Transferências entram como despesa paga de quem transfere: União `'531673082300.42'` até 2026 b4. A receita dos entes recebedores não foi levantada | **Não somar** União com estados, nem estados entre si |

---

## 9. Inconsistências apontadas pelo crítico

| # | Inconsistência | Relatório corrigido | Efeito no projeto |
|---|---|---|---|
| I1 | Um 5xx foi omitido: docs diz "nenhum 429 ou 5xx", mas houve 502 em `/anexos-relatorios` às 01:19:22Z (união) e status `000` às 01:19:21Z (rj) | docs.json | Tratar 5xx com retentativa limitada; registrar o incidente (seção 2.2) |
| I2 | Etiqueta violada no agregado: 98 requisições entre 01:18 e 01:41Z, 25 no minuto 01:21, 8 segundos com 2 requisições | todos | Limitador global; proibir coleta paralela |
| I3 | `esfera` do DF varia por endpoint (`'D'` em `/entes`, `'E'` no `/rreo`) | docs.json; cobertura.json | `esfera` fora da chave de junção |
| I4 | `uf` varia por endpoint; as siglas de 25 UFs foram apresentadas como observadas, mas foram inferidas | cobertura.json | Tabela própria de entes; sigla não vem de `/entes` |
| I5 | Generalização errada: o RJ **tem** linha de refinanciamento (`'1555292452.73'` em 2025 b6; `'1175684863.78'` em 2026 b4) | cobertura.json | `TotalDespesas` ≠ `Subtotal` no RJ |
| I6 | Defasagem calculada errada: não são "11 a 14 h", mas cerca de 34h55m (União) e 37h38m (SP), e só como limite superior | cobertura.json | Seção 8.3 |
| I7 | Contagem errada: são 27 de 28 (não 26) os b4 homologados entre 09-24 e 09-30 | cobertura.json | Seção 8.1 |
| I8 | `TotalDespesas` muda de significado: nas amostras até 2019 (RJ 2015, 2018 e 2019; União 2019), é a linha que soma o superávit; nas de 2020 em diante (RJ), não | docs.json; cobertura.json | Recorte "TotalDespesas" não validado |
| I9 | `Superavit` e `TotalDespesasComSuperavit` ocupam a coluna de pagas sem ser pagamento | docs.json (omitiu o segundo) | Selecionar só o `cod_conta` do indicador |
| I10 | Natureza temporal: União mensal na STN × bimestral no Siconfi | uniao | Só acumulados de meses pares são comparáveis |
| I11 | Versão publicada × versão no Siconfi: PDF da União é republicação sem RE no extrato; empenhado diverge 7 a 8 mil | uniao-reconciliacao.json | Seção 7.1 |
| I12 | Linhas do PDF sem célula no Siconfi (Reserva de Contingência; Demais Despesas Correntes intra) | uniao-reconciliacao.json | Ausência ≠ zero ≠ "não existe na publicação" |
| I13 | O mesmo rótulo tem escopo diferente: "Despesas Exceto Intraorçamentárias" na DCA inclui o refinanciamento; no RREO, não | — | DCA não substitui o RREO sem definição própria |
| I14 | A chave (anexo, rotulo, coluna, cod_conta) não é única fora do Anexo 01 (até 174 duplicatas no Anexo 02; 5 na DCA) | docs.json | Chave bruta inclui `conta`; a ingestão falha explicitamente se houver repetição |
| I15 | Colunas e precisão variam (coluna k; valores inteiros em 2019). **Parcialmente refutado nesta redação**: a coluna (k) varia por bimestre (só no b6), mas está presente nos b6 de 2019, 2020 e 2021 do RJ e de 2019 da União, ao contrário do que diz o crítico (seção 5.4). A variação de precisão se confirma (RJ 2019: 577 de 696 valores inteiros) | — | O ETL não pode assumir esquema fixo entre bimestres nem precisão fixa |
| I16 | O spec se contradiz sobre `co_esfera` obrigatório | docs.json | Não enviar `co_esfera`; validar localmente |
| I17 | Base path não documentado: o caminho legado sem `cdwhprd` responde com bytes idênticos | — | Fixar o caminho documentado na allowlist |
| I18 | Ambiguidade "Rio": em docs é o município (RE `2026-05-08T15:00:35Z`), em cobertura é o estado (RE `2026-05-06T17:14:12Z`) | docs.json; cobertura.json | Nomear sempre por `cod_ibge` |
| I19 | `populacao` "por exercício" não é consistente (RJ igual em 2025 e 2026; União `8569324` em todo lugar). Nesta redação: o RJ muda de valor entre 2015 e 2023 nas amostras (seção 6.3), então o campo não é fixo, mas a regra de atualização é desconhecida | docs.json | Nenhum per capita com essa fonte |

## 10. Afirmações fracas apontadas pelo crítico

| # | Afirmação | Por que é fraca |
|---|---|---|
| F1 | "Indicadores de educação e saúde via RREO não estão disponíveis nesta API" (docs) | Baseada só na ausência dos anexos 08 e 12 no enum; nenhuma consulta foi tentada |
| F2 | "Não existe consulta que traga vários entes de uma vez" (cobertura) | 2 testes negativos e o spec; plausível, mas não esgotado |
| F3 | Siglas de 25 UFs como dado observado (cobertura) | Inferidas do código IBGE |
| F4 | `data_status` como "data de publicação/entrega" (docs, cobertura) | É a data do status atual (HO/RE), não da entrega original nem da publicação legal |
| F5 | "Defasagem observada" (docs, cobertura) | Só limite superior; na cobertura, valor errado |
| F6 | "OK" na reconciliação da União | Diferença menor que 0,5 mil (~R$ 500), não igualdade ao centavo; PDF republicado diverge no empenhado |
| F7 | Reconciliação do RJ 2023 como prova geral | Só linhas de total; não se generaliza para 2025/2026; não prova Anexo 01 intacto após o RE de 2024-07-03 |
| F8 | "Linhas candidatas mais homogêneas: DespesasExcetoIntraOrcamentarias" (cobertura) | Concluída com União e SP; os testes do crítico em RJ, MG e DF apoiam, mas não cobrem os 27 |
| F9 | "Os números do b6 podem mudar meses depois do prazo" | Inferência; nenhum valor antes/depois de retificação foi observado |
| F10 | "No RREO a periodicidade é sempre B, mesmo no Simplificado" (docs) | Vem do spec; nenhum Simplificado foi observado |
| F11 | "A variante gzip tem outra chave de cache no CDN" (docs) | Especulação a partir de um único timeout |
| F12 | Selecionar por (anexo, rotulo, coluna, cod_conta) como regra geral (docs) | Só vale no Anexo 01 |
| F13 | "A fonte direta de despesas pagas é o Anexo 01 coluna (j)" (docs) | Correta, mas omite Superavit, TotalDespesasComSuperavit e a mudança de TotalDespesas |

## 11. Lacunas

| # | Lacuna | Impacto | Como fechar |
|---|---|---|---|
| L1 | Célula do indicador vista só em 5 entes (União, SP, RJ, MG, DF); nos outros 23 estados é inferida pelo extrato | Não publicar UF sem verificação automática | Ingestão-piloto com checagem da célula e das identidades |
| L2 | Reconciliação externa insuficiente: nenhum estado reconciliado para 2025 ou 2026 | Precisão estadual não comprovada contra publicação | Reconciliar ao menos 3 estados (seção 15) |
| L3 | Versionamento invisível: o `/rreo` não informa versão nem data; o extrato só mostra o último status; TTL do CDN desconhecido | Não dá para saber se um valor é anterior ou posterior a uma retificação | Histórico próprio do extrato e dos snapshots a cada coleta |
| L4 | Republicação da União sem RE no Siconfi; divergência de empenhado sem explicação | Publicação da STN pode diferir do Siconfi | Consulta à STN |
| L5 | Fuso real de `data_status` (sufixo `Z`; concentração perto das 22:30Z no prazo) | Datas exibidas podem estar deslocadas | Consulta à STN; comparar com publicações |
| L6 | Defasagem real entre homologação e disponibilidade no `/rreo` | Só limites superiores (26h47m a 37h38m) | Medir com coletas periódicas |
| L7 | Extrato 2025 (b6) não consultado para 24 dos 28 entes | Cobertura e retificações de 2025 incompletas | 24 requisições sequenciais |
| L8 | MDF da STN não lido: exclusão de restos a pagar da coluna (j) e quebra de 2020 são inferências | Definição normativa do indicador não confirmada | Ler o MDF vigente e registrar a referência |
| L9 | Não há regra de consolidação entre esferas; receita de transferências dos recebedores não levantada | Impede total nacional | Fora do escopo atual (decisão tomada) |
| L10 | Quebra estrutural histórica vista só no RJ e na União 2019; anos anteriores a 2015 não vistos | Profundidade histórica indefinida | Mapear o Anexo 01 por ano antes de decidir |
| L11 | Comportamento de bloqueio por excesso de requisições é desconhecido (duração, código HTTP); houve um 502 sob concorrência | Risco operacional para a ingestão | Limitador global; retentativas limitadas; consulta à STN |
| L12 | Origem, safra e metodologia de `populacao` não documentadas | Nenhum per capita | Fonte externa (IBGE), se Gabriel decidir |
| L13 | MSC (mensal): mapeamento de contas para "despesa paga" desconhecido | Sem visão mensal | Fora do escopo atual |
| L14 | Interação DF × FCDF (pago pela União) não investigada | Possível dupla contagem em comparações | Investigação específica |
| L15 | Relatórios da União, do RJ e da reconciliação chegaram truncados ao crítico | Algumas afirmações só existiam no texto truncado | Este documento usa só o que está nos JSON e nos artefatos salvos |
| L16 | Empenhado e saldo da União 2026 b4 não comparados com o PDF | A divergência de 2025 pode se repetir | Repetir a comparação de colunas em 2026 b4 |
| L17 | O docs recebeu `TCP_REMOTE_HIT` no seu `/entes` (01:19:43Z) e no seu extrato 53/2025 (01:26:16Z) e concluiu que houve "requisição anterior de outro cliente". **Correção nesta redação**: pelos logs agregados, os próprios agentes já tinham feito essas requisições antes (`/entes` pelo união às 01:19:07Z e pelo rj às 01:19:09Z; extrato 53/2025 pelo cobertura às 01:23:54Z). O HIT pode ser explicado pelas próprias coletas e não permite concluir que houve outro cliente. O TTL do CDN continua desconhecido | Não se sabe quanto tempo um dado retificado leva para aparecer | Registrar `X-Cache` e ETag em cada coleta |

---

## 12. Recortes validados e não validados

| Recorte | Situação | Condição ou motivo |
|---|---|---|
| Total da União, acumulado até o bimestre (indicador) | **Validado**, precisão de R$ mil | 2025 b6 e 2026 b4 contra PDFs da STN |
| Estados e DF, mesma métrica, mesmo (exercício, bimestre), lado a lado, **sem somar** | **Validado com ressalvas** | Célula confirmada em SP, RJ, MG e DF. Antes de publicar cada UF, a ingestão confirma a célula e as identidades. Reconciliação estadual só no RJ 2023 b6 |
| Série intra-anual do mesmo ente (b1 a b6) como curva cumulativa | **Validado** | Valores acumulados em sequência, sem diferenças entre bimestres |
| Mesmo bimestre, ano contra ano, no mesmo ente | **Validado com ressalvas** | Nominal, com aviso de possível retificação |
| Composição por grupos comuns do Anexo 01 dentro de um ente | **Validado** | Só os 8 grupos comuns; subcontas exclusivas ficam fora |
| Pagas "no bimestre" (isolado) | Não validado | Não existe na fonte; a diferença mistura versões |
| Soma bruta dos estados | Não validado (e fora do escopo por decisão) | Estruturas diferentes, regra de UF faltante inexistente, transferências |
| Total nacional consolidado | Não validado (e fora do escopo por decisão) | A fonte não consolida; dupla contagem; municípios não cobertos |
| Por função ou subfunção, bimestral | Não validado | O Anexo 02 não tem coluna de pagas |
| Por função, anual via DCA-Anexo I-E | Não validado | Conceito diferente (inclui refinanciamento); defasagem de cerca de 4 meses |
| `TotalDespesas` como manchete | Não validado | Inclui refinanciamento; nas amostras, o significado mudou entre 2019 e 2020 (seção 5.4) |
| Série anual de vários exercícios | Não validado | Quebra estrutural 2019/2020; precisão variável; retificações |
| Per capita | Não validado | `populacao` sem origem documentada |
| Comparação entre categorias exclusivas de um ente (por exemplo benefícios previdenciários da União contra estados) | Não validado | Subcontas não comuns: União tem `BeneficiosPrevidenciarios` e `TransferenciasAEstados...`; SP tem `TransferenciasAMunicipios`; DF e o município do Rio não têm `DemaisDespesasCorrentes` (crítico) |
| Valores reais (corrigidos pela inflação) | Não validado | Índice e data-base são decisão; fonte do índice não validada |
| Educação e saúde (mínimos constitucionais) | Não validado | Anexos 08 e 12 ausentes; nenhuma consulta tentada |
| Restos a pagar pagos somados às pagas do exercício | Não validado | Outro conceito; não reconciliado |
| Mensal via MSC | Não validado | Mapeamento desconhecido |

---

## 13. Rastreabilidade: achados da fonte e decisões de arquitetura

As decisões abaixo **já foram tomadas** e não são alteradas aqui. A tabela liga cada uma ao achado que a sustenta.

| Achado (seção) | Decisão de arquitetura |
|---|---|
| Limite documentado de 1 req/s; violação no agregado; 502 sob concorrência (2.2) | Ingestão em processo separado (`scripts/ingest.ts`, via CLI e cron do Railway), nunca exposta por HTTP. Limitador global com intervalo mínimo de 1,1 s, sequencial. `pg_advisory_lock` contra execuções simultâneas |
| 502, timeout de 120 s, `69.26` s sem cache (3, 4.1) | Até 3 retentativas com backoff, só para erro de rede, timeout e 5xx. Timeout de 60 s para dados e 180 s para metadados |
| `gzip` esgotou 120 s; servidor não comprime (3) | `Accept-Encoding: identity` |
| Links ORDS apontam para host interno; caminho legado ativo; http responde 307 (3) | Só https; host fixo em allowlist (`apidatalake.tesouro.gov.br`, base `/ords/cdwhprd/siconfi/tt/`); redirect tratado como erro; `offset` montado localmente |
| Respostas chunked, sem `Content-Length` (3) | Limite de tamanho de corpo |
| `valor` é número JSON com casas variáveis (2.3) | Números lidos preservando o texto exato do JSON (sem float); células com `valor_texto` + NUMERIC |
| O `/rreo` não tem versão; o extrato não tem histórico; retificações meses depois (8.2, L3) | Respostas brutas deduplicadas (corpo, sha256, URL, parâmetros, ETag, `X-Cache`, data de coleta). Snapshots por declaração (ente, exercício, bimestre, demonstrativo, anexo) com hash canônico. Histórico do extrato (status HO/RE e `data_status`) gravado a cada coleta |
| Fonte instável; resposta vazia não é zero (3) | Ativação transacional do snapshot validado (índice único parcial para o ativo). Falha na fonte ou snapshot inválido mantém o último ativo |
| Identidades fecham em todos os casos observados (6.1) | Identidades verificadas antes de ativar (seção 5.1) |
| Não há consolidação; transferências entre esferas (8.4) | Entes: União (1), 26 estados e DF (53). **Sem total nacional consolidado e sem soma de estados.** Indicadores calculados na leitura a partir dos snapshots ativos |
| Pago só existe acumulado; o tipo de período precisa ser explícito (5.2) | API v1 com `bimestre` (1 a 6) explícito, nunca `periodo`; `conceito` por allowlist (`'pago'`); valores monetários serializados como string decimal |

Stack registrada (detalhes e advisories em `etapa1/versions.json`): Node 24 LTS (`engines` `>=24.21.0 <25`), pnpm 11.28.2, Next.js 16.3.8 (App Router) com React 19.2.8, TypeScript 6.0.3, ESLint 10.11.0 com eslint-config-next 16.3.8 (`settings.react.version` fixo), Vitest 5.0.3 com Vite 8.3.1, Drizzle ORM 0.45.3, drizzle-kit 0.31.11, pg 8.23.1, embedded-postgres 18.4.0-beta.17 nos testes e PostgreSQL 18 no Railway com tag de major fixa. Sem Tailwind.

**Ponto a conferir (não alterado aqui):** o relatório de versões recomendava instalar `vite 8.3.2` explicitamente ("que já tem as correções do Vite no Windows"). A decisão registrada é Vite 8.3.1. O versions.json informa só a versão corrigida dos dois advisories do Vite que cita (8.0.16), não a faixa afetada. **Inferência**: se as faixas afetadas na linha 8 terminam antes da 8.0.16, a 8.3.1 e a 8.3.2 estão fora delas. Isso não foi verificado no advisory, e a divergência entre 8.3.1 e 8.3.2 deve ser confirmada.

### 13.1 Outras decisões já tomadas (não derivadas da fonte)

Registradas aqui só para completude. Elas não dependem desta validação e não são alteradas por ela.

| Tema | Decisão |
|---|---|
| API própria v1 | Somente leitura: `GET /api/v1/brasil`, `/api/v1/estados`, `/api/v1/estados/{uf}`, `/api/v1/fontes`, `/api/v1/health`. Parâmetros `ano` (inteiro), `bimestre` (1 a 6, explícito) e `conceito` (allowlist: `'pago'`); UF por allowlist; parâmetro desconhecido → 400; valores monetários como string decimal; health com informação mínima |
| Banco | O serviço web usa pool com `default_transaction_read_only=on` e `statement_timeout`. Credenciais separadas recomendadas: `DATABASE_URL` (leitura, web) e `INGEST_DATABASE_URL` (ingestão e migrations). O papel somente-leitura de produção é criado por passo manual documentado, fora de migration, para não versionar senhas |
| Segurança HTTP | CSP com nonce gerado no `proxy.ts` (convenção do Next 16), `frame-ancestors 'none'`, HSTS em produção, `X-Content-Type-Options`, `Referrer-Policy` e `Permissions-Policy`. Sem `images.remotePatterns`, sem Server Actions, sem autenticação e sem cookies. A limitação de taxa global fica com a plataforma/CDN (sem contador local); no app, respostas limitadas e `statement_timeout` |
| Deploy | Railway: serviço web (`pnpm build` / `pnpm start`, pre-deploy `pnpm db:migrate`, healthcheck `/api/v1/health`) e serviço cron (`pnpm ingest`), com `DATABASE_URL` privada por referência. O agente não publica nem faz deploy |

---

## 14. Decisões pendentes de Gabriel

| # | Decisão | Opções | Recomendação dos relatórios | Estado |
|---|---|---|---|---|
| D1 | **Linha-manchete do indicador** | `DespesasExcetoIntraOrcamentarias` (sem intra e sem refinanciamento) ou `SubtotalDasDespesas` (inclui intra, que conta em dobro dentro do ente). `TotalDespesas` está descartado | `DespesasExcetoIntraOrcamentarias` | **Provisória na v0.1.0; precisa de confirmação** |
| D2 | Juros e amortização da dívida | Dentro da manchete (como hoje) ou destacados à parte | Sem recomendação | Pendente |
| D3 | Apresentação temporal | Só acumulado no ano até o bimestre, ou também "no bimestre" derivado por diferença, com aviso | Só acumulado | Pendente (o derivado é um recorte não validado) |
| D4 | UF sem entrega ou desatualizada na visão lado a lado | O que mostrar e com qual aviso | "Sem dado", nunca zero | Pendente |
| D5 | Política de versões | Só o último valor com selo "retificado em", ou também o histórico de versões coletadas | Sem recomendação | Pendente (o armazenamento já guarda o histórico) |
| D6 | Profundidade histórica | A partir de qual exercício | Considerar a quebra de 2019/2020 e a falta de centavos em 2019 | Pendente |
| D7 | Nominal ou real; per capita | Índice, data-base, fonte; população externa ao Siconfi | Sem recomendação explícita. O indicador proposto pelo crítico é nominal (aviso obrigatório "Valores nominais em R$ correntes, sem correção pela inflação") | Pendente |
| D8 | Visão anual por função (DCA) | Incluir ou não, com definição própria | Exige definição própria | Pendente |
| D9 | Tratamento do DF | Esfera `'D'` × `'E'`; possível interação com o FCDF | Sem recomendação explícita; a interação com o FCDF é lacuna não investigada (L14) | Pendente |
| D10 | Frequência de atualização | O que o portal mostra entre a homologação e a disponibilidade no `/rreo` | Sem recomendação | Pendente |
| D11 | Precisão de exibição | Por exemplo R$ bilhões com 1 casa | Exibir arredondado; guardar exato | Pendente |
| D12 | Ações externas | Abrir consulta à STN (E-Serviços); pedir a alguém em outra rede o PDF da SEFAZ-RJ | Fazer as duas | **Precisa de autorização**; o agente não age sozinho |

Questões levantadas pelo crítico que **já foram decididas** na arquitetura (registradas para rastreabilidade):

| Questão | Decisão |
|---|---|
| Permitir "soma dos estados" ou "Brasil" consolidado | Não. Sem total nacional e sem soma de estados |
| Escopo de entes no lançamento | União, 26 estados e DF. Municípios ficam fora |
| Conceito exposto pela API | Só `'pago'` (allowlist) |
| Tipo de período | `bimestre` explícito (1 a 6) |

---

## 15. Próximos passos

| Prioridade | Passo | Detalhe | Depende de |
|---|---|---|---|
| 1 | Ingestão-piloto controlada (Etapa 3) | Anexo 01, 2026 b1 a b4 e 2025 b1 a b6, dos 28 entes: cerca de 280 requisições sequenciais a ≥1,1 s (cerca de 6 min, estimativa do crítico), com **um único limitador global**. Em cada resposta, verificar automaticamente: presença da célula; identidade 1; identidade 2 quando houver intra; unicidade da chave; `hasMore=false` (ou paginar) | Fundação (Etapa 2) |
| 2 | Extrato 2025 dos 24 entes restantes | 24 requisições sequenciais. Guardar o snapshot do extrato a cada coleta | Limitador global |
| 3 | Reconciliar ao centavo ao menos 3 estados (2026 b4 ou 2025 b6) | Com e sem linha de refinanciamento, por exemplo RJ, MG e um do Nordeste, contra o PDF da SEFAZ ou o DOE | D12 (RJ exige outra rede) |
| 4 | Repetir a comparação de colunas da União em 2026 b4 | Verificar se a divergência de empenhado também aparece em 2026 | — |
| 5 | Ler o MDF vigente da STN | Confirmar a definição da coluna (j) e a quebra de 2020; registrar a referência no glossário | — |
| 6 | Monitorar retificações | Recoletar com `If-None-Match` os períodos RE; comparar `valor_texto`; medir a defasagem real | Ingestão |
| 7 | Mapear o Anexo 01 dos exercícios desejados | Uma chamada por ano em um ou dois entes antes de decidir a profundidade histórica | D6 |
| 8 | Consulta à STN (E-Serviços) | Versão servida após RE; fuso de `data_status`; propagação de republicações (União 2025 b6); origem de `populacao`; política de bloqueio | D12 |
| 9 | Monitorar o contrato | ETag do `siconfi.yaml` (`"80534262"`); API "versão beta" | — |
| 10 | Atualizar `docs/methodology.md` e `docs/data-contract.md` | Levar para lá a definição da seção 5, depois de D1 | D1 |

**Regra operacional derivada desta etapa:** nenhuma coleta, smoke test ou agente futuro roda em paralelo contra a fonte. Toda consulta passa pelo limitador global.

---

## 16. Arquivos de evidência

Relatórios da Etapa 1 (JSON), em `<scratchpad>\etapa1\`:

- `docs.json`: API, endpoints, paginação, limites, erros, divergências do spec.
- `cobertura.json`: entregas por UF, comparabilidade União × estados.
- `uniao-investigacao.json` e `uniao-reconciliacao.json`.
- `rj-investigacao.json` e `rj-reconciliacao.json`.
- `critic.json`: revisão crítica (prevalece quando corrige os demais).
- `versions.json`: versões da stack, advisories, Railway, OWASP e NIST.

Amostras brutas e logs, em `<scratchpad>\siconfi\`:

| Pasta | Conteúdo principal |
|---|---|
| `docs\` | `log_requisicoes.tsv`, `siconfi.yaml`, `raw\*.json`, cabeçalhos |
| `cobertura\` | `log_requisicoes.jsonl`, `extrato_2026\*.json` (27), `extrato_2025\*.json` (3), `extrato_uniao_*.json`, `rreo_2026_b4_a01_{uniao,SP}.json`, `rreo_2025_b6_a01_SP.json`, `cobertura_resumo.json` |
| `uniao\` | `requests.log`, `rreo_2025_p6_all_p{0,1}.json`, `rreo_2025_p5_anexo01.json`, `rreo_2026_p4_all_p0.json`, `anexos_relatorios_502.html`, `tmp_pdf\` (texto extraído e imagens dos PDFs da STN) |
| `rj\` | `requests.log`, `rreo_2025_p6_all_page1.json`, `rreo_2025_p5_anexo01.json`, `rreo_2026_p4_all.json`, `rreo_2026_p5_anexo01_vazio.json`, `extrato_2026_hostlegado.json`, `sefazrj_relatorios_fiscais.html` (bloqueio) |
| `reconciliacao-uniao\` | `requests.log`, `siconfi_rreo_2025_p6_anexo01_confirm.json`, `compare_out.txt`, `compare_all_cols_out.txt`, `decode_p9_out.txt`, recortes PNG |
| `reconciliacao-rj\` | `requests.log`, PDF do Anexo 01 2023 (Wayback), `comparacao_2023_p6_anexo01_linhas_totais.txt`, `siconfi_rreo_2023_p6_anexo01.json`, `siconfi_extrato_2023.json`, `sefazrj_PrestacaoContas2025_Volume01_trechos.txt`, `sefazrj_bloqueio_anexo02.html`, páginas do IOERJ e consultas CDX |
| `revisao\` | `requests.log`, `rreo_{53,31}_2026_b4_a01.json`, `rreo_33_{2015,2018,2019,2020,2021}_b6_a01.json`, `rreo_1_2019_b6_a01.json`, `dca_{33,1}_2025_IE.json`, com cabeçalhos |
| raiz | `revisao_log.py` (contagem agregada de requisições), `revisao_an{1,2,3}.py` |

O scratchpad é temporário. Uma seleção foi arquivada no repositório (sem os
corpos brutos das respostas nem os PDFs):

- `docs/evidencias/2026-10-01-etapa1/`: os sete relatórios JSON acima, os logs
  de requisições de cada agente e a cópia do contrato `siconfi.yaml` usada.
- `tests/fixtures/siconfi/`: recortes reais do Anexo 01 e do extrato usados nos
  testes (origem em `tests/fixtures/siconfi/README.md`).

Caminhos locais foram substituídos por `<scratchpad>`, `<sessao>` e `<repo>`.

---

## 17. Adendo — ingestão completa (2026-10-02)

Primeira execução da ingestão implementada (Etapa 3) contra a fonte real, em
banco local de desenvolvimento. Evidências em
`docs/evidencias/2026-10-02-ingestao-completa/` (`requisicoes.csv`,
`execucoes.json`, `snapshots-ativos.json`).

### 17.1 Resultado

| Execução | Escopo | Requisições | Versões ativadas | Rejeitadas | Situação |
|---|---|---|---|---|---|
| 1 (02:18:37Z) | União e RJ, 2026 | 10 | 8 | 0 | concluída |
| 2 | mesma, repetida | 2 (só extratos) | 0 | 0 | concluída — idempotência confirmada |
| 3 (02:19:16Z–02:28:45Z) | 28 entes, 2025 e 2026 | 407 | 270 | 0 | concluída com 2 falhas (HTTP 429) |
| 4 | mesma, repetida | 60 | 2 (as que faltavam) | 0 | concluída |

- Ao final, **280 declarações ativas**: União, 26 estados e DF × 2025 b1–b6 e
  2026 b1–b4. Todas passaram nas verificações da metodologia 0.1.0
  (ExcetoIntra = Correntes + Capital; Correntes = Pessoal + Juros + Outras;
  Capital = Investimentos + Inversões + Amortização; Subtotal = ExcetoIntra +
  Intra), com aritmética decimal exata. Isso fecha a lacuna L1 (célula do
  indicador observada só em 5 entes) para 2025 e 2026.
- Valor da União, 2026 b4, `DespesasExcetoIntraOrcamentarias`:
  `2821965337713.47`, igual ao da seção 7 (reconciliado em R$ mil).
- Valor do RJ, 2025 b6: `102599919210.67`, igual ao da seção 6.
- As lacunas de reconciliação estadual (L2) continuam abertas: a ingestão
  valida a consistência interna, não substitui a comparação com a publicação
  de cada estado.

### 17.2 Limite de taxa real da CDN (HTTP 429)

Fato novo, ausente na Etapa 1. Na execução 3, com intervalo de 1,1 s entre
requisições sequenciais (mediana medida: 1,111 s), **81 de 407 respostas foram
HTTP 429**:

- Vieram da borda (cabeçalho `X-Cache: CONFIG_NOCACHE`, duração média de 25 ms),
  sem `Retry-After` nem cabeçalhos `X-RateLimit-*` registrados.
- Ocorreram aproximadamente a cada 11 requisições (ids 21, 32, 43, 57, 68…),
  o que sugere — inferência — uma janela deslizante mais restritiva que o
  "1 requisição por segundo" do contrato.
- As retentativas (até 3, com espera crescente) recuperaram 79; duas
  declarações ficaram sem coleta e o estado anterior (nenhum) foi preservado.

Decisão de engenharia aplicada (mais conservadora que a decisão original de
1,1 s, portanto alinhada à regra "respeitar limites da fonte"): intervalo base
de 1,5 s; ao receber 429, o intervalo dobra até 6 s pelo resto da execução e a
próxima tentativa espera o `Retry-After` (quando houver) ou 10 s × tentativa.
Na execução 4, com a regra nova: 2 respostas 429 em 60 e nenhuma falha.

Lacuna mantida: a política exata de limitação da CDN é desconhecida; vale
incluí-la na consulta à STN (D12).

---

## Histórico deste documento

| Data | Mudança |
|---|---|
| 2026-10-01 | Primeira versão: registro da Etapa 1 com as coletas de 2026-10-02T01:18Z a 01:51Z (UTC) |
| 2026-10-01 | Revisão adversarial contra os JSON e as amostras brutas, sem nova consulta à fonte. Correções: coluna (k) presente nos b6 de 2019 a 2021 (refuta o crítico; seções 5.4 e 9, I15); `populacao` do RJ varia entre 2015 e 2023 (6.3, I19); `TCP_REMOTE_HIT` explicado pelas próprias coletas (L17); `TotalDespesas` antes de 2020 restrito às amostras (5.4, I8); linha IX no exemplo mensal × bimestral (5.2); 3 células vazias contadas como iguais no RJ 2023 (7.3); `OutrasDespesasCorrentesIntra` na reconciliação da União (7.1); republicação sem RE tratada como caso único (7.1); exercícios observados listados um a um (1.2); recomendações atribuídas indevidamente em D7 e D9; recorte não validado de categorias exclusivas (12); outras decisões de arquitetura (13.1); inferências sobre horário dos logs (2.2, 2.4) e advisories do Vite (13) |
| 2026-10-02 | Seção 17 (ingestão completa, 280 declarações validadas, limite real da CDN com HTTP 429) e arquivamento das evidências no repositório (seção 16) |
