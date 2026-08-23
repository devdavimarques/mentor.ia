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

export function TabNav({ active, onChange }: TabNavProps) {
  return (
    <nav role="tablist" aria-label="Seções do ciclo" className="flex flex-wrap gap-1 px-6 pt-4">
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
            className={`flex items-center gap-1.5 rounded-t border-b-2 px-3 py-2 font-mono text-sm transition-colors ${
              isActive
                ? "border-gold text-parchment"
                : "text-muted hover:text-parchment border-transparent"
            }`}
          >
            <Icon size={14} aria-hidden />
            {label}
          </button>
        );
      })}
    </nav>
  );
}
