"use client";

import { Minus, Plus, RotateCcw } from "lucide-react";

import { getSubjectIcon } from "@/components/subject-icon";
import { Chip } from "@/components/ui/chip";
import {
  BLOCKS_PER_DAY_OPTIONS,
  DAY_LABELS,
  DAY_LABELS_FULL,
  DEFAULT_WEIGHTS,
  MAX_WEIGHT,
  SUBJECTS,
} from "@/lib/subjects";
import type { Settings, Subject, SubjectGroup } from "@/lib/types";

interface SettingsTabProps {
  settings: Settings;
  onToggleDay: (day: number) => void;
  onSetBlocksPerDay: (blocks: number) => void;
  onSetWeight: (subjectId: string, weight: number) => void;
  onResetWeights: () => void;
}

const GROUPS: ReadonlyArray<{ id: SubjectGroup; label: string }> = [
  { id: "gerais", label: "Conhecimentos gerais" },
  { id: "especificos", label: "Conhecimentos específicos" },
  { id: "redacao", label: "Prova discursiva" },
];

export function SettingsTab({
  settings,
  onToggleDay,
  onSetBlocksPerDay,
  onSetWeight,
  onResetWeights,
}: SettingsTabProps) {
  const weeklyBlocks = settings.activeDays.length * settings.blocksPerDay;
  const totalWeight = SUBJECTS.reduce((sum, s) => sum + (settings.weights[s.id] ?? 0), 0);
  const isDefault = SUBJECTS.every((s) => settings.weights[s.id] === DEFAULT_WEIGHTS[s.id]);

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)]">
      <div className="flex flex-col gap-7">
        <h1 className="text-3xl font-extrabold tracking-tight">Configurar ciclo</h1>

        <fieldset>
          <legend className="mb-3 text-sm font-bold">Dias de estudo</legend>
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
          <legend className="mb-3 text-sm font-bold">Blocos de estudo por dia (1h cada)</legend>
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

        <p className="bg-accent-soft text-ink flex items-start gap-2.5 rounded-xl p-4 text-sm">
          <RotateCcw size={16} className="text-accent-text mt-0.5 shrink-0" aria-hidden />
          <span>
            Mudar qualquer opção desta tela gera um novo cronograma para a semana atual. As aulas
            já feitas e o progresso de cada matéria são preservados.
          </span>
        </p>
      </div>

      <section aria-labelledby="pesos">
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <h2 id="pesos" className="text-xl font-bold tracking-tight">
            Peso das matérias
          </h2>
          {!isDefault && (
            <button
              type="button"
              onClick={onResetWeights}
              className="text-accent-text hover:text-ink text-sm font-semibold"
            >
              Restaurar padrão
            </button>
          )}
        </div>
        <p className="text-muted mb-5 text-sm">
          Quanto maior o peso, mais blocos a matéria recebe por semana. O padrão segue o número de
          questões de cada matéria na prova de Soldado PM-BA (FCC, 2023) e o tamanho do conteúdo.
          Peso 0 tira a matéria do ciclo.
        </p>

        <div className="flex flex-col gap-6">
          {GROUPS.map((group) => (
            <div key={group.id}>
              <h3 className="text-muted mb-2 text-xs font-semibold tracking-wider uppercase">
                {group.label}
              </h3>
              <div className="flex flex-col gap-1.5">
                {SUBJECTS.filter((s) => s.group === group.id).map((subject) => (
                  <WeightRow
                    key={subject.id}
                    subject={subject}
                    weight={settings.weights[subject.id] ?? 0}
                    perWeek={
                      totalWeight > 0
                        ? (weeklyBlocks * (settings.weights[subject.id] ?? 0)) / totalWeight
                        : 0
                    }
                    onChange={(w) => onSetWeight(subject.id, w)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

interface WeightRowProps {
  subject: Subject;
  weight: number;
  /** Blocos por semana que esse peso dá, em média. */
  perWeek: number;
  onChange: (weight: number) => void;
}

function WeightRow({ subject, weight, perWeek, onChange }: WeightRowProps) {
  const Icon = getSubjectIcon(subject.icon);
  const isDefault = weight === DEFAULT_WEIGHTS[subject.id];
  const stepClass =
    "border-line hover:border-accent-text/50 hover:text-ink text-muted flex size-8 items-center justify-center rounded-lg border transition-colors disabled:pointer-events-none disabled:opacity-30";

  return (
    <div className="bg-surface border-line flex items-center gap-3 rounded-xl border px-3 py-2">
      <span className="bg-accent-soft text-accent-text flex size-7 shrink-0 items-center justify-center rounded-lg">
        <Icon size={14} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{subject.name}</span>
        <span className="text-muted block text-xs tabular-nums">
          {subject.group === "redacao"
            ? "redação"
            : `${subject.examQuestions} questões na prova`}
          {" · "}
          {weight === 0
            ? "fora do ciclo"
            : `≈ ${perWeek.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} por semana`}
        </span>
      </span>

      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={() => onChange(weight - 1)}
          disabled={weight <= 0}
          className={stepClass}
          aria-label={`Diminuir peso de ${subject.name}`}
        >
          <Minus size={14} aria-hidden />
        </button>
        <span
          className={`w-7 text-center text-sm font-extrabold tabular-nums ${
            isDefault ? "text-ink" : "text-accent-text"
          }`}
          aria-live="polite"
          title={isDefault ? "Peso padrão" : `Padrão: ${DEFAULT_WEIGHTS[subject.id]}`}
        >
          {weight}
        </span>
        <button
          type="button"
          onClick={() => onChange(weight + 1)}
          disabled={weight >= MAX_WEIGHT}
          className={stepClass}
          aria-label={`Aumentar peso de ${subject.name}`}
        >
          <Plus size={14} aria-hidden />
        </button>
      </div>
    </div>
  );
}
