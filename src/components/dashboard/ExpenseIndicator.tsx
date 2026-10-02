import { formatarEscala, formatarReais } from "@/lib/formatacao.ts";
import { SITUACAO_SEM_DADO } from "@/lib/situacao.ts";
import type { ReferenciaTemporal } from "@/lib/filtros.ts";
import type { IndicadorEnte } from "@/server/services/despesas.ts";
import { MethodologyTooltip } from "../ui/MethodologyTooltip.tsx";
import { SourceBadge } from "../ui/SourceBadge.tsx";
import { EmptyState } from "../ui/estados.tsx";
import styles from "./dashboard.module.css";

export function ExpenseIndicator({
  titulo,
  indicador,
  referencia,
}: {
  titulo: string;
  indicador: IndicadorEnte;
  referencia: ReferenciaTemporal;
}) {
  if (indicador.situacao !== "disponivel" || indicador.valor === null) {
    return (
      <EmptyState titulo={`${titulo}: sem dado`}>
        <p>{SITUACAO_SEM_DADO[indicador.situacao === "disponivel" ? "sem_dado_validado" : indicador.situacao].explicacao}</p>
        <p className="small muted">Ausência de dado não significa despesa zero.</p>
      </EmptyState>
    );
  }
  const escala = formatarEscala(indicador.valor);
  return (
    <section className={styles.indicator} aria-labelledby="indicador-titulo">
      <h2 id="indicador-titulo" className={styles.indicatorLabel}>
        {titulo} — despesas pagas de {referencia.descricao}
      </h2>
      <p className={styles.indicatorValue}>
        <span aria-hidden="true">{escala.texto}</span>
        <span className="visually-hidden">{escala.extenso}</span>
      </p>
      <p className={styles.indicatorExact}>
        Valor exato: <span className={styles.semQuebra}>{formatarReais(indicador.valor)}</span>
        {escala.arredondado ? " (o número em destaque está arredondado)" : ""}
      </p>
      <div className={styles.indicatorMeta}>
        <p className="small muted">
          Acumulado no exercício, exceto despesas intraorçamentárias. Valores nominais, sem correção pela inflação.
        </p>
        {indicador.proveniencia ? <SourceBadge proveniencia={indicador.proveniencia} /> : null}
        <MethodologyTooltip rotulo="O que entra neste número">
          <p>
            É a linha “Despesas (exceto intraorçamentárias)” da coluna “Despesas pagas até o bimestre” do Balanço
            Orçamentário (RREO, Anexo 1) declarado ao Siconfi. Inclui pessoal, juros, demais despesas correntes,
            investimentos, inversões e amortização da dívida.
          </p>
          <p>
            Não inclui refinanciamento (rolagem) da dívida, operações entre órgãos do próprio ente
            (intraorçamentárias) nem restos a pagar de anos anteriores.
          </p>
        </MethodologyTooltip>
      </div>
    </section>
  );
}
