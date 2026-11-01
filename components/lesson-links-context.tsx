"use client";

import { createContext, useContext } from "react";

import type { LessonLinks } from "@/lib/types";

export interface LessonLinksApi {
  links: LessonLinks;
  /** Grava o link da aula; vazio apaga. */
  set: (subjectId: string, lessonIndex: number, url: string | null) => void;
}

/**
 * Links das aulas num contexto, como as questões: o link aparece nos blocos
 * de várias abas e é editado na aba Matérias.
 */
const LessonLinksContext = createContext<LessonLinksApi>({ links: {}, set: () => {} });

export const LessonLinksProvider = LessonLinksContext.Provider;

export function useLessonLinks(): LessonLinksApi {
  return useContext(LessonLinksContext);
}
