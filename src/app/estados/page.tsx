import type { Metadata } from "next";
import { CoverageNotice } from "@/components/dashboard/CoverageNotice.tsx";
import { DashboardFilters } from "@/components/dashboard/DashboardFilters.tsx";
import styles from "@/components/dashboard/dashboard.module.css";
import { StateComparisonTable } from "@/components/states/StateComparisonTable.tsx";
import { StateExplorer } from "@/components/states/StateExplorer.tsx";
import { Avisos } from "@/components/ui/MethodologyTooltip.tsx";
import { FiltrosInvalidos, SemDadosValidados } from "@/components/ui/estados.tsx";
import { ESTADOS, NOMES_REGIOES } from "@/lib/entes.ts";
import { painelEstados } from "@/server/services/despesas.ts";
import { carregarRecorte, queryDoPeriodo } from "@/server/services/paginas.ts";

export const metadata: Metadata = { title: "Estados" };

const CODIGOS = ESTADOS.map((e) => e.codIbge);

const LISTA = ESTADOS.map((e) => ({
  uf: e.uf ?? "",
  nome: e.nome,
  regiao: e.regiao ? NOMES_REGIOES[e.regiao] : "",
}));

export default async function PaginaEstados({ searchParams }: PageProps<"/estados">) {
  const recorte = await carregarRecorte(await searchParams, { codIbges: CODIGOS }, (db, periodo, filtros) =>
    painelEstados(db, periodo, filtros.conceito),
  );

  const cabecalho = (
    <section className={styles.hero}>
      <h1>Estados e Distrito Federal</h1>
      <p className={styles.heroLead}>
        Despesas pagas por cada estado, acumuladas no exercício, lado a lado. Os valores não são somados entre si nem
        com a União.
      </p>
    </section>
  );

  if (recorte.tipo !== "ok") {
    return (
      <>
        {cabecalho}
        {recorte.tipo === "filtros_invalidos" ? <FiltrosInvalidos erros={recorte.erros} voltar="/estados" /> : null}
        {recorte.tipo === "sem_dados" ? (
          <>
            <DashboardFilters caminho="/estados" periodos={recorte.periodos} />
            <div className="section">
              <SemDadosValidados />
            </div>
          </>
        ) : null}
        <section className="section" aria-labelledby="busca">
          <h2 id="busca">Encontrar um estado</h2>
          <StateExplorer estados={LISTA} query="" />
        </section>
      </>
    );
  }

  const painel = recorte.dados;
  const referencia = painel.referenciaTemporal;
  const query = queryDoPeriodo(recorte.periodo);

  return (
    <>
      {cabecalho}
      <DashboardFilters
        caminho="/estados"
        periodos={recorte.periodos}
        atual={{ ano: referencia.exercicio, bimestre: referencia.bimestre }}
      />

      <section className="section" aria-labelledby="comparacao">
        <h2 id="comparacao">Despesas pagas de {referencia.descricao}</h2>
        <CoverageNotice cobertura={painel.cobertura} rotulo="estados e DF" />
        <p className="small muted">
          Valores absolutos refletem o tamanho de cada estado e não medem eficiência nem qualidade do gasto. O mapa
          interativo ainda não foi implementado; a tabela abaixo traz todos os estados.
        </p>
        <StateComparisonTable itens={painel.estados} titulo={`Despesas pagas de ${referencia.descricao}, por estado`} query={query} />
      </section>

      <section className="section" aria-labelledby="busca">
        <h2 id="busca">Encontrar um estado</h2>
        <StateExplorer estados={LISTA} query={query} />
      </section>

      <section className="section" aria-labelledby="avisos">
        <h2 id="avisos">Leia antes de comparar</h2>
        <Avisos avisos={painel.avisos} />
      </section>
    </>
  );
}
