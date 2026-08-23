"use client";

import { CheckCircle2, Circle } from "lucide-react";

import { getSubjectIcon } from "@/components/subject-icon";
import { isTopicDone, subjectProgress } from "@/lib/progress";
import { SUBJECTS } from "@/lib/subjects";
import type { CompletedMap } from "@/lib/types";

interface SubjectsTabProps {
  completed: CompletedMap;
  onToggleTopic: (subjectId: string, topicIndex: number) => void;
}

export function SubjectsTab({ completed, onToggleTopic }: SubjectsTabProps) {
  return (
    <div className="flex flex-col gap-6">
      {SUBJECTS.map((subject) => {
        const Icon = getSubjectIcon(subject.icon);
        const progress = subjectProgress(completed, subject);

        return (
          <section key={subject.id}>
            <h2 className="mb-2 flex items-center gap-2">
              <Icon size={16} className="text-gold" aria-hidden />
              <span className="font-display text-[1.05rem] font-bold">{subject.name}</span>
              <span className="text-muted ml-auto font-mono text-xs">
                {progress.done}/{progress.total} · peso {subject.weight}
              </span>
            </h2>

            <div className="flex flex-col gap-1.5">
              {subject.topics.map((topic, index) => {
                const done = isTopicDone(completed, subject.id, index);
                return (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => onToggleTopic(subject.id, index)}
                    aria-pressed={done}
                    className="bg-surface border-line hover:border-muted flex items-center gap-2 rounded border p-2 text-left text-sm transition-colors"
                  >
                    {done ? (
                      <CheckCircle2 size={16} className="text-gold shrink-0" />
                    ) : (
                      <Circle size={16} className="text-muted shrink-0" />
                    )}
                    <span className="text-muted shrink-0 font-mono text-xs">
                      {subject.code}-{String(index + 1).padStart(2, "0")}
                    </span>
                    <span className={done ? "text-muted line-through" : "text-parchment"}>
                      {topic}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
