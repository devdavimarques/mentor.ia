import { addDays, fromIsoDate, toIsoDate } from "./date";
import { isKnownTopic } from "./state-schema";
import { findSubject } from "./subjects";
import type { Flashcard } from "./types";

/**
 * Flashcards com repetição espaçada (SM-2 simplificado, o mesmo princípio do
 * Anki): cada resposta ajusta quando o cartão volta. Quanto mais fácil, maior
 * o intervalo; errar zera a sequência e o cartão volta ainda hoje.
 *
 * A mesma função roda no servidor (que grava) e no cliente (que mostra na
 * hora). O servidor sempre recalcula a partir do cartão gravado.
 */

export type FlashcardGrade = "again" | "hard" | "good" | "easy";

export const FLASHCARD_GRADES: readonly FlashcardGrade[] = ["again", "hard", "good", "easy"];

export const MAX_FRONT_LENGTH = 1000;
export const MAX_BACK_LENGTH = 2000;
const MAX_INTERVAL = 365;
const MIN_EASE = 1.3;
const MAX_EASE = 5;

export function isFlashcardGrade(value: unknown): value is FlashcardGrade {
  return FLASHCARD_GRADES.includes(value as FlashcardGrade);
}

/** Próximo intervalo e facilidade para uma resposta. */
function nextSchedule(card: Flashcard, grade: FlashcardGrade): { interval: number; ease: number } {
  const { intervalDays: interval, ease, reps } = card;
  const clampEase = (e: number) => Math.min(MAX_EASE, Math.max(MIN_EASE, Math.round(e * 100) / 100));
  switch (grade) {
    case "again":
      return { interval: 0, ease: clampEase(ease - 0.2) };
    case "hard":
      return { interval: Math.max(1, Math.round(interval * 1.2)), ease: clampEase(ease - 0.15) };
    case "good":
      return { interval: reps === 0 ? 1 : reps === 1 ? 3 : Math.max(interval + 1, Math.round(interval * ease)), ease };
    case "easy":
      return {
        interval: reps === 0 ? 4 : Math.max(interval + 2, Math.round(interval * ease * 1.3)),
        ease: clampEase(ease + 0.15),
      };
  }
}

/** Cartão depois de respondido hoje. */
export function reviewFlashcard(card: Flashcard, grade: FlashcardGrade, today: string): Flashcard {
  const { interval, ease } = nextSchedule(card, grade);
  const days = Math.min(MAX_INTERVAL, interval);
  return {
    ...card,
    intervalDays: days,
    ease,
    reps: grade === "again" ? 0 : card.reps + 1,
    lapses: grade === "again" ? card.lapses + 1 : card.lapses,
    dueOn: toIsoDate(addDays(fromIsoDate(today), days)),
  };
}

/** Em quantos dias o cartão volta com cada resposta — para escrever nos botões. */
export function gradeIntervals(card: Flashcard): Record<FlashcardGrade, number> {
  return {
    again: 0,
    hard: Math.min(MAX_INTERVAL, nextSchedule(card, "hard").interval),
    good: Math.min(MAX_INTERVAL, nextSchedule(card, "good").interval),
    easy: Math.min(MAX_INTERVAL, nextSchedule(card, "easy").interval),
  };
}

/** Cartões para revisar hoje (vencidos ou de hoje), dos mais atrasados para os mais novos. */
export function dueFlashcards(cards: readonly Flashcard[], today: string): Flashcard[] {
  return cards
    .filter((c) => c.dueOn <= today)
    .sort((a, b) => (a.dueOn < b.dueOn ? -1 : a.dueOn > b.dueOn ? 1 : 0));
}

/** Valida um cartão novo ou editado. Devolve a mensagem de erro, ou `null`. */
export function flashcardError(
  subjectId: unknown,
  topicIndex: unknown,
  front: unknown,
  back: unknown,
): string | null {
  if (typeof subjectId !== "string" || !findSubject(subjectId)) return "Escolha a matéria.";
  if (topicIndex !== null && !isKnownTopic(subjectId, topicIndex)) return "Tópico inválido.";
  if (typeof front !== "string" || front.trim() === "") return "Escreva a frente do cartão.";
  if (typeof back !== "string" || back.trim() === "") return "Escreva o verso do cartão.";
  if (front.length > MAX_FRONT_LENGTH) return `A frente pode ter até ${MAX_FRONT_LENGTH} caracteres.`;
  if (back.length > MAX_BACK_LENGTH) return `O verso pode ter até ${MAX_BACK_LENGTH} caracteres.`;
  return null;
}
