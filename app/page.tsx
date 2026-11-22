import { redirect } from "next/navigation";

import { StudyCycle } from "@/components/study-cycle";
import { todayIsoDate } from "@/lib/date";
import { currentSession, loadCurrentCycle } from "@/lib/study-session";

// Lê cookie e banco a cada requisição: nada aqui pode ser pré-renderizado.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await currentSession();
  if (!session) redirect("/entrar");

  const state = await loadCurrentCycle(session.profile.id);

  return (
    <main className="min-h-dvh">
      <StudyCycle profile={session.profile} initialState={state} todayDate={todayIsoDate()} />
    </main>
  );
}
