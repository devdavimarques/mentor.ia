/** Dia da semana no padrão ISO: 1 = segunda … 7 = domingo. */
export function isoWeekday(date: Date): number {
  const day = date.getDay();
  return day === 0 ? 7 : day;
}

/** Segunda-feira da semana da data informada, à meia-noite local. */
export function startOfIsoWeek(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - (isoWeekday(d) - 1));
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Serializa como `yyyy-mm-dd` no fuso local (nunca em UTC). */
export function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Faz o parse de `yyyy-mm-dd` como data local. `new Date("2026-08-23")` seria
 * interpretado como UTC e poderia voltar um dia dependendo do fuso.
 */
export function fromIsoDate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year || 1970, (month || 1) - 1, day || 1);
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** Data correspondente a um dia ISO dentro da semana que começa em `weekStart`. */
export function dateOfWeekday(weekStart: string, day: number): Date {
  return addDays(fromIsoDate(weekStart), day - 1);
}

/** Formato curto usado na interface: `23/08`. */
export function formatShortDate(date: Date): string {
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

/** Formato por extenso usado em títulos: `17 de outubro`. */
export function formatLongDate(date: Date): string {
  return date.toLocaleDateString("pt-BR", { day: "numeric", month: "long" });
}

/**
 * Fuso do app. O servidor da Vercel roda em UTC, então `new Date()` lá vira
 * outro dia (e às vezes outra semana) em relação a quem está na Bahia. Fixar o
 * fuso faz servidor e navegador concordarem sobre que dia é hoje — sem isso, a
 * aba "Hoje" mostraria o dia errado durante a madrugada.
 */
export const APP_TIME_ZONE = "America/Bahia";

/** Data de hoje no fuso do app, como `yyyy-mm-dd`. `en-CA` já formata assim. */
export function todayIsoDate(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Segunda-feira da semana de uma data `yyyy-mm-dd`, no mesmo formato. */
export function weekStartOf(iso: string): string {
  return toIsoDate(startOfIsoWeek(fromIsoDate(iso)));
}

/** Segunda-feira da semana corrente, no fuso do app, como `yyyy-mm-dd`. */
export function currentWeekStart(): string {
  return weekStartOf(todayIsoDate());
}
