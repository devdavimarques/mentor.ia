"use client";

import { useCallback, useMemo, useRef, useState, useTransition } from "react";

import {
  addFlashcardAction,
  addMockExamAction,
  addQuestionsAction,
  addStudySessionAction,
  advanceBlockAction,
  deleteFlashcardAction,
  deleteMockExamAction,
  deleteQuestionsAction,
  deleteStudySessionAction,
  importFlashcardsAction,
  markReviewAction,
  reviewFlashcardAction,
  setLessonLinkAction,
  setTopicStudiedAction,
  toggleBlockAction,
  unmarkReviewAction,
  updateExamDateAction,
  updateFlashcardAction,
  updateMockTargetsAction,
  updateSettingsAction,
  type ActionResult,
} from "@/app/actions";
import {
  examOutlook as calcExamOutlook,
  projectCycleEnd,
  type CycleEnd,
  type ExamOutlook,
} from "@/lib/cycle";
import { fromIsoDate, isoWeekday } from "@/lib/date";
import { reviewFlashcard as scheduleReview, type FlashcardGrade } from "@/lib/flashcards";
import { lessonLinkKey } from "@/lib/lesson-links";
import { pendingMock as calcPendingMock } from "@/lib/mock-exams";
import {
  checkedBlocks,
  manualTopics,
  studiedLessons,
  studiedTopics,
  weekProgress as calcWeekProgress,
  type LessonsMap,
  type Progress,
  type StudiedMap,
} from "@/lib/progress";
import {
  PENDING_ID_PREFIX,
  topicsByAccuracy,
  weakTopicKeys,
  type TopicAccuracy,
} from "@/lib/questions";
import { reviewsForDay, type ReviewItem } from "@/lib/reviews";
import {
  advanceBlock,
  mockDayOfWeek,
  nextLessons as calcNextLessons,
  overdueBlocks,
  regenerateWeek,
  type OverdueBlock,
} from "@/lib/schedule";
import { studyStreak, type Streak } from "@/lib/streak";
import { DEFAULT_WEIGHTS } from "@/lib/subjects";
import type {
  BlockRef,
  Flashcard,
  MockExam,
  MockResult,
  QuestionLog,
  ReviewLog,
  ScheduledBlock,
  Settings,
  StudyLog,
  StudySession,
  StudyState,
} from "@/lib/types";

/** Cabeçalho de um simulado lançado. */
export interface MockExamDetails {
  title: string | null;
  takenOn: string;
  pointsPerQuestion: number;
}

export interface StudyCycle {
  state: StudyState;
  /** Hoje no fuso do app, `yyyy-mm-dd`. */
  todayDate: string;
  today: Date;
  /** Dia ISO de hoje: 1 = segunda … 7 = domingo. */
  todayIso: number;
  todayBlocks: ScheduledBlock[];
  weekProgress: Progress;
  /** Tópicos estudados → data em que ficaram estudados. */
  studied: StudiedMap;
  /** Aulas feitas → data do primeiro estudo. */
  lessons: LessonsMap;
  /** Tópicos marcados à mão na aba Matérias. */
  manual: ReadonlySet<string>;
  /** Blocos marcados, pela `blockKey`. */
  checked: ReadonlySet<string>;
  /** Revisões vencidas e as feitas hoje. */
  reviews: ReviewItem[];
  /** Blocos atrasados ainda sem fazer, e os atrasados feitos hoje (para desfazer). */
  overdue: OverdueBlock[];
  /** Próxima aula de cada matéria (posição na sequência): só ela pode ser marcada. */
  nextLessons: ReadonlyMap<string, number>;
  /** Previsão de fim do ciclo pelo cronograma atual. */
  cycleEnd: CycleEnd | null;
  /** Prazo até a prova, se a data estiver definida. */
  examOutlook: ExamOutlook | null;
  /** Tópicos com questões suficientes, do pior acerto para o melhor. */
  topicAccuracy: TopicAccuracy[];
  /** Dia do simulado desta semana, se ele está pendente. */
  pendingMock: string | null;
  /** Dias seguidos com a meta de blocos cumprida, e o recorde. */
  streak: Streak;
  saving: boolean;
  error: string | null;
  dismissError: () => void;
  /** `weekStart` só para atrasados de outra semana; o padrão é a semana atual. */
  toggleBlock: (block: ScheduledBlock, weekStart?: string) => void;
  toggleTopicStudied: (subjectId: string, topicIndex: number) => void;
  toggleReview: (item: ReviewItem) => void;
  addQuestions: (subjectId: string, topicIndex: number, answered: number, correct: number) => void;
  deleteQuestions: (id: string) => void;
  toggleDay: (day: number) => void;
  setBlocksPerDay: (blocks: number) => void;
  /** Troca o peso de uma matéria (0 tira do ciclo). */
  setWeight: (subjectId: string, weight: number) => void;
  /** Volta todos os pesos ao padrão. */
  resetWeights: () => void;
  /** Data da prova (`null` apaga). Não mexe no cronograma. */
  setExamDate: (date: string | null) => void;
  /** Frequência e dia do simulado. Regeram a semana de hoje em diante. */
  setMockEveryWeeks: (weeks: number) => void;
  setMockDay: (day: number) => void;
  /** Dia de simulado: traz o próximo bloco da fila para hoje. */
  advanceOneBlock: () => void;
  /** Hoje é o dia do simulado desta semana (sem blocos do ciclo). */
  isMockDay: boolean;
  addMockExam: (results: Record<string, MockResult>, details: MockExamDetails) => void;
  deleteMockExam: (id: string) => void;
  /** Meta de acerto (%) de uma matéria nos simulados; `null` tira a meta. */
  setMockTarget: (subjectId: string, pct: number | null) => void;
  /** Grava minutos de estudo de hoje (cronômetro ou lançamento à mão). */
  addStudySession: (subjectId: string, lessonIndex: number | null, minutes: number) => void;
  deleteStudySession: (id: string) => void;
  /** Link de uma aula; vazio apaga. Vale para todos os perfis. */
  setLessonLink: (subjectId: string, lessonIndex: number, url: string | null) => void;
  addFlashcard: (subjectId: string, topicIndex: number | null, front: string, back: string) => void;
  updateFlashcard: (id: string, subjectId: string, topicIndex: number | null, front: string, back: string) => void;
  /** Resposta de uma revisão: o cartão é reagendado na hora e o servidor confirma. */
  reviewFlashcard: (id: string, grade: FlashcardGrade) => void;
  deleteFlashcard: (id: string) => void;
  /** Cria de uma vez os cartões lidos de uma planilha. */
  importFlashcards: (cards: { subjectId: string; topicIndex: number | null; front: string; back: string }[]) => void;
}

/** Troca o registro otimista pelo que o banco gravou (a data vem do servidor). */
function replaceLog(optimistic: StudyLog) {
  return (s: StudyState, saved: StudyLog | null): StudyState =>
    saved ? { ...s, studyLogs: s.studyLogs.map((l) => (l === optimistic ? saved : l)) } : s;
}

/**
 * Estado do ciclo no cliente, sobre um estado inicial vindo do servidor.
 *
 * Toda alteração é aplicada na hora (otimista) e enviada em seguida ao banco.
 * Se a gravação falhar, só aquela alteração é desfeita — as outras feitas
 * enquanto ela estava a caminho continuam — e o erro aparece na interface.
 *
 * `todayDate` vem do servidor já resolvido no fuso do app, então cliente e
 * servidor nunca discordam sobre que dia é hoje.
 *
 * Com `persist` falso (visitante), as alterações ficam só na tela: nada é
 * enviado, e recarregar a página volta ao ciclo de exemplo.
 */
export function useStudyCycle(
  initialState: StudyState,
  todayDate: string,
  persist = true,
): StudyCycle {
  const [state, setState] = useState<StudyState>(initialState);
  const [error, setError] = useState<string | null>(null);
  const [saving, startTransition] = useTransition();

  // Espelho síncrono: os handlers precisam do valor corrente para calcular o
  // próximo estado, inclusive dentro de respostas que chegam depois.
  const stateRef = useRef(state);
  stateRef.current = state;
  const pendingIds = useRef(0);

  const update = useCallback((next: StudyState) => {
    stateRef.current = next;
    setState(next);
  }, []);

  /**
   * Aplica `apply` já, envia `request` e, na resposta, desfaz com `revert`
   * (falha) ou ajusta com `reconcile` (sucesso). As duas recebem o estado do
   * momento da resposta, não o de quando a ação começou.
   */
  const mutate = useCallback(
    <T>(
      apply: (s: StudyState) => StudyState,
      revert: (s: StudyState) => StudyState,
      request: () => Promise<ActionResult<T>>,
      reconcile?: (s: StudyState, data: T) => StudyState,
    ) => {
      update(apply(stateRef.current));
      setError(null);
      if (!persist) return;

      startTransition(async () => {
        const result = await request();
        if (!result.ok) {
          update(revert(stateRef.current));
          setError(result.error);
          return;
        }
        if (reconcile) update(reconcile(stateRef.current, result.data));
      });
    },
    [update, persist],
  );

  const toggleBlock = useCallback(
    (block: ScheduledBlock, weekStart = stateRef.current.week?.weekStart) => {
      if (!weekStart) return;

      const ref: BlockRef = {
        weekStart,
        subjectId: block.subjectId,
        lessonIndex: block.lessonIndex,
        lap: block.lap,
      };
      const isThisBlock = (log: StudyLog) =>
        log.kind === "lesson" &&
        log.subjectId === ref.subjectId &&
        log.lessonIndex === ref.lessonIndex &&
        log.block?.weekStart === ref.weekStart &&
        log.block.lap === ref.lap;

      const existing = stateRef.current.studyLogs.find(isThisBlock);

      if (existing) {
        mutate(
          (s) => ({ ...s, studyLogs: s.studyLogs.filter((l) => !isThisBlock(l)) }),
          (s) => ({ ...s, studyLogs: [...s.studyLogs, existing] }),
          () => toggleBlockAction(ref, false),
        );
        return;
      }

      const optimistic: StudyLog = {
        kind: "lesson",
        subjectId: ref.subjectId,
        lessonIndex: ref.lessonIndex,
        studiedOn: todayDate,
        block: { weekStart: ref.weekStart, lap: ref.lap },
      };
      mutate(
        (s) => ({ ...s, studyLogs: [...s.studyLogs, optimistic] }),
        (s) => ({ ...s, studyLogs: s.studyLogs.filter((l) => l !== optimistic) }),
        () => toggleBlockAction(ref, true),
        replaceLog(optimistic),
      );
    },
    [mutate, todayDate],
  );

  const toggleTopicStudied = useCallback(
    (subjectId: string, topicIndex: number) => {
      // Só as marcações manuais: as aulas se desmarcam pelos próprios blocos.
      const isThisTopic = (log: StudyLog) =>
        log.kind === "topic" && log.subjectId === subjectId && log.topicIndex === topicIndex;
      const removed = stateRef.current.studyLogs.filter(isThisTopic);

      if (removed.length > 0) {
        mutate(
          (s) => ({ ...s, studyLogs: s.studyLogs.filter((l) => !isThisTopic(l)) }),
          (s) => ({ ...s, studyLogs: [...s.studyLogs, ...removed] }),
          () => setTopicStudiedAction(subjectId, topicIndex, false),
        );
        return;
      }

      const optimistic: StudyLog = { kind: "topic", subjectId, topicIndex, studiedOn: todayDate };
      mutate(
        (s) => ({ ...s, studyLogs: [...s.studyLogs, optimistic] }),
        (s) => ({ ...s, studyLogs: s.studyLogs.filter((l) => l !== optimistic) }),
        () => setTopicStudiedAction(subjectId, topicIndex, true),
        replaceLog(optimistic),
      );
    },
    [mutate, todayDate],
  );

  const toggleReview = useCallback(
    (item: ReviewItem) => {
      const { subjectId, topicIndex, stage } = item;

      if (item.doneOn) {
        const doneOn = item.doneOn;
        const isThisReview = (log: ReviewLog) =>
          log.subjectId === subjectId &&
          log.topicIndex === topicIndex &&
          log.stage === stage &&
          log.doneOn === doneOn;
        const existing: ReviewLog = { subjectId, topicIndex, stage, doneOn };

        mutate(
          (s) => ({ ...s, reviewLogs: s.reviewLogs.filter((l) => !isThisReview(l)) }),
          (s) => ({ ...s, reviewLogs: [...s.reviewLogs, existing] }),
          () => unmarkReviewAction(subjectId, topicIndex, stage, doneOn),
        );
        return;
      }

      const optimistic: ReviewLog = { subjectId, topicIndex, stage, doneOn: todayDate };
      mutate(
        (s) => ({ ...s, reviewLogs: [...s.reviewLogs, optimistic] }),
        (s) => ({ ...s, reviewLogs: s.reviewLogs.filter((l) => l !== optimistic) }),
        () => markReviewAction(subjectId, topicIndex, stage),
        (s, savedOn) => ({
          ...s,
          reviewLogs: s.reviewLogs.map((l) => (l === optimistic ? { ...l, doneOn: savedOn } : l)),
        }),
      );
    },
    [mutate, todayDate],
  );

  const addQuestions = useCallback(
    (subjectId: string, topicIndex: number, answered: number, correct: number) => {
      // Visitante nunca recebe id do banco: o lançamento já nasce definitivo
      // (com prefixo de "pendente" o botão de apagar ficaria desativado).
      const optimistic: QuestionLog = {
        id: `${persist ? PENDING_ID_PREFIX : "local-"}${++pendingIds.current}`,
        subjectId,
        topicIndex,
        answered,
        correct,
        loggedOn: todayDate,
      };
      mutate(
        (s) => ({ ...s, questionLogs: [...s.questionLogs, optimistic] }),
        (s) => ({ ...s, questionLogs: s.questionLogs.filter((l) => l !== optimistic) }),
        () => addQuestionsAction(subjectId, topicIndex, answered, correct),
        (s, saved) => ({
          ...s,
          questionLogs: s.questionLogs.map((l) => (l === optimistic ? saved : l)),
        }),
      );
    },
    [mutate, todayDate, persist],
  );

  const deleteQuestions = useCallback(
    (id: string) => {
      // Ainda sem id do banco: não há o que apagar lá. A interface desabilita o botão.
      if (id.startsWith(PENDING_ID_PREFIX)) return;
      const existing = stateRef.current.questionLogs.find((l) => l.id === id);
      if (!existing) return;

      mutate(
        (s) => ({ ...s, questionLogs: s.questionLogs.filter((l) => l.id !== id) }),
        (s) => ({ ...s, questionLogs: [...s.questionLogs, existing] }),
        () => deleteQuestionsAction(id),
      );
    },
    [mutate],
  );

  const applySettings = useCallback(
    (change: (settings: Settings) => Settings) => {
      const previous = stateRef.current;
      const week = previous.week;
      // O servidor sempre manda a semana atual pronta; sem ela não há o que regerar.
      if (!week) return;
      const requested = change(previous.settings);

      // Mesma função pura do servidor: o resultado otimista bate com o que
      // volta gravado, e a tela não "pisca" na reconciliação.
      const optimistic = regenerateWeek(
        { ...previous, week },
        requested,
        checkedBlocks(previous.studyLogs),
        todayDate,
      );

      mutate(
        (s) => ({ ...s, ...optimistic }),
        (s) => ({
          ...s,
          settings: previous.settings,
          pointers: previous.pointers,
          week: previous.week,
        }),
        () => updateSettingsAction(requested),
        // O servidor é a fonte da verdade sobre o cronograma gravado.
        (s, snapshot) => ({ ...s, ...snapshot }),
      );
    },
    [mutate, todayDate],
  );

  const toggleDay = useCallback(
    (day: number) => {
      applySettings((settings) => ({
        ...settings,
        activeDays: settings.activeDays.includes(day)
          ? settings.activeDays.filter((d) => d !== day)
          : [...settings.activeDays, day].sort((a, b) => a - b),
      }));
    },
    [applySettings],
  );

  const setBlocksPerDay = useCallback(
    (blocksPerDay: number) => applySettings((settings) => ({ ...settings, blocksPerDay })),
    [applySettings],
  );

  const setWeight = useCallback(
    (subjectId: string, weight: number) =>
      applySettings((settings) => ({
        ...settings,
        weights: { ...settings.weights, [subjectId]: weight },
      })),
    [applySettings],
  );

  const resetWeights = useCallback(
    () => applySettings((settings) => ({ ...settings, weights: { ...DEFAULT_WEIGHTS } })),
    [applySettings],
  );

  const advanceOneBlock = useCallback(() => {
    const previous = stateRef.current;
    const week = previous.week;
    if (!week) return;

    // Mesma função pura do servidor, como nas configurações.
    const optimistic = advanceBlock(
      { settings: previous.settings, pointers: previous.pointers, week },
      checkedBlocks(previous.studyLogs),
      todayDate,
    );

    mutate(
      (s) => ({ ...s, ...optimistic }),
      (s) => ({ ...s, pointers: previous.pointers, week: previous.week }),
      () => advanceBlockAction(),
      (s, snapshot) => ({ ...s, ...snapshot }),
    );
  }, [mutate, todayDate]);

  // A data da prova não mexe no cronograma: só ela vai para o servidor.
  const setExamDate = useCallback(
    (examDate: string | null) => {
      const previous = stateRef.current.settings.examDate;
      mutate(
        (s) => ({ ...s, settings: { ...s.settings, examDate } }),
        (s) => ({ ...s, settings: { ...s.settings, examDate: previous } }),
        () => updateExamDateAction(examDate),
      );
    },
    [mutate],
  );

  // Frequência e dia do simulado mudam quais dias têm blocos: regeram a semana.
  const setMockEveryWeeks = useCallback(
    (mockEveryWeeks: number) => applySettings((settings) => ({ ...settings, mockEveryWeeks })),
    [applySettings],
  );

  const setMockDay = useCallback(
    (mockDay: number) => applySettings((settings) => ({ ...settings, mockDay })),
    [applySettings],
  );

  const addMockExam = useCallback(
    (results: Record<string, MockResult>, details: MockExamDetails) => {
      // Mesmo esquema das questões: id provisório até o banco devolver o definitivo.
      const optimistic: MockExam = {
        id: `${persist ? PENDING_ID_PREFIX : "local-"}${++pendingIds.current}`,
        ...details,
        results,
      };
      mutate(
        (s) => ({ ...s, mockExams: [...s.mockExams, optimistic] }),
        (s) => ({ ...s, mockExams: s.mockExams.filter((e) => e !== optimistic) }),
        () => addMockExamAction(results, details),
        (s, saved) => ({ ...s, mockExams: s.mockExams.map((e) => (e === optimistic ? saved : e)) }),
      );
    },
    [mutate, persist],
  );

  // Como a data da prova: só a meta vai para o servidor, o cronograma não muda.
  const setMockTarget = useCallback(
    (subjectId: string, pct: number | null) => {
      const previous = stateRef.current.settings.mockTargets;
      const next = { ...previous };
      if (pct === null) delete next[subjectId];
      else next[subjectId] = pct;
      mutate(
        (s) => ({ ...s, settings: { ...s.settings, mockTargets: next } }),
        (s) => ({ ...s, settings: { ...s.settings, mockTargets: previous } }),
        () => updateMockTargetsAction(next),
      );
    },
    [mutate],
  );

  const addStudySession = useCallback(
    (subjectId: string, lessonIndex: number | null, minutes: number) => {
      const optimistic: StudySession = {
        id: `${persist ? PENDING_ID_PREFIX : "local-"}${++pendingIds.current}`,
        subjectId,
        lessonIndex,
        minutes,
        studiedOn: todayDate,
      };
      mutate(
        (s) => ({ ...s, studySessions: [...s.studySessions, optimistic] }),
        (s) => ({ ...s, studySessions: s.studySessions.filter((x) => x !== optimistic) }),
        () => addStudySessionAction(subjectId, lessonIndex, minutes),
        (s, saved) => ({ ...s, studySessions: s.studySessions.map((x) => (x === optimistic ? saved : x)) }),
      );
    },
    [mutate, todayDate, persist],
  );

  const deleteStudySession = useCallback(
    (id: string) => {
      if (id.startsWith(PENDING_ID_PREFIX)) return;
      const existing = stateRef.current.studySessions.find((x) => x.id === id);
      if (!existing) return;
      mutate(
        (s) => ({ ...s, studySessions: s.studySessions.filter((x) => x.id !== id) }),
        (s) => ({ ...s, studySessions: [...s.studySessions, existing] }),
        () => deleteStudySessionAction(id),
      );
    },
    [mutate],
  );

  const setLessonLink = useCallback(
    (subjectId: string, lessonIndex: number, url: string | null) => {
      const key = lessonLinkKey(subjectId, lessonIndex);
      const previous = stateRef.current.lessonLinks[key];
      const withLink = (s: StudyState, value: string | null | undefined): StudyState => {
        const lessonLinks = { ...s.lessonLinks };
        if (value) lessonLinks[key] = value;
        else delete lessonLinks[key];
        return { ...s, lessonLinks };
      };
      mutate(
        (s) => withLink(s, url),
        (s) => withLink(s, previous),
        () => setLessonLinkAction(subjectId, lessonIndex, url ?? ""),
        // O servidor devolve o link normalizado.
        (s, saved) => withLink(s, saved),
      );
    },
    [mutate],
  );

  const deleteMockExam = useCallback(
    (id: string) => {
      if (id.startsWith(PENDING_ID_PREFIX)) return;
      const existing = stateRef.current.mockExams.find((e) => e.id === id);
      if (!existing) return;

      mutate(
        (s) => ({ ...s, mockExams: s.mockExams.filter((e) => e.id !== id) }),
        (s) => ({ ...s, mockExams: [...s.mockExams, existing] }),
        () => deleteMockExamAction(id),
      );
    },
    [mutate],
  );

  const addFlashcard = useCallback(
    (subjectId: string, topicIndex: number | null, front: string, back: string) => {
      // Mesmo esquema das questões: id provisório até o banco devolver o definitivo.
      const optimistic: Flashcard = {
        id: `${persist ? PENDING_ID_PREFIX : "local-"}${++pendingIds.current}`,
        subjectId,
        topicIndex,
        front: front.trim(),
        back: back.trim(),
        dueOn: todayDate,
        intervalDays: 0,
        ease: 2.5,
        reps: 0,
        lapses: 0,
      };
      mutate(
        (s) => ({ ...s, flashcards: [...s.flashcards, optimistic] }),
        (s) => ({ ...s, flashcards: s.flashcards.filter((c) => c !== optimistic) }),
        () => addFlashcardAction(subjectId, topicIndex, front, back),
        (s, saved) => ({ ...s, flashcards: s.flashcards.map((c) => (c === optimistic ? saved : c)) }),
      );
    },
    [mutate, todayDate, persist],
  );

  const importFlashcards = useCallback(
    (cards: { subjectId: string; topicIndex: number | null; front: string; back: string }[]) => {
      const optimistic: Flashcard[] = cards.map((c) => ({
        id: `${persist ? PENDING_ID_PREFIX : "local-"}${++pendingIds.current}`,
        subjectId: c.subjectId,
        topicIndex: c.topicIndex,
        front: c.front.trim(),
        back: c.back.trim(),
        dueOn: todayDate,
        intervalDays: 0,
        ease: 2.5,
        reps: 0,
        lapses: 0,
      }));
      const added = new Set(optimistic);
      mutate(
        (s) => ({ ...s, flashcards: [...s.flashcards, ...optimistic] }),
        (s) => ({ ...s, flashcards: s.flashcards.filter((c) => !added.has(c)) }),
        () => importFlashcardsAction(cards),
        (s, saved) => ({ ...s, flashcards: [...s.flashcards.filter((c) => !added.has(c)), ...saved] }),
      );
    },
    [mutate, todayDate, persist],
  );

  /** Troca um cartão existente: aplica já, desfaz se falhar, confirma com o que o banco gravou. */
  const replaceFlashcard = useCallback(
    (id: string, next: (card: Flashcard) => Flashcard, request: () => Promise<ActionResult<Flashcard>>) => {
      if (id.startsWith(PENDING_ID_PREFIX)) return;
      const existing = stateRef.current.flashcards.find((c) => c.id === id);
      if (!existing) return;
      const updated = next(existing);
      mutate(
        (s) => ({ ...s, flashcards: s.flashcards.map((c) => (c.id === id ? updated : c)) }),
        (s) => ({ ...s, flashcards: s.flashcards.map((c) => (c.id === id ? existing : c)) }),
        request,
        (s, saved) => ({ ...s, flashcards: s.flashcards.map((c) => (c.id === id ? saved : c)) }),
      );
    },
    [mutate],
  );

  const updateFlashcard = useCallback(
    (id: string, subjectId: string, topicIndex: number | null, front: string, back: string) =>
      replaceFlashcard(
        id,
        (card) => ({ ...card, subjectId, topicIndex, front: front.trim(), back: back.trim() }),
        () => updateFlashcardAction(id, subjectId, topicIndex, front, back),
      ),
    [replaceFlashcard],
  );

  const reviewFlashcard = useCallback(
    (id: string, grade: FlashcardGrade) =>
      replaceFlashcard(
        id,
        (card) => scheduleReview(card, grade, todayDate),
        () => reviewFlashcardAction(id, grade),
      ),
    [replaceFlashcard, todayDate],
  );

  const deleteFlashcard = useCallback(
    (id: string) => {
      if (id.startsWith(PENDING_ID_PREFIX)) return;
      const existing = stateRef.current.flashcards.find((c) => c.id === id);
      if (!existing) return;
      mutate(
        (s) => ({ ...s, flashcards: s.flashcards.filter((c) => c.id !== id) }),
        (s) => ({ ...s, flashcards: [...s.flashcards, existing] }),
        () => deleteFlashcardAction(id),
      );
    },
    [mutate],
  );

  const today = useMemo(() => fromIsoDate(todayDate), [todayDate]);
  const todayIso = isoWeekday(today);

  const todayBlocks = useMemo(
    () => state.week?.days.find((day) => day.day === todayIso)?.blocks ?? [],
    [state.week, todayIso],
  );

  const lessons = useMemo(() => studiedLessons(state.studyLogs), [state.studyLogs]);
  const studied = useMemo(() => studiedTopics(state.studyLogs, lessons), [state.studyLogs, lessons]);
  const manual = useMemo(() => manualTopics(state.studyLogs), [state.studyLogs]);
  const checked = useMemo(() => checkedBlocks(state.studyLogs), [state.studyLogs]);

  const weekProgress = useMemo(
    () => calcWeekProgress(state.week, checked),
    [state.week, checked],
  );

  const topicAccuracy = useMemo(() => topicsByAccuracy(state.questionLogs), [state.questionLogs]);

  const reviews = useMemo(
    () => reviewsForDay(studied, state.reviewLogs, todayDate, weakTopicKeys(topicAccuracy)),
    [studied, state.reviewLogs, todayDate, topicAccuracy],
  );

  // Atrasados marcados hoje continuam na lista, para dar para desfazer.
  const checkedToday = useMemo(
    () => checkedBlocks(state.studyLogs.filter((log) => log.studiedOn === todayDate)),
    [state.studyLogs, todayDate],
  );
  const overdue = useMemo(
    () =>
      overdueBlocks(
        state.week,
        todayDate,
        (key) => !checked.has(key) || checkedToday.has(key),
      ),
    [state.week, todayDate, checked, checkedToday],
  );

  const nextLessons = useMemo(() => calcNextLessons(state.week, checked), [state.week, checked]);

  const streak = useMemo(
    () => studyStreak(state.studyLogs, state.settings, todayDate),
    [state.studyLogs, state.settings, todayDate],
  );

  const cycleEnd = useMemo(
    () => projectCycleEnd(state, checked, todayDate),
    [state, checked, todayDate],
  );

  // Testa mais blocos por dia regerando a semana: só depende do cronograma e das configurações.
  const examOutlook = useMemo(
    () =>
      calcExamOutlook(
        { settings: state.settings, pointers: state.pointers, week: state.week },
        checked,
        todayDate,
      ),
    [state.settings, state.pointers, state.week, checked, todayDate],
  );

  const isMockDay =
    !!state.week && mockDayOfWeek(state.settings, state.week.weekStart) === todayIso;

  const pendingMock = useMemo(
    () =>
      state.week
        ? calcPendingMock(state.settings, state.week.weekStart, todayDate, state.mockExams)
        : null,
    [state.settings, state.week, todayDate, state.mockExams],
  );

  const dismissError = useCallback(() => setError(null), []);

  return {
    state,
    todayDate,
    today,
    todayIso,
    todayBlocks,
    weekProgress,
    studied,
    lessons,
    manual,
    checked,
    reviews,
    overdue,
    nextLessons,
    cycleEnd,
    examOutlook,
    topicAccuracy,
    pendingMock,
    streak,
    saving,
    error,
    dismissError,
    toggleBlock,
    toggleTopicStudied,
    toggleReview,
    addQuestions,
    deleteQuestions,
    toggleDay,
    setBlocksPerDay,
    setWeight,
    resetWeights,
    setExamDate,
    setMockEveryWeeks,
    setMockDay,
    advanceOneBlock,
    isMockDay,
    addMockExam,
    deleteMockExam,
    setMockTarget,
    addStudySession,
    deleteStudySession,
    setLessonLink,
    addFlashcard,
    updateFlashcard,
    reviewFlashcard,
    deleteFlashcard,
    importFlashcards,
  };
}
