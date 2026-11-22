import "server-only";

import { syncCycle } from "./cycle";
import { todayIsoDate } from "./date";
import { findProfileCredentials } from "./db/profiles";
import { loadStudyState, saveSchedule } from "./db/study-state";
import { readSession, sessionMatches } from "./session";
import type { Profile, StudyState } from "./types";

export type Session = { profile: Profile };

/**
 * Sessão corrente, já conferida. Perfil só vale se a assinatura do cookie bate
 * com o hash de senha atual — cookie forjado, de senha antiga ou de perfil
 * sem senha cai aqui como "sem sessão".
 */
export async function currentSession(): Promise<Session | null> {
  const stored = await readSession();
  if (!stored) return null;

  const found = await findProfileCredentials(stored.profileId);
  if (!found?.passwordHash) return null;
  if (!sessionMatches(stored.profileId, stored.signature, found.passwordHash)) return null;
  return { profile: found.profile };
}

/** Perfil da sessão, ou `null`. É o que toda Server Action de gravação usa. */
export async function currentProfile(): Promise<Profile | null> {
  return (await currentSession())?.profile ?? null;
}

/**
 * Estado do ciclo com a garantia de que existe cronograma para a semana atual
 * e de que o replanejamento do dia já foi feito.
 *
 * A virada de semana e o replanejamento acontecem aqui, no servidor, na
 * primeira visita do dia em que forem necessários (`syncCycle`), e são salvos.
 */
export async function loadCurrentCycle(profileId: string): Promise<StudyState> {
  const state = await loadStudyState(profileId);
  const { snapshot, changed } = syncCycle(state, todayIsoDate());

  if (changed) await saveSchedule(profileId, snapshot);
  return { ...state, ...snapshot };
}
