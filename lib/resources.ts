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

/**
 * Link que baixa o arquivo direto, sem passar pela tela do Drive: arquivo do
 * Drive pelo `uc?export=download`, documento do Google exportado em PDF (ou
 * XLSX, para planilha). Pasta e outros endereços não têm: `null`.
 */
export function downloadUrl(url: string): string | null {
  const file = url.match(/^https:\/\/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:[^#]*&)?id=)([\w-]+)/);
  if (file) return `https://drive.google.com/uc?export=download&id=${file[1]}`;
  const doc = url.match(/^https:\/\/docs\.google\.com\/(document|spreadsheets|presentation)\/d\/([\w-]+)/);
  if (!doc) return null;
  const format = doc[1] === "spreadsheets" ? "xlsx" : "pdf";
  return `https://docs.google.com/${doc[1]}/d/${doc[2]}/export?format=${format}`;
}
