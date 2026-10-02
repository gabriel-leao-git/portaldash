/**
 * Parâmetros fixos da integração com a API de dados abertos do Siconfi.
 * Contrato: https://apidatalake.tesouro.gov.br/docs/siconfi.yaml (Swagger 2.0,
 * versão 1.1.0 "beta"). Detalhes e evidências em docs/data-contract.md.
 */

export const SICONFI_FONTE_ID = "siconfi";
export const SICONFI_HOST = "apidatalake.tesouro.gov.br";
export const SICONFI_BASE_PATH = "/ords/cdwhprd/siconfi/tt/";
export const SICONFI_DOC_URL =
  "https://www.tesourotransparente.gov.br/consultas/consultas-siconfi/siconfi-api-de-dados-abertos";

export const SICONFI_ENDPOINTS = ["rreo", "extrato_entregas", "entes"] as const;
export type SiconfiEndpoint = (typeof SICONFI_ENDPOINTS)[number];

/**
 * O contrato limita a 1 requisição por segundo, mas a CDN respondeu 429 em ~20%
 * das requisições a 1,1 s de intervalo (execução de 2026-10-02); usamos 1,5 s
 * e o cliente desacelera sozinho ao receber 429.
 */
export const INTERVALO_MINIMO_MS = 1_500;
export const TIMEOUT_DADOS_MS = 60_000;
export const TIMEOUT_METADADOS_MS = 180_000;
export const TAMANHO_MAXIMO_BYTES = 16 * 1024 * 1024;
export const MAX_TENTATIVAS = 3;
export const MAX_PAGINAS = 10;
export const ITENS_POR_PAGINA = 5_000;

export const USER_AGENT = "PortalDash-ingestao/0.1 (+https://github.com/gabriel-leao-git/portaldash)";
