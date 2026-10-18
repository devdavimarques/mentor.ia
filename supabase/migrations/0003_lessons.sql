-- ---------------------------------------------------------------------------
-- Aulas
--
-- Rode este arquivo uma vez no SQL Editor do Supabase, depois do 0002.
--
-- O ciclo passa a andar de aula em aula (lib/lessons.ts) em vez de tópico em
-- tópico. Um estudo agora é de uma aula (bloco marcado) ou de um tópico
-- inteiro (marcado à mão na aba Matérias) — exatamente um dos dois.
-- ---------------------------------------------------------------------------

alter table public.study_logs
  add column if not exists lesson_index smallint check (lesson_index >= 0);

alter table public.study_logs alter column topic_index drop not null;

-- Blocos marcados no formato antigo apontam para tópicos de um cronograma que
-- deixa de existir; não há como saber a que aula correspondiam.
delete from public.study_logs where week_start is not null and lesson_index is null;

alter table public.study_logs
  drop constraint if exists study_logs_lesson_or_topic,
  add constraint study_logs_lesson_or_topic
    check ((lesson_index is null) <> (topic_index is null));

-- Bloco marcado é sempre de uma aula.
alter table public.study_logs
  drop constraint if exists study_logs_block_is_lesson,
  add constraint study_logs_block_is_lesson
    check (week_start is null or lesson_index is not null);

drop index if exists public.study_logs_block_unique;
create unique index if not exists study_logs_block_unique
  on public.study_logs (profile_id, week_start, subject_id, lesson_index, lap)
  where week_start is not null;

-- O cronograma guardado e os ponteiros contavam tópicos. Zerados, a semana
-- é gerada de novo, em aulas, na próxima visita.
update public.study_states set pointers = '{}'::jsonb, week = null;
