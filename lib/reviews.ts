import { addDays, fromIsoDate, toIsoDate } from "./date";
import { topicKey, type StudiedMap } from "./progress";
import { SUBJECTS } from "./subjects";
import type { ReviewLog, ReviewStage } from "./types";

/**
 * Revisões espaçadas: 1, 7 e 30 dias depois de o tópico ficar estudado — quando
 * a última aula dele é feita, ou quando ele é marcado à mão.
 *
 * Nada de agenda gravada no banco: a revisão pendente é calculada a partir dos
 * estudos e das revisões feitas, então desmarcar uma aula recalcula tudo sozinho.
 */
export const REVIEW_INTERVALS: Readonly<Record<ReviewStage, number>> = { 1: 1, 2: 7, 3: 30 };

export const REVIEW_STAGES: readonly ReviewStage[] = [1, 2, 3];

export function isReviewStage(value: unknown): value is ReviewStage {
  return value === 1 || value === 2 || value === 3;
}

export interface ReviewItem {
  subjectId: string;
  topicIndex: number;
  stage: ReviewStage;
  /** Estudo que originou a revisão. */
  studiedOn: string;
  /** Quando a revisão passou a valer. Antes de hoje = atrasada. */
  dueOn: string;
  /** Preenchido quando a revisão foi feita hoje. */
  doneOn: string | null;
}

function shiftIso(iso: string, days: number): string {
  return toIsoDate(addDays(fromIsoDate(iso), days));
}

/** Dias inteiros entre duas datas `yyyy-mm-dd` (positivo quando `to` é depois). */
export function daysBetween(from: string, to: string): number {
  return Math.round((fromIsoDate(to).getTime() - fromIsoDate(from).getTime()) / 86_400_000);
}

/**
 * Revisões da aba Hoje: as pendentes que já venceram e as feitas hoje (para
 * poder desmarcar). Atrasadas primeiro, depois na ordem do edital.
 */
export function reviewsForDay(
  studied: StudiedMap,
  reviewLogs: readonly ReviewLog[],
  today: string,
): ReviewItem[] {
  const doneByTopic = new Map<string, ReviewLog[]>();
  for (const log of reviewLogs) {
    const key = topicKey(log.subjectId, log.topicIndex);
    const list = doneByTopic.get(key);
    if (list) list.push(log);
    else doneByTopic.set(key, [log]);
  }

  const items: ReviewItem[] = [];

  for (const subject of SUBJECTS) {
    subject.topics.forEach((_topic, topicIndex) => {
      const key = topicKey(subject.id, topicIndex);
      const studiedOn = studied.get(key);
      if (!studiedOn) return;

      // Revisões anteriores ao último estudo pertencem a uma sequência antiga.
      const done = (doneByTopic.get(key) ?? []).filter((log) => log.doneOn >= studiedOn);
      const doneOnByStage = new Map(done.map((log) => [log.stage, log.doneOn]));

      let previousDone = studiedOn;
      for (const stage of REVIEW_STAGES) {
        // Uma revisão nunca vence no mesmo dia da anterior: se a 1ª atrasou,
        // a 2ª espera pelo menos até o dia seguinte.
        const scheduled = shiftIso(studiedOn, REVIEW_INTERVALS[stage]);
        const earliest = shiftIso(previousDone, 1);
        const dueOn = scheduled > earliest ? scheduled : earliest;
        const doneOn = doneOnByStage.get(stage);

        if (doneOn) {
          if (doneOn === today) {
            items.push({ subjectId: subject.id, topicIndex, stage, studiedOn, dueOn, doneOn });
          }
          previousDone = doneOn;
          continue;
        }

        if (dueOn <= today) {
          items.push({ subjectId: subject.id, topicIndex, stage, studiedOn, dueOn, doneOn: null });
        }
        break;
      }
    });
  }

  return items.sort((a, b) => (a.dueOn < b.dueOn ? -1 : a.dueOn > b.dueOn ? 1 : 0));
}
