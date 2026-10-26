import { addDays, fromIsoDate, toIsoDate } from "./date";
import { blockDate, dayInWeek, mockDayOfWeek } from "./schedule";
import { findSubject, SUBJECTS } from "./subjects";
import type { MockExam, MockResult, Settings, Subject } from "./types";

/**
 * Simulados: a cada N semanas (`Settings.mockEveryWeeks`), no dia escolhido
 * (`Settings.mockDay`), a aba Hoje lembra de fazer a prova inteira e lançar o
 * acerto de cada matéria. Nesse dia o ciclo não põe blocos (`generateWeek`);
 * quem quiser estudar adianta blocos da fila.
 */

/** Matérias com questões objetivas (a redação fica de fora do simulado). */
export const MOCK_SUBJECTS: readonly Subject[] = SUBJECTS.filter((s) => s.group !== "redacao");

/** Limite por matéria num lançamento, bem acima de qualquer prova real. */
export const MAX_MOCK_QUESTIONS = 200;

/**
 * Simulado pendente da semana: a partir do dia dele e enquanto nenhum for
 * lançado na semana. Devolve o dia previsto, ou `null`.
 */
export function pendingMock(
  settings: Settings,
  weekStart: string,
  today: string,
  exams: readonly MockExam[],
): string | null {
  const day = mockDayOfWeek(settings, weekStart);
  if (day === null || dayInWeek(weekStart, today) < day) return null;
  return mockTakenInWeek(weekStart, exams) ? null : blockDate(weekStart, day);
}

/** Algum simulado foi lançado na semana que começa em `weekStart`. */
export function mockTakenInWeek(weekStart: string, exams: readonly MockExam[]): boolean {
  const weekEnd = toIsoDate(addDays(fromIsoDate(weekStart), 6));
  return exams.some((e) => e.takenOn >= weekStart && e.takenOn <= weekEnd);
}

/**
 * Resultados válidos de um simulado, só com as matérias objetivas que tiveram
 * questões. Serve ao banco (linhas antigas) e às Server Actions (entrada do
 * navegador): matéria desconhecida ou número fora da faixa é descartado.
 */
export function parseMockResults(value: unknown): Record<string, MockResult> {
  const results: Record<string, MockResult> = {};
  if (typeof value !== "object" || value === null || Array.isArray(value)) return results;

  for (const [subjectId, raw] of Object.entries(value)) {
    const subject = findSubject(subjectId);
    if (!subject || subject.group === "redacao") continue;
    if (typeof raw !== "object" || raw === null) continue;
    const { answered, correct } = raw as Record<string, unknown>;
    if (!Number.isInteger(answered) || !Number.isInteger(correct)) continue;
    const a = answered as number;
    const c = correct as number;
    if (a < 1 || a > MAX_MOCK_QUESTIONS || c < 0 || c > a) continue;
    results[subjectId] = { answered: a, correct: c };
  }
  return results;
}

/** Valida o formulário do simulado. Devolve a mensagem de erro, ou `null`. */
export function mockResultsError(results: Record<string, MockResult>): string | null {
  const entries = Object.entries(results);
  if (entries.length === 0) return "Lance pelo menos uma matéria.";
  for (const [subjectId, { answered, correct }] of entries) {
    const name = findSubject(subjectId)?.name ?? subjectId;
    if (!Number.isInteger(answered) || answered < 1 || answered > MAX_MOCK_QUESTIONS) {
      return `${name}: informe quantas questões fez.`;
    }
    if (!Number.isInteger(correct) || correct < 0) return `${name}: informe quantas acertou.`;
    if (correct > answered) return `${name}: os acertos passam do total.`;
  }
  return null;
}

export interface MockScore {
  answered: number;
  correct: number;
  pct: number;
}

function score(answered: number, correct: number): MockScore {
  return { answered, correct, pct: Math.round((correct / answered) * 100) };
}

/** Total de um simulado, somando as matérias. */
export function mockTotal(exam: MockExam): MockScore {
  let answered = 0;
  let correct = 0;
  for (const r of Object.values(exam.results)) {
    answered += r.answered;
    correct += r.correct;
  }
  return score(Math.max(answered, 1), correct);
}

export interface SubjectTrend {
  subject: Subject;
  latest: MockScore;
  /** Pontos percentuais em relação ao simulado anterior com a matéria; `null` no primeiro. */
  delta: number | null;
}

/** Acerto de cada matéria no último simulado em que ela apareceu, e a variação. */
export function subjectTrends(exams: readonly MockExam[]): SubjectTrend[] {
  const ordered = [...exams].sort((a, b) => (a.takenOn < b.takenOn ? -1 : a.takenOn > b.takenOn ? 1 : 0));
  return MOCK_SUBJECTS.flatMap((subject) => {
    const scores = ordered
      .map((e) => e.results[subject.id])
      .filter((r): r is MockResult => r !== undefined)
      .map((r) => score(r.answered, r.correct));
    if (scores.length === 0) return [];
    const latest = scores[scores.length - 1];
    const previous = scores.length > 1 ? scores[scores.length - 2] : null;
    return [{ subject, latest, delta: previous ? latest.pct - previous.pct : null }];
  });
}
