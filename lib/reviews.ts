import { addDays, fromIsoDate, toIsoDate } from "./date";
import { topicKey, type StudiedMap } from "./progress";
import { SUBJECTS } from "./subjects";
import type { ReviewLog, ReviewStage } from "./types";

/**
 * Revisões espaçadas: o mesmo tópico é revisado 2, 7, 14 e 21 dias depois de
 * ficar estudado — quando a última aula dele é feita, ou quando ele é marcado
 * à mão. Feita a de 21 dias, o ciclo recomeça a partir dela (2, 7, 14, 21…),
 * sem fim.
 *
 * No dia, a revisão vem em **blocos**, como a teoria: cada bloco é a revisão
 * de um tópico. A matéria de um bloco de revisão
 * nunca é uma das que têm teoria no dia; se a revisão vencida for de uma
 * delas, ela espera, e o bloco puxa a revisão de outra matéria (mesmo que
 * ainda não tenha vencido).
 *
 * Nada de agenda gravada no banco: a revisão pendente é calculada a partir dos
 * estudos e das revisões feitas, então desmarcar uma aula recalcula tudo sozinho.
 */
export const REVIEW_INTERVALS: Readonly<Record<ReviewStage, number>> = { 1: 2, 2: 7, 3: 14, 4: 21 };

export const REVIEW_STAGES: readonly ReviewStage[] = [1, 2, 3, 4];
/** Trava de segurança do laço de ciclos (cada um leva no mínimo 21 dias). */
const MAX_REVIEW_CYCLES = 100;

export function isReviewStage(value: unknown): value is ReviewStage {
  return value === 1 || value === 2 || value === 3 || value === 4;
}

export interface ReviewItem {
  subjectId: string;
  topicIndex: number;
  stage: ReviewStage;
  /** Estudo que originou a revisão. */
  studiedOn: string;
  /** Quando a revisão vence. Antes de hoje = atrasada; depois = adiantada. */
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
 * Para cada tópico estudado: a próxima revisão pendente (vencida ou não) e as
 * revisões feitas hoje. Depois da 4ª revisão, a próxima é a 1ª do ciclo seguinte.
 */
export function reviewItems(studied: StudiedMap, reviewLogs: readonly ReviewLog[], today: string): ReviewItem[] {
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
      const done = (doneByTopic.get(key) ?? [])
        .filter((log) => log.doneOn >= studiedOn)
        .sort((a, b) => (a.doneOn < b.doneOn ? -1 : a.doneOn > b.doneOn ? 1 : 0));

      // Feita a de 21 dias, o ciclo recomeça: 2, 7, 14 e 21 dias contados do
      // dia dessa revisão, e assim por diante.
      let cycleStart = studiedOn;
      let previousDone = studiedOn;
      let firstCycle = true;
      for (let cycle = 0; cycle < MAX_REVIEW_CYCLES; cycle++) {
        const start = cycleStart;
        // Revisões deste ciclo: as feitas depois do início dele (no 1º, a partir do estudo).
        const inCycle = done.filter((log) => (firstCycle ? log.doneOn >= start : log.doneOn > start));
        const doneOnByStage = new Map<ReviewStage, string>();
        for (const log of inCycle) if (!doneOnByStage.has(log.stage)) doneOnByStage.set(log.stage, log.doneOn);
        const base = { subjectId: subject.id, topicIndex, studiedOn: start };

        let finished = true;
        for (const stage of REVIEW_STAGES) {
          // Uma revisão nunca vence no mesmo dia da anterior: se uma atrasou,
          // a seguinte espera pelo menos até o dia seguinte.
          const scheduled = shiftIso(start, REVIEW_INTERVALS[stage]);
          const earliest = shiftIso(previousDone, 1);
          const dueOn = scheduled > earliest ? scheduled : earliest;
          const doneOn = doneOnByStage.get(stage);

          if (doneOn) {
            if (doneOn === today) items.push({ ...base, stage, dueOn, doneOn });
            previousDone = doneOn;
            continue;
          }
          // Feita hoje a anterior: a próxima só entra a partir de amanhã.
          if (previousDone !== today) items.push({ ...base, stage, dueOn, doneOn: null });
          finished = false;
          break;
        }
        if (!finished) break;
        cycleStart = previousDone;
        firstCycle = false;
      }
    });
  }
  return items;
}

/** Um bloco de revisão: um tópico (a revisão da vez dele). */
export interface ReviewBlock {
  subjectId: string;
  /** Sempre uma revisão; em lista para o bloco marcar e desmarcar do mesmo jeito. */
  items: ReviewItem[];
  /** Feito hoje. */
  done: boolean;
  /** A revisão ainda não tinha vencido: foi adiantada para ocupar o bloco. */
  early: boolean;
}

const byDue = (a: ReviewItem, b: ReviewItem) => (a.dueOn < b.dueOn ? -1 : a.dueOn > b.dueOn ? 1 : 0);

/**
 * Blocos de revisão do dia, **um tópico por bloco**. Primeiro os já feitos
 * hoje. Os que faltam saem das matérias **sem teoria hoje**: primeiro as
 * revisões vencidas (a mais atrasada antes; tópico fraco nas questões
 * desempata), depois, se ainda sobrar bloco, as que vencem mais cedo, adiantadas.
 */
export function reviewBlocksForDay(
  items: readonly ReviewItem[],
  today: string,
  count: number,
  theorySubjects: ReadonlySet<string>,
  weak: ReadonlySet<string> = new Set(),
): ReviewBlock[] {
  const blocks: ReviewBlock[] = items
    .filter((i) => i.doneOn === today)
    .sort(byDue)
    .map((i) => ({ subjectId: i.subjectId, items: [i], done: true, early: i.dueOn > today }));

  const isWeak = (i: ReviewItem) => weak.has(topicKey(i.subjectId, i.topicIndex));
  const pending = items
    .filter((i) => i.doneOn === null && !theorySubjects.has(i.subjectId))
    .sort((a, b) => byDue(a, b) || Number(isWeak(b)) - Number(isWeak(a)));

  for (const item of pending) {
    if (blocks.length >= count) break;
    blocks.push({ subjectId: item.subjectId, items: [item], done: false, early: item.dueOn > today });
  }
  return blocks;
}
