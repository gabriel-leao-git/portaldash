import { describe, expect, it } from "vitest";
import { buscarRreo } from "../../src/server/integrations/siconfi/client.ts";
import { ClienteHttpSiconfi, montarUrl, SiconfiHttpError, type FetchLike } from "../../src/server/integrations/siconfi/http.ts";
import { PayloadInvalidoError } from "../../src/server/integrations/siconfi/parse.ts";
import { fixture, respostaJson } from "../helpers/fixtures.ts";

const semEspera = async () => undefined;
const URL_OK = montarUrl("entes", {});

function cliente(fetch: FetchLike, esperas: number[] = []) {
  return new ClienteHttpSiconfi({
    fetch,
    intervaloMinimoMs: 1_100,
    esperar: async (ms) => {
      esperas.push(ms);
    },
  });
}

describe("cliente HTTP do Siconfi", () => {
  it("só monta URLs do host e da base oficiais", () => {
    expect(montarUrl("rreo", { an_exercicio: 2025, no_anexo: "RREO-Anexo 01" })).toBe(
      "https://apidatalake.tesouro.gov.br/ords/cdwhprd/siconfi/tt/rreo?an_exercicio=2025&no_anexo=RREO-Anexo+01",
    );
    expect(() => montarUrl("admin" as never, {})).toThrow();
    expect(() => montarUrl("rreo", { "id_ente&x": 1 })).toThrow();
  });

  it("recusa URL fora da allowlist antes de qualquer requisição", async () => {
    let chamadas = 0;
    const c = cliente(async () => {
      chamadas++;
      return respostaJson("{}");
    });
    await expect(c.get("https://exemplo.com/ords/cdwhprd/siconfi/tt/rreo", 1_000)).rejects.toThrow(/allowlist/);
    await expect(c.get("http://apidatalake.tesouro.gov.br/ords/cdwhprd/siconfi/tt/rreo", 1_000)).rejects.toThrow(/allowlist/);
    expect(chamadas).toBe(0);
  });

  it("retenta 5xx e falha de rede, mas não 4xx", async () => {
    const status = [502, 503, 200];
    let n = 0;
    const c = cliente(async () => respostaJson('{"items":[],"hasMore":false,"count":0}', status[n++] ?? 200));
    await expect(c.get(URL_OK, 1_000)).resolves.toMatchObject({ httpStatus: 200 });
    expect(n).toBe(3);

    let m = 0;
    const c400 = cliente(async () => {
      m++;
      return respostaJson("{}", 400);
    });
    await expect(c400.get(URL_OK, 1_000)).rejects.toBeInstanceOf(SiconfiHttpError);
    expect(m).toBe(1);

    let r = 0;
    const cRede = cliente(async () => {
      r++;
      throw new TypeError("fetch failed");
    });
    await expect(cRede.get(URL_OK, 1_000)).rejects.toMatchObject({ retentavel: true });
    expect(r).toBe(3);
  });

  it("em 429 respeita Retry-After e desacelera o resto da execução", async () => {
    const esperas: number[] = [];
    let n = 0;
    const c = cliente(async () => {
      n++;
      return n === 1
        ? respostaJson("{}", 429, { "retry-after": "30" })
        : respostaJson('{"items":[],"hasMore":false,"count":0}');
    }, esperas);
    await expect(c.get(URL_OK, 1_000)).resolves.toMatchObject({ httpStatus: 200 });
    expect(Math.max(...esperas)).toBeGreaterThanOrEqual(30_000);
    expect(c.intervaloAtualMs).toBe(2_200);

    let m = 0;
    const semHeader = cliente(async () => {
      m++;
      return m === 1 ? respostaJson("{}", 429) : respostaJson('{"items":[],"hasMore":false,"count":0}');
    }, []);
    await expect(semHeader.get(URL_OK, 1_000)).resolves.toMatchObject({ httpStatus: 200 });
  });

  it("respeita o intervalo mínimo entre requisições sequenciais", async () => {
    const esperas: number[] = [];
    const c = cliente(async () => respostaJson('{"items":[],"hasMore":false,"count":0}'), esperas);
    await c.get(URL_OK, 1_000);
    await c.get(URL_OK, 1_000);
    expect(esperas.length).toBe(1);
    expect(esperas[0]).toBeGreaterThan(1_000);
  });

  it("recusa página de bloqueio em HTML e corpo acima do limite", async () => {
    const html = cliente(async () => new Response("<html>bloqueado</html>", { status: 200, headers: { "content-type": "text/html" } }));
    await expect(html.get(URL_OK, 1_000)).rejects.toThrow(/Content-Type/);

    const grande = cliente(
      async () =>
        new Response("x", { status: 200, headers: { "content-type": "application/json", "content-length": String(64 * 1024 * 1024) } }),
    );
    await expect(grande.get(URL_OK, 1_000)).rejects.toThrow(/limite/);
  });

  it("trata redirect como erro e envia timeout em toda requisição", async () => {
    let init: RequestInit | undefined;
    const c = cliente(async (_url, i) => {
      init = i;
      return respostaJson('{"items":[],"hasMore":false,"count":0}');
    });
    await c.get(URL_OK, 1_000);
    expect(init?.redirect).toBe("error");
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });

  it("corta corpo em streaming acima do limite mesmo sem content-length", async () => {
    const pedaco = new Uint8Array(1024 * 1024);
    let enviados = 0;
    const c = cliente(
      async () =>
        new Response(
          new ReadableStream({
            pull(controller) {
              if (enviados >= 20) return controller.close();
              enviados++;
              controller.enqueue(pedaco);
            },
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
    );
    await expect(c.get(URL_OK, 1_000)).rejects.toThrow(/limite/);
    expect(enviados).toBeLessThan(20);
  });

  it("recusa paginação anômala: hasMore com página vazia e excesso de páginas", async () => {
    const consulta = { exercicio: 2026, periodo: 4, demonstrativo: "RREO" as const, anexo: "RREO-Anexo 01", codIbge: 35 };
    const vazia = new ClienteHttpSiconfi({
      esperar: semEspera,
      fetch: async () => respostaJson('{"items":[],"hasMore":true,"count":0}'),
    });
    await expect(buscarRreo(vazia, consulta)).rejects.toBeInstanceOf(PayloadInvalidoError);

    const item = (JSON.parse(fixture("rreo_35_2026_b4_anexo01.json")) as { items: unknown[] }).items[0];
    const infinita = new ClienteHttpSiconfi({
      esperar: semEspera,
      fetch: async () => respostaJson(JSON.stringify({ items: [item], hasMore: true, count: 1 })),
    });
    await expect(buscarRreo(infinita, consulta)).rejects.toThrow(/páginas/);
  });

  it("pagina montando o offset localmente e rejeita item de outro ente", async () => {
    const corpo = JSON.parse(fixture("rreo_35_2026_b4_anexo01.json")) as { items: unknown[] };
    const metade = Math.floor(corpo.items.length / 2);
    const urls: string[] = [];
    const c = new ClienteHttpSiconfi({
      esperar: semEspera,
      fetch: async (input) => {
        urls.push(input);
        const offset = Number(new URL(input).searchParams.get("offset") ?? "0");
        const pagina = offset === 0 ? corpo.items.slice(0, metade) : corpo.items.slice(metade);
        return respostaJson(JSON.stringify({ items: pagina, hasMore: offset === 0, count: pagina.length }));
      },
    });
    const r = await buscarRreo(c, { exercicio: 2026, periodo: 4, demonstrativo: "RREO", anexo: "RREO-Anexo 01", codIbge: 35 });
    expect(r.itens).toHaveLength(corpo.items.length);
    expect(urls[1]).toContain(`offset=${metade}`);

    await expect(
      buscarRreo(c, { exercicio: 2026, periodo: 4, demonstrativo: "RREO", anexo: "RREO-Anexo 01", codIbge: 33 }),
    ).rejects.toBeInstanceOf(PayloadInvalidoError);
  });
});
