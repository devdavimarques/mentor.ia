"use server";

import { redirect } from "next/navigation";

import { currentWeekStart, todayIsoDate } from "@/lib/date";
import {
  clearTopicStudies,
  deleteQuestionLog,
  insertQuestionLog,
  markBlockStudied,
  markReviewDone,
  markTopicStudied,
  unmarkBlock,
  unmarkReview,
} from "@/lib/db/logs";
import { findProfile } from "@/lib/db/profiles";
import { loadStudyState, saveSchedule } from "@/lib/db/study-state";
import { questionLogError } from "@/lib/questions";
import { isReviewStage } from "@/lib/reviews";
import { regenerateWeek } from "@/lib/schedule";
import {
  isIsoDate,
  isKnownLesson,
  isKnownTopic,
  isRecord,
  isUuid,
  parseSettings,
} from "@/lib/state-schema";
import { clearProfileId, isProfileId, writeProfileId } from "@/lib/session";
import { currentProfile } from "@/lib/study-session";
import type {
  BlockRef,
  QuestionLog,
  ReviewStage,
  ScheduleSnapshot,
  StudyLog,
} from "@/lib/types";

export type ActionResult<T = null> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const SESSION_EXPIRED = "Sessão encerrada. Escolha o perfil novamente.";

/**
 * Server Actions são endpoints HTTP públicos: tudo que chega aqui é tratado
 * como não confiável e revalidado, mesmo que a interface já valide antes.
 *
 * O detalhe do erro vai para o log do servidor; a interface recebe só uma
 * mensagem legível, sem expor o interior do banco.
 */
function fail(context: string, error: unknown): { ok: false; error: string } {
  console.error(`[action:${context}]`, error);
  return { ok: false, error: "Não foi possível salvar. Verifique a conexão e tente de novo." };
}

/** Escolhe o perfil da sessão. Sem senha: o cookie apenas registra a escolha. */
export async function selectProfileAction(profileId: string): Promise<ActionResult | void> {
  if (!isProfileId(profileId)) return { ok: false, error: "Perfil inválido." };

  try {
    const profile = await findProfile(profileId);
    if (!profile) return { ok: false, error: "Esse perfil não existe mais." };
    await writeProfileId(profile.id);
  } catch (error) {
    return fail("selectProfile", error);
  }

  // Fora do try: `redirect` funciona lançando uma exceção interna do Next,
  // que um catch acima engoliria.
  redirect("/");
}

export async function signOutAction(): Promise<void> {
  await clearProfileId();
  redirect("/entrar");
}

const UNKNOWN_TOPIC = "Tópico inexistente no edital.";

/**
 * Marca ou desmarca um bloco da semana. Marcar registra o estudo com a data de
 * hoje no fuso do app — é a data que conta para as revisões.
 */
export async function toggleBlockAction(
  block: BlockRef,
  done: boolean,
): Promise<ActionResult<StudyLog | null>> {
  try {
    const profile = await currentProfile();
    if (!profile) return { ok: false, error: SESSION_EXPIRED };

    if (!isRecord(block) || !isKnownLesson(block.subjectId, block.lessonIndex)) {
      return { ok: false, error: "Aula inexistente no curso." };
    }
    if (!isIsoDate(block.weekStart) || !Number.isInteger(block.lap) || block.lap < 1) {
      return { ok: false, error: "Bloco inválido." };
    }

    const ref: BlockRef = {
      weekStart: block.weekStart,
      subjectId: block.subjectId,
      lessonIndex: block.lessonIndex,
      lap: block.lap,
    };

    if (done === true) {
      return { ok: true, data: await markBlockStudied(profile.id, ref, todayIsoDate()) };
    }
    await unmarkBlock(profile.id, ref);
    return { ok: true, data: null };
  } catch (error) {
    return fail("toggleBlock", error);
  }
}

/**
 * Marca um tópico como estudado fora do cronograma, ou desfaz essa marcação.
 * As aulas feitas no ciclo não são afetadas.
 */
export async function setTopicStudiedAction(
  subjectId: string,
  topicIndex: number,
  studied: boolean,
): Promise<ActionResult<StudyLog | null>> {
  try {
    const profile = await currentProfile();
    if (!profile) return { ok: false, error: SESSION_EXPIRED };
    if (!isKnownTopic(subjectId, topicIndex)) return { ok: false, error: UNKNOWN_TOPIC };

    if (studied === true) {
      return {
        ok: true,
        data: await markTopicStudied(profile.id, subjectId, topicIndex, todayIsoDate()),
      };
    }
    await clearTopicStudies(profile.id, subjectId, topicIndex);
    return { ok: true, data: null };
  } catch (error) {
    return fail("setTopicStudied", error);
  }
}

/** Marca uma revisão como feita hoje. Devolve a data gravada. */
export async function markReviewAction(
  subjectId: string,
  topicIndex: number,
  stage: ReviewStage,
): Promise<ActionResult<string>> {
  try {
    const profile = await currentProfile();
    if (!profile) return { ok: false, error: SESSION_EXPIRED };
    if (!isKnownTopic(subjectId, topicIndex)) return { ok: false, error: UNKNOWN_TOPIC };
    if (!isReviewStage(stage)) return { ok: false, error: "Revisão inválida." };

    const doneOn = todayIsoDate();
    await markReviewDone(profile.id, subjectId, topicIndex, stage, doneOn);
    return { ok: true, data: doneOn };
  } catch (error) {
    return fail("markReview", error);
  }
}

export async function unmarkReviewAction(
  subjectId: string,
  topicIndex: number,
  stage: ReviewStage,
  doneOn: string,
): Promise<ActionResult> {
  try {
    const profile = await currentProfile();
    if (!profile) return { ok: false, error: SESSION_EXPIRED };
    if (!isKnownTopic(subjectId, topicIndex)) return { ok: false, error: UNKNOWN_TOPIC };
    if (!isReviewStage(stage) || !isIsoDate(doneOn)) {
      return { ok: false, error: "Revisão inválida." };
    }

    await unmarkReview(profile.id, subjectId, topicIndex, stage, doneOn);
    return { ok: true, data: null };
  } catch (error) {
    return fail("unmarkReview", error);
  }
}

/** Lança questões resolvidas num tópico, com a data de hoje. */
export async function addQuestionsAction(
  subjectId: string,
  topicIndex: number,
  answered: number,
  correct: number,
): Promise<ActionResult<QuestionLog>> {
  try {
    const profile = await currentProfile();
    if (!profile) return { ok: false, error: SESSION_EXPIRED };
    if (!isKnownTopic(subjectId, topicIndex)) return { ok: false, error: UNKNOWN_TOPIC };

    const invalid = questionLogError(answered, correct);
    if (invalid) return { ok: false, error: invalid };

    const log = await insertQuestionLog(profile.id, {
      subjectId,
      topicIndex,
      answered,
      correct,
      loggedOn: todayIsoDate(),
    });
    return { ok: true, data: log };
  } catch (error) {
    return fail("addQuestions", error);
  }
}

export async function deleteQuestionsAction(id: string): Promise<ActionResult> {
  try {
    const profile = await currentProfile();
    if (!profile) return { ok: false, error: SESSION_EXPIRED };
    if (!isUuid(id)) return { ok: false, error: "Lançamento inválido." };

    await deleteQuestionLog(profile.id, id);
    return { ok: true, data: null };
  } catch (error) {
    return fail("deleteQuestions", error);
  }
}

/**
 * Aplica novas configurações e regera a semana.
 *
 * O cronograma é recalculado no servidor a partir do estado gravado — o
 * navegador manda só a preferência, nunca o cronograma pronto. O cliente já
 * mostra o resultado otimista com as mesmas funções puras e depois reconcilia
 * com o que volta daqui.
 */
export async function updateSettingsAction(
  rawSettings: unknown,
): Promise<ActionResult<ScheduleSnapshot>> {
  try {
    const profile = await currentProfile();
    if (!profile) return { ok: false, error: SESSION_EXPIRED };

    const requested = parseSettings(rawSettings);
    const state = await loadStudyState(profile.id);
    const weekStart = state.week?.weekStart ?? currentWeekStart();
    const snapshot = regenerateWeek(state, requested, weekStart);

    await saveSchedule(profile.id, snapshot);
    return { ok: true, data: snapshot };
  } catch (error) {
    return fail("updateSettings", error);
  }
}
