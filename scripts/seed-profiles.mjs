/**
 * Cria os perfis do app. Não há cadastro público: as contas nascem aqui.
 *
 *   npm run db:seed -- "Davi" "Maria"
 *
 * Rodar de novo com os mesmos nomes não duplica nada — perfis que já existem
 * são apenas listados. Nomes diferentes são acrescentados.
 */
import { createClient } from "@supabase/supabase-js";

const names = process.argv.slice(2).map((n) => n.trim()).filter(Boolean);

if (names.length === 0) {
  console.error('Uso: npm run db:seed -- "Nome Um" "Nome Dois"');
  process.exit(1);
}

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error(
    "SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY precisam estar em .env (ou .env.local).\n" +
      "Copie .env.example e preencha com os dados do painel do Supabase.",
  );
  process.exit(1);
}

// Sem isto, valores de exemplo falhariam lá na frente com um erro de rede
// confuso — em vez de dizer o que realmente está errado.
if (url.includes("xxxxxxxxxxxxxxxx") || key.startsWith("troque-pela")) {
  console.error(
    "As variáveis ainda estão com os valores de exemplo.\n" +
      "Edite .env (ou .env.local) com os dados reais do painel do Supabase — e SALVE o arquivo.",
  );
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false } });

const { data: existing, error: readError } = await db.from("profiles").select("id, name");

if (readError) {
  console.error(`Falha ao ler os perfis: ${readError.message}`);
  console.error("A tabela existe? Rode supabase/migrations/0001_init.sql no SQL Editor.");
  process.exit(1);
}

const known = new Map((existing ?? []).map((p) => [p.name.toLowerCase(), p]));
const missing = names.filter((name) => !known.has(name.toLowerCase()));

if (missing.length > 0) {
  const { data: created, error: writeError } = await db
    .from("profiles")
    .insert(missing.map((name) => ({ name })))
    .select("id, name");

  if (writeError) {
    console.error(`Falha ao criar os perfis: ${writeError.message}`);
    process.exit(1);
  }

  for (const profile of created ?? []) known.set(profile.name.toLowerCase(), profile);
}

console.log(`\nPerfis no banco (${known.size}):`);
for (const name of names) {
  const profile = known.get(name.toLowerCase());
  const status = missing.includes(name) ? "criado" : "já existia";
  console.log(`  ${profile.name.padEnd(20)} ${profile.id}  (${status})`);
}
console.log("");
