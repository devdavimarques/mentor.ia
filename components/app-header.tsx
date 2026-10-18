"use client";

import { LogOut } from "lucide-react";

import { signOutAction } from "@/app/actions";
import { Avatar } from "@/components/ui/avatar";
import { Logo } from "@/components/ui/logo";
import type { Profile } from "@/lib/types";

interface AppHeaderProps {
  profile: Profile;
  saving: boolean;
  /** Navegação das abas ao lado da marca, só a partir de `lg` (no celular ela fica no rodapé). */
  nav: React.ReactNode;
}

export function AppHeader({ profile, saving, nav }: AppHeaderProps) {
  return (
    <header className="border-line flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b px-4 py-4 sm:px-6">
      <Logo size={30} className="text-lg" />

      <div className="hidden lg:block">{nav}</div>

      <div className="flex items-center gap-3">
        {saving && (
          <span className="text-muted text-xs font-medium" aria-live="polite">
            Salvando…
          </span>
        )}
        <form action={signOutAction}>
          <button
            type="submit"
            className="border-line hover:border-accent-text group flex items-center gap-2 rounded-full border py-1 pr-3 pl-1 text-sm font-semibold transition-colors"
            title="Trocar de perfil"
          >
            <Avatar name={profile.name} size="sm" />
            {profile.name}
            <LogOut size={14} className="text-muted group-hover:text-accent-text" aria-hidden />
            <span className="sr-only">Trocar de perfil</span>
          </button>
        </form>
      </div>
    </header>
  );
}
