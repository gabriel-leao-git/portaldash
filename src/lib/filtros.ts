/**
 * Filtros públicos (API e páginas). Contrato: docs/data-contract.md, Parte 2.
 * "bimestre" é sempre o bimestre do exercício (1 = jan–fev … 6 = nov–dez).
 */

export const ANO_MINIMO = 2015;
export const CONCEITOS_PERMITIDOS = ["pago"] as const;
export type ConceitoFiltro = (typeof CONCEITOS_PERMITIDOS)[number];

export type FiltrosSolicitados = {
  ano?: number;
  bimestre?: number;
  conceito: ConceitoFiltro;
};

export type ErroFiltro = { campo: string; mensagem: string };

export type ResultadoFiltros = { ok: true; filtros: FiltrosSolicitados } | { ok: false; erros: ErroFiltro[] };

type Entrada = URLSearchParams | Record<string, string | string[] | undefined>;

const PERMITIDOS = new Set(["ano", "bimestre", "conceito"]);

function valores(entrada: Entrada, nome: string): string[] {
  if (entrada instanceof URLSearchParams) return entrada.getAll(nome);
  const v = entrada[nome];
  return v === undefined ? [] : Array.isArray(v) ? v : [v];
}

function nomes(entrada: Entrada): string[] {
  return entrada instanceof URLSearchParams ? [...new Set(entrada.keys())] : Object.keys(entrada);
}

/**
 * `estrito`: parâmetros desconhecidos viram erro (API). Nas páginas eles são
 * ignorados, para links com parâmetros de rastreamento não quebrarem.
 */
export function lerFiltros(entrada: Entrada, opcoes: { estrito: boolean; anoAtual: number }): ResultadoFiltros {
  const erros: ErroFiltro[] = [];

  if (opcoes.estrito) {
    for (const nome of nomes(entrada)) {
      if (!PERMITIDOS.has(nome)) erros.push({ campo: nome.slice(0, 40), mensagem: "Parâmetro desconhecido" });
    }
  }

  const unico = (nome: string): string | undefined => {
    const lista = valores(entrada, nome);
    if (lista.length > 1) erros.push({ campo: nome, mensagem: "Parâmetro repetido" });
    const v = lista[0];
    return v === undefined || v === "" ? undefined : v;
  };

  const anoTexto = unico("ano");
  const bimestreTexto = unico("bimestre");
  const conceitoTexto = unico("conceito");

  let ano: number | undefined;
  if (anoTexto !== undefined) {
    if (!/^\d{4}$/.test(anoTexto) || Number(anoTexto) < ANO_MINIMO || Number(anoTexto) > opcoes.anoAtual) {
      erros.push({ campo: "ano", mensagem: `Use um ano entre ${ANO_MINIMO} e ${opcoes.anoAtual}` });
    } else {
      ano = Number(anoTexto);
    }
  }

  let bimestre: number | undefined;
  if (bimestreTexto !== undefined) {
    if (!/^[1-6]$/.test(bimestreTexto)) {
      erros.push({ campo: "bimestre", mensagem: "Use um bimestre de 1 a 6" });
    } else if (anoTexto === undefined) {
      erros.push({ campo: "bimestre", mensagem: "Informe também o ano" });
    } else {
      bimestre = Number(bimestreTexto);
    }
  }

  let conceito: ConceitoFiltro = "pago";
  if (conceitoTexto !== undefined) {
    if ((CONCEITOS_PERMITIDOS as readonly string[]).includes(conceitoTexto)) {
      conceito = conceitoTexto as ConceitoFiltro;
    } else {
      erros.push({ campo: "conceito", mensagem: "Conceito disponível: pago" });
    }
  }

  return erros.length > 0 ? { ok: false, erros } : { ok: true, filtros: { ano, bimestre, conceito } };
}

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

export type ReferenciaTemporal = {
  tipo: "acumulado_no_exercicio";
  exercicio: number;
  bimestre: number;
  inicio: string;
  fim: string;
  descricao: string;
};

/** Período coberto por um valor "até o bimestre": de 1º de janeiro ao fim do bimestre. */
export function referenciaTemporal(exercicio: number, bimestre: number): ReferenciaTemporal {
  const mesFinal = bimestre * 2;
  const ultimoDia = new Date(Date.UTC(exercicio, mesFinal, 0)).getUTCDate();
  return {
    tipo: "acumulado_no_exercicio",
    exercicio,
    bimestre,
    inicio: `${exercicio}-01-01`,
    fim: `${exercicio}-${String(mesFinal).padStart(2, "0")}-${String(ultimoDia).padStart(2, "0")}`,
    descricao: `janeiro a ${MESES[mesFinal - 1]} de ${exercicio}`,
  };
}

export function nomeBimestre(bimestre: number): string {
  const inicio = MESES[(bimestre - 1) * 2] ?? "";
  const fim = MESES[bimestre * 2 - 1] ?? "";
  return `${bimestre}º bimestre (${inicio.slice(0, 3)}–${fim.slice(0, 3)})`;
}
