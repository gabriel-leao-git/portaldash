import type { Metadata } from "next";
import { connection } from "next/server";
import styles from "@/components/dashboard/dashboard.module.css";
import { EmptyState } from "@/components/ui/estados.tsx";
import { nomeBimestre } from "@/lib/filtros.ts";
import { formatarDataHora } from "@/lib/formatacao.ts";
import { dbLeitura } from "@/server/db/pool.ts";
import { situacaoFontes, type SituacaoFontes } from "@/server/services/fontes.ts";
import { DadosIndisponiveisError } from "@/server/services/paginas.ts";

export const metadata: Metadata = { title: "Fontes" };

const SITUACAO: Record<string, string> = {
  em_execucao: "em execução",
  concluida: "concluída",
  concluida_com_falhas: "concluída com falhas parciais",
  falhou: "falhou",
};

async function carregar(): Promise<SituacaoFontes> {
  await connection();
  try {
    return await situacaoFontes(dbLeitura());
  } catch (erro) {
    console.error(`[pagina] fontes indisponíveis (${erro instanceof Error ? erro.name : "desconhecido"})`);
    throw new DadosIndisponiveisError();
  }
}

export default async function PaginaFontes() {
  const dados = await carregar();
  return (
    <>
      <section className={styles.hero}>
        <h1>Fontes</h1>
        <p className={styles.heroLead}>
          De onde vêm os dados, como são coletados e quando foram atualizados pela última vez.
        </p>
      </section>
      {dados.fontes.map((f) => (
        <section key={f.id} className="section" aria-labelledby={`fonte-${f.id}`}>
          <h2 id={`fonte-${f.id}`}>{f.dataset}</h2>
          <p>
            {f.instituicao}. Documentação oficial:{" "}
            <a href={f.documentacao} rel="noopener noreferrer" target="_blank">
              página da API<span className="visually-hidden"> (abre em nova aba)</span>
            </a>{" "}
            ·{" "}
            <a href={f.contrato} rel="noopener noreferrer" target="_blank">
              contrato técnico<span className="visually-hidden"> (abre em nova aba)</span>
            </a>
          </p>
          <p className="small muted">{f.usoNoPortal}</p>
          <h3>Situação da integração</h3>
          {f.integracao.ultimaExecucao ? (
            <ul>
              <li>
                Última coleta: {SITUACAO[f.integracao.ultimaExecucao.situacao] ?? f.integracao.ultimaExecucao.situacao},
                iniciada em {formatarDataHora(f.integracao.ultimaExecucao.iniciadaEm)}.
              </li>
              <li>
                Última atualização concluída:{" "}
                {f.integracao.ultimaAtualizacaoConcluida
                  ? formatarDataHora(f.integracao.ultimaAtualizacaoConcluida)
                  : "nenhuma até agora"}
                .
              </li>
            </ul>
          ) : (
            <EmptyState titulo="Nenhuma coleta registrada ainda">
              <p>Os dados aparecem no portal depois da primeira coleta validada.</p>
            </EmptyState>
          )}
          <h3>Períodos com dado validado</h3>
          {f.periodosDisponiveis.length > 0 ? (
            <div className="table-wrap">
              <table>
                <caption>Entes (União, estados e DF) com declaração validada por período</caption>
                <thead>
                  <tr>
                    <th scope="col">Exercício</th>
                    <th scope="col">Acumulado até o</th>
                    <th scope="col" className="num">
                      Entes com dado (de 28)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {f.periodosDisponiveis.map((p) => (
                    <tr key={`${p.ano}-${p.bimestre}`}>
                      <td>{p.ano}</td>
                      <td>{nomeBimestre(p.bimestre)}</td>
                      <td className="num">{p.entesComDado}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="muted">Nenhum período validado ainda.</p>
          )}
        </section>
      ))}
    </>
  );
}
