"use client";

import { useEffect } from "react";

import { LogoMark } from "@/components/ui/logo";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <LogoMark size={40} />
      <h1 className="text-2xl font-extrabold tracking-tight">Algo deu errado</h1>
      <p className="text-muted max-w-md text-sm">
        Não foi possível carregar o ciclo. Tente novamente: seu progresso continua salvo.
      </p>
      <button
        type="button"
        onClick={reset}
        className="bg-accent text-on-accent hover:bg-accent-hover rounded-xl px-5 py-2.5 text-sm font-bold transition-colors"
      >
        Tentar novamente
      </button>
    </main>
  );
}
