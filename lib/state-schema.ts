import { BLOCK_MINUTES_OPTIONS, MAX_STUDY_MINUTES, normalizeDayPlan } from "./day-plan";
import {
  DEFAULT_SETTINGS,
  findSubject,
  MAX_WEIGHT,
  MOCK_EVERY_WEEKS_OPTIONS,
  SUBJECTS,
} from "./subjects";
import type {
  LateBlock,
  Pointers,
  ReplanNote,
  ScheduledBlock,
  ScheduledDay,
  Settings,
  WeekSchedule,
} from "./types";

/**
 * Validação do estado do ciclo.
 *
 * Serve a dois donos que não podemos assumir bem-comportados: as colunas
 * `jsonb` vindas do banco (que podem ter sido gravadas por uma versão anterior
 * do edital) e os dados enviados pelo navegador nas Server Actions, que são
 * endpoints públicos. Nada entra no app sem passar por aqui.
 */

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Um `yyyy-mm-dd` que existe no calendário — `2026-02-30` não passa. */
export function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

export function isUuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
  );
}

/** O tópico existe no edital atual. */
export function isKnownTopic(subjectId: unknown, topicIndex: unknown): boolean {
  if (typeof subjectId !== "string" || !Number.isInteger(topicIndex)) return false;
  const subject = findSubject(subjectId);
  return !!subject && (topicIndex as number) >= 0 && (topicIndex as number) < subject.topics.length;
}

/** A aula existe no curso atual. */
export function isKnownLesson(subjectId: unknown, lessonIndex: unknown): boolean {
  if (typeof subjectId !== "string" || !Number.isInteger(lessonIndex)) return false;
  const subject = findSubject(subjectId);
  return (
    !!subject && (lessonIndex as number) >= 0 && (lessonIndex as number) < subject.lessons.length
  );
}

/**
 * Pesos completos: cada matéria do edital com um inteiro de 0 a `MAX_WEIGHT`,
 * caindo no padrão quando falta ou é inválido. Se tudo vier zerado, volta ao
 * padrão — sem peso nenhum o ciclo não teria o que distribuir.
 */
export function parseWeights(value: unknown): Record<string, number> {
  const raw = isRecord(value) ? value : {};
  const weights: Record<string, number> = {};
  for (const subject of SUBJECTS) {
    const w = raw[subject.id];
    weights[subject.id] =
      Number.isInteger(w) && (w as number) >= 0 && (w as number) <= MAX_WEIGHT
        ? (w as number)
        : subject.weight;
  }
  return Object.values(weights).some((w) => w > 0) ? weights : { ...DEFAULT_SETTINGS.weights };
}

export function parseSettings(value: unknown): Settings {
  if (!isRecord(value)) {
    return { ...DEFAULT_SETTINGS, weights: { ...DEFAULT_SETTINGS.weights }, mockTargets: {} };
  }

  const activeDays = Array.isArray(value.activeDays)
    ? [
        ...new Set(
          value.activeDays.filter((d): d is number => Number.isInteger(d) && d >= 1 && d <= 7),
        ),
      ].sort((a, b) => a - b)
    : [...DEFAULT_SETTINGS.activeDays];

  // Antes das horas, o dia era só "N blocos de 1h": vira N horas de teoria e
  // mais 1h de revisão, e o cronograma de teoria continua o mesmo.
  const legacyBlocks =
    Number.isInteger(value.blocksPerDay) && (value.blocksPerDay as number) >= 1 && (value.blocksPerDay as number) <= 12
      ? (value.blocksPerDay as number)
      : DEFAULT_SETTINGS.blocksPerDay;
  const blockMinutes = (BLOCK_MINUTES_OPTIONS as readonly number[]).includes(value.blockMinutes as number)
    ? (value.blockMinutes as number)
    : 60;
  const theoryMinutes = intIn(value.theoryMinutes, 1, MAX_STUDY_MINUTES) ?? legacyBlocks * blockMinutes;
  const studyMinutes = intIn(value.studyMinutes, 1, MAX_STUDY_MINUTES) ?? theoryMinutes + 60;

  return normalizeDayPlan({
    activeDays,
    blocksPerDay: legacyBlocks,
    studyMinutes,
    theoryMinutes,
    blockMinutes,
    weights: parseWeights(value.weights),
    weightBase: parsePointers(value.weightBase, { allowNegative: true }),
    examDate: isIsoDate(value.examDate) ? value.examDate : null,
    // Configurações gravadas antes dos simulados não têm o campo: vale o padrão.
    mockEveryWeeks: MOCK_EVERY_WEEKS_OPTIONS.includes(
      value.mockEveryWeeks as (typeof MOCK_EVERY_WEEKS_OPTIONS)[number],
    )
      ? (value.mockEveryWeeks as number)
      : DEFAULT_SETTINGS.mockEveryWeeks,
    mockDay: isIsoDay(value.mockDay) ? value.mockDay : DEFAULT_SETTINGS.mockDay,
    mockTargets: parseMockTargets(value.mockTargets),
    flashcardNewPerDay: intIn(value.flashcardNewPerDay, 0, 200) ?? DEFAULT_SETTINGS.flashcardNewPerDay,
    flashcardReviewsPerDay: intIn(value.flashcardReviewsPerDay, 1, 2000) ?? DEFAULT_SETTINGS.flashcardReviewsPerDay,
  });
}

function intIn(value: unknown, min: number, max: number): number | null {
  return Number.isInteger(value) && (value as number) >= min && (value as number) <= max ? (value as number) : null;
}

/** Metas de acerto nos simulados: só matérias objetivas, inteiros de 1 a 100. */
export function parseMockTargets(value: unknown): Record<string, number> {
  if (!isRecord(value)) return {};
  const targets: Record<string, number> = {};
  for (const [id, pct] of Object.entries(value)) {
    const subject = findSubject(id);
    if (!subject || subject.group === "redacao") continue;
    if (Number.isInteger(pct) && (pct as number) >= 1 && (pct as number) <= 100) targets[id] = pct as number;
  }
  return targets;
}

/**
 * `allowNegative` é para `weightBase`: aula devolvida à matéria (fila por
 * matéria) desconta dela também, e a base pode ficar abaixo de zero.
 */
export function parsePointers(
  value: unknown,
  { allowNegative = false }: { allowNegative?: boolean } = {},
): Pointers {
  if (!isRecord(value)) return {};

  const pointers: Pointers = {};
  for (const [id, pointer] of Object.entries(value)) {
    if (findSubject(id) && Number.isInteger(pointer) && (allowNegative || (pointer as number) >= 0)) {
      pointers[id] = pointer as number;
    }
  }
  return pointers;
}

function isIsoDay(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 1 && (value as number) <= 7;
}

function parseBlock(raw: unknown): ScheduledBlock | null {
  if (!isRecord(raw) || !isKnownLesson(raw.subjectId, raw.lessonIndex)) return null;
  const block: ScheduledBlock = {
    subjectId: raw.subjectId as string,
    lessonIndex: raw.lessonIndex as number,
    lap: Number.isInteger(raw.lap) ? Math.max(1, raw.lap as number) : 1,
  };
  if (raw.carried === true) block.carried = true;
  if (raw.replanned === true) block.replanned = true;
  return block;
}

function parseBlocks(value: unknown): ScheduledBlock[] {
  if (!Array.isArray(value)) return [];
  return value.map(parseBlock).filter((b): b is ScheduledBlock => b !== null);
}

function parseLateBlocks(value: unknown): LateBlock[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((raw) => {
    const block = parseBlock(raw);
    if (!block || !isRecord(raw) || !isIsoDate(raw.weekStart) || !isIsoDay(raw.day)) return [];
    return [{ ...block, weekStart: raw.weekStart, day: raw.day }];
  });
}

function parseReplan(value: unknown): ReplanNote | null {
  if (!isRecord(value) || !isIsoDate(value.on) || !Number.isInteger(value.moved)) return null;
  const date = (v: unknown) => (isIsoDate(v) ? v : null);
  return {
    on: value.on,
    moved: Math.max(0, value.moved as number),
    endBefore: date(value.endBefore),
    endAfter: date(value.endAfter),
  };
}

/** Semanas gravadas antes da fila de atrasados vêm sem `spill`, `late` e `replan`: começam vazios. */
export function parseWeek(value: unknown): WeekSchedule | null {
  if (!isRecord(value) || !isIsoDate(value.weekStart) || !Array.isArray(value.days)) {
    return null;
  }

  const days: ScheduledDay[] = [];
  for (const rawDay of value.days) {
    if (!isRecord(rawDay) || !isIsoDay(rawDay.day)) continue;
    days.push({ day: rawDay.day, blocks: parseBlocks(rawDay.blocks) });
  }

  return {
    weekStart: value.weekStart,
    days,
    spill: parseBlocks(value.spill),
    late: parseLateBlocks(value.late),
    replan: parseReplan(value.replan),
  };
}
