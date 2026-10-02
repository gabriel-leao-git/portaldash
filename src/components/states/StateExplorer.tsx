"use client";

import Link from "next/link";
import { useId, useState } from "react";
import styles from "../dashboard/dashboard.module.css";

export type EstadoLista = { uf: string; nome: string; regiao: string };

/** Busca por nome ou sigla; a lista completa funciona sem JavaScript. */
export function StateExplorer({ estados, query }: { estados: readonly EstadoLista[]; query: string }) {
  const [busca, setBusca] = useState("");
  const id = useId();
  const termo = busca
    .trim()
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
  const visiveis = termo
    ? estados.filter((e) =>
        `${e.uf} ${e.nome}`
          .toLocaleLowerCase("pt-BR")
          .normalize("NFD")
          .replace(/\p{Diacritic}/gu, "")
          .includes(termo),
      )
    : estados;
  return (
    <div>
      <label className={styles.field} htmlFor={id}>
        Buscar estado
        <input
          id={id}
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Ex.: Rio de Janeiro ou RJ"
          autoComplete="off"
        />
      </label>
      <p className="small muted" aria-live="polite">
        {visiveis.length} de {estados.length} estados
      </p>
      <ul>
        {visiveis.map((e) => (
          <li key={e.uf}>
            <Link href={`/estados/${e.uf.toLowerCase()}${query}`}>
              {e.nome} ({e.uf})
            </Link>{" "}
            <span className="small muted">— {e.regiao}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
