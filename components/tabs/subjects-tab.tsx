"use client";

import { Check, ChevronDown } from "lucide-react";
import { useState } from "react";

import { QuestionPanel } from "@/components/question-panel";
import { useQuestions } from "@/components/questions-context";
import { getSubjectIcon } from "@/components/subject-icon";
import { QuestionsToggle } from "@/components/topic-block";
import { HotTag } from "@/components/ui/tag";
import { formatShortDate, fromIsoDate } from "@/lib/date";
import {
  subjectProgress,
  topicKey,
  topicLessonProgress,
  type LessonsMap,
  type Progress,
  type StudiedMap,
} from "@/lib/progress";
import { topicQuestionStats } from "@/lib/questions";
import { SUBJECTS, topicCode } from "@/lib/subjects";
import type { Subject } from "@/lib/types";

interface SubjectsTabProps {
  studied: StudiedMap;
  lessons: LessonsMap;
  /** Tópicos marcados à mão. */
  manual: ReadonlySet<string>;
  onToggleTopic: (subjectId: string, topicIndex: number) => void;
}

export function SubjectsTab({ studied, lessons, manual, onToggleTopic }: SubjectsTabProps) {
  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-muted mb-2 max-w-xl text-sm">
        Um tópico fica estudado quando você termina todas as aulas dele no ciclo. Se estudou
        por fora, marque aqui.
      </p>

      {SUBJECTS.map((subject) => {
        const Icon = getSubjectIcon(subject.icon);
        const progress = subjectProgress(studied, subject);

        return (
          // Acordeão nativo: começa fechado, abre com teclado e leitor de tela sem JS extra.
          <details
            key={subject.id}
            className="group bg-surface border-line open:border-accent-text/40 rounded-2xl border transition-colors"
          >
            <summary className="flex cursor-pointer list-none items-center gap-2.5 rounded-2xl p-4 select-none [&::-webkit-details-marker]:hidden">
              <span className="bg-accent-soft text-accent-text flex size-8 shrink-0 items-center justify-center rounded-lg">
                <Icon size={16} aria-hidden />
              </span>
              <h2 className="min-w-0 flex-1 truncate text-base font-bold tracking-tight sm:text-lg">
                {subject.name}
              </h2>
              <span className="text-muted shrink-0 text-xs font-medium tabular-nums">
                {progress.done}/{progress.total}
              </span>
              <ChevronDown
                size={18}
                aria-hidden
                className="text-muted shrink-0 transition-transform group-open:rotate-180"
              />
            </summary>

            <div className="flex flex-col gap-1.5 px-3 pb-3 sm:px-4 sm:pb-4">
              {subject.topics.map((topic, index) => (
                <TopicRow
                  key={topic}
                  subject={subject}
                  topicIndex={index}
                  studiedOn={studied.get(topicKey(subject.id, index)) ?? null}
                  lessons={topicLessonProgress(lessons, subject, index)}
                  manual={manual.has(topicKey(subject.id, index))}
                  onToggle={() => onToggleTopic(subject.id, index)}
                />
              ))}
            </div>
          </details>
        );
      })}
    </div>
  );
}

interface TopicRowProps {
  subject: Subject;
  topicIndex: number;
  /** Último estudo, ou `null` se o tópico ainda não foi visto. */
  studiedOn: string | null;
  /** Aulas do tópico feitas no ciclo. */
  lessons: Progress;
  /** Marcado à mão — só isso o botão desfaz. */
  manual: boolean;
  onToggle: () => void;
}

function TopicRow({ subject, topicIndex, studiedOn, lessons, manual, onToggle }: TopicRowProps) {
  const [open, setOpen] = useState(false);
  const { logs } = useQuestions();
  const stats = topicQuestionStats(logs, subject.id, topicIndex);
  const done = studiedOn !== null;
  // Concluído pelas aulas: não há marcação manual para desfazer aqui.
  const byLessons = done && !manual;

  return (
    <div className="@container bg-surface border-line hover:border-accent-text/50 rounded-xl border transition-colors">
      <div className="flex items-start">
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={done}
          disabled={byLessons}
          title={byLessons ? "Concluído pelas aulas do ciclo" : undefined}
          className="flex min-w-0 flex-1 items-start gap-3 rounded-xl px-3 py-3 text-left text-sm disabled:cursor-default"
        >
          <span
            aria-hidden
            className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border-[1.5px] ${
              done ? "bg-success border-success text-white" : "border-line"
            }`}
          >
            {done && <Check size={13} strokeWidth={3} />}
          </span>
          {/* Código, texto e contagem empilhados: o texto do edital ganha a largura toda. */}
          <span className="min-w-0 flex-1">
            <span className="text-accent-text block font-mono text-[0.7rem]">
              {topicCode(subject, topicIndex)}
            </span>
            <span
              className={`mt-0.5 block leading-snug ${done ? "text-muted" : "text-ink font-medium"}`}
            >
              {subject.topics[topicIndex]}
            </span>
            <span className="text-muted mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs tabular-nums">
              {subject.hotTopics.includes(topicIndex) && <HotTag />}
              <span>
                {lessons.done}/{lessons.total} aula{lessons.total > 1 ? "s" : ""}
                {studiedOn && <> · estudado em {formatShortDate(fromIsoDate(studiedOn))}</>}
              </span>
            </span>
          </span>
        </button>

        <QuestionsToggle open={open} pct={stats.pct} onClick={() => setOpen((v) => !v)} />
      </div>

      {open && (
        <div className="border-line border-t px-3 py-3">
          <QuestionPanel subjectId={subject.id} topicIndex={topicIndex} />
        </div>
      )}
    </div>
  );
}
