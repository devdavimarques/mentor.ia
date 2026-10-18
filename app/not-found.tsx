import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-accent-text text-xs font-semibold tracking-wider uppercase">Erro 404</p>
      <h1 className="text-3xl font-extrabold tracking-tight">Página não encontrada</h1>
      <Link
        href="/"
        className="bg-accent text-on-accent hover:bg-accent-hover rounded-xl px-5 py-2.5 text-sm font-bold transition-colors"
      >
        Voltar ao ciclo
      </Link>
    </main>
  );
}
