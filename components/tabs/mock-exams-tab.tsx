"use client";

import { Check, ChevronDown, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { MockEvolution } from "@/components/evolution";
import { MockExamForm } from "@/components/mock-exam-form";
import { ProgressBar } from "@/components/ui/progress-bar";
import type { MockExamDetails } from "@/hooks/use-study-cycle";
import { formatShortDate, fromIsoDate } from "@/lib/date";
import {
  formatPoints,
  MOCK_SUBJECTS,
  mockLabel,
  mockSubjectScore,
  mockTotal,
  subjectTrends,
  type SubjectTrend,
} from "@/lib/mock-exams";
import { PENDING_ID_PREFIX } from "@/lib/questions";
import { findSubject } from "@/lib/subjects";
import type { MockExam, MockResult, Subject } from "@/lib/types";

interface MockExamsTabProps {
  exams: readonly MockExam[];
  targets: Readonly<Record<string, number>>;
  todayDate: string;
  /** Dia do simulado pendente desta semana, ou `null`. */
  pendingMock: string | null;
  onAdd: (results: Record<string, MockResult>, details: MockExamDetails) => void;
  onDelete: (id: string) => void;
  onSetTarget: (subjectId: string, pct: number | null) => void;
}

const byDate = (a: MockExam, b: MockExam) => (a.takenOn < b.takenOn ? -1 : a.takenOn > b.takenOn ? 1 : 0);

export function MockExamsTab({
  exams,
  targets,
  todayDate,
  pendingMock,
  onAdd,
  onDelete,
  onSetTarget,
}: MockExamsTabProps) {
  const [adding, setAdding] = useState(false);
  const ordered = [...exams].sort(byDate);
  const latest = ordered.length > 0 ? ordered[ordered.length - 1] : null;
  const total = latest ? mockTotal(latest) : null;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-accent-text text-xs font-semibold tracking-wider uppercase">
            {latest ? `Último · ${mockLabel(latest)}` : "Simulados"}
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight tabular-nums">
            {total ? `${formatPoints(total.points)} pontos` : "Nenhum lançado"}
          </h1>
          {total && (
            <p className="text-muted mt-1 text-sm tabular-nums">
              de {formatPoints(total.maxPoints)} · {total.correct} de {total.answered} questões ·{" "}
              {total.pct}%
            </p>
          )}
        </div>
        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="bg-accent text-on-accent hover:bg-accent-hover flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-colors"
          >
            <Plus size={15} aria-hidden />
            Lançar simulado
          </button>
        )}
      </div>

      {pendingMock && !adding && (
        <p className="border-accent-text/40 bg-accent-soft rounded-xl border px-4 py-3 text-sm">
          O simulado desta semana está pendente
          {pendingMock === todayDate ? " hoje" : ` desde ${formatShortDate(fromIsoDate(pendingMock))}`}.
          Faça a prova inteira no tempo real e lance o resultado.
        </p>
      )}

      {adding && (
        <section aria-label="Lançar simulado" className="bg-surface border-line rounded-2xl border p-4">
          <MockExamForm
            todayDate={todayDate}
            previous={ordered}
            onSubmit={(results, details) => {
              onAdd(results, details);
              setAdding(false);
            }}
            onCancel={() => setAdding(false)}
          />
        </section>
      )}

      <MockEvolution mockExams={ordered} />

      <Targets exams={ordered} targets={targets} onSetTarget={onSetTarget} />

      <History exams={ordered} onDelete={onDelete} />
    </div>
  );
}

interface TargetsProps {
  exams: readonly MockExam[];
  targets: Readonly<Record<string, number>>;
  onSetTarget: (subjectId: string, pct: number | null) => void;
}

/** Meta de acerto de cada matéria e onde o último simulado deixou você. */
function Targets({ exams, targets, onSetTarget }: TargetsProps) {
  const trends = new Map(subjectTrends(exams, targets).map((t) => [t.subject.id, t]));

  return (
    <section aria-labelledby="metas">
      <h2 id="metas" className="mb-1 text-xl font-bold tracking-tight">
        Metas por matéria
      </h2>
      <p className="text-muted mb-3 text-sm">
        Quanto você quer acertar em cada matéria. O último simulado mostra se chegou lá.
      </p>
      <ul className="bg-surface border-line divide-line divide-y rounded-2xl border">
        {MOCK_SUBJECTS.map((subject) => (
          <TargetRow
            key={subject.id}
            subject={subject}
            trend={trends.get(subject.id) ?? null}
            target={targets[subject.id] ?? null}
            onSetTarget={onSetTarget}
          />
        ))}
      </ul>
    </section>
  );
}

interface TargetRowProps {
  subject: Subject;
  trend: SubjectTrend | null;
  target: number | null;
  onSetTarget: (subjectId: string, pct: number | null) => void;
}

function TargetRow({ subject, trend, target, onSetTarget }: TargetRowProps) {
  const [draft, setDraft] = useState(target === null ? "" : String(target));
  // Meta trocada por fora (ex.: gravação revertida): o campo acompanha.
  const [shown, setShown] = useState(target);
  if (shown !== target) {
    setShown(target);
    setDraft(target === null ? "" : String(target));
  }

  function commit() {
    const value = draft.trim() === "" ? null : Number(draft);
    if (value !== null && (!Number.isInteger(value) || value < 1 || value > 100)) {
      setDraft(target === null ? "" : String(target));
      return;
    }
    if (value !== target) onSetTarget(subject.id, value);
  }

  const latest = trend?.latest ?? null;
  const reached = latest !== null && target !== null && latest.pct >= target;
  const gap = latest !== null && target !== null ? target - latest.pct : null;
  // Meta em questões da prova, para dar a medida: 70% de 25 = 18 questões.
  const questions = target !== null ? Math.ceil((target / 100) * subject.examQuestions) : null;

  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-3 text-sm">
      <span className="min-w-0 flex-1 basis-40">
        <span className="block truncate font-medium">{subject.name}</span>
        <span className="text-muted text-xs tabular-nums">
          {latest
            ? `Último: ${latest.pct}% · ${formatPoints(latest.points)} pts`
            : "Sem simulado ainda"}
          {trend?.delta !== null && trend?.delta !== undefined && trend.delta !== 0 && (
            <> · {trend.delta > 0 ? `+${trend.delta}` : trend.delta} pp</>
          )}
        </span>
      </span>

      <span className="flex items-center gap-1.5">
        <label className="text-muted text-xs" htmlFor={`meta-${subject.id}`}>
          Meta
        </label>
        <input
          id={`meta-${subject.id}`}
          type="number"
          inputMode="numeric"
          min={1}
          max={100}
          placeholder="—"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          className="bg-frame border-line focus:border-accent-text w-16 rounded-lg border px-2 py-1 text-sm tabular-nums outline-none"
        />
        <span className="text-muted text-xs">%</span>
      </span>

      <span className="w-full text-xs tabular-nums sm:w-36 sm:text-right">
        {target === null ? (
          <span className="text-muted">sem meta</span>
        ) : reached ? (
          <span className="text-success inline-flex items-center gap-1 font-semibold">
            <Check size={13} strokeWidth={3} aria-hidden />
            na meta
          </span>
        ) : gap !== null ? (
          <span className="text-accent-text font-semibold">faltam {gap} pp</span>
        ) : (
          <span className="text-muted">
            ≈ {questions} de {subject.examQuestions} questões
          </span>
        )}
      </span>
    </li>
  );
}

interface HistoryProps {
  exams: readonly MockExam[];
  onDelete: (id: string) => void;
}

/** Todos os simulados, do mais novo para o mais antigo, com a nota de cada matéria ao abrir. */
function History({ exams, onDelete }: HistoryProps) {
  const history = [...exams].reverse();

  return (
    <section aria-labelledby="historico-simulados">
      <h2 id="historico-simulados" className="mb-3 text-xl font-bold tracking-tight">
        Histórico
      </h2>
      {history.length === 0 ? (
        <div className="border-line text-muted rounded-2xl border border-dashed p-5 text-center text-sm">
          Nenhum simulado lançado ainda.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {history.map((exam) => (
            <HistoryRow key={exam.id} exam={exam} onDelete={onDelete} />
          ))}
        </div>
      )}
    </section>
  );
}

function HistoryRow({ exam, onDelete }: { exam: MockExam; onDelete: (id: string) => void }) {
  const [confirming, setConfirming] = useState(false);
  const total = mockTotal(exam);
  const pending = exam.id.startsWith(PENDING_ID_PREFIX);
  const date = formatShortDate(fromIsoDate(exam.takenOn));

  return (
    <details className="group bg-surface border-line open:border-accent-text/40 rounded-2xl border">
      <summary className="flex cursor-pointer list-none items-center gap-3 rounded-2xl px-4 py-3 text-sm select-none [&::-webkit-details-marker]:hidden">
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold">{mockLabel(exam)}</span>
          <span className="text-muted text-xs tabular-nums">
            {date} · {total.correct}/{total.answered} questões · {formatPoints(exam.pointsPerQuestion)} por
            questão
          </span>
        </span>
        <span className="shrink-0 text-right tabular-nums">
          <span className="block font-bold">{formatPoints(total.points)}</span>
          <span className="text-muted text-xs">de {formatPoints(total.maxPoints)}</span>
        </span>
        <ChevronDown
          size={16}
          aria-hidden
          className="text-muted shrink-0 transition-transform group-open:rotate-180"
        />
      </summary>

      <div className="border-line border-t px-4 py-3">
        <ul className="flex flex-col gap-2 text-sm">
          {Object.entries(exam.results).map(([subjectId, result]) => {
            const subject = findSubject(subjectId);
            if (!subject) return null;
            const score = mockSubjectScore(exam, result);
            return (
              <li key={subjectId} className="grid grid-cols-[minmax(0,1fr)_5rem_6.5rem] items-center gap-3">
                <span className="truncate">{subject.name}</span>
                <ProgressBar value={score.pct} label={`Acerto em ${subject.name}`} />
                <span className="text-right text-xs tabular-nums">
                  <span className="font-semibold">{formatPoints(score.points)} pts</span>{" "}
                  <span className="text-muted">
                    {score.correct}/{score.answered}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>

        <div className="mt-3 flex items-center justify-end gap-2 text-sm">
          {confirming ? (
            <>
              <span className="mr-auto font-medium">Apagar este simulado?</span>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="text-muted hover:text-ink rounded-xl px-3 py-1.5 font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                autoFocus
                onClick={() => onDelete(exam.id)}
                className="border-danger/40 text-danger hover:bg-danger/10 rounded-xl border px-3 py-1.5 font-semibold transition-colors"
              >
                Apagar
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              disabled={pending}
              className="text-muted hover:text-danger flex items-center gap-1.5 rounded-xl px-2 py-1.5 text-xs font-semibold disabled:opacity-30"
            >
              <Trash2 size={13} aria-hidden />
              Apagar
            </button>
          )}
        </div>
      </div>
    </details>
  );
}
