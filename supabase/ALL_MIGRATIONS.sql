-- Nosso Bolso — TODAS as migrations (0001..0009). Cole no SQL Editor e Run.

-- ===== 0001_schema =====
-- Controle Financeiro do Casal — schema base (SPEC §5)
-- Dinheiro sempre em centavos (bigint). Toda tabela de dados tem household_id (RLS).

create extension if not exists "pgcrypto"; -- gen_random_uuid

-- ── Households & membros ──────────────────────────────────────────────
create table households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  base_currency text not null default 'BRL',
  created_at timestamptz not null default now()
);

create table household_members (
  household_id uuid not null references households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','member')),
  display_name text not null,
  color text,                      -- cor do membro nos gráficos
  joined_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

-- ── Contas (onde o dinheiro vive) ─────────────────────────────────────
create table accounts (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name text not null,
  type text not null check (type in ('checking','savings','cash','wallet','other')),
  initial_balance_cents bigint not null default 0,
  currency text not null default 'BRL',
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

-- ── Cartões de crédito ────────────────────────────────────────────────
create table cards (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name text not null,
  brand text,
  last4 text,
  limit_cents bigint,
  closing_day int not null check (closing_day between 1 and 31),
  due_day int not null check (due_day between 1 and 31),
  default_account_id uuid references accounts(id) on delete set null,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

-- ── Categorias / subcategorias ────────────────────────────────────────
create table categories (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  parent_id uuid references categories(id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('expense','income')),
  icon text,
  color text,
  created_at timestamptz not null default now()
);

-- ── Regras recorrentes (contas fixas) ─────────────────────────────────
create table recurring_rules (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  description text not null,
  amount_cents bigint not null,
  type text not null check (type in ('expense','income')),
  category_id uuid references categories(id) on delete set null,
  account_id uuid references accounts(id) on delete set null,
  card_id uuid references cards(id) on delete set null,
  frequency text not null check (frequency in ('monthly','weekly','yearly','custom')),
  day_of_month int check (day_of_month between 1 and 31),
  start_date date not null,
  end_date date,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ── Faturas (definida antes de transactions: FK invoice_id) ───────────
create table invoices (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  card_id uuid not null references cards(id) on delete cascade,
  period_start date not null,
  period_end date not null,        -- = fechamento
  due_date date not null,
  total_cents bigint not null default 0,
  status text not null default 'open' check (status in ('open','closed','paid')),
  paid_at timestamptz,
  paid_from_account_id uuid references accounts(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (card_id, period_start)
);

-- ── Transações ────────────────────────────────────────────────────────
create table transactions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  type text not null check (type in ('expense','income','transfer')),
  amount_cents bigint not null check (amount_cents > 0),
  currency text not null default 'BRL',
  date date not null,              -- data de competência (compra)
  description text,
  category_id uuid references categories(id) on delete set null,

  -- origem do dinheiro: account XOR card (transfer usa account + transfer_account_id)
  account_id uuid references accounts(id) on delete set null,
  card_id uuid references cards(id) on delete set null,
  transfer_account_id uuid references accounts(id) on delete set null,

  -- autoria / casal
  paid_by uuid references auth.users(id) on delete set null,
  split_mode text not null default 'none' check (split_mode in ('none','equal','custom')),

  -- recorrência
  recurring_rule_id uuid references recurring_rules(id) on delete set null,
  is_recurring boolean not null default false,

  -- parcelamento
  purchase_id uuid,
  installment_no int,
  installment_total int,

  -- fatura (quando card_id != null)
  invoice_id uuid references invoices(id) on delete set null,

  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- conta XOR cartão (transfer é exceção: usa account + transfer_account)
  constraint src_account_xor_card check (
    type = 'transfer'
    or (account_id is not null) <> (card_id is not null)
  ),
  -- parcela só em cartão
  constraint installment_needs_card check (
    installment_total is null or card_id is not null
  )
);

create table transaction_splits (
  transaction_id uuid not null references transactions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  share_cents bigint not null,
  primary key (transaction_id, user_id)
);

-- ── Orçamentos ────────────────────────────────────────────────────────
create table budgets (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  category_id uuid not null references categories(id) on delete cascade,
  month date not null,             -- primeiro dia do mês de referência
  limit_cents bigint not null,
  created_at timestamptz not null default now(),
  unique (household_id, category_id, month)
);

-- ── Metas ─────────────────────────────────────────────────────────────
create table goals (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name text not null,
  target_cents bigint not null,
  saved_cents bigint not null default 0,
  target_date date,
  account_id uuid references accounts(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ── Índices p/ filtros e relatórios ───────────────────────────────────
create index idx_tx_household_date on transactions (household_id, date desc);
create index idx_tx_category on transactions (category_id);
create index idx_tx_account on transactions (account_id);
create index idx_tx_card on transactions (card_id);
create index idx_tx_invoice on transactions (invoice_id);
create index idx_tx_purchase on transactions (purchase_id);
create index idx_invoices_card on invoices (card_id);
create index idx_recurring_household on recurring_rules (household_id) where active;
create index idx_budgets_month on budgets (household_id, month);

-- ===== 0002_functions =====
-- Funções, triggers e bootstrap de household.

-- ── Helpers de autorização (SECURITY DEFINER evita recursão de RLS) ────
create or replace function public.is_household_member(hid uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from household_members
    where household_id = hid and user_id = auth.uid()
  );
$$;

create or replace function public.is_household_owner(hid uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from household_members
    where household_id = hid and user_id = auth.uid() and role = 'owner'
  );
$$;

-- ── Seed de categorias pt-BR (chamado no bootstrap; editável depois) ──
create or replace function public.seed_default_categories(hid uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  c uuid;
begin
  -- Despesas (pai + filhos)
  insert into categories(household_id,name,kind,icon,color) values
    (hid,'Moradia','expense','home','#6366f1') returning id into c;
  insert into categories(household_id,parent_id,name,kind) values
    (hid,c,'Aluguel','expense'),(hid,c,'Condomínio','expense'),
    (hid,c,'Água','expense'),(hid,c,'Luz','expense'),(hid,c,'Internet','expense');

  insert into categories(household_id,name,kind,icon,color) values
    (hid,'Mercado','expense','shopping-cart','#10b981') returning id into c;

  insert into categories(household_id,name,kind,icon,color) values
    (hid,'Transporte','expense','car','#f59e0b') returning id into c;
  insert into categories(household_id,parent_id,name,kind) values
    (hid,c,'Combustível','expense'),(hid,c,'App (Uber/99)','expense'),
    (hid,c,'Transporte público','expense');

  insert into categories(household_id,name,kind,icon,color) values
    (hid,'Alimentação fora','expense','utensils','#ef4444') returning id into c;
  insert into categories(household_id,parent_id,name,kind) values
    (hid,c,'Restaurante','expense'),(hid,c,'Delivery','expense'),(hid,c,'Café','expense');

  insert into categories(household_id,name,kind,icon,color) values
    (hid,'Saúde','expense','heart-pulse','#ec4899') returning id into c;
  insert into categories(household_id,parent_id,name,kind) values
    (hid,c,'Farmácia','expense'),(hid,c,'Plano de saúde','expense'),(hid,c,'Consultas','expense');

  insert into categories(household_id,name,kind,icon,color) values
    (hid,'Lazer','expense','party-popper','#8b5cf6') returning id into c;
  insert into categories(household_id,name,kind,icon,color) values
    (hid,'Assinaturas','expense','repeat','#0ea5e9') returning id into c;
  insert into categories(household_id,parent_id,name,kind) values
    (hid,c,'Streaming','expense'),(hid,c,'Academia','expense'),(hid,c,'Software','expense');

  insert into categories(household_id,name,kind,icon,color) values
    (hid,'Educação','expense','graduation-cap','#14b8a6'),
    (hid,'Pets','expense','dog','#a855f7'),
    (hid,'Vestuário','expense','shirt','#f43f5e'),
    (hid,'Outros','expense','ellipsis','#64748b');

  -- Receitas
  insert into categories(household_id,name,kind,icon,color) values
    (hid,'Salário','income','wallet','#22c55e'),
    (hid,'Freelance','income','briefcase','#84cc16'),
    (hid,'Investimentos','income','trending-up','#16a34a'),
    (hid,'Reembolso','income','rotate-ccw','#65a30d'),
    (hid,'Outros','income','plus','#4ade80');
end;
$$;

-- ── Bootstrap: ao criar household, vira owner + categorias padrão ─────
create or replace function public.handle_new_household()
returns trigger
language plpgsql security definer set search_path = public, auth
as $$
begin
  insert into household_members(household_id, user_id, role, display_name)
  values (
    new.id, auth.uid(), 'owner',
    coalesce(
      (select split_part(email, '@', 1) from auth.users where id = auth.uid()),
      'Você'
    )
  );
  perform public.seed_default_categories(new.id);
  return new;
end;
$$;

create trigger on_household_created
  after insert on households
  for each row execute function public.handle_new_household();

-- ── Recalcula total da fatura quando transação de cartão muda ─────────
create or replace function public.recompute_invoice_total()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare iid uuid;
begin
  iid := coalesce(new.invoice_id, old.invoice_id);
  if iid is not null then
    update invoices set total_cents = coalesce((
      select sum(amount_cents) from transactions
      where invoice_id = iid and type = 'expense'
    ), 0)
    where id = iid;
  end if;
  return coalesce(new, old);
end;
$$;

create trigger trg_recompute_invoice
  after insert or update or delete on transactions
  for each row execute function public.recompute_invoice_total();

-- ── updated_at automático em transactions ─────────────────────────────
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger trg_touch_tx
  before update on transactions
  for each row execute function public.touch_updated_at();

-- ===== 0003_rls =====
-- Row Level Security. Cada usuário só acessa dados do seu household.

-- ── households ────────────────────────────────────────────────────────
alter table households enable row level security;

create policy households_select on households for select
  using (public.is_household_member(id));

create policy households_insert on households for insert
  with check (auth.uid() is not null);

create policy households_update on households for update
  using (public.is_household_owner(id))
  with check (public.is_household_owner(id));

create policy households_delete on households for delete
  using (public.is_household_owner(id));

-- ── household_members ─────────────────────────────────────────────────
alter table household_members enable row level security;

create policy members_select on household_members for select
  using (public.is_household_member(household_id));

-- owner gerencia membros; usuário pode inserir a si mesmo (aceitar convite)
create policy members_insert on household_members for insert
  with check (
    public.is_household_owner(household_id) or user_id = auth.uid()
  );

create policy members_update on household_members for update
  using (public.is_household_owner(household_id) or user_id = auth.uid())
  with check (public.is_household_owner(household_id) or user_id = auth.uid());

create policy members_delete on household_members for delete
  using (public.is_household_owner(household_id) or user_id = auth.uid());

-- ── Tabelas de dados (mesma política: membros do household) ───────────
-- accounts
alter table accounts enable row level security;
create policy accounts_all on accounts for all
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

-- cards
alter table cards enable row level security;
create policy cards_all on cards for all
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

-- categories
alter table categories enable row level security;
create policy categories_all on categories for all
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

-- recurring_rules
alter table recurring_rules enable row level security;
create policy recurring_all on recurring_rules for all
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

-- invoices
alter table invoices enable row level security;
create policy invoices_all on invoices for all
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

-- transactions
alter table transactions enable row level security;
create policy transactions_all on transactions for all
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

-- budgets
alter table budgets enable row level security;
create policy budgets_all on budgets for all
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

-- goals
alter table goals enable row level security;
create policy goals_all on goals for all
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

-- transaction_splits: sem household_id; autoriza via transação pai
alter table transaction_splits enable row level security;
create policy splits_all on transaction_splits for all
  using (
    exists (
      select 1 from transactions t
      where t.id = transaction_id and public.is_household_member(t.household_id)
    )
  )
  with check (
    exists (
      select 1 from transactions t
      where t.id = transaction_id and public.is_household_member(t.household_id)
    )
  );

-- ===== 0004_invites =====
-- Convite do parceiro(a) por link/token (sem precisar de service role).

create table household_invites (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  token text not null unique default encode(gen_random_bytes(16), 'hex'),
  email text,                       -- opcional: só informativo
  role text not null default 'member' check (role in ('member')),
  invited_by uuid references auth.users(id) on delete set null,
  accepted_at timestamptz,
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now()
);

create index idx_invites_token on household_invites (token);
create index idx_invites_household on household_invites (household_id);

alter table household_invites enable row level security;

-- Membros do household gerenciam seus convites.
create policy invites_select on household_invites for select
  using (public.is_household_member(household_id));
create policy invites_insert on household_invites for insert
  with check (public.is_household_member(household_id));
create policy invites_delete on household_invites for delete
  using (public.is_household_member(household_id));

-- Ver convite por token SEM ser membro ainda (pré-aceite). SECURITY DEFINER.
create or replace function public.get_invite(p_token text)
returns table (
  household_id uuid,
  household_name text,
  invited_email text,
  expired boolean,
  accepted boolean
)
language sql stable security definer set search_path = public
as $$
  select i.household_id,
         h.name,
         i.email,
         (i.expires_at < now()),
         (i.accepted_at is not null)
  from household_invites i
  join households h on h.id = i.household_id
  where i.token = p_token;
$$;

-- Aceitar convite: adiciona o usuário atual como membro. SECURITY DEFINER.
create or replace function public.accept_invite(p_token text)
returns uuid
language plpgsql security definer set search_path = public, auth
as $$
declare
  inv household_invites%rowtype;
  uemail text;
begin
  if auth.uid() is null then
    raise exception 'não autenticado';
  end if;

  select * into inv from household_invites where token = p_token for update;

  if not found then
    raise exception 'convite inválido';
  end if;
  if inv.accepted_at is not null then
    raise exception 'convite já utilizado';
  end if;
  if inv.expires_at < now() then
    raise exception 'convite expirado';
  end if;

  select email into uemail from auth.users where id = auth.uid();

  insert into household_members (household_id, user_id, role, display_name)
  values (inv.household_id, auth.uid(), inv.role,
          coalesce(split_part(uemail, '@', 1), 'Parceiro(a)'))
  on conflict (household_id, user_id) do nothing;

  update household_invites set accepted_at = now() where id = inv.id;

  return inv.household_id;
end;
$$;

-- ===== 0005_views =====
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

-- ===== 0006_invoice_payments =====
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
