"use client";

interface ChipProps {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  label?: string;
}

export function Chip({ children, active, onClick, label }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      className={`rounded border px-3 py-1.5 font-mono text-xs tracking-wide transition-colors ${
        active
          ? "border-gold bg-gold/10 text-gold"
          : "border-line text-muted hover:border-muted hover:text-parchment"
      }`}
    >
      {children}
    </button>
  );
}
