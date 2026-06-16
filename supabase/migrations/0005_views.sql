-- Views de leitura. security_invoker = on => respeitam a RLS das tabelas base.

-- Saldo atual de cada conta = inicial + receitas - despesas + transf. recebidas - enviadas.
create or replace view account_balances
with (security_invoker = on) as
select
  a.id as account_id,
  a.household_id,
  a.name,
  a.type,
  a.archived,
  a.initial_balance_cents
    + coalesce((
        select sum(t.amount_cents) from transactions t
        where t.account_id = a.id and t.type = 'income'
      ), 0)
    - coalesce((
        select sum(t.amount_cents) from transactions t
        where t.account_id = a.id and t.type = 'expense'
      ), 0)
    - coalesce((
        select sum(t.amount_cents) from transactions t
        where t.account_id = a.id and t.type = 'transfer'
      ), 0)
    + coalesce((
        select sum(t.amount_cents) from transactions t
        where t.transfer_account_id = a.id and t.type = 'transfer'
      ), 0)
  as balance_cents
from accounts a;

-- Resumo mensal do household (entradas/saídas/saldo), ignorando transferências.
create or replace view monthly_summary
with (security_invoker = on) as
select
  household_id,
  date_trunc('month', date)::date as month,
  coalesce(sum(amount_cents) filter (where type = 'income'), 0) as income_cents,
  coalesce(sum(amount_cents) filter (where type = 'expense'), 0) as expense_cents
from transactions
group by household_id, date_trunc('month', date);
