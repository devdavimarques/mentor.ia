"use client";

import { useMemo, useState } from "react";

import { useQuestions } from "@/components/questions-context";
import { LineChart } from "@/components/ui/line-chart";
import { editalSeries, mockSeries, questionSeries } from "@/lib/evolution";
import { MOCK_SUBJECTS } from "@/lib/mock-exams";
import { SUBJECTS } from "@/lib/subjects";
import type { MockExam, StudyLog } from "@/lib/types";

interface EvolutionProps {
  studyLogs: readonly StudyLog[];
  mockExams: readonly MockExam[];
  todayDate: string;
}

const ALL = "";

const selectClass =
  "bg-surface border-line focus:border-accent-text rounded-xl border px-3 py-1.5 text-sm outline-none";

/** Gráficos de evolução: notas dos simulados e avanço das matérias ao longo das semanas. */
export function Evolution({ studyLogs, mockExams, todayDate }: EvolutionProps) {
  const { logs: questionLogs } = useQuestions();
  const [mockSubject, setMockSubject] = useState(ALL);
  const [subject, setSubject] = useState(ALL);
  const [metric, setMetric] = useState<"edital" | "questoes">("edital");

  const mockPoints = useMemo(() => mockSeries(mockExams, mockSubject || null), [mockExams, mockSubject]);
  const subjectPoints = useMemo(
    () =>
      metric === "edital"
        ? editalSeries(studyLogs, subject || null, todayDate)
        : questionSeries(questionLogs, subject || null, todayDate),
    [metric, studyLogs, questionLogs, subject, todayDate],
  );

  const mockName = mockSubject ? MOCK_SUBJECTS.find((s) => s.id === mockSubject)?.name : "Total";
  const subjectName = subject ? SUBJECTS.find((s) => s.id === subject)?.name : "Todas as matérias";

  return (
    <section aria-labelledby="evolucao" className="mb-8">
      <h2 id="evolucao" className="mb-3 text-xl font-bold tracking-tight">
        Evolução
      </h2>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-2">
        <div className="bg-surface border-line rounded-2xl border p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-semibold">Notas dos simulados</h3>
            <select
              aria-label="Matéria do gráfico de simulados"
              value={mockSubject}
              onChange={(e) => setMockSubject(e.target.value)}
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
            points={mockPoints}
            label={`Acerto nos simulados: ${mockName}`}
            empty="Lance um simulado para começar a ver a evolução das notas."
          />
        </div>

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
            points={subjectPoints}
            label={`${metric === "edital" ? "Edital estudado por semana" : "Acerto nas questões por semana"}: ${subjectName}`}
            empty={
              metric === "edital"
                ? "Marque aulas no ciclo para ver o edital avançar."
                : "Lance questões nos tópicos para ver o acerto por semana."
            }
          />
        </div>
      </div>
    </section>
  );
}
