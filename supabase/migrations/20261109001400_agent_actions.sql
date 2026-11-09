-- Actions the agent proposes, and the user's decision on each.
--
-- Lifecycle: proposed -> approved | rejected, then approved -> executed | failed.
-- Members can propose. Owners and admins approve or reject. Only server code
-- (the service role) marks an action executed or failed, so a user can't
-- record an action as done without it running.

create type public.agent_action_status as enum (
  'proposed', 'approved', 'rejected', 'executed', 'failed'
);

create table public.agent_actions (
  id uuid primary key default public.uuid_v8(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  chat_id uuid references public.chats (id) on delete set null,
  connection_id uuid,
  type text not null check (type in ('send_invoice', 'send_reminder')),
  payload jsonb not null default '{}'::jsonb,
  summary text check (summary is null or char_length(summary) <= 500),
  status public.agent_action_status not null default 'proposed',
  proposed_by uuid references auth.users (id) on delete set null,
  decided_by uuid references auth.users (id) on delete set null,
  decided_at timestamptz,
  executed_at timestamptz,
  result jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Keeps the action and its connection in the same workspace.
  foreign key (connection_id, organization_id)
    references public.connections (id, organization_id)
    on delete set null (connection_id)
);

comment on table public.agent_actions is 'Agent-proposed actions and their approval status.';

create index agent_actions_organization_status_idx
  on public.agent_actions (organization_id, status, created_at desc);

create trigger agent_actions_set_updated_at
  before update on public.agent_actions
  for each row
  execute function public.set_updated_at();

alter table public.agent_actions enable row level security;

create policy "Members can view actions"
  on public.agent_actions
  for select
  to authenticated
  using (public.is_org_member(organization_id));

create policy "Members can propose actions"
  on public.agent_actions
  for insert
  to authenticated
  with check (
    public.is_org_member(organization_id)
    and status = 'proposed'
    and proposed_by = (select auth.uid())
    and decided_by is null
    and decided_at is null
    and executed_at is null
    and result is null
  );

create policy "Owners and admins can approve or reject proposed actions"
  on public.agent_actions
  for update
  to authenticated
  using (
    status = 'proposed'
    and public.has_org_role(organization_id, array['owner', 'admin']::public.org_role[])
  )
  with check (
    status in ('approved', 'rejected')
    and decided_by = (select auth.uid())
    and public.has_org_role(organization_id, array['owner', 'admin']::public.org_role[])
  );

-- Users can only record a decision; everything else is set by the server.
revoke update on public.agent_actions from authenticated;
grant update (status, decided_by, decided_at) on public.agent_actions to authenticated;
