import { redirect } from "next/navigation";

import { StudyCycle } from "@/components/study-cycle";
import { todayIsoDate } from "@/lib/date";
import { currentSession, guestCycle, loadCurrentCycle } from "@/lib/study-session";

// Lê cookie e banco a cada requisição: nada aqui pode ser pré-renderizado.
export const dynamic = "force-dynamic";

const GUEST = { id: "visitante", name: "Visitante" };

export default async function HomePage() {
  const session = await currentSession();
  if (!session) redirect("/entrar");

  const isGuest = session.kind === "guest";
  const profile = isGuest ? GUEST : session.profile;
  const state = isGuest ? guestCycle() : await loadCurrentCycle(session.profile.id);

  return (
    <main className="min-h-dvh">
      <StudyCycle profile={profile} initialState={state} todayDate={todayIsoDate()} guest={isGuest} />
    </main>
  );
}
