import type { Progress } from "@/lib/progress";

interface AppHeaderProps {
  weekProgress: Progress;
}

export function AppHeader({ weekProgress }: AppHeaderProps) {
  return (
    <header className="border-line border-b px-6 pt-6 pb-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="text-gold mb-1 font-mono text-xs tracking-widest uppercase">
            Edital Soldado PM-BA · FCC
          </p>
          <h1 className="font-display text-2xl font-bold">Ciclo de Estudos</h1>
        </div>
        <div className="text-right">
          <p className="text-muted font-mono text-xs">Semana atual</p>
          <p className="text-gold font-mono text-sm">
            {weekProgress.done}/{weekProgress.total} blocos concluídos
          </p>
        </div>
      </div>
    </header>
  );
}
