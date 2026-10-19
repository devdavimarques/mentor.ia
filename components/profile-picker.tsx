"use client";

import { ChevronRight, Eye, Lock } from "lucide-react";
import { useState, useTransition, type FormEvent } from "react";

import { enterAsGuestAction, signInAction } from "@/app/actions";
import { Avatar } from "@/components/ui/avatar";
import type { ProfileOption } from "@/lib/types";

interface ProfilePickerProps {
  profiles: ProfileOption[];
}

/**
 * Escolha do perfil: tocar num perfil abre o campo de senha logo abaixo dele.
 * Embaixo, a entrada de visitante, que não pede senha e não salva nada.
 */
export function ProfilePicker({ profiles }: ProfilePickerProps) {
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function choose(profile: ProfileOption) {
    if (pending) return;
    setSelected(profile.id === selected ? null : profile.id);
    setPassword("");
    setError(null);
  }

  function submit(event: FormEvent, profile: ProfileOption) {
    event.preventDefault();
    if (!password) {
      setError("Digite a senha.");
      return;
    }
    setError(null);
    startTransition(async () => {
      // Em caso de sucesso a action redireciona e nada volta.
      const result = await signInAction(profile.id, password);
      if (result && !result.ok) {
        setError(result.error);
        setPassword("");
      }
    });
  }

  return (
    <div className="flex flex-col gap-2.5">
      {profiles.map((profile) => {
        const isSelected = selected === profile.id;
        return (
          <div
            key={profile.id}
            className={`bg-surface rounded-xl border transition-[border-color,box-shadow] ${
              isSelected ? "border-accent ring-accent-soft ring-4" : "border-line hover:border-accent"
            }`}
          >
            <button
              type="button"
              onClick={() => choose(profile)}
              disabled={pending}
              aria-expanded={isSelected}
              className="flex w-full items-center gap-3 rounded-xl p-3 text-left disabled:opacity-60"
            >
              <Avatar name={profile.name} />
              <span className="flex-1 text-[0.95rem] font-semibold">{profile.name}</span>
              <ChevronRight
                size={18}
                className={`text-muted transition-transform ${isSelected ? "rotate-90" : ""}`}
                aria-hidden
              />
            </button>

            {isSelected && (
              <div className="border-line border-t p-3">
                {profile.hasPassword ? (
                  <form onSubmit={(e) => submit(e, profile)} className="flex gap-2">
                    <label className="relative flex-1">
                      <span className="sr-only">Senha de {profile.name}</span>
                      <Lock
                        size={15}
                        className="text-muted pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
                        aria-hidden
                      />
                      <input
                        type="password"
                        autoComplete="current-password"
                        autoFocus
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Senha"
                        disabled={pending}
                        className="bg-frame border-line focus:border-accent-text w-full rounded-xl border py-2.5 pr-3 pl-9 text-sm outline-none disabled:opacity-60"
                      />
                    </label>
                    <button
                      type="submit"
                      disabled={pending}
                      className="bg-accent hover:bg-accent-hover text-on-accent shrink-0 rounded-xl px-4 text-sm font-semibold transition-colors disabled:opacity-60"
                    >
                      {pending ? "Entrando…" : "Entrar"}
                    </button>
                  </form>
                ) : (
                  <p className="text-muted text-sm">
                    Este perfil ainda não tem senha. Defina na pasta do projeto com{" "}
                    <code className="text-accent-text font-mono text-xs">
                      npm run db:password -- &quot;{profile.name}&quot;
                    </code>
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}

      {error && (
        <p role="alert" className="text-danger mt-1 text-sm">
          {error}
        </p>
      )}

      <div className="text-muted my-3 flex items-center gap-3 text-xs font-medium before:h-px before:flex-1 before:bg-current/20 after:h-px after:flex-1 after:bg-current/20">
        ou
      </div>

      <form action={enterAsGuestAction}>
        <button
          type="submit"
          disabled={pending}
          className="border-line hover:border-accent-text text-ink flex w-full items-center gap-3 rounded-xl border border-dashed p-3 text-left transition-colors disabled:opacity-60"
        >
          <span className="bg-surface-alt text-muted flex size-9 shrink-0 items-center justify-center rounded-full">
            <Eye size={16} aria-hidden />
          </span>
          <span className="flex-1">
            <span className="block text-[0.95rem] font-semibold">Entrar como visitante</span>
            <span className="text-muted block text-xs">Para conhecer: nada do que fizer é salvo.</span>
          </span>
        </button>
      </form>
    </div>
  );
}
