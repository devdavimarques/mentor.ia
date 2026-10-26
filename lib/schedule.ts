import { dateOfWeekday, fromIsoDate, isoWeekday, toIsoDate } from "./date";
import { blockKey } from "./progress";
import { daysBetween } from "./reviews";
import { getSubject, SUBJECTS } from "./subjects";
import type {
  LateBlock,
  Pointers,
  ScheduledBlock,
  ScheduledDay,
  Settings,
  Subject,
  WeekSchedule,
} from "./types";

/** Dias de estudo de atraso a partir dos quais a aula volta para a fila. */
export const REPLAN_AFTER_STUDY_DAYS = 3;

interface SlotAllocation {
  id: string;
  count: number;
}

/**
 * Reparte `totalSlots` entre as matérias proporcionalmente ao peso, corrigindo
 * pelo histórico já entregue (`delivered`).
 *
 * Repartir cada semana isoladamente pelo método do maior resto distorce os
 * pesos e — pior — distorce sempre na mesma direção: com 18 blocos para 13
 * matérias quase todas ficam entre 1 e 2 blocos, e os blocos que sobram caem
 * toda semana nas mesmas matérias. O erro acumula em vez de se compensar.
 *
 * Aqui cada bloco vai para a matéria com o maior *déficit* em relação ao que
 * ela já deveria ter recebido desde que os pesos valem. Uma matéria que ficou
 * para trás numa semana entra na frente na seguinte, então a proporção
 * acumulada converge para os pesos.
 *
 * Matéria com peso 0 fica fora: pela conta do déficit ela ainda poderia ganhar
 * um bloco quando as outras ficassem negativas.
 */
function allocateSlots(
  subjects: readonly Subject[],
  weights: Readonly<Record<string, number>>,
  totalSlots: number,
  delivered: Pointers,
): SlotAllocation[] {
  const active = subjects.filter((s) => (weights[s.id] ?? 0) > 0);
  if (active.length === 0 || totalSlots <= 0) return [];

  const totalWeight = active.reduce((sum, s) => sum + weights[s.id], 0);
  const deliveredTotal = active.reduce((sum, s) => sum + (delivered[s.id] ?? 0), 0);
  const horizon = deliveredTotal + totalSlots;

  const allocations = active.map((s) => ({
    id: s.id,
    count: 0,
    // Quantos blocos faltam para a matéria alcançar sua fatia do total ao
    // fim desta semana. Negativo significa que ela já veio adiantada.
    deficit: (weights[s.id] / totalWeight) * horizon - (delivered[s.id] ?? 0),
  }));

  for (let slot = 0; slot < totalSlots; slot++) {
    let pick = allocations[0];
    // `>` estrito: empates ficam com a matéria que vem antes no edital, e o
    // déficit negativo resultante passa a vez na próxima disputa.
    for (const entry of allocations) {
      if (entry.deficit > pick.deficit) pick = entry;
    }
    pick.count += 1;
    pick.deficit -= 1;
  }

  return allocations.map(({ id, count }) => ({ id, count }));
}

/**
 * Espalha os blocos de cada matéria ao longo da semana em vez de agrupá-los,
 * posicionando a i-ésima ocorrência perto de `i * totalSlots / count` e
 * empurrando para frente quando a posição já estiver ocupada.
 */
function spreadSlots(allocations: SlotAllocation[], totalSlots: number): (string | null)[] {
  const result: (string | null)[] = new Array(totalSlots).fill(null);
  // Matérias com mais blocos escolhem primeiro: as menores preenchem as folgas.
  const sorted = [...allocations].sort((a, b) => b.count - a.count);

  for (const { id, count } of sorted) {
    if (count <= 0) continue;
    for (let i = 0; i < count; i++) {
      let pos = Math.min(Math.round((i * totalSlots) / count), totalSlots - 1);
      while (result[pos] !== null) pos = (pos + 1) % totalSlots;
      result[pos] = id;
    }
  }

  return result;
}

/** Posição da aula na sequência da matéria, contando as voltas: o ponteiro que a gerou. */
export function sequenceIndex(subject: Subject, block: ScheduledBlock): number {
  return (block.lap - 1) * subject.lessons.length + block.lessonIndex;
}

function blockAt(subject: Subject, pointer: number): ScheduledBlock {
  return {
    subjectId: subject.id,
    lessonIndex: pointer % subject.lessons.length,
    lap: Math.floor(pointer / subject.lessons.length) + 1,
  };
}

/** Data `yyyy-mm-dd` de um dia ISO da semana. */
export function blockDate(weekStart: string, day: number): string {
  return toIsoDate(dateOfWeekday(weekStart, day));
}

/** Dia ISO de `date` na semana que começa em `weekStart` (8 ou mais = semana já passou). */
export function dayInWeek(weekStart: string, date: string): number {
  return daysBetween(weekStart, date) + 1;
}

/**
 * Quantos dias de estudo uma aula programada para `due` já ficou para trás em
 * `today`: os dias ativos depois de `due`, até hoje inclusive. Folga não conta
 * — aula perdida no sábado, com domingo livre, chega a 3 na quarta.
 */
export function studyDaysLate(due: string, today: string, activeDays: readonly number[]): number {
  const span = daysBetween(due, today);
  const dueDay = isoWeekday(fromIsoDate(due));
  let count = 0;
  for (let offset = 1; offset <= span; offset++) {
    if (activeDays.includes(((dueDay - 1 + offset) % 7) + 1)) count++;
  }
  return count;
}

/** Segunda-feira de referência: as semanas de simulado são contadas a partir dela. */
const MOCK_ANCHOR_WEEK = "2024-01-01";

/**
 * Dia ISO do simulado na semana, ou `null` se a semana não tem simulado. Nas
 * semanas de simulado esse dia fica sem blocos do ciclo.
 */
export function mockDayOfWeek(settings: Settings, weekStart: string): number | null {
  const every = settings.mockEveryWeeks;
  if (every <= 0) return null;
  if (Math.round(daysBetween(MOCK_ANCHOR_WEEK, weekStart) / 7) % every !== 0) return null;
  return settings.mockDay;
}

/**
 * Distribui `count` aulas novas pelo peso (`allocateSlots` + `spreadSlots`),
 * na ordem em que entram no cronograma, e devolve os ponteiros já avançados.
 */
function issueBlocks(
  settings: Settings,
  pointers: Pointers,
  count: number,
): { blocks: ScheduledBlock[]; pointers: Pointers } {
  // O equilíbrio conta só o que foi entregue desde a última troca de pesos.
  const delivered: Pointers = {};
  for (const subject of SUBJECTS) {
    const since = (pointers[subject.id] ?? 0) - (settings.weightBase[subject.id] ?? 0);
    delivered[subject.id] = Math.max(0, since);
  }

  const assignment = spreadSlots(
    allocateSlots(SUBJECTS, settings.weights, count, delivered),
    count,
  );

  const nextPointers: Pointers = { ...pointers };
  const blocks: ScheduledBlock[] = [];
  for (const subjectId of assignment) {
    if (!subjectId) continue;
    const pointer = nextPointers[subjectId] ?? 0;
    blocks.push(blockAt(getSubject(subjectId), pointer));
    nextPointers[subjectId] = pointer + 1;
  }
  return { blocks, pointers: nextPointers };
}

export interface GeneratedWeek {
  week: WeekSchedule;
  pointers: Pointers;
}

export interface GenerateOptions {
  /**
   * Blocos que já existem e ocupam os primeiros lugares, na ordem: o que
   * sobrou da semana anterior, ou o que fica ao regerar a semana atual. O que
   * não couber vai para `spill`.
   */
  queued?: readonly ScheduledBlock[];
  /** Primeiro dia ISO a preencher. Os dias ativos antes dele ficam de fora. */
  fromDay?: number;
}

/**
 * Monta o cronograma da semana a partir das configurações e dos ponteiros de
 * cada matéria (quantos blocos já foram entregues a ela). Os ponteiros servem
 * a dois propósitos: apontam a próxima aula — virando para a 2ª, 3ª… volta
 * quando a lista acaba — e são o histórico que equilibra a distribuição por
 * peso ao longo das semanas.
 *
 * Os blocos de `queued` entram primeiro; os lugares que sobram recebem aulas
 * novas, repartidas pelo peso.
 *
 * Em semana de simulado, o dia dele entra sem blocos (mesmo que não seja dia
 * de estudo), e as aulas ficam nos outros dias.
 */
export function generateWeek(
  settings: Settings,
  pointers: Pointers,
  weekStart: string,
  { queued = [], fromDay = 1 }: GenerateOptions = {},
): GeneratedWeek {
  const mockDay = mockDayOfWeek(settings, weekStart);
  const studyDays = settings.activeDays
    .filter((d) => d >= fromDay && d !== mockDay)
    .sort((a, b) => a - b);
  const { blocksPerDay } = settings;
  const totalSlots = studyDays.length * blocksPerDay;
  const placed = queued.slice(0, totalSlots);
  const issued = issueBlocks(settings, pointers, totalSlots - placed.length);
  const sequence = [...placed, ...issued.blocks];

  const days: ScheduledDay[] = studyDays.map((day, i) => ({
    day,
    blocks: sequence.slice(i * blocksPerDay, (i + 1) * blocksPerDay),
  }));
  if (mockDay !== null && mockDay >= fromDay) {
    days.push({ day: mockDay, blocks: [] });
    days.sort((a, b) => a.day - b.day);
  }

  return {
    week: { weekStart, days, spill: queued.slice(totalSlots), late: [], replan: null },
    pointers: issued.pointers,
  };
}

/**
 * "Adiantar um bloco": traz o próximo bloco da fila para hoje. Os blocos não
 * marcados dos dias seguintes recuam uma posição, o primeiro de `spill` (ou
 * uma aula nova, pelo peso) ocupa o último lugar, e o fim do ciclo chega um
 * bloco mais cedo. Serve ao dia de simulado, que não tem blocos próprios.
 */
export function advanceBlock(
  cycle: { settings: Settings; pointers: Pointers; week: WeekSchedule },
  checked: ReadonlySet<string>,
  today: string,
): { pointers: Pointers; week: WeekSchedule } {
  const { settings, week } = cycle;
  const todayDay = dayInWeek(week.weekStart, today);
  let pointers = cycle.pointers;
  const spill = [...week.spill];

  const nextFromQueue = (): ScheduledBlock | null => {
    const fromSpill = spill.shift();
    if (fromSpill) return fromSpill;
    const issued = issueBlocks(settings, pointers, 1);
    pointers = issued.pointers;
    return issued.blocks[0] ?? null;
  };

  // Os lugares ainda livres (não marcados) depois de hoje, na ordem.
  const days = week.days.map((day) => ({ ...day, blocks: [...day.blocks] }));
  const slots: [day: number, index: number][] = [];
  days.forEach((day, d) => {
    if (day.day <= todayDay) return;
    day.blocks.forEach((block, i) => {
      if (!checked.has(blockKey(week.weekStart, block))) slots.push([d, i]);
    });
  });

  let moved: ScheduledBlock | null;
  if (slots.length > 0) {
    const sequence = slots.map(([d, i]) => days[d].blocks[i]);
    moved = sequence[0];
    const refill = nextFromQueue();
    const shifted = refill ? [...sequence.slice(1), refill] : sequence.slice(1);
    slots.forEach(([d, i], position) => {
      days[d].blocks[i] = shifted[position];
    });
    // Sem nada para repor (nenhuma matéria no ciclo), o último lugar fica vazio.
    for (const day of days) day.blocks = day.blocks.filter(Boolean);
  } else {
    moved = nextFromQueue();
  }
  if (!moved) return { pointers: cycle.pointers, week };

  const todayEntry = days.find((d) => d.day === todayDay);
  if (todayEntry) todayEntry.blocks.push(moved);
  else days.push({ day: todayDay, blocks: [moved] });
  days.sort((a, b) => a.day - b.day);

  return { pointers, week: { ...week, days, spill } };
}

interface CycleSchedule {
  settings: Settings;
  pointers: Pointers;
  week: WeekSchedule | null;
}

/**
 * Abre a semana `weekStart` depois da semana guardada. Nada do que ficou sem
 * fazer some: o que foi empurrado para além do fim dela (`spill`) abre a nova
 * semana, e os blocos que ficaram sem marcar viram atrasados (`late`) até
 * serem feitos ou voltarem para a fila em `replanOverdue`.
 */
export function advanceWeek(
  previous: CycleSchedule,
  checked: ReadonlySet<string>,
  weekStart: string,
): GeneratedWeek {
  const old = previous.week;
  const open = (ws: string, block: ScheduledBlock) => !checked.has(blockKey(ws, block));

  const late: LateBlock[] = old
    ? [
        ...old.late.filter((b) => open(b.weekStart, b)),
        ...old.days.flatMap((day) =>
          day.blocks
            .filter((b) => open(old.weekStart, b))
            .map((b) => ({ ...b, weekStart: old.weekStart, day: day.day })),
        ),
      ]
    : [];
  const queued = (old?.spill ?? []).map((b) => ({ ...b, carried: true }));

  const { week, pointers } = generateWeek(previous.settings, previous.pointers, weekStart, {
    queued,
  });
  return { week: { ...week, late }, pointers };
}

/**
 * Replanejamento automático: aula sem fazer há `REPLAN_AFTER_STUDY_DAYS` dias
 * de estudo sai do dia em que estava e vira o primeiro bloco livre de hoje (ou
 * do próximo dia de estudo). Tudo o que vinha depois anda uma posição, e o que
 * passar do fim da semana vai para `spill`, abrindo a seguinte — o fim do
 * ciclo atrasa um bloco por aula replanejada.
 *
 * Blocos já marcados não se movem. A aula replanejada que ficar de novo 3 dias
 * sem fazer volta outra vez para a fila: ela nunca sai até ser concluída.
 *
 * `all` (botão "Replanejar ciclo") leva todos os atrasados, sem esperar os 3 dias.
 */
export function replanOverdue(
  week: WeekSchedule,
  activeDays: readonly number[],
  checked: ReadonlySet<string>,
  today: string,
  { all = false }: { all?: boolean } = {},
): { week: WeekSchedule; moved: number } {
  const todayDay = dayInWeek(week.weekStart, today);
  const isDue = (weekStart: string, day: number, block: ScheduledBlock) =>
    !checked.has(blockKey(weekStart, block)) &&
    (all ||
      studyDaysLate(blockDate(weekStart, day), today, activeDays) >= REPLAN_AFTER_STUDY_DAYS);

  // Do mais antigo para o mais novo: atrasados de outras semanas, depois desta.
  const due: ScheduledBlock[] = [];
  const late = week.late.filter((b) => {
    if (!isDue(b.weekStart, b.day, b)) return true;
    // Veio de outra semana: já conta nos ponteiros de lá.
    due.push({
      subjectId: b.subjectId,
      lessonIndex: b.lessonIndex,
      lap: b.lap,
      carried: true,
      replanned: true,
    });
    return false;
  });
  const days = week.days.map((day) =>
    day.day >= todayDay
      ? day
      : {
          ...day,
          blocks: day.blocks.filter((b) => {
            if (!isDue(week.weekStart, day.day, b)) return true;
            due.push({ ...b, replanned: true });
            return false;
          }),
        },
  );

  if (due.length === 0) return { week, moved: 0 };

  // Os lugares ainda livres (não marcados) de hoje em diante, na ordem.
  const slots: [day: number, index: number][] = [];
  const queue: ScheduledBlock[] = [];
  days.forEach((day, d) => {
    if (day.day < todayDay) return;
    day.blocks.forEach((block, i) => {
      if (checked.has(blockKey(week.weekStart, block))) return;
      slots.push([d, i]);
      queue.push(block);
    });
  });

  const sequence = [...due, ...queue];
  const nextDays = days.map((day) => ({ ...day, blocks: [...day.blocks] }));
  slots.forEach(([d, i], position) => {
    nextDays[d].blocks[i] = sequence[position];
  });

  return {
    week: {
      ...week,
      days: nextDays,
      late,
      spill: [...sequence.slice(slots.length), ...week.spill],
    },
    moved: due.length,
  };
}

/** Um bloco atrasado, desta semana ou de outra, como a aba Hoje mostra. */
export interface OverdueBlock {
  block: ScheduledBlock;
  /** Semana que identifica o bloco (é a que vai no registro ao marcar). */
  weekStart: string;
  /** Dia em que estava programado. */
  dueOn: string;
  /** Dias de estudo de atraso. */
  late: number;
}

/**
 * Blocos atrasados: os de dias anteriores desta semana e os de semanas
 * passadas que ainda não voltaram para a fila. `include` decide quais dos
 * marcados aparecem (a aba Hoje mantém os marcados hoje, para poder desfazer).
 */
export function overdueBlocks(
  week: WeekSchedule | null,
  activeDays: readonly number[],
  today: string,
  include: (key: string) => boolean,
): OverdueBlock[] {
  if (!week) return [];
  const todayDay = dayInWeek(week.weekStart, today);

  return [
    ...week.late.map((b) => ({ block: b, weekStart: b.weekStart, day: b.day })),
    ...week.days
      .filter((day) => day.day < todayDay)
      .flatMap((day) => day.blocks.map((b) => ({ block: b, weekStart: week.weekStart, day: day.day }))),
  ]
    .filter(({ block, weekStart }) => include(blockKey(weekStart, block)))
    .map(({ block, weekStart, day }) => {
      const dueOn = blockDate(weekStart, day);
      return { block, weekStart, dueOn, late: studyDaysLate(dueOn, today, activeDays) };
    });
}

function sameWeights(a: Readonly<Record<string, number>>, b: Readonly<Record<string, number>>) {
  return SUBJECTS.every((s) => (a[s.id] ?? 0) === (b[s.id] ?? 0));
}

/**
 * Aplica novas configurações à semana atual, de hoje em diante. Os dias que
 * já passaram ficam como estão — o que neles ficou sem fazer continua
 * atrasado. Se os pesos mudaram, o equilíbrio recomeça daqui (`weightBase`).
 *
 * As aulas ainda sem fazer no fim da sequência de cada matéria voltam para
 * ela e são distribuídas de novo com as novas configurações; o resto (blocos
 * marcados, trazidos de outra semana ou replanejados no meio da sequência)
 * fica na fila, na ordem. Repetir a mesma troca chega ao mesmo cronograma.
 *
 * É a mesma função no servidor (que grava) e no cliente (que mostra na hora),
 * então os dois chegam ao mesmo cronograma. `weightBase` vem sempre do estado
 * anterior, nunca do que o navegador mandou.
 */
export function regenerateWeek(
  previous: CycleSchedule & { week: WeekSchedule },
  requested: Settings,
  checked: ReadonlySet<string>,
  today: string,
): { settings: Settings; pointers: Pointers; week: WeekSchedule } {
  const old = previous.week;
  const fromDay = Math.max(1, dayInWeek(old.weekStart, today));
  const pool = [
    ...old.days.filter((d) => d.day >= fromDay).flatMap((d) => d.blocks),
    ...old.spill,
  ];

  const base: Pointers = { ...previous.pointers };
  for (const subject of SUBJECTS) {
    for (;;) {
      const pointer = base[subject.id] ?? 0;
      const i = pool.findIndex(
        (b) =>
          b.subjectId === subject.id &&
          !b.carried &&
          sequenceIndex(subject, b) === pointer - 1 &&
          !checked.has(blockKey(old.weekStart, b)),
      );
      if (pointer === 0 || i < 0) break;
      pool.splice(i, 1);
      base[subject.id] = pointer - 1;
    }
  }

  const weightBase = sameWeights(previous.settings.weights, requested.weights)
    ? previous.settings.weightBase
    : base;
  const settings: Settings = { ...requested, weightBase };
  const generated = generateWeek(settings, base, old.weekStart, { queued: pool, fromDay });

  const week: WeekSchedule = {
    ...old,
    days: [...old.days.filter((d) => d.day < fromDay), ...generated.week.days],
    spill: generated.week.spill,
  };
  return {
    settings,
    pointers: generated.pointers,
    week: replanOverdue(week, settings.activeDays, checked, today).week,
  };
}
