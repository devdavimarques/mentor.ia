import "server-only";

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
}

const COLUMNS = "id, subject_id, topic_index, front, back, due_on, interval_days, ease, reps, lapses";

/** Descarta cartão de matéria que saiu do edital; tópico que saiu vira "sem tópico". */
function toFlashcard(row: FlashcardRow): Flashcard | null {
  if (!findSubject(row.subject_id) || !isIsoDate(row.due_on)) return null;
  return {
    id: row.id,
    subjectId: row.subject_id,
    topicIndex:
      row.topic_index !== null && isKnownTopic(row.subject_id, row.topic_index) ? row.topic_index : null,
    front: row.front,
    back: row.back,
    dueOn: row.due_on,
    intervalDays: row.interval_days,
    ease: row.ease,
    reps: row.reps,
    lapses: row.lapses,
  };
}

function requireCard(row: unknown, action: string): Flashcard {
  const card = row ? toFlashcard(row as FlashcardRow) : null;
  if (!card) throw new DatabaseError(action, "o banco devolveu um registro inválido");
  return card;
}

/**
 * Cartões do perfil, na ordem em que foram criados.
 *
 * Como nos simulados, falha aqui não derruba o app: sem a migração 0006 a
 * tabela não existe, e o ciclo precisa continuar abrindo.
 */
export async function loadFlashcards(profileId: string): Promise<Flashcard[]> {
  const { data, error } = await db()
    .from("flashcards")
    .select(COLUMNS)
    .eq("profile_id", profileId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[db:flashcards]", error.message);
    return [];
  }
  return ((data as FlashcardRow[] | null) ?? [])
    .map(toFlashcard)
    .filter((c): c is Flashcard => c !== null);
}

export async function findFlashcard(profileId: string, id: string): Promise<Flashcard | null> {
  const { data, error } = await db()
    .from("flashcards")
    .select(COLUMNS)
    .match({ profile_id: profileId, id })
    .maybeSingle();
  if (error) throw new DatabaseError("carregar o cartão", error.message);
  return data ? toFlashcard(data as FlashcardRow) : null;
}

export async function insertFlashcard(
  profileId: string,
  card: Pick<Flashcard, "subjectId" | "topicIndex" | "front" | "back" | "dueOn">,
): Promise<Flashcard> {
  const { data, error } = await db()
    .from("flashcards")
    .insert({
      profile_id: profileId,
      subject_id: card.subjectId,
      topic_index: card.topicIndex,
      front: card.front,
      back: card.back,
      due_on: card.dueOn,
    })
    .select(COLUMNS)
    .single();

  if (error) throw new DatabaseError("criar o cartão", error.message);
  return requireCard(data, "criar o cartão");
}

/** Grava texto e agendamento. Filtra pelo perfil: id de outro perfil não muda nada. */
export async function saveFlashcard(profileId: string, card: Flashcard): Promise<Flashcard> {
  const { data, error } = await db()
    .from("flashcards")
    .update({
      subject_id: card.subjectId,
      topic_index: card.topicIndex,
      front: card.front,
      back: card.back,
      due_on: card.dueOn,
      interval_days: card.intervalDays,
      ease: card.ease,
      reps: card.reps,
      lapses: card.lapses,
    })
    .match({ profile_id: profileId, id: card.id })
    .select(COLUMNS)
    .single();

  if (error) throw new DatabaseError("salvar o cartão", error.message);
  return requireCard(data, "salvar o cartão");
}

export async function deleteFlashcard(profileId: string, id: string): Promise<void> {
  const { error } = await db().from("flashcards").delete().match({ profile_id: profileId, id });
  if (error) throw new DatabaseError("apagar o cartão", error.message);
}
