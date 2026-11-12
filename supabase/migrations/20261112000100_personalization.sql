-- Personalization: response style on agent_settings, plus saved memories.

alter table public.agent_settings
  add column response_tone text not null default 'professional'
    check (response_tone in ('professional', 'friendly', 'direct')),
  add column response_length text not null default 'balanced'
    check (response_length in ('concise', 'balanced', 'detailed'));

-- ---------------------------------------------------------------------------
-- Memories: short facts the agent should remember about the business.
-- ---------------------------------------------------------------------------

create table public.agent_memories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  content text not null check (char_length(content) between 1 and 500),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

comment on table public.agent_memories is 'Facts the agent remembers about a workspace.';

create index agent_memories_organization_id_idx
  on public.agent_memories (organization_id, created_at desc);

alter table public.agent_memories enable row level security;

create policy "Members can view memories"
  on public.agent_memories
  for select
  to authenticated
  using (public.is_org_member(organization_id));

create policy "Owners and admins can add memories"
  on public.agent_memories
  for insert
  to authenticated
  with check (
    public.has_org_role(organization_id, array['owner', 'admin']::public.org_role[])
  );

create policy "Owners and admins can delete memories"
  on public.agent_memories
  for delete
  to authenticated
  using (
    public.has_org_role(organization_id, array['owner', 'admin']::public.org_role[])
  );
