import "server-only";

import { isIsoDate, isKnownLesson } from "@/lib/state-schema";
import { findSubject } from "@/lib/subjects";
import type { StudySession } from "@/lib/types";

import { db, DatabaseError } from "./client";

interface StudySessionRow {
  id: string;
  subject_id: string;
  lesson_index: number | null;
  minutes: number;
  studied_on: string;
}

const COLUMNS = "id, subject_id, lesson_index, minutes, studied_on";

/** Descarta sessão de matéria que saiu do edital; aula que saiu vira "sem aula". */
function toSession(row: StudySessionRow): StudySession | null {
  if (!findSubject(row.subject_id) || !isIsoDate(row.studied_on)) return null;
  return {
    id: row.id,
    subjectId: row.subject_id,
    lessonIndex:
      row.lesson_index !== null && isKnownLesson(row.subject_id, row.lesson_index) ? row.lesson_index : null,
    minutes: row.minutes,
    studiedOn: row.studied_on,
  };
}

/**
 * Tempo de estudo do perfil, do mais antigo para o mais novo.
 *
 * Como nos simulados, falha aqui não derruba o app: sem a migração 0007 a
 * tabela não existe, e o ciclo precisa continuar abrindo.
 */
export async function loadStudySessions(profileId: string): Promise<StudySession[]> {
  const { data, error } = await db()
    .from("study_sessions")
    .select(COLUMNS)
    .eq("profile_id", profileId)
    .order("studied_on", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[db:study_sessions]", error.message);
    return [];
  }
  return ((data as StudySessionRow[] | null) ?? [])
    .map(toSession)
    .filter((s): s is StudySession => s !== null);
}

export async function insertStudySession(
  profileId: string,
  session: Omit<StudySession, "id">,
): Promise<StudySession> {
  const { data, error } = await db()
    .from("study_sessions")
    .insert({
      profile_id: profileId,
      subject_id: session.subjectId,
      lesson_index: session.lessonIndex,
      minutes: session.minutes,
      studied_on: session.studiedOn,
    })
    .select(COLUMNS)
    .single();

  if (error) throw new DatabaseError("salvar o tempo de estudo", error.message);
  const saved = toSession(data as StudySessionRow);
  if (!saved) throw new DatabaseError("salvar o tempo de estudo", "o banco devolveu um registro inválido");
  return saved;
}

/** Filtra pelo perfil também: um id de outro perfil simplesmente não apaga nada. */
export async function deleteStudySession(profileId: string, id: string): Promise<void> {
  const { error } = await db().from("study_sessions").delete().match({ profile_id: profileId, id });
  if (error) throw new DatabaseError("apagar o tempo de estudo", error.message);
}
