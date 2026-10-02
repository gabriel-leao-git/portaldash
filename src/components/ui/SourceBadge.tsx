import { formatarData, formatarDataHora } from "@/lib/formatacao.ts";
import type { Proveniencia } from "@/server/services/despesas.ts";
import styles from "./ui.module.css";

/** Proveniência de um valor: fonte, status no Siconfi e as três datas distintas. */
export function SourceBadge({ proveniencia }: { proveniencia: Proveniencia }) {
  const retificado = proveniencia.statusEntrega === "retificado";
  return (
    <div className="small muted">
      <span className={`${styles.badge} ${retificado ? styles.badgeAmber : ""}`}>
        Siconfi · {proveniencia.statusEntrega === null ? "status não informado" : proveniencia.statusEntrega}
        {proveniencia.dataStatusSiconfi ? ` em ${formatarData(proveniencia.dataStatusSiconfi)}` : ""}
      </span>{" "}
      Coletado em {formatarDataHora(proveniencia.coletadoEm)}; conferido em {formatarDataHora(proveniencia.verificadoEm)}.{" "}
      <a href={proveniencia.consulta} rel="noopener noreferrer" target="_blank">
        Consulta na fonte<span className="visually-hidden"> (abre em nova aba)</span>
      </a>
    </div>
  );
}
