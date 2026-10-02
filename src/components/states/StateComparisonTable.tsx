import Link from "next/link";
import { compareDecimals } from "@/lib/decimal.ts";
import { formatarEscala, formatarReais } from "@/lib/formatacao.ts";
import { SITUACAO_SEM_DADO } from "@/lib/situacao.ts";
import type { IndicadorEnte } from "@/server/services/despesas.ts";

/**
 * Valores lado a lado, nunca somados. Ordenados por valor; sem dado ao fim.
 * Valores absolutos não medem eficiência: estados têm tamanhos diferentes.
 */
export function StateComparisonTable({
  itens,
  titulo,
  query,
}: {
  itens: readonly IndicadorEnte[];
  titulo: string;
  query: string;
}) {
  const ordenados = [...itens].sort((a, b) => {
    if (a.valor === null && b.valor === null) return a.ente.nome.localeCompare(b.ente.nome, "pt-BR");
    if (a.valor === null) return 1;
    if (b.valor === null) return -1;
    return compareDecimals(b.valor, a.valor);
  });
  return (
    <div className="table-wrap">
      <table>
        <caption>{titulo}</caption>
        <thead>
          <tr>
            <th scope="col">UF</th>
            <th scope="col">Estado</th>
            <th scope="col" className="num">
              Despesas pagas (arredondado)
            </th>
            <th scope="col" className="num">
              Valor exato
            </th>
            <th scope="col">Situação observada pelo PortalDash</th>
          </tr>
        </thead>
        <tbody>
          {ordenados.map((i) => (
            <tr key={i.ente.codIbge}>
              <td>{i.ente.uf}</td>
              <th scope="row">
                <Link href={`/estados/${i.ente.uf?.toLowerCase()}${query}`}>{i.ente.nome}</Link>
              </th>
              <td className="num">{i.valor === null ? "sem dado" : formatarEscala(i.valor).texto}</td>
              <td className="num">{i.valor === null ? "—" : formatarReais(i.valor)}</td>
              <td>
                {i.situacao === "disponivel"
                  ? `${i.proveniencia?.statusEntrega ?? "status não informado"} no Siconfi`
                  : SITUACAO_SEM_DADO[i.situacao].curto}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
