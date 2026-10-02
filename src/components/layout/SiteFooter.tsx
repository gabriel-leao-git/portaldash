import Link from "next/link";
import { METODOLOGIA_VERSAO } from "@/server/methodology/indicador.ts";
import styles from "./layout.module.css";

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className="container">
        <p>
          Dados declarados pelos entes ao Siconfi (Secretaria do Tesouro Nacional), coletados e validados pelo
          PortalDash. Metodologia {METODOLOGIA_VERSAO}. <Link href="/metodologia">Como calculamos</Link> ·{" "}
          <Link href="/fontes">Fontes e atualização</Link>
        </p>
        <p>Portal público, sem cadastro e sem coleta de dados pessoais dos visitantes.</p>
      </div>
    </footer>
  );
}
