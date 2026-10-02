"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", rotulo: "Brasil" },
  { href: "/estados", rotulo: "Estados" },
  { href: "/metodologia", rotulo: "Metodologia" },
  { href: "/fontes", rotulo: "Fontes" },
  { href: "/sobre", rotulo: "Sobre" },
] as const;

export function NavLinks() {
  const caminho = usePathname();
  const atual = (href: string): "page" | "true" | undefined => {
    if (caminho === href) return "page";
    if (href !== "/" && caminho.startsWith(`${href}/`)) return "true";
    return undefined;
  };
  return (
    <ul>
      {LINKS.map((l) => (
        <li key={l.href}>
          <Link href={l.href} aria-current={atual(l.href)}>
            {l.rotulo}
          </Link>
        </li>
      ))}
    </ul>
  );
}
