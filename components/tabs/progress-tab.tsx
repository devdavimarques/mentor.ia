"use client";

import { getSubjectIcon } from "@/components/subject-icon";
import { ProgressBar } from "@/components/ui/progress-bar";
import { completedLaps, subjectProgress } from "@/lib/progress";
import { SUBJECTS } from "@/lib/subjects";
import type { CompletedMap, Pointers } from "@/lib/types";

interface ProgressTabProps {
  completed: CompletedMap;
  pointers: Pointers;
}

export function ProgressTab({ completed, pointers }: ProgressTabProps) {
  return (
    <div className="flex flex-col gap-3">
      {SUBJECTS.map((subject) => {
        const Icon = getSubjectIcon(subject.icon);
        const progress = subjectProgress(completed, subject);
        const laps = completedLaps(pointers, subject);

        return (
          <div key={subject.id} className="bg-surface border-line rounded border p-3">
            <div className="mb-2 flex items-center gap-2 text-sm">
              <Icon size={14} className="text-gold" aria-hidden />
              <span>{subject.name}</span>
              <span className="text-muted ml-auto font-mono text-xs">
                {progress.done}/{progress.total}
                {laps > 0 && ` · ${laps + 1}ª volta em andamento`}
              </span>
            </div>
            <ProgressBar value={progress.pct} label={`Progresso em ${subject.name}`} />
          </div>
        );
      })}
    </div>
  );
}
