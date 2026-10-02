import { formatarEscala, formatarReais } from "@/lib/formatacao.ts";
import { nomeBimestre } from "@/lib/filtros.ts";
import { SITUACAO_SEM_DADO } from "@/lib/situacao.ts";
import type { PontoSerie } from "@/server/services/despesas.ts";
import styles from "./charts.module.css";

/**
 * Série cumulativa do exercício na periodicidade real da fonte (bimestral).
 * Cada coluna é o acumulado de janeiro até o fim do bimestre — não se somam.
 * Rótulos em HTML; o SVG de cada coluna usa altura em unidades de 0 a 100.
 */
export function ExpenseEvolutionChart({ serie, exercicio }: { serie: readonly PontoSerie[]; exercicio: number }) {
  const maximo = Math.max(1, ...serie.map((p) => (p.valor === null ? 0 : Number(p.valor))));
  const titulo = `Despesas pagas acumuladas em ${exercicio}, por bimestre`;
  return (
    <figure className={styles.figure}>
      <ol className={styles.colunas} aria-label={`${titulo}. Os valores exatos estão na tabela.`}>
        {[1, 2, 3, 4, 5, 6].map((b) => {
          const ponto = serie.find((p) => p.bimestre === b);
          const valorTexto = ponto?.valor ?? null;
          const altura = valorTexto === null ? 0 : (100 * Number(valorTexto)) / maximo;
          return (
            <li key={b} className={styles.coluna}>
              <span className={styles.colunaValor}>
                {valorTexto === null ? (ponto ? "sem dado" : "") : formatarEscala(valorTexto).texto.replace("R$ ", "")}
              </span>
              <svg className={styles.colunaSvg} viewBox="0 0 10 100" preserveAspectRatio="none" aria-hidden="true">
                <rect x={0} y={100 - altura} width={10} height={altura} className={styles.barra} />
              </svg>
              <span className={styles.colunaRotulo}>{`${b}º bim`}</span>
            </li>
          );
        })}
      </ol>
      <figcaption>
        {titulo}. Cada coluna é o total pago de janeiro até o fim do bimestre; os valores não devem ser somados.
      </figcaption>
      <details className={styles.tabela}>
        <summary>Ver tabela</summary>
        <div className="table-wrap">
          <table>
            <caption>{titulo}</caption>
            <thead>
              <tr>
                <th scope="col">Acumulado até o</th>
                <th scope="col" className="num">
                  Despesas pagas
                </th>
              </tr>
            </thead>
            <tbody>
              {serie.map((p) => (
                <tr key={p.bimestre}>
                  <th scope="row">{nomeBimestre(p.bimestre)}</th>
                  <td className="num">
                    {p.situacao !== "disponivel"
                      ? `sem dado (${SITUACAO_SEM_DADO[p.situacao].curto})`
                      : p.valor === null
                        ? "sem dado"
                        : formatarReais(p.valor)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
