"use client";

import { Check, FileText, ListChecks } from "lucide-react";

import { useQuestions } from "@/components/questions-context";
import { QUESTION_GOAL, questionsToday } from "@/lib/questions";
import { materialHref, type TopicResource } from "@/lib/resources";

const linkClass = "text-accent-text hover:text-ink flex items-center gap-1 font-semibold";

/**
 * Links da planilha de estudos para um assunto: questões no QConcursos e o
 * material de apoio, que baixa direto pelo app (sem passar pelo Drive).
 * `label` distingue assuntos quando o tópico tem mais de um (ex.:
 * "Questões · Remédios Constitucionais").
 */
export function ResourceLinks({ resource, label }: { resource: TopicResource; label?: string }) {
  if (!resource.questions && !resource.material) return null;
  const suffix = label ? ` · ${label}` : "";
  const material = materialHref(resource);
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
      {material &&
        (material.download ? (
          // Baixa pelo servidor do app: sem registro no Drive.
          <a href={material.href} download title={`Baixar o material: ${resource.name}`} className={linkClass}>
            <FileText size={13} aria-hidden />
            Material{suffix}
          </a>
        ) : (
          // Pasta do Drive: não tem download direto, abre no Drive.
          <a
            href={material.href}
            target="_blank"
            rel="noopener noreferrer"
            title={`Material de apoio (pasta no Drive): ${resource.name}`}
            className={linkClass}
          >
            <FileText size={13} aria-hidden />
            Material{suffix}
          </a>
        ))}
    </>
  );
}

/** Meta do bloco de hoje: questões do tópico lançadas hoje, contra 10. */
export function QuestionGoal({ subjectId, topicIndex }: { subjectId: string; topicIndex: number }) {
  const { logs, today } = useQuestions();
  const answered = questionsToday(logs, subjectId, topicIndex, today);
  if (answered >= QUESTION_GOAL) {
    return (
      <span className="text-success flex items-center gap-1 font-semibold tabular-nums">
        <Check size={12} strokeWidth={3} aria-hidden />
        {answered} questões hoje
      </span>
    );
  }
  return (
    <span className="tabular-nums" title={`Meta do bloco: ${QUESTION_GOAL} questões hoje`}>
      {answered}/{QUESTION_GOAL} questões hoje
    </span>
  );
}
