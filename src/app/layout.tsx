import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { connection } from "next/server";
import { SiteFooter } from "@/components/layout/SiteFooter.tsx";
import { SiteHeader } from "@/components/layout/SiteHeader.tsx";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "PortalDash — Você paga. Acompanhe para onde vai.", template: "%s · PortalDash" },
  description:
    "Portal público e crítico sobre despesas públicas brasileiras, com dados oficiais do Siconfi e metodologia aberta.",
};

export const viewport: Viewport = { themeColor: "#141619", colorScheme: "dark" };

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Todas as páginas são dinâmicas: o CSP usa nonce por requisição e o banco
  // não está acessível durante o build.
  await connection();
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <a href="#conteudo" className="skip-link">
          Pular para o conteúdo
        </a>
        <SiteHeader />
        <main id="conteudo" tabIndex={-1}>
          <div className="container">{children}</div>
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
