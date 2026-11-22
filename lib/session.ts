import "server-only";

import { createHmac, hkdfSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

import { env } from "./env";

/**
 * Sessão do app, em cookie `httpOnly`.
 *
 * Perfil: `id.assinatura`. A assinatura é um HMAC do id junto com o hash da
 * senha do perfil, então o cookie não pode ser montado à mão (o id aparece na
 * tela de entrada) e trocar a senha invalida as sessões abertas. A chave do
 * HMAC é derivada da service role key — um segredo que já só existe no
 * servidor — com um rótulo próprio, para não reaproveitar a chave crua.
 *
 * Só entra quem tem perfil com senha no banco: não há cadastro nem visitante.
 */
const PROFILE_COOKIE = "mentor-ia.sessao";
/** Cookies de versões antigas (sem senha; modo visitante): ignorados e apagados ao entrar ou sair. */
const LEGACY_COOKIES = ["mentor-ia.profile", "mentor-ia.visitante"];

const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isProfileId(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function signingKey(): Buffer {
  return Buffer.from(hkdfSync("sha256", env.supabaseServiceRoleKey, "mentor-ia", "sessao-do-perfil", 32));
}

function sign(profileId: string, passwordHash: string): string {
  return createHmac("sha256", signingKey()).update(`${profileId}:${passwordHash}`).digest("base64url");
}

export type StoredSession = { profileId: string; signature: string };

/** O que o cookie diz. A assinatura ainda precisa ser conferida com `sessionMatches`. */
export async function readSession(): Promise<StoredSession | null> {
  const jar = await cookies();
  const raw = jar.get(PROFILE_COOKIE)?.value;
  if (raw) {
    const [profileId, signature] = raw.split(".");
    if (isProfileId(profileId) && signature) return { profileId, signature };
  }
  return null;
}

export function sessionMatches(profileId: string, signature: string, passwordHash: string): boolean {
  const expected = Buffer.from(sign(profileId, passwordHash));
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

const baseOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

export async function writeProfileSession(profileId: string, passwordHash: string): Promise<void> {
  const jar = await cookies();
  jar.set(PROFILE_COOKIE, `${profileId}.${sign(profileId, passwordHash)}`, {
    ...baseOptions,
    maxAge: ONE_YEAR_IN_SECONDS,
  });
  for (const name of LEGACY_COOKIES) jar.delete(name);
}

export async function clearSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(PROFILE_COOKIE);
  for (const name of LEGACY_COOKIES) jar.delete(name);
}
