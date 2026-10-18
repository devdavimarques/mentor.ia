import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "mentor.ia · Ciclo de Estudos PM-BA",
    short_name: "mentor.ia",
    description:
      "Cronograma semanal ponderado pelo edital de Soldado da PM-BA (banca FCC), com acompanhamento de progresso por tópico.",
    lang: "pt-BR",
    start_url: "/",
    display: "standalone",
    background_color: "#070b17",
    theme_color: "#070b17",
    orientation: "portrait-primary",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
