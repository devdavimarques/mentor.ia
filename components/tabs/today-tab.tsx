"use client";

import { BarChart3, CalendarCheck, ListChecks, Target } from "lucide-react";

import { useQuestions } from "@/components/questions-context";
import { LessonBlock, TopicBlock } from "@/components/topic-block";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StatPanel } from "@/components/ui/stat-panel";
import { Tag } from "@/components/ui/tag";
import { formatLongDate, formatShortDate, fromIsoDate } from "@/lib/date";
import { blockKey, overallProgress, type Progress, type StudiedMap } from "@/lib/progress";
import { questionStats } from "@/lib/questions";
import { daysBetween, type ReviewItem } from "@/lib/reviews";
import { DAY_LABELS, DAY_LABELS_FULL, SUBJECTS } from "@/lib/subjects";
import type { ScheduledBlock, WeekSchedule } from "@/lib/types";

interface TodayTabProps {
  today: Date;
  todayDate: string;
  todayIso: number;
  blocks: ScheduledBlock[];
  week: WeekSchedule | null;
  weekProgress: Progress;
  studied: StudiedMap;
  checked: ReadonlySet<string>;
  reviews: ReviewItem[];
  onToggleBlock: (block: ScheduledBlock) => void;
  onToggleReview: (item: ReviewItem) => void;
}

export function TodayTab({
  today,
  todayDate,
  todayIso,
  blocks,
  week,
  weekProgress,
  studied,
  checked,
  reviews,
  onToggleBlock,
  onToggleReview,
}: TodayTabProps) {
  const { logs } = useQuestions();
  const edital = overallProgress(studied, SUBJECTS);
  const questions = questionStats(logs);
  const reviewsDone = reviews.filter((r) => r.doneOn).length;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <div className="flex flex-col gap-8">
        <section>
          <p className="text-accent-text text-xs font-semibold tracking-wider uppercase">
            {DAY_LABELS_FULL[todayIso - 1]} · {formatLongDate(today)}
          </p>
          <h1 className="mt-1 mb-5 text-3xl font-extrabold tracking-tight">
            {blocks.length === 0
              ? "Dia livre"
              : `${blocks.length} bloco${blocks.length > 1 ? "s" : ""} para hoje`}
          </h1>

          {blocks.length === 0 ? (
            <div className="border-line text-muted rounded-2xl border border-dashed p-6 text-center text-sm">
              Sem blocos programados hoje no seu ciclo. Descanse, revise ou adiante a semana.
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {blocks.map((block) => (
                <LessonBlock
                  key={`${block.subjectId}:${block.lessonIndex}:${block.lap}`}
                  block={block}
                  checked={!!week && checked.has(blockKey(week.weekStart, block))}
                  onToggle={() => onToggleBlock(block)}
                />
              ))}
            </div>
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
          label="Semana atual"
          value={`${weekProgress.done} / ${weekProgress.total}`}
        >
          <ProgressBar value={weekProgress.pct} label="Blocos estudados na semana" />
        </StatPanel>

        {/* Os dois painéis pequenos vêm juntos: no celular dividem uma linha. */}
        <StatPanel icon={Target} label="Edital estudado" value={`${edital.pct}%`}>
          <ProgressBar value={edital.pct} label="Tópicos do edital estudados" />
          <p className="text-muted mt-2 text-xs tabular-nums">
            {edital.done} de {edital.total} tópicos
          </p>
        </StatPanel>

        {week && week.days.length > 0 && (
          <StatPanel icon={BarChart3} label="Blocos por dia" className="col-span-2 lg:col-span-1">
            <WeekBars week={week} todayIso={todayIso} checked={checked} />
          </StatPanel>
        )}

        <StatPanel
          icon={ListChecks}
          label="Questões resolvidas"
          className="col-span-2 lg:col-span-1"
          value={questions.answered.toLocaleString("pt-BR")}
        >
          <p className="text-muted text-xs tabular-nums">
            {questions.pct === null
              ? "Lance as questões pelo botão de cada tópico."
              : `${questions.pct}% de acerto no total`}
          </p>
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
      <span>estudado em {formatShortDate(fromIsoDate(item.studiedOn))}</span>
      {late > 0 && (
        <span className="text-accent-text font-semibold">
          atrasada {late} dia{late > 1 ? "s" : ""}
        </span>
      )}
    </>
  );
}

interface WeekBarsProps {
  week: WeekSchedule;
  todayIso: number;
  checked: ReadonlySet<string>;
}

/** Uma coluna por dia da semana: altura = blocos do dia, parte cheia = estudados. */
function WeekBars({ week, todayIso, checked }: WeekBarsProps) {
  const max = Math.max(1, ...week.days.map((day) => day.blocks.length));

  return (
    <div className="flex items-end gap-1.5">
      {DAY_LABELS.map((label, index) => {
        const day = week.days.find((d) => d.day === index + 1);
        const total = day?.blocks.length ?? 0;
        const done = day?.blocks.filter((b) => checked.has(blockKey(week.weekStart, b))).length ?? 0;
        const isToday = index + 1 === todayIso;

        return (
          <div key={label} className="flex flex-1 flex-col items-center gap-1.5">
            <div
              className="bg-surface-alt relative flex h-16 w-full flex-col justify-end overflow-hidden rounded-md"
              title={total > 0 ? `${DAY_LABELS_FULL[index]}: ${done} de ${total}` : undefined}
            >
              {total > 0 && (
                <div
                  className="bg-accent/30 flex w-full flex-col justify-end rounded-md"
                  style={{ height: `${(total / max) * 100}%` }}
                >
                  <div
                    className="bg-accent w-full rounded-md transition-[height] duration-300"
                    style={{ height: `${(done / total) * 100}%` }}
                  />
                </div>
              )}
            </div>
            <span
              className={`text-[0.65rem] font-semibold ${isToday ? "text-accent-text" : "text-muted"}`}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
