-- ---------------------------------------------------------------------------
-- Registro de estudo, revisões espaçadas e questões
--
-- Rode este arquivo uma vez no SQL Editor do Supabase, depois do 0001.
--
-- Antes, "concluído" era um estado global do tópico (completed_topics). Agora a
-- marcação registra o que foi estudado em cada dia: cada linha de study_logs é
-- um estudo, com data. O progresso (tópico visto) e as revisões são derivados
-- desses registros, então nunca ficam fora de sincronia.
--
-- Mesmo esquema de acesso do 0001: RLS ligado e sem policies.
-- ---------------------------------------------------------------------------

-- Cada vez que um tópico foi estudado.
create table if not exists public.study_logs (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles (id) on delete cascade,
  subject_id  text not null,
  topic_index smallint not null check (topic_index >= 0),
  studied_on  date not null,
  -- Bloco do cronograma que foi marcado. Nulos quando o tópico foi marcado
  -- fora do ciclo (aba Matérias).
  week_start  date,
  lap         smallint check (lap >= 1),
  created_at  timestamptz not null default now(),
  check ((week_start is null) = (lap is null))
);

-- Um bloco da semana só pode ser marcado uma vez. Dentro de uma semana, a
-- combinação matéria + tópico + volta identifica o bloco.
create unique index if not exists study_logs_block_unique
  on public.study_logs (profile_id, week_start, subject_id, topic_index, lap)
  where week_start is not null;

create index if not exists study_logs_profile_idx on public.study_logs (profile_id);

-- Revisões feitas. A pendente é calculada no app a partir do último estudo.
create table if not exists public.review_logs (
  profile_id  uuid not null references public.profiles (id) on delete cascade,
  subject_id  text not null,
  topic_index smallint not null check (topic_index >= 0),
  stage       smallint not null check (stage between 1 and 3),
  done_on     date not null,
  created_at  timestamptz not null default now(),
  primary key (profile_id, subject_id, topic_index, stage, done_on)
);

-- Questões resolvidas: um lançamento de "feitas / certas" por linha.
create table if not exists public.question_logs (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles (id) on delete cascade,
  subject_id  text not null,
  topic_index smallint not null check (topic_index >= 0),
  answered    smallint not null check (answered between 1 and 500),
  correct     smallint not null check (correct >= 0 and correct <= answered),
  logged_on   date not null,
  created_at  timestamptz not null default now()
);

create index if not exists question_logs_profile_idx on public.question_logs (profile_id);

alter table public.study_logs    enable row level security;
alter table public.review_logs   enable row level security;
alter table public.question_logs enable row level security;

-- Migra as marcações antigas como estudos avulsos, na data em que foram feitas.
do $$
begin
  if to_regclass('public.completed_topics') is not null then
    insert into public.study_logs (profile_id, subject_id, topic_index, studied_on)
    select profile_id, subject_id, topic_index, (completed_at at time zone 'America/Bahia')::date
    from public.completed_topics;

    drop table public.completed_topics;
  end if;
end $$;
