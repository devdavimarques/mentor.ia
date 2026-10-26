"use client";

import { ClipboardList } from "lucide-react";

import { LessonBlock } from "@/components/topic-block";
import { ProgressBar } from "@/components/ui/progress-bar";
import { dateOfWeekday, formatShortDate } from "@/lib/date";
import { blockKey, type Progress } from "@/lib/progress";
import { DAY_LABELS } from "@/lib/subjects";
import type { ScheduledBlock, WeekSchedule } from "@/lib/types";

interface WeekTabProps {
  week: WeekSchedule;
  todayIso: number | null;
  weekProgress: Progress;
  checked: ReadonlySet<string>;
  /** Dia ISO do simulado desta semana, ou `null`. */
  mockDay: number | null;
  /** O simulado da semana já foi lançado. */
  mockDone: boolean;
  onToggleBlock: (block: ScheduledBlock) => void;
}

export function WeekTab({
  week,
  todayIso,
  weekProgress,
  checked,
  mockDay,
  mockDone,
  onToggleBlock,
}: WeekTabProps) {
  if (week.days.length === 0) {
    return (
      <div className="border-line text-muted rounded-2xl border border-dashed p-6 text-center text-sm">
        Nenhum dia de estudo selecionado. Escolha os dias na aba{" "}
        <span className="text-ink font-semibold">Configurar</span>.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-accent-text text-xs font-semibold tracking-wider uppercase">
            Semana de {formatShortDate(dateOfWeekday(week.weekStart, 1))}
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Cronograma da semana</h1>
        </div>
        <div className="w-full sm:max-w-56">
          <p className="text-muted mb-1.5 text-right text-xs font-medium tabular-nums">
            {weekProgress.done} de {weekProgress.total} blocos
          </p>
          <ProgressBar value={weekProgress.pct} label="Blocos estudados na semana" />
          {week.spill.length > 0 && (
            <p className="text-muted mt-1.5 text-right text-xs tabular-nums">
              +{week.spill.length} bloco{week.spill.length > 1 ? "s" : ""} empurrado
              {week.spill.length > 1 ? "s" : ""} para a próxima semana
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(230px,1fr))]">
        {week.days.map((day) => {
          const isToday = day.day === todayIso;
          return (
            <div key={day.day}>
              <div
                className={`mb-3 flex items-baseline justify-between border-b-2 pb-1.5 text-sm font-bold ${
                  isToday ? "border-accent text-accent-text" : "border-line text-muted"
                }`}
              >
                <span>
                  {DAY_LABELS[day.day - 1]}
                  {isToday && " · hoje"}
                </span>
                <span className="text-xs font-medium tabular-nums">
                  {formatShortDate(dateOfWeekday(week.weekStart, day.day))}
                </span>
              </div>

              <div className="flex flex-col gap-2">
                {day.blocks.map((block) => {
                  const done = checked.has(blockKey(week.weekStart, block));
                  return (
                    <LessonBlock
                      key={`${block.subjectId}:${block.lessonIndex}:${block.lap}`}
                      block={block}
                      checked={done}
                      onToggle={() => onToggleBlock(block)}
                      tags={
                        !done &&
                        todayIso !== null &&
                        day.day < todayIso && (
                          <span className="text-accent-text font-semibold">atrasada</span>
                        )
                      }
                    />
                  );
                })}
                {day.day === mockDay && (
                  <div className="border-accent-text/40 text-muted flex items-center gap-2 rounded-2xl border border-dashed p-4 text-sm">
                    <ClipboardList size={15} className="text-accent-text shrink-0" aria-hidden />
                    <span>
                      <span className="text-ink font-semibold">Simulado</span>
                      {mockDone ? " · lançado" : " · a prova inteira, além dos blocos"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
