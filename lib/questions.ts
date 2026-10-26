import { topicKey } from "./progress";
import { SUBJECTS } from "./subjects";
import type { QuestionLog } from "./types";

/** Limite por lançamento — o mesmo `check` da tabela `question_logs`. */
export const MAX_QUESTIONS_PER_LOG = 500;

/** Questões mínimas no tópico para o acerto contar: um erro em 2 questões não diz nada. */
export const MIN_QUESTIONS_FOR_ACCURACY = 5;

/** Abaixo deste acerto o tópico precisa de reforço (revisões mais próximas). */
export const WEAK_ACCURACY_PCT = 60;

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

export interface TopicAccuracy {
  subjectId: string;
  topicIndex: number;
  stats: QuestionStats & { pct: number };
}

/**
 * Tópicos com questões suficientes para o acerto contar, do pior para o
 * melhor. Empates ficam na ordem do edital.
 */
export function topicsByAccuracy(logs: readonly QuestionLog[]): TopicAccuracy[] {
  const totals = new Map<string, { answered: number; correct: number }>();
  for (const log of logs) {
    const key = topicKey(log.subjectId, log.topicIndex);
    const total = totals.get(key) ?? { answered: 0, correct: 0 };
    total.answered += log.answered;
    total.correct += log.correct;
    totals.set(key, total);
  }

  const items: TopicAccuracy[] = [];
  for (const subject of SUBJECTS) {
    subject.topics.forEach((_topic, topicIndex) => {
      const total = totals.get(topicKey(subject.id, topicIndex));
      if (!total || total.answered < MIN_QUESTIONS_FOR_ACCURACY) return;
      const pct = Math.round((total.correct / total.answered) * 100);
      items.push({ subjectId: subject.id, topicIndex, stats: { ...total, pct } });
    });
  }
  return items.sort((a, b) => a.stats.pct - b.stats.pct);
}

/** Tópicos com acerto abaixo de `WEAK_ACCURACY_PCT`, pela `topicKey`. */
export function weakTopicKeys(ranked: readonly TopicAccuracy[]): ReadonlySet<string> {
  return new Set(
    ranked
      .filter((t) => t.stats.pct < WEAK_ACCURACY_PCT)
      .map((t) => topicKey(t.subjectId, t.topicIndex)),
  );
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
