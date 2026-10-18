import type { QuestionLog } from "./types";

/** Limite por lançamento — o mesmo `check` da tabela `question_logs`. */
export const MAX_QUESTIONS_PER_LOG = 500;

/** Prefixo do id provisório de um lançamento que ainda não voltou do banco. */
export const PENDING_ID_PREFIX = "pendente-";

export interface QuestionStats {
  answered: number;
  correct: number;
  /** Percentual inteiro de acerto, ou `null` sem nenhuma questão feita. */
  pct: number | null;
}

export function questionStats(
  logs: readonly QuestionLog[],
  filter: (log: QuestionLog) => boolean = () => true,
): QuestionStats {
  let answered = 0;
  let correct = 0;
  for (const log of logs) {
    if (!filter(log)) continue;
    answered += log.answered;
    correct += log.correct;
  }
  return { answered, correct, pct: answered > 0 ? Math.round((correct / answered) * 100) : null };
}

export function topicQuestionStats(
  logs: readonly QuestionLog[],
  subjectId: string,
  topicIndex: number,
): QuestionStats {
  return questionStats(logs, (l) => l.subjectId === subjectId && l.topicIndex === topicIndex);
}

export function subjectQuestionStats(logs: readonly QuestionLog[], subjectId: string): QuestionStats {
  return questionStats(logs, (l) => l.subjectId === subjectId);
}

/** Valida um lançamento. Devolve a mensagem de erro, ou `null` se estiver certo. */
export function questionLogError(answered: unknown, correct: unknown): string | null {
  if (!Number.isInteger(answered) || (answered as number) < 1) {
    return "Informe quantas questões você fez.";
  }
  if ((answered as number) > MAX_QUESTIONS_PER_LOG) {
    return `No máximo ${MAX_QUESTIONS_PER_LOG} questões por lançamento.`;
  }
  if (!Number.isInteger(correct) || (correct as number) < 0) {
    return "Informe quantas você acertou.";
  }
  if ((correct as number) > (answered as number)) {
    return "Os acertos não podem passar do total de questões.";
  }
  return null;
}
