import "server-only";

import type { Profile } from "@/lib/types";

import { db, DatabaseError } from "./client";

interface ProfileRow {
  id: string;
  name: string;
}

function toProfile(row: ProfileRow): Profile {
  return { id: row.id, name: row.name };
}

/** Perfis disponíveis na tela de entrada, na ordem em que foram criados. */
export async function listProfiles(): Promise<Profile[]> {
  const { data, error } = await db()
    .from("profiles")
    .select("id, name")
    .order("created_at", { ascending: true });

  if (error) throw new DatabaseError("listar os perfis", error.message);
  return (data as ProfileRow[] | null)?.map(toProfile) ?? [];
}

/** `null` quando o id não existe mais — cookie antigo, perfil removido. */
export async function findProfile(id: string): Promise<Profile | null> {
  const { data, error } = await db()
    .from("profiles")
    .select("id, name")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new DatabaseError("buscar o perfil", error.message);
  return data ? toProfile(data as ProfileRow) : null;
}
