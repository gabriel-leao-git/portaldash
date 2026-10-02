import Link from "next/link";
import { EmptyState } from "@/components/ui/estados.tsx";

export default function NaoEncontrado() {
  return (
    <EmptyState titulo="Página não encontrada">
      <p>
        O endereço não existe ou o estado informado não faz parte do portal. <Link href="/">Voltar ao início</Link> ou{" "}
        <Link href="/estados">ver a lista de estados</Link>.
      </p>
    </EmptyState>
  );
}
