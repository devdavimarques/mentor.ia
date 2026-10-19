-- ---------------------------------------------------------------------------
-- Senha por perfil
--
-- Rode este arquivo uma vez no SQL Editor do Supabase, depois do 0003 — e
-- ANTES de publicar a versão do app que pede senha (ela lê esta coluna).
--
-- Guarda só o hash scrypt da senha (formato em lib/password.ts), nunca a
-- senha. Perfil sem hash não consegue entrar: defina com
--   npm run db:password -- "Nome do perfil"
-- ---------------------------------------------------------------------------

alter table public.profiles add column if not exists password_hash text;
