-- ---------------------------------------------------------------------------
-- Simulados
--
-- Rode este arquivo uma vez no SQL Editor do Supabase, depois do 0004 — e
-- antes de publicar a versão do app com simulados.
--
-- Um simulado por linha. `results` é um documento `subjectId → {answered,
-- correct}` (formato em lib/types.ts, validado em lib/mock-exams.ts), porque
-- as matérias vêm do código e não do banco.
--
-- Mesmo esquema de acesso do 0001: RLS ligado e sem policies.
-- ---------------------------------------------------------------------------

create table if not exists public.mock_exams (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  taken_on   date not null,
  results    jsonb not null check (jsonb_typeof(results) = 'object'),
  created_at timestamptz not null default now()
);

create index if not exists mock_exams_profile_idx on public.mock_exams (profile_id);

alter table public.mock_exams enable row level security;
