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
      className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
        active
          ? "border-accent bg-accent text-on-accent"
          : "border-line text-muted hover:border-muted hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}
