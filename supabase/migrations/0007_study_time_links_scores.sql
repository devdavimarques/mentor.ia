-- ---------------------------------------------------------------------------
-- Cronômetro, links das aulas e pontuação dos simulados
--
-- Rode este arquivo uma vez no SQL Editor do Supabase, depois do 0005 e do
-- 0006. Pode rodar de novo sem problema: tudo é "if not exists".
--
-- Mesmo esquema de acesso do 0001: RLS ligado e sem policies.
-- ---------------------------------------------------------------------------

-- Simulados: um nome livre ("Simulado 01") e o valor de cada questão, para a
-- nota em pontos (45 certas × 1,25 = 56,25).
alter table public.mock_exams
  add column if not exists title text check (char_length(title) <= 60);
alter table public.mock_exams
  add column if not exists points_per_question numeric(5, 2) not null default 1
    check (points_per_question > 0 and points_per_question <= 100);

-- Tempo de estudo: uma linha por parada do cronômetro (lib/study-time.ts).
create table if not exists public.study_sessions (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid not null references public.profiles (id) on delete cascade,
  subject_id   text not null,
  lesson_index smallint check (lesson_index >= 0),
  minutes      smallint not null check (minutes between 1 and 720),
  studied_on   date not null,
  created_at   timestamptz not null default now()
);

create index if not exists study_sessions_profile_idx on public.study_sessions (profile_id);

alter table public.study_sessions enable row level security;

-- Links das aulas: são do curso, iguais para todos os perfis.
create table if not exists public.lesson_links (
  subject_id   text not null,
  lesson_index smallint not null check (lesson_index >= 0),
  url          text not null check (url like 'https://%' and char_length(url) <= 500),
  updated_at   timestamptz not null default now(),
  primary key (subject_id, lesson_index)
);

alter table public.lesson_links enable row level security;
