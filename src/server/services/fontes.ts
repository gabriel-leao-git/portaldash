import type { Db } from "../db/pool.ts";
import { SICONFI_BASE_PATH, SICONFI_DOC_URL, SICONFI_FONTE_ID, SICONFI_HOST } from "../integrations/siconfi/config.ts";
import { METODOLOGIA_VERSAO } from "../methodology/indicador.ts";
import { periodosDisponiveis, ultimaExecucao } from "../repositories/rreo.ts";

export type SituacaoFontes = {
  metodologia: { versao: string; url: string };
  fontes: {
    id: string;
    instituicao: string;
    dataset: string;
    documentacao: string;
    contrato: string;
    usoNoPortal: string;
    integracao: {
      ultimaExecucao: { situacao: string; iniciadaEm: string; finalizadaEm: string | null } | null;
      ultimaAtualizacaoConcluida: string | null;
    };
    periodosDisponiveis: { ano: number; bimestre: number; entesComDado: number }[];
  }[];
};

/** Situação pública das integrações: sem mensagens de erro nem detalhes internos. */
export async function situacaoFontes(db: Db): Promise<SituacaoFontes> {
  const [ultima, concluida, periodos] = await Promise.all([
    ultimaExecucao(db, false),
    ultimaExecucao(db, true),
    periodosDisponiveis(db),
  ]);
  return {
    metodologia: { versao: METODOLOGIA_VERSAO, url: "/metodologia" },
    fontes: [
      {
        id: SICONFI_FONTE_ID,
        instituicao: "Secretaria do Tesouro Nacional",
        dataset: "Siconfi — API de dados abertos: RREO (Anexo 01) e extrato de entregas",
        documentacao: SICONFI_DOC_URL,
        contrato: `https://${SICONFI_HOST}/docs/siconfi.yaml`,
        usoNoPortal: `Coleta sequencial em https://${SICONFI_HOST}${SICONFI_BASE_PATH}, no máximo uma requisição por segundo; o navegador nunca consulta a fonte.`,
        integracao: {
          ultimaExecucao: ultima
            ? {
                situacao: ultima.situacao,
                iniciadaEm: ultima.iniciadaEm.toISOString(),
                finalizadaEm: ultima.finalizadaEm?.toISOString() ?? null,
              }
            : null,
          ultimaAtualizacaoConcluida: concluida?.finalizadaEm?.toISOString() ?? null,
        },
        periodosDisponiveis: periodos.slice(0, 24).map((p) => ({
          ano: p.exercicio,
          bimestre: p.periodo,
          entesComDado: p.entes,
        })),
      },
    ],
  };
}
