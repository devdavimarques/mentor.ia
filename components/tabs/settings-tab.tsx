"use client";

import { RotateCcw } from "lucide-react";

import { Chip } from "@/components/ui/chip";
import { BLOCKS_PER_DAY_OPTIONS, DAY_LABELS, DAY_LABELS_FULL } from "@/lib/subjects";
import type { Settings } from "@/lib/types";

interface SettingsTabProps {
  settings: Settings;
  onToggleDay: (day: number) => void;
  onSetBlocksPerDay: (blocks: number) => void;
}

export function SettingsTab({ settings, onToggleDay, onSetBlocksPerDay }: SettingsTabProps) {
  return (
    <div className="flex max-w-md flex-col gap-6">
      <fieldset>
        <legend className="text-muted mb-2 font-mono text-xs tracking-widest uppercase">
          Dias de estudo
        </legend>
        <div className="flex flex-wrap gap-2">
          {DAY_LABELS.map((label, index) => (
            <Chip
              key={label}
              active={settings.activeDays.includes(index + 1)}
              onClick={() => onToggleDay(index + 1)}
              label={DAY_LABELS_FULL[index]}
            >
              {label}
            </Chip>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-muted mb-2 font-mono text-xs tracking-widest uppercase">
          Blocos de estudo por dia (1h cada)
        </legend>
        <div className="flex gap-2">
          {BLOCKS_PER_DAY_OPTIONS.map((n) => (
            <Chip
              key={n}
              active={settings.blocksPerDay === n}
              onClick={() => onSetBlocksPerDay(n)}
              label={`${n} bloco${n > 1 ? "s" : ""} por dia`}
            >
              {n}h
            </Chip>
          ))}
        </div>
      </fieldset>

      <p className="bg-surface border-line text-muted flex items-start gap-2 rounded border p-3 text-xs">
        <RotateCcw size={14} className="mt-0.5 shrink-0" aria-hidden />
        <span>
          Mudar essas opções gera um novo cronograma para a semana atual, mas o progresso de cada
          matéria (quantos assuntos já foram vistos) é preservado.
        </span>
      </p>
    </div>
  );
}
