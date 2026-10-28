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
  /** Peso padrão (0–10) — a fatia de blocos da matéria no ciclo. O usuário pode trocar. */
  weight: number;
  /** Questões da matéria na última prova (Soldado PM-BA, FCC, jan/2023). */
  examQuestions: number;
  /** Tópicos (índices em `topics`) que mais caem, pelo histórico de provas. */
  hotTopics: readonly number[];
  icon: SubjectIconName;
  group: SubjectGroup;
  /** Itens do edital. O progresso é medido aqui. */
  topics: readonly string[];
  /** Aulas do curso, na ordem em que são dadas. O ciclo anda de aula em aula. */
  lessons: readonly Lesson[];
}

/** Uma aula do curso (uma linha da planilha de gravação). */
export interface Lesson {
  /** Índices em `Subject.topics` que a aula cobre. O primeiro é o principal. */
  topics: readonly number[];
  title: string;
  /** Vazio quando a planilha não tem subtítulo. */
  subtitle: string;
  /** `false` para aula prevista na planilha e ainda não gravada. */
  recorded: boolean;
  /** Não é aula do curso: bloco de estudo de um tópico que não tem aula na planilha. */
  selfStudy?: boolean;
}

export interface ScheduledBlock {
  subjectId: string;
  /** Índice em `Subject.lessons`. */
  lessonIndex: number;
  /** Quantas vezes o ciclo já passou por toda a matéria (1 = primeira volta). */
  lap: number;
  /**
   * Distribuído numa semana anterior e trazido para esta (sobrou no fim da
   * outra, ou estava atrasado). Já conta nos ponteiros de lá, então regerar
   * esta semana não o devolve à matéria.
   */
  carried?: boolean;
  /** Mudou de dia porque ficou sem fazer: foi para o próximo bloco da matéria. */
  replanned?: boolean;
}

/** Bloco de uma semana anterior que ficou sem fazer e ainda não foi replanejado. */
export interface LateBlock extends ScheduledBlock {
  /** Semana e dia em que estava programado — e a semana que identifica o bloco. */
  weekStart: string;
  day: number;
}

/** Último replanejamento automático, para avisar na aba Hoje. */
export interface ReplanNote {
  /** Dia em que aconteceu, `yyyy-mm-dd`. */
  on: string;
  /** Aulas atrasadas que voltaram para a fila. */
  moved: number;
  /** Previsão de fim do ciclo antes e depois. */
  endBefore: string | null;
  endAfter: string | null;
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
  /** Blocos empurrados para depois do fim da semana: abrem a semana seguinte. */
  spill: ScheduledBlock[];
  /** Blocos de semanas anteriores ainda sem fazer e com menos de 3 dias de atraso. */
  late: LateBlock[];
  replan: ReplanNote | null;
}

export interface Settings {
  /** Dias ISO ativos (1–7). */
  activeDays: number[];
  blocksPerDay: number;
  /** `subjectId` → peso escolhido (0–10). Sempre completo; 0 tira a matéria do ciclo. */
  weights: Record<string, number>;
  /**
   * Ponteiros no momento em que os pesos mudaram pela última vez. O equilíbrio
   * por peso conta só o que foi entregue depois disso — senão aumentar um peso
   * faria a matéria "recuperar" meses de atraso numa semana só.
   */
  /**
   * Também desconta as aulas devolvidas à matéria na fila por matéria, para o
   * equilíbrio continuar contando o bloco como entregue (pode ficar negativo).
   */
  weightBase: Pointers;
  /** Data provável da prova, `yyyy-mm-dd`, ou `null` se não definida. */
  examDate: string | null;
  /** Simulado a cada N semanas; 0 = desligado. */
  mockEveryWeeks: number;
  /** Dia ISO do simulado (1 = segunda). Nas semanas de simulado, fica sem blocos. */
  mockDay: number;
}

/** `subjectId` → quantidade de aulas já distribuídas (acumulado entre voltas). */
export type Pointers = Record<string, number>;

/**
 * Um estudo num dia. Ou uma aula (marcação de um bloco do ciclo), ou um
 * tópico inteiro marcado à mão na aba Matérias, para o que foi estudado fora
 * do ciclo. O progresso dos tópicos sai dos dois.
 */
export type StudyLog =
  | {
      kind: "lesson";
      subjectId: string;
      lessonIndex: number;
      /** Dia em que foi estudado, `yyyy-mm-dd`. */
      studiedOn: string;
      /** Bloco do cronograma marcado. */
      block: { weekStart: string; lap: number } | null;
    }
  | {
      kind: "topic";
      subjectId: string;
      topicIndex: number;
      studiedOn: string;
    };

/** Identifica um bloco: numa semana, matéria + aula + volta não se repetem. */
export interface BlockRef {
  weekStart: string;
  subjectId: string;
  lessonIndex: number;
  lap: number;
}

/** 1ª, 2ª ou 3ª revisão de um tópico. */
export type ReviewStage = 1 | 2 | 3;

export interface ReviewLog {
  subjectId: string;
  topicIndex: number;
  stage: ReviewStage;
  doneOn: string;
}

/** Um lançamento de questões resolvidas sobre um tópico. */
export interface QuestionLog {
  id: string;
  subjectId: string;
  topicIndex: number;
  answered: number;
  correct: number;
  loggedOn: string;
}

/** Questões de uma matéria num simulado. */
export interface MockResult {
  answered: number;
  correct: number;
}

/** Um simulado feito: o resultado de cada matéria objetiva. */
export interface MockExam {
  id: string;
  takenOn: string;
  /** `subjectId` → resultado. Só matérias com questões feitas. */
  results: Record<string, MockResult>;
}

export interface StudyState {
  settings: Settings;
  pointers: Pointers;
  week: WeekSchedule | null;
  studyLogs: StudyLog[];
  reviewLogs: ReviewLog[];
  questionLogs: QuestionLog[];
  mockExams: MockExam[];
}

export type TabId = "hoje" | "semana" | "atrasadas" | "materias" | "progresso" | "config";

/** Pessoa que usa o app. Criada por `npm run db:seed`, sem cadastro público. */
export interface Profile {
  id: string;
  name: string;
}

/** Perfil na tela de entrada: só se tem senha, nunca o hash. */
export interface ProfileOption extends Profile {
  hasPassword: boolean;
}

/** O que a geração de uma semana produz e o que é persistido junto. */
export interface ScheduleSnapshot {
  settings: Settings;
  pointers: Pointers;
  week: WeekSchedule;
}
