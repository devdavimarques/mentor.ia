"use client";

import { Minus, Plus, RotateCcw } from "lucide-react";

import { getSubjectIcon } from "@/components/subject-icon";
import { Chip } from "@/components/ui/chip";
import {
  BLOCK_MINUTES_OPTIONS,
  formatHours,
  MAX_STUDY_MINUTES,
  MIN_STUDY_MINUTES,
  reviewBlocks,
  STUDY_STEP_MINUTES,
  theoryBlocks,
} from "@/lib/day-plan";
import {
  DAY_LABELS,
  DAY_LABELS_FULL,
  DEFAULT_WEIGHTS,
  MAX_WEIGHT,
  MOCK_EVERY_WEEKS_OPTIONS,
  SUBJECTS,
} from "@/lib/subjects";
import type { Settings, Subject, SubjectGroup } from "@/lib/types";

interface SettingsTabProps {
  settings: Settings;
  todayDate: string;
  onToggleDay: (day: number) => void;
  onSetDayPlan: (plan: { studyMinutes: number; theoryMinutes: number; blockMinutes: number }) => void;
  onSetWeight: (subjectId: string, weight: number) => void;
  onResetWeights: () => void;
  onSetExamDate: (date: string | null) => void;
  onSetMockEveryWeeks: (weeks: number) => void;
  onSetMockDay: (day: number) => void;
}

const GROUPS: ReadonlyArray<{ id: SubjectGroup; label: string }> = [
  { id: "gerais", label: "Conhecimentos gerais" },
  { id: "especificos", label: "Conhecimentos específicos" },
  { id: "redacao", label: "Prova discursiva" },
];

export function SettingsTab({
  settings,
  todayDate,
  onToggleDay,
  onSetDayPlan,
  onSetWeight,
  onResetWeights,
  onSetExamDate,
  onSetMockEveryWeeks,
  onSetMockDay,
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

        <DayPlan settings={settings} onChange={onSetDayPlan} />

        <p className="bg-accent-soft text-ink flex items-start gap-2.5 rounded-xl p-4 text-sm">
          <RotateCcw size={16} className="text-accent-text mt-0.5 shrink-0" aria-hidden />
          <span>
            Mudar dias, blocos, pesos ou simulados gera um novo cronograma de hoje em diante. As
            aulas já feitas e o progresso de cada matéria são preservados.
          </span>
        </p>

        <fieldset>
          <legend className="mb-1 text-sm font-bold">Data da prova</legend>
          <p className="text-muted mb-3 text-sm">
            A aba Hoje mostra quantos dias faltam e se o ciclo termina a tempo.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              aria-label="Data da prova"
              value={settings.examDate ?? ""}
              min={todayDate}
              // Só grava data completa: enquanto digita, o campo devolve vazio.
              onChange={(e) => e.target.value && onSetExamDate(e.target.value)}
              className="bg-surface border-line focus:border-accent-text rounded-xl border px-3 py-2 text-sm tabular-nums outline-none [color-scheme:light_dark]"
            />
            {settings.examDate && (
              <button
                type="button"
                onClick={() => onSetExamDate(null)}
                className="text-accent-text hover:text-ink text-sm font-semibold"
              >
                Remover
              </button>
            )}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-1 text-sm font-bold">Simulados</legend>
          <p className="text-muted mb-3 text-sm">
            No dia do simulado o ciclo não tem blocos: as aulas vão para os outros dias. Se quiser
            estudar mesmo assim, adiante blocos pela aba Hoje.
          </p>
          <div className="flex flex-wrap gap-2">
            {MOCK_EVERY_WEEKS_OPTIONS.map((weeks) => {
              const label =
                weeks === 0 ? "Desligado" : weeks === 1 ? "Toda semana" : `A cada ${weeks} semanas`;
              return (
                <Chip
                  key={weeks}
                  active={settings.mockEveryWeeks === weeks}
                  onClick={() => onSetMockEveryWeeks(weeks)}
                >
                  {label}
                </Chip>
              );
            })}
          </div>
          {settings.mockEveryWeeks > 0 && (
            <>
              <p className="text-muted mt-4 mb-2 text-xs font-semibold tracking-wider uppercase">
                Dia do simulado
              </p>
              <div className="flex flex-wrap gap-2">
                {DAY_LABELS.map((label, index) => (
                  <Chip
                    key={label}
                    active={settings.mockDay === index + 1}
                    onClick={() => onSetMockDay(index + 1)}
                    label={`Simulado no ${DAY_LABELS_FULL[index].toLowerCase()}`}
                  >
                    {label}
                  </Chip>
                ))}
              </div>
            </>
          )}
        </fieldset>
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

const steps = (from: number, to: number) =>
  Array.from({ length: Math.floor((to - from) / STUDY_STEP_MINUTES) + 1 }, (_, i) => from + i * STUDY_STEP_MINUTES);

const selectClass =
  "bg-surface border-line focus:border-accent-text rounded-xl border px-3 py-2 text-sm tabular-nums outline-none";

interface DayPlanProps {
  settings: Settings;
  onChange: (plan: { studyMinutes: number; theoryMinutes: number; blockMinutes: number }) => void;
}

/**
 * Horas do dia: o total, quanto vai para teoria (o resto é revisão) e a
 * duração do bloco. Mostra quantos blocos de cada tipo cabem.
 */
function DayPlan({ settings, onChange }: DayPlanProps) {
  const { studyMinutes, theoryMinutes, blockMinutes } = settings;
  const change = (next: Partial<{ studyMinutes: number; theoryMinutes: number; blockMinutes: number }>) => {
    const plan = { studyMinutes, theoryMinutes, blockMinutes, ...next };
    // Diminuir o total não pode deixar a teoria maior que o dia.
    plan.theoryMinutes = Math.min(plan.theoryMinutes, plan.studyMinutes);
    onChange(plan);
  };
  const theory = theoryBlocks(settings);
  const review = reviewBlocks(settings);
  const reviewMinutes = studyMinutes - theoryMinutes;

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-1 text-sm font-bold">Horas de estudo por dia</legend>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1">
          <span className="text-muted text-xs font-medium">Total por dia</span>
          <select
            value={studyMinutes}
            onChange={(e) => change({ studyMinutes: Number(e.target.value) })}
            className={selectClass}
          >
            {steps(MIN_STUDY_MINUTES, MAX_STUDY_MINUTES).map((m) => (
              <option key={m} value={m}>
                {formatHours(m)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-muted text-xs font-medium">Teoria</span>
          <select
            value={theoryMinutes}
            onChange={(e) => change({ theoryMinutes: Number(e.target.value) })}
            className={selectClass}
          >
            {/* O valor atual entra mesmo fora dos passos de 30 min (ex.: plano antigo). */}
            {[...new Set([...steps(STUDY_STEP_MINUTES, studyMinutes), theoryMinutes])]
              .sort((a, b) => a - b)
              .map((m) => (
                <option key={m} value={m}>
                  {formatHours(m)}
                </option>
              ))}
          </select>
        </label>
        <div className="flex flex-col gap-1">
          <span className="text-muted text-xs font-medium">Revisão (o resto)</span>
          <span className="bg-surface-alt rounded-xl px-3 py-2 text-sm font-semibold tabular-nums">
            {reviewMinutes > 0 ? formatHours(reviewMinutes) : "—"}
          </span>
        </div>
      </div>

      <div>
        <span className="text-muted mb-1.5 block text-xs font-medium">Duração do bloco</span>
        <div className="flex flex-wrap gap-2">
          {BLOCK_MINUTES_OPTIONS.map((m) => (
            <Chip
              key={m}
              active={blockMinutes === m}
              onClick={() => change({ blockMinutes: m })}
              label={`Blocos de ${formatHours(m)}`}
            >
              {formatHours(m)}
            </Chip>
          ))}
        </div>
      </div>

      <p className="text-muted text-sm tabular-nums">
        Por dia: <strong className="text-ink">{theory} bloco{theory > 1 ? "s" : ""} de teoria</strong> (aulas do ciclo) e{" "}
        <strong className="text-ink">
          {review} de revisão
        </strong>{" "}
        (uma matéria por bloco, sempre diferente das matérias da teoria do dia).{" "}
        {settings.activeDays.length * theory} aulas por semana.
      </p>
    </fieldset>
  );
}
