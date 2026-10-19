/**
 * Define (ou troca) a senha de um perfil.
 *
 *   npm run db:password -- "Davi"
 *
 * A senha é pedida no terminal sem aparecer na tela e sem passar por argumento
 * — assim não fica no histórico do shell. Só o hash scrypt vai para o banco.
 * Trocar a senha encerra as sessões abertas do perfil (o cookie é assinado
 * com o hash).
 *
 * O formato do hash precisa bater com lib/password.ts.
 *
 * Sem `process.exit()`: no Windows ele derruba o Node com
 * "Assertion failed: UV_HANDLE_CLOSING" quando o terminal está em modo raw.
 * O script só define `process.exitCode` e termina sozinho.
 */
import { randomBytes, scryptSync } from "node:crypto";

import { createClient } from "@supabase/supabase-js";

const SCRYPT = { N: 16384, r: 8, p: 1 };
const KEY_LENGTH = 64;
const MIN_LENGTH = 6;

/** Erro que já traz a mensagem para o usuário. */
class Exit extends Error {}

/** Lê uma linha do terminal mostrando `*` no lugar de cada caractere. */
function askHidden(question) {
  return new Promise((resolve, reject) => {
    const { stdin, stdout } = process;
    if (!stdin.isTTY) {
      reject(new Exit("Rode este comando num terminal interativo."));
      return;
    }
    stdout.write(question);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    let value = "";

    const finish = (error) => {
      stdin.setRawMode(false);
      stdin.pause();
      stdin.off("data", onData);
      stdout.write("\n");
      if (error) reject(error);
      else resolve(value);
    };

    function onData(chunk) {
      for (const char of chunk) {
        if (char === "\r" || char === "\n") return finish();
        if (char === "\u0003") return finish(new Exit("Cancelado."));
        if (char === "\u007f" || char === "\b") {
          if (value.length > 0) {
            value = value.slice(0, -1);
            stdout.write("\b \b");
          }
          continue;
        }
        value += char;
        stdout.write("*");
      }
    }

    stdin.on("data", onData);
  });
}

function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = scryptSync(password.normalize("NFC"), salt, KEY_LENGTH, SCRYPT);
  return ["scrypt", SCRYPT.N, SCRYPT.r, SCRYPT.p, salt.toString("base64"), hash.toString("base64")].join("$");
}

/** Compara nomes ignorando caixa e espaços nas pontas ("Davi " = "davi"). */
const sameName = (a, b) => a.trim().toLocaleLowerCase("pt-BR") === b.trim().toLocaleLowerCase("pt-BR");

async function main() {
  const name = process.argv.slice(2).join(" ").trim();
  if (!name) throw new Exit('Uso: npm run db:password -- "Nome do perfil"');

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Exit("SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY precisam estar em .env (ou .env.local).");
  }

  const db = createClient(url, key, { auth: { persistSession: false } });

  const { data: profiles, error: readError } = await db.from("profiles").select("id, name, password_hash");
  if (readError) {
    throw new Exit(
      `Falha ao ler os perfis: ${readError.message}\n` +
        "A coluna existe? Rode supabase/migrations/0004_profile_passwords.sql no SQL Editor.",
    );
  }

  const profile = profiles.find((p) => sameName(p.name, name));
  if (!profile) {
    throw new Exit(`Perfil "${name}" não encontrado. Perfis: ${profiles.map((p) => p.name.trim()).join(", ")}`);
  }

  const label = profile.name.trim();
  console.log(profile.password_hash ? `Trocando a senha de ${label}.` : `Definindo a senha de ${label}.`);

  const password = await askHidden("Nova senha: ");
  if (password.length < MIN_LENGTH) throw new Exit(`A senha precisa ter pelo menos ${MIN_LENGTH} caracteres.`);
  const confirm = await askHidden("Repita a senha: ");
  if (confirm !== password) throw new Exit("As senhas não conferem.");

  const { error: writeError } = await db
    .from("profiles")
    .update({ password_hash: hashPassword(password) })
    .eq("id", profile.id);
  if (writeError) throw new Exit(`Falha ao salvar a senha: ${writeError.message}`);

  console.log(`Senha de ${label} salva. Sessões abertas desse perfil foram encerradas.`);
}

main().catch((error) => {
  console.error(error instanceof Exit ? error.message : error);
  process.exitCode = 1;
});
