"use client";

import { createContext, useContext } from "react";

/**
 * Próxima aula de cada matéria (`subjectId` → posição na sequência). O cartão
 * de um bloco só deixa marcar a aula que é a próxima da matéria: a matéria
 * segue a ordem do curso e só anda quando a aula anterior é feita.
 */
const LessonOrderContext = createContext<ReadonlyMap<string, number>>(new Map());

export const LessonOrderProvider = LessonOrderContext.Provider;

export function useNextLessons(): ReadonlyMap<string, number> {
  return useContext(LessonOrderContext);
}
