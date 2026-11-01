import { addDays, fromIsoDate, isoWeekday, toIsoDate, weekStartOf } from "./date";
import { mockDayOfWeek } from "./schedule";
import type { Settings, StudyLog } from "./types";

/**
 * Sequência de dias cumpridos: dias de estudo seguidos em que a meta foi
 * batida — pelo menos `blocksPerDay` aulas do ciclo marcadas naquele dia.
 *
 * O cronograma das semanas passadas não fica guardado, então a meta vem das
 * configurações atuais. Folga (dia fora dos dias de estudo) e dia de simulado
 * não contam nem quebram a sequência. Hoje só entra quando a meta é batida, e
 * enquanto não é, a sequência de ontem continua valendo.
 */
export interface Streak {
  /** Dias cumpridos seguidos até hoje. */
  current: number;
  best: number;
  /** Aulas do ciclo marcadas hoje e a meta do dia (0 = hoje não é dia de estudo). */
  today: { done: number; goal: number };
}

/** Limite de dias olhados para trás: um ano basta para o recorde. */
const MAX_DAYS = 366;

export function studyStreak(logs: readonly StudyLog[], settings: Settings, today: string): Streak {
  const perDay = new Map<string, number>();
  let first = today;
  for (const log of logs) {
    if (log.kind !== "lesson" || !log.block) continue;
    perDay.set(log.studiedOn, (perDay.get(log.studiedOn) ?? 0) + 1);
    if (log.studiedOn < first) first = log.studiedOn;
  }

  const goal = settings.blocksPerDay;
  const isStudyDay = (iso: string) => {
    const date = fromIsoDate(iso);
    const weekday = isoWeekday(date);
    return settings.activeDays.includes(weekday) && mockDayOfWeek(settings, weekStartOf(iso)) !== weekday;
  };

  let run = 0;
  let best = 0;
  let date = fromIsoDate(first);
  const start = toIsoDate(addDays(fromIsoDate(today), -MAX_DAYS));
  if (toIsoDate(date) < start) date = fromIsoDate(start);

  for (let iso = toIsoDate(date); iso <= today; date = addDays(date, 1), iso = toIsoDate(date)) {
    if (!isStudyDay(iso)) continue;
    if ((perDay.get(iso) ?? 0) >= goal) {
      run++;
      best = Math.max(best, run);
    } else if (iso !== today) {
      // Hoje ainda pode ser cumprido: só um dia que já passou quebra a sequência.
      run = 0;
    }
  }

  return {
    current: run,
    best,
    today: { done: perDay.get(today) ?? 0, goal: isStudyDay(today) ? goal : 0 },
  };
}
