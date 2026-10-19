import "server-only";

import { scrypt, timingSafeEqual, type ScryptOptions } from "node:crypto";

/**
 * Hash de senha: `scrypt$N$r$p$sal$hash` (sal e hash em base64). É gerado por
 * scripts/set-password.mjs — os dois lados precisam concordar no formato.
 */
function derive(password: string, salt: Buffer, length: number, options: ScryptOptions) {
  return new Promise<Buffer>((resolve, reject) =>
    scrypt(password.normalize("NFC"), salt, length, options, (error, key) =>
      error ? reject(error) : resolve(key),
    ),
  );
}

/** Compara em tempo constante. Hash ausente ou malformado nunca confere. */
export async function verifyPassword(password: string, stored: string | null): Promise<boolean> {
  if (!stored) return false;
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;

  const [, n, r, p, salt, hash] = parts;
  const expected = Buffer.from(hash, "base64");
  if (expected.length === 0) return false;

  const actual = await derive(password, Buffer.from(salt, "base64"), expected.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
    maxmem: 64 * 1024 * 1024,
  });
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
