import { createHash } from "node:crypto";
import {
  INTERVALO_MINIMO_MS,
  MAX_TENTATIVAS,
  SICONFI_BASE_PATH,
  SICONFI_ENDPOINTS,
  SICONFI_HOST,
  TAMANHO_MAXIMO_BYTES,
  USER_AGENT,
  type SiconfiEndpoint,
} from "./config.ts";

export type FetchLike = (input: string, init: RequestInit) => Promise<Response>;

export type RegistroRequisicao = {
  url: string;
  iniciadaEm: Date;
  duracaoMs: number;
  httpStatus: number | null;
  etag: string | null;
  xCache: string | null;
  erro: string | null;
};

export type RespostaBruta = {
  url: string;
  corpo: string;
  sha256: string;
  bytes: number;
  httpStatus: number;
  etag: string | null;
  xCache: string | null;
  iniciadaEm: Date;
};

export class SiconfiHttpError extends Error {
  readonly retentavel: boolean;
  readonly httpStatus: number | null;
  /** Espera mínima antes da próxima tentativa (429 com ou sem Retry-After). */
  readonly esperaMs: number | null;

  constructor(message: string, retentavel: boolean, httpStatus: number | null = null, esperaMs: number | null = null) {
    super(message);
    this.name = "SiconfiHttpError";
    this.retentavel = retentavel;
    this.httpStatus = httpStatus;
    this.esperaMs = esperaMs;
  }
}

const ESPERA_PADRAO_429_MS = 10_000;
const ESPERA_MAXIMA_429_MS = 120_000;

/** Retry-After em segundos ou data HTTP; null se ausente ou ilegível. */
export function lerRetryAfter(valor: string | null, agora: number): number | null {
  if (!valor) return null;
  if (/^\d+$/.test(valor.trim())) return Number(valor.trim()) * 1_000;
  const data = Date.parse(valor);
  return Number.isNaN(data) ? null : Math.max(0, data - agora);
}

type Parametro = string | number;

/** Monta a URL a partir de endpoint e parâmetros tipados; nunca de texto livre. */
export function montarUrl(endpoint: SiconfiEndpoint, params: Record<string, Parametro>): string {
  if (!SICONFI_ENDPOINTS.includes(endpoint)) throw new Error(`Endpoint fora da allowlist: ${endpoint}`);
  const url = new URL(`https://${SICONFI_HOST}${SICONFI_BASE_PATH}${endpoint}`);
  for (const [nome, valor] of Object.entries(params)) {
    if (!/^[a-z_]+$/.test(nome)) throw new Error(`Nome de parâmetro inválido: ${nome}`);
    if (typeof valor === "number" && !Number.isSafeInteger(valor)) {
      throw new Error(`Parâmetro numérico inválido: ${nome}`);
    }
    url.searchParams.set(nome, String(valor));
  }
  return url.toString();
}

function assertUrlPermitida(url: string): void {
  const parsed = new URL(url);
  if (
    parsed.protocol !== "https:" ||
    parsed.hostname !== SICONFI_HOST ||
    parsed.port !== "" ||
    !parsed.pathname.startsWith(SICONFI_BASE_PATH) ||
    parsed.username !== "" ||
    parsed.password !== ""
  ) {
    throw new Error("URL fora da allowlist da integração Siconfi");
  }
}

async function lerCorpoLimitado(response: Response, limite: number): Promise<Uint8Array> {
  const declarado = Number(response.headers.get("content-length") ?? "0");
  if (declarado > limite) throw new SiconfiHttpError("Resposta maior que o limite", false, response.status);
  if (!response.body) return new Uint8Array();
  const reader = response.body.getReader();
  const partes: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > limite) {
      await reader.cancel();
      throw new SiconfiHttpError("Resposta maior que o limite", false, response.status);
    }
    partes.push(value);
  }
  const corpo = new Uint8Array(total);
  let offset = 0;
  for (const parte of partes) {
    corpo.set(parte, offset);
    offset += parte.byteLength;
  }
  return corpo;
}

const esperar = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export type ClienteHttpOpcoes = {
  fetch?: FetchLike;
  intervaloMinimoMs?: number;
  maxTentativas?: number;
  esperar?: (ms: number) => Promise<void>;
  aoRegistrar?: (registro: RegistroRequisicao) => Promise<void> | void;
};

/**
 * Cliente HTTP sequencial: uma requisição por vez, com intervalo mínimo entre
 * elas (vale também para retentativas). Retenta só erro de rede, timeout, 5xx
 * e 429; depois de um 429 o intervalo dobra (até 6 s) pelo resto da execução,
 * porque a CDN da fonte limita abaixo do 1 req/s documentado.
 */
export class ClienteHttpSiconfi {
  private readonly fetchImpl: FetchLike;
  private intervaloMinimoMs: number;
  private readonly maxTentativas: number;
  private readonly esperar: (ms: number) => Promise<void>;
  private readonly aoRegistrar?: ClienteHttpOpcoes["aoRegistrar"];
  private ultimaRequisicao = 0;
  private fila: Promise<unknown> = Promise.resolve();

  constructor(opcoes: ClienteHttpOpcoes = {}) {
    this.fetchImpl = opcoes.fetch ?? ((input, init) => fetch(input, init));
    this.intervaloMinimoMs = opcoes.intervaloMinimoMs ?? INTERVALO_MINIMO_MS;
    this.maxTentativas = opcoes.maxTentativas ?? MAX_TENTATIVAS;
    this.esperar = opcoes.esperar ?? esperar;
    this.aoRegistrar = opcoes.aoRegistrar;
  }

  get intervaloAtualMs(): number {
    return this.intervaloMinimoMs;
  }

  get(url: string, timeoutMs: number): Promise<RespostaBruta> {
    const tarefa = this.fila.then(() => this.getComRetentativas(url, timeoutMs));
    this.fila = tarefa.catch(() => undefined);
    return tarefa;
  }

  private async getComRetentativas(url: string, timeoutMs: number): Promise<RespostaBruta> {
    assertUrlPermitida(url);
    let ultimoErro: unknown;
    let esperaAntes = 0;
    for (let tentativa = 1; tentativa <= this.maxTentativas; tentativa++) {
      if (tentativa > 1) {
        const base = 2_000 * 2 ** (tentativa - 2);
        await this.esperar(Math.max(base, esperaAntes) + Math.floor(Math.random() * 500));
      }
      try {
        return await this.getUmaVez(url, timeoutMs);
      } catch (erro) {
        ultimoErro = erro;
        if (!(erro instanceof SiconfiHttpError) || !erro.retentavel) throw erro;
        if (erro.httpStatus === 429) {
          this.intervaloMinimoMs = Math.min(this.intervaloMinimoMs * 2, 6_000);
          esperaAntes = erro.esperaMs ?? ESPERA_PADRAO_429_MS * tentativa;
        } else {
          esperaAntes = 0;
        }
      }
    }
    throw ultimoErro;
  }

  private async getUmaVez(url: string, timeoutMs: number): Promise<RespostaBruta> {
    const desdeUltima = Date.now() - this.ultimaRequisicao;
    if (desdeUltima < this.intervaloMinimoMs) await this.esperar(this.intervaloMinimoMs - desdeUltima);

    const iniciadaEm = new Date();
    this.ultimaRequisicao = iniciadaEm.getTime();
    const registro: RegistroRequisicao = {
      url,
      iniciadaEm,
      duracaoMs: 0,
      httpStatus: null,
      etag: null,
      xCache: null,
      erro: null,
    };

    try {
      let response: Response;
      try {
        response = await this.fetchImpl(url, {
          method: "GET",
          redirect: "error",
          signal: AbortSignal.timeout(timeoutMs),
          headers: {
            accept: "application/json",
            "accept-encoding": "identity",
            "user-agent": USER_AGENT,
          },
        });
      } catch (erro) {
        const motivo = erro instanceof Error ? erro.name : "erro";
        throw new SiconfiHttpError(`Falha de rede ou timeout (${motivo})`, true);
      }

      registro.httpStatus = response.status;
      registro.etag = response.headers.get("etag");
      registro.xCache = response.headers.get("x-cache");

      if (response.status === 429) {
        const retryAfter = response.headers.get("retry-after");
        const espera = lerRetryAfter(retryAfter, Date.now());
        await response.body?.cancel();
        throw new SiconfiHttpError(
          `HTTP 429${retryAfter ? ` (retry-after: ${retryAfter.slice(0, 40)})` : " (sem retry-after)"}`,
          true,
          429,
          espera === null ? null : Math.min(espera, ESPERA_MAXIMA_429_MS),
        );
      }
      if (response.status >= 500) {
        await response.body?.cancel();
        throw new SiconfiHttpError(`HTTP ${response.status}`, true, response.status);
      }
      if (response.status !== 200) {
        await response.body?.cancel();
        throw new SiconfiHttpError(`HTTP ${response.status}`, false, response.status);
      }
      const tipo = response.headers.get("content-type") ?? "";
      if (!tipo.toLowerCase().startsWith("application/json")) {
        await response.body?.cancel();
        throw new SiconfiHttpError("Content-Type inesperado", false, response.status);
      }

      const bytes = await lerCorpoLimitado(response, TAMANHO_MAXIMO_BYTES);
      const corpo = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
      return {
        url,
        corpo,
        sha256: createHash("sha256").update(bytes).digest("hex"),
        bytes: bytes.byteLength,
        httpStatus: response.status,
        etag: registro.etag,
        xCache: registro.xCache,
        iniciadaEm,
      };
    } catch (erro) {
      registro.erro = erro instanceof Error ? erro.message : "erro desconhecido";
      throw erro;
    } finally {
      registro.duracaoMs = Date.now() - iniciadaEm.getTime();
      await this.aoRegistrar?.(registro);
    }
  }
}
