-- Chats: a user's conversations with the agent, scoped to an organization.
-- Chats are private to the user who created them.

create table public.chats (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default 'New chat' check (char_length(title) between 1 and 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.chats is 'A conversation between a user and the agent.';

create index chats_user_updated_idx on public.chats (user_id, updated_at desc);
create index chats_organization_id_idx on public.chats (organization_id);

create trigger chats_set_updated_at
  before update on public.chats
  for each row
  execute function public.set_updated_at();

alter table public.chats enable row level security;

create policy "Users can view their own chats"
  on public.chats
  for select
  to authenticated
  using (
    user_id = (select auth.uid())
    and public.is_org_member(organization_id)
  );

create policy "Users can create their own chats"
  on public.chats
  for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and public.is_org_member(organization_id)
  );

create policy "Users can update their own chats"
  on public.chats
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and public.is_org_member(organization_id)
  );

create policy "Users can delete their own chats"
  on public.chats
  for delete
  to authenticated
  using (user_id = (select auth.uid()));
