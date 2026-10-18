import "server-only";

import { cookies } from "next/headers";

/**
 * Sessão do app: um cookie com o id do perfil escolhido.
 *
 * Não há senha por decisão de projeto — são dois usuários que confiam um no
 * outro. O cookie diz "quem sou eu", não prova identidade: qualquer pessoa com
 * o link pode escolher qualquer perfil na tela de entrada. Ele é `httpOnly`
 * mesmo assim, para que nenhum script da página consiga lê-lo ou trocá-lo.
 */
const COOKIE_NAME = "mentor-ia.profile";
const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isProfileId(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

export async function readProfileId(): Promise<string | null> {
  const value = (await cookies()).get(COOKIE_NAME)?.value;
  return isProfileId(value) ? value : null;
}

export async function writeProfileId(profileId: string): Promise<void> {
  (await cookies()).set(COOKIE_NAME, profileId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ONE_YEAR_IN_SECONDS,
  });
}

export async function clearProfileId(): Promise<void> {
  (await cookies()).delete(COOKIE_NAME);
}
