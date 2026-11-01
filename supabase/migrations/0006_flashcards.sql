-- ---------------------------------------------------------------------------
-- Flashcards
--
-- Rode este arquivo uma vez no SQL Editor do Supabase, depois do 0005 — e
-- antes de publicar a versão do app com flashcards.
--
-- Um cartão por linha, com o agendamento da repetição espaçada (lib/flashcards.ts):
-- quando volta (due_on), o intervalo atual em dias, a facilidade (ease) e
-- quantas vezes foi revisado e esquecido.
--
-- Mesmo esquema de acesso do 0001: RLS ligado e sem policies.
-- ---------------------------------------------------------------------------

create table if not exists public.flashcards (
  id            uuid primary key default gen_random_uuid(),
  profile_id    uuid not null references public.profiles (id) on delete cascade,
  subject_id    text not null,
  topic_index   smallint check (topic_index >= 0),
  front         text not null check (char_length(front) between 1 and 1000),
  back          text not null check (char_length(back) between 1 and 2000),
  due_on        date not null,
  interval_days smallint not null default 0 check (interval_days between 0 and 365),
  ease          real not null default 2.5 check (ease between 1.3 and 5),
  reps          smallint not null default 0 check (reps >= 0),
  lapses        smallint not null default 0 check (lapses >= 0),
  created_at    timestamptz not null default now()
);

create index if not exists flashcards_profile_idx on public.flashcards (profile_id);

alter table public.flashcards enable row level security;
