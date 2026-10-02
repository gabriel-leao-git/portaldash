import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CategoryChart } from "@/components/charts/CategoryChart.tsx";
import { ExpenseEvolutionChart } from "@/components/charts/ExpenseEvolutionChart.tsx";
import { DashboardFilters } from "@/components/dashboard/DashboardFilters.tsx";
import { ExpenseIndicator } from "@/components/dashboard/ExpenseIndicator.tsx";
import styles from "@/components/dashboard/dashboard.module.css";
import { CriticalQuestionCard } from "@/components/ui/CriticalQuestionCard.tsx";
import { Avisos } from "@/components/ui/MethodologyTooltip.tsx";
import { FiltrosInvalidos, SemDadosValidados } from "@/components/ui/estados.tsx";
import { estadoPorUf } from "@/lib/entes.ts";
import { painelEnte } from "@/server/services/despesas.ts";
import { carregarRecorte, queryDoPeriodo } from "@/server/services/paginas.ts";
import { perguntasCriticas } from "@/server/services/perguntas.ts";

export async function generateMetadata({ params }: PageProps<"/estados/[uf]">): Promise<Metadata> {
  const ente = estadoPorUf((await params).uf);
  return { title: ente ? ente.nome : "Estado não encontrado" };
}

export default async function PaginaEstado({ params, searchParams }: PageProps<"/estados/[uf]">) {
  const ente = estadoPorUf((await params).uf);
  if (!ente) notFound();

  const recorte = await carregarRecorte(await searchParams, { codIbges: [ente.codIbge] }, async (db, periodo, filtros) => {
    const [atual, anterior] = await Promise.all([
      painelEnte(db, ente, periodo, filtros.conceito),
      painelEnte(db, ente, { exercicio: periodo.exercicio - 1, bimestre: periodo.bimestre }, filtros.conceito),
    ]);
    return { atual, anterior: anterior.indicador };
  });

  const caminho = `/estados/${ente.uf?.toLowerCase()}`;
  const queryLista = recorte.tipo === "ok" ? queryDoPeriodo(recorte.periodo) : "";
  const cabecalho = (
    <section className={styles.hero}>
      <nav aria-label="Trilha" className="small">
        <Link href={`/estados${queryLista}`}>Estados</Link> / {ente.uf}
      </nav>
      <h1>{ente.nome}</h1>
      <p className={styles.heroLead}>
        Quanto o governo {ente.uf === "DF" ? "do Distrito Federal" : "estadual"} efetivamente pagou, com dados declarados
        ao Siconfi.
      </p>
    </section>
  );

  if (recorte.tipo !== "ok") {
    return (
      <>
        {cabecalho}
        {recorte.tipo === "filtros_invalidos" ? <FiltrosInvalidos erros={recorte.erros} voltar={caminho} /> : null}
        {recorte.tipo === "sem_dados" ? (
          <>
            <DashboardFilters caminho={caminho} periodos={recorte.periodos} />
            <div className="section">
              <SemDadosValidados />
            </div>
          </>
        ) : null}
      </>
    );
  }

  const { atual, anterior } = recorte.dados;
  const referencia = atual.referenciaTemporal;
  const perguntas = perguntasCriticas(atual.indicador, referencia, anterior);

  return (
    <>
      {cabecalho}
      <DashboardFilters
        caminho={caminho}
        periodos={recorte.periodos}
        atual={{ ano: referencia.exercicio, bimestre: referencia.bimestre }}
      />

      <section className="section" aria-label="Indicador principal">
        <ExpenseIndicator titulo={ente.nome} indicador={atual.indicador} referencia={referencia} />
      </section>

      {atual.indicador.composicao ? (
        <section className="section" aria-labelledby="distribuicao">
          <h2 id="distribuicao">Para onde foi o dinheiro pago</h2>
          <CategoryChart
            grupos={atual.indicador.composicao.grupos}
            titulo={`${ente.nome} — despesas pagas de ${referencia.descricao}, por grupo`}
          />
        </section>
      ) : null}

      <section className="section" aria-labelledby="evolucao">
        <h2 id="evolucao">Evolução no ano</h2>
        <ExpenseEvolutionChart serie={atual.serieExercicio} exercicio={referencia.exercicio} />
      </section>

      {perguntas.length > 0 ? (
        <section className="section" aria-labelledby="perguntas">
          <h2 id="perguntas">Perguntas que estes números levantam</h2>
          <div className={styles.questions}>
            {perguntas.map((p) => (
              <CriticalQuestionCard key={p.pergunta} pergunta={p.pergunta} base={p.base} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="section" aria-labelledby="fontes">
        <h2 id="fontes">Fontes e metodologia</h2>
        <Avisos avisos={atual.avisos} />
        <p className="small">
          Metodologia {atual.metodologia.versao}: <Link href="/metodologia">como calculamos</Link> · dados deste recorte em{" "}
          <a href={`/api/v1${caminho}${queryDoPeriodo(recorte.periodo)}`}>/api/v1{caminho}</a>
        </p>
      </section>
    </>
  );
}
