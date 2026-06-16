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
