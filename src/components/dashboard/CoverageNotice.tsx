import type { Cobertura } from "@/server/services/despesas.ts";
import styles from "../ui/ui.module.css";

export function CoverageNotice({ cobertura, rotulo }: { cobertura: Cobertura; rotulo: string }) {
  const completo = cobertura.comDado === cobertura.totalEntes;
  return (
    <div className={`${styles.notice} ${completo ? styles.noticeOk : ""}`} role="status">
      <strong>
        Cobertura: {cobertura.comDado} de {cobertura.totalEntes} {rotulo} com dado validado neste recorte.
      </strong>
      {completo ? null : (
        <span>
          {" "}
          Sem dado: {cobertura.semDado.map((s) => s.uf ?? s.nome).join(", ")}. Ausência de dado não significa despesa
          zero.
        </span>
      )}
    </div>
  );
}
