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
