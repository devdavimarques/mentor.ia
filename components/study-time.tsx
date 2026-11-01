"use client";

import { Play, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";

import { useStudyTimer } from "@/components/study-timer";
import { ProgressBar } from "@/components/ui/progress-bar";
import { formatShortDate, fromIsoDate } from "@/lib/date";
import { PENDING_ID_PREFIX } from "@/lib/questions";
import { formatMinutes, MAX_SESSION_MINUTES, studySessionError, timeBySubject } from "@/lib/study-time";
import { findSubject, SUBJECTS } from "@/lib/subjects";
import type { Settings, StudySession } from "@/lib/types";

/** Quantas sessões recentes aparecem. */
const RECENT_SIZE = 6;

interface StudyTimeProps {
  sessions: readonly StudySession[];
  settings: Settings;
  todayDate: string;
  onAdd: (subjectId: string, lessonIndex: number | null, minutes: number) => void;
  onDelete: (id: string) => void;
}

const fieldClass =
  "bg-frame border-line focus:border-accent-text rounded-xl border px-3 py-2 text-sm outline-none";

/**
 * Tempo de estudo por matéria, na semana e no total, comparado com a fatia
 * que o peso da matéria pede. Daqui também dá para ligar o cronômetro sem
 * aula (estudo livre) ou lançar minutos à mão.
 */
export function StudyTime({ sessions, settings, todayDate, onAdd, onDelete }: StudyTimeProps) {
  const { active, start } = useStudyTimer();
  const [subjectId, setSubjectId] = useState(SUBJECTS[0].id);
  const [minutes, setMinutes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const time = timeBySubject(sessions, settings, todayDate);
  const maxWeek = Math.max(1, ...time.subjects.map((s) => s.week));
  const recent = [...sessions].reverse().slice(0, RECENT_SIZE);

  function submit(event: FormEvent) {
    event.preventDefault();
    const value = minutes.trim() === "" ? Number.NaN : Number(minutes);
    const invalid = studySessionError(subjectId, null, value);
    if (invalid) {
      setError(invalid);
      return;
    }
    setError(null);
    setMinutes("");
    onAdd(subjectId, null, value);
  }

  return (
    <section aria-labelledby="tempo-estudo">
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="tempo-estudo" className="text-xl font-bold tracking-tight">
          Tempo de estudo
        </h2>
        <span className="text-muted text-sm tabular-nums">
          {formatMinutes(time.week)} na semana · {formatMinutes(time.total)} no total
        </span>
      </div>
      <p className="text-muted mb-3 text-sm">
        Ligue o cronômetro num bloco (botão Cronometrar) ou aqui, para estudo livre. A fatia de cada
        matéria na semana aparece ao lado da que o peso dela pede.
      </p>

      <form
        onSubmit={submit}
        noValidate
        className="bg-surface border-line mb-3 flex flex-wrap items-end gap-2 rounded-2xl border p-3"
      >
        <label className="flex min-w-0 flex-1 basis-40 flex-col gap-1">
          <span className="text-muted text-xs font-medium">Matéria</span>
          <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className={fieldClass}>
            {SUBJECTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-muted text-xs font-medium">Minutos</span>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={MAX_SESSION_MINUTES}
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            className={`${fieldClass} w-20 tabular-nums`}
          />
        </label>
        <button
          type="submit"
          className="bg-accent hover:bg-accent-hover text-on-accent rounded-xl px-4 py-2 text-sm font-semibold transition-colors"
        >
          Lançar
        </button>
        <button
          type="button"
          onClick={() => start(subjectId, null)}
          disabled={active !== null}
          title={active ? "Já há um cronômetro ligado" : "Cronometrar estudo livre desta matéria"}
          className="border-line text-accent-text hover:border-accent-text/50 flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors disabled:opacity-40"
        >
          <Play size={14} aria-hidden />
          Cronometrar
        </button>
        {error && (
          <p role="alert" className="text-danger w-full text-xs font-medium">
            {error}
          </p>
        )}
      </form>

      {time.subjects.length === 0 ? (
        <div className="border-line text-muted rounded-2xl border border-dashed p-5 text-center text-sm">
          Nenhum tempo registrado ainda.
        </div>
      ) : (
        <ul className="bg-surface border-line divide-line divide-y rounded-2xl border">
          {time.subjects.map((s) => (
            <li key={s.subject.id} className="px-4 py-2.5 text-sm">
              <div className="mb-1.5 flex items-baseline gap-2">
                <span className="min-w-0 flex-1 truncate font-medium">{s.subject.name}</span>
                <span className="font-semibold tabular-nums">{formatMinutes(s.week)}</span>
                <span className="text-muted w-20 text-right text-xs tabular-nums">
                  {formatMinutes(s.total)} total
                </span>
              </div>
              <ProgressBar
                value={Math.round((s.week / maxWeek) * 100)}
                label={`Tempo de ${s.subject.name} na semana`}
              />
              {time.week > 0 && (
                <p className="text-muted mt-1 text-xs tabular-nums">
                  {s.weekShare}% do tempo da semana · o peso pede {s.weightShare}%
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      {recent.length > 0 && (
        <div className="mt-3">
          <h3 className="text-muted mb-1.5 text-xs font-semibold tracking-wider uppercase">
            Últimos registros
          </h3>
          <ul className="flex flex-col gap-1">
            {recent.map((session) => {
              const subject = findSubject(session.subjectId);
              const lesson = session.lessonIndex !== null ? subject?.lessons[session.lessonIndex] : undefined;
              return (
                <li key={session.id} className="text-muted flex items-center gap-3 text-xs tabular-nums">
                  <span className="w-10 shrink-0">{formatShortDate(fromIsoDate(session.studiedOn))}</span>
                  <span className="text-ink min-w-0 flex-1 truncate">
                    {subject?.name}
                    {lesson && <span className="text-muted"> · {lesson.title}</span>}
                  </span>
                  <span className="text-ink font-semibold">{formatMinutes(session.minutes)}</span>
                  <button
                    type="button"
                    onClick={() => onDelete(session.id)}
                    disabled={session.id.startsWith(PENDING_ID_PREFIX)}
                    aria-label={`Apagar ${formatMinutes(session.minutes)} de ${subject?.name ?? ""}`}
                    className="hover:text-danger rounded-md p-1 transition-colors disabled:opacity-40"
                  >
                    <Trash2 size={13} aria-hidden />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
