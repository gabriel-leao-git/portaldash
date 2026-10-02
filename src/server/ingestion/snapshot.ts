import { createHash } from "node:crypto";
import type { ItemRreo } from "../integrations/siconfi/parse.ts";
import { ANEXO_BALANCO_ORCAMENTARIO, METODOLOGIA_VERSAO } from "../methodology/indicador.ts";
import { verificarAnexo01, type Verificacoes } from "../methodology/verificacoes.ts";

export type Celula = {
  rotulo: string;
  coluna: string;
  codConta: string;
  conta: string;
  valorTexto: string;
  valor: string;
};

export type SnapshotMontado = {
  celulas: Celula[];
  conteudoSha256: string;
  verificacoes: Verificacoes;
};

export class SnapshotInvalidoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SnapshotInvalidoError";
  }
}

const SEP = "\u001f";
const chaveCelula = (c: Pick<Celula, "rotulo" | "coluna" | "codConta" | "conta">) =>
  [c.rotulo, c.coluna, c.codConta, c.conta].join(SEP);

/**
 * Monta o conteúdo canônico de uma declaração. Qualquer chave repetida
 * invalida a resposta inteira: sem ordenação garantida entre páginas, uma
 * repetição pode indicar outra linha pulada (docs/data-contract.md 1.4).
 */
export function montarSnapshot(anexo: string, itens: readonly ItemRreo[]): SnapshotMontado {
  if (itens.length === 0) throw new SnapshotInvalidoError("Resposta sem células");
  const porChave = new Map<string, Celula>();
  for (const item of itens) {
    const celula: Celula = {
      rotulo: item.rotulo,
      coluna: item.coluna,
      codConta: item.codConta,
      conta: item.conta,
      valorTexto: item.valorTexto,
      valor: item.valor,
    };
    const chave = chaveCelula(celula);
    if (porChave.has(chave)) {
      throw new SnapshotInvalidoError(`Chave repetida na resposta: ${celula.codConta} / ${celula.coluna}`);
    }
    porChave.set(chave, celula);
  }

  const celulas = [...porChave.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([, c]) => c);
  const canonico = celulas.map((c) => `${chaveCelula(c)}${SEP}${c.valor}`).join("\n");
  const conteudoSha256 = createHash("sha256").update(canonico, "utf8").digest("hex");

  const verificacoes: Verificacoes =
    anexo === ANEXO_BALANCO_ORCAMENTARIO
      ? verificarAnexo01(celulas)
      : { metodologia: METODOLOGIA_VERSAO, aprovado: true, composicaoConsistente: true, resultados: [] };

  return { celulas, conteudoSha256, verificacoes };
}
