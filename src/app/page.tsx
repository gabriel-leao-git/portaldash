import Link from "next/link";
import { CategoryChart } from "@/components/charts/CategoryChart.tsx";
import { ExpenseEvolutionChart } from "@/components/charts/ExpenseEvolutionChart.tsx";
import { CoverageNotice } from "@/components/dashboard/CoverageNotice.tsx";
import { DashboardFilters } from "@/components/dashboard/DashboardFilters.tsx";
import { ExpenseIndicator } from "@/components/dashboard/ExpenseIndicator.tsx";
import { MetricCard } from "@/components/dashboard/MetricCard.tsx";
import styles from "@/components/dashboard/dashboard.module.css";
import { StateComparisonTable } from "@/components/states/StateComparisonTable.tsx";
import { CriticalQuestionCard } from "@/components/ui/CriticalQuestionCard.tsx";
import { Avisos, MethodologyTooltip } from "@/components/ui/MethodologyTooltip.tsx";
import { FiltrosInvalidos, SemDadosValidados } from "@/components/ui/estados.tsx";
import { UNIAO } from "@/lib/entes.ts";
import { formatarEscala } from "@/lib/formatacao.ts";
import { AVISO_SEM_SOMA_ESFERAS } from "@/server/methodology/indicador.ts";
import { painelBrasil, painelEnte } from "@/server/services/despesas.ts";
import { carregarRecorte, queryDoPeriodo } from "@/server/services/paginas.ts";
import { perguntasCriticas } from "@/server/services/perguntas.ts";

function Abertura() {
  return (
    <section className={styles.hero}>
      <h1>Você paga. Acompanhe para onde vai.</h1>
      <p className={styles.heroLead}>
        Quanto a União e cada estado efetivamente pagaram, com dados oficiais declarados ao Tesouro Nacional, metodologia
        aberta e cada número ligado à sua fonte.
      </p>
    </section>
  );
}

export default async function PaginaBrasil({ searchParams }: PageProps<"/">) {
  const recorte = await carregarRecorte(await searchParams, { preferirUniao: true }, async (db, periodo, filtros) => {
    const [painel, anterior] = await Promise.all([
      painelBrasil(db, periodo, filtros.conceito),
      painelEnte(db, UNIAO, { exercicio: periodo.exercicio - 1, bimestre: periodo.bimestre }, filtros.conceito),
    ]);
    return { painel, anterior: anterior.indicador };
  });

  if (recorte.tipo === "filtros_invalidos") {
    return (
      <>
        <Abertura />
        <FiltrosInvalidos erros={recorte.erros} voltar="/" />
      </>
    );
  }
  if (recorte.tipo === "sem_dados") {
    return (
      <>
        <Abertura />
        <DashboardFilters caminho="/" periodos={recorte.periodos} />
        <div className="section">
          <SemDadosValidados />
        </div>
      </>
    );
  }

  const { painel, anterior } = recorte.dados;
  const referencia = painel.referenciaTemporal;
  const query = queryDoPeriodo(recorte.periodo);
  const uniao = { indicador: painel.uniao, serieExercicio: painel.serieUniao };
  const estados = { cobertura: painel.estados.cobertura, estados: painel.estados.itens };
  const perguntas = perguntasCriticas(uniao.indicador, referencia, anterior);

  return (
    <>
      <Abertura />
      <DashboardFilters
        caminho="/"
        periodos={recorte.periodos}
        atual={{ ano: referencia.exercicio, bimestre: referencia.bimestre }}
      />

      <section className="section" aria-label="Indicador principal">
        <ExpenseIndicator titulo="União (Governo Federal)" indicador={uniao.indicador} referencia={referencia} />
      </section>

      <section className="section" aria-labelledby="esferas">
        <div className={styles.sectionHeader}>
          <h2 id="esferas">Por esfera</h2>
          <MethodologyTooltip rotulo="Por que não há um total do Brasil">
            <p>{AVISO_SEM_SOMA_ESFERAS}</p>
          </MethodologyTooltip>
        </div>
        <div className={styles.grid2}>
          <MetricCard
            rotulo="União (Governo Federal)"
            valor={uniao.indicador.valor === null ? "sem dado" : formatarEscala(uniao.indicador.valor).texto}
          >
            <p className="small muted">Despesas pagas de {referencia.descricao}.</p>
          </MetricCard>
          <MetricCard rotulo="Estados e Distrito Federal" valor={`${estados.cobertura.comDado} de 27 com dado`}>
            <p className="small muted">
              Valores apresentados individualmente, sem soma. <Link href={`/estados${query}`}>Ver todos</Link>.
            </p>
          </MetricCard>
        </div>
      </section>

      {uniao.indicador.composicao ? (
        <section className="section" aria-labelledby="distribuicao">
          <h2 id="distribuicao">Para onde foi o dinheiro pago pela União</h2>
          <p className="muted small">
            Grupos de natureza da despesa do Balanço Orçamentário. A classificação por área (saúde, educação…) não tem
            valor pago disponível na fonte bimestral e por isso não aparece aqui.
          </p>
          <CategoryChart grupos={uniao.indicador.composicao.grupos} titulo={`União — despesas pagas de ${referencia.descricao}, por grupo`} />
        </section>
      ) : null}

      <section className="section" aria-labelledby="evolucao">
        <h2 id="evolucao">Evolução no ano</h2>
        <ExpenseEvolutionChart serie={uniao.serieExercicio} exercicio={referencia.exercicio} />
      </section>

      <section className="section" aria-labelledby="estados">
        <div className={styles.sectionHeader}>
          <h2 id="estados">Estados</h2>
          <Link href={`/estados${query}`}>Explorar estados</Link>
        </div>
        <CoverageNotice cobertura={estados.cobertura} rotulo="estados e DF" />
        <p className="small muted">
          Valores absolutos refletem o tamanho de cada estado e não medem eficiência. Ordenado do maior para o menor valor pago.
        </p>
        <StateComparisonTable itens={estados.estados} titulo={`Despesas pagas de ${referencia.descricao}`} query={query} />
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
        <Avisos avisos={painel.avisos} />
        <p className="small">
          Metodologia {painel.metodologia.versao}: <Link href="/metodologia">como calculamos</Link> ·{" "}
          <Link href="/fontes">fontes e atualização</Link> · dados deste recorte em{" "}
          <a href={`/api/v1/brasil${query}`}>/api/v1/brasil</a>
        </p>
      </section>
    </>
  );
}
