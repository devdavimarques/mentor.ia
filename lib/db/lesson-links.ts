import "server-only";

import { lessonLinkKey } from "@/lib/lesson-links";
import { isKnownLesson } from "@/lib/state-schema";
import type { LessonLinks } from "@/lib/types";

import { db, DatabaseError } from "./client";

interface LessonLinkRow {
  subject_id: string;
  lesson_index: number;
  url: string;
}

/**
 * Links das aulas. São do curso, não de um perfil: todos veem os mesmos.
 * Sem a migração 0007 a tabela não existe — o app abre sem links.
 */
export async function loadLessonLinks(): Promise<LessonLinks> {
  const { data, error } = await db().from("lesson_links").select("subject_id, lesson_index, url");
  if (error) {
    console.error("[db:lesson_links]", error.message);
    return {};
  }
  const links: LessonLinks = {};
  for (const row of (data as LessonLinkRow[] | null) ?? []) {
    if (isKnownLesson(row.subject_id, row.lesson_index)) {
      links[lessonLinkKey(row.subject_id, row.lesson_index)] = row.url;
    }
  }
  return links;
}

/** Grava o link da aula, ou apaga com `url` nulo. */
export async function saveLessonLink(subjectId: string, lessonIndex: number, url: string | null): Promise<void> {
  const table = db().from("lesson_links");
  const { error } = url
    ? await table.upsert(
        { subject_id: subjectId, lesson_index: lessonIndex, url, updated_at: new Date().toISOString() },
        { onConflict: "subject_id,lesson_index" },
      )
    : await table.delete().match({ subject_id: subjectId, lesson_index: lessonIndex });
  if (error) throw new DatabaseError("salvar o link da aula", error.message);
}
