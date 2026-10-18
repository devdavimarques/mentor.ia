"use client";

import { ChevronRight } from "lucide-react";
import { useState, useTransition } from "react";

import { selectProfileAction } from "@/app/actions";
import { Avatar } from "@/components/ui/avatar";
import type { Profile } from "@/lib/types";

interface ProfilePickerProps {
  profiles: Profile[];
}

export function ProfilePicker({ profiles }: ProfilePickerProps) {
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function choose(profile: Profile) {
    setSelected(profile.id);
    setError(null);
    startTransition(async () => {
      // Em caso de sucesso a action redireciona e nada volta.
      const result = await selectProfileAction(profile.id);
      if (result && !result.ok) {
        setError(result.error);
        setSelected(null);
      }
    });
  }

  return (
    <div className="flex flex-col gap-2.5">
      {profiles.map((profile) => {
        const isSelected = selected === profile.id;
        return (
          <button
            key={profile.id}
            type="button"
            onClick={() => choose(profile)}
            disabled={pending}
            className={`bg-surface flex items-center gap-3 rounded-xl border p-3 text-left transition-[border-color,box-shadow] disabled:opacity-60 ${
              isSelected
                ? "border-accent ring-accent-soft ring-4"
                : "border-line hover:border-accent"
            }`}
          >
            <Avatar name={profile.name} />
            <span className="flex-1 text-[0.95rem] font-semibold">{profile.name}</span>
            {isSelected && pending ? (
              <span className="text-muted text-xs font-medium">Entrando…</span>
            ) : (
              <ChevronRight size={18} className="text-muted" aria-hidden />
            )}
          </button>
        );
      })}

      {error && (
        <p role="alert" className="text-danger mt-2 text-sm">
          {error}
        </p>
      )}
    </div>
  );
}
