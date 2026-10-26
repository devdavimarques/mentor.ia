"use client";

import { Eye, X } from "lucide-react";
import { useMemo, useState } from "react";

import { AppHeader } from "@/components/app-header";
import { QuestionsProvider } from "@/components/questions-context";
import { TabBar, TabNav } from "@/components/tab-nav";
import { OverdueTab } from "@/components/tabs/overdue-tab";
import { ProgressTab } from "@/components/tabs/progress-tab";
import { SettingsTab } from "@/components/tabs/settings-tab";
import { SubjectsTab } from "@/components/tabs/subjects-tab";
import { TodayTab } from "@/components/tabs/today-tab";
import { WeekTab } from "@/components/tabs/week-tab";
import { useStudyCycle } from "@/hooks/use-study-cycle";
import { mockTakenInWeek } from "@/lib/mock-exams";
import { blockKey } from "@/lib/progress";
import { mockDayOfWeek } from "@/lib/schedule";
import type { Profile, StudyState, TabId } from "@/lib/types";

interface StudyCycleProps {
  profile: Profile;
  /** Estado já carregado do banco no servidor — a tela abre pronta. */
  initialState: StudyState;
  /** Hoje no fuso do app, `yyyy-mm-dd`, resolvido no servidor. */
  todayDate: string;
  /** Visitante: mexe em tudo, mas nada é salvo. */
  guest?: boolean;
}

export function StudyCycle({ profile, initialState, todayDate, guest = false }: StudyCycleProps) {
  const [tab, setTabState] = useState<TabId>("hoje");
  // No celular a página rola inteira: trocar de aba volta ao topo dela.
  const setTab = (next: TabId) => {
    setTabState(next);
    if (window.scrollY > 0) window.scrollTo({ top: 0 });
  };
  const {
    state,
    today,
    todayIso,
    todayBlocks,
    weekProgress,
    studied,
    lessons,
    manual,
    checked,
    reviews,
    overdue,
    cycleEnd,
    examOutlook,
    topicAccuracy,
    pendingMock,
    saving,
    error,
    dismissError,
    toggleBlock,
    toggleTopicStudied,
    toggleReview,
    addQuestions,
    deleteQuestions,
    toggleDay,
    setBlocksPerDay,
    setWeight,
    resetWeights,
    replanCycle,
    setExamDate,
    setMockEveryWeeks,
    setMockDay,
    advanceOneBlock,
    isMockDay,
    addMockExam,
    deleteMockExam,
  } = useStudyCycle(initialState, todayDate, !guest);

  const questionsApi = useMemo(
    () => ({ logs: state.questionLogs, add: addQuestions, remove: deleteQuestions }),
    [state.questionLogs, addQuestions, deleteQuestions],
  );

  // Contador da aba: só as atrasadas ainda sem fazer.
  const badges = {
    atrasadas: overdue.filter((o) => !checked.has(blockKey(o.weekStart, o.block))).length,
  };

  return (
    <QuestionsProvider value={questionsApi}>
      <div className="bg-frame border-line mx-auto min-h-dvh w-full max-w-6xl sm:my-6 sm:min-h-0 sm:rounded-3xl sm:border sm:shadow-2xl sm:shadow-black/20">
        <AppHeader
          guest={guest}
          profile={profile}
          saving={saving}
          nav={<TabNav active={tab} onChange={setTab} badges={badges} />}
        />

        {guest && (
        <div className="bg-accent-soft text-ink mx-4 mt-4 flex items-start gap-3 rounded-xl px-4 py-3 text-sm sm:mx-6">
          <Eye size={16} className="text-accent-text mt-0.5 shrink-0" aria-hidden />
          <span>
            <span className="font-semibold">Modo visitante.</span> Explore à vontade: nada do que
            você fizer é salvo, e ao recarregar a página o ciclo volta ao início.
          </span>
        </div>
      )}

      {error && (
          <div
            role="alert"
            className="border-danger/40 bg-danger/10 mx-4 mt-4 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm sm:mx-6"
          >
            <span className="flex-1">{error}</span>
            <button
              type="button"
              onClick={dismissError}
              className="text-muted hover:text-ink shrink-0"
              aria-label="Fechar aviso"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div
          id={`panel-${tab}`}
          role="tabpanel"
          aria-labelledby={`tab-${tab}`}
          tabIndex={-1}
          // Espaço para a barra de abas do rodapé, que só existe abaixo de `lg`.
          className="p-4 pb-28 sm:p-6 sm:pb-28 lg:pb-6"
        >
          {tab === "hoje" && (
            <TodayTab
              today={today}
              todayDate={todayDate}
              todayIso={todayIso}
              blocks={todayBlocks}
              week={state.week}
              studied={studied}
              checked={checked}
              reviews={reviews}
              cycleEnd={cycleEnd}
              examOutlook={examOutlook}
              pendingMock={pendingMock}
              isMockDay={isMockDay}
              onToggleBlock={toggleBlock}
              onToggleReview={toggleReview}
              onAddMockExam={addMockExam}
              onAdvanceBlock={advanceOneBlock}
            />
          )}

          {tab === "atrasadas" && (
            <OverdueTab
              todayDate={todayDate}
              week={state.week}
              checked={checked}
              overdue={overdue}
              onToggleBlock={toggleBlock}
              onReplan={replanCycle}
            />
          )}

          {tab === "semana" && state.week && (
            <WeekTab
              week={state.week}
              todayIso={todayIso}
              weekProgress={weekProgress}
              checked={checked}
              mockDay={mockDayOfWeek(state.settings, state.week.weekStart)}
              mockDone={mockTakenInWeek(state.week.weekStart, state.mockExams)}
              onToggleBlock={toggleBlock}
            />
          )}

          {tab === "materias" && (
            <SubjectsTab
              studied={studied}
              lessons={lessons}
              manual={manual}
              onToggleTopic={toggleTopicStudied}
            />
          )}

          {tab === "progresso" && (
            <ProgressTab
              studied={studied}
              lessons={lessons}
              pointers={state.pointers}
              cycleEnd={cycleEnd}
              topicAccuracy={topicAccuracy}
              mockExams={state.mockExams}
              onAddMockExam={addMockExam}
              onDeleteMockExam={deleteMockExam}
            />
          )}

          {tab === "config" && (
            <SettingsTab
              settings={state.settings}
              todayDate={todayDate}
              onToggleDay={toggleDay}
              onSetBlocksPerDay={setBlocksPerDay}
              onSetWeight={setWeight}
              onResetWeights={resetWeights}
              onSetExamDate={setExamDate}
              onSetMockEveryWeeks={setMockEveryWeeks}
              onSetMockDay={setMockDay}
            />
          )}
        </div>
      </div>

      <TabBar active={tab} onChange={setTab} badges={badges} />
    </QuestionsProvider>
  );
}
