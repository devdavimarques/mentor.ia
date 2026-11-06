"use client";

import {
  CalendarCheck,
  ClipboardList,
  FastForward,
  Layers,
  Flag,
  Flame,
  GraduationCap,
  Target,
} from "lucide-react";
import { useState } from "react";

import { MockExamForm } from "@/components/mock-exam-form";
import { LessonBlock, ReviewBlockCard } from "@/components/topic-block";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StatPanel } from "@/components/ui/stat-panel";
import type { MockExamDetails } from "@/hooks/use-study-cycle";
import type { CycleEnd, ExamOutlook } from "@/lib/cycle";
import type { Streak } from "@/lib/streak";
import { formatLongDate, formatShortDate, fromIsoDate } from "@/lib/date";
import { blockKey, overallProgress, type StudiedMap } from "@/lib/progress";
import { formatHours, reviewBlocks as plannedReviewBlocks } from "@/lib/day-plan";
import type { ReviewBlock } from "@/lib/reviews";
import { formatMinutes } from "@/lib/study-time";
import { DAY_LABELS_FULL, SUBJECTS } from "@/lib/subjects";
import type { MockExam, MockResult, ScheduledBlock, Settings, WeekSchedule } from "@/lib/types";

interface TodayTabProps {
  today: Date;
  todayDate: string;
  todayIso: number;
  blocks: ScheduledBlock[];
  week: WeekSchedule | null;
  studied: StudiedMap;
  checked: ReadonlySet<string>;
  reviewBlocks: ReviewBlock[];
  settings: Settings;
  cycleEnd: CycleEnd | null;
  examOutlook: ExamOutlook | null;
  streak: Streak;
  /** Dia do simulado pendente desta semana, ou `null`. */
  pendingMock: string | null;
  /** Hoje é dia de simulado: sem blocos do ciclo, com a opção de adiantar. */
  isMockDay: boolean;
  onToggleBlock: (block: ScheduledBlock) => void;
  onToggleReviewBlock: (block: ReviewBlock) => void;
  mockExams: readonly MockExam[];
  onAddMockExam: (results: Record<string, MockResult>, details: MockExamDetails) => void;
  onAdvanceBlock: () => void;
  /** Minutos cronometrados hoje. */
  minutesToday: number;
  /** Flashcards para revisar hoje. */
  flashcardsDue: number;
  onOpenFlashcards: () => void;
}

export function TodayTab({
  today,
  todayDate,
  todayIso,
  blocks,
  week,
  studied,
  checked,
  reviewBlocks,
  settings,
  cycleEnd,
  examOutlook,
  streak,
  pendingMock,
  isMockDay,
  onToggleBlock,
  onToggleReviewBlock,
  mockExams,
  onAddMockExam,
  onAdvanceBlock,
  minutesToday,
  flashcardsDue,
  onOpenFlashcards,
}: TodayTabProps) {
  const edital = overallProgress(studied, SUBJECTS);
  const isChecked = (block: ScheduledBlock) => !!week && checked.has(blockKey(week.weekStart, block));
  // O dia junta teoria e revisão: o progresso conta os dois.
  const dayTotal = blocks.length + reviewBlocks.length;
  const dayDone = blocks.filter(isChecked).length + reviewBlocks.filter((b) => b.done).length;
  const dayPct = dayTotal > 0 ? Math.round((dayDone / dayTotal) * 100) : 0;
  const missingReviews = plannedReviewBlocks(settings) - reviewBlocks.length;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <div className="flex flex-col gap-8">
        {pendingMock && (
          <MockReminder
            dueOn={pendingMock}
            todayDate={todayDate}
            exams={mockExams}
            onSubmit={onAddMockExam}
          />
        )}

        <section>
          <p className="text-accent-text text-xs font-semibold tracking-wider uppercase">
            {DAY_LABELS_FULL[todayIso - 1]} · {formatLongDate(today)}
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight">
            {isMockDay
              ? "Dia de simulado"
              : dayTotal === 0
                ? "Dia livre"
                : `${dayTotal} bloco${dayTotal > 1 ? "s" : ""} para hoje`}
          </h1>
          <p className="text-muted mt-1 mb-5 text-sm tabular-nums">
            {blocks.length} de teoria · {reviewBlocks.length} de revisão · {formatHours(settings.studyMinutes)} no dia
            (blocos de {formatHours(settings.blockMinutes)})
          </p>

          {dayTotal === 0 ? (
            <div className="border-line text-muted rounded-2xl border border-dashed p-6 text-center text-sm">
              {isMockDay
                ? "Hoje o ciclo não tem blocos: o dia é do simulado. Se quiser estudar também, adiante blocos da fila."
                : "Sem blocos programados hoje no seu ciclo. Descanse ou adiante a semana."}
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {blocks.map((block) => (
                <LessonBlock
                  key={`${block.subjectId}:${block.lessonIndex}:${block.lap}`}
                  kind="Teoria"
                  block={block}
                  checked={isChecked(block)}
                  onToggle={() => onToggleBlock(block)}
                />
              ))}
              {reviewBlocks.map((block) => (
                <ReviewBlockCard
                  key={`revisao:${block.subjectId}`}
                  block={block}
                  todayDate={todayDate}
                  onToggle={() => onToggleReviewBlock(block)}
                />
              ))}
            </div>
          )}
          {missingReviews > 0 && (
            <p className="text-muted mt-3 text-xs">
              {reviewBlocks.length === 0 ? "Nenhuma revisão hoje" : `Só ${reviewBlocks.length} bloco${reviewBlocks.length > 1 ? "s" : ""} de revisão hoje`}
              : não há revisões pendentes em matérias fora da teoria do dia. Cada tópico estudado é
              revisado 2, 7, 14 e 21 dias depois.
            </p>
          )}

          {isMockDay && (
            <button
              type="button"
              onClick={onAdvanceBlock}
              className="border-line text-accent-text hover:border-accent-text/50 mt-3 flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors"
            >
              <FastForward size={15} aria-hidden />
              {blocks.length === 0 ? "Adiantar um bloco" : "Adiantar mais um bloco"}
            </button>
          )}
        </section>

        {flashcardsDue > 0 && (
          <button
            type="button"
            onClick={onOpenFlashcards}
            className="bg-surface border-line hover:border-accent-text/50 flex items-center gap-3 rounded-2xl border p-4 text-left text-sm transition-colors"
          >
            <span className="bg-accent-soft text-accent-text flex size-8 shrink-0 items-center justify-center rounded-lg">
              <Layers size={16} aria-hidden />
            </span>
            <span className="flex-1">
              <span className="block font-bold">
                {flashcardsDue} flashcard{flashcardsDue > 1 ? "s" : ""} para revisar hoje
              </span>
              <span className="text-muted text-xs">Toque para estudar na aba Flashcards.</span>
            </span>
          </button>
        )}
      </div>

      <aside className="grid grid-cols-2 content-start gap-3 lg:grid-cols-1">
        <StatPanel
          icon={CalendarCheck}
          label="Hoje"
          value={dayTotal > 0 ? `${dayPct}%` : "—"}
        >
          <ProgressBar value={dayPct} label="Blocos de hoje feitos" />
          <p className="text-muted mt-2 text-xs tabular-nums">
            {dayTotal > 0 ? `${dayDone} de ${dayTotal} blocos` : "Dia livre"}
            {minutesToday > 0 && ` · ${formatMinutes(minutesToday)} estudados`}
          </p>
        </StatPanel>

        <StatPanel
          icon={Flame}
          label="Sequência"
          value={`${streak.current} dia${streak.current === 1 ? "" : "s"}`}
        >
          <p className="text-muted text-xs tabular-nums">
            Recorde: {streak.best} dia{streak.best === 1 ? "" : "s"}
            {streak.today.goal > 0 &&
              (streak.today.done >= streak.today.goal
                ? " · hoje cumprido"
                : ` · hoje ${streak.today.done} de ${streak.today.goal} blocos`)}
          </p>
        </StatPanel>

        {/* Hoje e Sequência dividem uma linha no celular; o Edital ocupa a seguinte. */}
        <StatPanel
          icon={Target}
          label="Edital estudado"
          className="col-span-2 lg:col-span-1"
          value={`${edital.pct}%`}
        >
          <ProgressBar value={edital.pct} label="Tópicos do edital estudados" />
          <p className="text-muted mt-2 text-xs tabular-nums">
            {edital.done} de {edital.total} tópicos
          </p>
        </StatPanel>

        <StatPanel
          icon={Flag}
          label="Fim do ciclo"
          className="col-span-2 lg:col-span-1"
          value={cycleEnd ? formatShortDate(fromIsoDate(cycleEnd.date)) : "—"}
        >
          <p className="text-muted text-xs tabular-nums">
            {cycleEnd
              ? `${cycleEnd.lap}ª volta de todas as matérias · ${fromIsoDate(cycleEnd.date).getFullYear()}`
              : "Sem dias de estudo ou matérias no ciclo."}
          </p>
        </StatPanel>

        <StatPanel
          icon={GraduationCap}
          label="Prova"
          className="col-span-2 lg:col-span-1"
          value={
            examOutlook
              ? examOutlook.daysLeft >= 0
                ? `${examOutlook.daysLeft} dia${examOutlook.daysLeft === 1 ? "" : "s"}`
                : "Passou"
              : "—"
          }
        >
          <ExamOutlookText outlook={examOutlook} />
        </StatPanel>
      </aside>
    </div>
  );
}

/** "em 3 semanas" / "em 5 dias": folga ou atraso arredondado para leitura. */
function formatSpan(days: number): string {
  const abs = Math.abs(days);
  if (abs >= 14) {
    const weeks = Math.round(abs / 7);
    return `${weeks} semana${weeks > 1 ? "s" : ""}`;
  }
  return `${abs} dia${abs === 1 ? "" : "s"}`;
}

function ExamOutlookText({ outlook }: { outlook: ExamOutlook | null }) {
  const text = (() => {
    if (!outlook) return "Defina a data da prova em Configurar para ver se o ciclo fecha a tempo.";
    const exam = formatShortDate(fromIsoDate(outlook.examDate));
    if (outlook.daysLeft < 0) return `A prova foi em ${exam}. Atualize a data em Configurar.`;
    if (outlook.marginDays !== null && outlook.marginDays >= 0) {
      return outlook.marginDays === 0
        ? `Em ${exam}. O ciclo termina no dia da prova: sem folga.`
        : `Em ${exam}. O ciclo termina ${formatSpan(outlook.marginDays)} antes.`;
    }
    const late =
      outlook.marginDays === null
        ? "O ciclo não termina antes da prova."
        : `O ciclo termina ${formatSpan(outlook.marginDays)} depois.`;
    const fix = outlook.suggestion
      ? ` Com ${outlook.suggestion.blocksPerDay} blocos de teoria por dia, termina em ${formatShortDate(
          fromIsoDate(outlook.suggestion.end),
        )}.`
      : " Nem com 8 blocos de teoria por dia fecha: acrescente dias ou horas de estudo em Configurar.";
    return `Em ${exam}. ${late}${fix}`;
  })();

  const late = outlook && outlook.daysLeft >= 0 && (outlook.marginDays ?? -1) < 0;
  return (
    <p className={`text-xs ${late ? "text-accent-text font-semibold" : "text-muted"}`}>{text}</p>
  );
}

interface MockReminderProps {
  dueOn: string;
  todayDate: string;
  exams: readonly MockExam[];
  onSubmit: (results: Record<string, MockResult>, details: MockExamDetails) => void;
}

/** Lembrete do simulado da semana; abre o lançamento do resultado. */
function MockReminder({ dueOn, todayDate, exams, onSubmit }: MockReminderProps) {
  const [open, setOpen] = useState(false);
  const when = dueOn === todayDate ? "hoje" : `desde ${formatShortDate(fromIsoDate(dueOn))}`;

  return (
    <section
      aria-labelledby="simulado-semana"
      className="bg-surface border-accent-text/40 rounded-2xl border p-4"
    >
      <div className="flex flex-wrap items-center gap-3">
        <span className="bg-accent-soft text-accent-text flex size-8 shrink-0 items-center justify-center rounded-lg">
          <ClipboardList size={16} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="simulado-semana" className="font-bold tracking-tight">
            Simulado da semana
          </h2>
          <p className="text-muted text-xs">
            Pendente {when}. Faça a prova inteira no tempo real e lance o acerto por matéria.
          </p>
        </div>
        {!open && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="bg-accent text-on-accent hover:bg-accent-hover rounded-xl px-4 py-2 text-sm font-semibold transition-colors"
          >
            Lançar resultado
          </button>
        )}
      </div>
      {open && (
        <div className="border-line mt-4 border-t pt-4">
          <MockExamForm
            todayDate={todayDate}
            previous={exams}
            onSubmit={onSubmit}
            onCancel={() => setOpen(false)}
          />
        </div>
      )}
    </section>
  );
}
