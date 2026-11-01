import { addDays, fromIsoDate, toIsoDate, weekStartOf } from "./date";
import { findSubject, SUBJECTS } from "./subjects";
import type { Settings, StudySession, Subject } from "./types";

/**
 * Tempo de estudo: cada parada do cronômetro (ou lançamento à mão) vira uma
 * sessão com a matéria e os minutos. Aqui ficam a validação e as somas.
 */

/** Uma sessão de até 12 horas: mais que isso é cronômetro esquecido ligado. */
export const MAX_SESSION_MINUTES = 720;

/** Valida uma sessão. Devolve a mensagem de erro, ou `null`. */
export function studySessionError(subjectId: unknown, lessonIndex: unknown, minutes: unknown): string | null {
  const subject = typeof subjectId === "string" ? findSubject(subjectId) : undefined;
  if (!subject) return "Escolha a matéria.";
  if (
    lessonIndex !== null &&
    !(Number.isInteger(lessonIndex) && (lessonIndex as number) >= 0 && (lessonIndex as number) < subject.lessons.length)
  ) {
    return "Aula inexistente no curso.";
  }
  if (!Number.isInteger(minutes) || (minutes as number) < 1) return "Informe pelo menos 1 minuto.";
  if ((minutes as number) > MAX_SESSION_MINUTES) return `No máximo ${MAX_SESSION_MINUTES / 60} horas por vez.`;
  return null;
}

/** "1h05", "45 min", "0 min". */
export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, "0")}`;
}

export function minutesOn(sessions: readonly StudySession[], date: string): number {
  return sessions.reduce((sum, s) => (s.studiedOn === date ? sum + s.minutes : sum), 0);
}

export interface SubjectTime {
  subject: Subject;
  /** Minutos na semana atual. */
  week: number;
  total: number;
  /** Fatia do tempo da semana (%) e a fatia que o peso da matéria pede. */
  weekShare: number;
  weightShare: number;
}

/**
 * Tempo de cada matéria na semana de `today` e no total, com a fatia que o
 * peso pede, para ver se o tempo bate com a importância da matéria.
 */
export function timeBySubject(
  sessions: readonly StudySession[],
  settings: Settings,
  today: string,
): { week: number; total: number; subjects: SubjectTime[] } {
  const weekStart = weekStartOf(today);
  const weekEnd = toIsoDate(addDays(fromIsoDate(weekStart), 6));
  const week = new Map<string, number>();
  const total = new Map<string, number>();
  for (const s of sessions) {
    total.set(s.subjectId, (total.get(s.subjectId) ?? 0) + s.minutes);
    if (s.studiedOn >= weekStart && s.studiedOn <= weekEnd) {
      week.set(s.subjectId, (week.get(s.subjectId) ?? 0) + s.minutes);
    }
  }
  const weekSum = [...week.values()].reduce((a, b) => a + b, 0);
  const totalSum = [...total.values()].reduce((a, b) => a + b, 0);
  const weightSum = SUBJECTS.reduce((sum, s) => sum + (settings.weights[s.id] ?? 0), 0);

  const subjects = SUBJECTS.filter((s) => (total.get(s.id) ?? 0) > 0)
    .map((subject) => {
      const w = week.get(subject.id) ?? 0;
      return {
        subject,
        week: w,
        total: total.get(subject.id) ?? 0,
        weekShare: weekSum > 0 ? Math.round((w / weekSum) * 100) : 0,
        weightShare: weightSum > 0 ? Math.round(((settings.weights[subject.id] ?? 0) / weightSum) * 100) : 0,
      };
    })
    .sort((a, b) => b.week - a.week || b.total - a.total);

  return { week: weekSum, total: totalSum, subjects };
}
