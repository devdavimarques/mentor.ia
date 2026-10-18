"use client";

import { useCallback, useMemo, useRef, useState, useTransition } from "react";

import {
  addQuestionsAction,
  deleteQuestionsAction,
  markReviewAction,
  setTopicStudiedAction,
  toggleBlockAction,
  unmarkReviewAction,
  updateSettingsAction,
  type ActionResult,
} from "@/app/actions";
import { fromIsoDate, isoWeekday, startOfIsoWeek, toIsoDate } from "@/lib/date";
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
import { PENDING_ID_PREFIX } from "@/lib/questions";
import { reviewsForDay, type ReviewItem } from "@/lib/reviews";
import { regenerateWeek } from "@/lib/schedule";
import { DEFAULT_WEIGHTS } from "@/lib/subjects";
import type {
  BlockRef,
  QuestionLog,
  ReviewLog,
  ScheduledBlock,
  Settings,
  StudyLog,
  StudyState,
} from "@/lib/types";

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
  saving: boolean;
  error: string | null;
  dismissError: () => void;
  toggleBlock: (block: ScheduledBlock) => void;
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
 */
export function useStudyCycle(initialState: StudyState, todayDate: string): StudyCycle {
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
    [update],
  );

  const toggleBlock = useCallback(
    (block: ScheduledBlock) => {
      const week = stateRef.current.week;
      if (!week) return;

      const ref: BlockRef = {
        weekStart: week.weekStart,
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
      const optimistic: QuestionLog = {
        id: `${PENDING_ID_PREFIX}${++pendingIds.current}`,
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
    [mutate, todayDate],
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
      const requested = change(previous.settings);
      const weekStart =
        previous.week?.weekStart ?? toIsoDate(startOfIsoWeek(fromIsoDate(todayDate)));

      // Mesma função pura do servidor: o resultado otimista bate com o que
      // volta gravado, e a tela não "pisca" na reconciliação.
      const optimistic = regenerateWeek(previous, requested, weekStart);

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

  const reviews = useMemo(
    () => reviewsForDay(studied, state.reviewLogs, todayDate),
    [studied, state.reviewLogs, todayDate],
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
  };
}
