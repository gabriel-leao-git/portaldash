import type { ReactNode } from "react";
import styles from "./dashboard.module.css";

export function MetricCard({ rotulo, valor, children }: { rotulo: string; valor: ReactNode; children?: ReactNode }) {
  return (
    <article className={styles.card}>
      <h3 className={styles.cardLabel}>{rotulo}</h3>
      <p className={styles.cardValue}>{valor}</p>
      {children}
    </article>
  );
}
