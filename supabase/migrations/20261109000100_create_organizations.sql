-- Organizations and memberships.

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------

create type public.org_role as enum ('owner', 'admin', 'member');

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 100),
  slug text not null unique
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 2 and 50),
  created_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.organizations is 'A business or team that owns financial data.';

create table public.organization_members (
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.org_role not null default 'member',
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

comment on table public.organization_members is 'Links users to organizations with a role.';

create index organization_members_user_id_idx
  on public.organization_members (user_id);

create trigger organizations_set_updated_at
  before update on public.organizations
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Helper functions
-- security definer so policies can check membership without recursing
-- into the RLS policies of organization_members.
-- ---------------------------------------------------------------------------

create function public.is_org_member(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members m
    where m.organization_id = org_id
      and m.user_id = (select auth.uid())
  );
$$;

create function public.has_org_role(org_id uuid, allowed public.org_role[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members m
    where m.organization_id = org_id
      and m.user_id = (select auth.uid())
      and m.role = any (allowed)
  );
$$;

create function public.shares_org_with(other_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members mine
    join public.organization_members theirs
      on theirs.organization_id = mine.organization_id
    where mine.user_id = (select auth.uid())
      and theirs.user_id = other_user_id
  );
$$;

revoke execute on function public.is_org_member(uuid) from public, anon;
revoke execute on function public.has_org_role(uuid, public.org_role[]) from public, anon;
revoke execute on function public.shares_org_with(uuid) from public, anon;
grant execute on function public.is_org_member(uuid) to authenticated;
grant execute on function public.has_org_role(uuid, public.org_role[]) to authenticated;
grant execute on function public.shares_org_with(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Creator becomes owner automatically
-- ---------------------------------------------------------------------------

create function public.handle_new_organization()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.organization_members (organization_id, user_id, role)
  values (new.id, new.created_by, 'owner');
  return new;
end;
$$;

create trigger on_organization_created
  after insert on public.organizations
  for each row
  execute function public.handle_new_organization();

-- ---------------------------------------------------------------------------
-- Row level security: organizations
-- ---------------------------------------------------------------------------

alter table public.organizations enable row level security;

create policy "Members can view their organizations"
  on public.organizations
  for select
  to authenticated
  using (
    created_by = (select auth.uid())
    or public.is_org_member(id)
  );

create policy "Users can create organizations"
  on public.organizations
  for insert
  to authenticated
  with check (created_by = (select auth.uid()));

create policy "Owners and admins can update organizations"
  on public.organizations
  for update
  to authenticated
  using (public.has_org_role(id, array['owner', 'admin']::public.org_role[]))
  with check (public.has_org_role(id, array['owner', 'admin']::public.org_role[]));

create policy "Owners can delete organizations"
  on public.organizations
  for delete
  to authenticated
  using (public.has_org_role(id, array['owner']::public.org_role[]));

-- ---------------------------------------------------------------------------
-- Row level security: organization_members
-- ---------------------------------------------------------------------------

alter table public.organization_members enable row level security;

create policy "Members can view fellow members"
  on public.organization_members
  for select
  to authenticated
  using (public.is_org_member(organization_id));

create policy "Owners and admins can add members"
  on public.organization_members
  for insert
  to authenticated
  with check (
    public.has_org_role(organization_id, array['owner', 'admin']::public.org_role[])
  );

create policy "Owners and admins can change roles"
  on public.organization_members
  for update
  to authenticated
  using (
    public.has_org_role(organization_id, array['owner', 'admin']::public.org_role[])
  )
  with check (
    public.has_org_role(organization_id, array['owner', 'admin']::public.org_role[])
  );

create policy "Owners and admins can remove members, users can leave"
  on public.organization_members
  for delete
  to authenticated
  using (
    user_id = (select auth.uid())
    or public.has_org_role(organization_id, array['owner', 'admin']::public.org_role[])
  );

-- ---------------------------------------------------------------------------
-- Profiles: let teammates see each other
-- ---------------------------------------------------------------------------

create policy "Members can view profiles of people in their organizations"
  on public.profiles
  for select
  to authenticated
  using (public.shares_org_with(id));
