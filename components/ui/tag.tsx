interface TagProps {
  children: React.ReactNode;
  /** `accent` destaca (ex.: "mais cobrado"); o padrão é discreto. */
  tone?: "neutral" | "accent";
}

/** Selo ao lado do nome da matéria: "2ª volta", "1ª revisão", "mais cobrado"… */
export function Tag({ children, tone = "neutral" }: TagProps) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[0.7rem] font-semibold whitespace-nowrap ${
        tone === "accent" ? "bg-accent-soft text-accent-text" : "bg-surface-alt"
      }`}
    >
      {children}
    </span>
  );
}

/** Selo dos tópicos que mais caem nas provas. */
export function HotTag() {
  return <Tag tone="accent">mais cobrado</Tag>;
}
