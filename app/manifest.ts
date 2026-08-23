import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ciclo de Estudos · Soldado PM-BA",
    short_name: "Ciclo PM-BA",
    description:
      "Cronograma semanal ponderado pelo edital de Soldado da PM-BA (banca FCC), com acompanhamento de progresso por tópico.",
    lang: "pt-BR",
    start_url: "/",
    display: "standalone",
    background_color: "#12161a",
    theme_color: "#12161a",
    orientation: "portrait-primary",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
