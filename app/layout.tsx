import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";

import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["500"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "mentor.ia · Ciclo de Estudos Soldado PM-BA",
    template: "%s · mentor.ia",
  },
  description:
    "Ciclo de estudos ponderado pelo edital de Soldado da PM-BA (banca FCC): distribui as matérias por peso, acompanha voltas e registra o progresso por tópico.",
  applicationName: "mentor.ia",
  keywords: ["PM-BA", "concurso", "FCC", "ciclo de estudos", "Soldado", "edital"],
  authors: [{ name: "mentor.ia" }],
  formatDetection: { telephone: false },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    title: "mentor.ia · Ciclo de Estudos Soldado PM-BA",
    description:
      "Cronograma semanal gerado a partir do peso histórico de cada matéria no edital da FCC.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#070b17" },
    { media: "(prefers-color-scheme: light)", color: "#e9edf6" },
  ],
  colorScheme: "dark light",
  width: "device-width",
  initialScale: 1,
  // Ocupa a tela toda no iPhone; a barra de abas do rodapé compensa a área
  // da barra de gestos com `env(safe-area-inset-bottom)`.
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${jakarta.variable} ${jetbrains.variable}`}>
      <body className="bg-bg text-ink min-h-dvh font-sans antialiased">{children}</body>
    </html>
  );
}
