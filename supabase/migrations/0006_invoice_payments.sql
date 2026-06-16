-- Pagamento de fatura: transação que reduz o saldo da conta pagadora,
-- mas NÃO conta como gasto na visão competência (o gasto já foi lançado
-- na data da compra). Marcada com is_invoice_payment.

alter table transactions
  add column is_invoice_payment boolean not null default false;

-- Resumo mensal (competência): exclui pagamentos de fatura das saídas.
create or replace view monthly_summary
with (security_invoker = on) as
select
  household_id,
  date_trunc('month', date)::date as month,
  coalesce(sum(amount_cents) filter (where type = 'income'), 0) as income_cents,
  coalesce(
    sum(amount_cents) filter (where type = 'expense' and not is_invoice_payment),
    0
  ) as expense_cents
from transactions
group by household_id, date_trunc('month', date);
