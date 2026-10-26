"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { MockExamForm } from "@/components/mock-exam-form";
import { QuestionPanel } from "@/components/question-panel";
import { useQuestions } from "@/components/questions-context";
import { getSubjectIcon } from "@/components/subject-icon";
import { QuestionsToggle } from "@/components/topic-block";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Tag } from "@/components/ui/tag";
import { mockTotal, subjectTrends } from "@/lib/mock-exams";
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
  PENDING_ID_PREFIX,
  questionStats,
  subjectQuestionStats,
  WEAK_ACCURACY_PCT,
  type TopicAccuracy,
} from "@/lib/questions";
import { findSubject, SUBJECTS, topicCode } from "@/lib/subjects";
import type { MockExam, MockResult, Pointers } from "@/lib/types";

/** Quantos tópicos de pior acerto aparecem. */
const WEAK_TOPICS_SHOWN = 5;
/** Quantos simulados aparecem no histórico. */
const MOCK_HISTORY_SIZE = 6;

interface ProgressTabProps {
  studied: StudiedMap;
  lessons: LessonsMap;
  pointers: Pointers;
  cycleEnd: CycleEnd | null;
  topicAccuracy: TopicAccuracy[];
  mockExams: MockExam[];
  onAddMockExam: (results: Record<string, MockResult>) => void;
  onDeleteMockExam: (id: string) => void;
}

export function ProgressTab({
  studied,
  lessons,
  pointers,
  cycleEnd,
  topicAccuracy,
  mockExams,
  onAddMockExam,
  onDeleteMockExam,
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

      <div className="mb-8 grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-2">
        <WeakTopics ranked={topicAccuracy} />
        <MockExams exams={mockExams} onAdd={onAddMockExam} onDelete={onDeleteMockExam} />
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

interface MockExamsProps {
  exams: readonly MockExam[];
  onAdd: (results: Record<string, MockResult>) => void;
  onDelete: (id: string) => void;
}

/** Histórico dos simulados: total de cada um e a variação por matéria. */
function MockExams({ exams, onAdd, onDelete }: MockExamsProps) {
  const [adding, setAdding] = useState(false);
  const history = [...exams].reverse().slice(0, MOCK_HISTORY_SIZE);
  const trends = subjectTrends(exams);

  return (
    <section aria-labelledby="simulados">
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <h2 id="simulados" className="text-xl font-bold tracking-tight">
          Simulados
        </h2>
        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="text-accent-text hover:text-ink flex items-center gap-1 text-sm font-semibold"
          >
            <Plus size={14} aria-hidden />
            Lançar
          </button>
        )}
      </div>
      <p className="text-muted mb-3 text-sm">
        A evolução no formato da prova. A frequência do lembrete fica em Configurar.
      </p>

      {adding && (
        <div className="bg-surface border-line mb-3 rounded-2xl border p-4">
          <MockExamForm
            onSubmit={(results) => {
              onAdd(results);
              setAdding(false);
            }}
            onCancel={() => setAdding(false)}
          />
        </div>
      )}

      {history.length === 0 ? (
        !adding && (
          <div className="border-line text-muted rounded-2xl border border-dashed p-5 text-center text-sm">
            Nenhum simulado lançado ainda.
          </div>
        )
      ) : (
        <div className="flex flex-col gap-3">
          <ul className="bg-surface border-line divide-line divide-y rounded-2xl border">
            {history.map((exam) => {
              const total = mockTotal(exam);
              return (
                <li key={exam.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                  <span className="text-muted w-12 shrink-0 text-xs tabular-nums">
                    {formatShortDate(fromIsoDate(exam.takenOn))}
                  </span>
                  <span className="min-w-0 flex-1">
                    <ProgressBar value={total.pct} label={`Acerto no simulado de ${exam.takenOn}`} />
                  </span>
                  <span className="w-28 shrink-0 text-right font-semibold tabular-nums">
                    {total.pct}%{" "}
                    <span className="text-muted text-xs font-medium">
                      {total.correct}/{total.answered}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => onDelete(exam.id)}
                    disabled={exam.id.startsWith(PENDING_ID_PREFIX)}
                    aria-label={`Apagar simulado de ${formatShortDate(fromIsoDate(exam.takenOn))}`}
                    className="text-muted hover:text-danger shrink-0 disabled:opacity-30"
                  >
                    <Trash2 size={14} aria-hidden />
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="bg-surface border-line rounded-2xl border px-4 py-3">
            <h3 className="text-muted mb-2 text-xs font-semibold tracking-wider uppercase">
              Último simulado por matéria
            </h3>
            <ul className="flex flex-col gap-1.5 text-sm">
              {trends.map(({ subject, latest, delta }) => (
                <li key={subject.id} className="flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate">{subject.name}</span>
                  <span className="font-semibold tabular-nums">{latest.pct}%</span>
                  <span
                    className={`w-12 text-right text-xs font-semibold tabular-nums ${
                      delta === null || delta === 0
                        ? "text-muted"
                        : delta > 0
                          ? "text-success"
                          : "text-accent-text"
                    }`}
                  >
                    {delta === null ? "—" : delta > 0 ? `+${delta}` : delta}
                    {delta !== null && delta !== 0 && " pp"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
