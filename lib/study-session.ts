import "server-only";

import { currentWeekStart } from "./date";
import { findProfile } from "./db/profiles";
import { loadStudyState, saveSchedule } from "./db/study-state";
import { generateWeek } from "./schedule";
import { readProfileId } from "./session";
import type { Profile, StudyState } from "./types";

/** Perfil da sessão, ou `null` se não há cookie ou o perfil sumiu do banco. */
export async function currentProfile(): Promise<Profile | null> {
  const profileId = await readProfileId();
  if (!profileId) return null;
  return findProfile(profileId);
}

/**
 * Estado do ciclo com a garantia de que existe cronograma para a semana atual.
 *
 * A virada de semana acontece aqui, no servidor, na primeira visita da segunda-
 * feira: se o cronograma guardado é de outra semana, um novo é gerado e salvo.
 */
export async function loadCurrentCycle(profileId: string): Promise<StudyState> {
  const state = await loadStudyState(profileId);
  const weekStart = currentWeekStart();

  if (state.week?.weekStart === weekStart) return state;

  const { week, pointers } = generateWeek(state.settings, state.pointers, weekStart);
  await saveSchedule(profileId, { settings: state.settings, pointers, week });
  return { ...state, week, pointers };
}
