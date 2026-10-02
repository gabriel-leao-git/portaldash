/**
 * Entes no escopo atual: União, 26 estados e Distrito Federal.
 * Códigos e siglas seguem a tabela oficial de UFs do IBGE; o Siconfi usa o
 * código IBGE como id_ente (União = 1). Esta lista é a allowlist de entrada.
 */

export type Esfera = "uniao" | "estado" | "distrito_federal";
export type Regiao = "N" | "NE" | "SE" | "S" | "CO";

export type Ente = {
  readonly codIbge: number;
  readonly uf: string | null;
  readonly nome: string;
  readonly esfera: Esfera;
  readonly regiao: Regiao | null;
};

export const UNIAO: Ente = {
  codIbge: 1,
  uf: null,
  nome: "União",
  esfera: "uniao",
  regiao: null,
};

const estado = (codIbge: number, uf: string, nome: string, regiao: Regiao): Ente => ({
  codIbge,
  uf,
  nome,
  esfera: uf === "DF" ? "distrito_federal" : "estado",
  regiao,
});

export const ESTADOS: readonly Ente[] = [
  estado(11, "RO", "Rondônia", "N"),
  estado(12, "AC", "Acre", "N"),
  estado(13, "AM", "Amazonas", "N"),
  estado(14, "RR", "Roraima", "N"),
  estado(15, "PA", "Pará", "N"),
  estado(16, "AP", "Amapá", "N"),
  estado(17, "TO", "Tocantins", "N"),
  estado(21, "MA", "Maranhão", "NE"),
  estado(22, "PI", "Piauí", "NE"),
  estado(23, "CE", "Ceará", "NE"),
  estado(24, "RN", "Rio Grande do Norte", "NE"),
  estado(25, "PB", "Paraíba", "NE"),
  estado(26, "PE", "Pernambuco", "NE"),
  estado(27, "AL", "Alagoas", "NE"),
  estado(28, "SE", "Sergipe", "NE"),
  estado(29, "BA", "Bahia", "NE"),
  estado(31, "MG", "Minas Gerais", "SE"),
  estado(32, "ES", "Espírito Santo", "SE"),
  estado(33, "RJ", "Rio de Janeiro", "SE"),
  estado(35, "SP", "São Paulo", "SE"),
  estado(41, "PR", "Paraná", "S"),
  estado(42, "SC", "Santa Catarina", "S"),
  estado(43, "RS", "Rio Grande do Sul", "S"),
  estado(50, "MS", "Mato Grosso do Sul", "CO"),
  estado(51, "MT", "Mato Grosso", "CO"),
  estado(52, "GO", "Goiás", "CO"),
  estado(53, "DF", "Distrito Federal", "CO"),
];

export const ENTES_NO_ESCOPO: readonly Ente[] = [UNIAO, ...ESTADOS];

const POR_UF = new Map(ESTADOS.map((e) => [e.uf as string, e]));
const POR_CODIGO = new Map(ENTES_NO_ESCOPO.map((e) => [e.codIbge, e]));

/** Aceita a sigla em qualquer caixa; devolve undefined fora da allowlist. */
export function estadoPorUf(uf: string): Ente | undefined {
  if (!/^[A-Za-z]{2}$/.test(uf)) return undefined;
  return POR_UF.get(uf.toUpperCase());
}

export function entePorCodigo(codIbge: number): Ente | undefined {
  return POR_CODIGO.get(codIbge);
}

export const NOMES_REGIOES: Record<Regiao, string> = {
  N: "Norte",
  NE: "Nordeste",
  SE: "Sudeste",
  S: "Sul",
  CO: "Centro-Oeste",
};
