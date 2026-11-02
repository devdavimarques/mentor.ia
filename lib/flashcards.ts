import { addDays, fromIsoDate, toIsoDate } from "./date";
import { isKnownTopic } from "./state-schema";
import { findSubject, SUBJECTS } from "./subjects";
import type { Flashcard, FlashcardState, Settings } from "./types";

/**
 * Flashcards no modelo do Anki (agendador SM-2 com etapas de aprendizado).
 *
 * - **Novo:** nunca estudado. Entram no máximo `flashcardNewPerDay` por dia.
 * - **Aprendendo:** passa pelas etapas curtas (1 e 10 minutos) antes de "se
 *   formar" e ir para revisão em 1 dia (ou 4, com Fácil).
 * - **Revisão:** volta em dias; cada resposta multiplica o intervalo pela
 *   facilidade (ease) do cartão, que sobe com Fácil e desce com Difícil/Errei.
 * - **Reaprendendo:** errou numa revisão ("lapso"). Passa por uma etapa de 10
 *   minutos e volta à revisão com intervalo de 1 dia.
 * - Errar 8 vezes torna o cartão uma **sanguessuga**: ele é suspenso, porque
 *   do jeito que está escrito não está entrando. Vale reescrever.
 *
 * A mesma função roda no servidor (que grava) e no cliente (que mostra na
 * hora). O servidor sempre recalcula a partir do cartão gravado.
 */

export type FlashcardGrade = "again" | "hard" | "good" | "easy";

export const FLASHCARD_GRADES: readonly FlashcardGrade[] = ["again", "hard", "good", "easy"];

export const MAX_FRONT_LENGTH = 1000;
export const MAX_BACK_LENGTH = 2000;

/** Etapas de aprendizado e de reaprendizado, em minutos (padrão do Anki). */
export const LEARN_STEPS = [1, 10] as const;
export const RELEARN_STEPS = [10] as const;
const GRADUATING_INTERVAL = 1;
const EASY_INTERVAL = 4;
const START_EASE = 2.5;
const MIN_EASE = 1.3;
const MAX_EASE = 5;
const HARD_FACTOR = 1.2;
const EASY_BONUS = 1.3;
export const MAX_INTERVAL = 365;
/** Errou essa quantidade de vezes: sanguessuga, suspenso. */
export const LEECH_LAPSES = 8;
/** Cartão em aprendizado aparece até 20 minutos antes da hora, como no Anki. */
export const LEARN_AHEAD_MS = 20 * 60 * 1000;
/** Intervalo a partir do qual o cartão é "maduro" nas estatísticas. */
export const MATURE_DAYS = 21;

export const DEFAULT_NEW_PER_DAY = 20;
export const DEFAULT_REVIEWS_PER_DAY = 200;
export const MAX_NEW_PER_DAY = 200;
export const MAX_REVIEWS_PER_DAY = 2000;

export function isFlashcardGrade(value: unknown): value is FlashcardGrade {
  return FLASHCARD_GRADES.includes(value as FlashcardGrade);
}

export const FLASHCARD_STATES: readonly FlashcardState[] = ["new", "learning", "review", "relearning"];

export function isFlashcardState(value: unknown): value is FlashcardState {
  return FLASHCARD_STATES.includes(value as FlashcardState);
}

/** Cartão recém-criado. */
export function newCardFields(): Pick<
  Flashcard,
  "state" | "step" | "dueAt" | "intervalDays" | "ease" | "reps" | "lapses" | "suspended" | "introducedOn" | "lastReviewedOn"
> {
  return {
    state: "new",
    step: 0,
    dueAt: null,
    intervalDays: 0,
    ease: START_EASE,
    reps: 0,
    lapses: 0,
    suspended: false,
    introducedOn: null,
    lastReviewedOn: null,
  };
}

const clampEase = (e: number) => Math.min(MAX_EASE, Math.max(MIN_EASE, Math.round(e * 100) / 100));
const clampInterval = (d: number) => Math.min(MAX_INTERVAL, Math.max(1, Math.round(d)));
const plusDays = (today: string, days: number) => toIsoDate(addDays(fromIsoDate(today), days));
const plusMinutes = (now: number, minutes: number) => new Date(now + minutes * 60_000).toISOString();

/** O que acontece com o cartão: volta em minutos (etapa) ou em dias (revisão). */
export type NextDue = { minutes: number } | { days: number };

interface Outcome {
  card: Flashcard;
  next: NextDue;
}

/** Intervalos de revisão para Difícil, Bom e Fácil, sempre crescentes. */
function reviewIntervals(card: Flashcard) {
  const ivl = Math.max(1, card.intervalDays);
  const hard = clampInterval(Math.max(ivl + 1, ivl * HARD_FACTOR));
  const good = clampInterval(Math.max(hard + 1, ivl * card.ease));
  const easy = clampInterval(Math.max(good + 1, ivl * card.ease * EASY_BONUS));
  return { hard, good, easy };
}

function answer(card: Flashcard, grade: FlashcardGrade, today: string, now: number): Outcome {
  const base: Flashcard = {
    ...card,
    reps: card.reps + 1,
    introducedOn: card.introducedOn ?? today,
    lastReviewedOn: today,
  };
  const stepTo = (state: FlashcardState, step: number, minutes: number): Outcome => ({
    card: { ...base, state, step, dueAt: plusMinutes(now, minutes), dueOn: today },
    next: { minutes },
  });
  const toReview = (c: Flashcard, days: number): Outcome => ({
    card: { ...c, state: "review", step: 0, dueAt: null, intervalDays: days, dueOn: plusDays(today, days) },
    next: { days },
  });

  if (card.state === "new" || card.state === "learning") {
    const step = card.state === "new" ? 0 : Math.min(card.step, LEARN_STEPS.length - 1);
    switch (grade) {
      case "again":
        return stepTo("learning", 0, LEARN_STEPS[0]);
      case "hard": {
        // Na 1ª etapa, a média entre as duas primeiras (6 min); depois, repete a etapa.
        const delay =
          step === 0 && LEARN_STEPS.length > 1 ? Math.round((LEARN_STEPS[0] + LEARN_STEPS[1]) / 2) : LEARN_STEPS[step];
        return stepTo("learning", step, delay);
      }
      case "good":
        return step + 1 < LEARN_STEPS.length
          ? stepTo("learning", step + 1, LEARN_STEPS[step + 1])
          : toReview(base, GRADUATING_INTERVAL);
      case "easy":
        return toReview(base, EASY_INTERVAL);
    }
  }

  if (card.state === "relearning") {
    const step = Math.min(card.step, RELEARN_STEPS.length - 1);
    switch (grade) {
      case "again":
        return stepTo("relearning", 0, RELEARN_STEPS[0]);
      case "hard":
        return stepTo("relearning", step, Math.round(RELEARN_STEPS[step] * 1.5));
      case "good":
        return step + 1 < RELEARN_STEPS.length
          ? stepTo("relearning", step + 1, RELEARN_STEPS[step + 1])
          : toReview(base, Math.max(1, card.intervalDays));
      case "easy":
        return toReview(base, Math.max(1, card.intervalDays) + 1);
    }
  }

  // Revisão.
  const ivl = reviewIntervals(card);
  switch (grade) {
    case "again": {
      const lapses = card.lapses + 1;
      // Como no Anki: suspende ao chegar no limite e de novo a cada metade dele.
      const leech = lapses >= LEECH_LAPSES && (lapses - LEECH_LAPSES) % (LEECH_LAPSES / 2) === 0;
      return {
        card: {
          ...base,
          state: "relearning",
          step: 0,
          lapses,
          ease: clampEase(card.ease - 0.2),
          // Intervalo depois do lapso: recomeça de 1 dia.
          intervalDays: 1,
          dueOn: today,
          dueAt: plusMinutes(now, RELEARN_STEPS[0]),
          suspended: card.suspended || leech,
        },
        next: { minutes: RELEARN_STEPS[0] },
      };
    }
    case "hard":
      return toReview({ ...base, ease: clampEase(card.ease - 0.15) }, ivl.hard);
    case "good":
      return toReview(base, ivl.good);
    case "easy":
      return toReview({ ...base, ease: clampEase(card.ease + 0.15) }, ivl.easy);
  }
}

/** Cartão depois de respondido agora. */
export function reviewFlashcard(card: Flashcard, grade: FlashcardGrade, today: string, now: number): Flashcard {
  return answer(card, grade, today, now).card;
}

/** Quando o cartão volta com cada resposta — para escrever nos botões. */
export function gradeOutcomes(card: Flashcard, today: string, now: number): Record<FlashcardGrade, NextDue> {
  return {
    again: answer(card, "again", today, now).next,
    hard: answer(card, "hard", today, now).next,
    good: answer(card, "good", today, now).next,
    easy: answer(card, "easy", today, now).next,
  };
}

/** "<1 min", "10 min", "1 d", "3,2 m" — o texto curto do Anki acima dos botões. */
export function formatNextDue(next: NextDue): string {
  if ("minutes" in next) return next.minutes < 60 ? `${next.minutes} min` : `${Math.round(next.minutes / 60)} h`;
  const d = next.days;
  if (d < 30) return `${d} d`;
  if (d < 365) return `${(d / 30).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} m`;
  return `${(d / 365).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} a`;
}

/** Volta o cartão a "novo", como o "Esquecer" do Anki. Mantém texto e erros. */
export function forgetFlashcard(card: Flashcard, today: string): Flashcard {
  return { ...card, ...newCardFields(), lapses: card.lapses, dueOn: today };
}

export const isLeech = (card: Flashcard) => card.lapses >= LEECH_LAPSES;
const isLearning = (card: Flashcard) => card.state === "learning" || card.state === "relearning";

export interface DeckLimits {
  newPerDay: number;
  reviewsPerDay: number;
}

export function deckLimits(settings: Settings): DeckLimits {
  return { newPerDay: settings.flashcardNewPerDay, reviewsPerDay: settings.flashcardReviewsPerDay };
}

/** Quanto do limite diário já foi usado hoje (em todos os baralhos). */
export function usedToday(cards: readonly Flashcard[], today: string) {
  let introduced = 0;
  let reviewed = 0;
  for (const c of cards) {
    if (c.introducedOn === today) introduced++;
    else if (c.lastReviewedOn === today) reviewed++;
  }
  return { introduced, reviewed };
}

export interface DeckCounts {
  /** Novos que ainda cabem no limite de hoje. */
  new: number;
  /** Em aprendizado ou reaprendizado, para hoje. */
  learning: number;
  /** Revisões vencidas que cabem no limite de hoje. */
  review: number;
}

/** Contagens do baralho no padrão do Anki (azul, vermelho, verde). `subjectId` nulo = todos. */
export function deckCounts(
  cards: readonly Flashcard[],
  subjectId: string | null,
  today: string,
  limits: DeckLimits,
): DeckCounts {
  const used = usedToday(cards, today);
  let fresh = 0;
  let learning = 0;
  let review = 0;
  for (const c of cards) {
    if (c.suspended || (subjectId !== null && c.subjectId !== subjectId)) continue;
    if (c.state === "new") fresh++;
    else if (isLearning(c)) learning++;
    else if (c.dueOn <= today) review++;
  }
  return {
    new: Math.max(0, Math.min(fresh, limits.newPerDay - used.introduced)),
    learning,
    review: Math.max(0, Math.min(review, limits.reviewsPerDay - used.reviewed)),
  };
}

const dueTime = (c: Flashcard) => (c.dueAt ? Date.parse(c.dueAt) : 0);

/**
 * Próximo cartão da sessão, na ordem do Anki: aprendizado vencido primeiro,
 * depois revisões (das mais atrasadas), depois novos (na ordem de criação),
 * e por fim aprendizado que vence em até 20 minutos. `null` sem nada agora.
 */
export function nextCard(
  cards: readonly Flashcard[],
  subjectId: string | null,
  today: string,
  now: number,
  limits: DeckLimits,
): Flashcard | null {
  const inDeck = cards.filter((c) => !c.suspended && (subjectId === null || c.subjectId === subjectId));
  const learning = inDeck.filter(isLearning).sort((a, b) => dueTime(a) - dueTime(b));
  if (learning[0] && dueTime(learning[0]) <= now) return learning[0];

  const counts = deckCounts(cards, subjectId, today, limits);
  if (counts.review > 0) {
    const review = inDeck
      .filter((c) => c.state === "review" && c.dueOn <= today)
      .sort((a, b) => (a.dueOn < b.dueOn ? -1 : a.dueOn > b.dueOn ? 1 : 0));
    if (review[0]) return review[0];
  }
  if (counts.new > 0) {
    const fresh = inDeck.find((c) => c.state === "new");
    if (fresh) return fresh;
  }
  if (learning[0] && dueTime(learning[0]) <= now + LEARN_AHEAD_MS) return learning[0];
  return null;
}

/** Próximo cartão em aprendizado que ainda vai vencer hoje (para "volte em X min"). */
export function nextLearningDue(cards: readonly Flashcard[], subjectId: string | null): number | null {
  const times = cards
    .filter((c) => !c.suspended && isLearning(c) && (subjectId === null || c.subjectId === subjectId))
    .map(dueTime);
  return times.length > 0 ? Math.min(...times) : null;
}

/** Quantos cartões para estudar hoje, somando os baralhos (aviso na aba Hoje e selo da aba). */
export function dueTodayCount(cards: readonly Flashcard[], today: string, settings: Settings): number {
  const c = deckCounts(cards, null, today, deckLimits(settings));
  return c.new + c.learning + c.review;
}

export interface FlashcardStats {
  total: number;
  new: number;
  learning: number;
  young: number;
  mature: number;
  suspended: number;
  leeches: number;
  studiedToday: number;
  /** Revisões vencendo em cada um dos próximos dias (índice 0 = amanhã). */
  forecast: number[];
}

export function flashcardStats(cards: readonly Flashcard[], today: string, days = 7): FlashcardStats {
  const stats: FlashcardStats = {
    total: cards.length,
    new: 0,
    learning: 0,
    young: 0,
    mature: 0,
    suspended: 0,
    leeches: 0,
    studiedToday: 0,
    forecast: Array.from({ length: days }, () => 0),
  };
  for (const c of cards) {
    if (c.lastReviewedOn === today) stats.studiedToday++;
    if (isLeech(c)) stats.leeches++;
    if (c.suspended) {
      stats.suspended++;
      continue;
    }
    if (c.state === "new") stats.new++;
    else if (isLearning(c)) stats.learning++;
    else if (c.intervalDays >= MATURE_DAYS) stats.mature++;
    else stats.young++;
    if (c.state === "review" && c.dueOn > today) {
      const offset = Math.round((fromIsoDate(c.dueOn).getTime() - fromIsoDate(today).getTime()) / 86_400_000) - 1;
      if (offset >= 0 && offset < days) stats.forecast[offset]++;
    }
  }
  return stats;
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

/**
 * Agendamento vindo do navegador (desfazer a última resposta) é aceito só
 * dentro das faixas válidas. Devolve o cartão limpo, ou `null`.
 */
export function parseSchedule(raw: unknown, today: string): Pick<
  Flashcard,
  "state" | "step" | "dueAt" | "dueOn" | "intervalDays" | "ease" | "reps" | "lapses" | "suspended" | "introducedOn" | "lastReviewedOn"
> | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const isDate = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
  const isInt = (v: unknown, min: number, max: number): v is number =>
    Number.isInteger(v) && (v as number) >= min && (v as number) <= max;
  if (!isFlashcardState(r.state) || !isInt(r.step, 0, 10) || !isInt(r.intervalDays, 0, MAX_INTERVAL)) return null;
  if (typeof r.ease !== "number" || r.ease < MIN_EASE || r.ease > MAX_EASE) return null;
  if (!isInt(r.reps, 0, 100_000) || !isInt(r.lapses, 0, 100_000) || typeof r.suspended !== "boolean") return null;
  if (!isDate(r.dueOn) || r.dueOn < plusDays(today, -3650)) return null;
  if (r.dueAt !== null && (typeof r.dueAt !== "string" || Number.isNaN(Date.parse(r.dueAt)))) return null;
  if (r.introducedOn !== null && !isDate(r.introducedOn)) return null;
  if (r.lastReviewedOn !== null && !isDate(r.lastReviewedOn)) return null;
  return {
    state: r.state,
    step: r.step,
    dueAt: r.dueAt as string | null,
    dueOn: r.dueOn,
    intervalDays: r.intervalDays,
    ease: r.ease,
    reps: r.reps,
    lapses: r.lapses,
    suspended: r.suspended,
    introducedOn: r.introducedOn as string | null,
    lastReviewedOn: r.lastReviewedOn as string | null,
  };
}

/** Matérias que têm cartões, na ordem do edital. */
export function decksWithCards(cards: readonly Flashcard[]) {
  return SUBJECTS.filter((s) => cards.some((c) => c.subjectId === s.id));
}
