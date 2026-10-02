import Link from "next/link";
import { nomeBimestre } from "@/lib/filtros.ts";
import styles from "./dashboard.module.css";

export type PeriodoOpcao = { ano: number; bimestre: number };

/**
 * Seletor de recorte por links: cada opção é um período com dado validado
 * (nunca uma combinação inexistente), o recorte fica na URL, voltar/avançar
 * do navegador o preserva e tudo funciona sem JavaScript.
 */
export function DashboardFilters({
  caminho,
  periodos,
  atual,
}: {
  caminho: string;
  periodos: readonly PeriodoOpcao[];
  atual?: PeriodoOpcao;
}) {
  const anos = [...new Set(periodos.map((p) => p.ano))].sort((a, b) => b - a);
  return (
    <nav className={styles.filters} aria-label="Escolher período">
      <p className={styles.filtersTitulo}>
        Despesas pagas acumuladas até o fim do bimestre <span className="muted small">(conceito: pago)</span>
      </p>
      {anos.map((ano) => (
        <div key={ano} className={styles.filtersAno}>
          <span className={styles.filtersRotulo}>{ano}</span>
          <ul className={styles.filtersLista}>
            {periodos
              .filter((p) => p.ano === ano)
              .sort((a, b) => a.bimestre - b.bimestre)
              .map((p) => {
                const ativo = atual?.ano === p.ano && atual.bimestre === p.bimestre;
                return (
                  <li key={p.bimestre}>
                    <Link
                      href={`${caminho}?ano=${p.ano}&bimestre=${p.bimestre}`}
                      className={styles.filtroLink}
                      aria-current={ativo ? "true" : undefined}
                      aria-label={`${nomeBimestre(p.bimestre)} de ${p.ano}`}
                      scroll={false}
                    >
                      {`${p.bimestre}º bim`}
                    </Link>
                  </li>
                );
              })}
          </ul>
        </div>
      ))}
      {periodos.length === 0 ? <p className="small muted">Nenhum período com dado validado.</p> : null}
    </nav>
  );
}
