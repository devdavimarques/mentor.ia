import type { Metadata } from "next";

import { ProfilePicker } from "@/components/profile-picker";
import { Logo, LogoMark } from "@/components/ui/logo";
import { listProfiles } from "@/lib/db/profiles";
import { SUBJECTS } from "@/lib/subjects";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Entrar",
  robots: { index: false, follow: false },
};

const FEATURES = [
  "Ciclo ponderado pelo edital",
  "Semana gerada sozinha",
  "Progresso por tópico",
  `${SUBJECTS.length} matérias da FCC`,
];

export default async function SignInPage() {
  const profiles = await listProfiles();

  return (
    <main className="flex min-h-dvh items-center justify-center p-0 sm:p-6">
      <div className="bg-frame border-line grid min-h-dvh w-full max-w-6xl gap-4 p-4 sm:min-h-[36rem] sm:rounded-3xl sm:border sm:shadow-2xl sm:shadow-black/30 lg:grid-cols-[1fr_1.05fr]">
        <div className="flex flex-col px-4 py-6 sm:px-10 sm:py-10">
          <Logo size={34} className="text-2xl" />

          <div className="my-auto w-full max-w-sm py-10">
            <h1 className="text-2xl font-bold tracking-tight">Entrar</h1>

            {profiles.length === 0 ? (
              <div className="border-line text-muted mt-6 rounded-2xl border border-dashed p-5 text-sm">
                <p className="text-ink mb-2 font-semibold">Nenhum perfil cadastrado</p>
                <p className="mb-3">Crie os perfis rodando, na pasta do projeto:</p>
                <code className="text-accent-text block font-mono text-xs break-all">
                  npm run db:seed -- &quot;Nome Um&quot; &quot;Nome Dois&quot;
                </code>
              </div>
            ) : (
              <>
                <p className="text-muted mt-1.5 mb-6 text-sm">
                  Escolha seu perfil para continuar de onde parou.
                </p>
                <ProfilePicker profiles={profiles} />
              </>
            )}
          </div>

          <p className="text-muted flex items-center gap-3 text-xs font-medium before:h-px before:flex-1 before:bg-current/20 after:h-px after:flex-1 after:bg-current/20">
            Soldado PM-BA · FCC
          </p>
        </div>

        <section
          aria-label="Sobre o mentor.ia"
          className="bg-hero relative hidden overflow-hidden rounded-2xl p-10 text-white lg:flex lg:flex-col"
        >
          {/* Listras verticais finas e brilho azul no canto. */}
          <div
            aria-hidden
            className="absolute inset-0 bg-[repeating-linear-gradient(90deg,rgb(255_255_255/0.035)_0_1px,transparent_1px_64px)]"
          />
          <div
            aria-hidden
            className="bg-accent absolute -top-32 -right-36 size-96 rounded-full opacity-60 blur-[80px]"
          />

          <div className="relative flex items-center gap-2.5 text-lg font-extrabold tracking-tight">
            <LogoMark size={26} bare />
            mentor.ia
          </div>

          <div className="relative my-auto">
            <h2 className="text-5xl leading-[1.02] font-extrabold tracking-[-0.035em]">
              A farda começa
              <br />
              na <span className="text-[#8fb0ff]">constância.</span>
            </h2>
            <p className="mt-5 mb-7 max-w-sm text-base leading-relaxed text-white/75">
              Seu ciclo de estudos montado pelo peso real de cada matéria no edital da FCC.
            </p>
            <ul className="flex flex-wrap gap-2">
              {FEATURES.map((feature) => (
                <li
                  key={feature}
                  className="rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-sm"
                >
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}
