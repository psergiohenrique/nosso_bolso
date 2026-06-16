-- Agendamento mensal das recorrências (pg_cron). Separado pois pg_cron
-- pode não existir em ambientes locais; no Supabase está disponível.

create extension if not exists pg_cron;

-- Remove agendamento anterior (idempotente) e recria: dia 1, 03:00.
select cron.unschedule('generate-recurring-monthly')
where exists (
  select 1 from cron.job where jobname = 'generate-recurring-monthly'
);

select cron.schedule(
  'generate-recurring-monthly',
  '0 3 1 * *',
  $$select public.generate_recurring_all()$$
);
