-- Accounts: balances held at a provider, or added manually.

create type public.account_type as enum ('checking', 'savings', 'credit', 'wallet', 'other');

create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  connection_id uuid,
  name text not null check (char_length(name) between 1 and 100),
  type public.account_type not null default 'other',
  external_id text,
  currency text not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  balance numeric(19, 4) not null default 0,
  balance_updated_at timestamptz,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, organization_id),
  unique (connection_id, external_id),
  -- Keeps an account and its connection in the same organization.
  -- Deleting a connection clears only connection_id (requires Postgres 15+).
  foreign key (connection_id, organization_id)
    references public.connections (id, organization_id)
    on delete set null (connection_id)
);

comment on table public.accounts is 'A financial account belonging to an organization.';

create index accounts_organization_id_idx on public.accounts (organization_id);
create index accounts_connection_id_idx on public.accounts (connection_id);

create trigger accounts_set_updated_at
  before update on public.accounts
  for each row
  execute function public.set_updated_at();

alter table public.accounts enable row level security;

create policy "Members can view accounts"
  on public.accounts
  for select
  to authenticated
  using (public.is_org_member(organization_id));

create policy "Owners and admins can create accounts"
  on public.accounts
  for insert
  to authenticated
  with check (
    public.has_org_role(organization_id, array['owner', 'admin']::public.org_role[])
  );

create policy "Owners and admins can update accounts"
  on public.accounts
  for update
  to authenticated
  using (
    public.has_org_role(organization_id, array['owner', 'admin']::public.org_role[])
  )
  with check (
    public.has_org_role(organization_id, array['owner', 'admin']::public.org_role[])
  );

create policy "Owners and admins can delete accounts"
  on public.accounts
  for delete
  to authenticated
  using (
    public.has_org_role(organization_id, array['owner', 'admin']::public.org_role[])
  );
