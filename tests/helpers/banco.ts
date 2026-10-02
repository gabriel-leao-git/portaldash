import { inject } from "vitest";
import { sql } from "drizzle-orm";
import { criarDb, criarPoolEscrita, type Db } from "../../src/server/db/pool.ts";
import type pg from "pg";

export function conectarBancoTeste(): { pool: pg.Pool; db: Db } {
  const pool = criarPoolEscrita(inject("databaseUrl"));
  return { pool, db: criarDb(pool) };
}

export async function limparBanco(db: Db): Promise<void> {
  await db.execute(sql`
    truncate celulas_rreo, snapshots_rreo, entregas_observadas, requisicoes,
             respostas_brutas, execucoes_ingestao, entes, fontes
    restart identity cascade
  `);
}
