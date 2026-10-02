import type { ReactNode } from "react";
import styles from "./ui.module.css";

/** Explicação expansível sem JavaScript (details/summary), acessível por teclado. */
export function MethodologyTooltip({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <details className={styles.tooltip}>
      <summary>{rotulo}</summary>
      <div className={styles.tooltipBody}>{children}</div>
    </details>
  );
}

export function Avisos({ avisos }: { avisos: readonly string[] }) {
  return (
    <ul className={styles.avisos}>
      {avisos.map((a) => (
        <li key={a}>{a}</li>
      ))}
    </ul>
  );
}
