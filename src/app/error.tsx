"use client";

import Link from "next/link";
import { ErrorState } from "@/components/ui/estados.tsx";

export default function ErroInesperado({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <ErrorState titulo="Dados temporariamente indisponíveis">
      <p>
        Não foi possível montar esta página agora. Nenhum número foi exibido para não mostrar informação incompleta.
      </p>
      <p>
        <button type="button" onClick={() => retry()}>
          Tentar novamente
        </button>{" "}
        <Link href="/fontes">Situação das fontes</Link>
      </p>
    </ErrorState>
  );
}
