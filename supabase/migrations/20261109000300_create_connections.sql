-- Connections: links between an organization and an external provider (PayPal, Venmo).

create type public.connection_status as enum ('pending', 'active', 'error', 'disconnected');

create table public.connections (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  provider text not null check (provider in ('paypal', 'venmo')),
  name text not null check (char_length(name) between 1 and 100),
  status public.connection_status not null default 'pending',
  external_account_id text,
  last_synced_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Lets child tables enforce that they belong to the same organization.
  unique (id, organization_id),
  unique (organization_id, provider, external_account_id)
);

comment on table public.connections is 'An organization''s link to an external payment provider.';

create index connections_organization_id_idx on public.connections (organization_id);

create trigger connections_set_updated_at
  before update on public.connections
  for each row
  execute function public.set_updated_at();

alter table public.connections enable row level security;

create policy "Members can view connections"
  on public.connections
  for select
  to authenticated
  using (public.is_org_member(organization_id));

create policy "Owners and admins can create connections"
  on public.connections
  for insert
  to authenticated
  with check (
    public.has_org_role(organization_id, array['owner', 'admin']::public.org_role[])
  );

create policy "Owners and admins can update connections"
  on public.connections
  for update
  to authenticated
  using (
    public.has_org_role(organization_id, array['owner', 'admin']::public.org_role[])
  )
  with check (
    public.has_org_role(organization_id, array['owner', 'admin']::public.org_role[])
  );

create policy "Owners and admins can delete connections"
  on public.connections
  for delete
  to authenticated
  using (
    public.has_org_role(organization_id, array['owner', 'admin']::public.org_role[])
  );

-- ---------------------------------------------------------------------------
-- Credentials live in their own table so tokens are never exposed through
-- the connections policies. RLS is on with no policies and all client
-- privileges are revoked, so only the service role (server-side code) can
-- read or write it. Encrypt the values or move them to Supabase Vault
-- before storing real provider tokens.
-- ---------------------------------------------------------------------------

create table public.connection_credentials (
  connection_id uuid primary key references public.connections (id) on delete cascade,
  secrets jsonb not null default '{}'::jsonb,
  expires_at timestamptz,
  updated_at timestamptz not null default now()
);

comment on table public.connection_credentials is 'Provider secrets. Service role access only.';

create trigger connection_credentials_set_updated_at
  before update on public.connection_credentials
  for each row
  execute function public.set_updated_at();

alter table public.connection_credentials enable row level security;

revoke all on public.connection_credentials from anon, authenticated;
