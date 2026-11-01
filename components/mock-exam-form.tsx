"use client";

import { useId, useState, type FormEvent } from "react";

import type { MockExamDetails } from "@/hooks/use-study-cycle";
import {
  DEFAULT_POINTS_PER_QUESTION,
  formatPoints,
  MAX_MOCK_QUESTIONS,
  MAX_MOCK_TITLE_LENGTH,
  MOCK_SUBJECTS,
  mockDetailsError,
  mockResultsError,
} from "@/lib/mock-exams";
import type { MockExam, MockResult } from "@/lib/types";

interface MockExamFormProps {
  todayDate: string;
  /** Simulados já lançados: dão o próximo nome e o valor da questão do último. */
  previous: readonly MockExam[];
  onSubmit: (results: Record<string, MockResult>, details: MockExamDetails) => void;
  onCancel?: () => void;
}

type Row = { answered: string; correct: string };

/** "1,25" ou "1.25" → 1.25; vazio vira `NaN` para cair na validação. */
function toNumber(value: string): number {
  return value.trim() === "" ? Number.NaN : Number(value.replace(",", "."));
}

/**
 * Lançamento de um simulado: nome, data, valor de cada questão e acertos por
 * matéria. "Feitas" já vem com o número de questões da matéria na prova;
 * matéria com "certas" em branco fica de fora (ex.: simulado só de gerais).
 * O total em pontos aparece enquanto preenche.
 */
export function MockExamForm({ todayDate, previous, onSubmit, onCancel }: MockExamFormProps) {
  const id = useId();
  const last = previous.length > 0 ? previous[previous.length - 1] : null;
  const [title, setTitle] = useState(`Simulado ${String(previous.length + 1).padStart(2, "0")}`);
  const [takenOn, setTakenOn] = useState(todayDate);
  const [value, setValue] = useState(
    formatPoints(last?.pointsPerQuestion ?? DEFAULT_POINTS_PER_QUESTION),
  );
  const [rows, setRows] = useState<Record<string, Row>>(() =>
    Object.fromEntries(
      MOCK_SUBJECTS.map((s) => [s.id, { answered: String(s.examQuestions), correct: "" }]),
    ),
  );
  const [error, setError] = useState<string | null>(null);

  const update = (subjectId: string, field: keyof Row, next: string) =>
    setRows((current) => ({ ...current, [subjectId]: { ...current[subjectId], [field]: next } }));

  function collect(): Record<string, MockResult> {
    const results: Record<string, MockResult> = {};
    for (const [subjectId, row] of Object.entries(rows)) {
      if (row.correct.trim() === "") continue;
      results[subjectId] = { answered: Number(row.answered), correct: Number(row.correct) };
    }
    return results;
  }

  // Prévia do total: só com números válidos, senão não mostra.
  const points = toNumber(value);
  const preview = Object.values(collect()).reduce(
    (sum, r) => ({ answered: sum.answered + r.answered, correct: sum.correct + r.correct }),
    { answered: 0, correct: 0 },
  );
  const showPreview =
    preview.answered > 0 && Number.isFinite(points) && points > 0 && Number.isFinite(preview.correct);

  function submit(event: FormEvent) {
    event.preventDefault();
    const results = collect();
    const details: MockExamDetails = {
      title: title.trim() === "" ? null : title.trim(),
      takenOn,
      pointsPerQuestion: points,
    };
    const invalid =
      mockDetailsError(details.title, takenOn, points, todayDate) ?? mockResultsError(results);
    if (invalid) {
      setError(invalid);
      return;
    }
    setError(null);
    onSubmit(results, details);
  }

  const inputClass =
    "bg-frame border-line focus:border-accent-text rounded-lg border px-2 py-1.5 text-sm tabular-nums outline-none";

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4 text-sm">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
        <label className="col-span-2 flex flex-col gap-1 sm:col-span-1">
          <span className="text-muted text-xs font-medium">Nome</span>
          <input
            type="text"
            maxLength={MAX_MOCK_TITLE_LENGTH}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={`${inputClass} w-full`}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-muted text-xs font-medium">Data</span>
          <input
            type="date"
            max={todayDate}
            value={takenOn}
            onChange={(e) => setTakenOn(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-muted text-xs font-medium">Valor da questão</span>
          <input
            type="text"
            inputMode="decimal"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className={`${inputClass} w-24`}
          />
        </label>
      </div>

      <div className="text-muted grid grid-cols-[minmax(0,1fr)_4rem_4rem] items-center gap-x-2 gap-y-1.5">
        <span className="text-xs font-medium">Matéria</span>
        <span className="text-xs font-medium">Feitas</span>
        <span className="text-xs font-medium">Certas</span>
        {MOCK_SUBJECTS.map((subject) => (
          <div key={subject.id} className="contents">
            <label htmlFor={`${id}-${subject.id}`} className="text-ink truncate">
              {subject.name}
            </label>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={MAX_MOCK_QUESTIONS}
              aria-label={`Questões feitas de ${subject.name}`}
              value={rows[subject.id].answered}
              onChange={(e) => update(subject.id, "answered", e.target.value)}
              className={`${inputClass} w-16`}
            />
            <input
              id={`${id}-${subject.id}`}
              type="number"
              inputMode="numeric"
              min={0}
              max={MAX_MOCK_QUESTIONS}
              aria-label={`Questões certas de ${subject.name}`}
              value={rows[subject.id].correct}
              onChange={(e) => update(subject.id, "correct", e.target.value)}
              className={`${inputClass} w-16`}
            />
          </div>
        ))}
      </div>

      {showPreview && (
        <p className="bg-surface-alt rounded-xl px-3 py-2 tabular-nums" aria-live="polite">
          <span className="font-bold">
            {formatPoints(Math.round(preview.correct * points * 100) / 100)} de{" "}
            {formatPoints(Math.round(preview.answered * points * 100) / 100)} pontos
          </span>
          <span className="text-muted">
            {" "}
            · {preview.correct} de {preview.answered} questões
          </span>
        </p>
      )}

      {error && (
        <p role="alert" className="text-danger text-xs font-medium">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          className="bg-accent text-on-accent hover:bg-accent-hover rounded-xl px-4 py-2 font-semibold transition-colors"
        >
          Lançar simulado
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-muted hover:text-ink rounded-xl px-3 py-2 font-semibold"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
