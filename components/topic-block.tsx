"use client";

import { CheckCircle2, Circle } from "lucide-react";

import { getSubjectIcon } from "@/components/subject-icon";
import { findSubject } from "@/lib/subjects";
import type { ScheduledBlock } from "@/lib/types";

interface TopicBlockProps {
  block: ScheduledBlock;
  completed: boolean;
  onToggle: () => void;
}

export function TopicBlock({ block, completed, onToggle }: TopicBlockProps) {
  const subject = findSubject(block.subjectId);
  if (!subject) return null;

  const Icon = getSubjectIcon(subject.icon);
  const topic = subject.topics[block.topicIndex];
  const code = `${subject.code}-${String(block.topicIndex + 1).padStart(2, "0")}`;

  return (
    <div
      className={`bg-surface flex items-start gap-3 rounded border p-4 ${
        completed ? "border-gold-dim" : "border-line"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={completed}
        aria-label={`${code} — ${topic}`}
        className="mt-0.5 shrink-0"
      >
        {completed ? (
          <CheckCircle2 size={20} className="text-gold" />
        ) : (
          <Circle size={20} className="text-muted" />
        )}
      </button>

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <Icon size={14} className="text-gold" />
          <span className="text-gold font-mono text-xs tracking-wider uppercase">{code}</span>
          {block.lap > 1 && (
            <span className="border-line text-muted rounded border px-1.5 py-0.5 font-mono text-xs">
              {block.lap}ª volta
            </span>
          )}
        </div>
        <div className="text-muted mb-1 text-xs">{subject.name}</div>
        <div
          className={`text-sm leading-snug ${
            completed ? "text-muted line-through" : "text-parchment"
          }`}
        >
          {topic}
        </div>
      </div>
    </div>
  );
}
