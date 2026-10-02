/**
 * Aplica as migrations SQL versionadas em database/migrations e, se
 * LEITURA_DB_PASSWORD existir, provisiona o papel somente leitura do site.
 * Exige INGEST_DATABASE_URL, com permissão de DDL (nunca a credencial do site).
 */
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { urlBancoMigracao } from "../src/server/config/env.ts";
import { PAPEL_LEITURA, provisionarPapelLeitura } from "../src/server/db/papel-leitura.ts";
import { criarDb, criarPoolEscrita } from "../src/server/db/pool.ts";

const pool = criarPoolEscrita(urlBancoMigracao());
try {
  await migrate(criarDb(pool), { migrationsFolder: "database/migrations" });
  console.log("[migrate] migrations aplicadas");
  const senha = process.env.LEITURA_DB_PASSWORD?.trim();
  if (senha) {
    const cliente = await pool.connect();
    try {
      await provisionarPapelLeitura(cliente, senha);
      console.log(`[migrate] papel ${PAPEL_LEITURA} provisionado`);
    } finally {
      cliente.release();
    }
  }
} catch (erro) {
  console.error(`[migrate] falhou: ${erro instanceof Error ? erro.message : "erro desconhecido"}`);
  process.exitCode = 1;
} finally {
  await pool.end();
}
