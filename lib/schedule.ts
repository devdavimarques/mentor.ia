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
 * ela já deveria ter recebido desde o início. Uma matéria que ficou para trás
 * numa semana entra na frente na seguinte, então a proporção acumulada
 * converge para os pesos do edital.
 */
function allocateSlots(
  subjects: readonly Subject[],
  totalSlots: number,
  delivered: Pointers,
): SlotAllocation[] {
  if (subjects.length === 0 || totalSlots <= 0) return [];

  const totalWeight = subjects.reduce((sum, s) => sum + s.weight, 0);
  if (totalWeight <= 0) return subjects.map((s) => ({ id: s.id, count: 0 }));

  const deliveredTotal = subjects.reduce((sum, s) => sum + (delivered[s.id] ?? 0), 0);
  const horizon = deliveredTotal + totalSlots;

  const allocations = subjects.map((s) => ({
    id: s.id,
    count: 0,
    // Quantos blocos faltam para a matéria alcançar sua fatia do total ao
    // fim desta semana. Negativo significa que ela já veio adiantada.
    deficit: (s.weight / totalWeight) * horizon - (delivered[s.id] ?? 0),
  }));

  for (let slot = 0; slot < totalSlots; slot++) {
    let pick = allocations[0];
    // `>` estrito: empates ficam com a matéria de maior peso (ordem do edital),
    // e o déficit negativo resultante passa a vez na próxima disputa.
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
 * saltariam e o usuário pularia tópicos que nunca viu.
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
 * a dois propósitos: apontam o próximo tópico — virando para a 2ª, 3ª… volta
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

  const assignment = spreadSlots(allocateSlots(SUBJECTS, totalSlots, pointers), totalSlots);

  const nextPointers: Pointers = { ...pointers };
  const days: ScheduledDay[] = activeDays.map((day) => ({ day, blocks: [] }));

  assignment.forEach((subjectId, index) => {
    if (!subjectId) return;
    const subject = getSubject(subjectId);
    const pointer = nextPointers[subjectId] ?? 0;

    days[Math.floor(index / blocksPerDay)].blocks.push({
      subjectId,
      topicIndex: pointer % subject.topics.length,
      lap: Math.floor(pointer / subject.topics.length) + 1,
    });

    nextPointers[subjectId] = pointer + 1;
  });

  return { week: { weekStart, days }, pointers: nextPointers };
}
