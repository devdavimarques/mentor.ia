"use client";

import { useState } from "react";

import { SubjectEvolution } from "@/components/evolution";
import { QuestionPanel } from "@/components/question-panel";
import { useQuestions } from "@/components/questions-context";
import { StudyTime } from "@/components/study-time";
import { getSubjectIcon } from "@/components/subject-icon";
import { QuestionsToggle } from "@/components/topic-block";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Tag } from "@/components/ui/tag";
import {
  completedLaps,
  overallProgress,
  subjectLessonProgress,
  subjectProgress,
  type LessonsMap,
  type StudiedMap,
} from "@/lib/progress";
import type { CycleEnd } from "@/lib/cycle";
import { formatShortDate, fromIsoDate } from "@/lib/date";
import {
  MIN_QUESTIONS_FOR_ACCURACY,
  questionStats,
  subjectQuestionStats,
  WEAK_ACCURACY_PCT,
  type TopicAccuracy,
} from "@/lib/questions";
import { findSubject, SUBJECTS, topicCode } from "@/lib/subjects";
import type { Pointers, Settings, StudyLog, StudySession } from "@/lib/types";

/** Quantos tópicos de pior acerto aparecem. */
const WEAK_TOPICS_SHOWN = 5;

interface ProgressTabProps {
  studied: StudiedMap;
  lessons: LessonsMap;
  pointers: Pointers;
  cycleEnd: CycleEnd | null;
  topicAccuracy: TopicAccuracy[];
  studyLogs: StudyLog[];
  studySessions: StudySession[];
  settings: Settings;
  todayDate: string;
  onAddStudySession: (subjectId: string, lessonIndex: number | null, minutes: number) => void;
  onDeleteStudySession: (id: string) => void;
}

export function ProgressTab({
  studied,
  lessons,
  pointers,
  cycleEnd,
  topicAccuracy,
  studyLogs,
  studySessions,
  settings,
  todayDate,
  onAddStudySession,
  onDeleteStudySession,
}: ProgressTabProps) {
  const { logs } = useQuestions();
  const edital = overallProgress(studied, SUBJECTS);
  const questions = questionStats(logs);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-accent-text text-xs font-semibold tracking-wider uppercase">
            Edital estudado
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight tabular-nums">
            {edital.pct}%
          </h1>
        </div>
        <div className="text-muted text-right text-sm tabular-nums">
          <p>
            {edital.done} de {edital.total} tópicos estudados
          </p>
          {questions.pct !== null && (
            <p>
              {questions.answered.toLocaleString("pt-BR")} questões · {questions.pct}% de acerto
            </p>
          )}
          {cycleEnd && (
            <p>
              Fim da {cycleEnd.lap}ª volta previsto para{" "}
              {formatShortDate(fromIsoDate(cycleEnd.date))}/{fromIsoDate(cycleEnd.date).getFullYear()}
            </p>
          )}
        </div>
      </div>

      <section aria-labelledby="evolucao" className="mb-8">
        <h2 id="evolucao" className="mb-3 text-xl font-bold tracking-tight">
          Evolução
        </h2>
        <SubjectEvolution studyLogs={studyLogs} todayDate={todayDate} />
      </section>

      <div className="mb-8 grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-2">
        <StudyTime
          sessions={studySessions}
          settings={settings}
          todayDate={todayDate}
          onAdd={onAddStudySession}
          onDelete={onDeleteStudySession}
        />
        <WeakTopics ranked={topicAccuracy} />
      </div>

      <h2 className="mb-3 text-xl font-bold tracking-tight">Por matéria</h2>
      <div className="grid gap-3 md:grid-cols-2">
        {SUBJECTS.map((subject) => {
          const Icon = getSubjectIcon(subject.icon);
          const progress = subjectProgress(studied, subject);
          const laps = completedLaps(pointers, subject);
          const subjectQuestions = subjectQuestionStats(logs, subject.id);
          const subjectLessons = subjectLessonProgress(lessons, subject);

          return (
            <div key={subject.id} className="bg-surface border-line rounded-2xl border p-4">
              <div className="mb-3 flex items-center gap-2.5 text-sm">
                <span className="bg-accent-soft text-accent-text flex size-7 shrink-0 items-center justify-center rounded-lg">
                  <Icon size={14} aria-hidden />
                </span>
                <span className="font-semibold">{subject.name}</span>
                <span className="text-muted ml-auto shrink-0 text-xs font-medium tabular-nums">
                  {progress.done}/{progress.total}
                </span>
              </div>
              <ProgressBar value={progress.pct} label={`Progresso em ${subject.name}`} />
              <div className="text-muted mt-2 flex flex-wrap justify-between gap-x-3 text-xs tabular-nums">
                <span>
                  {subjectLessons.done}/{subjectLessons.total} aulas
                </span>
                <span>
                  {subjectQuestions.pct === null
                    ? "Sem questões lançadas"
                    : `${subjectQuestions.answered} questões · ${subjectQuestions.pct}% de acerto`}
                </span>
                {laps > 0 && <span>{laps + 1}ª volta em andamento</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Os tópicos de pior acerto, para reforçar com revisão e questões. */
function WeakTopics({ ranked }: { ranked: readonly TopicAccuracy[] }) {
  const shown = ranked.slice(0, WEAK_TOPICS_SHOWN);

  return (
    <section aria-labelledby="reforcar">
      <h2 id="reforcar" className="mb-1 text-xl font-bold tracking-tight">
        Tópicos para reforçar
      </h2>
      <p className="text-muted mb-3 text-sm">
        Os {WEAK_TOPICS_SHOWN} piores acertos (com {MIN_QUESTIONS_FOR_ACCURACY}+ questões). Abaixo
        de {WEAK_ACCURACY_PCT}%, as revisões do tópico vêm mais cedo: 1, 3 e 14 dias.
      </p>

      {shown.length === 0 ? (
        <div className="border-line text-muted rounded-2xl border border-dashed p-5 text-center text-sm">
          Lance questões pelos tópicos para ver onde você mais erra.
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {shown.map((item) => (
            <WeakTopicRow key={`${item.subjectId}:${item.topicIndex}`} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}

function WeakTopicRow({ item }: { item: TopicAccuracy }) {
  const [open, setOpen] = useState(false);
  const subject = findSubject(item.subjectId);
  if (!subject) return null;
  const weak = item.stats.pct < WEAK_ACCURACY_PCT;

  return (
    <div className="@container bg-surface border-line rounded-xl border">
      <div className="flex items-start">
        <div className="min-w-0 flex-1 px-3 py-3 text-sm">
          <span className="text-muted flex items-center gap-2 text-xs">
            <span className="text-accent-text font-mono text-[0.7rem]">
              {topicCode(subject, item.topicIndex)}
            </span>
            <span className="truncate">{subject.name}</span>
          </span>
          <span className="mt-0.5 line-clamp-2 leading-snug font-medium">
            {subject.topics[item.topicIndex]}
          </span>
          <span className="text-muted mt-1.5 flex flex-wrap items-center gap-2 text-xs tabular-nums">
            {weak && <Tag tone="accent">reforço</Tag>}
            <span>
              {item.stats.pct}% de acerto · {item.stats.correct}/{item.stats.answered} questões
            </span>
          </span>
        </div>
        <QuestionsToggle open={open} pct={item.stats.pct} onClick={() => setOpen((v) => !v)} />
      </div>
      {open && (
        <div className="border-line border-t px-3 py-3">
          <QuestionPanel subjectId={item.subjectId} topicIndex={item.topicIndex} />
        </div>
      )}
    </div>
  );
}
