/**
 * Leitura das variáveis de ambiente do servidor. Nenhuma credencial é
 * exposta ao navegador (nada aqui usa o prefixo NEXT_PUBLIC_) nem registrada
 * em log: mensagens de erro citam só o nome da variável.
 */

export class ConfiguracaoAusenteError extends Error {
  constructor(nome: string) {
    super(`Variável de ambiente ${nome} ausente ou inválida`);
    this.name = "ConfiguracaoAusenteError";
  }
}

function urlPostgres(nome: string): string | undefined {
  const valor = process.env[nome]?.trim();
  if (!valor) return undefined;
  if (!/^postgres(ql)?:\/\//.test(valor)) throw new ConfiguracaoAusenteError(nome);
  return valor;
}

/** Conexão usada pelo site e pela API pública (somente leitura na sessão). */
export function urlBancoLeitura(): string {
  const url = urlPostgres("DATABASE_URL");
  if (!url) throw new ConfiguracaoAusenteError("DATABASE_URL");
  return url;
}

/** Conexão usada pela ingestão; cai para DATABASE_URL (desenvolvimento local). */
export function urlBancoEscrita(): string {
  const url = urlPostgres("INGEST_DATABASE_URL") ?? urlPostgres("DATABASE_URL");
  if (!url) throw new ConfiguracaoAusenteError("INGEST_DATABASE_URL ou DATABASE_URL");
  return url;
}

/**
 * Conexão das migrations (DDL). Exige INGEST_DATABASE_URL, sem fallback: o
 * serviço web, que só tem DATABASE_URL de leitura, nunca roda migrations.
 */
export function urlBancoMigracao(): string {
  const url = urlPostgres("INGEST_DATABASE_URL");
  if (!url) throw new ConfiguracaoAusenteError("INGEST_DATABASE_URL");
  return url;
}
