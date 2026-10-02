import type pg from "pg";

export const PAPEL_LEITURA = "portaldash_leitura";

/**
 * Cria (ou atualiza a senha de) um papel somente leitura para o site e garante
 * SELECT nas tabelas atuais e futuras do schema public. Idempotente. A senha
 * vem de variável de ambiente e só trafega como parâmetro de consulta; nunca é
 * registrada em log nem versionada.
 */
export async function provisionarPapelLeitura(cliente: pg.ClientBase, senha: string): Promise<void> {
  if (!/^[A-Za-z0-9]{32,128}$/.test(senha)) {
    throw new Error("LEITURA_DB_PASSWORD deve ter de 32 a 128 caracteres alfanuméricos");
  }
  const existe = await cliente.query("select 1 from pg_roles where rolname = $1", [PAPEL_LEITURA]);
  const verbo = existe.rowCount ? "ALTER ROLE" : "CREATE ROLE";
  const { rows } = await cliente.query<{ sql: string }>(
    `select format('${verbo} %I LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE PASSWORD %L', $1::text, $2::text) as sql`,
    [PAPEL_LEITURA, senha],
  );
  const comando = rows[0]?.sql;
  if (!comando) throw new Error("Falha ao montar o comando do papel de leitura");
  await cliente.query(comando);
  const banco = await cliente.query<{ nome: string }>("select current_database() as nome");
  const nomeBanco = banco.rows[0]?.nome;
  if (!nomeBanco) throw new Error("Banco atual não identificado");
  const grants = await cliente.query<{ sql: string }>(
    `select unnest(array[
       format('GRANT CONNECT ON DATABASE %I TO %I', $1::text, $2::text),
       format('GRANT USAGE ON SCHEMA public TO %I', $2::text),
       format('GRANT SELECT ON ALL TABLES IN SCHEMA public TO %I', $2::text),
       format('ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO %I', $2::text)
     ]) as sql`,
    [nomeBanco, PAPEL_LEITURA],
  );
  for (const g of grants.rows) await cliente.query(g.sql);
}
