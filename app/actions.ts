"use server";

import { redirect } from "next/navigation";

import { syncCycle } from "@/lib/cycle";
import { todayIsoDate } from "@/lib/date";
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
import {
  deleteFlashcard,
  findFlashcard,
  insertFlashcard,
  insertFlashcards,
  saveFlashcard,
} from "@/lib/db/flashcards";
import { saveLessonLink } from "@/lib/db/lesson-links";
import { deleteMockExam, insertMockExam } from "@/lib/db/mock-exams";
import { deleteStudySession, insertStudySession } from "@/lib/db/study-sessions";
import { findProfileCredentials } from "@/lib/db/profiles";
import { loadStudyState, saveSchedule } from "@/lib/db/study-state";
import { MAX_IMPORT_CARDS } from "@/lib/flashcard-csv";
import {
  flashcardError,
  forgetFlashcard,
  isFlashcardGrade,
  MAX_NEW_PER_DAY,
  MAX_REVIEWS_PER_DAY,
  parseSchedule,
  reviewFlashcard,
} from "@/lib/flashcards";
import { normalizeLessonLink } from "@/lib/lesson-links";
import { mockDetailsError, mockResultsError, parseMockResults } from "@/lib/mock-exams";
import { checkedBlocks } from "@/lib/progress";
import { questionLogError } from "@/lib/questions";
import { isReviewStage } from "@/lib/reviews";
import { advanceBlock, regenerateWeek } from "@/lib/schedule";
import {
  isIsoDate,
  isKnownLesson,
  isKnownTopic,
  isRecord,
  isUuid,
  parseMockTargets,
  parseSettings,
} from "@/lib/state-schema";
import { studySessionError } from "@/lib/study-time";
import { verifyPassword } from "@/lib/password";
import { clearSession, isProfileId, writeGuestSession, writeProfileSession } from "@/lib/session";
import { currentProfile } from "@/lib/study-session";
import type {
  BlockRef,
  Flashcard,
  MockExam,
  QuestionLog,
  ReviewStage,
  ScheduleSnapshot,
  StudyLog,
  StudySession,
} from "@/lib/types";

export type ActionResult<T = null> =
  | { ok: true; data: T }
  | { ok: false; error: string };

/** Também é o que o visitante recebe: `currentProfile()` não devolve perfil para ele. */
const SESSION_EXPIRED = "Sessão encerrada. Entre no perfil novamente.";

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

/** Atraso em senha errada: torna tentativa em massa lenta sem incomodar quem errou uma vez. */
const WRONG_PASSWORD_DELAY_MS = 600;
const MAX_PASSWORD_LENGTH = 200;

/** Entra num perfil depois de conferir a senha. Em caso de sucesso, redireciona. */
export async function signInAction(
  profileId: string,
  password: string,
): Promise<ActionResult | void> {
  if (!isProfileId(profileId)) return { ok: false, error: "Perfil inválido." };
  if (typeof password !== "string" || password.length === 0) {
    return { ok: false, error: "Digite a senha." };
  }
  if (password.length > MAX_PASSWORD_LENGTH) return { ok: false, error: "Senha incorreta." };

  try {
    const found = await findProfileCredentials(profileId);
    if (!found) return { ok: false, error: "Esse perfil não existe mais." };
    if (!found.passwordHash) {
      return { ok: false, error: "Este perfil ainda não tem senha definida." };
    }
    if (!(await verifyPassword(password, found.passwordHash))) {
      await new Promise((r) => setTimeout(r, WRONG_PASSWORD_DELAY_MS));
      return { ok: false, error: "Senha incorreta." };
    }
    await writeProfileSession(found.profile.id, found.passwordHash);
  } catch (error) {
    return fail("signIn", error);
  }

  // Fora do try: `redirect` funciona lançando uma exceção interna do Next,
  // que um catch acima engoliria.
  redirect("/");
}

/** Entra como visitante: vê e mexe em tudo, mas nada é gravado. */
export async function enterAsGuestAction(): Promise<void> {
  await writeGuestSession();
  redirect("/");
}

export async function signOutAction(): Promise<void> {
  await clearSession();
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
 * Data da prova. Diferente das outras configurações, não mexe no cronograma:
 * só é gravada.
 */
export async function updateExamDateAction(
  examDate: unknown,
): Promise<ActionResult<string | null>> {
  try {
    const profile = await currentProfile();
    if (!profile) return { ok: false, error: SESSION_EXPIRED };
    if (examDate !== null && !isIsoDate(examDate)) return { ok: false, error: "Data inválida." };

    const state = await loadStudyState(profile.id);
    const { snapshot } = syncCycle(state, todayIsoDate());
    await saveSchedule(profile.id, { ...snapshot, settings: { ...snapshot.settings, examDate } });
    return { ok: true, data: examDate };
  } catch (error) {
    return fail("updateExamDate", error);
  }
}

/**
 * "Adiantar um bloco" (dia de simulado): traz o próximo bloco da fila para
 * hoje. Como as configurações, recalculado aqui a partir do estado gravado.
 */
export async function advanceBlockAction(): Promise<ActionResult<ScheduleSnapshot>> {
  try {
    const profile = await currentProfile();
    if (!profile) return { ok: false, error: SESSION_EXPIRED };

    const today = todayIsoDate();
    const state = await loadStudyState(profile.id);
    const { snapshot: current } = syncCycle(state, today);
    const advanced = advanceBlock(current, checkedBlocks(state.studyLogs), today);
    const snapshot = { ...current, ...advanced };

    await saveSchedule(profile.id, snapshot);
    return { ok: true, data: snapshot };
  } catch (error) {
    return fail("advanceBlock", error);
  }
}

/** Lança um simulado: nome, data (pode ser de dias atrás), valor da questão e acertos por matéria. */
export async function addMockExamAction(
  rawResults: unknown,
  details: unknown,
): Promise<ActionResult<MockExam>> {
  try {
    const profile = await currentProfile();
    if (!profile) return { ok: false, error: SESSION_EXPIRED };

    if (!isRecord(details)) return { ok: false, error: "Simulado inválido." };
    const title = typeof details.title === "string" && details.title.trim() !== "" ? details.title.trim() : null;
    const invalidDetails = mockDetailsError(title, details.takenOn, details.pointsPerQuestion, todayIsoDate());
    if (invalidDetails) return { ok: false, error: invalidDetails };

    const results = parseMockResults(rawResults);
    // O parse descarta o que não serve; num lançamento, isso é erro, não silêncio.
    if (!isRecord(rawResults) || Object.keys(rawResults).length !== Object.keys(results).length) {
      return { ok: false, error: "Resultado do simulado inválido." };
    }
    const invalid = mockResultsError(results);
    if (invalid) return { ok: false, error: invalid };

    const exam = await insertMockExam(profile.id, {
      title,
      takenOn: details.takenOn as string,
      pointsPerQuestion: details.pointsPerQuestion as number,
      results,
    });
    return { ok: true, data: exam };
  } catch (error) {
    return fail("addMockExam", error);
  }
}

/**
 * Metas de acerto por matéria nos simulados. Como a data da prova, não mexe
 * no cronograma: só é gravada.
 */
export async function updateMockTargetsAction(
  rawTargets: unknown,
): Promise<ActionResult<Record<string, number>>> {
  try {
    const profile = await currentProfile();
    if (!profile) return { ok: false, error: SESSION_EXPIRED };
    const mockTargets = parseMockTargets(rawTargets);

    const state = await loadStudyState(profile.id);
    const { snapshot } = syncCycle(state, todayIsoDate());
    await saveSchedule(profile.id, { ...snapshot, settings: { ...snapshot.settings, mockTargets } });
    return { ok: true, data: mockTargets };
  } catch (error) {
    return fail("updateMockTargets", error);
  }
}

/** Grava um período de estudo (parada do cronômetro ou lançamento à mão) com a data de hoje. */
export async function addStudySessionAction(
  subjectId: string,
  lessonIndex: number | null,
  minutes: number,
): Promise<ActionResult<StudySession>> {
  try {
    const profile = await currentProfile();
    if (!profile) return { ok: false, error: SESSION_EXPIRED };
    const invalid = studySessionError(subjectId, lessonIndex, minutes);
    if (invalid) return { ok: false, error: invalid };

    const session = await insertStudySession(profile.id, {
      subjectId,
      lessonIndex,
      minutes,
      studiedOn: todayIsoDate(),
    });
    return { ok: true, data: session };
  } catch (error) {
    return fail("addStudySession", error);
  }
}

export async function deleteStudySessionAction(id: string): Promise<ActionResult> {
  try {
    const profile = await currentProfile();
    if (!profile) return { ok: false, error: SESSION_EXPIRED };
    if (!isUuid(id)) return { ok: false, error: "Registro inválido." };

    await deleteStudySession(profile.id, id);
    return { ok: true, data: null };
  } catch (error) {
    return fail("deleteStudySession", error);
  }
}

/**
 * Link de uma aula (vazio apaga). É do curso, não do perfil: qualquer perfil
 * logado edita, e todos veem o mesmo.
 */
export async function setLessonLinkAction(
  subjectId: string,
  lessonIndex: number,
  rawUrl: unknown,
): Promise<ActionResult<string | null>> {
  try {
    const profile = await currentProfile();
    if (!profile) return { ok: false, error: SESSION_EXPIRED };
    if (!isKnownLesson(subjectId, lessonIndex)) return { ok: false, error: "Aula inexistente no curso." };

    const empty = typeof rawUrl === "string" && rawUrl.trim() === "";
    const url = empty ? null : normalizeLessonLink(rawUrl);
    if (!empty && !url) return { ok: false, error: "Cole um link que comece com https://." };

    await saveLessonLink(subjectId, lessonIndex, url);
    return { ok: true, data: url };
  } catch (error) {
    return fail("setLessonLink", error);
  }
}

export async function deleteMockExamAction(id: string): Promise<ActionResult> {
  try {
    const profile = await currentProfile();
    if (!profile) return { ok: false, error: SESSION_EXPIRED };
    if (!isUuid(id)) return { ok: false, error: "Simulado inválido." };

    await deleteMockExam(profile.id, id);
    return { ok: true, data: null };
  } catch (error) {
    return fail("deleteMockExam", error);
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
    const today = todayIsoDate();
    const state = await loadStudyState(profile.id);
    // Se a semana virou desde que a página abriu, a troca vale para a nova.
    const { snapshot: current } = syncCycle(state, today);
    const snapshot = regenerateWeek(current, requested, checkedBlocks(state.studyLogs), today);

    await saveSchedule(profile.id, snapshot);
    return { ok: true, data: snapshot };
  } catch (error) {
    return fail("updateSettings", error);
  }
}

/** Cria um flashcard, para revisar a partir de hoje. */
export async function addFlashcardAction(
  subjectId: string,
  topicIndex: number | null,
  front: string,
  back: string,
): Promise<ActionResult<Flashcard>> {
  try {
    const profile = await currentProfile();
    if (!profile) return { ok: false, error: SESSION_EXPIRED };
    const invalid = flashcardError(subjectId, topicIndex, front, back);
    if (invalid) return { ok: false, error: invalid };

    const card = await insertFlashcard(profile.id, {
      subjectId,
      topicIndex,
      front: front.trim(),
      back: back.trim(),
      dueOn: todayIsoDate(),
    });
    return { ok: true, data: card };
  } catch (error) {
    return fail("addFlashcard", error);
  }
}

/**
 * Importa cartões de uma planilha. O navegador já leu e conferiu o arquivo,
 * mas tudo é validado de novo aqui; um cartão inválido recusa o lote inteiro.
 */
export async function importFlashcardsAction(rawCards: unknown): Promise<ActionResult<Flashcard[]>> {
  try {
    const profile = await currentProfile();
    if (!profile) return { ok: false, error: SESSION_EXPIRED };
    if (!Array.isArray(rawCards) || rawCards.length === 0) return { ok: false, error: "Nenhum cartão para importar." };
    if (rawCards.length > MAX_IMPORT_CARDS) {
      return { ok: false, error: `No máximo ${MAX_IMPORT_CARDS} cartões por importação.` };
    }

    const dueOn = todayIsoDate();
    const cards: Pick<Flashcard, "subjectId" | "topicIndex" | "front" | "back" | "dueOn">[] = [];
    for (const [i, raw] of rawCards.entries()) {
      if (!isRecord(raw)) return { ok: false, error: `Cartão ${i + 1} inválido.` };
      const { subjectId, topicIndex, front, back } = raw;
      const topic = topicIndex === null ? null : topicIndex;
      const invalid =
        typeof subjectId !== "string" || typeof front !== "string" || typeof back !== "string"
          ? "dados incompletos"
          : flashcardError(subjectId, topic as number | null, front, back);
      if (invalid) return { ok: false, error: `Cartão ${i + 1}: ${invalid}` };
      cards.push({
        subjectId: subjectId as string,
        topicIndex: topic as number | null,
        front: (front as string).trim(),
        back: (back as string).trim(),
        dueOn,
      });
    }
    return { ok: true, data: await insertFlashcards(profile.id, cards) };
  } catch (error) {
    return fail("importFlashcards", error);
  }
}

/** Edita o texto, a matéria ou o tópico do cartão. O agendamento não muda. */
export async function updateFlashcardAction(
  id: string,
  subjectId: string,
  topicIndex: number | null,
  front: string,
  back: string,
): Promise<ActionResult<Flashcard>> {
  try {
    const profile = await currentProfile();
    if (!profile) return { ok: false, error: SESSION_EXPIRED };
    if (!isUuid(id)) return { ok: false, error: "Cartão inválido." };
    const invalid = flashcardError(subjectId, topicIndex, front, back);
    if (invalid) return { ok: false, error: invalid };

    const card = await findFlashcard(profile.id, id);
    if (!card) return { ok: false, error: "Esse cartão não existe mais." };
    const saved = await saveFlashcard(profile.id, {
      ...card,
      subjectId,
      topicIndex,
      front: front.trim(),
      back: back.trim(),
    });
    return { ok: true, data: saved };
  } catch (error) {
    return fail("updateFlashcard", error);
  }
}

/**
 * Registra a resposta de uma revisão. O próximo agendamento é calculado aqui,
 * a partir do cartão gravado — o navegador manda só a resposta.
 */
export async function reviewFlashcardAction(id: string, grade: unknown): Promise<ActionResult<Flashcard>> {
  try {
    const profile = await currentProfile();
    if (!profile) return { ok: false, error: SESSION_EXPIRED };
    if (!isUuid(id) || !isFlashcardGrade(grade)) return { ok: false, error: "Revisão inválida." };

    const card = await findFlashcard(profile.id, id);
    if (!card) return { ok: false, error: "Esse cartão não existe mais." };
    const reviewed = reviewFlashcard(card, grade, todayIsoDate(), Date.now());
    return { ok: true, data: await saveFlashcard(profile.id, reviewed) };
  } catch (error) {
    return fail("reviewFlashcard", error);
  }
}

/** Suspende o cartão (fica fora das sessões) ou o reativa. */
export async function setFlashcardSuspendedAction(id: string, suspended: unknown): Promise<ActionResult<Flashcard>> {
  try {
    const profile = await currentProfile();
    if (!profile) return { ok: false, error: SESSION_EXPIRED };
    if (!isUuid(id) || typeof suspended !== "boolean") return { ok: false, error: "Cartão inválido." };

    const card = await findFlashcard(profile.id, id);
    if (!card) return { ok: false, error: "Esse cartão não existe mais." };
    return { ok: true, data: await saveFlashcard(profile.id, { ...card, suspended }) };
  } catch (error) {
    return fail("setFlashcardSuspended", error);
  }
}

/** "Esquecer": o cartão volta a ser novo, com o texto intacto. */
export async function forgetFlashcardAction(id: string): Promise<ActionResult<Flashcard>> {
  try {
    const profile = await currentProfile();
    if (!profile) return { ok: false, error: SESSION_EXPIRED };
    if (!isUuid(id)) return { ok: false, error: "Cartão inválido." };

    const card = await findFlashcard(profile.id, id);
    if (!card) return { ok: false, error: "Esse cartão não existe mais." };
    return { ok: true, data: await saveFlashcard(profile.id, forgetFlashcard(card, todayIsoDate())) };
  } catch (error) {
    return fail("forgetFlashcard", error);
  }
}

/**
 * Desfaz a última resposta: volta o agendamento ao que era antes dela. O
 * navegador manda o agendamento anterior, aceito só dentro das faixas válidas
 * e só para um cartão do próprio perfil; o texto não muda.
 */
export async function restoreFlashcardAction(id: string, schedule: unknown): Promise<ActionResult<Flashcard>> {
  try {
    const profile = await currentProfile();
    if (!profile) return { ok: false, error: SESSION_EXPIRED };
    const parsed = parseSchedule(schedule, todayIsoDate());
    if (!isUuid(id) || !parsed) return { ok: false, error: "Não foi possível desfazer." };

    const card = await findFlashcard(profile.id, id);
    if (!card) return { ok: false, error: "Esse cartão não existe mais." };
    return { ok: true, data: await saveFlashcard(profile.id, { ...card, ...parsed }) };
  } catch (error) {
    return fail("restoreFlashcard", error);
  }
}

/** Limites diários de novos e de revisões. Como a data da prova, não mexe no cronograma. */
export async function updateFlashcardLimitsAction(
  newPerDay: unknown,
  reviewsPerDay: unknown,
): Promise<ActionResult<{ newPerDay: number; reviewsPerDay: number }>> {
  try {
    const profile = await currentProfile();
    if (!profile) return { ok: false, error: SESSION_EXPIRED };
    const valid = (v: unknown, min: number, max: number): v is number =>
      Number.isInteger(v) && (v as number) >= min && (v as number) <= max;
    if (!valid(newPerDay, 0, MAX_NEW_PER_DAY) || !valid(reviewsPerDay, 1, MAX_REVIEWS_PER_DAY)) {
      return { ok: false, error: "Limites inválidos." };
    }

    const state = await loadStudyState(profile.id);
    const { snapshot } = syncCycle(state, todayIsoDate());
    await saveSchedule(profile.id, {
      ...snapshot,
      settings: { ...snapshot.settings, flashcardNewPerDay: newPerDay, flashcardReviewsPerDay: reviewsPerDay },
    });
    return { ok: true, data: { newPerDay, reviewsPerDay } };
  } catch (error) {
    return fail("updateFlashcardLimits", error);
  }
}

export async function deleteFlashcardAction(id: string): Promise<ActionResult> {
  try {
    const profile = await currentProfile();
    if (!profile) return { ok: false, error: SESSION_EXPIRED };
    if (!isUuid(id)) return { ok: false, error: "Cartão inválido." };

    await deleteFlashcard(profile.id, id);
    return { ok: true, data: null };
  } catch (error) {
    return fail("deleteFlashcard", error);
  }
}
