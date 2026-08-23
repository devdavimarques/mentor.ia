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
