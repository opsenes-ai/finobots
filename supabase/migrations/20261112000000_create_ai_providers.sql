-- AI providers: keys a workspace connects to chat with its own account.
-- With none active, chat falls back to the platform default model.

create table public.ai_providers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  provider text not null check (provider in ('anthropic', 'openai', 'gemini')),
  -- null uses the provider's default model.
  model text check (model is null or char_length(model) between 1 and 100),
  -- Shown in the UI so a key can be recognised. The key itself is never returned.
  key_last4 text not null check (char_length(key_last4) between 1 and 4),
  status text not null default 'active' check (status in ('active', 'error')),
  is_active boolean not null default false,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, provider)
);

comment on table public.ai_providers is 'AI provider keys a workspace has connected for chat.';

create index ai_providers_organization_id_idx on public.ai_providers (organization_id);

-- Only one provider can be in use at a time.
create unique index ai_providers_one_active_idx
  on public.ai_providers (organization_id)
  where is_active;

create trigger ai_providers_set_updated_at
  before update on public.ai_providers
  for each row
  execute function public.set_updated_at();

alter table public.ai_providers enable row level security;

create policy "Members can view AI providers"
  on public.ai_providers
  for select
  to authenticated
  using (public.is_org_member(organization_id));

create policy "Owners and admins can create AI providers"
  on public.ai_providers
  for insert
  to authenticated
  with check (
    public.has_org_role(organization_id, array['owner', 'admin']::public.org_role[])
  );

create policy "Owners and admins can update AI providers"
  on public.ai_providers
  for update
  to authenticated
  using (
    public.has_org_role(organization_id, array['owner', 'admin']::public.org_role[])
  )
  with check (
    public.has_org_role(organization_id, array['owner', 'admin']::public.org_role[])
  );

create policy "Owners and admins can delete AI providers"
  on public.ai_providers
  for delete
  to authenticated
  using (
    public.has_org_role(organization_id, array['owner', 'admin']::public.org_role[])
  );

-- ---------------------------------------------------------------------------
-- The encrypted keys live in their own table. RLS is on with no policies and
-- all client privileges are revoked, so only the service role can read it.
-- ---------------------------------------------------------------------------

create table public.ai_provider_secrets (
  ai_provider_id uuid primary key references public.ai_providers (id) on delete cascade,
  secrets jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

comment on table public.ai_provider_secrets is 'Encrypted AI provider keys. Service role access only.';

create trigger ai_provider_secrets_set_updated_at
  before update on public.ai_provider_secrets
  for each row
  execute function public.set_updated_at();

alter table public.ai_provider_secrets enable row level security;

revoke all on public.ai_provider_secrets from anon, authenticated;
