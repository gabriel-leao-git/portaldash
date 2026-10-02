# Fixtures de contrato do Siconfi

Respostas reais da API de dados abertos do Siconfi coletadas na validação da
fonte (docs/validacao-fonte-siconfi-2026-10.md), entre 2026-10-02T01:19Z e
01:51Z (UTC). Servem para testes determinísticos; nenhum teste consulta a
fonte real.

Recorte aplicado para não versionar dados brutos grandes:

- `rreo_<ente>_<exercício>_b<bimestre>_anexo01.json`: só os itens do
  `RREO-Anexo 01` nas colunas `DESPESAS PAGAS ATÉ O BIMESTRE (j)` e
  `DESPESAS LIQUIDADAS ATÉ O BIMESTRE (h)`. Envelope reduzido a `items`,
  `hasMore`, `limit`, `offset` e `count` (os `links` apontam para um host
  interno e foram retirados).
- `extrato_<ente>_<exercício>.json`: só as linhas do entregável
  `Relatório Resumido de Execução Orçamentária`.

Os números foram copiados com o texto exato da resposta (sem passar por float).
Os campos e valores não foram editados. Origem de cada arquivo:

| Arquivo | Consulta de origem (endpoint e filtros principais) |
| --- | --- |
| `rreo_1_2026_b4_anexo01.json` | `/rreo?an_exercicio=2026&nr_periodo=4&co_tipo_demonstrativo=RREO&no_anexo=RREO-Anexo 01&id_ente=1` |
| `rreo_1_2025_b6_anexo01.json` | `/rreo?an_exercicio=2025&nr_periodo=6&co_tipo_demonstrativo=RREO&no_anexo=RREO-Anexo 01&id_ente=1` |
| `rreo_33_2025_b6_anexo01.json` | `/rreo?an_exercicio=2025&nr_periodo=6&co_tipo_demonstrativo=RREO&id_ente=33` (todos os anexos; filtrado) |
| `rreo_33_2025_b5_anexo01.json` | `/rreo?an_exercicio=2025&nr_periodo=5&co_tipo_demonstrativo=RREO&no_anexo=RREO-Anexo 01&id_ente=33` |
| `rreo_33_2026_b4_anexo01.json` | `/rreo?an_exercicio=2026&nr_periodo=4&co_tipo_demonstrativo=RREO&id_ente=33` (todos os anexos; filtrado) |
| `rreo_33_2023_b6_anexo01.json` | `/rreo?an_exercicio=2023&nr_periodo=6&co_tipo_demonstrativo=RREO&no_anexo=RREO-Anexo 01&id_ente=33` |
| `rreo_33_2019_b6_anexo01.json` | `/rreo?an_exercicio=2019&nr_periodo=6&co_tipo_demonstrativo=RREO&no_anexo=RREO-Anexo 01&id_ente=33` |
| `rreo_35_2026_b4_anexo01.json` | `/rreo?an_exercicio=2026&nr_periodo=4&co_tipo_demonstrativo=RREO&no_anexo=RREO-Anexo 01&id_ente=35` |
| `rreo_31_2026_b4_anexo01.json` | `/rreo?an_exercicio=2026&nr_periodo=4&co_tipo_demonstrativo=RREO&no_anexo=RREO-Anexo 01&id_ente=31` |
| `rreo_53_2026_b4_anexo01.json` | `/rreo?an_exercicio=2026&nr_periodo=4&co_tipo_demonstrativo=RREO&no_anexo=RREO-Anexo 01&id_ente=53` |
| `extrato_1_2026.json` | `/extrato_entregas?id_ente=1&an_referencia=2026` |
| `extrato_33_2026.json` | `/extrato_entregas?id_ente=33&an_referencia=2026` |
| `extrato_33_2025.json` | `/extrato_entregas?id_ente=33&an_referencia=2025` |
| `extrato_35_2026.json` | `/extrato_entregas?id_ente=35&an_referencia=2026` |

Base de todas as consultas: `https://apidatalake.tesouro.gov.br/ords/cdwhprd/siconfi/tt`.
