"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { isoWeekday, startOfIsoWeek, toIsoDate } from "@/lib/date";
import { weekProgress as calcWeekProgress, topicKey, type Progress } from "@/lib/progress";
import { generateWeek, pointersBeforeWeek } from "@/lib/schedule";
import { emptyState, loadState, saveState } from "@/lib/storage";
import type { ScheduledBlock, Settings, StudyState } from "@/lib/types";

/** Garante que o estado tenha um cronograma para a semana de `reference`. */
function withCurrentWeek(state: StudyState, reference: Date): StudyState {
  const weekStart = toIsoDate(startOfIsoWeek(reference));
  if (state.week?.weekStart === weekStart) return state;

  const { week, pointers } = generateWeek(state.settings, state.pointers, weekStart);
  return { ...state, week, pointers };
}

export interface StudyCycle {
  /** `false` até o estado ser lido do navegador — evita divergência de hidratação. */
  ready: boolean;
  state: StudyState;
  today: Date | null;
  todayIso: number | null;
  todayBlocks: ScheduledBlock[];
  weekProgress: Progress;
  toggleTopic: (subjectId: string, topicIndex: number) => void;
  toggleDay: (day: number) => void;
  setBlocksPerDay: (blocks: number) => void;
}

export function useStudyCycle(): StudyCycle {
  const [state, setState] = useState<StudyState>(emptyState);
  const [today, setToday] = useState<Date | null>(null);
  const ready = today !== null;

  // `localStorage` e `new Date()` só existem/valem no cliente: a primeira
  // renderização é sempre o estado vazio, igual ao HTML vindo do servidor.
  useEffect(() => {
    const now = new Date();
    setState(withCurrentWeek(loadState(), now));
    setToday(now);
  }, []);

  // Persiste toda mudança posterior à carga inicial.
  useEffect(() => {
    if (!ready) return;
    saveState(state);
  }, [ready, state]);

  /**
   * Trocar dias ou blocos regenera a semana atual. A semana descartada é
   * removida do histórico antes de gerar a nova, de modo que a troca substitui
   * o cronograma em vez de empurrar os ponteiros adiante e pular tópicos.
   */
  const applySettings = useCallback((update: (settings: Settings) => Settings) => {
    setState((prev) => {
      const settings = update(prev.settings);
      const weekStart = prev.week?.weekStart ?? toIsoDate(startOfIsoWeek(new Date()));
      const base = pointersBeforeWeek(prev.pointers, prev.week);
      const { week, pointers } = generateWeek(settings, base, weekStart);
      return { ...prev, settings, week, pointers };
    });
  }, []);

  const toggleTopic = useCallback((subjectId: string, topicIndex: number) => {
    setState((prev) => {
      const key = topicKey(subjectId, topicIndex);
      const completed = { ...prev.completed };
      if (completed[key]) delete completed[key];
      else completed[key] = true;
      return { ...prev, completed };
    });
  }, []);

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

  const todayIso = today ? isoWeekday(today) : null;

  const todayBlocks = useMemo(() => {
    if (todayIso === null) return [];
    return state.week?.days.find((d) => d.day === todayIso)?.blocks ?? [];
  }, [state.week, todayIso]);

  const weekProgress = useMemo(
    () => calcWeekProgress(state.week, state.completed),
    [state.week, state.completed],
  );

  return {
    ready,
    state,
    today,
    todayIso,
    todayBlocks,
    weekProgress,
    toggleTopic,
    toggleDay,
    setBlocksPerDay,
  };
}
