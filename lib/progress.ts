import { findSubject } from "./subjects";
import type { CompletedMap, Pointers, Subject, WeekSchedule } from "./types";

/** Chave de conclusão de um tópico. É global à matéria, não por volta. */
export function topicKey(subjectId: string, topicIndex: number): string {
  return `${subjectId}:${topicIndex}`;
}

export function isTopicDone(
  completed: CompletedMap,
  subjectId: string,
  topicIndex: number,
): boolean {
  return completed[topicKey(subjectId, topicIndex)] === true;
}

export interface Progress {
  done: number;
  total: number;
  /** Percentual inteiro de 0 a 100. */
  pct: number;
}

function toProgress(done: number, total: number): Progress {
  return { done, total, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
}

export function subjectProgress(completed: CompletedMap, subject: Subject): Progress {
  const done = subject.topics.reduce(
    (count, _topic, index) => count + (isTopicDone(completed, subject.id, index) ? 1 : 0),
    0,
  );
  return toProgress(done, subject.topics.length);
}

export function weekProgress(week: WeekSchedule | null, completed: CompletedMap): Progress {
  if (!week) return toProgress(0, 0);

  let done = 0;
  let total = 0;
  for (const day of week.days) {
    for (const block of day.blocks) {
      total++;
      if (isTopicDone(completed, block.subjectId, block.topicIndex)) done++;
    }
  }
  return toProgress(done, total);
}

/** Voltas completas já distribuídas para a matéria (0 = ainda na primeira). */
export function completedLaps(pointers: Pointers, subject: Subject): number {
  return Math.floor((pointers[subject.id] ?? 0) / subject.topics.length);
}

/** Remove chaves de matérias/tópicos que não existem mais no edital. */
export function pruneCompleted(completed: CompletedMap): CompletedMap {
  const pruned: CompletedMap = {};
  for (const [key, value] of Object.entries(completed)) {
    if (!value) continue;
    const separator = key.lastIndexOf(":");
    if (separator < 0) continue;
    const subject = findSubject(key.slice(0, separator));
    const index = Number(key.slice(separator + 1));
    if (subject && Number.isInteger(index) && index >= 0 && index < subject.topics.length) {
      pruned[key] = true;
    }
  }
  return pruned;
}
