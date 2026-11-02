-- ---------------------------------------------------------------------------
-- Flashcards no modelo do Anki
--
-- Rode este arquivo uma vez no SQL Editor do Supabase, depois do 0007. Pode
-- rodar de novo sem problema.
--
-- Estado do cartão (novo, aprendendo, revisão, reaprendendo), a etapa e a hora
-- das etapas em minutos, suspensão e os dias de primeiro e último estudo (para
-- os limites diários). Os cartões que já existem ganham o estado pelo que já
-- foi respondido.
-- ---------------------------------------------------------------------------

alter table public.flashcards
  add column if not exists state text not null default 'new'
    check (state in ('new', 'learning', 'review', 'relearning')),
  add column if not exists step smallint not null default 0 check (step between 0 and 10),
  add column if not exists due_at timestamptz,
  add column if not exists suspended boolean not null default false,
  add column if not exists introduced_on date,
  add column if not exists last_reviewed_on date;

-- O ease mínimo do Anki é 1,3 e o máximo aqui 5; reps e lapses passam a contar tudo.
alter table public.flashcards drop constraint if exists flashcards_reps_check;
alter table public.flashcards drop constraint if exists flashcards_lapses_check;
alter table public.flashcards alter column reps type integer, alter column lapses type integer;
alter table public.flashcards add constraint flashcards_reps_check check (reps >= 0);
alter table public.flashcards add constraint flashcards_lapses_check check (lapses >= 0);

update public.flashcards
set state = case
      when interval_days > 0 then 'review'
      when reps > 0 or lapses > 0 then 'learning'
      else 'new'
    end,
    introduced_on = case when reps > 0 or lapses > 0 or interval_days > 0 then due_on else null end
where state = 'new' and (reps > 0 or lapses > 0 or interval_days > 0);
