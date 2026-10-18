import "server-only";

/**
 * Lidas sob demanda (getters), não no topo do módulo: `next build` importa
 * este arquivo sem as variáveis definidas, e falhar ali quebraria o build em
 * vez de dar um erro claro em tempo de execução.
 */
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Variável de ambiente ausente: ${name}. ` +
        "Copie .env.example para .env.local e preencha com os dados do painel do Supabase.",
    );
  }
  return value;
}

export const env = {
  get supabaseUrl(): string {
    return required("SUPABASE_URL");
  },
  get supabaseServiceRoleKey(): string {
    return required("SUPABASE_SERVICE_ROLE_KEY");
  },
};
