"use client";

import { TopicBlock } from "@/components/topic-block";
import { formatShortDate } from "@/lib/date";
import { isTopicDone } from "@/lib/progress";
import { DAY_LABELS_FULL } from "@/lib/subjects";
import type { CompletedMap, ScheduledBlock } from "@/lib/types";

interface TodayTabProps {
  today: Date;
  todayIso: number;
  blocks: ScheduledBlock[];
  completed: CompletedMap;
  onToggleTopic: (subjectId: string, topicIndex: number) => void;
}

export function TodayTab({ today, todayIso, blocks, completed, onToggleTopic }: TodayTabProps) {
  return (
    <div>
      <div className="text-muted mb-4 text-sm">
        {DAY_LABELS_FULL[todayIso - 1]}, {formatShortDate(today)}
      </div>

      {blocks.length === 0 ? (
        <div className="bg-surface border-line text-muted rounded border border-dashed p-6 text-center">
          Dia livre no seu ciclo — sem blocos programados hoje.
        </div>
      ) : (
        <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(280px,1fr))]">
          {blocks.map((block, index) => (
            <TopicBlock
              key={`${block.subjectId}:${block.topicIndex}:${index}`}
              block={block}
              completed={isTopicDone(completed, block.subjectId, block.topicIndex)}
              onToggle={() => onToggleTopic(block.subjectId, block.topicIndex)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
