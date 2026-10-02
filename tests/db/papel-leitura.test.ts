import { afterAll, describe, expect, inject, it } from "vitest";
import pg from "pg";
import { PAPEL_LEITURA, provisionarPapelLeitura } from "../../src/server/db/papel-leitura.ts";

const urlAdmin = inject("databaseUrl");
const senha = "a1".repeat(20);
const admin = new pg.Pool({ connectionString: urlAdmin, max: 1 });

afterAll(async () => {
  await admin.query(`drop owned by ${PAPEL_LEITURA}`).catch(() => undefined);
  await admin.query(`drop role if exists ${PAPEL_LEITURA}`).catch(() => undefined);
  await admin.end();
});

function urlComo(usuario: string, senhaUsuario: string): string {
  const url = new URL(urlAdmin);
  url.username = usuario;
  url.password = senhaUsuario;
  return url.toString();
}

describe("papel somente leitura do site", () => {
  it("lê as tabelas, não escreve e pode ser provisionado de novo", async () => {
    const cliente = await admin.connect();
    try {
      await provisionarPapelLeitura(cliente, senha);
      await provisionarPapelLeitura(cliente, senha);
    } finally {
      cliente.release();
    }

    const leitor = new pg.Client({ connectionString: urlComo(PAPEL_LEITURA, senha) });
    await leitor.connect();
    try {
      await expect(leitor.query("select count(*) from snapshots_rreo")).resolves.toBeTruthy();
      await expect(leitor.query("insert into fontes (id, instituicao, dataset, url_documentacao, url_base) values ('x','x','x','x','x')")).rejects.toThrow(/permission denied/);
      await expect(leitor.query("create table invasao (id int)")).rejects.toThrow(/permission denied/);
    } finally {
      await leitor.end();
    }
  });

  it("recusa senha fraca ou com caracteres que quebrariam a URL", async () => {
    const cliente = await admin.connect();
    try {
      await expect(provisionarPapelLeitura(cliente, "curta")).rejects.toThrow();
      await expect(provisionarPapelLeitura(cliente, "x".repeat(31) + "@")).rejects.toThrow();
    } finally {
      cliente.release();
    }
  });
});
