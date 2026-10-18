"use client";

import { Check, ListPlus } from "lucide-react";
import { useState } from "react";

import { QuestionPanel } from "@/components/question-panel";
import { useQuestions } from "@/components/questions-context";
import { HotTag, Tag } from "@/components/ui/tag";
import { topicQuestionStats } from "@/lib/questions";
import { findSubject, lessonPosition, topicCode } from "@/lib/subjects";
import type { ScheduledBlock } from "@/lib/types";

interface StudyCardProps {
  subjectId: string;
  /** Tópicos do edital ligados ao cartão. O primeiro recebe as questões. */
  topicIndexes: readonly number[];
  title: string;
  /** Linha de apoio abaixo do título (ex.: o item do edital de uma aula). */
  detail?: string;
  checked: boolean;
  onToggle: () => void;
  /** Selos ao lado do nome da matéria: "2ª volta", "1ª revisão"… */
  tags?: React.ReactNode;
}

/**
 * Cartão de algo a estudar ou revisar. A área principal marca o que foi feito
 * hoje; o botão à direita abre o lançamento de questões do tópico.
 */
function StudyCard({
  subjectId,
  topicIndexes,
  title,
  detail,
  checked,
  onToggle,
  tags,
}: StudyCardProps) {
  const [open, setOpen] = useState(false);
  const { logs } = useQuestions();
  const subject = findSubject(subjectId);
  if (!subject) return null;

  const questionTopic = topicIndexes[0];
  const codes = topicIndexes.map((t) => topicCode(subject, t));
  // Uma aula pode cobrir vários itens (Penal Militar cobre sete): mostra os
  // dois primeiros e resume o resto, senão os selos passam da borda.
  const shownCodes = codes.slice(0, 2);
  const hiddenCodes = codes.length - shownCodes.length;
  const stats = topicQuestionStats(logs, subjectId, questionTopic);

  return (
    // `@container`: o cartão se adapta à própria largura, não à da tela — na
    // Semana ele vive numa coluna estreita mesmo em monitor grande.
    <div
      className={`@container bg-surface relative rounded-2xl border transition-colors ${
        checked ? "border-success/40" : "border-line hover:border-accent-text/50"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={checked}
        aria-label={`${codes.join(", ")} — ${title}`}
        className="flex w-full items-start gap-3 rounded-2xl p-4 text-left"
      >
        <span
          aria-hidden
          className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg border-[1.5px] transition-colors ${
            checked ? "bg-success border-success text-white" : "border-line"
          }`}
        >
          {checked && <Check size={15} strokeWidth={3} />}
        </span>

        <span className="min-w-0 flex-1">
          {/* `pr-*` deixa espaço para o botão de questões, que flutua no canto. */}
          <span className="text-muted mb-1.5 flex min-w-0 items-center gap-2 pr-12 text-xs font-medium @[28rem]:pr-28">
            {shownCodes.map((code) => (
              <span
                key={code}
                className="bg-accent-soft text-accent-text shrink-0 rounded-md px-1.5 py-0.5 font-mono text-[0.7rem]"
              >
                {code}
              </span>
            ))}
            {hiddenCodes > 0 && (
              <span
                className="bg-accent-soft text-accent-text shrink-0 rounded-md px-1.5 py-0.5 font-mono text-[0.7rem]"
                title={codes.join(", ")}
              >
                +{hiddenCodes}
              </span>
            )}
            <span className="truncate">{subject.name}</span>
          </span>
          <span
            className={`block text-[0.95rem] leading-snug font-semibold ${
              checked ? "text-muted" : "text-ink"
            }`}
          >
            {title}
          </span>
          {detail && (
            <span className="text-muted mt-1 line-clamp-2 text-xs leading-snug">
              {detail}
            </span>
          )}
          <span className="text-muted mt-2.5 flex flex-wrap items-center gap-1.5 text-xs empty:hidden">
            {tags}
          </span>
        </span>
      </button>

      <QuestionsToggle
        open={open}
        pct={stats.pct}
        onClick={() => setOpen((v) => !v)}
        className="absolute top-2.5 right-2.5"
      />

      {open && (
        <div className="border-line border-t px-4 py-3">
          <QuestionPanel subjectId={subjectId} topicIndex={questionTopic} />
        </div>
      )}
    </div>
  );
}

interface TopicBlockProps {
  subjectId: string;
  topicIndex: number;
  checked: boolean;
  onToggle: () => void;
  tags?: React.ReactNode;
}

/** Cartão de um tópico do edital (revisões). */
export function TopicBlock({ subjectId, topicIndex, tags, ...rest }: TopicBlockProps) {
  const subject = findSubject(subjectId);
  if (!subject) return null;
  return (
    <StudyCard
      subjectId={subjectId}
      topicIndexes={[topicIndex]}
      title={subject.topics[topicIndex]}
      tags={
        <>
          {tags}
          {subject.hotTopics.includes(topicIndex) && <HotTag />}
        </>
      }
      {...rest}
    />
  );
}

/** "Relevo Brasileiro" e "Relevo brasileiro." contam como o mesmo texto. */
function sameText(a: string, b: string): boolean {
  const norm = (s: string) => s.toLocaleLowerCase("pt-BR").replace(/[^\p{L}\p{N}]+/gu, "");
  return norm(a) === norm(b);
}

interface LessonBlockProps {
  block: ScheduledBlock;
  checked: boolean;
  onToggle: () => void;
}

/** Cartão de um bloco do ciclo: uma aula do curso, com o item do edital que ela cobre. */
export function LessonBlock({ block, checked, onToggle }: LessonBlockProps) {
  const subject = findSubject(block.subjectId);
  const lesson = subject?.lessons[block.lessonIndex];
  if (!subject || !lesson) return null;

  const position = lessonPosition(subject, block.lessonIndex);
  const topicNames = lesson.topics.map((t) => subject.topics[t]).join(" · ");
  const title = lesson.selfStudy
    ? lesson.title
    : [lesson.title, lesson.subtitle].filter(Boolean).join(" · ");

  return (
    <StudyCard
      subjectId={subject.id}
      topicIndexes={lesson.topics}
      title={title}
      detail={lesson.selfStudy || sameText(topicNames, title) ? undefined : topicNames}
      checked={checked}
      onToggle={onToggle}
      tags={
        <>
          {lesson.selfStudy ? (
            <Tag>estudo do tópico</Tag>
          ) : (
            position.of > 1 && (
              <Tag>
                aula {position.n} de {position.of}
              </Tag>
            )
          )}
          {!lesson.selfStudy && !lesson.recorded && <Tag>não gravada</Tag>}
          {block.lap > 1 && <Tag>{block.lap}ª volta</Tag>}
          {lesson.topics.some((t) => subject.hotTopics.includes(t)) && <HotTag />}
        </>
      }
    />
  );
}

interface QuestionsToggleProps {
  open: boolean;
  /** Acerto no tópico; `null` sem questões lançadas. */
  pct: number | null;
  onClick: () => void;
  /** Posição; o padrão é a margem para ficar ao lado de uma linha. */
  className?: string;
}

/**
 * Botão que abre o lançamento de questões, mostrando o acerto quando já há
 * dados. Em espaço estreito (container abaixo de 22rem) vira só o ícone.
 */
export function QuestionsToggle({ open, pct, onClick, className = "m-2.5" }: QuestionsToggleProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={open}
      aria-label={pct === null ? "Lançar questões" : `${pct}% de acerto. Lançar questões`}
      title="Questões do tópico"
      className={`${className} flex shrink-0 items-center gap-1.5 rounded-xl border px-2 py-1.5 text-xs font-semibold tabular-nums transition-colors ${
        open
          ? "border-accent bg-accent text-on-accent"
          : "border-line bg-surface text-muted hover:border-accent-text/50 hover:text-ink"
      }`}
    >
      <ListPlus size={14} aria-hidden />
      {pct === null ? <span className="hidden @[28rem]:inline">Questões</span> : `${pct}%`}
    </button>
  );
}
