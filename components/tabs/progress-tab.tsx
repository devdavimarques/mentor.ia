"use client";

import { useQuestions } from "@/components/questions-context";
import { getSubjectIcon } from "@/components/subject-icon";
import { ProgressBar } from "@/components/ui/progress-bar";
import {
  completedLaps,
  overallProgress,
  subjectLessonProgress,
  subjectProgress,
  type LessonsMap,
  type StudiedMap,
} from "@/lib/progress";
import { questionStats, subjectQuestionStats } from "@/lib/questions";
import { SUBJECTS } from "@/lib/subjects";
import type { Pointers } from "@/lib/types";

interface ProgressTabProps {
  studied: StudiedMap;
  lessons: LessonsMap;
  pointers: Pointers;
}

export function ProgressTab({ studied, lessons, pointers }: ProgressTabProps) {
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
        </div>
      </div>

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
