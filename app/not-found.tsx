import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-gold font-mono text-xs tracking-widest uppercase">Erro 404</p>
      <h1 className="font-display text-2xl font-bold">Página não encontrada</h1>
      <Link
        href="/"
        className="border-gold text-gold hover:bg-gold/10 rounded border px-4 py-2 font-mono text-xs tracking-wide uppercase transition-colors"
      >
        Voltar ao ciclo
      </Link>
    </main>
  );
}
