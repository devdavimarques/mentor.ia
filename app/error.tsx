"use client";

import { useEffect } from "react";

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
      <h1 className="font-display text-2xl font-bold">Algo deu errado</h1>
      <p className="text-muted max-w-md text-sm">
        Não foi possível carregar o ciclo. Tente novamente — seu progresso continua salvo neste
        navegador.
      </p>
      <button
        type="button"
        onClick={reset}
        className="border-gold text-gold hover:bg-gold/10 rounded border px-4 py-2 font-mono text-xs tracking-wide uppercase transition-colors"
      >
        Tentar novamente
      </button>
    </main>
  );
}
