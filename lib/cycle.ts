import { addDays, fromIsoDate, toIsoDate, weekStartOf } from "./date";
import { blockKey, checkedBlocks } from "./progress";
import {
  advanceWeek,
  blockDate,
  dayInWeek,
  generateWeek,
  regenerateWeek,
  replanOverdue,
  sequenceIndex,
} from "./schedule";
import { daysBetween } from "./reviews";
import { BLOCKS_PER_DAY_OPTIONS, getSubject, SUBJECTS } from "./subjects";
import type { Pointers, ScheduledBlock, ScheduleSnapshot, Settings, StudyState, WeekSchedule } from "./types";

/** Limite da simulação: nenhum ciclo realista passa de dez anos. */
const MAX_SIMULATED_WEEKS = 520;

export interface CycleEnd {
  /** Dia do último bloco da volta, `yyyy-mm-dd`. */
  date: string;
  /** Volta que termina nessa data. */
  lap: number;
}

interface CycleSchedule {
  settings: Settings;
  pointers: Pointers;
  week: WeekSchedule | null;
}

/**
 * Previsão de fim do ciclo: o dia em que a última matéria do ciclo (peso > 0)
 * termina a volta em que está — a 1ª, enquanto alguma ainda não acabou.
 *
 * Segue o cronograma como está: a semana atual de hoje em diante, o que foi
 * empurrado para a seguinte e, depois, semanas simuladas com as mesmas funções
 * que geram as de verdade. Os atrasados ainda não replanejados contam como
 * feitos a tempo; quando passam de 3 dias de estudo, entram na fila e a
 * previsão anda.
 */
export function projectCycleEnd(
  cycle: CycleSchedule,
  checked: ReadonlySet<string>,
  today: string,
): CycleEnd | null {
  const { settings, pointers, week } = cycle;
  const active = SUBJECTS.filter((s) => (settings.weights[s.id] ?? 0) > 0);
  if (!week || active.length === 0 || settings.activeDays.length === 0) return null;

  // Voltas inteiras já distribuídas pela matéria mais atrasada.
  const laps = Math.min(...active.map((s) => Math.floor((pointers[s.id] ?? 0) / s.lessons.length)));
  const current = { settings, pointers, week };
  return (laps >= 1 && lapEnd(current, checked, today, laps)) || lapEnd(current, checked, today, laps + 1);
}

/** Dia em que a última aula da volta `lap` de cada matéria ativa acontece, ou `null` se já passou. */
function lapEnd(
  { settings, pointers, week }: CycleSchedule & { week: WeekSchedule },
  checked: ReadonlySet<string>,
  today: string,
  lap: number,
): CycleEnd | null {
  const target = new Map<string, number>();
  const pending = new Set<string>();
  for (const subject of SUBJECTS) {
    if ((settings.weights[subject.id] ?? 0) <= 0) continue;
    const last = lap * subject.lessons.length - 1;
    target.set(subject.id, last);
    // Ainda nem foi distribuída: precisa aparecer nas semanas simuladas.
    if (last >= (pointers[subject.id] ?? 0)) pending.add(subject.id);
  }

  // `as`: atribuído dentro de `visit`, que o TypeScript não acompanha.
  let end = null as string | null;
  const visit = (block: ScheduledBlock, date: string) => {
    if (target.get(block.subjectId) !== sequenceIndex(getSubject(block.subjectId), block)) return;
    if (!end || date > end) end = date;
    pending.delete(block.subjectId);
  };

  const todayDay = dayInWeek(week.weekStart, today);
  for (const day of week.days) {
    if (day.day < todayDay) continue;
    for (const block of day.blocks) {
      if (!checked.has(blockKey(week.weekStart, block))) visit(block, blockDate(week.weekStart, day.day));
    }
  }

  let weekStart = week.weekStart;
  let queued = week.spill;
  let nextPointers = pointers;
  for (let i = 0; i < MAX_SIMULATED_WEEKS && (pending.size > 0 || queued.length > 0); i++) {
    weekStart = toIsoDate(addDays(fromIsoDate(weekStart), 7));
    const next = generateWeek(settings, nextPointers, weekStart, { queued });
    for (const day of next.week.days) {
      for (const block of day.blocks) visit(block, blockDate(weekStart, day.day));
    }
    nextPointers = next.pointers;
    queued = next.week.spill;
  }

  return pending.size > 0 || !end ? null : { date: end, lap };
}

export interface ExamOutlook {
  examDate: string;
  /** Dias corridos até a prova (negativo depois dela). */
  daysLeft: number;
  end: CycleEnd | null;
  /** Dias de folga entre o fim do ciclo e a prova; negativo = termina depois. */
  marginDays: number | null;
  /**
   * Quando o ciclo não fecha a tempo: o menor número de blocos por dia com que
   * ele fecha, e a nova previsão. `null` se nem o máximo resolve.
   */
  suggestion: { blocksPerDay: number; end: string } | null;
}

/**
 * Compara a previsão de fim do ciclo com a data da prova. Se não fecha, testa
 * mais blocos por dia com a mesma função que regera a semana, para a sugestão
 * valer exatamente o que aconteceria ao trocar a configuração.
 */
export function examOutlook(
  cycle: CycleSchedule,
  checked: ReadonlySet<string>,
  today: string,
): ExamOutlook | null {
  const { settings, week } = cycle;
  if (!settings.examDate || !week) return null;
  const examDate = settings.examDate;

  const end = projectCycleEnd(cycle, checked, today);
  const marginDays = end ? daysBetween(end.date, examDate) : null;

  let suggestion: ExamOutlook["suggestion"] = null;
  if (marginDays === null || marginDays < 0) {
    for (const blocksPerDay of BLOCKS_PER_DAY_OPTIONS) {
      if (blocksPerDay <= settings.blocksPerDay) continue;
      const tried = regenerateWeek({ ...cycle, week }, { ...settings, blocksPerDay }, checked, today);
      const triedEnd = projectCycleEnd(tried, checked, today);
      if (triedEnd && triedEnd.date <= examDate) {
        suggestion = { blocksPerDay, end: triedEnd.date };
        break;
      }
    }
  }

  return { examDate, daysLeft: daysBetween(today, examDate), end, marginDays, suggestion };
}

/**
 * Põe os atrasados de volta na fila (`replanOverdue`) e anota a mudança na
 * previsão de fim do ciclo, para a aba Atrasadas avisar. Sem `all`, só os que
 * chegaram a 3 dias de estudo; com `all` (botão "Replanejar ciclo"), todos.
 *
 * Só reorganiza o cronograma: registros de estudo e blocos marcados não mudam,
 * então o progresso fica igual. Mesma função no servidor e no cliente.
 */
export function replanCycle(
  snapshot: ScheduleSnapshot,
  checked: ReadonlySet<string>,
  today: string,
  all = false,
): { snapshot: ScheduleSnapshot; moved: number } {
  const { settings, pointers, week } = snapshot;
  const replanned = replanOverdue(week, settings.activeDays, checked, today, { all });
  if (replanned.moved === 0) return { snapshot, moved: 0 };

  const before = projectCycleEnd(snapshot, checked, today);
  const after = projectCycleEnd({ settings, pointers, week: replanned.week }, checked, today);
  // Dois replanejamentos no mesmo dia viram um aviso só, do primeiro "antes" ao último "depois".
  const earlier = week.replan?.on === today ? week.replan : null;
  return {
    snapshot: {
      settings,
      pointers,
      week: {
        ...replanned.week,
        replan: {
          on: today,
          moved: (earlier?.moved ?? 0) + replanned.moved,
          endBefore: earlier ? earlier.endBefore : (before?.date ?? null),
          endAfter: after?.date ?? null,
        },
      },
    },
    moved: replanned.moved,
  };
}

/**
 * Deixa o ciclo em dia para `today`: abre a semana nova se ela virou e
 * replaneja o que passou de 3 dias de estudo de atraso. `changed` diz se há
 * algo a gravar. Roda no servidor, ao abrir o app e antes de mexer no ciclo.
 */
export function syncCycle(
  state: StudyState,
  today: string,
): { snapshot: ScheduleSnapshot; changed: boolean } {
  const checked = checkedBlocks(state.studyLogs);
  const { settings } = state;
  const weekStart = weekStartOf(today);

  let { pointers, week } = state;
  let changed = false;
  if (!week || week.weekStart !== weekStart) {
    ({ week, pointers } = advanceWeek(state, checked, weekStart));
    changed = true;
  }

  const replanned = replanCycle({ settings, pointers, week }, checked, today);
  return { snapshot: replanned.snapshot, changed: changed || replanned.moved > 0 };
}
