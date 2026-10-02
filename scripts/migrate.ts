/**
 * Aplica as migrations SQL versionadas em database/migrations.
 * Exige INGEST_DATABASE_URL, com permissão de DDL (nunca a credencial do site).
 */
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { urlBancoMigracao } from "../src/server/config/env.ts";
import { criarDb, criarPoolEscrita } from "../src/server/db/pool.ts";

const pool = criarPoolEscrita(urlBancoMigracao());
try {
  await migrate(criarDb(pool), { migrationsFolder: "database/migrations" });
  console.log("[migrate] migrations aplicadas");
} catch (erro) {
  console.error(`[migrate] falhou: ${erro instanceof Error ? erro.message : "erro desconhecido"}`);
  process.exitCode = 1;
} finally {
  await pool.end();
}
