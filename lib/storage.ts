import { pruneCompleted } from "./progress";
import { BLOCKS_PER_DAY_OPTIONS, DEFAULT_SETTINGS, findSubject } from "./subjects";
import type {
  CompletedMap,
  Pointers,
  ScheduledDay,
  Settings,
  StudyState,
  WeekSchedule,
} from "./types";

/**
 * Chave versionada: se o formato do estado mudar, basta subir a versão para
 * que instalações antigas recomecem limpas em vez de quebrar na leitura.
 */
const STORAGE_KEY = "mentor-ia:study-cycle:v1";

export function emptyState(): StudyState {
  return { settings: { ...DEFAULT_SETTINGS }, pointers: {}, week: null, completed: {} };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseSettings(value: unknown): Settings {
  if (!isRecord(value)) return { ...DEFAULT_SETTINGS };

  const activeDays = Array.isArray(value.activeDays)
    ? [...new Set(value.activeDays.filter((d): d is number => Number.isInteger(d) && d >= 1 && d <= 7))].sort(
        (a, b) => a - b,
      )
    : [...DEFAULT_SETTINGS.activeDays];

  const blocksPerDay = BLOCKS_PER_DAY_OPTIONS.includes(
    value.blocksPerDay as (typeof BLOCKS_PER_DAY_OPTIONS)[number],
  )
    ? (value.blocksPerDay as number)
    : DEFAULT_SETTINGS.blocksPerDay;

  return { activeDays, blocksPerDay };
}

function parsePointers(value: unknown): Pointers {
  if (!isRecord(value)) return {};
  const pointers: Pointers = {};
  for (const [id, pointer] of Object.entries(value)) {
    if (findSubject(id) && Number.isInteger(pointer) && (pointer as number) >= 0) {
      pointers[id] = pointer as number;
    }
  }
  return pointers;
}

function parseWeek(value: unknown): WeekSchedule | null {
  if (!isRecord(value) || typeof value.weekStart !== "string" || !Array.isArray(value.days)) {
    return null;
  }

  const days: ScheduledDay[] = [];
  for (const rawDay of value.days) {
    if (!isRecord(rawDay) || !Number.isInteger(rawDay.day) || !Array.isArray(rawDay.blocks)) continue;

    const blocks = rawDay.blocks.flatMap((rawBlock) => {
      if (!isRecord(rawBlock) || typeof rawBlock.subjectId !== "string") return [];
      const subject = findSubject(rawBlock.subjectId);
      const topicIndex = rawBlock.topicIndex;
      if (!subject || !Number.isInteger(topicIndex)) return [];
      if ((topicIndex as number) < 0 || (topicIndex as number) >= subject.topics.length) return [];
      return [
        {
          subjectId: rawBlock.subjectId,
          topicIndex: topicIndex as number,
          lap: Number.isInteger(rawBlock.lap) ? Math.max(1, rawBlock.lap as number) : 1,
        },
      ];
    });

    days.push({ day: rawDay.day as number, blocks });
  }

  return { weekStart: value.weekStart, days };
}

/**
 * Lê o estado persistido. Sempre retorna um estado válido: dados corrompidos,
 * de uma versão anterior do edital ou de um navegador sem `localStorage`
 * degradam para o estado vazio em vez de derrubar o app.
 */
export function loadState(): StudyState {
  if (typeof window === "undefined") return emptyState();

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();

    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return emptyState();

    return {
      settings: parseSettings(parsed.settings),
      pointers: parsePointers(parsed.pointers),
      week: parseWeek(parsed.week),
      completed: pruneCompleted(
        isRecord(parsed.completed) ? (parsed.completed as CompletedMap) : {},
      ),
    };
  } catch {
    return emptyState();
  }
}

/** Grava o estado. Falhas (modo privado, cota cheia) são silenciosas por projeto. */
export function saveState(state: StudyState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Sem persistência disponível — o app continua funcionando em memória.
  }
}
