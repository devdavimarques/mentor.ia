"use client";

import { Check, FileText, ListChecks } from "lucide-react";

import { useQuestions } from "@/components/questions-context";
import { QUESTION_GOAL, topicQuestionStats } from "@/lib/questions";
import type { TopicResource } from "@/lib/resources";

const linkClass = "text-accent-text hover:text-ink flex items-center gap-1 font-semibold";

/**
 * Links da planilha de estudos para um assunto: questões no QConcursos e o
 * material de apoio no Drive. `label` distingue assuntos quando o tópico tem
 * mais de um (ex.: "Questões · Remédios Constitucionais").
 */
export function ResourceLinks({ resource, label }: { resource: TopicResource; label?: string }) {
  if (!resource.questions && !resource.material) return null;
  const suffix = label ? ` · ${label}` : "";
  return (
    <>
      {resource.questions && (
        <a
          href={resource.questions}
          target="_blank"
          rel="noopener noreferrer"
          title={`Questões no QConcursos: ${resource.name}`}
          className={linkClass}
        >
          <ListChecks size={13} aria-hidden />
          Questões{suffix}
        </a>
      )}
      {resource.material && (
        <a
          href={resource.material}
          target="_blank"
          rel="noopener noreferrer"
          title={`Material de apoio: ${resource.name}`}
          className={linkClass}
        >
          <FileText size={13} aria-hidden />
          Material{suffix}
        </a>
      )}
    </>
  );
}

/** Quantas questões do tópico já foram feitas, contra a meta de 10. */
export function QuestionGoal({ subjectId, topicIndex }: { subjectId: string; topicIndex: number }) {
  const { logs } = useQuestions();
  const { answered } = topicQuestionStats(logs, subjectId, topicIndex);
  if (answered >= QUESTION_GOAL) {
    return (
      <span className="text-success flex items-center gap-1 font-semibold tabular-nums">
        <Check size={12} strokeWidth={3} aria-hidden />
        {answered} questões
      </span>
    );
  }
  return (
    <span className="tabular-nums" title={`Meta: ${QUESTION_GOAL} questões por tópico`}>
      {answered}/{QUESTION_GOAL} questões
    </span>
  );
}
