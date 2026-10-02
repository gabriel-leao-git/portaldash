import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./ui.module.css";

export function EmptyState({ titulo, children }: { titulo: string; children?: ReactNode }) {
  return (
    <section className={styles.state} aria-live="polite">
      <h2 className={styles.stateTitle}>{titulo}</h2>
      {children}
    </section>
  );
}

export function ErrorState({ titulo, children }: { titulo: string; children?: ReactNode }) {
  return (
    <section className={`${styles.state} ${styles.stateErro}`} role="alert">
      <h2 className={styles.stateTitle}>{titulo}</h2>
      {children}
    </section>
  );
}

export function SemDadosValidados() {
  return (
    <EmptyState titulo="Ainda não há dados validados para este recorte">
      <p>
        O PortalDash só exibe valores que passaram pelas verificações da metodologia. Ausência de dado não significa
        despesa zero.
      </p>
      <p className="small">
        Veja os períodos disponíveis em <Link href="/fontes">Fontes</Link>.
      </p>
    </EmptyState>
  );
}

export function FiltrosInvalidos({ erros, voltar }: { erros: { campo: string; mensagem: string }[]; voltar: string }) {
  return (
    <ErrorState titulo="Filtro inválido">
      <ul>
        {erros.map((e) => (
          <li key={`${e.campo}-${e.mensagem}`}>
            <strong>{e.campo}</strong>: {e.mensagem}
          </li>
        ))}
      </ul>
      <p>
        <Link href={voltar}>Ver o recorte mais recente</Link>
      </p>
    </ErrorState>
  );
}
