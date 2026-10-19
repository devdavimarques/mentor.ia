import "server-only";

import type { Profile, ProfileOption } from "@/lib/types";

import { db, DatabaseError } from "./client";

interface ProfileRow {
  id: string;
  name: string;
  password_hash: string | null;
}

/**
 * Perfis da tela de entrada, na ordem em que foram criados. O hash nunca sai
 * daqui: a tela só fica sabendo se o perfil já tem senha.
 */
export async function listProfiles(): Promise<ProfileOption[]> {
  const { data, error } = await db()
    .from("profiles")
    .select("id, name, password_hash")
    .order("created_at", { ascending: true });

  if (error) throw new DatabaseError("listar os perfis", error.message);
  return ((data as ProfileRow[] | null) ?? []).map((row) => ({
    id: row.id,
    name: row.name.trim(),
    hasPassword: !!row.password_hash,
  }));
}

/**
 * Perfil e hash da senha, para conferir login e sessão. `null` quando o id não
 * existe mais — cookie antigo, perfil removido. Só para uso no servidor.
 */
export async function findProfileCredentials(
  id: string,
): Promise<{ profile: Profile; passwordHash: string | null } | null> {
  const { data, error } = await db()
    .from("profiles")
    .select("id, name, password_hash")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new DatabaseError("buscar o perfil", error.message);
  if (!data) return null;
  const row = data as ProfileRow;
  return { profile: { id: row.id, name: row.name.trim() }, passwordHash: row.password_hash };
}
