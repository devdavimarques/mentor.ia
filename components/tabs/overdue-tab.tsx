"use client";

import { Route } from "lucide-react";

import { LessonBlock } from "@/components/topic-block";
import { formatShortDate, fromIsoDate, isoWeekday } from "@/lib/date";
import { blockKey } from "@/lib/progress";
import type { OverdueBlock } from "@/lib/schedule";
import { DAY_LABELS, findSubject } from "@/lib/subjects";
import type { ReplanNote, ScheduledBlock, WeekSchedule } from "@/lib/types";

interface OverdueTabProps {
  todayDate: string;
  week: WeekSchedule | null;
  checked: ReadonlySet<string>;
  overdue: OverdueBlock[];
  onToggleBlock: (block: ScheduledBlock, weekStart?: string) => void;
}

export function OverdueTab({
  todayDate,
  week,
  checked,
  overdue,
  onToggleBlock,
}: OverdueTabProps) {
  const open = overdue.filter((o) => !checked.has(blockKey(o.weekStart, o.block))).length;
  const replan = week?.replan?.on === todayDate ? week.replan : null;

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div>
        <p className="text-accent-text text-xs font-semibold tracking-wider uppercase">
          {open === 0 ? "Tudo em dia" : `${open} aula${open > 1 ? "s" : ""} sem fazer`}
        </p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Atrasadas</h1>
      </div>

      <p className="text-muted -mt-2 text-sm">
        Cada matéria segue a ordem do curso: a aula que você não fez vai sozinha para o próximo
        bloco da matéria, e as seguintes esperam. Aqui ficam as que ainda aguardam um bloco livre
        da matéria — dá para fazer agora e marcar.
      </p>

      {replan && <ReplanNotice note={replan} />}

      {overdue.length === 0 ? (
        <div className="border-line text-muted rounded-2xl border border-dashed p-6 text-center text-sm">
          Nenhuma aula atrasada. Continue assim.
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {overdue.map((item) => {
            const done = checked.has(blockKey(item.weekStart, item.block));
            return (
              <LessonBlock
                key={blockKey(item.weekStart, item.block)}
                block={item.block}
                checked={done}
                onToggle={() => onToggleBlock(item.block, item.weekStart)}
                tags={<OverdueTags item={item} done={done} />}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

/** "seg 20/10" — dia e data em que o bloco atrasado estava programado. */
function formatDueOn(iso: string): string {
  const date = fromIsoDate(iso);
  return `${DAY_LABELS[isoWeekday(date) - 1].toLowerCase()} ${formatShortDate(date)}`;
}

function OverdueTags({ item, done }: { item: OverdueBlock; done: boolean }) {
  const subject = findSubject(item.block.subjectId);
  return (
    <>
      {!done && <span className="text-accent-text font-semibold">atrasada</span>}
      <span>era para {formatDueOn(item.dueOn)}</span>
      {!done && subject && <span>entra no próximo bloco de {subject.name}</span>}
    </>
  );
}

/** Aviso de hoje: aulas atrasadas que foram para o próximo bloco da matéria. */
function ReplanNotice({ note }: { note: ReplanNote }) {
  const date = (iso: string | null) => (iso ? formatShortDate(fromIsoDate(iso)) : "—");
  const moved = note.moved === 1 ? "1 aula atrasada entrou" : `${note.moved} aulas atrasadas entraram`;
  const shifted = note.endBefore !== note.endAfter;

  return (
    <div className="bg-accent-soft text-ink flex items-start gap-3 rounded-xl px-4 py-3 text-sm">
      <Route size={16} className="text-accent-text mt-0.5 shrink-0" aria-hidden />
      <span>
        <span className="font-semibold">Cronograma replanejado hoje.</span> {moved} para o
        próximo bloco da matéria, e as aulas seguintes dela andaram.{" "}
        {shifted ? (
          <>
            Fim do ciclo:{" "}
            <span className="font-semibold tabular-nums">
              {date(note.endBefore)} → {date(note.endAfter)}
            </span>
            .
          </>
        ) : (
          "O fim do ciclo não mudou."
        )}
      </span>
    </div>
  );
}
