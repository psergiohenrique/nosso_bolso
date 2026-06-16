-- Nosso Bolso — rodar no SQL Editor (0001-0006 ja aplicadas). Inclui recorrencia+cron+constraint.

-- ===== 0007_recurring =====
-- Geração de lançamentos a partir de regras recorrentes (contas fixas).
-- Idempotente: não duplica se já existe lançamento da regra no mês.

-- Núcleo: gera para um household + mês. SECURITY DEFINER (usado por cron e wrapper).
create or replace function public._generate_recurring(
  p_household uuid,
  p_month date
)
returns int
language plpgsql security definer set search_path = public
as $$
declare
  r record;
  d date;
  n int := 0;
  mstart date := date_trunc('month', p_month)::date;
  mend date := (date_trunc('month', p_month) + interval '1 month - 1 day')::date;
  the_day int;
begin
  for r in
    select * from recurring_rules
    where household_id = p_household
      and active
      and frequency = 'monthly'
      and start_date <= mend
      and (end_date is null or end_date >= mstart)
  loop
    the_day := least(
      coalesce(r.day_of_month, extract(day from r.start_date)::int),
      extract(day from mend)::int
    );
    d := make_date(
      extract(year from mstart)::int,
      extract(month from mstart)::int,
      the_day
    );

    if not exists (
      select 1 from transactions
      where recurring_rule_id = r.id and date >= mstart and date <= mend
    ) then
      insert into transactions(
        household_id, type, amount_cents, date, description,
        category_id, account_id, card_id, recurring_rule_id, is_recurring
      )
      values (
        p_household, r.type, r.amount_cents, d, r.description,
        r.category_id, r.account_id, r.card_id, r.id, true
      );
      n := n + 1;
    end if;
  end loop;

  return n;
end;
$$;

-- Wrapper para o usuário autenticado (chama do app via rpc).
create or replace function public.generate_recurring(p_month date)
returns int
language plpgsql security definer set search_path = public, auth
as $$
declare hid uuid;
begin
  select household_id into hid
  from household_members where user_id = auth.uid() limit 1;
  if hid is null then raise exception 'sem household'; end if;
  return public._generate_recurring(hid, p_month);
end;
$$;

-- Para o cron: roda em todos os households, mês corrente.
create or replace function public.generate_recurring_all()
returns int
language plpgsql security definer set search_path = public
as $$
declare h uuid; total int := 0;
begin
  for h in select id from households loop
    total := total + public._generate_recurring(h, current_date);
  end loop;
  return total;
end;
$$;

-- ===== 0008_cron =====
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

-- ===== 0009_relax_source_constraint =====
-- Recorrências (e outros lançamentos planejados) podem não ter conta nem
-- cartão vinculados. Relaxa a regra: proíbe apenas ter conta E cartão juntos.

alter table transactions drop constraint if exists src_account_xor_card;

alter table transactions
  add constraint src_not_both check (
    not (account_id is not null and card_id is not null)
  );
