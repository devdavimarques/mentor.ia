import "server-only";

import { currentWeekStart } from "./date";
import { findProfileCredentials } from "./db/profiles";
import { loadStudyState, saveSchedule } from "./db/study-state";
import { generateWeek } from "./schedule";
import { readSession, sessionMatches } from "./session";
import { parseSettings } from "./state-schema";
import type { Profile, StudyState } from "./types";

export type Session = { kind: "profile"; profile: Profile } | { kind: "guest" };

/**
 * Sessão corrente, já conferida. Perfil só vale se a assinatura do cookie bate
 * com o hash de senha atual — cookie forjado, de senha antiga ou de perfil
 * sem senha cai aqui como "sem sessão".
 */
export async function currentSession(): Promise<Session | null> {
  const stored = await readSession();
  if (!stored) return null;
  if (stored.kind === "guest") return { kind: "guest" };

  const found = await findProfileCredentials(stored.profileId);
  if (!found?.passwordHash) return null;
  if (!sessionMatches(stored.profileId, stored.signature, found.passwordHash)) return null;
  return { kind: "profile", profile: found.profile };
}

/**
 * Perfil da sessão, ou `null` — inclusive para visitante. É o que toda Server
 * Action de gravação usa, então visitante nunca escreve no banco, mesmo que
 * chame a action direto.
 */
export async function currentProfile(): Promise<Profile | null> {
  const session = await currentSession();
  return session?.kind === "profile" ? session.profile : null;
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

/** Ciclo do visitante: o padrão, do zero, gerado a cada visita e nunca salvo. */
export function guestCycle(): StudyState {
  const settings = parseSettings(null);
  const { week, pointers } = generateWeek(settings, {}, currentWeekStart());
  return { settings, pointers, week, studyLogs: [], reviewLogs: [], questionLogs: [] };
}
