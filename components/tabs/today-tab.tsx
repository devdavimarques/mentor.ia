"use client";

import {
  CalendarCheck,
  ClipboardList,
  FastForward,
  Flag,
  GraduationCap,
  Target,
} from "lucide-react";
import { useState } from "react";

import { MockExamForm } from "@/components/mock-exam-form";
import { LessonBlock, TopicBlock } from "@/components/topic-block";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StatPanel } from "@/components/ui/stat-panel";
import { Tag } from "@/components/ui/tag";
import type { CycleEnd, ExamOutlook } from "@/lib/cycle";
import { formatLongDate, formatShortDate, fromIsoDate } from "@/lib/date";
import { blockKey, overallProgress, type StudiedMap } from "@/lib/progress";
import { daysBetween, type ReviewItem } from "@/lib/reviews";
import { DAY_LABELS_FULL, SUBJECTS } from "@/lib/subjects";
import type { MockResult, ScheduledBlock, WeekSchedule } from "@/lib/types";

interface TodayTabProps {
  today: Date;
  todayDate: string;
  todayIso: number;
  blocks: ScheduledBlock[];
  week: WeekSchedule | null;
  studied: StudiedMap;
  checked: ReadonlySet<string>;
  reviews: ReviewItem[];
  cycleEnd: CycleEnd | null;
  examOutlook: ExamOutlook | null;
  /** Dia do simulado pendente desta semana, ou `null`. */
  pendingMock: string | null;
  /** Hoje é dia de simulado: sem blocos do ciclo, com a opção de adiantar. */
  isMockDay: boolean;
  onToggleBlock: (block: ScheduledBlock) => void;
  onToggleReview: (item: ReviewItem) => void;
  onAddMockExam: (results: Record<string, MockResult>) => void;
  onAdvanceBlock: () => void;
}

export function TodayTab({
  today,
  todayDate,
  todayIso,
  blocks,
  week,
  studied,
  checked,
  reviews,
  cycleEnd,
  examOutlook,
  pendingMock,
  isMockDay,
  onToggleBlock,
  onToggleReview,
  onAddMockExam,
  onAdvanceBlock,
}: TodayTabProps) {
  const edital = overallProgress(studied, SUBJECTS);
  const isChecked = (block: ScheduledBlock) => !!week && checked.has(blockKey(week.weekStart, block));
  const dayDone = blocks.filter(isChecked).length;
  const dayPct = blocks.length > 0 ? Math.round((dayDone / blocks.length) * 100) : 0;
  const reviewsDone = reviews.filter((r) => r.doneOn).length;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <div className="flex flex-col gap-8">
        {pendingMock && (
          <MockReminder dueOn={pendingMock} todayDate={todayDate} onSubmit={onAddMockExam} />
        )}

        <section>
          <p className="text-accent-text text-xs font-semibold tracking-wider uppercase">
            {DAY_LABELS_FULL[todayIso - 1]} · {formatLongDate(today)}
          </p>
          <h1 className="mt-1 mb-5 text-3xl font-extrabold tracking-tight">
            {isMockDay
              ? "Dia de simulado"
              : blocks.length === 0
                ? "Dia livre"
                : `${blocks.length} bloco${blocks.length > 1 ? "s" : ""} para hoje`}
          </h1>

          {blocks.length === 0 ? (
            <div className="border-line text-muted rounded-2xl border border-dashed p-6 text-center text-sm">
              {isMockDay
                ? "Hoje o ciclo não tem blocos: o dia é do simulado. Se quiser estudar também, adiante blocos da fila."
                : "Sem blocos programados hoje no seu ciclo. Descanse, revise ou adiante a semana."}
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {blocks.map((block) => (
                <LessonBlock
                  key={`${block.subjectId}:${block.lessonIndex}:${block.lap}`}
                  block={block}
                  checked={isChecked(block)}
                  onToggle={() => onToggleBlock(block)}
                />
              ))}
            </div>
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

        <section aria-labelledby="revisoes-hoje">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h2 id="revisoes-hoje" className="text-xl font-bold tracking-tight">
              Revisões
            </h2>
            {reviews.length > 0 && (
              <span className="text-muted text-xs font-medium tabular-nums">
                {reviewsDone} de {reviews.length} feitas
              </span>
            )}
          </div>

          {reviews.length === 0 ? (
            <div className="border-line text-muted rounded-2xl border border-dashed p-5 text-center text-sm">
              Nenhuma revisão para hoje. Cada tópico estudado volta em 1, 7 e 30 dias.
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {reviews.map((item) => (
                <TopicBlock
                  key={`${item.subjectId}:${item.topicIndex}:${item.stage}`}
                  subjectId={item.subjectId}
                  topicIndex={item.topicIndex}
                  checked={item.doneOn !== null}
                  onToggle={() => onToggleReview(item)}
                  tags={<ReviewTags item={item} todayDate={todayDate} />}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      <aside className="grid grid-cols-2 content-start gap-3 lg:grid-cols-1">
        <StatPanel
          icon={CalendarCheck}
          label="Hoje"
          value={blocks.length > 0 ? `${dayPct}%` : "—"}
        >
          <ProgressBar value={dayPct} label="Blocos de hoje estudados" />
          <p className="text-muted mt-2 text-xs tabular-nums">
            {blocks.length > 0 ? `${dayDone} de ${blocks.length} blocos` : "Dia livre"}
          </p>
        </StatPanel>

        {/* Os dois painéis pequenos vêm juntos: no celular dividem uma linha. */}
        <StatPanel icon={Target} label="Edital estudado" value={`${edital.pct}%`}>
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

function ReviewTags({ item, todayDate }: { item: ReviewItem; todayDate: string }) {
  const late = item.doneOn ? 0 : daysBetween(item.dueOn, todayDate);
  return (
    <>
      <Tag>{item.stage}ª revisão</Tag>
      {item.reinforced && <Tag tone="accent">reforço</Tag>}
      <span>estudado em {formatShortDate(fromIsoDate(item.studiedOn))}</span>
      {late > 0 && (
        <span className="text-accent-text font-semibold">
          atrasada {late} dia{late > 1 ? "s" : ""}
        </span>
      )}
    </>
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
      ? ` Com ${outlook.suggestion.blocksPerDay} blocos por dia, termina em ${formatShortDate(
          fromIsoDate(outlook.suggestion.end),
        )}.`
      : " Nem com 4 blocos por dia fecha: acrescente dias de estudo em Configurar.";
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
  onSubmit: (results: Record<string, MockResult>) => void;
}

/** Lembrete do simulado da semana; abre o lançamento do resultado. */
function MockReminder({ dueOn, todayDate, onSubmit }: MockReminderProps) {
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
          <MockExamForm onSubmit={onSubmit} onCancel={() => setOpen(false)} />
        </div>
      )}
    </section>
  );
}
