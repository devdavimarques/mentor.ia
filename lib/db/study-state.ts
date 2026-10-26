import "server-only";

import { isReviewStage } from "@/lib/reviews";
import {
  isIsoDate,
  isKnownLesson,
  isKnownTopic,
  parsePointers,
  parseSettings,
  parseWeek,
} from "@/lib/state-schema";
import type {
  Pointers,
  QuestionLog,
  ReviewLog,
  Settings,
  StudyLog,
  StudyState,
  WeekSchedule,
} from "@/lib/types";

import { db, DatabaseError } from "./client";
import { loadMockExams } from "./mock-exams";

interface StudyStateRow {
  settings: unknown;
  pointers: unknown;
  week: unknown;
}

export interface StudyLogRow {
  subject_id: string;
  topic_index: number | null;
  lesson_index: number | null;
  studied_on: string;
  week_start: string | null;
  lap: number | null;
}

interface ReviewLogRow {
  subject_id: string;
  topic_index: number;
  stage: number;
  done_on: string;
}

export interface QuestionLogRow {
  id: string;
  subject_id: string;
  topic_index: number;
  answered: number;
  correct: number;
  logged_on: string;
}

export const STUDY_LOG_COLUMNS =
  "subject_id, topic_index, lesson_index, studied_on, week_start, lap";
export const QUESTION_LOG_COLUMNS = "id, subject_id, topic_index, answered, correct, logged_on";

// As conversões abaixo descartam linhas de tópicos que não existem mais no
// edital: o banco pode guardar registros de uma versão anterior de `subjects.ts`.

export function toStudyLog(row: StudyLogRow): StudyLog | null {
  if (!isIsoDate(row.studied_on)) return null;

  if (row.lesson_index !== null) {
    if (!isKnownLesson(row.subject_id, row.lesson_index)) return null;
    const block =
      row.week_start && isIsoDate(row.week_start) && Number.isInteger(row.lap)
        ? { weekStart: row.week_start, lap: row.lap as number }
        : null;
    return {
      kind: "lesson",
      subjectId: row.subject_id,
      lessonIndex: row.lesson_index,
      studiedOn: row.studied_on,
      block,
    };
  }

  if (!isKnownTopic(row.subject_id, row.topic_index)) return null;
  return {
    kind: "topic",
    subjectId: row.subject_id,
    topicIndex: row.topic_index as number,
    studiedOn: row.studied_on,
  };
}

function toReviewLog(row: ReviewLogRow): ReviewLog | null {
  if (!isKnownTopic(row.subject_id, row.topic_index) || !isIsoDate(row.done_on)) return null;
  if (!isReviewStage(row.stage)) return null;
  return {
    subjectId: row.subject_id,
    topicIndex: row.topic_index,
    stage: row.stage,
    doneOn: row.done_on,
  };
}

export function toQuestionLog(row: QuestionLogRow): QuestionLog | null {
  if (!isKnownTopic(row.subject_id, row.topic_index) || !isIsoDate(row.logged_on)) return null;
  return {
    id: row.id,
    subjectId: row.subject_id,
    topicIndex: row.topic_index,
    answered: row.answered,
    correct: row.correct,
    loggedOn: row.logged_on,
  };
}

function compact<T>(items: (T | null)[]): T[] {
  return items.filter((item): item is T => item !== null);
}

/** Estado completo do ciclo de um perfil. Perfil sem linha ainda vem no padrão. */
export async function loadStudyState(profileId: string): Promise<StudyState> {
  const [stateResult, studyResult, reviewResult, questionResult, mockExams] = await Promise.all([
    db().from("study_states").select("settings, pointers, week").eq("profile_id", profileId).maybeSingle(),
    db().from("study_logs").select(STUDY_LOG_COLUMNS).eq("profile_id", profileId),
    db()
      .from("review_logs")
      .select("subject_id, topic_index, stage, done_on")
      .eq("profile_id", profileId),
    db()
      .from("question_logs")
      .select(QUESTION_LOG_COLUMNS)
      .eq("profile_id", profileId)
      .order("created_at", { ascending: true }),
    loadMockExams(profileId),
  ]);

  if (stateResult.error) throw new DatabaseError("carregar o ciclo", stateResult.error.message);
  if (studyResult.error) throw new DatabaseError("carregar os estudos", studyResult.error.message);
  if (reviewResult.error) throw new DatabaseError("carregar as revisões", reviewResult.error.message);
  if (questionResult.error) {
    throw new DatabaseError("carregar as questões", questionResult.error.message);
  }

  const row = stateResult.data as StudyStateRow | null;

  return {
    settings: parseSettings(row?.settings),
    pointers: parsePointers(row?.pointers),
    week: parseWeek(row?.week),
    studyLogs: compact(((studyResult.data as StudyLogRow[] | null) ?? []).map(toStudyLog)),
    reviewLogs: compact(((reviewResult.data as ReviewLogRow[] | null) ?? []).map(toReviewLog)),
    questionLogs: compact(((questionResult.data as QuestionLogRow[] | null) ?? []).map(toQuestionLog)),
    mockExams,
  };
}

/** Grava configurações, ponteiros e cronograma da semana num único upsert. */
export async function saveSchedule(
  profileId: string,
  schedule: { settings: Settings; pointers: Pointers; week: WeekSchedule },
): Promise<void> {
  const { error } = await db()
    .from("study_states")
    .upsert(
      {
        profile_id: profileId,
        settings: schedule.settings,
        pointers: schedule.pointers,
        week: schedule.week,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "profile_id" },
    );

  if (error) throw new DatabaseError("salvar o cronograma", error.message);
}
