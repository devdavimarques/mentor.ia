"use client";

import {
  BookOpen,
  CalendarDays,
  ListChecks,
  Settings2,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

import type { TabId } from "@/lib/types";

export const TABS: ReadonlyArray<{ id: TabId; label: string; icon: LucideIcon }> = [
  { id: "hoje", label: "Hoje", icon: CalendarDays },
  { id: "semana", label: "Semana", icon: ListChecks },
  { id: "materias", label: "Matérias", icon: BookOpen },
  { id: "progresso", label: "Progresso", icon: TrendingUp },
  { id: "config", label: "Configurar", icon: Settings2 },
];

interface TabNavProps {
  active: TabId;
  onChange: (tab: TabId) => void;
}

/** Abas no cabeçalho — só a partir de `lg`. No celular vale a `TabBar`. */
export function TabNav({ active, onChange }: TabNavProps) {
  return (
    <nav
      role="tablist"
      aria-label="Seções do ciclo"
      className="bg-surface border-line flex gap-1 rounded-xl border p-1"
    >
      {TABS.map(({ id, label, icon: Icon }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            id={`tab-${id}`}
            aria-selected={isActive}
            aria-controls={`panel-${id}`}
            onClick={() => onChange(id)}
            className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
              isActive ? "bg-accent text-on-accent" : "text-muted hover:text-ink"
            }`}
          >
            <Icon size={15} aria-hidden />
            {label}
          </button>
        );
      })}
    </nav>
  );
}

/**
 * Abas presas no rodapé, para o celular: as cinco sempre à vista e ao alcance
 * do polegar, em vez de uma faixa rolável no topo que esconde as últimas.
 */
export function TabBar({ active, onChange }: TabNavProps) {
  return (
    <nav
      aria-label="Seções do ciclo"
      className="bg-frame/95 border-line fixed inset-x-0 bottom-0 z-20 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <div className="mx-auto grid max-w-lg grid-cols-5">
        {TABS.map(({ id, label, icon: Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              aria-current={isActive ? "page" : undefined}
              aria-controls={`panel-${id}`}
              className={`flex min-w-0 flex-col items-center gap-1 px-1 pt-2.5 pb-2 text-[0.68rem] font-semibold transition-colors ${
                isActive ? "text-accent-text" : "text-muted hover:text-ink"
              }`}
            >
              <span
                className={`flex h-7 w-12 items-center justify-center rounded-full transition-colors ${
                  isActive ? "bg-accent-soft" : ""
                }`}
              >
                <Icon size={18} aria-hidden />
              </span>
              <span className="max-w-full truncate">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
