"use client";

import {
  AlarmClock,
  BookOpen,
  CalendarDays,
  ClipboardList,
  Layers,
  ListChecks,
  Settings2,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

import type { TabId } from "@/lib/types";

/** `short` é o nome no celular e em telas médias, onde as oito abas não cabem por extenso. */
export const TABS: ReadonlyArray<{ id: TabId; label: string; short: string; icon: LucideIcon }> = [
  { id: "hoje", label: "Hoje", short: "Hoje", icon: CalendarDays },
  { id: "semana", label: "Semana", short: "Semana", icon: ListChecks },
  { id: "atrasadas", label: "Atrasadas", short: "Atrasos", icon: AlarmClock },
  { id: "materias", label: "Matérias", short: "Matérias", icon: BookOpen },
  { id: "simulados", label: "Simulados", short: "Simulados", icon: ClipboardList },
  { id: "flashcards", label: "Flashcards", short: "Cards", icon: Layers },
  { id: "progresso", label: "Progresso", short: "Progresso", icon: TrendingUp },
  { id: "config", label: "Configurar", short: "Config", icon: Settings2 },
];

interface TabNavProps {
  active: TabId;
  onChange: (tab: TabId) => void;
  /** Contador ao lado da aba (ex.: aulas atrasadas). Zero não aparece. */
  badges?: Partial<Record<TabId, number>>;
}

function Badge({ count, className = "" }: { count: number; className?: string }) {
  return (
    <span
      className={`bg-accent text-on-accent flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[0.6rem] leading-none font-bold tabular-nums ${className}`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

/** Abas no cabeçalho — só a partir de `lg`. No celular vale a `TabBar`. */
export function TabNav({ active, onChange, badges = {} }: TabNavProps) {
  return (
    <nav
      role="tablist"
      aria-label="Seções do ciclo"
      className="bg-surface border-line flex gap-1 rounded-xl border p-1"
    >
      {TABS.map(({ id, label, short, icon: Icon }) => {
        const isActive = active === id;
        const count = badges[id] ?? 0;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            id={`tab-${id}`}
            aria-selected={isActive}
            aria-controls={`panel-${id}`}
            aria-label={count > 0 ? `${label} (${count})` : label}
            onClick={() => onChange(id)}
            className={`flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-2 text-[0.8rem] font-semibold transition-colors xl:px-3 xl:text-sm ${
              isActive ? "bg-accent text-on-accent" : "text-muted hover:text-ink"
            }`}
          >
            <Icon size={15} aria-hidden />
            <span className="xl:hidden">{short}</span>
            <span className="hidden xl:inline">{label}</span>
            {count > 0 && (
              <Badge count={count} className={isActive ? "bg-on-accent text-accent" : ""} />
            )}
          </button>
        );
      })}
    </nav>
  );
}

/**
 * Abas presas no rodapé, para o celular: todas sempre à vista e ao alcance
 * do polegar, em vez de uma faixa rolável no topo que esconde as últimas.
 */
export function TabBar({ active, onChange, badges = {} }: TabNavProps) {
  return (
    <nav
      aria-label="Seções do ciclo"
      className="bg-frame/95 border-line fixed inset-x-0 bottom-0 z-20 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <div className="mx-auto grid max-w-lg grid-cols-8">
        {TABS.map(({ id, label, short, icon: Icon }) => {
          const isActive = active === id;
          const count = badges[id] ?? 0;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              aria-current={isActive ? "page" : undefined}
              aria-controls={`panel-${id}`}
              aria-label={count > 0 ? `${label} (${count})` : label}
              className={`flex min-w-0 flex-col items-center gap-1 px-0.5 pt-2.5 pb-2 text-[0.64rem] font-semibold transition-colors ${
                isActive ? "text-accent-text" : "text-muted hover:text-ink"
              }`}
            >
              <span
                className={`relative flex h-7 w-10 items-center justify-center rounded-full transition-colors ${
                  isActive ? "bg-accent-soft" : ""
                }`}
              >
                <Icon size={18} aria-hidden />
                {count > 0 && <Badge count={count} className="absolute -top-1 right-0.5" />}
              </span>
              <span className="max-w-full truncate">{short}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
