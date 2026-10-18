import { SUBJECTS, topicLessons } from "./subjects";
import type { Pointers, ScheduledBlock, StudyLog, Subject, WeekSchedule } from "./types";

/** Chave de um tópico do edital. */
export function topicKey(subjectId: string, topicIndex: number): string {
  return `${subjectId}:${topicIndex}`;
}

/** Chave de uma aula do curso. */
export function lessonKey(subjectId: string, lessonIndex: number): string {
  return `${subjectId}#${lessonIndex}`;
}

/** Chave de um bloco: dentro de uma semana, matéria + aula + volta não se repetem. */
export function blockKey(weekStart: string, block: ScheduledBlock): string {
  return `${weekStart}|${block.subjectId}|${block.lessonIndex}|${block.lap}`;
}

/** `lessonKey` → data do primeiro estudo da aula. */
export type LessonsMap = ReadonlyMap<string, string>;

/** `topicKey` → data em que o tópico ficou estudado. Tópico presente aqui conta como visto. */
export type StudiedMap = ReadonlyMap<string, string>;

function keepEarliest(map: Map<string, string>, key: string, date: string) {
  const current = map.get(key);
  if (!current || date < current) map.set(key, date);
}

export function studiedLessons(logs: readonly StudyLog[]): LessonsMap {
  const lessons = new Map<string, string>();
  for (const log of logs) {
    if (log.kind === "lesson") keepEarliest(lessons, lessonKey(log.subjectId, log.lessonIndex), log.studiedOn);
  }
  return lessons;
}

/**
 * Um tópico fica estudado quando todas as aulas que o cobrem foram feitas — na
 * data da última delas — ou quando foi marcado à mão na aba Matérias. Vale a
 * data que vier primeiro. Refazer aulas numa 2ª volta não muda essa data.
 */
export function studiedTopics(logs: readonly StudyLog[], lessons: LessonsMap): StudiedMap {
  const manual = new Map<string, string>();
  for (const log of logs) {
    if (log.kind === "topic") keepEarliest(manual, topicKey(log.subjectId, log.topicIndex), log.studiedOn);
  }

  const studied = new Map<string, string>();
  for (const subject of SUBJECTS) {
    subject.topics.forEach((_topic, topicIndex) => {
      const key = topicKey(subject.id, topicIndex);
      const dates = topicLessons(subject, topicIndex).map((i) => lessons.get(lessonKey(subject.id, i)));
      const completedOn = dates.every((d) => d !== undefined)
        ? (dates as string[]).reduce((a, b) => (a > b ? a : b))
        : undefined;
      const manualOn = manual.get(key);

      const date = [completedOn, manualOn].filter((d): d is string => d !== undefined).sort()[0];
      if (date) studied.set(key, date);
    });
  }
  return studied;
}

/** Tópicos marcados à mão (aba Matérias). */
export function manualTopics(logs: readonly StudyLog[]): ReadonlySet<string> {
  const keys = new Set<string>();
  for (const log of logs) {
    if (log.kind === "topic") keys.add(topicKey(log.subjectId, log.topicIndex));
  }
  return keys;
}

/** Blocos marcados, pela `blockKey`. */
export function checkedBlocks(logs: readonly StudyLog[]): ReadonlySet<string> {
  const keys = new Set<string>();
  for (const log of logs) {
    if (log.kind !== "lesson" || !log.block) continue;
    keys.add(
      blockKey(log.block.weekStart, {
        subjectId: log.subjectId,
        lessonIndex: log.lessonIndex,
        lap: log.block.lap,
      }),
    );
  }
  return keys;
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

export function subjectProgress(studied: StudiedMap, subject: Subject): Progress {
  const done = subject.topics.reduce(
    (count, _topic, index) => count + (studied.has(topicKey(subject.id, index)) ? 1 : 0),
    0,
  );
  return toProgress(done, subject.topics.length);
}

/** Tópicos estudados sobre o total do edital, somando todas as matérias. */
export function overallProgress(studied: StudiedMap, subjects: readonly Subject[]): Progress {
  let done = 0;
  let total = 0;
  for (const subject of subjects) {
    const progress = subjectProgress(studied, subject);
    done += progress.done;
    total += progress.total;
  }
  return toProgress(done, total);
}

/** Aulas do tópico já feitas, sobre o total de aulas dele. */
export function topicLessonProgress(
  lessons: LessonsMap,
  subject: Subject,
  topicIndex: number,
): Progress {
  const indexes = topicLessons(subject, topicIndex);
  const done = indexes.filter((i) => lessons.has(lessonKey(subject.id, i))).length;
  return toProgress(done, indexes.length);
}

/** Aulas da matéria já feitas, sobre o total. */
export function subjectLessonProgress(lessons: LessonsMap, subject: Subject): Progress {
  const done = subject.lessons.filter((_l, i) => lessons.has(lessonKey(subject.id, i))).length;
  return toProgress(done, subject.lessons.length);
}

export function weekProgress(week: WeekSchedule | null, checked: ReadonlySet<string>): Progress {
  if (!week) return toProgress(0, 0);

  let done = 0;
  let total = 0;
  for (const day of week.days) {
    for (const block of day.blocks) {
      total++;
      if (checked.has(blockKey(week.weekStart, block))) done++;
    }
  }
  return toProgress(done, total);
}

/** Voltas completas já distribuídas para a matéria (0 = ainda na primeira). */
export function completedLaps(pointers: Pointers, subject: Subject): number {
  return Math.floor((pointers[subject.id] ?? 0) / subject.lessons.length);
}
