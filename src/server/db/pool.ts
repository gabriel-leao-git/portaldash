import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";
import { urlBancoLeitura } from "../config/env.ts";
import * as schema from "./schema.ts";

export type Db = NodePgDatabase<typeof schema>;

/** Sessões do site: transações somente leitura e consultas com teto de tempo. */
export function criarPoolLeitura(connectionString: string): pg.Pool {
  return new pg.Pool({
    connectionString,
    max: 5,
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 30_000,
    options: "-c default_transaction_read_only=on -c statement_timeout=5000",
    application_name: "portaldash-web",
  });
}

export function criarPoolEscrita(connectionString: string): pg.Pool {
  return new pg.Pool({
    connectionString,
    max: 2,
    connectionTimeoutMillis: 10_000,
    options: "-c statement_timeout=120000",
    application_name: "portaldash-ingestao",
  });
}

export function criarDb(pool: pg.Pool): Db {
  return drizzle(pool, { schema });
}

const globalParaDb = globalThis as typeof globalThis & { __portaldashDbLeitura?: Db };

/** Instância única por processo (sobrevive ao recarregamento do next dev). */
export function dbLeitura(): Db {
  globalParaDb.__portaldashDbLeitura ??= criarDb(criarPoolLeitura(urlBancoLeitura()));
  return globalParaDb.__portaldashDbLeitura;
}
