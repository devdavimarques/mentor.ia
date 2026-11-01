/**
 * Links das aulas (ex.: o vídeo no Drive). Um por aula, o mesmo para todos os
 * perfis, guardado no banco e editado na aba Matérias.
 */

export const MAX_LINK_LENGTH = 500;

export function lessonLinkKey(subjectId: string, lessonIndex: number): string {
  return `${subjectId}:${lessonIndex}`;
}

/**
 * O link limpo, ou `null` se não serve. Só `https://`: o endereço vira um
 * `href` que os dois perfis abrem, então `javascript:` e afins ficam de fora.
 */
export function normalizeLessonLink(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_LINK_LENGTH) return null;
  try {
    const url = new URL(trimmed);
    return url.protocol === "https:" && url.hostname.includes(".") ? url.toString() : null;
  } catch {
    return null;
  }
}
