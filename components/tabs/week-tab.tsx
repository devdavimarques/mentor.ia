"use client";

import { TopicBlock } from "@/components/topic-block";
import { dateOfWeekday, formatShortDate } from "@/lib/date";
import { isTopicDone } from "@/lib/progress";
import { DAY_LABELS } from "@/lib/subjects";
import type { CompletedMap, WeekSchedule } from "@/lib/types";

interface WeekTabProps {
  week: WeekSchedule;
  todayIso: number | null;
  completed: CompletedMap;
  onToggleTopic: (subjectId: string, topicIndex: number) => void;
}

export function WeekTab({ week, todayIso, completed, onToggleTopic }: WeekTabProps) {
  if (week.days.length === 0) {
    return (
      <div className="bg-surface border-line text-muted rounded border border-dashed p-6 text-center">
        Nenhum dia de estudo selecionado. Escolha os dias na aba{" "}
        <span className="text-parchment">Configurar</span>.
      </div>
    );
  }

  return (
    <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(230px,1fr))]">
      {week.days.map((day) => {
        const isToday = day.day === todayIso;
        return (
          <div key={day.day}>
            <div
              className={`border-line mb-2 flex items-baseline justify-between border-b pb-1 font-mono text-xs tracking-widest uppercase ${
                isToday ? "text-gold" : "text-muted"
              }`}
            >
              <span>
                {DAY_LABELS[day.day - 1]} {isToday && "· hoje"}
              </span>
              <span className="normal-case">{formatShortDate(dateOfWeekday(week.weekStart, day.day))}</span>
            </div>

            <div className="flex flex-col gap-2">
              {day.blocks.map((block, index) => (
                <TopicBlock
                  key={`${block.subjectId}:${block.topicIndex}:${index}`}
                  block={block}
                  completed={isTopicDone(completed, block.subjectId, block.topicIndex)}
                  onToggle={() => onToggleTopic(block.subjectId, block.topicIndex)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
