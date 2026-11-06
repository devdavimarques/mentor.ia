-- ---------------------------------------------------------------------------
-- Revisões em 4 etapas
--
-- Rode este arquivo uma vez no SQL Editor do Supabase, depois do 0008.
--
-- As revisões passaram a ser 2, 7, 14 e 21 dias depois do estudo (lib/reviews.ts):
-- a etapa vai até 4.
-- ---------------------------------------------------------------------------

alter table public.review_logs drop constraint if exists review_logs_stage_check;
alter table public.review_logs add constraint review_logs_stage_check check (stage between 1 and 4);
