import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { env } from "@/lib/env";

let client: SupabaseClient | null = null;

/**
 * Cliente do banco com a *service role key*, que ignora o Row Level Security.
 *
 * Essa chave nunca pode chegar ao navegador — daí o `server-only` no topo e a
 * ausência do prefixo `NEXT_PUBLIC_` na variável. Todo acesso a dados passa por
 * Server Actions; o cliente React jamais fala com o Supabase diretamente.
 */
export function db(): SupabaseClient {
  if (!client) {
    client = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

/** Erro de banco com contexto, para não vazar detalhes crus na interface. */
export class DatabaseError extends Error {
  constructor(action: string, cause: string) {
    super(`Falha ao ${action}: ${cause}`);
    this.name = "DatabaseError";
  }
}
