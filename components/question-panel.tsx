"use client";

import { Trash2 } from "lucide-react";
import { useId, useState, type FormEvent } from "react";

import { useQuestions } from "@/components/questions-context";
import { formatShortDate, fromIsoDate } from "@/lib/date";
import {
  MAX_QUESTIONS_PER_LOG,
  PENDING_ID_PREFIX,
  questionLogError,
  questionStats,
} from "@/lib/questions";

/** Quantos lançamentos do tópico aparecem no histórico. */
const HISTORY_SIZE = 5;

interface QuestionPanelProps {
  subjectId: string;
  topicIndex: number;
}

/** Converte o campo em número; vazio vira `NaN` para cair na validação. */
function toCount(value: string): number {
  return value.trim() === "" ? Number.NaN : Number(value);
}

export function QuestionPanel({ subjectId, topicIndex }: QuestionPanelProps) {
  const { logs, add, remove } = useQuestions();
  const [answered, setAnswered] = useState("");
  const [correct, setCorrect] = useState("");
  const [error, setError] = useState<string | null>(null);
  const id = useId();

  const topicLogs = logs.filter((l) => l.subjectId === subjectId && l.topicIndex === topicIndex);
  const stats = questionStats(topicLogs);
  const history = topicLogs.slice(-HISTORY_SIZE).reverse();

  function submit(event: FormEvent) {
    event.preventDefault();
    const a = toCount(answered);
    const c = toCount(correct);
    const invalid = questionLogError(a, c);
    if (invalid) {
      setError(invalid);
      return;
    }
    add(subjectId, topicIndex, a, c);
    setAnswered("");
    setCorrect("");
    setError(null);
  }

  const inputClass =
    "bg-frame border-line focus:border-accent-text w-20 rounded-xl border px-3 py-2 text-sm tabular-nums outline-none";

  return (
    <div className="flex flex-col gap-3 text-sm">
      <p className="text-muted text-xs font-medium tabular-nums">
        {stats.pct === null
          ? "Nenhuma questão lançada neste tópico."
          : `${stats.answered} feitas · ${stats.correct} certas · ${stats.pct}% de acerto`}
      </p>

      <form onSubmit={submit} className="flex flex-wrap items-end gap-2" noValidate>
        <label className="flex flex-col gap-1" htmlFor={`${id}-answered`}>
          <span className="text-muted text-xs font-medium">Feitas</span>
          <input
            id={`${id}-answered`}
            type="number"
            inputMode="numeric"
            min={1}
            max={MAX_QUESTIONS_PER_LOG}
            value={answered}
            onChange={(e) => setAnswered(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1" htmlFor={`${id}-correct`}>
          <span className="text-muted text-xs font-medium">Certas</span>
          <input
            id={`${id}-correct`}
            type="number"
            inputMode="numeric"
            min={0}
            max={MAX_QUESTIONS_PER_LOG}
            value={correct}
            onChange={(e) => setCorrect(e.target.value)}
            className={inputClass}
          />
        </label>
        <button
          type="submit"
          className="bg-accent hover:bg-accent-hover text-on-accent rounded-xl px-4 py-2 text-sm font-semibold transition-colors"
        >
          Lançar
        </button>
      </form>

      {error && (
        <p role="alert" className="text-danger text-xs font-medium">
          {error}
        </p>
      )}

      {history.length > 0 && (
        <ul className="flex flex-col gap-1" aria-label="Últimos lançamentos">
          {history.map((log) => {
            const pending = log.id.startsWith(PENDING_ID_PREFIX);
            return (
              <li key={log.id} className="text-muted flex items-center gap-3 text-xs tabular-nums">
                <span>{formatShortDate(fromIsoDate(log.loggedOn))}</span>
                <span className="text-ink font-semibold">
                  {log.correct}/{log.answered}
                </span>
                <span>{Math.round((log.correct / log.answered) * 100)}%</span>
                <button
                  type="button"
                  onClick={() => remove(log.id)}
                  disabled={pending}
                  className="hover:text-danger ml-auto rounded-md p-1 transition-colors disabled:opacity-40"
                  aria-label={`Apagar lançamento de ${log.correct} certas em ${log.answered}`}
                >
                  <Trash2 size={13} aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
