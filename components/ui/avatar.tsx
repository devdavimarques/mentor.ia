/** Iniciais para o avatar — "Maria Silva" vira "MS". */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "?";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

interface AvatarProps {
  name: string;
  size?: "sm" | "md";
}

export function Avatar({ name, size = "md" }: AvatarProps) {
  return (
    <span
      aria-hidden
      className={`bg-accent text-on-accent flex shrink-0 items-center justify-center rounded-full font-bold ${
        size === "sm" ? "size-7 text-[0.65rem]" : "size-9 text-xs"
      }`}
    >
      {initials(name)}
    </span>
  );
}
