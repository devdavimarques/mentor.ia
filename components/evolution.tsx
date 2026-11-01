"use client";

import { useMemo, useState } from "react";

import { useQuestions } from "@/components/questions-context";
import { LineChart } from "@/components/ui/line-chart";
import { editalSeries, mockSeries, questionSeries } from "@/lib/evolution";
import { MOCK_SUBJECTS } from "@/lib/mock-exams";
import { SUBJECTS } from "@/lib/subjects";
import type { MockExam, StudyLog } from "@/lib/types";

const ALL = "";

const selectClass =
  "bg-surface border-line focus:border-accent-text rounded-xl border px-3 py-1.5 text-sm outline-none";

/** Gráfico das notas dos simulados, no total ou por matéria (aba Simulados). */
export function MockEvolution({ mockExams }: { mockExams: readonly MockExam[] }) {
  const [subject, setSubject] = useState(ALL);
  const points = useMemo(() => mockSeries(mockExams, subject || null), [mockExams, subject]);
  const name = subject ? MOCK_SUBJECTS.find((s) => s.id === subject)?.name : "Total";

  return (
    <div className="bg-surface border-line rounded-2xl border p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-semibold">Evolução das notas</h3>
          <p className="text-muted text-xs">Em % da nota máxima; os pontos aparecem ao tocar.</p>
        </div>
        <select
          aria-label="Matéria do gráfico de simulados"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className={selectClass}
        >
          <option value={ALL}>Total</option>
          {MOCK_SUBJECTS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
      <LineChart
        points={points}
        label={`Nota nos simulados: ${name}`}
        empty="Lance um simulado para começar a ver a evolução das notas."
      />
    </div>
  );
}

interface SubjectEvolutionProps {
  studyLogs: readonly StudyLog[];
  todayDate: string;
}

/** Avanço das matérias ao longo das semanas: edital estudado ou acerto nas questões (aba Progresso). */
export function SubjectEvolution({ studyLogs, todayDate }: SubjectEvolutionProps) {
  const { logs: questionLogs } = useQuestions();
  const [subject, setSubject] = useState(ALL);
  const [metric, setMetric] = useState<"edital" | "questoes">("edital");

  const points = useMemo(
    () =>
      metric === "edital"
        ? editalSeries(studyLogs, subject || null, todayDate)
        : questionSeries(questionLogs, subject || null, todayDate),
    [metric, studyLogs, questionLogs, subject, todayDate],
  );
  const subjectName = subject ? SUBJECTS.find((s) => s.id === subject)?.name : "Todas as matérias";

  return (
    <div className="bg-surface border-line rounded-2xl border p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold">Evolução das matérias</h3>
        <div className="flex flex-wrap gap-2">
          <select
            aria-label="Medida do gráfico de matérias"
            value={metric}
            onChange={(e) => setMetric(e.target.value as "edital" | "questoes")}
            className={selectClass}
          >
            <option value="edital">Edital estudado</option>
            <option value="questoes">Acerto nas questões</option>
          </select>
          <select
            aria-label="Matéria do gráfico de matérias"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className={selectClass}
          >
            <option value={ALL}>Todas</option>
            {SUBJECTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <LineChart
        points={points}
        label={`${metric === "edital" ? "Edital estudado por semana" : "Acerto nas questões por semana"}: ${subjectName}`}
        empty={
          metric === "edital"
            ? "Marque aulas no ciclo para ver o edital avançar."
            : "Lance questões nos tópicos para ver o acerto por semana."
        }
      />
    </div>
  );
}
