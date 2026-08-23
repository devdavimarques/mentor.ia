/** Ícone associado a uma matéria (resolvido para um componente em `components/subject-icon.tsx`). */
export type SubjectIconName =
  | "book"
  | "calculator"
  | "monitor"
  | "landmark"
  | "map"
  | "newspaper"
  | "scale"
  | "users"
  | "building"
  | "gavel"
  | "shield"
  | "pen";

export type SubjectGroup = "gerais" | "especificos" | "redacao";

export interface Subject {
  id: string;
  name: string;
  /** Sigla usada nos códigos de tópico, ex.: `LP-01`. */
  code: string;
  /** Relevância histórica na banca — define a fatia de blocos da matéria no ciclo. */
  weight: number;
  icon: SubjectIconName;
  group: SubjectGroup;
  topics: string[];
}

export interface ScheduledBlock {
  subjectId: string;
  topicIndex: number;
  /** Quantas vezes o ciclo já passou por toda a matéria (1 = primeira volta). */
  lap: number;
}

export interface ScheduledDay {
  /** Dia ISO da semana: 1 = segunda … 7 = domingo. */
  day: number;
  blocks: ScheduledBlock[];
}

export interface WeekSchedule {
  /** Segunda-feira da semana, no formato `yyyy-mm-dd`. */
  weekStart: string;
  days: ScheduledDay[];
}

export interface Settings {
  /** Dias ISO ativos (1–7). */
  activeDays: number[];
  blocksPerDay: number;
}

/** `subjectId` → quantidade de tópicos já distribuídos (acumulado entre voltas). */
export type Pointers = Record<string, number>;

/** `${subjectId}:${topicIndex}` → concluído. */
export type CompletedMap = Record<string, boolean>;

export interface StudyState {
  settings: Settings;
  pointers: Pointers;
  week: WeekSchedule | null;
  completed: CompletedMap;
}

export type TabId = "hoje" | "semana" | "materias" | "progresso" | "config";
