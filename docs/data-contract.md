# Contrato de dados

**Status:** rascunho para revisão de Gabriel. **Redação:** 2026-10-01, horário de Brasília. **Metodologia de referência:** v0.1.0, provisória (ver D1 na seção 1.17).

Este documento descreve o que o PortalDash pode esperar da fonte oficial e o que consome dela (Parte 1). A Parte 2 descreve a API pública do próprio PortalDash.

## Como ler este documento

- Toda afirmação factual sobre a fonte cita uma evidência `[Exx]` do registro da seção 1.0. O registro traz a URL, a hora de coleta (UTC) e o resultado. Os relatórios da Etapa 1 são citados pelo nome: `[docs]`, `[cobertura]`, `[uniao]`, `[uniao-rec]`, `[rj]`, `[rj-rec]`, `[critica]` (revisão crítica) e `[versions]`.
- Valores copiados da fonte aparecem em `monoespaçado` e reproduzem o texto exato do JSON: ponto decimal, sem separador de milhar. Valores de PDFs aparecem como impressos (por exemplo 3.606.510.496 em R$ mil).
- Uma afirmação sem marcador é **fato observado** numa resposta real. Os demais casos levam marcador:
  - **Documentado:** está no contrato oficial (`siconfi.yaml`) ou na página oficial, mas nem sempre foi testado.
  - **Inferência:** conclusão tirada de observações, sem confirmação da fonte.
  - **Hipótese:** explicação possível que ainda não foi testada.
  - **Lacuna:** não foi verificado e não deve ser tratado como fato.
- As horas de coleta estão em UTC. Todas as coletas foram feitas em 2026-10-02 entre 01:18Z e 01:52Z, o que corresponde à noite de 2026-10-01 em Brasília (UTC−3).
- Quando a revisão crítica corrige outro relatório, vale a revisão crítica. Em dois pontos, a releitura das amostras brutas e dos logs contradiz a própria revisão crítica: a coluna (k) (seção 1.12) e o horário da chamada E09 em relação ao 502 (seção 1.2). Os dois casos estão sinalizados no texto.
- Onde estão as evidências: os relatórios ficam em `etapa1\` e as amostras e logs em `siconfi\`, ambos sob `<scratchpad>\`. Esse diretório é temporário, pertence à sessão e fica fora do repositório (ver L10).

---

## Parte 1: Fonte: API de dados abertos do Siconfi

### 1.0 Registro de evidências

Nas tabelas abaixo, `{BASE}` significa `https://apidatalake.tesouro.gov.br/ords/cdwhprd/siconfi/tt/`. Todas as requisições são GET, coletadas em 2026-10-02 (UTC). A coluna "Arquivo" é relativa a `scratchpad\siconfi\`.

**Documentação, metadados e testes de comportamento**

| ID | Requisição | Coleta | Resultado | Arquivo / relatório |
|---|---|---|---|---|
| E01 | `https://www.tesourotransparente.gov.br/consultas/consultas-siconfi/siconfi-api-de-dados-abertos` | 01:18:45Z | 200, 26673 bytes | `docs\entrada.html` [docs] |
| E02 | `https://apidatalake.tesouro.gov.br/docs/siconfi/` | 01:19:06Z | 200. Pelo `http://`: 307 para `https://` às 01:18:59Z | `docs\docs_index.html` [docs] |
| E03 | `https://apidatalake.tesouro.gov.br/docs/siconfi.yaml` | 01:19:11Z | 200, 44465 bytes, `ETag: "80534262"` | `docs\siconfi.yaml`, `.headers` [docs] |
| E04 | `{BASE}entes` | 01:19:43Z | 200, 5598 itens, 866510 bytes, 0,36 s, `X-Cache: TCP_REMOTE_HIT` | `docs\raw\entes_p0.json` [docs] |
| E05 | `{BASE}entes?limit=3&offset=10` | 01:20:14Z | 200, `hasMore` true | `docs\raw\entes_limit3_offset10.json` |
| E06 | `{BASE}entes?limit=10000&offset=5590` | 01:23:46Z | 200, 8 itens, `limit` ecoado 10000 | `docs\raw\entes_limit10000_offset5590.json` |
| E07 | `{BASE}anexos-relatorios` | 01:19:22Z | **502**, página HTML "Service unavailable", 1602 bytes | `uniao\anexos_relatorios_502.html` [uniao] |
| E08 | `{BASE}anexos-relatorios` | 01:19:21Z | sem resposta (o curl desistiu após 120 s) | `rj\requests.log` [rj] |
| E09 | `{BASE}anexos-relatorios` | 01:20:24Z | 200, 168 itens, 10809 bytes, **69,26 s**, `TCP_MISS` | `docs\raw\anexos_relatorios.json` |
| E10 | `{BASE}anexos-relatorios` | 01:24:39Z | 200, 0,22 s, `TCP_REMOTE_HIT`, conteúdo idêntico ao de E09 | `docs\raw\anexos_relatorios_2.json` |
| E11 | E09 com `Accept-Encoding: gzip` | 01:27:29Z | nenhum byte em 120,01 s (curl 28) | `docs\raw\anexos_gzip.headers` |
| E12 | `{BASE}extrato_entregas?id_ente=3304557&an_referencia=2025` com `Accept-Encoding: gzip` | 01:29:43Z | 200, corpo sem compressão (identity), `TCP_REMOTE_HIT` | `docs\raw\extrato_gzip.*` |
| E13 | `{BASE}rreo?an_exercicio=2025&nr_periodo=6&co_tipo_demonstrativo=RREO&no_anexo=RREO-Anexo%2001&id_ente=3304557` | 01:21:52Z | 200, 661 itens, 247524 bytes, 1,09 s, `TCP_MISS` | `docs\raw\rreo_2025_p6_anexo01_3304557.*` |
| E14 | E13 com `an_exercicio=abc` | 01:22:23Z | **400** `application/problem+json`, 372 bytes | `docs\raw\erro_an_exercicio_abc.body` |
| E15 | E13 com `nr_periodo=7` | 01:22:30Z | 200, `items` vazio | `docs\raw\rreo_periodo7.json` |
| E16 | `{BASE}rreo?an_exercicio=2025&nr_periodo=6&co_tipo_demonstrativo=RREO%20Simplificado&no_anexo=RREO-Anexo%2001&limit=5` (sem `id_ente`) | 01:23:09Z | 200, `items` vazio | `docs\raw\rreo_simpl_sem_id_ente_limit5.json` |
| E17 | `{BASE}rreo?an_exercicio=2025&nr_periodo=6&co_tipo_demonstrativo=RREO&no_anexo=RREO-Anexo%2001&co_esfera=E&limit=3` (sem `id_ente`) | 01:23:19Z | 200, `items` vazio | `docs\raw\rreo_esferaE_sem_id_ente_limit3.json` |
| E18 | `{BASE}rreo?an_exercicio=2025&nr_periodo=6&co_tipo_demonstrativo=RREO&id_ente=33&limit=3&offset=4998` | 01:24:01Z | 200, `count` 0 | `docs\raw\rreo_33_sem_anexo_offset4998_limit3.json` |
| E19 | o mesmo de E18 com `limit=2&offset=1500` | 01:24:12Z | 200, `hasMore` true, `next` com `offset=1502` | `docs\raw\rreo_33_sem_anexo_offset1500_limit2.json` |
| E20 | E13 repetida com `If-None-Match` | 01:24:28Z | **304**, 0,19 s, `TCP_REMOTE_HIT` | `docs\raw\rreo_rio_ifnonematch.headers` |
| E21 | `{BASE}rreo_inexistente` | 01:26:28Z | **404** `application/problem+json`, 171 bytes | `docs\raw\erro_404.*` |
| E22 | `https://apidatalake.tesouro.gov.br/ords/cdwhprd/siconfi/metadata-catalog/tt/item` | 01:26:35Z | 404 `application/problem+json` | `docs\raw\metadata_catalog_item.*` |
| E23 | `{BASE}extrato_entregas?id_ente=3304557&an_referencia=2025` | 01:22:45Z | 200, 55 itens | `docs\raw\extrato_3304557_2025.json` |
| E24 | `{BASE}extrato_entregas?id_ente=5300108&an_referencia=2025` | 01:26:05Z | 200, 0 itens | `docs\raw\extrato_5300108_2025.json` |
| E25 | `{BASE}extrato_entregas?id_ente=53&an_referencia=2025` | 01:26:16Z | 200, 71 itens, `TCP_REMOTE_HIT` | `docs\raw\extrato_53_2025.json` |
| E26 | `{BASE}rreo?an_exercicio=2026&nr_periodo=4&co_tipo_demonstrativo=RREO&no_anexo=RREO-Anexo%2001&id_ente=3304557&limit=2` | 01:25:56Z | 200 | `docs\raw\rreo_rio_2026_p4_anexo01_limit2.json` |
| E27 | `http://www.tesouro.fazenda.gov.br/mdf` (link "Veja mais" do spec) | 01:24:59Z | falha de DNS (curl 6) | `docs\log_requisicoes.tsv` |

**União (`id_ente=1`)**

| ID | Requisição | Coleta | Resultado | Arquivo / relatório |
|---|---|---|---|---|
| E30 | `{BASE}extrato_entregas?id_ente=1&an_referencia=2025` | 01:21:36Z | 200, 1157 itens, 313327 bytes | `uniao\extrato_2025.json` [uniao] |
| E31 | `{BASE}extrato_entregas?id_ente=1&an_referencia=2026` | 01:21:47Z | 200, 722 itens | `uniao\extrato_2026.json` |
| E32 | `{BASE}rreo?an_exercicio=2025&nr_periodo=6&co_tipo_demonstrativo=RREO&id_ente=1` | 01:21:57Z | 200, 5000 itens, `hasMore` true, 1804908 bytes | `uniao\rreo_2025_p6_all_p0.json` |
| E33 | E32 com `&offset=5000` | 01:22:11Z | 200, 1893 itens, `hasMore` false | `uniao\rreo_2025_p6_all_p1.json` |
| E34 | `{BASE}rreo?an_exercicio=2025&nr_periodo=5&co_tipo_demonstrativo=RREO&no_anexo=RREO-Anexo%2001&id_ente=1` | 01:24:13Z | 200, 846 itens | `uniao\rreo_2025_p5_anexo01.json` |
| E35 | `{BASE}rreo?an_exercicio=2026&nr_periodo=4&co_tipo_demonstrativo=RREO&id_ente=1` | 01:24:23Z | 200, 4626 itens | `uniao\rreo_2026_p4_all_p0.json` |
| E36 | `{BASE}rreo?an_exercicio=2025&nr_periodo=6&co_tipo_demonstrativo=RREO&no_anexo=RREO-Anexo%2001&id_ente=1` | 01:34:44Z | 200, 869 itens, 298830 bytes, `TCP_MISS` | `reconciliacao-uniao\siconfi_rreo_2025_p6_anexo01_confirm.json` [uniao-rec] |
| E37 | PDF do RREO de dez/2025 republicado: `https://cdn.tesouro.gov.br/sistemas-internos/apex/producao/sistemas/thot/arquivos/publicacoes/53743_1693038/12_%20RREODez2025%20(REPUBL_).pdf` | 01:26:08Z | 200, `Last-Modified: Fri, 17 Jul 2026 19:40:58 GMT` | extração em `uniao\tmp_pdf\` [uniao-rec] |
| E38 | PDF do RREO de ago/2026: `https://cdn.tesouro.gov.br/sistemas-internos/apex/producao/sistemas/thot/arquivos/publicacoes/55944_1800407/08_RREOAgo2026%20-%20Com%20Portaria%20Publicada.pdf` | 01:27:45Z | 200, `Last-Modified: Wed, 30 Sep 2026 17:17:48 GMT` | `uniao\tmp_pdf\` [uniao] |

**Cobertura (União, 26 estados e DF)**

| ID | Requisição | Coleta | Resultado | Arquivo / relatório |
|---|---|---|---|---|
| E40 | `{BASE}rreo?an_exercicio=2026&nr_periodo=4&co_tipo_demonstrativo=RREO&no_anexo=RREO-Anexo%2001&co_esfera=U&id_ente=1` | 01:23:10Z | 200, 834 itens | `cobertura\rreo_2026_b4_a01_uniao.json` [cobertura] |
| E41 | o mesmo de E40 com `co_esfera=E&id_ente=35` (SP) | 01:23:22Z | 200, 703 itens | `cobertura\rreo_2026_b4_a01_SP.json` |
| E42 | o mesmo de E41 para `an_exercicio=2025&nr_periodo=6` | 01:24:14Z | 200, 707 itens | `cobertura\rreo_2025_b6_a01_SP.json` |
| E43 | `{BASE}extrato_entregas?id_ente={11 … 53}&an_referencia=2026` (27 consultas) | 01:21:22Z a 01:22:16Z | 200 em todas | `cobertura\extrato_2026\` |
| E44 | `{BASE}extrato_entregas?id_ente=11` (sem `an_referencia`) | 01:20:54Z | 200, 0 itens | `cobertura\extrato_RO_sem_ano.json` |
| E45 | `{BASE}extrato_entregas?id_ente={35, 33, 53}&an_referencia=2025` | 01:23:51Z a 01:23:54Z | 200 | `cobertura\extrato_2025\` |

**Estado do Rio de Janeiro (`id_ente=33`)**

| ID | Requisição | Coleta | Resultado | Arquivo / relatório |
|---|---|---|---|---|
| E50 | `{BASE}extrato_entregas?id_ente=33&an_referencia=2025` | 01:21:32Z | 200, 103 itens | `rj\extrato_2025.json` [rj] |
| E51 | `{BASE}extrato_entregas?id_ente=33&an_referencia=2026` | 01:21:51Z | 200, 63 itens, 18361 bytes | `rj\extrato_2026.json` |
| E52 | `{BASE}rreo?an_exercicio=2025&nr_periodo=6&co_tipo_demonstrativo=RREO&id_ente=33` | 01:22:05Z | 200, 4682 itens, 1783591 bytes | `rj\rreo_2025_p6_all_page1.json` |
| E53 | `{BASE}rreo?an_exercicio=2025&nr_periodo=5&co_tipo_demonstrativo=RREO&no_anexo=RREO-Anexo%2001&id_ente=33` | 01:23:35Z | 200, 658 itens | `rj\rreo_2025_p5_anexo01.json` |
| E54 | `{BASE}rreo?an_exercicio=2026&nr_periodo=4&co_tipo_demonstrativo=RREO&id_ente=33` | 01:23:46Z | 200, 3711 itens | `rj\rreo_2026_p4_all.json` |
| E55 | `{BASE}rreo?an_exercicio=2026&nr_periodo=5&co_tipo_demonstrativo=RREO&no_anexo=RREO-Anexo%2001&id_ente=33` | 01:26:16Z | 200, `items` vazio, `count` 0 | `rj\rreo_2026_p5_anexo01_vazio.json` |
| E56 | `https://apidatalake.tesouro.gov.br/ords/siconfi/tt/extrato_entregas?id_ente=33&an_referencia=2026` (**caminho legado**) | 01:26:23Z | 200, 63 itens, 18361 bytes, **bytes idênticos aos de E51** | `rj\extrato_2026_hostlegado.json` |
| E57 | `{BASE}rreo?an_exercicio=2023&nr_periodo=6&co_tipo_demonstrativo=RREO&no_anexo=RREO-Anexo%2001&id_ente=33` | 01:41:16Z | 200, 677 itens | `reconciliacao-rj\siconfi_rreo_2023_p6_anexo01.json` [rj-rec] |
| E58 | `{BASE}extrato_entregas?id_ente=33&an_referencia=2023` | 01:41:18Z | 200, 103 itens | `reconciliacao-rj\siconfi_extrato_2023.json` |
| E59 | PDF da SEFAZ-RJ (Anexo 01, 6º bimestre de 2023), obtido pelo Wayback Machine: `https://web.archive.org/web/20250118032313id_/https://portal.fazenda.rj.gov.br/contabilidade/wp-content/uploads/sites/25/2024/01/Anexo-01_6oBim_RREO_-2023_MDF-13aEd..pdf` | 01:40:18Z | 200, sha256 `d9965a65039a4d4d72efe8795a4e0689d7cd95369984101998b8fd9a97e3d271` | `reconciliacao-rj\` [rj-rec] |

**Revisão crítica (todas com `co_tipo_demonstrativo=RREO&no_anexo=RREO-Anexo%2001`, exceto E63 e E68)**

| ID | Requisição | Coleta | Resultado | Arquivo |
|---|---|---|---|---|
| E60 | `{BASE}rreo?an_exercicio=2026&nr_periodo=4&…&id_ente=53` (DF) | 01:48:57Z | 200, 614 itens, 216466 bytes, 1,22 s | `revisao\rreo_53_2026_b4_a01.json` [critica] |
| E61 | o mesmo com `id_ente=31` (MG) | 01:49:16Z | 200, 673 itens, 242391 bytes, 1,14 s | `revisao\rreo_31_2026_b4_a01.json` |
| E62 | `an_exercicio=2015&nr_periodo=6`, `id_ente=33` | 01:49:26Z | 200, 636 itens, 1,12 s | `revisao\rreo_33_2015_b6_a01.json` |
| E63 | `{BASE}dca?an_exercicio=2025&no_anexo=DCA-Anexo%20I-E&id_ente=33` | 01:49:53Z | 200, 579 itens, 0,94 s | `revisao\dca_33_2025_IE.json` |
| E64 | `an_exercicio=2018&nr_periodo=6`, `id_ente=33` | 01:50:23Z | 200, 692 itens, 1,57 s | `revisao\rreo_33_2018_b6_a01.json` |
| E65 | `an_exercicio=2021&nr_periodo=6`, `id_ente=33` | 01:50:38Z | 200, 673 itens, 1,15 s | `revisao\rreo_33_2021_b6_a01.json` |
| E66 | `an_exercicio=2019&nr_periodo=6`, `id_ente=33` | 01:50:49Z | 200, 696 itens, 1,06 s | `revisao\rreo_33_2019_b6_a01.json` |
| E67 | `an_exercicio=2020&nr_periodo=6`, `id_ente=33` | 01:50:59Z | 200, 652 itens, 1,12 s | `revisao\rreo_33_2020_b6_a01.json` |
| E68 | `{BASE}dca?an_exercicio=2025&no_anexo=DCA-Anexo%20I-E&id_ente=1` | 01:51:19Z | 200, 834 itens, 1,24 s | `revisao\dca_1_2025_IE.json` |
| E69 | `an_exercicio=2019&nr_periodo=6`, `id_ente=1` | 01:51:31Z | 200, 878 itens, 301749 bytes, 1,67 s | `revisao\rreo_1_2019_b6_a01.json` |

Algumas contagens citadas adiante (duplicatas de chave, valores inteiros, itens por coluna, presença de colunas, siglas de UF em `/entes`, códigos do extrato) foram recalculadas durante a redação e a revisão deste documento, a partir dessas amostras brutas, com leitura dos números como texto (`parse_float=str`). As definições do spec citadas como **Documentado (E03)** foram lidas na cópia salva de E03 (`docs\siconfi.yaml`). Nenhuma requisição nova foi feita à fonte.

### 1.1 Identificação

| Item | Valor | Evidência |
|---|---|---|
| Publicador | Secretaria do Tesouro Nacional (STN), página "Siconfi - API de Dados Abertos" no Tesouro Transparente | E01 |
| Host | `apidatalake.tesouro.gov.br`. Todas as chamadas à API foram feitas por https. Por `http://`, só `/docs/siconfi/` foi testado e devolveu 307 para `https://`; as rotas `/ords` por http não foram testadas | E02, E03 |
| Base path documentado | `/ords/cdwhprd/siconfi/tt/`. Vem embutido no campo `host` do spec (`apidatalake.tesouro.gov.br/ords/cdwhprd/siconfi/tt/`); os campos `schemes` e `basePath` estão comentados | E03 [docs] |
| Base path legado (não documentado) | `/ords/siconfi/tt/`. Respondeu 200 com bytes idênticos aos do caminho documentado | E56 × E51 |
| Contrato | Swagger 2.0, `info.version` `1.1.0`, descrito como "versão beta". Define 9 paths: `/rreo`, `/rgf`, `/dca`, `/msc_patrimonial`, `/msc_orcamentaria`, `/msc_controle`, `/entes`, `/extrato_entregas` e `/anexos-relatorios`. Licença Apache 2.0 | E03 |
| Cabeçalhos do contrato | `ETag: "80534262"`, `Last-Modified: Wed, 24 Jun 2026 14:31:16 GMT`, `Cache-Control: public, must-revalidate, max-age=30`, `Content-Type: application/octet-stream`, 44465 bytes | E03 (`siconfi.yaml.headers`) |
| ETag e Last-Modified nas respostas de dados | As respostas JSON trazem `ETag` (em E13: `"nNqFuqqL2CSQjDMpJX5IYnGG+nJYiEEDEpHIxiWS/qh2sLzl/8fJWCAgq9qZZ2mB0ytDOYwVO5eJC8TBf3+glw=="`) e aceitam `If-None-Match`, que devolveu 304 em E20. Não trazem `Last-Modified` nem `Cache-Control` | cabeçalhos de E04, E12, E13, E36 |
| Documentação interativa | Swagger UI em `https://apidatalake.tesouro.gov.br/docs/siconfi/`, com `supportedSubmitMethods: ['get']`. O endereço `http://` devolve 307 para `https://` | E02 |
| Autenticação | Nenhuma: sem chave, sem cadastro, sem captcha. **Documentado** na página de entrada e confirmado em todas as chamadas | E01 |
| Infraestrutura | CDN Azure Front Door na frente (cabeçalhos `x-azure-ref`, `X-Cache`, `X-Cache-Info`) e Oracle REST Data Services (ORDS) na origem. Os erros têm `type` `tag:oracle.com,2020:error/...` e os links apontam para o host interno `host-5hrds-scan.prosubnet.vcndados.oraclevcn.com` | E13, E14, E05 |
| Suporte | **Documentado:** a STN não dá suporte técnico sobre a tecnologia da API, e as dúvidas vão para o E-Serviços (`https://e-servicos.tesouro.gov.br/#/Servico/1379821`, não acessado) | E03 |
| Documentação complementar | O link "Veja mais" das tags RREO e RGF (`http://www.tesouro.fazenda.gov.br/mdf`) não resolve no DNS. O link das tags Anexos, Entes e Extrato leva a uma notícia de 1/11/2017 sobre a taxonomia XBRL. Nenhuma outra documentação oficial da API foi encontrada além do spec e da página de entrada (ausência na busca feita, não prova de inexistência) | E27 [docs] |

O PortalDash aceita apenas `https://apidatalake.tesouro.gov.br` com o base path documentado (decisão de arquitetura). O caminho legado fica fora da allowlist. A recomendação de [docs] e [critica] é monitorar o ETag do `siconfi.yaml` como sinal de mudança no contrato. Uma mudança de ETag avisa que algo mudou, mas não diz o quê.

### 1.2 Etiqueta de uso e limites

- **Documentado:** "ATENÇÃO: Para fins de performance, o limite é de uma (01) requisição por segundo." [E03]. A página de entrada pede que se obedeçam "às orientações de uso para evitar o bloqueio do serviço" [E01], sem dizer como é o bloqueio (duração ou código HTTP).
- **Documentado:** "por padrão, as consultas retornam 5.000 itens por página" [E01]; no spec, "Por padrão nossas consultas retornam 5.000 itens por página" [E03]. Em `/entes` o padrão observado é 6000 (seção 1.4).
- Não foram observados HTTP 429 nem cabeçalhos `X-RateLimit-*` ou `Retry-After` [docs].
- **Atualização de 2026-10-02 (ingestão completa):** com chamadas sequenciais a 1,1 s, 81 de 407 respostas foram HTTP 429 vindas da CDN (`X-Cache: CONFIG_NOCACHE`), sem `Retry-After`. O limite efetivo é mais restritivo que o documentado. Evidência e números em `docs/validacao-fonte-siconfi-2026-10.md`, seção 17.2, e `docs/evidencias/2026-10-02-ingestao-completa/requisicoes.csv`.
- **Houve um 502 durante acesso concorrente.** Em E07 (01:19:22Z), `/anexos-relatorios` devolveu uma página HTML com título "Service unavailable", o texto "Our services aren't available right now." e o errorref `20261002T011924Z-167767458dd25zpvhC1RIO08ng000000056g000000004e3t`. Um segundo antes (01:19:21Z), outra chamada à mesma rota começou e ficou 120 s sem resposta (E08). Uma terceira, iniciada às 01:20:24Z, enquanto E08 ainda aguardava, recebeu 200 só depois de 69,26 s (E09). [critica] diz que E09 foi "nesse mesmo minuto"; o log de [docs] e o `x-azure-ref` de E09 (`20261002T012026Z-…`) mostram que ela começou cerca de 1 min depois de E07.
- **A própria Etapa 1 descumpriu a etiqueta no agregado.** Cada agente fez chamadas sequenciais, mas os agentes rodaram em paralelo. Somando os logs, foram 98 requisições ao host entre 01:18Z e 01:41Z, 25 delas no minuto 01:21, e houve 8 segundos com 2 requisições simultâneas (por exemplo 01:21:32Z, 01:21:47Z, 01:22:05Z e 01:23:46Z) [critica].
- **Inferência:** o 502 e o timeout coincidiram com chamadas sobrepostas à rota mais lenta (E07 e E08 com 1 s de diferença; E09 iniciada enquanto E08 aguardava). A relação de causa não foi demonstrada.
- **Regra do PortalDash (implementada, `src/server/integrations/siconfi/`):** chamadas sequenciais de um único cliente, intervalo mínimo de 1,5 s entre requisições e `pg_advisory_lock` impedindo execuções simultâneas. Retentativas: no máximo 3, com backoff, para erro de rede, timeout, 5xx e 429. Ao receber 429, o intervalo dobra (até 6 s) pelo resto da execução e a próxima tentativa espera o `Retry-After`, se houver, ou 10 s × tentativa. Se as tentativas se esgotarem, a coleta daquela declaração falha e o último snapshot ativo é mantido. (A decisão inicial era 1,1 s sem retentar 429; foi endurecida depois da evidência de 2026-10-02.)
- **Volume esperado (inferência aritmética):** uma requisição ao `/rreo` por ente, exercício e bimestre, mais uma ao `/extrato_entregas` por ente e exercício. Para a ingestão-piloto (2026 b1 a b4 e 2025 b1 a b6, 28 entes), [critica] estima cerca de 280 requisições ao `/rreo`, ou cerca de 6 min a ≥1,1 s, sem contar o tempo de resposta.

### 1.3 Endpoints usados pelo PortalDash

| Endpoint | Para quê | Granularidade de uma consulta |
|---|---|---|
| `/rreo` | Células do RREO-Anexo 01 (Balanço Orçamentário) | 1 ente × 1 exercício × 1 bimestre × 1 anexo |
| `/extrato_entregas` | Status (HO/RE) e data do status de cada RREO entregue | 1 ente × 1 exercício |
| `/entes` | Cadastro: código IBGE, nome e esfera | todos os entes numa página |

#### 1.3.1 `/rreo`

| Parâmetro | O que o spec diz | Valores válidos | Comportamento observado | Uso no PortalDash |
|---|---|---|---|---|
| `an_exercicio` | obrigatório, inteiro (int64) | inteiro | `abc` gera 400 problem+json (E14) | ano pedido |
| `nr_periodo` | obrigatório, enum de 1 a 6 (bimestre) | `1` a `6` | `7` devolve 200 com `items` vazio, sem erro (E15) | validado localmente de 1 a 6 |
| `co_tipo_demonstrativo` | obrigatório | `RREO` ou `RREO Simplificado`; o segundo tem espaço e vai codificado (`RREO%20Simplificado`) | Simplificado sem `id_ente` devolveu vazio (E16). Nenhum Simplificado foi observado | `RREO` fixo. Nas 112 linhas de RREO de 2026 dos 28 entes, `tipo_relatorio` é `P` [critica] |
| `no_anexo` | opcional | enum do spec, de `RREO-Anexo 01` a `RREO-Anexo 14` (lista completa em [docs]). Codificar o espaço: `RREO-Anexo%2001` | Sem ele, vêm todos os anexos (E32, E52). Nos links, o ORDS reescreve o valor como `RREO-Anexo+01` (E15) | `RREO-Anexo 01` fixo |
| `id_ente` | obrigatório | código IBGE: `1` (União), 2 dígitos (UF e DF) ou 7 dígitos (município) | ausente: 200 com `items` vazio (E16, E17) | allowlist de 28 entes (seção 1.17) |
| `co_esfera` | `required: false`, embora a descrição diga "Apenas o parâmetro no_anexo é opcional" [critica] | `M`, `E`, `U`, `C` | Sem `id_ente`, não traz nada (E17), ou seja, não serve para buscar vários entes de uma vez. Consultas sem `co_esfera` funcionam (E13, E36, E60) | não é enviado |
| `limit`, `offset` | ausentes do spec | inteiros. O `limit` padrão observado é `5000` | aceitos (E18, E19) | `offset` montado localmente (seção 1.4) |

**Campos de cada item** (15, iguais nos dois casos comparados, União e SP [cobertura]): `exercicio`, `demonstrativo`, `periodo`, `periodicidade`, `instituicao`, `cod_ibge`, `uf`, `populacao`, `anexo`, `esfera` (fora do schema do spec), `rotulo`, `coluna`, `cod_conta`, `conta`, `valor`. Cada item é uma célula do quadro publicado. Exemplo real, a célula do indicador para MG em 2026 b4 (E61):

```json
{"exercicio":2026,"demonstrativo":"RREO","periodo":4,"periodicidade":"B","instituicao":"Governo do Estado de Minas Gerais","cod_ibge":31,"uf":"MG","populacao":20732660,"anexo":"RREO-Anexo 01","esfera":"E","rotulo":"Padrão","coluna":"DESPESAS PAGAS ATÉ O BIMESTRE (j)","cod_conta":"DespesasExcetoIntraOrcamentarias","conta":"DESPESAS (EXCETO INTRA-ORÇAMENTÁRIAS) (VIII)","valor":76054500238.07}
```

- Nas amostras, `demonstrativo` é sempre `RREO`, `periodicidade` é sempre `B` e, no Anexo 01, `rotulo` é sempre `Padrão` [uniao, rj].
- O `/rreo` não tem campo de versão, data de entrega, status ou retificação [uniao, rj]. Cada consulta devolve só a versão que a API está servindo naquele momento.
- **Volume do Anexo 01 por consulta:** de 614 itens (DF 2026 b4, E60) a 878 (União 2019 b6, E69). União 2026 b4: 834 (E40). SP 2026 b4: 703 (E41). MG 2026 b4: 673 (E61). Estado do RJ 2023 b6: 677 (E57).
- **Período ainda não entregue:** o RJ 2026 b5 devolveu 200 com `items` vazio e `count` 0 (E55). O extrato do mesmo momento não tinha o b5 [rj].

#### 1.3.2 `/extrato_entregas`

| Parâmetro | O que o spec diz | Comportamento observado |
|---|---|---|
| `id_ente` | obrigatório, código IBGE | Brasília (`5300108`) devolveu 0 itens em 2025 (E24). O DF (`53`) devolveu 71 (E25) |
| `an_referencia` | obrigatório, exercício | ausente: 200 com 0 itens (E44) |

Campos (11): `exercicio`, `cod_ibge`, `populacao`, `instituicao`, `entregavel`, `periodo`, `periodicidade`, `status_relatorio`, `data_status`, `forma_envio`, `tipo_relatorio`. Exemplo real, o RREO do estado do RJ em 2026 b4 (E51):

```json
{"exercicio":2026,"cod_ibge":33,"populacao":16615526,"instituicao":"Governo do Estado do Rio de Janeiro","entregavel":"Relatório Resumido de Execução Orçamentária","periodo":4,"periodicidade":"B","status_relatorio":"HO","data_status":"2026-09-30T22:36:35Z","forma_envio":"M","tipo_relatorio":"P"}
```

- `entregavel`: valores observados `Relatório Resumido de Execução Orçamentária`, `Relatório de Gestão Fiscal`, `Balanço Anual (DCA)`, `MSC Agregada` e `MSC Encerramento` [docs].
- `status_relatorio`: `HO` (homologado) ou `RE` (retificado). Vem `null` nas linhas de MSC [docs].
- `tipo_relatorio`: `P` em todas as linhas de RREO observadas (112 de 112 em 2026 [critica]). Vem `null` nas linhas de MSC. **Documentado (E03, definição `Extrato`):** "Indica a opção de entrega do RREO e RGF para municípios com menos de 50 mil habitantes, onde P = padrão e S = simplificado". Nenhum `S` foi observado.
- `forma_envio`: valores observados `P`, `I`, `M`, `F` e `CSV` [docs]; na recontagem de todas as amostras de extrato aparece também `XML`, só em linhas de MSC (por exemplo E43). **Documentado (E03, definição `Extrato`):** "Para relatórios: P = relatório enviado em formato de planilha, I = relatório enviado em formato  de instância XML, M = relatório gerado a partir da matriz, F = relatório preenchido em formulário web. Para matrizes: CSV = matriz entregue em formato CSV, XML = matriz entregue em formato XML". A leitura de [uniao, rj] (`P` planilha, `M` gerado a partir da matriz) bate com o spec.
- Há uma linha por entregável, período e instituição. RGF e MSC têm uma linha por órgão (72 instituições na MSC da União [cobertura]). No RREO observou-se uma linha por período, da instituição de governo: `Governo Federal` (E30, E31) e `Governo do Estado do Rio de Janeiro` (E51).
- Tamanho: o extrato de 2025 da União tem 1157 itens e 313327 bytes (E30). Cabe numa página, mas o laço de paginação é obrigatório mesmo assim.
- Semântica de datas, retificações e falta de histórico: seção 1.14.

#### 1.3.3 `/entes`

- O spec não documenta parâmetros, mas `limit` e `offset` funcionam (E05, E06).
- Devolveu 5598 itens numa página, com `"limit":6000`, `"count":5598` e `"hasMore":false` (E04). Por esfera: `M` 5570, `E` 26, `U` 1 e `D` 1 [docs, rj].
- Registros reais (E04):

```json
{"cod_ibge":1,"ente":"União","capital":"0  ","regiao":"BR","uf":null,"esfera":"U","exercicio":2026,"populacao":8569324,"cnpj":"00394411000109"}
{"cod_ibge":53,"ente":"Distrito Federal","capital":"0  ","regiao":"CO","uf":"BR","esfera":"D","exercicio":2026,"populacao":2923369,"cnpj":"00394601000126"}
```

- Brasília (`5300108`) aparece como município (`esfera` `M`, `uf` `DF`, `capital` `1  `). As entregas do DF estão no código `53` (E24, E25).
- Homônimos: o município do Rio de Janeiro (`3304557`) e o estado (`33`) têm o mesmo `ente`, `Rio de Janeiro` [rj]. A identificação tem de usar `cod_ibge`.
- `exercicio` vale `2026` em todos os itens [docs]. **Documentado (E03):** o spec descreve o campo (com o nome `an_exercicio`) como "Ano de referência dos dados populacionais". **Inferência:** é o cadastro atual, não o de cada ano.
- Uso no PortalDash: nome e esfera do ente, para conferir a allowlist. `uf`, `regiao`, `populacao` e `capital` não servem como chave nem como dado (seção 1.15).

#### 1.3.4 Endpoints que o PortalDash não usa

`/rgf`, `/dca`, `/msc_patrimonial`, `/msc_orcamentaria`, `/msc_controle` e `/anexos-relatorios` ficam fora do escopo atual. Fatos sobre eles aparecem neste documento só quando ajudam a entender a fonte. Por exemplo, `/anexos-relatorios` é a rota mais lenta (E09) e rotula os anexos de RREO como `QDCC` [docs]. A DCA tem um "exceto intraorçamentárias" de escopo diferente do RREO (seção 1.11).

### 1.4 Envelope ORDS e paginação

Toda resposta 200 vem no envelope ORDS [docs]:

```json
{"items":[…],"hasMore":false,"limit":5000,"offset":0,"count":661,"links":[…]}
```

- `count` é o número de itens **desta página**. Não existe campo com o total.
- O `limit` padrão é `5000` em `/rreo`, `/extrato_entregas` e `/anexos-relatorios`, e `6000` em `/entes` (E04). Um `limit=10000` foi aceito e ecoado (E06). O teto não foi determinado (**lacuna**).
- **Os `links` são inutilizáveis.** `self`, `describedby`, `first`, `next` e `prev` apontam para o host interno `https://host-5hrds-scan.prosubnet.vcndados.oraclevcn.com/ords/...`. Além disso, o `self` às vezes omite `limit` e `offset`: em E05 a requisição foi `entes?limit=3&offset=10`, o `self` veio como `…/tt/entes` e o `next` como `…/tt/entes?offset=13&limit=3`.
- **Algoritmo (recomendação de [docs] e [critica], coerente com a decisão de host fixo em allowlist):** começar com `offset=0` e, enquanto `hasMore` for `true`, somar `count` ao `offset`. A URL seguinte é montada localmente a partir da base fixa e dos parâmetros da allowlist. Os `links` nunca são seguidos: apontam para um host interno, fora da allowlist, e segui-los abriria uma porta para SSRF.
- O `offset` funciona no host público. A União 2025 b6 sem filtro de anexo veio em duas páginas, com 5000 e 1893 itens, total de 6893 (E32, E33). No RJ, `offset=1500` com `limit=2` trouxe `next` com `offset=1502` (E19), e `offset=4998` trouxe `count` 0 (E18).
- Não há parâmetro de ordenação nem garantia documentada de ordem estável entre páginas. **Inferência:** se os dados mudarem entre duas páginas, a paginação por offset pode repetir ou pular linhas. [docs] recomenda deduplicar pela chave natural, e [critica] recomenda falhar de forma explícita se a chave se repetir (seção 1.13). Uma chave repetida indica que os dados mudaram durante a paginação, e nesse caso outra linha pode ter sido pulada sem deixar rastro na chave. Por isso, a regra mais segura é tratar repetição como snapshot inválido, e não deduplicar em silêncio (**recomendação deste documento**, a confirmar na implementação).
- Na consulta do Anexo 01, o maior volume observado foi de 878 itens (E69), que cabem numa página. O laço continua obrigatório. **Recomendação:** pôr um limite de páginas por consulta e tratar `hasMore` true com `count` 0 como erro, para não entrar em laço infinito.

### 1.5 Erros e respostas vazias

| Situação | HTTP | Content-Type | Corpo | Evidência | Tratamento no PortalDash |
|---|---|---|---|---|---|
| Parâmetro com tipo inválido | 400 | `application/problem+json` | `code`, `title`, `message`, `type`, `instance` | E14 | sem retentativa; erro de validação local |
| Rota inexistente | 404 | `application/problem+json` | `code`, `message`, `type`, `instance` (sem `title`) | E21, E22 | sem retentativa |
| Parâmetro fora do enum (`nr_periodo=7`) | 200 | `application/json` | `items` vazio | E15 | evitar com validação local |
| `id_ente` ou `an_referencia` ausente | 200 | `application/json` | `items` vazio | E16, E17, E44 | evitar com validação local |
| Período ainda não entregue | 200 | `application/json` | `items` vazio | E55 | "sem dado", nunca zero |
| Ente sem entregas no ano | 200 | `application/json` | `items` vazio | E24 | "sem dado" |
| Indisponibilidade | 502 | **HTML**, não JSON | página "Service unavailable" | E07 | retentativa (5xx) |
| Origem lenta | — | — | nenhum byte em 120 s | E08, E11 | timeout, depois retentativa |

Corpo real do 400 (E14):

```json
{
    "code": "BadRequest",
    "title": "Bad Request",
    "message": "Invalid value provided for parameter an_exercicio. The detailed error message: Character a is neither a decimal digit number, decimal point, nor \"e\" notation exponential mark..",
    "type": "tag:oracle.com,2020:error/BadRequest",
    "instance": "tag:oracle.com,2020:ecid/Ro0p8AGdFiXGzl8yoM4n9g"
}
```

- O campo `instance` (ecid) identifica a requisição no ORDS. Vale registrá-lo para eventuais pedidos de suporte [docs].
- Uma resposta vazia não é erro nem zero. O 200 com `items` vazio aparece tanto para parâmetro inválido quanto para dado inexistente. Por isso [docs] recomenda validar os parâmetros localmente e cruzar com o extrato antes de concluir que não há dado.
- Os 5xx podem chegar como HTML. O cliente não pode supor JSON fora do 200 nem fazer parse do corpo sem antes conferir o `Content-Type`.
- **Lacuna:** 429, 500, 503 e 504 não foram observados, e o formato desses casos é desconhecido.

### 1.6 Timeouts, latência e tamanhos observados

As medições vêm do curl em Windows/Git Bash, numa única máquina e numa única noite [docs, critica]. **Lacuna:** a latência a partir do Railway não foi medida.

| Consulta | Tempo | Tamanho | Cache | Evidência |
|---|---|---|---|---|
| `/rreo`, Anexo 01, município do Rio 2025 b6 | 1,09 s (TTFB 1,03 s) | 247524 bytes, 661 itens | `TCP_MISS` | E13 |
| `/rreo`, Anexo 01, estados e União (revisão) | 1,06 a 1,67 s | 216466 a 301749 bytes | — | E60 a E69, exceto E63 e E68 (DCA) |
| `/rreo` com `limit` pequeno e itens (`limit=2`) | 0,35 a 0,37 s | 1633 a 1760 bytes | — | E19, E26 |
| `/rgf`, `/dca`, `/msc_orcamentaria` com `limit` pequeno | 0,53 a 0,64 s | 1676 a 1971 bytes | — | log de [docs] |
| `/rreo` sem filtro de anexo, página cheia | — | 1804908 bytes para 5000 itens | — | E32 |
| GET condicional (304) | 0,19 s | 0 | `TCP_REMOTE_HIT` | E20 |
| `/extrato_entregas` (municípios e DF, com itens) | 0,19 a 0,73 s | 10365 a 19918 bytes | — | E23, E25 e demais extratos de [docs] |
| `/extrato_entregas` da União, 2025 | — | 313327 bytes, 1157 itens | — | E30 |
| `/entes` | 0,36 s | 866510 bytes | `TCP_REMOTE_HIT` | E04 |
| `/anexos-relatorios` | **69,26 s** sem cache; 0,22 s com cache; sem bytes em 120 s com gzip | 10809 bytes | `TCP_MISS` / `TCP_REMOTE_HIT` | E09, E10, E11 |
| Erros 400 e 404 | 0,32 a 0,55 s | 171 a 372 bytes | — | E14, E21, E22 |
| Páginas vazias | 0,33 a 0,45 s | cerca de 520 a 772 bytes | — | E15 a E18, E24 |

- **Timeouts (decisão):** 60 s para consultas de dados e 180 s para metadados. Base observada: as consultas de dados levaram até 1,67 s; a rota de metadados sem cache levou 69,26 s e teve uma chamada que passou de 120 s.
- **Lacuna:** o tempo de `/entes` sem cache é desconhecido. A chamada de E04 já pegou o cache (`TCP_REMOTE_HIT`), porque outros agentes tinham pedido a mesma rota às 01:19:07Z e 01:19:09Z [uniao, rj], e a duração dessas chamadas não foi registrada.
- **Tamanho:** as respostas JSON vêm com `Transfer-Encoding: chunked` e sem `Content-Length` (cabeçalhos de E13). O limite de tamanho de corpo (decisão) tem de ser aplicado durante a leitura do stream. Uma página cheia de RREO tem cerca de 1,8 MB (E32), e o Anexo 01 isolado fica abaixo de 0,31 MB (E69). O limite precisa comportar esses tamanhos com folga.
- **Relógios:** o relógio local e o `Date` do apidatalake diferiam em cerca de 3 s (local 01:19:43Z contra `Date: Fri, 02 Oct 2026 01:19:46 GMT`) [docs]. O `Date` da página do Tesouro Transparente veio de cache, cerca de 5,5 h atrasado (`Thu, 01 Oct 2026 19:48:01 GMT`, `X-Varnish-Age: 19846`) [docs]. A hora de coleta vem sempre do relógio próprio, em UTC.

### 1.7 Transporte: compressão, cache, encoding e TLS

- **Compressão:** o servidor não comprime. Com `Accept-Encoding: gzip`, a resposta veio identity (E12). A variante gzip de `/anexos-relatorios` ficou 120 s sem bytes (E11). **Hipótese** (fraca, segundo [critica]): a variante gzip teria outra chave de cache no CDN e cairia na origem lenta. Decisão: enviar `Accept-Encoding: identity`. [docs] observa que clientes como fetch/undici mandam `Accept-Encoding` por padrão, então o cabeçalho precisa ser explícito.
- **Protocolo:** HTTP/1.1. O suporte a h2 não foi verificado [docs].
- **Cache do CDN:** os valores observados de `X-Cache` foram `TCP_MISS` (E13, E21, E36), `TCP_REMOTE_HIT` (E04, E10, E12, E20, E25) e `TCP_REVALIDATED_HIT` (E03). `X-Cache-Info` só apareceu nas respostas servidas do cache: `L2_T2` nas da API (E04, E10, E12, E20, E25) e `L1_T2` no `siconfi.yaml` (E03); as respostas `TCP_MISS` não trazem esse cabeçalho. Sem `Cache-Control` nas respostas JSON, o TTL é desconhecido. **Lacuna:** não se sabe quanto tempo um dado retificado leva para aparecer atrás do CDN. Decisão: guardar `ETag` e `X-Cache` de cada resposta bruta.
- **Requisição condicional:** `If-None-Match` funciona e devolve 304 (E20). É uma forma possível de economizar requisições em recoletas.
- **Encoding:** `Content-Type: application/json` sem charset. Os bytes são UTF-8 e há acentos em `coluna`, `conta`, `instituicao` e `ente` (por exemplo `DESPESAS PAGAS ATÉ O BIMESTRE (j)`). O corpo deve ser decodificado explicitamente como UTF-8.
- **Espaços e caracteres estranhos:** `capital` vem com espaços à direita (`0  `, `1  `) (E04). Há caracteres corrompidos na própria fonte, como `(IV ¿ V)` no Anexo 04 do RJ [rj], um anexo que o PortalDash não usa.
- **Codificação dos parâmetros:** `RREO-Anexo%2001` e `RREO%20Simplificado` (E13, E16).
- **TLS:** o certificado tem CN `apidatalake.tesouro.gov.br`, emissor GeoTrust TLS RSA CA G1 (DigiCert) e validade de 2026-06-22 a 2026-12-22 [docs]. Como a validade é de 6 meses, não se deve fixar o certificado (pinning). Nas rotas `/ords`, o HSTS é `max-age=31536000;includeSubDomains`. Por https, nenhuma rota da API redirecionou; o único redirect observado foi `http://` para `https://` em `/docs` (E02). Decisão: tratar redirect como erro.
- **CORS:** não testado. Não importa para o PortalDash, porque o navegador nunca consulta a fonte diretamente.

### 1.8 Formato numérico

- `valor` vem como **número JSON, não string**, por exemplo `"valor":5054245956518.39` (E36) e `"valor":76054500238.07` (E61). O spec declara `type: integer, format: float` [cobertura], o que não descreve o dado real.
- **Formas observadas:**

| Forma | Exemplo exato | Evidência |
|---|---|---|
| Inteiro, sem casas | `39754264807`; `2198252453508` | E13; E69 |
| Uma casa (zero à direita suprimido) | `111309173975.1`; `85194032709.7` | E52; E61 |
| Duas casas | `35863674442.81` | E13 |
| Negativo | `-442945342.36` | E13 [docs] |
| Percentual no mesmo campo | `18.42` (coluna `% (b/a)`) | E52 |
| Até 13 dígitos na parte inteira | `5054245956518.39`; `2198252453508` | E36; E69 |

- Não houve notação exponencial nem `valor` nulo nas amostras de RREO [docs, cobertura]. Nos 18 conjuntos de Anexo 01 recontados (16 respostas filtradas por anexo, E13, E34, E36, E40 a E42, E53, E57, E60 a E62 e E64 a E67, E69, mais o Anexo 01 extraído de E52 e de E54; 2015 a 2026: União, SP, RJ, MG, DF e município do Rio), nenhum `valor` veio `null`.
- **A precisão varia por ano e por ente.** No RJ 2019 b6, 577 dos 696 valores são inteiros, sem centavos (E66). Na União 2019 b6, são 587 de 878, e o total pago `2198252453508` também é inteiro (E69) [critica]. Na recontagem, todas as células da coluna (j) desses dois casos são inteiras (25 de 25 no RJ; 30 de 30 na União). No RJ 2018 b6, 408 dos 692 valores são inteiros, mas nenhum na coluna (j) (0 de 24; E64). Nos demais conjuntos recontados, a proporção fica entre 109 de 674 e 207 de 703. **Inferência:** os entes informaram esses valores sem centavos; não é perda introduzida pela API, mas isso não pode ser verificado.
- **Unidade:** R$ 1,00, em valores nominais. A API não declara a unidade; ela foi confirmada pela reconciliação. O PDF do estado do RJ, em R$ 1,00, bateu ao centavo [rj-rec], e os PDFs da União, em R$ mil, bateram depois de dividir por 1000 e arredondar [uniao-rec].
- **Requisitos para a ingestão:**
  - Ler o token numérico como texto, antes de qualquer conversão. O `JSON.parse` padrão converte para float de 64 bits [versions] e perde centavos em valores na casa dos trilhões.
  - Gravar `valor_texto`, com o texto exato do token, e também `NUMERIC`. Nunca usar float.
  - A validação de formato precisa aceitar pelo menos 13 dígitos na parte inteira, além do sinal negativo. A regex sugerida em [versions] (`^-?\d{1,12}(\.\d{1,2})?$`) rejeitaria valores reais da União, como `5054245956518.39`.
  - `111309173975.1` e `111309173975.10` são o mesmo número. A comparação entre coletas deve ser numérica; a diferença textual pode ser só de formato (**inferência**). A forma canônica usada no hash do snapshot precisa ser definida explicitamente na implementação.

### 1.9 Células ausentes

- **Uma célula sem valor não vem com `null`: o item simplesmente não existe.** Por isso o número de itens varia por coluna: de 16 a 66 no município do Rio 2025 b6 (E13), de 15 a 74 no RJ 2019 b6 (E66) e de 26 a 88 na União 2019 b6 (E69).
- Nenhum valor `0` foi observado no RREO do RJ [rj], nem nos 18 conjuntos de Anexo 01 recontados (seção 1.8). Na MSC, que o PortalDash não usa, há `null` explícito e zeros explícitos [docs].
- Colunas inteiras somem fora do 6º bimestre, como a (k) (seção 1.12).
- **O que falta no Siconfi pode existir na publicação.** No PDF da União 2025 b6, a "Reserva de Contingência" tem pagas iguais a 0, e o Siconfi não tem essa célula. A subconta intra "Demais Despesas Correntes" tem 1.227.470 mil pagos no PDF e não tem `cod_conta` próprio no Siconfi, que traz o mesmo valor só na linha-mãe `OutrasDespesasCorrentesIntra` (`1227470030.75`) [uniao-rec, critica]. No RJ 2023 b6, o PDF mostra SALDO (g) e SALDO (i) na linha "TOTAL COM SUPERÁVIT (XIV)", e o Siconfi não tem essas células [rj-rec].
- **Regra:** ausência significa "sem dado" e nunca zero. Se a célula do indicador faltar para um ente, exercício e bimestre, o recorte fica sem dado. Ausência também não significa "não existe na publicação oficial".

### 1.10 Colunas de percentual no mesmo campo

- O campo `valor` também guarda percentuais, sem nenhum campo de unidade. No Anexo 01, as colunas de receita `% (b/a)` e `% (c/a)` [docs]; por exemplo, RJ 2025 b6, `% (b/a)`, `ReceitasExcetoIntraOrcamentarias` = `18.42` (E52). No Anexo 02, `% (b/total b)` e `% (d/total d)` [rj, uniao].
- No Anexo 14 da União 2025 b6, a coluna `% Mínimo a Aplicar no Exercício` traz um valor em reais [uniao].
- No RJ 2023 b6, algumas células de percentual aparecem como `-` no PDF e com valor calculado no Siconfi [rj-rec].
- **Regra:** selecionar sempre pelo texto exato de `coluna`. Nunca somar ou agregar o campo `valor` sem filtrar a coluna.

### 1.11 Hierarquia de contas do Anexo 01 e armadilhas

A API não tem campo de pai, nível, ordem ou "é total" [uniao, rj]. A hierarquia é deduzida do `cod_conta`, da numeração romana e das fórmulas no texto de `conta` e de uma convenção visual (categorias e grupos em maiúsculas, subitens em caixa mista).

**Bloco de totais da despesa (a partir de 2020)**

| Linha | `cod_conta` | `conta` nos estados | `conta` na União | Relação |
|---|---|---|---|---|
| Despesas exceto intra | `DespesasExcetoIntraOrcamentarias` | `DESPESAS (EXCETO INTRA-ORÇAMENTÁRIAS) (VIII)` | `… (IX)` | = `DespesasCorrentes` + `DespesasDeCapital` |
| Despesas intra | `DespesasIntraOrcamentariasTotal` (repetida em `DespesasIntraOrcamentarias`) | `DESPESAS (INTRA-ORÇAMENTÁRIAS) (IX)` | `… (X)` | |
| Subtotal | `SubtotalDasDespesas` | `SUBTOTAL DAS DESPESAS (X) = (VIII + IX)` | `… (XI) = (IX + X)` | = exceto intra + intra |
| Refinanciamento | `AmortizacaoRefinanciamentoDaDivida` | `AMORTIZAÇÃO DA DÍVIDA / REFINANCIAMENTO (XI)` | `… (XII)` | só em alguns entes |
| Total | `TotalDespesas` | `TOTAL DAS DESPESAS (XII) = (X + XI)` | `… (XIII) = (XI + XII)` | = subtotal + refinanciamento |
| Superávit | `Superavit` | `SUPERÁVIT (XIII)` | `(XIV)` | **não é despesa** |
| Total com superávit | `TotalDespesasComSuperavit` | `TOTAL COM SUPERÁVIT (XIV) = (XII + XIII)` | `TOTAL COM SUPERÁVIT (XV) = (XIII + XIV)` | **não é despesa** |

Grupos, também verificados com Decimal: `DespesasCorrentes` = `PessoalEEncargosSociais` + `JurosEEncargosDaDivida` + `OutrasDespesasCorrentes`, e `DespesasDeCapital` = `Investimentos` + `InversoesFinanceiras` + `AmortizacaoDaDivida` (União 2025 b6 [uniao]; RJ [rj]; União 2026 b4, E40). Na recontagem das 16 respostas filtradas por Anexo 01 (seção 1.8), essas duas igualdades e as identidades 1 e 2 da seção 1.17 valem exatamente em todas, na coluna (j). `AmortizacaoDaDivida` é a amortização comum, dentro das despesas de capital. Não é a linha de refinanciamento [uniao].

**Valores reais na coluna `DESPESAS PAGAS ATÉ O BIMESTRE (j)`.** As igualdades foram conferidas com Decimal; "—" significa que a célula não existe.

| Ente e período | ExcetoIntra | Correntes | Capital | IntraTotal | Subtotal | Refinanc. | TotalDespesas | Superavit | ComSuperavit | Ev. |
|---|---|---|---|---|---|---|---|---|---|---|
| União 2026 b4 | `2821965337713.47` | `2329730336233.25` | `492235001480.22` | `36900088855.65` | `2858865426569.12` | `1141059765822.79` | `3999925192391.91` | — | `3999925192391.91` | E40 |
| RJ 2025 b6 | `102599919210.67` | `97020635761.99` | `5579283448.68` | `8709254764.43` | `111309173975.1` | `1555292452.73` | `112864466427.83` | `4988397145.43` | `117852863573.26` | E52 |
| SP 2026 b4 | `224014883002.29` | `197027989151.71` | `26986893850.58` | `7279213926.47` | `231294096928.76` | — | `231294096928.76` | — | `231294096928.76` | E41 |
| MG 2026 b4 | `76054500238.07` | `65774134688.99` | `10280365549.08` | `9139532471.63` | `85194032709.7` | — | `85194032709.7` | `16805443364.65` | `101999476074.35` | E61 |
| DF 2026 b4 | `23359230712.8` | `22130960819.03` | `1228269893.77` | `2106786216.6` | `25466016929.4` | — | `25466016929.4` | — | `25466016929.4` | E60 |

**Armadilhas**

1. **Superávit na coluna de pagas.** A linha `Superavit` aparece na coluna (j), embora não seja pagamento: MG 2026 b4 `16805443364.65` (E61), RJ 2025 b6 `4988397145.43` (E52).
2. **`TotalDespesasComSuperavit`.** Também está na coluna (j) e soma o superávit: MG 2026 b4 `101999476074.35`, contra `TotalDespesas` de `85194032709.7` (E61). No RJ 2023 b6, essa linha repete a receita realizada (PDF: 103.132.753.682,50; Siconfi: `103132753682.5`) [rj-rec, E57]. Não usar como despesa.
3. **Intraorçamentárias em dois `cod_conta`.** `DespesasIntraOrcamentariasTotal` e `DespesasIntraOrcamentarias` têm o mesmo texto de `conta` e o mesmo valor: MG 2026 b4 `9139532471.63` nas duas (E61); município do Rio 2025 b6 `7271684486.27` nas duas (E13). Somar as duas conta o valor em dobro.
4. **`TotalDespesas` mudou de significado em 2020.** Até 2019 o mesmo `cod_conta` era "subtotal com refinanciamento + superávit":
   - RJ 2018 b6: `conta` `TOTAL (XIV) = (XII + XIII)`, `valor` `69352345037.11` = `SubtotalDespesasComRefinanciamento` `58665749815.77` + `Superavit` `10686595221.34` (E64).
   - RJ 2019 b6: `69639135356` = `62523249584` + `7115885772` (E66).
   - RJ 2015 b6: `TOTAL (XIV) = (XII + XIII)`, sem linha de superávit na coluna (j) (E62).
   - União 2019 b6: `TOTAL (XV) = (XIII + XIV)` = `2710907655987` (E69).
   - A partir do RJ 2020 b6, passa a `TOTAL DAS DESPESAS (XII) = (X + XI)` = `60902068713.42`, e o total com superávit vai para `TotalDespesasComSuperavit` (E67).
   
   Uma série histórica de `TotalDespesas` mistura despesa com superávit antes de 2020 [critica].
5. **Refinanciamento só em alguns entes.** A linha existe na União (`1141059765822.79` em 2026 b4) e no estado do RJ (`1555292452.73` em 2025 b6; `1175684863.78` em 2026 b4), mas não em SP, MG e DF em 2026 b4 (E40, E52, E54, E41, E61, E60). Por isso `TotalDespesas` não é comparável entre entes. [critica] corrige [cobertura], que tinha generalizado a partir de SP.
6. **Outras repetições.** `Dívida Contratual` aparece em dois `cod_conta` no município do Rio [docs]. `Dívida Mobiliária` tem o mesmo texto e `cod_conta` diferentes para dívida interna e externa na União [uniao]. No RJ, `OutrasDespesasCorrentes` = `DemaisDespesasCorrentes`, e o refinanciamento (XI) = `Amortização da Dívida Interna` = `Dívida Contratual` [rj].
7. **O texto de `conta` varia; o `cod_conta` é estável.** A numeração romana difere entre estado (`(VIII)`) e União (`(IX)`). O espaçamento muda entre anos: `AMORTIZAÇÃO DA DÍVIDA/REFINANCIAMENTO (XI)` no RJ 2019, `AMORTIZAÇÃO DA DÍVIDA / REFINANCIAMENTO (XI)` no RJ 2020 (E66, E67). No Anexo 01, a seleção é por `cod_conta`, nunca por `conta`.
8. **O mesmo `cod_conta` muda de significado entre anexos.** No Anexo 04.3 da União, `TotalDespesas` é `TOTAL DESPESAS - MILITARES INATIVOS (V)` [uniao]. O filtro por `anexo` é obrigatório.
9. **O mesmo rótulo muda de escopo entre demonstrativos.** O "Despesas Exceto Intraorçamentárias" da DCA-Anexo I-E inclui o refinanciamento; o do RREO não. No RJ 2025, DCA `104155211663.4` = RREO `102599919210.67` + refinanciamento `1555292452.73` (E63, E52) [critica].
10. **As subcontas do refinanciamento não são confiáveis.** No RJ 2023 b6, o Siconfi divide dotação e empenho num `cod_conta` externo e liquidação e pagamento num interno, e gera saldos de `-1659160467.51` que não existem no PDF [rj-rec]. Os totais conferem; as subcontas, não.
11. **O Anexo 14 é inconsistente.** Na União 2025 b6, a linha "Despesas Liquidadas" traz o liquidado **no bimestre** do Anexo 01, e os campos do FCDF repetem os do RPPS civil [uniao]. Não serve como fonte primária.
12. **Há subcontas exclusivas de um ente.** `TransferenciasAEstadosDistritoFederalEMunicipios` e `BeneficiosPrevidenciarios` só existem na União; `TransferenciasAMunicipios`, `JurosEEncargosDaDividaIntra` e `AmortizacaoDaDividaIntra` só em SP [cobertura]. Ficam fora de comparações entre entes.

**Regra geral:** nunca somar linhas do quadro. Para um total, ler uma única linha agregada. Para uma composição, ler folhas de um mesmo nível, sem misturar uma linha com seus próprios subitens.

### 1.12 Colunas e linhas que variam por ano e bimestre

| O que varia | Observação | Evidência |
|---|---|---|
| Coluna (k) por bimestre | `INSCRITAS EM RESTOS A PAGAR NÃO PROCESSADOS (k)` só aparece no 6º bimestre. Está presente em todas as amostras de b6: RJ 2015, 2018, 2019, 2020, 2021, 2023 e 2025; União 2019 e 2025; SP 2025; município do Rio 2025. Está ausente em União e RJ 2025 b5 e em União, SP, RJ, MG e DF 2026 b4 | E62–E67, E57, E52, E69, E36, E42, E13; E34, E53; E40, E41, E54, E61, E60 |
| Anexos por bimestre | Os anexos 09, 10 e 11 só vêm no b6 | E52 × E54; E32 × E35 [rj, uniao] |
| Linhas de total por ano | `SubtotalDespesasComRefinanciamento` existe no RJ 2015, 2018 e 2019 e na União 2019, onde `TotalDespesasComSuperavit` não aparece. `TotalDespesasComSuperavit` aparece a partir do RJ 2020 e em todas as amostras de 2023 a 2026 | E62, E64, E66, E69; E67, E65, E57, E52, E36, E40, E41, E61, E60 |
| Significado de `TotalDespesas` | quebra entre 2019 e 2020 | seção 1.11, armadilha 4 |
| Texto de `conta` | numeração e espaçamento mudam entre anos e entre entes | seção 1.11, armadilha 7 |
| Precisão | valores sem centavos em 2019 (RJ e União) | seção 1.8 |
| Texto de coluna com ano embutido (outros anexos) | Anexo 07: `Em 31 de dezembro de 2024 (b)`. Anexo 03: `PREVISÃO ATUALIZADA 2025`. Anexo 04.4 - RGPS da União em 2025 e 2026: `DESPESAS EMPENHADAS ATÉ O BIMESTRE /2023` (ano errado na fonte). Anexo 06 de 2026: `Em 31/12/2024 (a)`. Grafias diferentes: `Pagos (i)` e `Pagos ( i )` | [uniao, rj] |
| Estrutura entre entes no mesmo período | presença do refinanciamento e de subcontas exclusivas | seção 1.11, armadilhas 5 e 12 |

**Divergência com a revisão crítica.** [critica] afirma que a coluna (k) não existe no RJ b6 de 2019, 2020 e 2021 nem na União b6 de 2019. Na redação deste documento, os mesmos arquivos brutos foram relidos e mostram a coluna presente. Exemplos na linha `DespesasExcetoIntraOrcamentarias`, coluna (k): RJ 2019 `382864416` (E66), RJ 2020 `555383280.86` (E67), RJ 2021 `784000506.73` (E65) e União 2019 `75681377805` (E69). Prevalece a amostra bruta, mas a divergência fica registrada. De todo modo, a ingestão não pode supor um conjunto fixo de colunas.

**O que ficou estável nas amostras de Anexo 01 (2015 a 2026).** Nas 16 respostas filtradas por Anexo 01 (seção 1.8), as colunas de despesa foram sempre `DOTAÇÃO INICIAL (d)`, `DOTAÇÃO ATUALIZADA (e)`, `DESPESAS EMPENHADAS NO BIMESTRE`, `DESPESAS EMPENHADAS ATÉ O BIMESTRE (f)`, `SALDO (g) = (e-f)`, `DESPESAS LIQUIDADAS NO BIMESTRE`, `DESPESAS LIQUIDADAS ATÉ O BIMESTRE (h)`, `SALDO (i) = (e-h)` e `DESPESAS PAGAS ATÉ O BIMESTRE (j)`, além da (k) no b6. Nos 18 conjuntos recontados, a coluna (j) trouxe sempre os `cod_conta` `DespesasExcetoIntraOrcamentarias`, `DespesasCorrentes`, `DespesasDeCapital` e `SubtotalDasDespesas`. **Não existe coluna "pagas no bimestre"**: o pago só aparece acumulado até o bimestre [docs, uniao, rj].

**Regra:** valores acumulados de bimestres diferentes não se somam. Um pago "no bimestre" obtido pela diferença b(n) − b(n−1) não é publicado pela fonte e pode misturar versões, porque o `/rreo` não informa qual versão (HO ou RE) está servindo [critica, rj].

### 1.13 Chave natural das células

**Camada bruta (qualquer anexo do `/rreo`):**

```
(cod_ibge, exercicio, periodo, demonstrativo, anexo, rotulo, coluna, cod_conta, conta)
```

Todos esses campos vêm no próprio item. O `demonstrativo` é `RREO` ou `RREO Simplificado`.

**Por que `conta` precisa estar na chave fora do Anexo 01.**

- No Anexo 02, o `cod_conta` só tem dois valores, `RREO2TotalDespesas` e `RREO2TotalDespesasIntra`. A função e a subfunção existem apenas no texto de `conta` (por exemplo `Legislativa`, `Ação Legislativa`, `FU01 - Administração Geral`) [uniao, rj, critica].
- No Anexo 07, o `cod_conta` representa a medida (por exemplo `RestosAPagarNaoProcessadosPagos`), e o poder ou órgão vem em `conta` [uniao, rj].
- Contagem de chaves repetidas dentro de uma mesma resposta:

| Amostra | Itens | Chaves repetidas sem `conta` (anexo, rotulo, coluna, cod_conta) | Maior repetição | Repetidas com `conta` |
|---|---|---|---|---|
| União 2025 b6, todos os anexos (E32 + E33) | 6893 | 75 | 174 | 0 |
| União 2026 b4, todos os anexos (E35) | 4626 | 44 | 173 | 0 |
| RJ 2025 b6, todos os anexos (E52) | 4682 | 56 | 146 | 0 |
| RJ 2026 b4, todos os anexos (E54) | 3711 | 43 | 146 | 0 |
| DCA-Anexo I-E, RJ 2025 (E63) | 579 | 5 | 133 | 0 |
| DCA-Anexo I-E, União 2025 (E68) | 834 | 5 | 172 | 0 |
| Anexo 01, 18 conjuntos recontados de 2015 a 2026 (União, SP, RJ, MG, DF, município do Rio; seção 1.8) | 614 a 878 | 0 | — | 0 |

**Camada do indicador (só Anexo 01):**

```
(cod_ibge, exercicio, periodo, demonstrativo = 'RREO', anexo = 'RREO-Anexo 01',
 coluna = 'DESPESAS PAGAS ATÉ O BIMESTRE (j)', cod_conta = 'DespesasExcetoIntraOrcamentarias')
```

Aqui `conta` fica **fora** da chave, porque o texto muda entre anos e entre entes (seção 1.11, armadilha 7), enquanto o `cod_conta` não teve duplicatas no Anexo 01 em nenhuma amostra.

**Fora de qualquer chave:** `instituicao`, `esfera`, `uf` e `populacao`. Esses campos variam entre endpoints e ao longo do tempo (seção 1.15).

**A unicidade só foi testada em amostras.** A ingestão deve falhar de forma explícita se a chave se repetir numa resposta, em vez de escolher uma das linhas em silêncio [critica].

### 1.14 Extrato de entregas: status, datas e retificações

- **`data_status` é a data do status atual (último HO ou RE) daquele entregável no Siconfi.** Não é a data da entrega original nem a da publicação legal no Diário Oficial [critica]. **Documentado (E03, definição `Extrato`):** "Representa a data da homologação/retificação para relatórios ou a data de entrega para matrizes". O sufixo é `Z`, mas o fuso real não foi verificado (**lacuna**). Várias homologações caem perto das 22:30Z do dia do prazo: MG em 2026 b1 a b4 (`2026-03-30T22:41:22Z`, `2026-05-30T22:33:26Z`, `2026-07-30T22:31:34Z`, `2026-09-30T22:30:39Z`) [cobertura].
- **Sinais de que a data não é a da entrega original:**
  - SP 2026 b1 está RE em `2026-06-02T16:09:31Z`, depois do b2 HO em `2026-05-29T14:14:24Z` [cobertura].
  - RJ 2025 b1 está RE em `2025-06-18T22:31:27Z`, depois do b2 HO em `2025-05-30T14:29:56Z` (E50).
  - União 2025 b1 está HO em `2025-05-09T22:31:07Z`, depois do fim do bimestre seguinte e três semanas antes do b2 HO em `2025-05-30T08:41:54Z` [cobertura, uniao].
- **Não há histórico.** Há uma linha por entregável, período e instituição. Uma retificação substitui o status e a data, e a data original de homologação desaparece. **Inferência**, pela ausência de linhas duplicadas [rj, cobertura].
- **O `/rreo` também não tem versão.** Não dá para saber se um valor coletado é anterior ou posterior a uma retificação, nem recuperar versões antigas [critica]. Decisão: o PortalDash guarda o status e a `data_status` do extrato a cada coleta, para formar um histórico próprio.
- **Retificações observadas no RREO:**

| Ente | Período | Status e data | Evidência |
|---|---|---|---|
| SP (35) | 2025 b6 | RE `2026-04-16T16:07:44Z` | E45 [cobertura] |
| RJ (33) | 2025 b6 | RE `2026-05-06T17:14:12Z` | E50 |
| DF (53) | 2025 b6 | RE `2026-05-08T16:59:04Z` | E45 [cobertura] |
| Município do Rio (3304557) | 2025 b6 | RE `2026-05-08T15:00:35Z` | E23 |
| SP (35) | 2025 b1 | RE `2025-07-28T17:56:58Z` | E45 [cobertura] |
| RJ (33) | 2025 b1 | RE `2025-06-18T22:31:27Z` | E50 |
| Município do Rio (3304557) | 2025 b1 | RE `2025-05-20T22:31:56Z` | E23 (recontagem) |
| RJ (33) | 2026 b1 e b2 | RE `2026-03-30T11:28:18Z`; RE `2026-05-29T12:32:07Z` | E51 |
| SP (35) | 2026 b1 | RE `2026-06-02T16:09:31Z` | E43 |
| RJ (33) | 2023 b6 | RE `2024-07-03T22:30:39Z`, depois da emissão do PDF (24/01/2024); mesmo assim, as linhas de total do Anexo 01 são idênticas às do PDF | E58, E59 [rj-rec] |
| União (1) | RREO 2025 e 2026 | nenhum RE. Em 2025, o RE aparece só em linhas de RGF | E30, E31 [uniao] |

- **Uma republicação pode não chegar ao extrato.** A STN republicou o RREO de dez/2025 da União (arquivo `12_ RREODez2025 (REPUBL_).pdf`, `Last-Modified` 2026-07-17, E37), mas o extrato mostra o b6 de 2025 como HO em `2026-01-30T22:36:41Z`, sem RE (E30). No demonstrativo republicado do FCDF, as despesas pagas são 10.050.645 mil; na API, `4940304484.05`. O empenhado do Anexo 1 no PDF fica 7 a 8 unidades de R$ mil acima do Siconfi (total de 5.379.398.678 mil no PDF, contra `5379398670922.43` na API). As despesas pagas do Anexo 1 conferem [uniao, uniao-rec, critica].
- **Cobertura do RREO em 2026 (E43, E31):** os 28 entes têm b1 a b4 no extrato. As homologações do b4 vão de `2026-09-18T14:47:08Z` (RN) a `2026-09-30T22:36:35Z` (RJ), e 27 dos 28 caíram entre 2026-09-24 e 2026-09-30 ([critica] corrige o "26 de 28" de [cobertura]). No momento da coleta, o b5 de 2026 não aparecia em nenhum extrato.
- **Cobertura do RREO em 2025 b6:** verificada só para União, SP, RJ e DF. Os outros 24 entes não foram consultados (**lacuna**).
- **O extrato não garante disponibilidade no `/rreo`.** A defasagem entre homologação e disponibilidade é desconhecida; só existem limites superiores [critica]:
  - União b4: HO `2026-09-30T14:28:06Z`, já disponível às `2026-10-02T01:23:10Z` (cerca de 34 h 55 min; E40).
  - SP b4: HO `2026-09-30T11:45:11Z`, disponível às `2026-10-02T01:23:22Z` (cerca de 37 h 38 min; E41).
  - Município do Rio b4: HO `2026-09-30T12:06:45Z`, disponível às `2026-10-02T01:25:56Z` (E26).
  
  [critica] corrige o "11 a 14 horas" de [cobertura].

### 1.15 Divergências entre o spec e as respostas

| Ponto | O spec diz | O que a API devolve | Evidência | Consequência |
|---|---|---|---|---|
| Nomes de campo em `/entes` | `an_exercicio`, `co_cnpj` | `exercicio`, `cnpj` (string de 14 dígitos) | E04 | validar o esquema real em tempo de execução |
| `uf` e `regiao` em `/entes` | estados com `regiao` = `BR` | estados com `uf` `BR` e região real (por exemplo `SE`); União com `regiao` `BR` e `uf` `null` | E04 | não usar `uf` de `/entes` |
| `capital` em `/entes` | inteiro | string com espaços à direita (`0  `, `1  `) | E04 | trim; não confiar nos tipos do spec |
| `limit` padrão | 5.000 itens por página | `6000` em `/entes` | E04 | não supor tamanho de página |
| Esfera do DF | o enum de Entes tem `M`, `E`, `U`, `D` ("D = DF"); o próprio spec é inconsistente, porque o filtro `co_esfera` do `/rreo` diz "E = Estados e DF" | `/entes` traz `D`; o `/rreo` traz `esfera` `E`, `uf` `DF` e `instituicao` `Governo do Distrito Federal` | E03, E04, E60 [critica] | `esfera` não serve como chave de junção entre endpoints |
| `uf` entre endpoints | `uf` de Entes e de RREO: enum com as 27 siglas, descrito como "Unidade da federação à qual pertence o município" | `/rreo` traz `RJ`, `SP`, `MG`, `DF` e, para a União, `BR`; `/entes` traz `BR` para estados e `null` para a União | E03, E52, E41, E61, E60, E40, E04 | `uf` fora de qualquer chave. No registro de estado, a sigla só foi vista no `/rreo` de RJ, SP, MG e DF [critica]. Na recontagem de E04, as 27 siglas aparecem no `uf` dos municípios, e os dois primeiros dígitos do `cod_ibge` de cada município correspondem a uma única sigla. **Inferência:** dá para derivar a sigla de cada estado da própria fonte, mas não do registro do estado |
| Campos extras | ausentes do schema | `esfera` no `/rreo` e no `/rgf`; `complemento_fonte` na `/msc_orcamentaria`; o `/rgf` não tem `demonstrativo` | [docs] | tolerar campos extras e validar os necessários |
| Tipo de `valor` | `type: integer, format: float` | número decimal com até 2 casas | E36, E61 [cobertura] | parse como texto (seção 1.8) |
| Obrigatoriedade no `/rreo` | "Apenas o parâmetro no_anexo é opcional", mas `co_esfera` aparece com `required: false` | funciona sem `co_esfera` | E13, E36 [critica] | não enviar `co_esfera` |
| Erros de validação | enum e obrigatórios declarados | fora do enum ou faltando obrigatório: 200 com `items` vazio | E15, E16, E17, E44 | validar localmente |
| Paginação | `limit` e `offset` não documentados | funcionam | E05, E18, E19 | seção 1.4 |
| Enum `no_anexo` | lista fixa | faltam `RREO-Anexo 04.3`, `RREO-Anexo 04.4 - RGPS`, `RREO-Anexo 10.1 - RPPS` e `RREO-Anexo 10.2 - RGPS`, que aparecem nos dados da União. Os anexos 08 e 12 não constam do enum nem de `/anexos-relatorios`; nenhuma consulta a eles foi tentada [critica] | E09 [docs, uniao] | não afeta o Anexo 01 |
| `/anexos-relatorios` | definição `Anexos`: `esfera` com enum `M`, `E`, `U`; `demonstrativo` com enum `RREO`, `RREO Simplificado`, `RGF`, `RGF Simplificado`, `DCA`, `QDCC` | o campo `demonstrativo` só traz `DCA` ou `QDCC`, e os anexos de RREO e RGF vêm rotulados `QDCC`; aparece a esfera `C`, fora do enum `esfera` dessa definição (embora `C` exista no filtro `co_esfera`) | E03, E09 [docs] | não usar para classificar demonstrativos |
| Base path | campo `host` com o caminho embutido; `schemes` e `basePath` comentados | caminho legado `/ords/siconfi/tt/` também ativo | E03, E56 | só o caminho documentado |
| `populacao` | "Estimativa da quantidade de habitantes para o exercício de referência dos dados" | União: `8569324` em `/entes`, no extrato e no `/rreo` (**inferência**: incompatível com a população do país [uniao, cobertura]). Estado do RJ: o mesmo `16615526` em 2025 e 2026, o que não confirma a safra por exercício descrita no spec | E03, E04 [uniao, critica] | não usar; nenhum per capita com esse campo |

### 1.16 Três datas

| Data | O que é | De onde vem | Formato | Cuidados |
|---|---|---|---|---|
| **Referência** | exercício + bimestre. Os valores são acumulados de 1º de janeiro até o fim do bimestre | campos `exercicio` e `periodo` do `/rreo`, iguais aos parâmetros | inteiros | A API não informa os meses. A correspondência b1 = jan–fev … b6 = nov–dez é convenção da LRF (**inferência**), coerente com as duas publicações conferidas (b6 e b4): o PDF do RJ 2023 b6 diz "JANEIRO A DEZEMBRO 2023/BIMESTRE NOVEMBRO-DEZEMBRO" [rj-rec] e o PDF da União de ago/2026 diz "JANEIRO A AGOSTO DE 2026" [uniao] |
| **Status no Siconfi** | data do último status (HO ou RE) do entregável | `data_status` do `/extrato_entregas` | ISO 8601 com `Z`, por exemplo `2026-09-30T22:36:35Z` | Não é a entrega original nem a publicação no Diário Oficial. Não tem histórico. O fuso não foi verificado |
| **Coleta** | momento em que o PortalDash obteve a resposta | relógio próprio, em UTC | ISO 8601 | Não usar o cabeçalho `Date` da resposta (seção 1.6) |

Uma quarta data, a da **publicação oficial**, não vem na API e o PortalDash não a usa. Exemplos: na página do Tesouro Transparente, o RREO de dez/2025 republicado diz "Publicado em 30/05/2026" e o de ago/2026 diz "Publicado em 30/09/2026" [uniao]. Ela não deve ser confundida com `data_status`.

Exemplo das três datas para o mesmo recorte, o estado do RJ em 2026 b4: referência jan–ago/2026; status HO em `2026-09-30T22:36:35Z` (E51); coleta em `2026-10-02T01:23:46Z` (E54), que corresponde a 2026-10-01 22:23 em Brasília.

### 1.17 Recorte consumido pelo PortalDash (metodologia v0.1.0)

Esta seção registra decisões de arquitetura já tomadas. Os itens marcados como decisão pendente ainda dependem de Gabriel.

**Entes no escopo:** a União e os 26 estados mais o DF, num total de 28. Ficam fora municípios e consórcios. Os nomes vêm de `/entes` (E04) [cobertura]. No registro do estado, a sigla só foi vista no `/rreo` de RJ, SP, MG e DF; para os demais, ela é derivada do código IBGE, de forma coerente com o `uf` dos municípios em `/entes` (seção 1.15).

| `id_ente` | Ente | `id_ente` | Ente | `id_ente` | Ente | `id_ente` | Ente |
|---|---|---|---|---|---|---|---|
| 1 | União | 17 | Tocantins | 26 | Pernambuco | 41 | Paraná |
| 11 | Rondônia | 21 | Maranhão | 27 | Alagoas | 42 | Santa Catarina |
| 12 | Acre | 22 | Piauí | 28 | Sergipe | 43 | Rio Grande do Sul |
| 13 | Amazonas | 23 | Ceará | 29 | Bahia | 50 | Mato Grosso do Sul |
| 14 | Roraima | 24 | Rio Grande do Norte | 31 | Minas Gerais | 51 | Mato Grosso |
| 15 | Pará | 25 | Paraíba | 32 | Espírito Santo | 52 | Goiás |
| 16 | Amapá | | | 33 | Rio de Janeiro | 53 | Distrito Federal (não usar `5300108`) |
| | | | | 35 | São Paulo | | |

**Requisições:**

- Por ente, exercício e bimestre: `GET {BASE}rreo?an_exercicio={AAAA}&nr_periodo={1..6}&co_tipo_demonstrativo=RREO&no_anexo=RREO-Anexo%2001&id_ente={id}`
- Por ente e exercício: `GET {BASE}extrato_entregas?id_ente={id}&an_referencia={AAAA}`, usando a linha com `entregavel` = `Relatório Resumido de Execução Orçamentária` e o `periodo` correspondente.

**Células lidas para o indicador**, todas com `anexo` = `RREO-Anexo 01` e `coluna` = `DESPESAS PAGAS ATÉ O BIMESTRE (j)`:

| Uso | `cod_conta` |
|---|---|
| Indicador principal: "Despesas pagas no exercício, acumuladas até o bimestre (exceto intraorçamentárias)" | `DespesasExcetoIntraOrcamentarias` |
| Identidade 1: ExcetoIntra = Correntes + Capital | `DespesasCorrentes`, `DespesasDeCapital` |
| Identidade 2, quando a linha intra existir: Subtotal = ExcetoIntra + IntraTotal | `SubtotalDasDespesas`, `DespesasIntraOrcamentariasTotal` |
| Composição por grupos comuns | `DespesasCorrentes`, `PessoalEEncargosSociais`, `JurosEEncargosDaDivida`, `OutrasDespesasCorrentes`, `DespesasDeCapital`, `Investimentos`, `InversoesFinanceiras`, `AmortizacaoDaDivida` |

A camada bruta guarda a resposta inteira. O indicador nunca lê `TotalDespesas`, `Superavit`, `TotalDespesasComSuperavit`, `DespesasIntraOrcamentarias` (a cópia), `AmortizacaoRefinanciamentoDaDivida`, colunas de percentual nem subcontas exclusivas de um ente.

**Antes de ativar um snapshot:**

- Decisão: a célula do indicador está presente; as identidades 1 e 2 batem exatamente em NUMERIC; e, se o snapshot for inválido ou a fonte falhar, o último snapshot ativo é mantido.
- Recomendado por [critica] e [docs]: chave natural sem repetição na resposta; paginação concluída (`hasMore` false); o extrato registra o RREO daquele ente, exercício e bimestre antes de se concluir que não há dado.

**O que o indicador inclui e o que não inclui** [critica, uniao, rj]

- Inclui: despesas correntes (pessoal e encargos, juros e encargos da dívida, outras despesas correntes) e despesas de capital (investimentos, inversões financeiras e amortização da dívida não refinanciada), todas pagas de 1º de janeiro até o fim do bimestre, em reais nominais.
- Não inclui:
  - despesas intraorçamentárias;
  - a linha de amortização/refinanciamento da dívida;
  - superávit e total com superávit;
  - restos a pagar de exercícios anteriores pagos no ano, que ficam no Anexo 07. Isto é **inferência** pela estrutura dos anexos: o MDF não foi lido (L3);
  - empenhado ou liquidado não pago;
  - qualquer consolidação entre esferas;
  - municípios.
- Não há total nacional consolidado nem soma de estados (decisão). As transferências entram como despesa de quem paga: a União tem `TransferenciasAEstadosDistritoFederalEMunicipios` = `531673082300.42` até 2026 b4 [cobertura, critica].

**Evidência de reconciliação com publicações oficiais**

| Recorte | Siconfi | Publicação | Resultado | Fonte |
|---|---|---|---|---|
| União 2025 b6, `DespesasExcetoIntraOrcamentarias` (j) | `3606510496180.06` | 3.606.510.496 (R$ mil), PDF republicado (E37) | confere ao milhar (half-up). Das 30 linhas da coluna (j) no PDF, as 28 presentes nos dois lados conferem, com resíduo máximo de 0,48 mil; as outras 2 faltam no Siconfi (seção 1.9). Precisão de R$ mil, não de centavo | [uniao, uniao-rec] |
| União 2026 b4, `DespesasExcetoIntraOrcamentarias` (j) | `2821965337713.47` | 2.821.965.338 (R$ mil), E38 | confere ao milhar; [critica] conferiu 13 linhas | [uniao, critica] |
| Estado do RJ 2023 b6, linhas de total (I, II, III, V, VIII, IX, X, XI, XII, XIV) | por exemplo `TotalDespesas` (j) `99217095187.47` | 99.217.095.187,47 (R$ 1,00), E59 | 86 de 88 células iguais ao centavo. As 2 diferentes são células que existem no PDF e faltam no Siconfi | [rj-rec] |
| Estados em 2025 e 2026 | — | — | **não reconciliados**. A SEFAZ-RJ bloqueou o IP, e o PDF de 2025 não estava no Wayback. Só há uma corroboração em R$ mil do `TotalDespesas` (j) do RJ 2025 (`112864466427.83` contra "Despesa Paga 112.864.466" na Prestação de Contas 2025, Volume 01, da SEFAZ-RJ), que não é o RREO nem a linha do indicador | [rj, rj-rec, critica] |

**Decisões pendentes que afetam este contrato**

- **D1. Linha-manchete (pendente; Gabriel).** `DespesasExcetoIntraOrcamentarias` é a escolha **provisória** da metodologia v0.1.0 e a recomendada por [critica]. A alternativa sustentada pelos dados é `SubtotalDasDespesas`, que inclui as intraorçamentárias e, por isso, conta em dobro dentro do mesmo ente. `TotalDespesas` foi descartada: inclui o refinanciamento e mudou de significado em 2020. Também falta decidir se juros e amortização da dívida ficam dentro da manchete ou aparecem destacados. Enquanto D1 não for confirmada, o indicador e seus textos são provisórios.
- **D2. Política de versões (pendente; Gabriel).** Mostrar só o último valor, com selo "retificado em", ou também o histórico de versões coletadas [critica].
- **D3. Profundidade histórica (pendente; Gabriel).** A partir de que exercício publicar, dado que há quebra estrutural entre 2019 e 2020 e valores sem centavos em 2019 [critica].
- **D4. Tratamento do DF (pendente; Gabriel).** O DF tem esfera `D` em `/entes` e `E` no `/rreo`, e a relação com o FCDF pago pela União não foi investigada [critica].
- **D5. Atualização (pendente; Gabriel).** Com que frequência coletar e o que o portal mostra entre a homologação e a disponibilidade no `/rreo` [critica].
- As outras decisões levantadas por [critica] (apresentação temporal, valores nominais ou reais e per capita, visão anual por função via DCA, precisão de exibição) são de metodologia e apresentação e não mudam este contrato da fonte. A soma de estados e o total nacional já estão fora do escopo por decisão de arquitetura.

---

## Riscos e lacunas da fonte

### Riscos

- **R1. Contrato beta e mutável.** O spec se declara "versão beta" e o arquivo tem `Last-Modified` de 2026-06-24 (E03). Campos, enums e o base path podem mudar sem aviso. Mitigação: validar o esquema em tempo de execução, tolerar campos extras e monitorar o ETag do spec.
- **R2. Retificação silenciosa.** O `/rreo` não tem versão e o extrato não guarda histórico (seção 1.14). Um valor muda no lugar e a série publicada muda junto. Mitigação (decisão): respostas brutas deduplicadas, snapshots com hash, histórico próprio do extrato e recoleta.
- **R3. Republicação sem reflexo no Siconfi.** O caso do RREO de dez/2025 da União (seção 1.14) mostra que a publicação oficial pode divergir da API sem nenhum RE no extrato. Conciliar uma coluna não valida as outras [uniao-rec].
- **R4. Bloqueio e indisponibilidade.** O limite é de 1 req/s (documentado) e o bloqueio por excesso é desconhecido. Houve um 502 em HTML sob concorrência (E07), e a origem chegou a levar 69,26 s (E09). Mitigação (decisão): limitador global, lock, retentativas limitadas e manutenção do último snapshot ativo.
- **R5. Cache do CDN com TTL desconhecido.** Depois de uma retificação, a API pode continuar servindo a versão anterior por um tempo desconhecido (seção 1.7).
- **R6. Dois caminhos ativos.** O caminho legado responde igual ao documentado (E56). Um dos dois pode ser desativado, e o documentado vem de um campo `host` fora do padrão (E03).
- **R7. Paginação sem ordenação.** Se os dados mudarem durante a paginação, linhas podem se repetir ou se perder (seção 1.4). Mitigação recomendada ([docs], [critica]): conferir a chave natural e tratar repetição como snapshot inválido. Uma linha perdida não é detectável pela chave (**lacuna**), mas o Anexo 01 coube numa página em todas as amostras.
- **R8. Perda de precisão.** Os valores vêm como número JSON com até 13 dígitos na parte inteira (seção 1.8). Qualquer passagem por float corrompe os centavos.
- **R9. Vazio confundido com zero ou com "não entregou".** Situações diferentes devolvem o mesmo 200 com `items` vazio: parâmetro fora do enum, parâmetro obrigatório ausente, período ainda não entregue e ente sem entregas (seção 1.5).
- **R10. Linhas que não são despesa e totais instáveis na coluna de pagas.** `Superavit`, `TotalDespesasComSuperavit` e o `TotalDespesas` anterior a 2020 (seção 1.11).
- **R11. Estrutura variável.** Colunas, linhas e anexos variam por bimestre, ano e ente (seção 1.12). Um ETL com esquema fixo quebra ou erra em silêncio.
- **R12. Dupla contagem entre esferas.** A fonte não consolida. As transferências da União a estados e municípios aparecem como despesa da União e podem reaparecer como despesa de quem recebe [critica]. Somar esferas exige metodologia própria, e essa soma está fora do escopo.
- **R13. Natureza temporal diferente da União.** O RREO oficial da União é mensal ("No Mês", "Até o Mês"); o Siconfi é bimestral. Só os acumulados dos meses pares coincidem. Na União 2026 b4, na linha `DespesasExcetoIntraOrcamentarias` (IX), `DESPESAS EMPENHADAS NO BIMESTRE` vale `615832878707.67`, enquanto o PDF traz 260.773.213 mil "No Mês" (agosto) na mesma linha [critica, E38].
- **R14. Cadastro inconsistente.** `esfera`, `uf` e `populacao` divergem entre endpoints ou não são confiáveis (seção 1.15).
- **R15. Payload não confiável.** As respostas vêm em chunked, sem `Content-Length`; os 5xx podem vir em HTML; há campos extras e caracteres corrompidos. Mitigação (decisão): limite de corpo, validação de tipos e campos, allowlist de host e redirect tratado como erro.
- **R16. Certificado de 6 meses.** O certificado atual vence em 2026-12-22 [docs]. Fixar certificado ou cadeia quebraria a ingestão na renovação.

### Lacunas

- **L1. Célula do indicador conferida em poucos entes.** Ela foi vista no `/rreo` da União, de SP, RJ, MG e DF. Nos outros 23 estados, a presença do `cod_conta` e da coluna é só inferida pelo extrato [critica].
- **L2. Reconciliação externa limitada.** A União foi conferida com precisão de R$ mil, não de centavo. Entre os estados, só o RJ 2023 b6, só nas linhas de total. Nenhum estado foi reconciliado em 2025 ou 2026 [critica]. A recomendação de [critica] é reconciliar pelo menos 3 estados, com e sem linha de refinanciamento.
- **L3. Definição normativa da coluna (j).** O Manual de Demonstrativos Fiscais (MDF) da STN não foi lido. A exclusão dos restos a pagar de anos anteriores é inferida pela existência do Anexo 07 [critica].
- **L4. Fuso de `data_status`.** Não foi verificado (seção 1.14).
- **L5. Defasagem entre homologação e disponibilidade no `/rreo`.** Só há limites superiores, de cerca de 35 a 38 h (seção 1.14).
- **L6. Extrato de 2025 incompleto.** O b6 de 2025 não foi consultado para 24 dos 28 entes.
- **L7. Política de bloqueio.** Duração, código HTTP e limiar são desconhecidos.
- **L8. Quebra estrutural histórica.** Só foi observada no RJ (2015 a 2021) e na União (2019). Não se sabe se é igual para todos os entes, nem como eram os anos anteriores a 2015.
- **L9. DF e FCDF.** A interação entre as despesas da União pelo Fundo Constitucional do DF e as despesas do DF não foi investigada.
- **L10. Rastreabilidade das evidências.** As amostras e os logs estão num diretório temporário de sessão, fora do repositório. Os PDFs maiores que 2 MB foram apagados depois da extração. Do RREO de dez/2025 da União ficaram URL, `ETag`, `Last-Modified` e tamanho, sem hash [uniao-rec]; dos PDFs da SEFAZ-RJ e do DOERJ, os hashes estão no log [rj-rec]. Os relatórios da União, do RJ e da reconciliação chegaram truncados à revisão crítica, e afirmações que só existiam no texto truncado não foram checadas [critica]. **Recomendação:** antes que a sessão expire, copiar amostras selecionadas e pequenas para fixtures de contrato versionadas.
- **L11. Medições de uma só origem.** A latência e o comportamento de rede foram medidos de uma máquina Windows, numa noite. O comportamento a partir do Railway é desconhecido.
- **L12. `/entes` sem cache.** O tempo de resposta nessa condição não foi medido (seção 1.6).
- **L13. Teto de `limit`.** Não foi determinado (seção 1.4).
- **L14. RREO Simplificado.** Os códigos de `forma_envio` e `tipo_relatorio` estão documentados no spec (seção 1.3.2), mas nenhum `tipo_relatorio` `S` nem resposta de `RREO Simplificado` foi observado. Isso não afeta os 28 entes do escopo, que tiveram `P` em todas as linhas de 2026.
- **L15. Origem de `populacao`.** O spec descreve o campo como estimativa de habitantes "para o exercício de referência dos dados", sem citar a fonte. O comportamento observado não confirma essa safra (seção 1.15). O campo não é usado.
- **L16. Comportamento de 429, 500, 503 e 504.** O 429 foi observado em 2026-10-02 (seção 1.2, atualização): vem da CDN, sem `Retry-After`. A política exata de limitação e o formato de 500, 503 e 504 continuam desconhecidos.

---

## Parte 2: API própria v1

Contrato público, somente leitura. Versão da API: `1`. Mudanças incompatíveis
exigem nova versão (`/api/v2`) ou, enquanto o projeto estiver em 0.x, versão
MINOR com a quebra destacada no `CHANGELOG.md`. Implementação em
`src/app/api/v1/`, testes em `tests/api/`.

### 2.1 Regras gerais

- Só `GET`. Outros métodos devolvem 405.
- O navegador e os clientes da API nunca recebem dados direto da fonte: tudo
  vem das declarações validadas e ativas no banco do PortalDash.
- Valores monetários são **strings decimais** com ponto (ex.:
  `"2821965337713.47"`), exatamente como a fonte declarou, sem zeros à
  direita. Nunca são convertidos em número de ponto flutuante.
- `null` significa ausência de dado. Ausência nunca é representada como zero.
- Datas e horários em ISO 8601 UTC; datas de período em `AAAA-MM-DD`.
- `Content-Type: application/json; charset=utf-8`. Respostas de dados com
  `Cache-Control: public, max-age=300` (o recorte inteiro está na URL); erros e
  `/health` com `no-store`.

### 2.2 Parâmetros

| Parâmetro | Valores | Regra |
| --- | --- | --- |
| `ano` | inteiro de 4 dígitos, de 2015 ao ano corrente (horário de Brasília) | opcional |
| `bimestre` | `1` a `6` (1 = jan–fev … 6 = nov–dez) | opcional; exige `ano` |
| `conceito` | `pago` | opcional; único conceito validado |

- Sem `bimestre`, usa o bimestre mais recente com dado validado (no `ano`
  informado, se houver), preferindo os que têm dado da União.
- Parâmetro desconhecido ou repetido → 400.
- UF em `/estados/{uf}`: sigla de 2 letras da allowlist (26 estados e DF),
  sem diferenciar maiúsculas.

### 2.3 Rotas

| Rota | Conteúdo |
| --- | --- |
| `GET /api/v1/brasil` | União (indicador, composição e proveniência) e os 27 entes estaduais lado a lado, com cobertura. **Sem total nacional nem soma de estados.** |
| `GET /api/v1/estados` | Os 27 entes estaduais lado a lado, com cobertura. |
| `GET /api/v1/estados/{uf}` | Um estado: indicador, composição, proveniência e série cumulativa do exercício (bimestres 1 a 6). |
| `GET /api/v1/fontes` | Fontes, situação da última coleta (sem mensagens de erro) e períodos com dado validado. Não aceita parâmetros. |
| `GET /api/v1/health` | `{"status":"ok"}` ou 503. Sem versão, host ou configuração. |

### 2.4 Campos comuns (`/brasil`, `/estados`, `/estados/{uf}`)

| Campo | Descrição |
| --- | --- |
| `versaoApi` | `"1"` |
| `metodologia` | `{ versao, url }` — versão da metodologia (independente da versão do software) |
| `definicaoIndicador` | `{ id, nome, qualificador, conceito }` |
| `filtros` | recorte efetivamente usado: `{ ano, bimestre, conceito }` |
| `referenciaTemporal` | `{ tipo: "acumulado_no_exercicio", exercicio, bimestre, inicio, fim, descricao }` |
| `unidade` | `{ moeda: "BRL", base: "nominal" }` |
| `avisos` | textos obrigatórios que acompanham o número |

### 2.5 Indicador por ente (`IndicadorEnte`)

| Campo | Descrição |
| --- | --- |
| `ente` | `{ codIbge, uf, nome, esfera }` (`esfera`: `uniao`, `estado` ou `distrito_federal`) |
| `situacao` | `disponivel`; `sem_dado_validado` (entrega registrada no extrato, mas sem versão coletada e validada); `sem_registro_de_entrega` |
| `valor` | despesas pagas exceto intraorçamentárias (string) ou `null` |
| `proveniencia` | `{ fonte, consulta, statusEntrega, dataStatusSiconfi, coletadoEm, verificadoEm }` ou `null`. `consulta` é a URL pública da fonte com o recorte; `statusEntrega` é `homologado` ou `retificado` |
| `composicao` | só em `/brasil` (União) e `/estados/{uf}`: `{ categorias, grupos }`, cada item com `codConta`, `nome`, `categoria`, `valor` (string ou `null`) e `participacaoPercentual` (string com 1 casa, sobre o total exceto intra, ou `null`) |

`cobertura` (em `/brasil` e `/estados`): `{ totalEntes, comDado, semDado: [{ uf, nome, situacao }] }`.

`serieExercicio` (em `/estados/{uf}`): lista de `{ bimestre, situacao, valor }`.
Cada valor é acumulado desde janeiro; os pontos não devem ser somados.

### 2.6 Erros

```json
{ "erro": { "codigo": "parametro_invalido", "mensagem": "Parâmetros inválidos",
            "detalhes": [{ "campo": "bimestre", "mensagem": "Use um bimestre de 1 a 6" }] } }
```

| Status | `codigo` | Quando |
| --- | --- | --- |
| 400 | `parametro_invalido` | parâmetro desconhecido, repetido ou fora da allowlist |
| 404 | `nao_encontrado` | UF fora da allowlist |
| 404 | `sem_dados` | nenhum dado validado no recorte pedido |
| 405 | — | método diferente de GET |
| 503 | `indisponivel` | banco indisponível (sem detalhes internos) |

### 2.7 O que a API não expõe

Identificadores internos, hashes, corpos brutos, mensagens de erro da
ingestão, credenciais, host do banco ou configuração. Coberto por
`tests/api/rotas.test.ts`.
