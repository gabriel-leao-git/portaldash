/**
 * PostgreSQL local para desenvolvimento, sem Docker (binários do pacote
 * embedded-postgres). Dados persistem em .data/postgres (ignorado pelo git).
 * Escuta só em localhost. Não use em produção.
 *
 * Uso: pnpm db:dev  →  DATABASE_URL=postgresql://postgres:portaldash@127.0.0.1:54329/portaldash
 */
import { existsSync } from "node:fs";
import EmbeddedPostgres from "embedded-postgres";

const PORTA = Number(process.env.DEV_DB_PORT ?? "54329");
const DIR = ".data/postgres";
const jaExiste = existsSync(`${DIR}/PG_VERSION`);

const pg = new EmbeddedPostgres({
  databaseDir: DIR,
  port: PORTA,
  user: "postgres",
  password: "portaldash",
  persistent: true,
  initdbFlags: ["--encoding=UTF8", "--locale=C"],
  onLog: () => undefined,
});

if (!jaExiste) await pg.initialise();
await pg.start();
if (!jaExiste) await pg.createDatabase("portaldash");

console.log(`[dev-db] pronto: postgresql://postgres:portaldash@127.0.0.1:${PORTA}/portaldash`);
console.log("[dev-db] Ctrl+C para parar.");

const parar = async () => {
  await pg.stop();
  process.exit(0);
};
process.on("SIGINT", parar);
process.on("SIGTERM", parar);
setInterval(() => undefined, 60_000);
