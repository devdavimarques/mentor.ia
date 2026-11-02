"use client";

import {
  BarChart3,
  ChevronRight,
  Download,
  FileUp,
  Layers,
  Pause,
  Pencil,
  Play,
  Plus,
  RotateCcw,
  Search,
  Settings2,
  Trash2,
  Undo2,
  Upload,
} from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useState, type ChangeEvent, type FormEvent } from "react";

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
  deckCounts,
  decksWithCards,
  flashcardError,
  flashcardStats,
  formatNextDue,
  gradeOutcomes,
  isLeech,
  LEECH_LAPSES,
  MATURE_DAYS,
  MAX_BACK_LENGTH,
  MAX_FRONT_LENGTH,
  MAX_NEW_PER_DAY,
  MAX_REVIEWS_PER_DAY,
  nextCard,
  nextLearningDue,
  type DeckCounts,
  type DeckLimits,
  type FlashcardGrade,
} from "@/lib/flashcards";
import { PENDING_ID_PREFIX } from "@/lib/questions";
import { findSubject, SUBJECTS, topicCode } from "@/lib/subjects";
import type { Flashcard, FlashcardState } from "@/lib/types";

type CardInput = { subjectId: string; topicIndex: number | null; front: string; back: string };

interface FlashcardsTabProps {
  cards: Flashcard[];
  todayDate: string;
  limits: DeckLimits;
  onAdd: (subjectId: string, topicIndex: number | null, front: string, back: string) => void;
  onUpdate: (id: string, subjectId: string, topicIndex: number | null, front: string, back: string) => void;
  onReview: (id: string, grade: FlashcardGrade) => void;
  onDelete: (id: string) => void;
  onImport: (cards: CardInput[]) => void;
  onSuspend: (id: string, suspended: boolean) => void;
  onForget: (id: string) => void;
  onRestore: (previous: Flashcard) => void;
  onSetLimits: (newPerDay: number, reviewsPerDay: number) => void;
}

type View = "decks" | "browse" | "stats";
type Mode =
  | { kind: "view" }
  | { kind: "study"; deck: string | null }
  | { kind: "new" }
  | { kind: "import" };

const VIEWS: { id: View; label: string; icon: typeof Layers }[] = [
  { id: "decks", label: "Baralhos", icon: Layers },
  { id: "browse", label: "Navegar", icon: Search },
  { id: "stats", label: "Estatísticas", icon: BarChart3 },
];

/**
 * Flashcards no jeito do Anki: baralhos por matéria com as contagens de
 * novos, em aprendizado e para revisar; sessão com etapas em minutos, atalhos
 * de teclado e desfazer; navegador de cartões; estatísticas.
 */
export function FlashcardsTab(props: FlashcardsTabProps) {
  const { cards, todayDate, limits, onAdd, onImport } = props;
  const [view, setView] = useState<View>("decks");
  const [mode, setMode] = useState<Mode>({ kind: "view" });
  const total = deckCounts(cards, null, todayDate, limits);
  const toStudy = total.new + total.learning + total.review;

  if (mode.kind === "study") {
    return (
      <div className="max-w-3xl">
        <StudySession {...props} deck={mode.deck} onClose={() => setMode({ kind: "view" })} />
      </div>
    );
  }

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-accent-text text-xs font-semibold tracking-wider uppercase">
            {toStudy === 0 ? "Nada para estudar agora" : `${toStudy} para estudar hoje`}
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Flashcards</h1>
        </div>
        {mode.kind === "view" && (
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setMode({ kind: "new" })} className={secondaryButton}>
              <Plus size={16} aria-hidden />
              Adicionar
            </button>
            <button type="button" onClick={() => setMode({ kind: "import" })} className={secondaryButton}>
              <Upload size={16} aria-hidden />
              Importar
            </button>
            <button
              type="button"
              onClick={() => setMode({ kind: "study", deck: null })}
              disabled={toStudy === 0}
              className={primaryButton}
            >
              <Play size={16} aria-hidden />
              Estudar tudo
            </button>
          </div>
        )}
      </div>

      {mode.kind === "new" && (
        <CardForm
          submitLabel="Adicionar"
          initialSubject={SUBJECTS[0].id}
          allowReverse
          onCancel={() => setMode({ kind: "view" })}
          onSubmit={(s, t, f, b, reverse) => {
            onAdd(s, t, f, b);
            if (reverse) onAdd(s, t, b, f);
            setMode({ kind: "view" });
          }}
        />
      )}

      {mode.kind === "import" && (
        <ImportPanel
          onCancel={() => setMode({ kind: "view" })}
          onImport={(imported) => {
            onImport(imported);
            setMode({ kind: "view" });
          }}
        />
      )}

      {mode.kind === "view" && (
        <>
          <div role="tablist" aria-label="Seções dos flashcards" className="bg-surface border-line flex w-fit gap-1 rounded-xl border p-1">
            {VIEWS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={view === id}
                onClick={() => setView(id)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                  view === id ? "bg-accent text-on-accent" : "text-muted hover:text-ink"
                }`}
              >
                <Icon size={14} aria-hidden />
                {label}
              </button>
            ))}
          </div>

          {view === "decks" && (
            <DeckList {...props} onStudy={(deck) => setMode({ kind: "study", deck })} />
          )}
          {view === "browse" && <Browser {...props} />}
          {view === "stats" && <Stats cards={cards} todayDate={todayDate} />}
        </>
      )}
    </div>
  );
}

const primaryButton =
  "bg-accent text-on-accent hover:bg-accent-hover flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40";
const secondaryButton =
  "border-line text-ink hover:border-accent-text/50 flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors";
const fieldClass =
  "bg-frame border-line focus:border-accent-text w-full rounded-xl border px-3 py-2 text-sm outline-none";

/** As três contagens do Anki: novos, aprendendo e para revisar. Cor e rótulo, nunca só cor. */
function Counts({ counts, compact = false }: { counts: DeckCounts; compact?: boolean }) {
  const items = [
    { n: counts.new, label: "novos", className: "text-accent-text" },
    { n: counts.learning, label: "aprender", className: "text-danger" },
    { n: counts.review, label: "revisar", className: "text-success" },
  ];
  return (
    <span className={`flex items-baseline gap-3 tabular-nums ${compact ? "text-xs" : "text-sm"}`}>
      {items.map(({ n, label, className }) => (
        <span key={label} className={n === 0 ? "text-muted" : className}>
          <span className="font-bold">{n}</span> <span className="text-xs font-medium">{label}</span>
        </span>
      ))}
    </span>
  );
}

interface DeckListProps {
  cards: Flashcard[];
  todayDate: string;
  limits: DeckLimits;
  onStudy: (deck: string | null) => void;
  onSetLimits: (newPerDay: number, reviewsPerDay: number) => void;
}

/** Lista de baralhos (uma matéria cada), como a tela inicial do Anki. */
function DeckList({ cards, todayDate, limits, onStudy, onSetLimits }: DeckListProps) {
  const [options, setOptions] = useState(false);
  const decks = decksWithCards(cards);

  if (cards.length === 0) {
    return (
      <div className="border-line text-muted rounded-2xl border border-dashed p-6 text-center text-sm">
        Nenhum cartão ainda. Adicione cartões com o que você mais esquece (um conceito na frente, a
        resposta no verso) ou importe uma planilha.
      </div>
    );
  }

  const rows = [
    { id: null, name: "Todos os baralhos", total: cards.length },
    ...decks.map((s) => ({ id: s.id, name: s.name, total: cards.filter((c) => c.subjectId === s.id).length })),
  ];

  return (
    <section aria-label="Baralhos" className="flex flex-col gap-3">
      <ul className="bg-surface border-line divide-line divide-y rounded-2xl border">
        {rows.map((row) => {
          const counts = deckCounts(cards, row.id, todayDate, limits);
          const empty = counts.new + counts.learning + counts.review === 0;
          return (
            <li key={row.id ?? "all"}>
              <button
                type="button"
                onClick={() => onStudy(row.id)}
                disabled={empty}
                className="hover:bg-surface-alt flex w-full flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-left text-sm transition-colors first:rounded-t-2xl last:rounded-b-2xl disabled:cursor-default disabled:hover:bg-transparent"
              >
                <span className="min-w-0 flex-1 basis-40">
                  <span className={`block truncate ${row.id === null ? "font-bold" : "font-semibold"}`}>
                    {row.name}
                  </span>
                  <span className="text-muted text-xs tabular-nums">
                    {row.total} cart{row.total === 1 ? "ão" : "ões"}
                  </span>
                </span>
                <Counts counts={counts} />
                <ChevronRight size={16} aria-hidden className={empty ? "text-line" : "text-muted"} />
              </button>
            </li>
          );
        })}
      </ul>

      <div className="text-muted flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="tabular-nums">
          Limite diário: {limits.newPerDay} novos e {limits.reviewsPerDay} revisões.
        </span>
        <button
          type="button"
          onClick={() => setOptions((v) => !v)}
          aria-expanded={options}
          className="text-accent-text hover:text-ink flex items-center gap-1 font-semibold"
        >
          <Settings2 size={13} aria-hidden />
          Opções
        </button>
      </div>
      {options && (
        <LimitsForm
          limits={limits}
          onSave={(n, r) => {
            onSetLimits(n, r);
            setOptions(false);
          }}
          onCancel={() => setOptions(false)}
        />
      )}
    </section>
  );
}

function LimitsForm({
  limits,
  onSave,
  onCancel,
}: {
  limits: DeckLimits;
  onSave: (newPerDay: number, reviewsPerDay: number) => void;
  onCancel: () => void;
}) {
  const [fresh, setFresh] = useState(String(limits.newPerDay));
  const [reviews, setReviews] = useState(String(limits.reviewsPerDay));
  const [error, setError] = useState<string | null>(null);

  function submit(event: FormEvent) {
    event.preventDefault();
    const n = Number(fresh);
    const r = Number(reviews);
    if (!Number.isInteger(n) || n < 0 || n > MAX_NEW_PER_DAY) {
      setError(`Novos por dia: de 0 a ${MAX_NEW_PER_DAY}.`);
      return;
    }
    if (!Number.isInteger(r) || r < 1 || r > MAX_REVIEWS_PER_DAY) {
      setError(`Revisões por dia: de 1 a ${MAX_REVIEWS_PER_DAY}.`);
      return;
    }
    onSave(n, r);
  }

  return (
    <form onSubmit={submit} noValidate className="bg-surface border-line flex flex-wrap items-end gap-3 rounded-2xl border p-4 text-sm">
      <label className="flex flex-col gap-1">
        <span className="text-muted text-xs font-medium">Novos por dia</span>
        <input type="number" inputMode="numeric" min={0} max={MAX_NEW_PER_DAY} value={fresh} onChange={(e) => setFresh(e.target.value)} className={`${fieldClass} w-24 tabular-nums`} />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-muted text-xs font-medium">Revisões por dia</span>
        <input type="number" inputMode="numeric" min={1} max={MAX_REVIEWS_PER_DAY} value={reviews} onChange={(e) => setReviews(e.target.value)} className={`${fieldClass} w-24 tabular-nums`} />
      </label>
      <button type="submit" className="bg-accent text-on-accent hover:bg-accent-hover rounded-xl px-4 py-2 font-semibold transition-colors">
        Salvar
      </button>
      <button type="button" onClick={onCancel} className="text-muted hover:text-ink rounded-xl px-3 py-2 font-semibold">
        Cancelar
      </button>
      <p className="text-muted w-full text-xs">
        Como no Anki: 20 novos por dia é um bom começo. Cada novo gera revisões nos dias seguintes,
        então subir muito os novos enche a fila depois.
      </p>
      {error && (
        <p role="alert" className="text-danger w-full text-xs font-medium">
          {error}
        </p>
      )}
    </form>
  );
}

const GRADE_LABELS: Record<FlashcardGrade, string> = {
  again: "Errei",
  hard: "Difícil",
  good: "Bom",
  easy: "Fácil",
};
const GRADE_KEYS: Record<FlashcardGrade, string> = { again: "1", hard: "2", good: "3", easy: "4" };
const GRADES: readonly FlashcardGrade[] = ["again", "hard", "good", "easy"];
/** Quantas respostas dá para desfazer em sequência. */
const UNDO_DEPTH = 20;

/** Atualiza `now` a cada 15 s: cartões em aprendizado vencem com o relógio. */
function useClock(): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 15_000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

interface StudySessionProps extends FlashcardsTabProps {
  deck: string | null;
  onClose: () => void;
}

/**
 * Sessão de estudo do Anki: a frente, "Mostrar resposta" e quatro respostas,
 * cada uma com o tempo até o cartão voltar. A ordem é a do Anki (aprendizado
 * vencido, revisões, novos). Atalhos: Espaço/Enter mostra e responde Bom,
 * 1–4 respondem, Z desfaz, E edita, @ suspende.
 */
function StudySession({
  cards,
  todayDate,
  limits,
  deck,
  onReview,
  onRestore,
  onUpdate,
  onSuspend,
  onClose,
}: StudySessionProps) {
  const clock = useClock();
  const [now, setNow] = useState(clock);
  if (clock > now) setNow(clock);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [editing, setEditing] = useState(false);
  const [history, setHistory] = useState<Flashcard[]>([]);
  const [answered, setAnswered] = useState(0);

  // O cartão na tela fica fixo até ser respondido, mesmo que outro vença no meio.
  const pinned = currentId ? cards.find((c) => c.id === currentId && !c.suspended) : undefined;
  const card = pinned ?? nextCard(cards, deck, todayDate, now, limits) ?? undefined;
  if ((card?.id ?? null) !== currentId) setCurrentId(card?.id ?? null);

  const counts = deckCounts(cards, deck, todayDate, limits);
  const deckName = deck ? findSubject(deck)?.name ?? "Baralho" : "Todos os baralhos";

  const answer = useCallback(
    (grade: FlashcardGrade) => {
      if (!card || !revealed) return;
      setHistory((h) => [...h.slice(-(UNDO_DEPTH - 1)), card]);
      onReview(card.id, grade);
      setAnswered((n) => n + 1);
      setRevealed(false);
      setCurrentId(null);
      setNow(Date.now());
    },
    [card, revealed, onReview],
  );

  const undo = useCallback(() => {
    const previous = history[history.length - 1];
    if (!previous) return;
    onRestore(previous);
    setHistory((h) => h.slice(0, -1));
    setAnswered((n) => Math.max(0, n - 1));
    setCurrentId(previous.id);
    setRevealed(true);
  }, [history, onRestore]);

  const suspend = useCallback(() => {
    if (!card) return;
    onSuspend(card.id, true);
    setRevealed(false);
    setCurrentId(null);
  }, [card, onSuspend]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (editing || event.altKey || event.metaKey) return;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      const key = event.key;
      // Z ou Ctrl+Z, como no Anki.
      if (key.toLowerCase() === "z") {
        event.preventDefault();
        undo();
        return;
      }
      if (event.ctrlKey) return;
      if (key === " " || key === "Enter") {
        // Botão focado já trata o Enter/Espaço dele.
        if (target?.tagName === "BUTTON") return;
        event.preventDefault();
        if (!revealed) setRevealed(true);
        else answer("good");
      } else if (revealed && ["1", "2", "3", "4"].includes(key)) {
        answer(GRADES[Number(key) - 1]);
      } else if (key.toLowerCase() === "e" && card) {
        setEditing(true);
      } else if (key === "@") {
        suspend();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [answer, undo, suspend, revealed, editing, card]);

  const header = (
    <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
      <span className="min-w-0">
        <span className="block truncate font-bold">{deckName}</span>
        <Counts counts={counts} compact />
      </span>
      <span className="flex items-center gap-1">
        <button
          type="button"
          onClick={undo}
          disabled={history.length === 0}
          title="Desfazer a última resposta (Z)"
          className="text-muted hover:text-ink flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold disabled:opacity-30"
        >
          <Undo2 size={14} aria-hidden />
          Desfazer
        </button>
        <button type="button" onClick={onClose} className="text-accent-text hover:text-ink rounded-lg px-2 py-1 text-xs font-semibold">
          Sair
        </button>
      </span>
    </div>
  );

  if (!card) {
    const nextDue = nextLearningDue(cards, deck);
    const waiting = nextDue !== null;
    return (
      <div className="flex flex-col gap-3">
        {header}
        <div className="bg-surface border-line flex flex-col items-center gap-3 rounded-2xl border p-8 text-center">
          <p className="text-lg font-bold">{waiting ? "Nada para agora" : "Parabéns! Baralho concluído por hoje."}</p>
          <p className="text-muted text-sm">
            {waiting
              ? `Os cartões em aprendizado voltam às ${new Date(nextDue).toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}. Deixe esta tela aberta ou volte depois.`
              : `${answered} resposta${answered === 1 ? "" : "s"} nesta sessão. O limite de novos e revisões de hoje foi cumprido ou não há mais cartões vencidos.`}
          </p>
          <button type="button" onClick={onClose} className={primaryButton}>
            Voltar aos baralhos
          </button>
        </div>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-3">
        {header}
        <CardForm
          submitLabel="Salvar"
          initialSubject={card.subjectId}
          initial={card}
          onCancel={() => setEditing(false)}
          onSubmit={(s, t, f, b) => {
            onUpdate(card.id, s, t, f, b);
            setEditing(false);
          }}
        />
      </div>
    );
  }

  const subject = findSubject(card.subjectId);
  const outcomes = gradeOutcomes(card, todayDate, now);

  return (
    <div className="flex flex-col gap-3">
      {header}

      <div className="bg-surface border-line min-h-56 rounded-2xl border p-6">
        <p className="text-muted mb-3 flex flex-wrap items-center gap-2 text-xs">
          <StateTag card={card} />
          <span className="truncate">
            {subject?.name}
            {subject && card.topicIndex !== null && ` · ${topicCode(subject, card.topicIndex)}`}
          </span>
        </p>
        <p className="text-center text-xl leading-snug font-semibold whitespace-pre-line">{card.front}</p>
        {revealed && (
          <>
            <hr className="border-line my-5" />
            <p className="text-center leading-relaxed whitespace-pre-line">{card.back}</p>
          </>
        )}
      </div>

      {revealed ? (
        <div className="grid grid-cols-4 gap-2">
          {GRADES.map((grade) => (
            <button
              key={grade}
              type="button"
              onClick={() => answer(grade)}
              title={`Atalho: ${GRADE_KEYS[grade]}`}
              className={`flex flex-col items-center gap-0.5 rounded-xl border px-1 py-2.5 text-sm font-semibold transition-colors ${
                grade === "good"
                  ? "bg-accent text-on-accent hover:bg-accent-hover border-accent"
                  : grade === "again"
                    ? "border-danger/40 text-danger hover:bg-danger/10"
                    : "border-line hover:border-accent-text/50"
              }`}
            >
              <span className={`text-xs font-medium tabular-nums ${grade === "good" ? "text-on-accent/80" : "text-muted"}`}>
                {formatNextDue(outcomes[grade])}
              </span>
              {GRADE_LABELS[grade]}
            </button>
          ))}
        </div>
      ) : (
        <button type="button" autoFocus onClick={() => setRevealed(true)} className={`${primaryButton} justify-center py-3`}>
          Mostrar resposta
        </button>
      )}

      <div className="text-muted flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="hidden sm:inline">
          Atalhos: Espaço mostra/Bom · 1–4 respondem · Z desfaz · E edita · @ suspende
        </span>
        <span className="flex gap-1">
          <button type="button" onClick={() => setEditing(true)} className="hover:text-ink flex items-center gap-1 rounded-lg px-2 py-1 font-semibold">
            <Pencil size={13} aria-hidden />
            Editar
          </button>
          <button type="button" onClick={suspend} className="hover:text-ink flex items-center gap-1 rounded-lg px-2 py-1 font-semibold">
            <Pause size={13} aria-hidden />
            Suspender
          </button>
        </span>
      </div>
    </div>
  );
}

const STATE_LABELS: Record<FlashcardState, string> = {
  new: "novo",
  learning: "aprendendo",
  relearning: "reaprendendo",
  review: "revisão",
};

function StateTag({ card }: { card: Flashcard }) {
  const tone = card.suspended
    ? "border-line text-muted"
    : card.state === "new"
      ? "border-accent-text/40 text-accent-text"
      : card.state === "review"
        ? "border-success/40 text-success"
        : "border-danger/40 text-danger";
  return (
    <span className="flex items-center gap-1">
      <span className={`rounded-md border px-1.5 py-0.5 text-[0.7rem] font-semibold ${tone}`}>
        {card.suspended ? "suspenso" : STATE_LABELS[card.state]}
      </span>
      {isLeech(card) && (
        <span className="border-danger/40 text-danger rounded-md border px-1.5 py-0.5 text-[0.7rem] font-semibold">
          sanguessuga
        </span>
      )}
    </span>
  );
}

type Filter = "all" | "new" | "learning" | "review" | "suspended" | "leech";
const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "new", label: "Novos" },
  { id: "learning", label: "Aprendendo" },
  { id: "review", label: "Revisão" },
  { id: "suspended", label: "Suspensos" },
  { id: "leech", label: "Sanguessugas" },
];
const matchesFilter = (c: Flashcard, f: Filter) =>
  f === "all"
    ? true
    : f === "suspended"
      ? c.suspended
      : f === "leech"
        ? isLeech(c)
        : f === "learning"
          ? c.state === "learning" || c.state === "relearning"
          : c.state === f;
/** Quantos cartões o navegador desenha de uma vez. */
const BROWSE_PAGE = 100;

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Navegador de cartões: busca, filtros e as ações do Anki em cada cartão. */
function Browser({ cards, todayDate, onUpdate, onDelete, onSuspend, onForget }: FlashcardsTabProps) {
  const [query, setQuery] = useState("");
  const [deck, setDeck] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [shown, setShown] = useState(BROWSE_PAGE);
  const [editing, setEditing] = useState<string | null>(null);
  const decks = decksWithCards(cards);

  const results = useMemo(() => {
    const q = norm(query.trim());
    return cards.filter(
      (c) =>
        (!deck || c.subjectId === deck) &&
        matchesFilter(c, filter) &&
        (!q || norm(c.front).includes(q) || norm(c.back).includes(q)),
    );
  }, [cards, query, deck, filter]);

  return (
    <section aria-label="Navegar pelos cartões" className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <label className="relative min-w-0 flex-1 basis-56">
          <span className="sr-only">Buscar na frente e no verso</span>
          <Search size={15} aria-hidden className="text-muted absolute top-1/2 left-3 -translate-y-1/2" />
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShown(BROWSE_PAGE);
            }}
            placeholder="Buscar na frente e no verso"
            className={`${fieldClass} pl-9`}
          />
        </label>
        <select aria-label="Baralho" value={deck} onChange={(e) => setDeck(e.target.value)} className={`${fieldClass} w-auto`}>
          <option value="">Todos os baralhos</option>
          {decks.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrar por estado">
        {FILTERS.map(({ id, label }) => {
          const n = cards.filter((c) => (!deck || c.subjectId === deck) && matchesFilter(c, id)).length;
          return (
            <button
              key={id}
              type="button"
              aria-pressed={filter === id}
              onClick={() => setFilter(id)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold tabular-nums transition-colors ${
                filter === id ? "bg-accent text-on-accent border-accent" : "border-line text-muted hover:text-ink"
              }`}
            >
              {label} {n}
            </button>
          );
        })}
      </div>

      {results.length === 0 ? (
        <div className="border-line text-muted rounded-2xl border border-dashed p-6 text-center text-sm">
          Nenhum cartão com esse filtro.
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {results.slice(0, shown).map((card) =>
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
                onSuspend={() => onSuspend(card.id, !card.suspended)}
                onForget={() => onForget(card.id)}
              />
            ),
          )}
        </ul>
      )}
      {results.length > shown && (
        <button type="button" onClick={() => setShown((n) => n + BROWSE_PAGE)} className={`${secondaryButton} w-fit self-center`}>
          Mostrar mais ({results.length - shown})
        </button>
      )}
    </section>
  );
}

function dueText(card: Flashcard, todayDate: string): string {
  if (card.state === "new") return "ainda não estudado";
  if (card.state !== "review") return "em aprendizado hoje";
  if (card.dueOn <= todayDate) return "revisa hoje";
  return `revisa em ${formatShortDate(fromIsoDate(card.dueOn))}`;
}

interface CardRowProps {
  card: Flashcard;
  todayDate: string;
  onEdit: () => void;
  onDelete: () => void;
  onSuspend: () => void;
  onForget: () => void;
}

function CardRow({ card, todayDate, onEdit, onDelete, onSuspend, onForget }: CardRowProps) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState<"delete" | "forget" | null>(null);
  const subject = findSubject(card.subjectId);
  const pending = card.id.startsWith(PENDING_ID_PREFIX);
  const action =
    "text-muted hover:text-ink flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold disabled:opacity-30";

  return (
    <li className={`bg-surface border-line rounded-xl border ${card.suspended ? "opacity-70" : ""}`}>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="w-full px-4 py-3 text-left text-sm">
        <span className="text-muted flex flex-wrap items-center gap-2 text-xs">
          <StateTag card={card} />
          {subject && card.topicIndex !== null && (
            <span className="text-accent-text font-mono text-[0.7rem]">{topicCode(subject, card.topicIndex)}</span>
          )}
          <span className="truncate">{subject?.name}</span>
          <span className="shrink-0 tabular-nums">· {dueText(card, todayDate)}</span>
        </span>
        <span className="mt-1 line-clamp-2 block font-medium whitespace-pre-line">{card.front}</span>
        {open && <span className="text-muted mt-2 block whitespace-pre-line">{card.back}</span>}
      </button>

      {open && (
        <div className="border-line border-t px-4 py-2.5">
          <p className="text-muted mb-2 text-xs tabular-nums">
            Intervalo {card.intervalDays} d · facilidade {Math.round(card.ease * 100)}% · {card.reps} resposta
            {card.reps === 1 ? "" : "s"} · {card.lapses} erro{card.lapses === 1 ? "" : "s"}
            {isLeech(card) && ` · sanguessuga (${LEECH_LAPSES}+ erros): vale reescrever`}
          </p>
          {confirming ? (
            <div role="alertdialog" aria-label="Confirmar" className="flex flex-wrap items-center gap-2 text-sm">
              <span className="flex-1 font-medium">
                {confirming === "delete" ? "Apagar este cartão?" : "Voltar o cartão a novo? O histórico de revisão zera."}
              </span>
              <button type="button" onClick={() => setConfirming(null)} className="text-muted hover:text-ink rounded-xl px-3 py-1.5 font-semibold">
                Cancelar
              </button>
              <button
                type="button"
                autoFocus
                onClick={() => {
                  setConfirming(null);
                  if (confirming === "delete") onDelete();
                  else onForget();
                }}
                className="border-danger/40 text-danger hover:bg-danger/10 rounded-xl border px-3 py-1.5 font-semibold transition-colors"
              >
                {confirming === "delete" ? "Apagar" : "Esquecer"}
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-1">
              <button type="button" onClick={onEdit} disabled={pending} className={action}>
                <Pencil size={13} aria-hidden />
                Editar
              </button>
              <button type="button" onClick={onSuspend} disabled={pending} className={action}>
                {card.suspended ? <Play size={13} aria-hidden /> : <Pause size={13} aria-hidden />}
                {card.suspended ? "Reativar" : "Suspender"}
              </button>
              <button type="button" onClick={() => setConfirming("forget")} disabled={pending || card.state === "new"} className={action}>
                <RotateCcw size={13} aria-hidden />
                Esquecer
              </button>
              <button
                type="button"
                onClick={() => setConfirming("delete")}
                disabled={pending}
                className="text-muted hover:text-danger flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold disabled:opacity-30"
              >
                <Trash2 size={13} aria-hidden />
                Apagar
              </button>
            </div>
          )}
        </div>
      )}
    </li>
  );
}

/** Estatísticas no estilo do Anki: hoje, contagem por estado e previsão de revisões. */
function Stats({ cards, todayDate }: { cards: Flashcard[]; todayDate: string }) {
  const stats = flashcardStats(cards, todayDate);
  const maxForecast = Math.max(1, ...stats.forecast);
  const tiles = [
    { label: "Estudados hoje", value: stats.studiedToday },
    { label: "Novos", value: stats.new },
    { label: "Aprendendo", value: stats.learning },
    { label: "Jovens", value: stats.young, hint: `intervalo < ${MATURE_DAYS} dias` },
    { label: "Maduros", value: stats.mature, hint: `intervalo ≥ ${MATURE_DAYS} dias` },
    { label: "Suspensos", value: stats.suspended },
  ];
  const weekday = (offset: number) =>
    fromIsoDate(todayDate).getTime() + (offset + 1) * 86_400_000;

  return (
    <section aria-label="Estatísticas dos flashcards" className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {tiles.map((t) => (
          <div key={t.label} className="bg-surface border-line rounded-2xl border p-4">
            <p className="text-muted text-xs font-medium">{t.label}</p>
            <p className="mt-1 text-2xl font-extrabold tabular-nums">{t.value}</p>
            {t.hint && <p className="text-muted text-[0.7rem]">{t.hint}</p>}
          </div>
        ))}
      </div>
      {stats.leeches > 0 && (
        <p className="border-danger/40 bg-danger/10 rounded-xl border px-4 py-3 text-sm">
          {stats.leeches} sanguessuga{stats.leeches > 1 ? "s" : ""}: cartões errados {LEECH_LAPSES} vezes ou mais.
          Em Navegar → Sanguessugas, reescreva e reative.
        </p>
      )}

      <div className="bg-surface border-line rounded-2xl border p-4">
        <h3 className="font-semibold">Revisões nos próximos 7 dias</h3>
        <p className="text-muted mb-3 text-xs">Sem contar novos nem os de hoje.</p>
        <ul className="flex flex-col gap-1.5 text-sm">
          {stats.forecast.map((n, i) => (
            <li key={i} className="grid grid-cols-[5.5rem_minmax(0,1fr)_2.5rem] items-center gap-3">
              <span className="text-muted text-xs capitalize">
                {i === 0
                  ? "amanhã"
                  : new Date(weekday(i)).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit" })}
              </span>
              <span className="bg-surface-alt h-2 overflow-hidden rounded-full" aria-hidden>
                <span className="bg-accent block h-full rounded-full" style={{ width: `${(n / maxForecast) * 100}%` }} />
              </span>
              <span className="text-right text-xs font-semibold tabular-nums">{n}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

interface CardFormProps {
  submitLabel: string;
  initialSubject: string;
  initial?: Flashcard;
  /** Na criação: opção de gerar também o cartão invertido (verso → frente). */
  allowReverse?: boolean;
  onSubmit: (subjectId: string, topicIndex: number | null, front: string, back: string, reverse: boolean) => void;
  onCancel: () => void;
}

function CardForm({ submitLabel, initialSubject, initial, allowReverse = false, onSubmit, onCancel }: CardFormProps) {
  const id = useId();
  const [subjectId, setSubjectId] = useState(initialSubject);
  const [topic, setTopic] = useState(initial?.topicIndex === null || !initial ? "" : String(initial.topicIndex));
  const [front, setFront] = useState(initial?.front ?? "");
  const [back, setBack] = useState(initial?.back ?? "");
  const [reverse, setReverse] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const subject = findSubject(subjectId);

  function submit(event: FormEvent) {
    event.preventDefault();
    const topicIndex = topic === "" ? null : Number(topic);
    const invalid =
      flashcardError(subjectId, topicIndex, front, back) ??
      (reverse ? flashcardError(subjectId, topicIndex, back, front) : null);
    if (invalid) {
      setError(reverse && back.length > MAX_FRONT_LENGTH ? `Para o invertido, o verso pode ter até ${MAX_FRONT_LENGTH} caracteres.` : invalid);
      return;
    }
    onSubmit(subjectId, topicIndex, front, back, reverse);
  }

  return (
    <form onSubmit={submit} noValidate className="bg-surface border-line flex flex-col gap-3 rounded-2xl border p-4 text-sm">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1" htmlFor={`${id}-subject`}>
          <span className="text-muted text-xs font-medium">Baralho (matéria)</span>
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
        <textarea id={`${id}-front`} rows={2} maxLength={MAX_FRONT_LENGTH} value={front} onChange={(e) => setFront(e.target.value)} className={fieldClass} />
      </label>
      <label className="flex flex-col gap-1" htmlFor={`${id}-back`}>
        <span className="text-muted text-xs font-medium">Verso (resposta)</span>
        <textarea id={`${id}-back`} rows={3} maxLength={MAX_BACK_LENGTH} value={back} onChange={(e) => setBack(e.target.value)} className={fieldClass} />
      </label>
      {allowReverse && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={reverse} onChange={(e) => setReverse(e.target.checked)} className="accent-accent size-4" />
          Criar também o cartão invertido (verso na frente)
        </label>
      )}
      {error && (
        <p role="alert" className="text-danger text-xs font-medium">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button type="submit" className="bg-accent text-on-accent hover:bg-accent-hover rounded-xl px-4 py-2 font-semibold transition-colors">
          {submitLabel}
        </button>
        <button type="button" onClick={onCancel} className="text-muted hover:text-ink rounded-xl px-3 py-2 font-semibold">
          Cancelar
        </button>
      </div>
    </form>
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
    <section aria-label="Importar flashcards" className="bg-surface border-line flex flex-col gap-4 rounded-2xl border p-4 text-sm">
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
        <button type="button" onClick={onCancel} className="text-muted hover:text-ink rounded-xl px-3 py-2 font-semibold">
          Cancelar
        </button>
      </div>
    </section>
  );
}
