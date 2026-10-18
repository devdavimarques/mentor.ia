"use client";

import { createContext, useContext } from "react";

import type { QuestionLog } from "@/lib/types";

export interface QuestionsApi {
  logs: readonly QuestionLog[];
  add: (subjectId: string, topicIndex: number, answered: number, correct: number) => void;
  remove: (id: string) => void;
}

/**
 * Questões ficam num contexto porque o painel de lançamento aparece em vários
 * lugares (blocos de hoje, da semana, revisões, matérias) e passar os
 * lançamentos por props atravessaria todas as abas.
 */
const QuestionsContext = createContext<QuestionsApi | null>(null);

export const QuestionsProvider = QuestionsContext.Provider;

export function useQuestions(): QuestionsApi {
  const api = useContext(QuestionsContext);
  if (!api) throw new Error("useQuestions precisa estar dentro de <QuestionsProvider>.");
  return api;
}
