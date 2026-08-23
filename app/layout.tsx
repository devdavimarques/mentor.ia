import type { Metadata, Viewport } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Ciclo de Estudos · Soldado PM-BA",
    template: "%s · Ciclo de Estudos PM-BA",
  },
  description:
    "Ciclo de estudos ponderado pelo edital de Soldado da PM-BA (banca FCC): distribui as matérias por peso, acompanha voltas e registra o progresso por tópico.",
  applicationName: "Ciclo de Estudos PM-BA",
  keywords: ["PM-BA", "concurso", "FCC", "ciclo de estudos", "Soldado", "edital"],
  authors: [{ name: "mentor.ia" }],
  formatDetection: { telephone: false },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    title: "Ciclo de Estudos · Soldado PM-BA",
    description:
      "Cronograma semanal gerado a partir do peso histórico de cada matéria no edital da FCC.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#12161a",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-ink text-parchment min-h-dvh antialiased">{children}</body>
    </html>
  );
}
