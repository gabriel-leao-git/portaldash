import type { Metadata } from "next";
import Link from "next/link";
import styles from "@/components/dashboard/dashboard.module.css";
import { Avisos } from "@/components/ui/MethodologyTooltip.tsx";
import {
  ANEXO_BALANCO_ORCAMENTARIO,
  AVISO_SEM_SOMA_ESFERAS,
  AVISOS_INDICADOR,
  COLUNA_DESPESAS_PAGAS,
  CONTA_EXCETO_INTRA,
  GRUPOS,
  METODOLOGIA_VERSAO,
} from "@/server/methodology/indicador.ts";

export const metadata: Metadata = { title: "Metodologia" };

const RECORTES_NAO_VALIDADOS = [
  ["Total do Brasil (União + estados + municípios)", "A fonte não oferece consolidação; transferências entre esferas seriam contadas duas vezes."],
  ["Soma dos 27 estados", "Estruturas e coberturas diferem entre estados; somar exigiria regra para estados sem dado."],
  ["Despesa paga “no bimestre”", "A fonte só publica o acumulado no ano; diferenças entre bimestres podem misturar versões retificadas."],
  ["Despesa paga por área (saúde, educação…)", "O anexo bimestral por função não traz valor pago, só empenhado e liquidado."],
  ["Valores corrigidos pela inflação e per capita", "Índice, data-base e fonte de população ainda não foram validados."],
  ["Municípios", "Fora do escopo atual."],
] as const;

export default function PaginaMetodologia() {
  return (
    <>
      <section className={styles.hero}>
        <h1>Metodologia</h1>
        <p className={styles.heroLead}>
          Versão {METODOLOGIA_VERSAO}. Como cada número do PortalDash é obtido, o que ele inclui, o que fica de fora e
          por quê.
        </p>
      </section>

      <section className="section" aria-labelledby="indicador">
        <h2 id="indicador">O indicador principal</h2>
        <p>
          <strong>Despesas pagas no exercício, acumuladas até o bimestre, exceto intraorçamentárias.</strong> É o valor
          que cada ente declara ao Siconfi no Relatório Resumido da Execução Orçamentária (RREO), no Balanço Orçamentário (
          <code>{ANEXO_BALANCO_ORCAMENTARIO}</code>), coluna <code>{COLUNA_DESPESAS_PAGAS}</code>, linha{" "}
          <code>{CONTA_EXCETO_INTRA}</code>.
        </p>
        <p>
          A despesa pública passa por três etapas: o <strong>empenho</strong> reserva o dinheiro, a{" "}
          <strong>liquidação</strong> confirma que o bem ou serviço foi entregue e o <strong>pagamento</strong> é a saída
          efetiva do dinheiro. O PortalDash mostra o que já foi pago.
        </p>
        <h3>Inclui</h3>
        <ul>
          {GRUPOS.map((g) => (
            <li key={g.codConta}>{g.nome}</li>
          ))}
        </ul>
        <h3>Não inclui</h3>
        <ul>
          <li>Refinanciamento (rolagem) da dívida, que aparece em linha própria do balanço.</li>
          <li>Despesas intraorçamentárias, isto é, pagamentos entre órgãos do próprio ente (evita contar duas vezes).</li>
          <li>Restos a pagar de anos anteriores pagos no ano, que ficam em outro anexo do RREO.</li>
          <li>Valores empenhados ou liquidados que ainda não foram pagos.</li>
        </ul>
      </section>

      <section className="section" aria-labelledby="tempo">
        <h2 id="tempo">Período e datas</h2>
        <p>
          O valor é <strong>acumulado de 1º de janeiro até o fim do bimestre</strong> escolhido (o 4º bimestre vai até
          agosto, por exemplo). A fonte não publica o pago de um bimestre isolado, e os bimestres não devem ser somados.
          O 6º bimestre corresponde ao ano completo.
        </p>
        <p>Cada número traz três datas diferentes:</p>
        <ul>
          <li>
            <strong>Referência</strong>: o exercício e o bimestre a que o valor se refere.
          </li>
          <li>
            <strong>Status no Siconfi</strong>: data da homologação ou da última retificação registrada pela fonte.
          </li>
          <li>
            <strong>Coleta</strong>: quando o PortalDash buscou o dado e quando o conferiu pela última vez.
          </li>
        </ul>
      </section>

      <section className="section" aria-labelledby="validacao">
        <h2 id="validacao">Validação antes de publicar</h2>
        <p>Cada declaração coletada só é publicada se passar por verificações exatas, sem arredondamento:</p>
        <ul>
          <li>Despesas exceto intraorçamentárias = despesas correntes + despesas de capital.</li>
          <li>Correntes = pessoal + juros + outras correntes; capital = investimentos + inversões + amortização.</li>
          <li>Quando há linha intraorçamentária: subtotal = exceto intra + intra.</li>
          <li>Cada linha usada aparece uma única vez na declaração.</li>
        </ul>
        <p>
          Se uma nova versão falhar, a versão anterior validada continua publicada. Quando o ente retifica a declaração,
          a nova versão substitui a anterior, que fica guardada no histórico. Valores são guardados com o texto exato da
          fonte, sem arredondamento.
        </p>
        <p>
          A União foi conferida contra o RREO publicado pelo Tesouro Nacional (precisão de mil reais, que é a da
          publicação). Os detalhes estão no registro de validação da fonte, no repositório do projeto.
        </p>
      </section>

      <section className="section" aria-labelledby="comparar">
        <h2 id="comparar">Comparações</h2>
        <p>{AVISO_SEM_SOMA_ESFERAS}</p>
        <p>
          Valores absolutos refletem o tamanho de cada ente. Um valor alto, sozinho, não indica desperdício nem
          irregularidade.
        </p>
      </section>

      <section className="section" aria-labelledby="fora">
        <h2 id="fora">O que ainda não publicamos e por quê</h2>
        <div className="table-wrap">
          <table>
            <caption>Recortes ainda não validados</caption>
            <thead>
              <tr>
                <th scope="col">Recorte</th>
                <th scope="col">Motivo</th>
              </tr>
            </thead>
            <tbody>
              {RECORTES_NAO_VALIDADOS.map(([recorte, motivo]) => (
                <tr key={recorte}>
                  <th scope="row">{recorte}</th>
                  <td>{motivo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="section" aria-labelledby="avisos">
        <h2 id="avisos">Avisos que acompanham cada número</h2>
        <Avisos avisos={AVISOS_INDICADOR} />
      </section>

      <section className="section" aria-labelledby="correcoes">
        <h2 id="correcoes">Correções</h2>
        <p>Nenhuma correção publicada até o momento. Correções de cálculo geram nova versão da metodologia.</p>
        <p className="small">
          Fonte dos dados: <Link href="/fontes">Fontes</Link>.
        </p>
      </section>
    </>
  );
}
