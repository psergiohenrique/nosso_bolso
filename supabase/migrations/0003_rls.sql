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
