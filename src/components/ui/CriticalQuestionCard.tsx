import styles from "./ui.module.css";

/**
 * Pergunta crítica: a base factual vem sempre junto e a pergunta não embute
 * conclusão (docs/editorial-guidelines.md).
 */
export function CriticalQuestionCard({ pergunta, base }: { pergunta: string; base: string }) {
  return (
    <article className={styles.question}>
      <p className={styles.questionText}>{pergunta}</p>
      <p className={styles.questionBasis}>
        <span className="visually-hidden">Base: </span>
        {base}
      </p>
    </article>
  );
}
