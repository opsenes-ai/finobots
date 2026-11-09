-- API keys for programmatic access to a workspace.
--
-- Keys are generated on the server and shown once. Only a hash is stored,
-- so a database leak can't reveal usable keys. Users never insert keys
-- directly; server code (the service role) creates them.

create table public.api_keys (
  id uuid primary key default public.uuid_v8(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  -- The first characters of the key, shown so users can tell keys apart.
  prefix text not null check (char_length(prefix) between 4 and 16),
  key_hash text not null unique,
  scopes text[] not null default '{}'::text[]
    check (
      scopes <@ array[
        'accounts:read',
        'transactions:read',
        'transactions:write',
        'cashflow:read',
        'connections:read'
      ]::text[]
    ),
  created_by uuid references auth.users (id) on delete set null,
  last_used_at timestamptz,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

comment on table public.api_keys is 'Hashed API keys. The plain key is never stored.';

create index api_keys_organization_id_idx on public.api_keys (organization_id);

alter table public.api_keys enable row level security;

create policy "Owners and admins can view API keys"
  on public.api_keys
  for select
  to authenticated
  using (
    public.has_org_role(organization_id, array['owner', 'admin']::public.org_role[])
  );

create policy "Owners and admins can rename or revoke API keys"
  on public.api_keys
  for update
  to authenticated
  using (
    public.has_org_role(organization_id, array['owner', 'admin']::public.org_role[])
  )
  with check (
    public.has_org_role(organization_id, array['owner', 'admin']::public.org_role[])
  );

-- The hash is never readable from the app, and only the name and
-- revocation can be changed.
revoke select, insert, update, delete on public.api_keys from authenticated;
grant select (
  id, organization_id, name, prefix, scopes, created_by,
  last_used_at, expires_at, revoked_at, created_at
) on public.api_keys to authenticated;
grant update (name, revoked_at) on public.api_keys to authenticated;

-- ---------------------------------------------------------------------------
-- Daily request counts per key, written by server code.
-- ---------------------------------------------------------------------------

create table public.api_key_usage (
  api_key_id uuid not null references public.api_keys (id) on delete cascade,
  day date not null,
  requests integer not null default 0 check (requests >= 0),
  primary key (api_key_id, day)
);

alter table public.api_key_usage enable row level security;

create policy "Owners and admins can view API key usage"
  on public.api_key_usage
  for select
  to authenticated
  using (
    exists (
      select 1 from public.api_keys k
      where k.id = api_key_id
        and public.has_org_role(k.organization_id, array['owner', 'admin']::public.org_role[])
    )
  );

revoke insert, update, delete on public.api_key_usage from authenticated;
