import Link from "next/link";
import styles from "./layout.module.css";
import { NavLinks } from "./NavLinks.tsx";

export function SiteHeader() {
  return (
    <header className={styles.header}>
      <div className={`container ${styles.headerInner}`}>
        <Link href="/" className={styles.brand}>
          <span className={styles.brandName}>PortalDash</span>
          <span className={styles.brandTagline}>O dinheiro é público. A cobrança também.</span>
        </Link>
        <nav aria-label="Principal" className={styles.nav}>
          <NavLinks />
        </nav>
      </div>
    </header>
  );
}
