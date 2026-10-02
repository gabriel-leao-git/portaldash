import { mkdtemp, rm } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import EmbeddedPostgres from "embedded-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import type { TestProject } from "vitest/node";
import { criarDb, criarPoolEscrita } from "../../src/server/db/pool.ts";

declare module "vitest" {
  export interface ProvidedContext {
    databaseUrl: string;
  }
}

function portaLivre(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.unref();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const endereco = server.address();
      server.close(() => (typeof endereco === "object" && endereco ? resolve(endereco.port) : reject(new Error("porta"))));
    });
  });
}

async function aplicarMigrations(url: string): Promise<void> {
  const pool = criarPoolEscrita(url);
  try {
    await migrate(criarDb(pool), { migrationsFolder: "database/migrations" });
  } finally {
    await pool.end();
  }
}

/**
 * Banco descartável para os testes. Com TEST_DATABASE_URL (ex.: serviço
 * PostgreSQL na CI) usa esse banco; senão sobe um PostgreSQL embutido.
 */
export default async function setup(project: TestProject) {
  const externo = process.env.TEST_DATABASE_URL;
  if (externo) {
    await aplicarMigrations(externo);
    project.provide("databaseUrl", externo);
    return;
  }

  const dir = await mkdtemp(join(tmpdir(), "portaldash-pg-"));
  const port = await portaLivre();
  const password = randomBytes(12).toString("hex");
  const pg = new EmbeddedPostgres({
    databaseDir: dir,
    port,
    user: "postgres",
    password,
    persistent: false,
    initdbFlags: ["--encoding=UTF8", "--locale=C"],
    onLog: () => undefined,
  });
  await pg.initialise();
  await pg.start();
  await pg.createDatabase("portaldash_teste");
  const url = `postgresql://postgres:${password}@127.0.0.1:${port}/portaldash_teste`;
  await aplicarMigrations(url);
  project.provide("databaseUrl", url);

  return async () => {
    await pg.stop();
    await rm(dir, { recursive: true, force: true });
  };
}
