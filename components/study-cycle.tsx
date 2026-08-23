"use client";

import { useState } from "react";

import { AppHeader } from "@/components/app-header";
import { TabNav } from "@/components/tab-nav";
import { ProgressTab } from "@/components/tabs/progress-tab";
import { SettingsTab } from "@/components/tabs/settings-tab";
import { SubjectsTab } from "@/components/tabs/subjects-tab";
import { TodayTab } from "@/components/tabs/today-tab";
import { WeekTab } from "@/components/tabs/week-tab";
import { useStudyCycle } from "@/hooks/use-study-cycle";
import type { TabId } from "@/lib/types";

export function StudyCycle() {
  const [tab, setTab] = useState<TabId>("hoje");
  const {
    ready,
    state,
    today,
    todayIso,
    todayBlocks,
    weekProgress,
    toggleTopic,
    toggleDay,
    setBlocksPerDay,
  } = useStudyCycle();

  if (!ready || today === null || todayIso === null) {
    return (
      <div className="text-muted flex h-96 items-center justify-center font-mono">
        carregando ciclo...
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <AppHeader weekProgress={weekProgress} />
      <TabNav active={tab} onChange={setTab} />

      <div
        id={`panel-${tab}`}
        role="tabpanel"
        aria-labelledby={`tab-${tab}`}
        tabIndex={-1}
        className="p-6"
      >
        {tab === "hoje" && (
          <TodayTab
            today={today}
            todayIso={todayIso}
            blocks={todayBlocks}
            completed={state.completed}
            onToggleTopic={toggleTopic}
          />
        )}

        {tab === "semana" && state.week && (
          <WeekTab
            week={state.week}
            todayIso={todayIso}
            completed={state.completed}
            onToggleTopic={toggleTopic}
          />
        )}

        {tab === "materias" && (
          <SubjectsTab completed={state.completed} onToggleTopic={toggleTopic} />
        )}

        {tab === "progresso" && (
          <ProgressTab completed={state.completed} pointers={state.pointers} />
        )}

        {tab === "config" && (
          <SettingsTab
            settings={state.settings}
            onToggleDay={toggleDay}
            onSetBlocksPerDay={setBlocksPerDay}
          />
        )}
      </div>
    </div>
  );
}
