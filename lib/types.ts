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
  /** Blocos de teoria (aulas) por dia. Sai das horas (lib/day-plan.ts); não se edita direto. */
  blocksPerDay: number;
  /** Horas de estudo por dia, em minutos: teoria + revisão. */
  studyMinutes: number;
  /** Parte do dia para teoria; o resto é revisão. */
  theoryMinutes: number;
  /** Duração de um bloco (de teoria ou de revisão). */
  blockMinutes: number;
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
  /** Meta de acerto nos simulados, `subjectId` → % (1–100). Matéria sem meta fica de fora. */
  mockTargets: Record<string, number>;
  /** Flashcards: cartões novos e revisões por dia, no máximo (limites do Anki). */
  flashcardNewPerDay: number;
  flashcardReviewsPerDay: number;
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

/** 1ª a 4ª revisão de um tópico (2, 7, 14 e 21 dias depois do estudo). */
export type ReviewStage = 1 | 2 | 3 | 4;

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
  /** Nome livre, ex.: "Simulado 01". */
  title: string | null;
  takenOn: string;
  /** Valor de cada questão, igual para todas (ex.: 1,25 numa prova de 80 questões e 100 pontos). */
  pointsPerQuestion: number;
  /** `subjectId` → resultado. Só matérias com questões feitas. */
  results: Record<string, MockResult>;
}

/** Estado do cartão no agendador (lib/flashcards.ts), como no Anki. */
export type FlashcardState = "new" | "learning" | "review" | "relearning";

/** Um flashcard e o agendamento da repetição espaçada (lib/flashcards.ts). */
export interface Flashcard {
  id: string;
  subjectId: string;
  /** Tópico do edital, opcional. */
  topicIndex: number | null;
  front: string;
  back: string;
  state: FlashcardState;
  /** Etapa atual do aprendizado (índice em LEARN_STEPS ou RELEARN_STEPS). */
  step: number;
  /** Hora em que volta, nas etapas em minutos (ISO); `null` em revisão e novo. */
  dueAt: string | null;
  /** Dia em que volta para revisão, `yyyy-mm-dd`. */
  dueOn: string;
  intervalDays: number;
  ease: number;
  /** Respostas dadas no total. */
  reps: number;
  /** Erros em revisão (lapsos). */
  lapses: number;
  /** Fora das sessões até ser reativado (à mão ou por virar sanguessuga). */
  suspended: boolean;
  /** Dia em que foi estudado pela primeira vez (conta no limite de novos). */
  introducedOn: string | null;
  lastReviewedOn: string | null;
}

/** Um período de estudo cronometrado (ou lançado à mão). */
export interface StudySession {
  id: string;
  subjectId: string;
  /** Aula estudada, quando o cronômetro foi ligado num bloco. */
  lessonIndex: number | null;
  minutes: number;
  studiedOn: string;
}

/** Link de cada aula (`subjectId:lessonIndex` → URL), o mesmo para todos os perfis. */
export type LessonLinks = Record<string, string>;

export interface StudyState {
  settings: Settings;
  pointers: Pointers;
  week: WeekSchedule | null;
  studyLogs: StudyLog[];
  reviewLogs: ReviewLog[];
  questionLogs: QuestionLog[];
  mockExams: MockExam[];
  flashcards: Flashcard[];
  studySessions: StudySession[];
  lessonLinks: LessonLinks;
}

export type TabId =
  | "hoje"
  | "semana"
  | "atrasadas"
  | "materias"
  | "simulados"
  | "flashcards"
  | "progresso"
  | "config";

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
