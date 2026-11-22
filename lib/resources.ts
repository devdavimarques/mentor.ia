import { findSubject, topicCode } from "./subjects";
import { LESSON_RESOURCE, TOPIC_RESOURCES, type TopicResource } from "./topic-resources";

export type { TopicResource };

/** Linhas da planilha de um tópico do edital (assunto, questões e material). */
export function topicResources(subjectId: string, topicIndex: number): readonly TopicResource[] {
  const subject = findSubject(subjectId);
  return subject ? (TOPIC_RESOURCES[topicCode(subject, topicIndex)] ?? []) : [];
}

/** A linha da planilha que vale para uma aula do curso. */
export function lessonResource(subjectId: string, lessonIndex: number): TopicResource | null {
  const ref = LESSON_RESOURCE[`${subjectId}:${lessonIndex}`];
  return ref ? (TOPIC_RESOURCES[ref[0]]?.[ref[1]] ?? null) : null;
}

/** Onde cada linha da planilha mora (código do tópico e posição), para montar o link de download. */
const REFS = new Map<TopicResource, string>();
for (const [code, list] of Object.entries(TOPIC_RESOURCES)) {
  list.forEach((resource, index) => REFS.set(resource, `${code}/${index}`));
}

/**
 * Endereço do material no próprio app (`/material/LP-01/0`): o servidor baixa
 * o arquivo do Drive sem conta nenhuma e entrega, então não fica registro do
 * acesso no Drive. Pasta não dá para baixar: aí vale o link do Drive mesmo.
 */
export function materialHref(resource: TopicResource): { href: string; download: boolean } | null {
  if (!resource.material) return null;
  const ref = REFS.get(resource);
  return ref && downloadUrl(resource.material)
    ? { href: `/material/${ref}`, download: true }
    : { href: resource.material, download: false };
}

/** O material de um tópico pela posição na planilha, ou `null`. */
export function findMaterial(code: string, index: number): TopicResource | null {
  return TOPIC_RESOURCES[code]?.[index] ?? null;
}

/**
 * Link que baixa o arquivo direto do Google: arquivo do Drive pelo endereço
 * de download (com `confirm=t`, que pula o aviso de arquivo grande),
 * documento do Google exportado em PDF (ou XLSX, para planilha). Pasta e
 * outros endereços não têm: `null`.
 */
export function downloadUrl(url: string): string | null {
  const file = url.match(/^https:\/\/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:[^#]*&)?id=)([\w-]+)/);
  if (file) return `https://drive.usercontent.google.com/download?id=${file[1]}&export=download&confirm=t`;
  const doc = url.match(/^https:\/\/docs\.google\.com\/(document|spreadsheets|presentation)\/d\/([\w-]+)/);
  if (!doc) return null;
  const format = doc[1] === "spreadsheets" ? "xlsx" : "pdf";
  return `https://docs.google.com/${doc[1]}/d/${doc[2]}/export?format=${format}`;
}
