import { formatarEscala, formatarPercentual, formatarReais } from "@/lib/formatacao.ts";
import type { ItemComposicao } from "@/server/services/despesas.ts";
import styles from "./charts.module.css";

/**
 * Participação de cada grupo de natureza no total pago (exceto intra).
 * Rótulos em HTML (legíveis em qualquer largura); o SVG desenha só a barra,
 * com largura em unidades de 0 a 100. Number() aqui é só geometria: o
 * percentual já vem calculado em decimal exato.
 */
export function CategoryChart({ grupos, titulo }: { grupos: readonly ItemComposicao[]; titulo: string }) {
  return (
    <figure className={styles.figure}>
      <ul className={styles.barras} aria-label={`${titulo}. Os valores exatos estão na tabela.`}>
        {grupos.map((g) => {
          const pct = g.participacaoPercentual === null ? 0 : Math.min(100, Math.max(0, Number(g.participacaoPercentual)));
          return (
            <li key={g.codConta} className={styles.barraItem}>
              <div className={styles.barraTopo}>
                <span>{g.nome}</span>
                <span className={styles.barraValor}>
                  {g.valor === null
                    ? "não informado"
                    : `${formatarPercentual(g.participacaoPercentual ?? "0")} · ${formatarEscala(g.valor).texto}`}
                </span>
              </div>
              <svg className={styles.barraSvg} viewBox="0 0 100 8" preserveAspectRatio="none" aria-hidden="true">
                <rect x={0} y={0} width={100} height={8} className={styles.trilho} />
                <rect
                  x={0}
                  y={0}
                  width={pct}
                  height={8}
                  className={g.categoria === "capital" ? styles.barraCapital : styles.barra}
                />
              </svg>
            </li>
          );
        })}
      </ul>
      <div className={styles.legenda} aria-hidden="true">
        <span>
          <span className={`${styles.swatch} ${styles.swatchCorrente}`} />
          Despesas correntes
        </span>
        <span>
          <span className={`${styles.swatch} ${styles.swatchCapital}`} />
          Despesas de capital
        </span>
      </div>
      <figcaption>{titulo}. Percentuais sobre o total pago exceto intraorçamentárias.</figcaption>
      <details className={styles.tabela}>
        <summary>Ver tabela</summary>
        <div className="table-wrap">
          <table>
            <caption>{titulo}</caption>
            <thead>
              <tr>
                <th scope="col">Grupo</th>
                <th scope="col">Categoria</th>
                <th scope="col" className="num">
                  Valor pago
                </th>
                <th scope="col" className="num">
                  Participação
                </th>
              </tr>
            </thead>
            <tbody>
              {grupos.map((g) => (
                <tr key={g.codConta}>
                  <th scope="row">{g.nome}</th>
                  <td>{g.categoria === "capital" ? "Capital" : "Corrente"}</td>
                  <td className="num">{g.valor === null ? "não informado" : formatarReais(g.valor)}</td>
                  <td className="num">
                    {g.participacaoPercentual === null ? "—" : formatarPercentual(g.participacaoPercentual)}
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
