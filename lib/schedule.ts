import { dateOfWeekday, toIsoDate } from "./date";
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
 * serem feitos ou voltarem para a fila da matéria em `relayoutSubjects`.
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
 * Fila por matéria: cada matéria segue a ordem do curso e só anda quando a
 * aula é feita. As aulas ainda sem fazer da matéria — atrasadas (de dias que
 * passaram ou de outras semanas) e futuras — são recolocadas em ordem nos
 * lugares dela de hoje em diante (e no `spill`). A aula perdida vira o próximo
 * bloco da matéria; as seguintes andam uma posição; as outras matérias não mudam.
 *
 * O que não couber:
 * - aula atrasada fica onde está (aba Atrasadas) até a matéria ter um bloco
 *   livre — na semana seguinte, se for o caso;
 * - aula futura empurrada para fora é devolvida à matéria (o ponteiro volta),
 *   e entra de novo no próximo bloco dela que for gerado. `weightBase` volta
 *   junto, para o equilíbrio por peso continuar contando o bloco como entregue:
 *   senão a matéria atrasada ganharia mais blocos para "recuperar", tirando das
 *   outras. Se não for a última distribuída (caso raro), fica em `spill`.
 *
 * Blocos marcados não se movem. Roda no servidor ao abrir o app (`syncCycle`)
 * e ao trocar configurações; `moved` conta as atrasadas que voltaram à fila.
 */
export function relayoutSubjects(
  cycle: { settings: Settings; pointers: Pointers; week: WeekSchedule },
  checked: ReadonlySet<string>,
  today: string,
): { settings: Settings; pointers: Pointers; week: WeekSchedule; moved: number } {
  const { week } = cycle;
  const todayDay = dayInWeek(week.weekStart, today);
  const isOpen = (weekStart: string, block: ScheduledBlock) =>
    !checked.has(blockKey(weekStart, block));

  type Origin = { late: number } | { day: number; index: number; past: boolean } | { spill: number };
  type Slot = { day: number; index: number } | { spill: number };
  const pending = new Map<string, { block: ScheduledBlock; origin: Origin }[]>();
  const slots = new Map<string, Slot[]>();
  const add = <T>(map: Map<string, T[]>, key: string, value: T) => {
    const list = map.get(key);
    if (list) list.push(value);
    else map.set(key, [value]);
  };

  week.late.forEach((block, i) => {
    if (isOpen(block.weekStart, block)) add(pending, block.subjectId, { block, origin: { late: i } });
  });
  week.days.forEach((day, d) => {
    const past = day.day < todayDay;
    day.blocks.forEach((block, index) => {
      if (!isOpen(week.weekStart, block)) return;
      add(pending, block.subjectId, { block, origin: { day: d, index, past } });
      if (!past) add(slots, block.subjectId, { day: d, index });
    });
  });
  week.spill.forEach((block, i) => {
    add(pending, block.subjectId, { block, origin: { spill: i } });
    add(slots, block.subjectId, { spill: i });
  });

  const days: (ScheduledBlock | null)[][] = week.days.map((day) => [...day.blocks]);
  const spill: (ScheduledBlock | null)[] = [...week.spill];
  const lateKept = new Set(week.late.map((_b, i) => i));
  const pointers: Pointers = { ...cycle.pointers };
  const weightBase: Pointers = { ...cycle.settings.weightBase };
  const pushedOut: ScheduledBlock[] = [];
  let moved = 0;

  for (const [subjectId, entries] of pending) {
    const subject = getSubject(subjectId);
    const ordered = [...entries].sort(
      (a, b) => sequenceIndex(subject, a.block) - sequenceIndex(subject, b.block),
    );
    const subjectSlots = slots.get(subjectId) ?? [];

    // Atrasadas que entram: saem do lugar de origem.
    ordered.slice(0, subjectSlots.length).forEach(({ origin }) => {
      if ("late" in origin) lateKept.delete(origin.late);
      else if ("day" in origin && origin.past) days[origin.day][origin.index] = null;
    });

    subjectSlots.forEach((slot, k) => {
      const { block, origin } = ordered[k];
      const fromLate = "late" in origin;
      const wasLate = fromLate || ("day" in origin && origin.past);
      if (wasLate) moved++;
      const placed: ScheduledBlock = fromLate
        ? // De outra semana: já conta nos ponteiros de lá.
          {
            subjectId,
            lessonIndex: block.lessonIndex,
            lap: block.lap,
            carried: true,
            replanned: true,
          }
        : wasLate
          ? { ...block, replanned: true }
          : block;
      if ("spill" in slot) spill[slot.spill] = placed;
      else days[slot.day][slot.index] = placed;
    });

    // Futuras empurradas para fora, da última para a primeira: voltam à matéria.
    const leftover = ordered
      .slice(subjectSlots.length)
      .filter(({ origin }) => !("late" in origin) && !("day" in origin && origin.past))
      .map(({ block }) => block)
      .reverse();
    for (const block of leftover) {
      const pointer = pointers[subjectId] ?? 0;
      if (!block.carried && sequenceIndex(subject, block) === pointer - 1) {
        pointers[subjectId] = pointer - 1;
        weightBase[subjectId] = (weightBase[subjectId] ?? 0) - 1;
      } else {
        pushedOut.unshift(block);
      }
    }
  }

  return {
    settings: { ...cycle.settings, weightBase },
    pointers,
    week: {
      ...week,
      days: week.days.map((day, d) => ({
        ...day,
        blocks: days[d].filter((b): b is ScheduledBlock => b !== null),
      })),
      late: week.late.filter((_b, i) => lateKept.has(i)),
      spill: [...spill.filter((b): b is ScheduledBlock => b !== null), ...pushedOut],
    },
    moved,
  };
}

/**
 * Próxima aula de cada matéria: a menor posição na sequência entre as ainda
 * sem fazer (atrasadas, da semana e do `spill`). Uma aula só pode ser marcada
 * quando é a próxima da matéria.
 */
export function nextLessons(
  week: WeekSchedule | null,
  checked: ReadonlySet<string>,
): ReadonlyMap<string, number> {
  const next = new Map<string, number>();
  if (!week) return next;
  const consider = (weekStart: string, block: ScheduledBlock) => {
    if (checked.has(blockKey(weekStart, block))) return;
    const position = sequenceIndex(getSubject(block.subjectId), block);
    const current = next.get(block.subjectId);
    if (current === undefined || position < current) next.set(block.subjectId, position);
  };
  week.late.forEach((b) => consider(b.weekStart, b));
  week.days.forEach((day) => day.blocks.forEach((b) => consider(week.weekStart, b)));
  week.spill.forEach((b) => consider(week.weekStart, b));
  return next;
}

/** Um bloco atrasado, desta semana ou de outra, como a aba Hoje mostra. */
export interface OverdueBlock {
  block: ScheduledBlock;
  /** Semana que identifica o bloco (é a que vai no registro ao marcar). */
  weekStart: string;
  /** Dia em que estava programado. */
  dueOn: string;
}

/**
 * Blocos atrasados: os de dias anteriores desta semana e os de semanas
 * passadas que ainda esperam um bloco livre da matéria. `include` decide quais
 * dos marcados aparecem (a aba mantém os marcados hoje, para poder desfazer).
 */
export function overdueBlocks(
  week: WeekSchedule | null,
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
    .map(({ block, weekStart, day }) => ({ block, weekStart, dueOn: blockDate(weekStart, day) }));
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
  const relaid = relayoutSubjects({ settings, pointers: generated.pointers, week }, checked, today);
  return { settings: relaid.settings, pointers: relaid.pointers, week: relaid.week };
}
