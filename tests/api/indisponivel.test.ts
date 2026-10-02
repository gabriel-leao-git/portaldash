import { createServer } from "node:net";
import { beforeAll, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";

/** Porta local livre e sem nada escutando: conexão ao banco é recusada. */
const portaFechada = await new Promise<number>((resolve, reject) => {
  const server = createServer();
  server.on("error", reject);
  server.listen(0, "127.0.0.1", () => {
    const endereco = server.address();
    server.close(() => (typeof endereco === "object" && endereco ? resolve(endereco.port) : reject(new Error("porta"))));
  });
});
process.env.DATABASE_URL = `postgresql://usuario:segredo@127.0.0.1:${portaFechada}/inexistente`;

const rotas = {
  brasil: (await import("../../src/app/api/v1/brasil/route.ts")).GET,
  estados: (await import("../../src/app/api/v1/estados/route.ts")).GET,
  estado: (await import("../../src/app/api/v1/estados/[uf]/route.ts")).GET,
  fontes: (await import("../../src/app/api/v1/fontes/route.ts")).GET,
  health: (await import("../../src/app/api/v1/health/route.ts")).GET,
};

const req = (caminho: string) => new NextRequest(`http://localhost${caminho}`);

describe("API com banco indisponível", () => {
  let respostas: Response[] = [];
  beforeAll(async () => {
    respostas = await Promise.all([
      rotas.brasil(req("/api/v1/brasil")),
      rotas.estados(req("/api/v1/estados?ano=2026&bimestre=4")),
      rotas.estado(req("/api/v1/estados/rj"), { params: Promise.resolve({ uf: "rj" }) }),
      rotas.fontes(req("/api/v1/fontes")),
      rotas.health(),
    ]);
  });

  it("responde 503 genérico, sem cache e sem detalhes internos", async () => {
    for (const r of respostas) {
      expect(r.status).toBe(503);
      expect(r.headers.get("cache-control")).toBe("no-store");
      const texto = await r.clone().text();
      expect(JSON.parse(texto).erro.codigo).toBe("indisponivel");
      for (const proibido of ["127.0.0.1", String(portaFechada), "postgres", "segredo", "ECONNREFUSED", "usuario"]) {
        expect(texto).not.toContain(proibido);
      }
    }
  });

  it("parâmetro inválido continua 400, sem tocar no banco", async () => {
    const r = await rotas.estados(req("/api/v1/estados?ano=abc"));
    expect(r.status).toBe(400);
  });
});
