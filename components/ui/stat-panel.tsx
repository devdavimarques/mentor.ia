import type { LucideIcon } from "lucide-react";

interface StatPanelProps {
  icon: LucideIcon;
  label: string;
  /** Número em destaque. Opcional: alguns painéis só mostram um gráfico. */
  value?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export function StatPanel({ icon: Icon, label, value, children, className = "" }: StatPanelProps) {
  return (
    <div className={`bg-surface border-line min-w-0 rounded-2xl border p-4 ${className}`}>
      <div className="text-muted flex items-center gap-2 text-xs font-medium">
        <span className="bg-accent-soft text-accent-text flex size-6 items-center justify-center rounded-lg">
          <Icon size={13} aria-hidden />
        </span>
        {label}
      </div>
      {value !== undefined && (
        <div className="mt-2 text-2xl font-extrabold tracking-tight tabular-nums">{value}</div>
      )}
      {children && <div className="mt-3">{children}</div>}
    </div>
  );
}
