/**
 * Ingestão do Siconfi (RREO-Anexo 01 + extrato de entregas).
 *
 * Uso: pnpm ingest [--exercicios=2026,2025] [--periodos=1-4] [--entes=todos|1,33|RJ,SP]
 *                  [--forcar] [--reverificar-dias=7] [--origem=cli|cron]
 *
 * Sem argumentos: exercício atual e anterior, todos os bimestres entregues,
 * União + 26 estados + DF. Nunca é exposta por HTTP.
 */
import { parseArgs } from "node:util";
import { ENTES_NO_ESCOPO, estadoPorUf, entePorCodigo } from "../src/lib/entes.ts";
import { urlBancoEscrita } from "../src/server/config/env.ts";
import { criarDb, criarPoolEscrita } from "../src/server/db/pool.ts";
import { executarIngestao, type EscopoIngestao } from "../src/server/ingestion/executar.ts";

function intervalo(texto: string, min: number, max: number): number[] {
  const valores = new Set<number>();
  for (const parte of texto.split(",")) {
    const m = /^(\d+)(?:-(\d+))?$/.exec(parte.trim());
    if (!m) throw new Error(`Valor inválido: ${parte}`);
    const inicio = Number(m[1]);
    const fim = m[2] === undefined ? inicio : Number(m[2]);
    if (inicio < min || fim > max || inicio > fim) throw new Error(`Fora do intervalo ${min}-${max}: ${parte}`);
    for (let v = inicio; v <= fim; v++) valores.add(v);
  }
  return [...valores].sort((a, b) => a - b);
}

function entes(texto: string): number[] {
  if (texto === "todos") return ENTES_NO_ESCOPO.map((e) => e.codIbge);
  return texto.split(",").map((parte) => {
    const p = parte.trim();
    const ente = /^\d+$/.test(p) ? entePorCodigo(Number(p)) : estadoPorUf(p);
    if (!ente) throw new Error(`Ente fora do escopo: ${p}`);
    return ente.codIbge;
  });
}

const { values } = parseArgs({
  options: {
    exercicios: { type: "string" },
    periodos: { type: "string" },
    entes: { type: "string", default: "todos" },
    forcar: { type: "boolean", default: false },
    "reverificar-dias": { type: "string", default: "7" },
    origem: { type: "string", default: "cli" },
  },
  strict: true,
});

const anoAtual = new Date().getUTCFullYear();
const escopo: EscopoIngestao = {
  exercicios: values.exercicios ? intervalo(values.exercicios, 2015, anoAtual) : [anoAtual, anoAtual - 1],
  codIbges: entes(values.entes),
  periodos: values.periodos ? intervalo(values.periodos, 1, 6) : undefined,
  forcar: values.forcar,
  reverificarAposDias: intervalo(values["reverificar-dias"], 0, 365)[0] ?? 7,
};
const origem = values.origem === "cron" ? "cron" : "cli";

const pool = criarPoolEscrita(urlBancoEscrita());
try {
  const resumo = await executarIngestao(
    { db: criarDb(pool), pool, log: (m) => console.log(`[ingestao] ${m}`) },
    escopo,
    origem,
  );
  console.log(JSON.stringify(resumo, null, 2));
  process.exitCode = resumo.situacao === "falhou" ? 1 : 0;
} catch (erro) {
  console.error(`[ingestao] falhou: ${erro instanceof Error ? erro.message : "erro desconhecido"}`);
  process.exitCode = 1;
} finally {
  await pool.end();
}
