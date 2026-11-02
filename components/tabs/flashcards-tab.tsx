"use client";

import { Download, FileUp, Pencil, Play, Plus, Trash2, Upload } from "lucide-react";
import { useId, useMemo, useState, type ChangeEvent, type FormEvent } from "react";

import { formatShortDate, fromIsoDate } from "@/lib/date";
import {
  flashcardTemplate,
  MAX_IMPORT_BYTES,
  MAX_IMPORT_CARDS,
  parseFlashcardCsv,
  type ImportedCard,
  type ImportResult,
} from "@/lib/flashcard-csv";
import {
  dueFlashcards,
  flashcardError,
  gradeIntervals,
  MAX_BACK_LENGTH,
  MAX_FRONT_LENGTH,
  type FlashcardGrade,
} from "@/lib/flashcards";
import { PENDING_ID_PREFIX } from "@/lib/questions";
import { findSubject, SUBJECTS, topicCode } from "@/lib/subjects";
import type { Flashcard } from "@/lib/types";

interface FlashcardsTabProps {
  cards: Flashcard[];
  todayDate: string;
  onAdd: (subjectId: string, topicIndex: number | null, front: string, back: string) => void;
  onUpdate: (id: string, subjectId: string, topicIndex: number | null, front: string, back: string) => void;
  onReview: (id: string, grade: FlashcardGrade) => void;
  onDelete: (id: string) => void;
  onImport: (cards: Omit<ImportedCard, "line">[]) => void;
}

const ALL = "";
const selectClass =
  "bg-surface border-line focus:border-accent-text rounded-xl border px-3 py-2 text-sm outline-none";

export function FlashcardsTab({
  cards,
  todayDate,
  onAdd,
  onUpdate,
  onReview,
  onDelete,
  onImport,
}: FlashcardsTabProps) {
  const [subject, setSubject] = useState(ALL);
  const [mode, setMode] = useState<"list" | "study" | "new" | "import">("list");
  const [editing, setEditing] = useState<string | null>(null);

  const filtered = useMemo(
    () => (subject ? cards.filter((c) => c.subjectId === subject) : cards),
    [cards, subject],
  );
  const due = useMemo(() => dueFlashcards(filtered, todayDate), [filtered, todayDate]);
  const subjectsWithCards = SUBJECTS.filter((s) => cards.some((c) => c.subjectId === s.id));

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-accent-text text-xs font-semibold tracking-wider uppercase">
            {due.length === 0
              ? "Nada para revisar hoje"
              : `${due.length} cartão${due.length > 1 ? "ões" : ""} para revisar hoje`}
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Flashcards</h1>
        </div>
        {mode === "list" && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setMode("new")}
              className="border-line text-ink hover:border-accent-text/50 flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors"
            >
              <Plus size={16} aria-hidden />
              Novo cartão
            </button>
            <button
              type="button"
              onClick={() => setMode("import")}
              className="border-line text-ink hover:border-accent-text/50 flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors"
            >
              <Upload size={16} aria-hidden />
              Importar
            </button>
            <button
              type="button"
              onClick={() => setMode("study")}
              disabled={due.length === 0}
              className="bg-accent text-on-accent hover:bg-accent-hover flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Play size={16} aria-hidden />
              Estudar
            </button>
          </div>
        )}
      </div>

      {mode === "import" && (
        <ImportPanel
          onCancel={() => setMode("list")}
          onImport={(imported) => {
            onImport(imported);
            setMode("list");
          }}
        />
      )}

      {(mode === "list" || mode === "study") && (
        <select
          aria-label="Filtrar por matéria"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className={`${selectClass} w-fit`}
          disabled={mode === "study"}
        >
          <option value={ALL}>Todas as matérias</option>
          {subjectsWithCards.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      )}

      {mode === "new" && (
        <CardForm
          submitLabel="Criar cartão"
          initialSubject={subject || SUBJECTS[0].id}
          onCancel={() => setMode("list")}
          onSubmit={(s, t, f, b) => {
            onAdd(s, t, f, b);
            setMode("list");
          }}
        />
      )}

      {mode === "study" && (
        <StudySession
          // Fila congelada ao começar: respostas reagendam os cartões, mas a sessão segue a mesma lista.
          queueIds={due.map((c) => c.id)}
          cards={cards}
          onReview={onReview}
          onClose={() => setMode("list")}
        />
      )}

      {mode === "list" &&
        (filtered.length === 0 ? (
          <div className="border-line text-muted rounded-2xl border border-dashed p-6 text-center text-sm">
            Nenhum cartão ainda. Crie cartões com o que você mais esquece: um conceito na frente, a
            resposta no verso.
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {filtered.map((card) =>
              editing === card.id ? (
                <li key={card.id}>
                  <CardForm
                    submitLabel="Salvar"
                    initialSubject={card.subjectId}
                    initial={card}
                    onCancel={() => setEditing(null)}
                    onSubmit={(s, t, f, b) => {
                      onUpdate(card.id, s, t, f, b);
                      setEditing(null);
                    }}
                  />
                </li>
              ) : (
                <CardRow
                  key={card.id}
                  card={card}
                  todayDate={todayDate}
                  onEdit={() => setEditing(card.id)}
                  onDelete={() => onDelete(card.id)}
                />
              ),
            )}
          </ul>
        ))}
    </div>
  );
}

function CardRow({
  card,
  todayDate,
  onEdit,
  onDelete,
}: {
  card: Flashcard;
  todayDate: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const subject = findSubject(card.subjectId);
  const pending = card.id.startsWith(PENDING_ID_PREFIX);

  return (
    <li className="bg-surface border-line rounded-xl border">
      <div className="flex items-start gap-3 px-4 py-3 text-sm">
        <div className="min-w-0 flex-1">
          <p className="text-muted flex items-center gap-2 text-xs">
            {subject && card.topicIndex !== null && (
              <span className="text-accent-text font-mono text-[0.7rem]">
                {topicCode(subject, card.topicIndex)}
              </span>
            )}
            <span className="truncate">{subject?.name}</span>
            <span className="shrink-0 tabular-nums">
              · {card.dueOn <= todayDate ? "revisa hoje" : `revisa em ${formatShortDate(fromIsoDate(card.dueOn))}`}
            </span>
          </p>
          <p className="mt-0.5 line-clamp-2 font-medium whitespace-pre-line">{card.front}</p>
        </div>
        <button
          type="button"
          onClick={onEdit}
          disabled={pending}
          aria-label="Editar cartão"
          className="text-muted hover:text-ink shrink-0 p-1 disabled:opacity-30"
        >
          <Pencil size={15} aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => setConfirming(true)}
          disabled={pending}
          aria-label="Apagar cartão"
          className="text-muted hover:text-danger shrink-0 p-1 disabled:opacity-30"
        >
          <Trash2 size={15} aria-hidden />
        </button>
      </div>
      {confirming && (
        <div
          role="alertdialog"
          aria-label="Confirmar exclusão"
          className="border-line flex flex-wrap items-center gap-2 border-t px-4 py-3 text-sm"
        >
          <span className="flex-1 font-medium">Apagar este cartão?</span>
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
            onClick={onDelete}
            className="border-danger/40 text-danger hover:bg-danger/10 rounded-xl border px-3 py-1.5 font-semibold transition-colors"
          >
            Apagar
          </button>
        </div>
      )}
    </li>
  );
}

interface CardFormProps {
  submitLabel: string;
  initialSubject: string;
  initial?: Flashcard;
  onSubmit: (subjectId: string, topicIndex: number | null, front: string, back: string) => void;
  onCancel: () => void;
}

function CardForm({ submitLabel, initialSubject, initial, onSubmit, onCancel }: CardFormProps) {
  const id = useId();
  const [subjectId, setSubjectId] = useState(initialSubject);
  const [topic, setTopic] = useState(initial?.topicIndex === null || !initial ? "" : String(initial.topicIndex));
  const [front, setFront] = useState(initial?.front ?? "");
  const [back, setBack] = useState(initial?.back ?? "");
  const [error, setError] = useState<string | null>(null);
  const subject = findSubject(subjectId);

  function submit(event: FormEvent) {
    event.preventDefault();
    const topicIndex = topic === "" ? null : Number(topic);
    const invalid = flashcardError(subjectId, topicIndex, front, back);
    if (invalid) {
      setError(invalid);
      return;
    }
    onSubmit(subjectId, topicIndex, front, back);
  }

  const fieldClass =
    "bg-frame border-line focus:border-accent-text w-full rounded-xl border px-3 py-2 text-sm outline-none";

  return (
    <form onSubmit={submit} noValidate className="bg-surface border-line flex flex-col gap-3 rounded-2xl border p-4 text-sm">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1" htmlFor={`${id}-subject`}>
          <span className="text-muted text-xs font-medium">Matéria</span>
          <select
            id={`${id}-subject`}
            value={subjectId}
            onChange={(e) => {
              setSubjectId(e.target.value);
              setTopic("");
            }}
            className={fieldClass}
          >
            {SUBJECTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1" htmlFor={`${id}-topic`}>
          <span className="text-muted text-xs font-medium">Tópico (opcional)</span>
          <select id={`${id}-topic`} value={topic} onChange={(e) => setTopic(e.target.value)} className={fieldClass}>
            <option value="">Sem tópico</option>
            {subject?.topics.map((t, i) => (
              <option key={i} value={i}>
                {topicCode(subject, i)} · {t.slice(0, 60)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="flex flex-col gap-1" htmlFor={`${id}-front`}>
        <span className="text-muted text-xs font-medium">Frente (pergunta)</span>
        <textarea
          id={`${id}-front`}
          rows={2}
          maxLength={MAX_FRONT_LENGTH}
          value={front}
          onChange={(e) => setFront(e.target.value)}
          className={fieldClass}
        />
      </label>
      <label className="flex flex-col gap-1" htmlFor={`${id}-back`}>
        <span className="text-muted text-xs font-medium">Verso (resposta)</span>
        <textarea
          id={`${id}-back`}
          rows={3}
          maxLength={MAX_BACK_LENGTH}
          value={back}
          onChange={(e) => setBack(e.target.value)}
          className={fieldClass}
        />
      </label>
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
          {submitLabel}
        </button>
        <button type="button" onClick={onCancel} className="text-muted hover:text-ink rounded-xl px-3 py-2 font-semibold">
          Cancelar
        </button>
      </div>
    </form>
  );
}

const GRADE_LABELS: Record<FlashcardGrade, string> = {
  again: "Errei",
  hard: "Difícil",
  good: "Bom",
  easy: "Fácil",
};

function intervalText(days: number): string {
  if (days === 0) return "de novo agora";
  if (days === 1) return "amanhã";
  if (days < 30) return `em ${days} dias`;
  const months = Math.round(days / 30);
  return `em ${months} ${months > 1 ? "meses" : "mês"}`;
}

interface StudySessionProps {
  queueIds: string[];
  cards: Flashcard[];
  onReview: (id: string, grade: FlashcardGrade) => void;
  onClose: () => void;
}

/**
 * Sessão de revisão: frente, "Mostrar resposta", e a resposta escolhe quando o
 * cartão volta. "Errei" põe o cartão de novo no fim da fila desta sessão.
 */
function StudySession({ queueIds, cards, onReview, onClose }: StudySessionProps) {
  const [queue, setQueue] = useState(queueIds);
  const [revealed, setRevealed] = useState(false);
  const [reviewed, setReviewed] = useState(0);

  const card = cards.find((c) => c.id === queue[0]);

  if (!card) {
    return (
      <div className="bg-surface border-line flex flex-col items-center gap-3 rounded-2xl border p-8 text-center">
        <p className="text-lg font-bold">Revisão concluída</p>
        <p className="text-muted text-sm">
          {reviewed} resposta{reviewed === 1 ? "" : "s"} nesta sessão. Os cartões voltam na data que cada
          resposta marcou.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="bg-accent text-on-accent hover:bg-accent-hover rounded-xl px-4 py-2 text-sm font-semibold"
        >
          Voltar aos cartões
        </button>
      </div>
    );
  }

  const subject = findSubject(card.subjectId);
  const intervals = gradeIntervals(card);

  function answer(grade: FlashcardGrade) {
    if (!card) return;
    onReview(card.id, grade);
    setReviewed((n) => n + 1);
    setRevealed(false);
    setQueue((q) => (grade === "again" ? [...q.slice(1), q[0]] : q.slice(1)));
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="text-muted flex items-center justify-between text-xs tabular-nums">
        <span>
          {subject?.name}
          {subject && card.topicIndex !== null && ` · ${topicCode(subject, card.topicIndex)}`}
        </span>
        <span>
          {queue.length} na fila
          <button type="button" onClick={onClose} className="text-accent-text hover:text-ink ml-3 font-semibold">
            Sair
          </button>
        </span>
      </div>

      <div className="bg-surface border-line rounded-2xl border p-6">
        <p className="text-muted mb-2 text-xs font-semibold tracking-wider uppercase">Frente</p>
        <p className="text-lg leading-snug font-semibold whitespace-pre-line">{card.front}</p>
        {revealed && (
          <>
            <hr className="border-line my-5" />
            <p className="text-muted mb-2 text-xs font-semibold tracking-wider uppercase">Verso</p>
            <p className="leading-relaxed whitespace-pre-line">{card.back}</p>
          </>
        )}
      </div>

      {revealed ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(["again", "hard", "good", "easy"] as const).map((grade) => (
            <button
              key={grade}
              type="button"
              onClick={() => answer(grade)}
              className={`flex flex-col items-center rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors ${
                grade === "good"
                  ? "bg-accent text-on-accent hover:bg-accent-hover border-accent"
                  : "border-line hover:border-accent-text/50"
              }`}
            >
              {GRADE_LABELS[grade]}
              <span className={`text-xs font-medium ${grade === "good" ? "text-on-accent/80" : "text-muted"}`}>
                {intervalText(intervals[grade])}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <button
          type="button"
          autoFocus
          onClick={() => setRevealed(true)}
          className="bg-accent text-on-accent hover:bg-accent-hover rounded-xl px-4 py-3 text-sm font-semibold"
        >
          Mostrar resposta
        </button>
      )}
    </div>
  );
}

/** Baixa o modelo CSV. */
function downloadTemplate() {
  const url = URL.createObjectURL(new Blob([flashcardTemplate()], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "modelo-flashcards.csv";
  link.click();
  URL.revokeObjectURL(url);
}

interface ImportPanelProps {
  onImport: (cards: Omit<ImportedCard, "line">[]) => void;
  onCancel: () => void;
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/**
 * Importação em dois passos: baixar o modelo (uma linha por tópico, com
 * matéria e código já preenchidos) e enviar a planilha preenchida. Antes de
 * criar, mostra quantos cartões saem dela e as linhas com problema.
 */
function ImportPanel({ onImport, onCancel }: ImportPanelProps) {
  const id = useId();
  const [fileName, setFileName] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [readError, setReadError] = useState<string | null>(null);

  async function pick(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setFileName(file.name);
    setResult(null);
    if (file.size > MAX_IMPORT_BYTES) {
      setReadError("Arquivo grande demais para uma planilha de flashcards.");
      return;
    }
    try {
      setResult(parseFlashcardCsv(await file.text()));
      setReadError(null);
    } catch {
      setReadError("Não foi possível ler o arquivo. Salve a planilha como CSV e tente de novo.");
    }
  }

  const shownErrors = result?.errors.slice(0, 8) ?? [];
  const ready = result?.cards.length ?? 0;

  return (
    <section
      aria-label="Importar flashcards"
      className="bg-surface border-line flex flex-col gap-4 rounded-2xl border p-4 text-sm"
    >
      <div className="flex flex-col gap-2">
        <h2 className="font-bold">1. Baixe o modelo</h2>
        <p className="text-muted">
          Uma planilha com uma linha por tópico do edital, com matéria e código já preenchidos.
          Escreva a <strong className="text-ink">frente</strong> e o{" "}
          <strong className="text-ink">verso</strong> nas linhas que quiser; para mais de um cartão
          no mesmo tópico, copie a linha. Linhas sem frente e verso são ignoradas, e o tópico pode
          ficar em branco. Até {MAX_IMPORT_CARDS} cartões por vez.
        </p>
        <button
          type="button"
          onClick={downloadTemplate}
          className="border-line text-accent-text hover:border-accent-text/50 flex w-fit items-center gap-2 rounded-xl border px-3 py-2 font-semibold transition-colors"
        >
          <Download size={15} aria-hidden />
          Baixar modelo (CSV)
        </button>
      </div>

      <div className="border-line flex flex-col gap-2 border-t pt-4">
        <h2 className="font-bold">2. Envie a planilha preenchida</h2>
        <label
          htmlFor={`${id}-file`}
          className="border-line hover:border-accent-text/50 flex w-fit cursor-pointer items-center gap-2 rounded-xl border border-dashed px-3 py-2 font-semibold transition-colors"
        >
          <FileUp size={15} aria-hidden />
          {fileName ?? "Escolher arquivo .csv"}
        </label>
        <input id={`${id}-file`} type="file" accept=".csv,text/csv" onChange={pick} className="sr-only" />

        {readError && (
          <p role="alert" className="text-danger text-xs font-medium">
            {readError}
          </p>
        )}

        {result && (
          <div className="flex flex-col gap-2" aria-live="polite">
            <p className="tabular-nums">
              <span className="font-bold">{plural(ready, "cartão pronto", "cartões prontos")}</span>
              <span className="text-muted">
                {result.errors.length > 0 &&
                  ` · ${plural(result.errors.length, "linha com problema", "linhas com problema")}`}
                {result.skipped > 0 &&
                  ` · ${plural(result.skipped, "em branco ignorada", "em branco ignoradas")}`}
              </span>
            </p>
            {shownErrors.length > 0 && (
              <ul className="text-danger flex flex-col gap-0.5 text-xs">
                {shownErrors.map((e) => (
                  <li key={`${e.line}:${e.message}`}>
                    Linha {e.line}: {e.message}
                  </li>
                ))}
                {result.errors.length > shownErrors.length && (
                  <li>e mais {result.errors.length - shownErrors.length}…</li>
                )}
              </ul>
            )}
            {result.errors.length > 0 && ready > 0 && (
              <p className="text-muted text-xs">
                As linhas com problema ficam de fora. Corrija e importe só elas depois, se quiser.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          disabled={ready === 0}
          onClick={() =>
            result &&
            onImport(
              result.cards.map((card) => ({
                subjectId: card.subjectId,
                topicIndex: card.topicIndex,
                front: card.front,
                back: card.back,
              })),
            )
          }
          className="bg-accent text-on-accent hover:bg-accent-hover rounded-xl px-4 py-2 font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40"
        >
          {ready > 0 ? `Importar ${plural(ready, "cartão", "cartões")}` : "Importar"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-muted hover:text-ink rounded-xl px-3 py-2 font-semibold"
        >
          Cancelar
        </button>
      </div>
    </section>
  );
}
