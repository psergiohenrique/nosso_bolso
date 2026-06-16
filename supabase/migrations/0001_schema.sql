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
