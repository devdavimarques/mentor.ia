"use client";

import { Check, Download, FileText, ListChecks } from "lucide-react";

import { useQuestions } from "@/components/questions-context";
import { QUESTION_GOAL, questionsToday } from "@/lib/questions";
import { downloadUrl, type TopicResource } from "@/lib/resources";

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
      {resource.material && <DownloadLink url={resource.material} label={`Baixar material: ${resource.name}`} />}
    </>
  );
}

/** "Baixar": o arquivo do Drive direto, sem abrir a página dele. Nada para pasta. */
export function DownloadLink({ url, label }: { url: string; label: string }) {
  const href = downloadUrl(url);
  if (!href) return null;
  return (
    <a href={href} rel="noopener noreferrer" title={label} aria-label={label} className={linkClass}>
      <Download size={13} aria-hidden />
      Baixar
    </a>
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
