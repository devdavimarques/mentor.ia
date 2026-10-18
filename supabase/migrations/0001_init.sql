-- ---------------------------------------------------------------------------
-- Ciclo de Estudos PM-BA — schema inicial
--
-- Rode este arquivo uma vez no SQL Editor do painel do Supabase.
--
-- O app não usa Supabase Auth: o acesso é feito só pelo servidor do Next.js
-- com a service role key. Por isso o RLS fica LIGADO e SEM POLICIES — a chave
-- pública (anon) não consegue ler nem escrever nada, e a service role, que
-- ignora RLS, nunca sai do servidor.
-- ---------------------------------------------------------------------------

-- Perfis: as pessoas que usam o app. Criados por você (scripts/seed-profiles.mjs).
create table if not exists public.profiles (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_at timestamptz not null default now()
);

-- Um nome não pode repetir: é ele que identifica a pessoa na tela de entrada.
create unique index if not exists profiles_name_unique on public.profiles (lower(name));

-- Estado do ciclo de cada perfil.
-- settings/pointers/week são documentos (formato definido em lib/types.ts),
-- então ficam como jsonb em vez de virar dezenas de colunas.
create table if not exists public.study_states (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  settings   jsonb not null default '{"activeDays":[1,2,3,4,5,6],"blocksPerDay":3}'::jsonb,
  pointers   jsonb not null default '{}'::jsonb,
  week       jsonb,
  updated_at timestamptz not null default now()
);

-- Tópicos concluídos — uma linha por tópico, por perfil.
-- É isto que faz o progresso ser individual: a chave primária inclui o perfil.
create table if not exists public.completed_topics (
  profile_id   uuid not null references public.profiles (id) on delete cascade,
  subject_id   text not null,
  topic_index  smallint not null check (topic_index >= 0),
  completed_at timestamptz not null default now(),
  primary key (profile_id, subject_id, topic_index)
);

create index if not exists completed_topics_profile_idx
  on public.completed_topics (profile_id);

-- Trava tudo para qualquer chave que não seja a service role.
alter table public.profiles         enable row level security;
alter table public.study_states     enable row level security;
alter table public.completed_topics enable row level security;
