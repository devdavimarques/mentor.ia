"use client";

import { useId, useState, type FormEvent } from "react";

import { MAX_MOCK_QUESTIONS, MOCK_SUBJECTS, mockResultsError } from "@/lib/mock-exams";
import type { MockResult } from "@/lib/types";

interface MockExamFormProps {
  onSubmit: (results: Record<string, MockResult>) => void;
  onCancel?: () => void;
}

type Row = { answered: string; correct: string };

/**
 * Lançamento de um simulado: acertos por matéria. "Feitas" já vem com o número
 * de questões da matéria na prova; matéria com "certas" em branco fica de fora
 * (ex.: simulado só de conhecimentos gerais).
 */
export function MockExamForm({ onSubmit, onCancel }: MockExamFormProps) {
  const id = useId();
  const [rows, setRows] = useState<Record<string, Row>>(() =>
    Object.fromEntries(
      MOCK_SUBJECTS.map((s) => [s.id, { answered: String(s.examQuestions), correct: "" }]),
    ),
  );
  const [error, setError] = useState<string | null>(null);

  const update = (subjectId: string, field: keyof Row, value: string) =>
    setRows((current) => ({ ...current, [subjectId]: { ...current[subjectId], [field]: value } }));

  function submit(event: FormEvent) {
    event.preventDefault();
    const results: Record<string, MockResult> = {};
    for (const [subjectId, row] of Object.entries(rows)) {
      if (row.correct.trim() === "") continue;
      results[subjectId] = { answered: Number(row.answered), correct: Number(row.correct) };
    }
    const invalid = mockResultsError(results);
    if (invalid) {
      setError(invalid);
      return;
    }
    setError(null);
    onSubmit(results);
  }

  const inputClass =
    "bg-frame border-line focus:border-accent-text w-16 rounded-lg border px-2 py-1.5 text-sm tabular-nums outline-none";

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-3 text-sm">
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
              className={inputClass}
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
              className={inputClass}
            />
          </div>
        ))}
      </div>

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
