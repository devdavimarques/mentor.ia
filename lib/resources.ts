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
