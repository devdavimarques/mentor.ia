import { getSubject, SUBJECTS } from "./subjects";
import type { Pointers, ScheduledDay, Settings, Subject, WeekSchedule } from "./types";

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
 * Remove a contribuição de uma semana dos ponteiros, recuperando o estado
 * imediatamente anterior à sua geração.
 *
 * Usado ao regerar a semana atual (troca de dias ou de blocos por dia): sem
 * isso a semana descartada continuaria contando como entregue, os ponteiros
 * saltariam e o usuário pularia aulas que nunca viu.
 */
export function pointersBeforeWeek(pointers: Pointers, week: WeekSchedule | null): Pointers {
  const base: Pointers = { ...pointers };
  if (!week) return base;

  for (const day of week.days) {
    for (const block of day.blocks) {
      base[block.subjectId] = Math.max(0, (base[block.subjectId] ?? 0) - 1);
    }
  }
  return base;
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

export interface GeneratedWeek {
  week: WeekSchedule;
  pointers: Pointers;
}

/**
 * Monta o cronograma da semana a partir das configurações e dos ponteiros de
 * cada matéria (quantos blocos já foram entregues a ela). Os ponteiros servem
 * a dois propósitos: apontam a próxima aula — virando para a 2ª, 3ª… volta
 * quando a lista acaba — e são o histórico que equilibra a distribuição por
 * peso ao longo das semanas.
 *
 * Ao regerar a semana atual, passe `pointersBeforeWeek(pointers, week)` em vez
 * dos ponteiros correntes.
 */
export function generateWeek(
  settings: Settings,
  pointers: Pointers,
  weekStart: string,
): GeneratedWeek {
  const activeDays = [...settings.activeDays].sort((a, b) => a - b);
  const { blocksPerDay } = settings;
  const totalSlots = activeDays.length * blocksPerDay;

  if (totalSlots <= 0) {
    return { week: { weekStart, days: [] }, pointers: { ...pointers } };
  }

  // O equilíbrio conta só o que foi entregue desde a última troca de pesos.
  const delivered: Pointers = {};
  for (const subject of SUBJECTS) {
    const since = (pointers[subject.id] ?? 0) - (settings.weightBase[subject.id] ?? 0);
    delivered[subject.id] = Math.max(0, since);
  }

  const assignment = spreadSlots(
    allocateSlots(SUBJECTS, settings.weights, totalSlots, delivered),
    totalSlots,
  );

  const nextPointers: Pointers = { ...pointers };
  const days: ScheduledDay[] = activeDays.map((day) => ({ day, blocks: [] }));

  assignment.forEach((subjectId, index) => {
    if (!subjectId) return;
    const subject = getSubject(subjectId);
    const pointer = nextPointers[subjectId] ?? 0;

    days[Math.floor(index / blocksPerDay)].blocks.push({
      subjectId,
      lessonIndex: pointer % subject.lessons.length,
      lap: Math.floor(pointer / subject.lessons.length) + 1,
    });

    nextPointers[subjectId] = pointer + 1;
  });

  return { week: { weekStart, days }, pointers: nextPointers };
}

function sameWeights(a: Readonly<Record<string, number>>, b: Readonly<Record<string, number>>) {
  return SUBJECTS.every((s) => (a[s.id] ?? 0) === (b[s.id] ?? 0));
}

/**
 * Aplica novas configurações à semana atual: descarta o cronograma dela e gera
 * outro. Se os pesos mudaram, o equilíbrio recomeça daqui (`weightBase`).
 *
 * É a mesma função no servidor (que grava) e no cliente (que mostra na hora),
 * então os dois chegam ao mesmo cronograma. `weightBase` vem sempre do estado
 * anterior, nunca do que o navegador mandou.
 */
export function regenerateWeek(
  previous: { settings: Settings; pointers: Pointers; week: WeekSchedule | null },
  requested: Settings,
  weekStart: string,
): { settings: Settings; pointers: Pointers; week: WeekSchedule } {
  const base = pointersBeforeWeek(previous.pointers, previous.week);
  const weightBase = sameWeights(previous.settings.weights, requested.weights)
    ? previous.settings.weightBase
    : base;
  const settings: Settings = { ...requested, weightBase };
  const { week, pointers } = generateWeek(settings, base, weekStart);
  return { settings, pointers, week };
}
