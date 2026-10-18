import { redirect } from "next/navigation";

import { StudyCycle } from "@/components/study-cycle";
import { todayIsoDate } from "@/lib/date";
import { currentProfile, loadCurrentCycle } from "@/lib/study-session";

// Lê cookie e banco a cada requisição: nada aqui pode ser pré-renderizado.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const profile = await currentProfile();
  if (!profile) redirect("/entrar");

  const state = await loadCurrentCycle(profile.id);

  return (
    <main className="min-h-dvh">
      <StudyCycle profile={profile} initialState={state} todayDate={todayIsoDate()} />
    </main>
  );
}
