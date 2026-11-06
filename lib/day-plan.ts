import type { Settings } from "./types";

/**
 * O dia de estudo em horas: o total, a parte de teoria (o resto é revisão) e
 * a duração de um bloco. Daí saem quantos blocos de teoria (aulas do ciclo) e
 * quantos de revisão cabem no dia.
 *
 * Ex.: 4h por dia, 2h30 de teoria, blocos de 50 min → 3 blocos de teoria e 2
 * de revisão (1h30 ÷ 50 min, arredondado).
 */

export const BLOCK_MINUTES_OPTIONS = [25, 30, 40, 45, 50, 60, 90] as const;
export const MIN_STUDY_MINUTES = 30;
export const MAX_STUDY_MINUTES = 12 * 60;
/** As horas andam de meia em meia hora. */
export const STUDY_STEP_MINUTES = 30;
export const MAX_THEORY_BLOCKS = 12;

/** Blocos de teoria por dia: pelo menos 1, senão o ciclo não anda. */
export function theoryBlocks(s: Pick<Settings, "theoryMinutes" | "blockMinutes">): number {
  return Math.min(MAX_THEORY_BLOCKS, Math.max(1, Math.round(s.theoryMinutes / s.blockMinutes)));
}

/** Blocos de revisão por dia (pode ser 0, se todo o tempo for de teoria). */
export function reviewBlocks(s: Pick<Settings, "studyMinutes" | "theoryMinutes" | "blockMinutes">): number {
  return Math.max(0, Math.round((s.studyMinutes - s.theoryMinutes) / s.blockMinutes));
}

/** "4h", "2h30", "45 min". */
export function formatHours(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, "0")}`;
}

/**
 * Ajusta as horas para valores coerentes: total em passos de 30 min, teoria
 * entre um bloco e o total. `blocksPerDay` (usado pelo cronograma) sai da teoria.
 */
export function normalizeDayPlan<T extends Settings>(s: T): T {
  const blockMinutes = (BLOCK_MINUTES_OPTIONS as readonly number[]).includes(s.blockMinutes) ? s.blockMinutes : 60;
  const studyMinutes = Math.min(MAX_STUDY_MINUTES, Math.max(MIN_STUDY_MINUTES, s.studyMinutes));
  const theoryMinutes = Math.min(studyMinutes, Math.max(Math.min(blockMinutes, studyMinutes), s.theoryMinutes));
  const plan = { ...s, studyMinutes, theoryMinutes, blockMinutes };
  return { ...plan, blocksPerDay: theoryBlocks(plan) };
}
