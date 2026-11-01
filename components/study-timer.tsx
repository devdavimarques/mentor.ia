"use client";

import { Pause, Play, Square, Timer, X } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useState, type FormEvent } from "react";

import { MAX_SESSION_MINUTES } from "@/lib/study-time";
import { findSubject, lessonPosition } from "@/lib/subjects";

/** O que está sendo cronometrado e quanto tempo já passou. */
export interface TimerState {
  subjectId: string;
  lessonIndex: number | null;
  /** Momento em que a contagem atual começou; `null` com o cronômetro pausado. */
  startedAt: number | null;
  /** Milissegundos contados antes da última pausa. */
  elapsed: number;
}

export interface StudyTimerApi {
  active: TimerState | null;
  /** Liga o cronômetro numa aula (ou na matéria, sem aula). Com outro ligado, não faz nada. */
  start: (subjectId: string, lessonIndex: number | null) => void;
}

function isTimerState(value: unknown): value is TimerState {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.subjectId === "string" &&
    !!findSubject(v.subjectId) &&
    (v.lessonIndex === null || Number.isInteger(v.lessonIndex)) &&
    (v.startedAt === null || typeof v.startedAt === "number") &&
    typeof v.elapsed === "number"
  );
}

const elapsedMs = (t: TimerState, now: number) =>
  Math.max(0, t.elapsed + (t.startedAt !== null ? now - t.startedAt : 0));

/**
 * Estado do cronômetro. Fica no navegador (localStorage), para sobreviver a
 * recarregar a página ou fechar a aba no meio do estudo; só o resultado, ao
 * parar, vai para o banco.
 */
export function useStudyTimerState(storageKey: string) {
  const [active, setActive] = useState<TimerState | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      const parsed: unknown = raw ? JSON.parse(raw) : null;
      if (isTimerState(parsed)) setActive(parsed);
    } catch {
      // Sem acesso ao armazenamento (aba anônima, bloqueio): só não sobrevive ao recarregar.
    }
  }, [storageKey]);

  const update = useCallback(
    (next: TimerState | null) => {
      setActive(next);
      try {
        if (next) window.localStorage.setItem(storageKey, JSON.stringify(next));
        else window.localStorage.removeItem(storageKey);
      } catch {
        // Idem: segue só na memória.
      }
    },
    [storageKey],
  );

  const start = useCallback(
    (subjectId: string, lessonIndex: number | null) => {
      if (active) return;
      update({ subjectId, lessonIndex, startedAt: Date.now(), elapsed: 0 });
    },
    [active, update],
  );

  return { active, start, update };
}

const TimerContext = createContext<StudyTimerApi>({ active: null, start: () => {} });

export const StudyTimerProvider = TimerContext.Provider;

export function useStudyTimer(): StudyTimerApi {
  return useContext(TimerContext);
}

/** "12:03" ou "1:02:45". */
export function formatClock(ms: number): string {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(h > 0 ? 2 : 1, "0");
  return `${h > 0 ? `${h}:` : ""}${mm}:${String(s).padStart(2, "0")}`;
}

/** Atualiza a cada segundo enquanto `running`. */
function useNow(running: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!running) return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [running]);
  return now;
}

/** Matéria e "Brasil Colônia · aula 2 de 9" (ou nada, no estudo livre). */
function timerLabel(subjectId: string, lessonIndex: number | null) {
  const subject = findSubject(subjectId);
  if (!subject) return { subject: subjectId, lesson: null };
  const lesson = lessonIndex !== null ? subject.lessons[lessonIndex] : undefined;
  if (!lesson || lessonIndex === null) return { subject: subject.name, lesson: null };
  const position = lessonPosition(subject, lessonIndex);
  const part = !lesson.selfStudy && position.of > 1 ? ` · aula ${position.n} de ${position.of}` : "";
  return { subject: subject.name, lesson: `${lesson.title}${part}` };
}

interface TimerButtonProps {
  subjectId: string;
  lessonIndex: number;
}

/** Selo nos blocos: liga o cronômetro naquela aula, ou mostra que ele está correndo nela. */
export function TimerButton({ subjectId, lessonIndex }: TimerButtonProps) {
  const { active, start } = useStudyTimer();
  const here = active !== null && active.subjectId === subjectId && active.lessonIndex === lessonIndex;
  const now = useNow(here && active.startedAt !== null);

  if (here) {
    return (
      <span className="text-accent-text flex items-center gap-1 font-semibold tabular-nums">
        <Timer size={13} aria-hidden />
        {active.startedAt === null ? "pausado" : "estudando"} {formatClock(elapsedMs(active, now))}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => start(subjectId, lessonIndex)}
      disabled={active !== null}
      title={active ? "Pare o cronômetro que está ligado antes" : "Cronometrar o estudo desta aula"}
      className="border-line text-muted hover:border-accent-text/50 hover:text-ink flex items-center gap-1 rounded-md border px-1.5 py-0.5 font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40"
    >
      <Timer size={12} aria-hidden />
      Cronometrar
    </button>
  );
}

interface TimerBarProps {
  active: TimerState | null;
  update: (next: TimerState | null) => void;
  onSave: (subjectId: string, lessonIndex: number | null, minutes: number) => void;
}

/**
 * Barra do cronômetro ligado, presa acima das abas do rodapé (no computador,
 * no canto da tela). Ao parar, pergunta quantos minutos gravar — já vem com o
 * tempo contado, e dá para corrigir se o cronômetro ficou ligado à toa.
 */
export function TimerBar({ active, update, onSave }: TimerBarProps) {
  const running = active !== null && active.startedAt !== null;
  const now = useNow(running);
  const [stopping, setStopping] = useState(false);
  const [minutes, setMinutes] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!active) return null;
  const ms = elapsedMs(active, now);
  const { subject, lesson } = timerLabel(active.subjectId, active.lessonIndex);

  const pause = () => update({ ...active, startedAt: null, elapsed: ms });
  const resume = () => {
    setStopping(false);
    update({ ...active, startedAt: Date.now() });
  };

  function stop() {
    pause();
    setMinutes(String(Math.min(MAX_SESSION_MINUTES, Math.max(1, Math.round(ms / 60000)))));
    setError(null);
    setStopping(true);
  }

  function save(event: FormEvent) {
    event.preventDefault();
    const value = Number(minutes);
    if (!Number.isInteger(value) || value < 1 || value > MAX_SESSION_MINUTES) {
      setError(`Entre 1 e ${MAX_SESSION_MINUTES} minutos.`);
      return;
    }
    if (!active) return;
    onSave(active.subjectId, active.lessonIndex, value);
    setStopping(false);
    update(null);
  }

  function discard() {
    setStopping(false);
    update(null);
  }

  const iconButton =
    "border-line hover:border-accent-text/50 flex size-9 shrink-0 items-center justify-center rounded-xl border transition-colors";

  return (
    <div
      role="region"
      aria-label="Cronômetro de estudo"
      className="bg-surface border-accent-text/40 fixed inset-x-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-30 mx-auto max-w-md rounded-2xl border p-3 shadow-2xl shadow-black/30 lg:inset-x-auto lg:right-6 lg:bottom-6 lg:w-96"
    >
      <div className="flex items-center gap-3">
        <span className="bg-accent-soft text-accent-text flex size-9 shrink-0 items-center justify-center rounded-xl">
          <Timer size={17} aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="text-muted block truncate text-xs font-medium">{subject}</span>
          <span className="block truncate text-sm font-semibold">{lesson ?? "Estudo livre"}</span>
        </span>
        <span className="text-xl font-extrabold tabular-nums">{formatClock(ms)}</span>
        {!stopping && (
          <>
            <button
              type="button"
              onClick={running ? pause : resume}
              aria-label={running ? "Pausar" : "Continuar"}
              className={iconButton}
            >
              {running ? <Pause size={15} aria-hidden /> : <Play size={15} aria-hidden />}
            </button>
            <button type="button" onClick={stop} aria-label="Parar e salvar" className={iconButton}>
              <Square size={13} aria-hidden />
            </button>
          </>
        )}
      </div>

      {stopping && (
        <form
          onSubmit={save}
          noValidate
          className="border-line mt-3 flex flex-wrap items-center gap-2 border-t pt-3 text-sm"
        >
          <label className="flex items-center gap-2">
            <span className="font-medium">Salvar</span>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={MAX_SESSION_MINUTES}
              value={minutes}
              autoFocus
              onChange={(e) => setMinutes(e.target.value)}
              className="bg-frame border-line focus:border-accent-text w-20 rounded-lg border px-2 py-1.5 tabular-nums outline-none"
            />
            <span className="text-muted">min</span>
          </label>
          <button
            type="submit"
            className="bg-accent text-on-accent hover:bg-accent-hover ml-auto rounded-xl px-3 py-1.5 font-semibold transition-colors"
          >
            Salvar
          </button>
          <button
            type="button"
            onClick={resume}
            className="text-muted hover:text-ink rounded-xl px-2 py-1.5 font-semibold"
          >
            Continuar
          </button>
          <button
            type="button"
            onClick={discard}
            aria-label="Descartar o tempo"
            title="Descartar o tempo"
            className="text-muted hover:text-danger rounded-xl p-1.5"
          >
            <X size={16} aria-hidden />
          </button>
          {error && (
            <p role="alert" className="text-danger w-full text-xs font-medium">
              {error}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
