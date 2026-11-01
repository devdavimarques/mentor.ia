import { addDays, fromIsoDate, toIsoDate } from "./date";
import { isIsoDate } from "./state-schema";
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

/** Valor da questão sugerido no primeiro simulado: 80 questões valendo 100 pontos. */
export const DEFAULT_POINTS_PER_QUESTION = 1.25;
export const MAX_POINTS_PER_QUESTION = 100;
export const MAX_MOCK_TITLE_LENGTH = 60;
/** Simulado lançado depois de feito: até quanto tempo atrás a data pode ir. */
export const MAX_MOCK_DAYS_BACK = 365;

/** Valor da questão válido: positivo, até 2 casas decimais. */
export function isPointsPerQuestion(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value > 0 &&
    value <= MAX_POINTS_PER_QUESTION &&
    Math.abs(Math.round(value * 100) - value * 100) < 1e-6
  );
}

/**
 * Valida o cabeçalho do lançamento (nome, data e valor da questão). Devolve a
 * mensagem de erro, ou `null`. A data não pode ser futura nem muito antiga.
 */
export function mockDetailsError(
  title: unknown,
  takenOn: unknown,
  pointsPerQuestion: unknown,
  today: string,
): string | null {
  if (title !== null && (typeof title !== "string" || title.trim().length > MAX_MOCK_TITLE_LENGTH)) {
    return `O nome tem no máximo ${MAX_MOCK_TITLE_LENGTH} caracteres.`;
  }
  const oldest = toIsoDate(addDays(fromIsoDate(today), -MAX_MOCK_DAYS_BACK));
  if (!isIsoDate(takenOn) || takenOn > today || takenOn < oldest) return "Informe a data em que fez o simulado.";
  if (!isPointsPerQuestion(pointsPerQuestion)) return "Informe quanto vale cada questão (ex.: 1,25).";
  return null;
}

/** "56,25" — pontos com até 2 casas, no formato brasileiro. */
export function formatPoints(points: number): string {
  return points.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
}

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
  /** Acertos × valor da questão. */
  points: number;
  /** Questões feitas × valor da questão: a nota máxima possível. */
  maxPoints: number;
}

/** Multiplica em centésimos, para 45 × 1,25 dar 56,25 e não 56,249999. */
const times = (count: number, value: number) => Math.round(count * value * 100) / 100;

function score(answered: number, correct: number, pointsPerQuestion: number): MockScore {
  return {
    answered,
    correct,
    pct: Math.round((correct / answered) * 100),
    points: times(correct, pointsPerQuestion),
    maxPoints: times(answered, pointsPerQuestion),
  };
}

/** Nota de uma matéria num simulado. */
export function mockSubjectScore(exam: MockExam, result: MockResult): MockScore {
  return score(result.answered, result.correct, exam.pointsPerQuestion);
}

/** Total de um simulado, somando as matérias. */
export function mockTotal(exam: MockExam): MockScore {
  let answered = 0;
  let correct = 0;
  for (const r of Object.values(exam.results)) {
    answered += r.answered;
    correct += r.correct;
  }
  return score(Math.max(answered, 1), correct, exam.pointsPerQuestion);
}

/** Nome para mostrar: o dado no lançamento ou "Simulado de 01/11". */
export function mockLabel(exam: MockExam): string {
  if (exam.title) return exam.title;
  const d = fromIsoDate(exam.takenOn);
  return `Simulado de ${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export interface SubjectTrend {
  subject: Subject;
  latest: MockScore;
  /** Pontos percentuais em relação ao simulado anterior com a matéria; `null` no primeiro. */
  delta: number | null;
  /** Meta de acerto (%), se definida. */
  target: number | null;
}

/** Acerto de cada matéria no último simulado em que ela apareceu, a variação e a meta. */
export function subjectTrends(
  exams: readonly MockExam[],
  targets: Readonly<Record<string, number>> = {},
): SubjectTrend[] {
  const ordered = [...exams].sort((a, b) => (a.takenOn < b.takenOn ? -1 : a.takenOn > b.takenOn ? 1 : 0));
  return MOCK_SUBJECTS.flatMap((subject) => {
    const scores = ordered.flatMap((e) => {
      const r = e.results[subject.id];
      return r ? [mockSubjectScore(e, r)] : [];
    });
    if (scores.length === 0) return [];
    const latest = scores[scores.length - 1];
    const previous = scores.length > 1 ? scores[scores.length - 2] : null;
    return [{ subject, latest, delta: previous ? latest.pct - previous.pct : null, target: targets[subject.id] ?? null }];
  });
}
