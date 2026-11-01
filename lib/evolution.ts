import { addDays, formatShortDate, fromIsoDate, toIsoDate, weekStartOf } from "./date";
import { mockTotal } from "./mock-exams";
import { overallProgress, studiedLessons, studiedTopics, subjectProgress } from "./progress";
import { getSubject, SUBJECTS } from "./subjects";
import type { MockExam, QuestionLog, StudyLog } from "./types";

/**
 * Séries para os gráficos de evolução: um ponto por simulado, ou por semana.
 * Todas em percentual (0–100), para caberem num eixo só.
 */
export interface EvolutionPoint {
  /** Rótulo do eixo x, ex.: "26/10". */
  label: string;
  value: number;
  /** Linha de apoio no tooltip e na tabela, ex.: "56 de 80 questões". */
  detail: string;
}

/** Quantas semanas os gráficos semanais mostram, no máximo. */
const MAX_WEEKS = 26;

const short = (iso: string) => formatShortDate(fromIsoDate(iso));

/** Acerto em cada simulado, no total ou numa matéria (só os simulados que a tiveram). */
export function mockSeries(exams: readonly MockExam[], subjectId: string | null): EvolutionPoint[] {
  return [...exams]
    .sort((a, b) => (a.takenOn < b.takenOn ? -1 : a.takenOn > b.takenOn ? 1 : 0))
    .flatMap((exam) => {
      if (subjectId === null) {
        const total = mockTotal(exam);
        return [{ label: short(exam.takenOn), value: total.pct, detail: `${total.correct} de ${total.answered} questões` }];
      }
      const result = exam.results[subjectId];
      if (!result) return [];
      return [
        {
          label: short(exam.takenOn),
          value: Math.round((result.correct / result.answered) * 100),
          detail: `${result.correct} de ${result.answered} questões`,
        },
      ];
    });
}

/** Segundas-feiras desde a semana do primeiro registro até a atual (no máximo `MAX_WEEKS`). */
function weeksSince(firstDate: string | null, today: string): string[] {
  const current = weekStartOf(today);
  if (!firstDate) return [current];
  let week = weekStartOf(firstDate < today ? firstDate : today);
  const weeks: string[] = [];
  while (week <= current) {
    weeks.push(week);
    week = toIsoDate(addDays(fromIsoDate(week), 7));
  }
  return weeks.slice(-MAX_WEEKS);
}

/**
 * Edital estudado ao fim de cada semana, no total ou numa matéria: a mesma
 * conta da aba Progresso, refeita só com os registros até aquele dia.
 */
export function editalSeries(
  logs: readonly StudyLog[],
  subjectId: string | null,
  today: string,
): EvolutionPoint[] {
  const first = logs.reduce<string | null>((min, l) => (min === null || l.studiedOn < min ? l.studiedOn : min), null);
  return weeksSince(first, today).map((week) => {
    const weekEnd = toIsoDate(addDays(fromIsoDate(week), 6));
    const until = weekEnd < today ? weekEnd : today;
    const upTo = logs.filter((l) => l.studiedOn <= until);
    const studied = studiedTopics(upTo, studiedLessons(upTo));
    const progress =
      subjectId === null ? overallProgress(studied, SUBJECTS) : subjectProgress(studied, getSubject(subjectId));
    return {
      label: short(week),
      value: progress.pct,
      detail: `${progress.done} de ${progress.total} tópicos até ${short(until)}`,
    };
  });
}

/** Acerto nas questões lançadas em cada semana. Semana sem questões fica de fora. */
export function questionSeries(
  logs: readonly QuestionLog[],
  subjectId: string | null,
  today: string,
): EvolutionPoint[] {
  const filtered = subjectId === null ? logs : logs.filter((l) => l.subjectId === subjectId);
  const first = filtered.reduce<string | null>((min, l) => (min === null || l.loggedOn < min ? l.loggedOn : min), null);
  if (first === null) return [];
  return weeksSince(first, today).flatMap((week) => {
    const weekEnd = toIsoDate(addDays(fromIsoDate(week), 6));
    let answered = 0;
    let correct = 0;
    for (const l of filtered) {
      if (l.loggedOn < week || l.loggedOn > weekEnd) continue;
      answered += l.answered;
      correct += l.correct;
    }
    if (answered === 0) return [];
    return [
      {
        label: short(week),
        value: Math.round((correct / answered) * 100),
        detail: `${correct} de ${answered} questões na semana`,
      },
    ];
  });
}
