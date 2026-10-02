import type { Metadata } from "next";
import Link from "next/link";
import styles from "@/components/dashboard/dashboard.module.css";

export const metadata: Metadata = { title: "Sobre" };

export default function PaginaSobre() {
  return (
    <>
      <section className={styles.hero}>
        <h1>Sobre o PortalDash</h1>
        <p className={styles.heroLead}>O dinheiro é público. A cobrança também.</p>
      </section>
      <section className="section" aria-labelledby="objetivo">
        <h2 id="objetivo">Objetivo</h2>
        <p>
          Mostrar, com dados oficiais e verificáveis, quanto a União e os estados efetivamente pagam ao longo do ano e em
          quê, para que qualquer pessoa possa acompanhar e cobrar.
        </p>
        <p>
          O portal é público e não tem cadastro, login nem comentários. Não coletamos dados pessoais de quem visita.
        </p>
      </section>
      <section className="section" aria-labelledby="principios">
        <h2 id="principios">Princípios</h2>
        <ul>
          <li>Cada número tem fonte, data e metodologia publicadas.</li>
          <li>Dado, hipótese e interpretação ficam separados. Um valor alto, sozinho, não prova desperdício.</li>
          <li>Ausência de dado é mostrada como ausência, nunca como zero.</li>
          <li>Correções são registradas e públicas.</li>
        </ul>
        <p>
          Detalhes em <Link href="/metodologia">Metodologia</Link> e <Link href="/fontes">Fontes</Link>.
        </p>
      </section>
    </>
  );
}
