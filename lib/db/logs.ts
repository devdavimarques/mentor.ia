import "server-only";

import type { BlockRef, QuestionLog, ReviewStage, StudyLog } from "@/lib/types";

import { db, DatabaseError } from "./client";
import {
  QUESTION_LOG_COLUMNS,
  STUDY_LOG_COLUMNS,
  toQuestionLog,
  toStudyLog,
  type QuestionLogRow,
  type StudyLogRow,
} from "./study-state";

/** Código do Postgres para violação de `unique`. */
const UNIQUE_VIOLATION = "23505";

function blockMatch(profileId: string, block: BlockRef) {
  return {
    profile_id: profileId,
    week_start: block.weekStart,
    subject_id: block.subjectId,
    lesson_index: block.lessonIndex,
    lap: block.lap,
  };
}

function requireLog<T>(value: T | null, action: string): T {
  if (!value) throw new DatabaseError(action, "o banco devolveu um registro inválido");
  return value;
}

/**
 * Marca um bloco da semana como estudado em `studiedOn`. Marcar de novo um
 * bloco já marcado é inofensivo: devolve o registro que já existia.
 *
 * O índice único é parcial (só blocos), e o `upsert` do PostgREST não sabe
 * mirar índice parcial — por isso insert + tratamento do conflito.
 */
export async function markBlockStudied(
  profileId: string,
  block: BlockRef,
  studiedOn: string,
): Promise<StudyLog> {
  const inserted = await db()
    .from("study_logs")
    .insert({ ...blockMatch(profileId, block), studied_on: studiedOn })
    .select(STUDY_LOG_COLUMNS)
    .single();

  if (!inserted.error) {
    return requireLog(toStudyLog(inserted.data as StudyLogRow), "marcar o bloco");
  }
  if (inserted.error.code !== UNIQUE_VIOLATION) {
    throw new DatabaseError("marcar o bloco", inserted.error.message);
  }

  const existing = await db()
    .from("study_logs")
    .select(STUDY_LOG_COLUMNS)
    .match(blockMatch(profileId, block))
    .single();

  if (existing.error) throw new DatabaseError("marcar o bloco", existing.error.message);
  return requireLog(toStudyLog(existing.data as StudyLogRow), "marcar o bloco");
}

export async function unmarkBlock(profileId: string, block: BlockRef): Promise<void> {
  const { error } = await db().from("study_logs").delete().match(blockMatch(profileId, block));
  if (error) throw new DatabaseError("desmarcar o bloco", error.message);
}

/** Registra um estudo avulso, fora do cronograma (aba Matérias). */
export async function markTopicStudied(
  profileId: string,
  subjectId: string,
  topicIndex: number,
  studiedOn: string,
): Promise<StudyLog> {
  const { data, error } = await db()
    .from("study_logs")
    .insert({
      profile_id: profileId,
      subject_id: subjectId,
      topic_index: topicIndex,
      studied_on: studiedOn,
    })
    .select(STUDY_LOG_COLUMNS)
    .single();

  if (error) throw new DatabaseError("marcar o tópico", error.message);
  return requireLog(toStudyLog(data as StudyLogRow), "marcar o tópico");
}

/**
 * Apaga as marcações manuais do tópico. As aulas feitas no ciclo ficam: elas
 * se desmarcam pelos próprios blocos.
 */
export async function clearTopicStudies(
  profileId: string,
  subjectId: string,
  topicIndex: number,
): Promise<void> {
  // `topic_index` só é preenchido em marcação manual — aula usa `lesson_index`.
  const { error } = await db()
    .from("study_logs")
    .delete()
    .match({ profile_id: profileId, subject_id: subjectId, topic_index: topicIndex });

  if (error) throw new DatabaseError("desmarcar o tópico", error.message);
}

export async function markReviewDone(
  profileId: string,
  subjectId: string,
  topicIndex: number,
  stage: ReviewStage,
  doneOn: string,
): Promise<void> {
  const { error } = await db()
    .from("review_logs")
    .upsert(
      { profile_id: profileId, subject_id: subjectId, topic_index: topicIndex, stage, done_on: doneOn },
      { onConflict: "profile_id,subject_id,topic_index,stage,done_on" },
    );

  if (error) throw new DatabaseError("marcar a revisão", error.message);
}

export async function unmarkReview(
  profileId: string,
  subjectId: string,
  topicIndex: number,
  stage: ReviewStage,
  doneOn: string,
): Promise<void> {
  const { error } = await db().from("review_logs").delete().match({
    profile_id: profileId,
    subject_id: subjectId,
    topic_index: topicIndex,
    stage,
    done_on: doneOn,
  });

  if (error) throw new DatabaseError("desmarcar a revisão", error.message);
}

export async function insertQuestionLog(
  profileId: string,
  entry: Omit<QuestionLog, "id">,
): Promise<QuestionLog> {
  const { data, error } = await db()
    .from("question_logs")
    .insert({
      profile_id: profileId,
      subject_id: entry.subjectId,
      topic_index: entry.topicIndex,
      answered: entry.answered,
      correct: entry.correct,
      logged_on: entry.loggedOn,
    })
    .select(QUESTION_LOG_COLUMNS)
    .single();

  if (error) throw new DatabaseError("lançar as questões", error.message);
  return requireLog(toQuestionLog(data as QuestionLogRow), "lançar as questões");
}

/** Filtra pelo perfil também: um id de outro perfil simplesmente não apaga nada. */
export async function deleteQuestionLog(profileId: string, id: string): Promise<void> {
  const { error } = await db()
    .from("question_logs")
    .delete()
    .match({ profile_id: profileId, id });

  if (error) throw new DatabaseError("apagar o lançamento", error.message);
}
