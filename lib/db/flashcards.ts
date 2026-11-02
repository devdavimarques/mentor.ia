import "server-only";

import { isFlashcardState, newCardFields } from "@/lib/flashcards";
import { isKnownTopic, isIsoDate } from "@/lib/state-schema";
import { findSubject } from "@/lib/subjects";
import type { Flashcard } from "@/lib/types";

import { db, DatabaseError } from "./client";

interface FlashcardRow {
  id: string;
  subject_id: string;
  topic_index: number | null;
  front: string;
  back: string;
  due_on: string;
  interval_days: number;
  ease: number;
  reps: number;
  lapses: number;
  // Colunas do 0008; sem a migração, não vêm.
  state?: string;
  step?: number;
  due_at?: string | null;
  suspended?: boolean;
  introduced_on?: string | null;
  last_reviewed_on?: string | null;
}

const BASE_COLUMNS = "id, subject_id, topic_index, front, back, due_on, interval_days, ease, reps, lapses";
const COLUMNS = `${BASE_COLUMNS}, state, step, due_at, suspended, introduced_on, last_reviewed_on`;

/** Sem a migração 0008, as colunas novas não existem: o app segue com as antigas. */
const columns = (full: boolean) => (full ? COLUMNS : BASE_COLUMNS);
const missingColumn = (message: string) => /column|schema cache/i.test(message);

/** Estado de um cartão gravado antes do 0008, pelo que já foi respondido. */
function legacyState(row: FlashcardRow): Flashcard["state"] {
  if (row.interval_days > 0) return "review";
  return row.reps > 0 || row.lapses > 0 ? "learning" : "new";
}

/** Descarta cartão de matéria que saiu do edital; tópico que saiu vira "sem tópico". */
function toFlashcard(row: FlashcardRow): Flashcard | null {
  if (!findSubject(row.subject_id) || !isIsoDate(row.due_on)) return null;
  const date = (v: string | null | undefined) => (v && isIsoDate(v) ? v : null);
  return {
    id: row.id,
    subjectId: row.subject_id,
    topicIndex:
      row.topic_index !== null && isKnownTopic(row.subject_id, row.topic_index) ? row.topic_index : null,
    front: row.front,
    back: row.back,
    state: isFlashcardState(row.state) ? row.state : legacyState(row),
    step: Number.isInteger(row.step) ? (row.step as number) : 0,
    dueAt: typeof row.due_at === "string" ? new Date(row.due_at).toISOString() : null,
    dueOn: row.due_on,
    intervalDays: row.interval_days,
    ease: Number(row.ease),
    reps: row.reps,
    lapses: row.lapses,
    suspended: row.suspended === true,
    introducedOn: date(row.introduced_on),
    lastReviewedOn: date(row.last_reviewed_on),
  };
}

function requireCard(row: unknown, action: string): Flashcard {
  const card = row ? toFlashcard(row as FlashcardRow) : null;
  if (!card) throw new DatabaseError(action, "o banco devolveu um registro inválido");
  return card;
}

/** Colunas gravadas a partir do cartão; sem o 0008, só as antigas. */
function toRow(card: Omit<Flashcard, "id">, full: boolean) {
  const base = {
    subject_id: card.subjectId,
    topic_index: card.topicIndex,
    front: card.front,
    back: card.back,
    due_on: card.dueOn,
    interval_days: card.intervalDays,
    ease: card.ease,
    reps: card.reps,
    lapses: card.lapses,
  };
  if (!full) return base;
  return {
    ...base,
    state: card.state,
    step: card.step,
    due_at: card.dueAt,
    suspended: card.suspended,
    introduced_on: card.introducedOn,
    last_reviewed_on: card.lastReviewedOn,
  };
}

/**
 * Roda a consulta e, se ela falhar porque as colunas do 0008 não existem,
 * repete sem elas. Assim o app não quebra entre o deploy e a migração.
 */
async function withFallback<T>(run: (full: boolean) => PromiseLike<{ data: T; error: { message: string } | null }>) {
  const result = await run(true);
  return result.error && missingColumn(result.error.message) ? run(false) : result;
}

/**
 * Cartões do perfil, na ordem em que foram criados.
 *
 * Como nos simulados, falha aqui não derruba o app: sem a migração 0006 a
 * tabela não existe, e o ciclo precisa continuar abrindo.
 */
export async function loadFlashcards(profileId: string): Promise<Flashcard[]> {
  const { data, error } = await withFallback((full) =>
    db().from("flashcards").select(columns(full)).eq("profile_id", profileId).order("created_at", { ascending: true }),
  );

  if (error) {
    console.error("[db:flashcards]", error.message);
    return [];
  }
  return ((data as unknown as FlashcardRow[] | null) ?? [])
    .map(toFlashcard)
    .filter((c): c is Flashcard => c !== null);
}

export async function findFlashcard(profileId: string, id: string): Promise<Flashcard | null> {
  const { data, error } = await withFallback((full) =>
    db().from("flashcards").select(columns(full)).match({ profile_id: profileId, id }).maybeSingle(),
  );
  if (error) throw new DatabaseError("carregar o cartão", error.message);
  return data ? toFlashcard(data as unknown as FlashcardRow) : null;
}

type NewCard = Pick<Flashcard, "subjectId" | "topicIndex" | "front" | "back" | "dueOn">;

/** Cria cartões novos (um ou vários, na importação), todos para estudar a partir de `dueOn`. */
export async function insertFlashcards(profileId: string, cards: NewCard[]): Promise<Flashcard[]> {
  const { data, error } = await withFallback((full) =>
    db()
      .from("flashcards")
      .insert(cards.map((card) => ({ profile_id: profileId, ...toRow({ ...newCardFields(), ...card }, full) })))
      .select(columns(full)),
  );

  if (error) throw new DatabaseError("criar os cartões", error.message);
  return ((data as unknown[] | null) ?? []).map((row) => requireCard(row, "criar os cartões"));
}

export async function insertFlashcard(profileId: string, card: NewCard): Promise<Flashcard> {
  const [saved] = await insertFlashcards(profileId, [card]);
  return saved;
}

/** Grava texto e agendamento. Filtra pelo perfil: id de outro perfil não muda nada. */
export async function saveFlashcard(profileId: string, card: Flashcard): Promise<Flashcard> {
  const { data, error } = await withFallback((full) =>
    db()
      .from("flashcards")
      .update(toRow(card, full))
      .match({ profile_id: profileId, id: card.id })
      .select(columns(full))
      .single(),
  );

  if (error) throw new DatabaseError("salvar o cartão", error.message);
  return requireCard(data, "salvar o cartão");
}

export async function deleteFlashcard(profileId: string, id: string): Promise<void> {
  const { error } = await db().from("flashcards").delete().match({ profile_id: profileId, id });
  if (error) throw new DatabaseError("apagar o cartão", error.message);
}
