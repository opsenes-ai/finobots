-- One user, one workspace (for now).
--
-- Every user gets exactly one workspace at signup, and every workspace has
-- exactly one member: its owner. Users can't create extra workspaces, add or
-- remove members, or leave their workspace. Workspace data stays isolated by
-- the existing row level security on organization_id.
--
-- To allow teams later: drop the two organization_members unique indexes and
-- the organizations_one_per_creator index, then restore member policies.

-- ---------------------------------------------------------------------------
-- Backfill: users who signed up before the signup trigger created a
-- workspace get one now. The on_organization_created trigger adds them as
-- owner.
-- ---------------------------------------------------------------------------

do $$
declare
  r record;
begin
  for r in
    select u.id, u.email
    from auth.users u
    where not exists (
      select 1 from public.organization_members m where m.user_id = u.id
    )
    order by u.created_at
  loop
    insert into public.organizations (name, slug, created_by)
    values (
      public.unique_org_name(
        split_part(split_part(coalesce(r.email, ''), '@', 2), '.', 1)
      ),
      'org-' || replace(r.id::text, '-', ''),
      r.id
    );
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Enforce one workspace per user and one user per workspace.
-- ---------------------------------------------------------------------------

create unique index organization_members_one_workspace_per_user
  on public.organization_members (user_id);

create unique index organization_members_one_user_per_workspace
  on public.organization_members (organization_id);

create unique index organizations_one_per_creator
  on public.organizations (created_by);

-- Workspaces are created only by the signup trigger, never by users.
drop policy "Users can create organizations" on public.organizations;
drop policy "Owners can delete organizations" on public.organizations;
revoke insert, delete on public.organizations from authenticated;

-- Membership is managed only by triggers.
drop policy "Owners and admins can add members" on public.organization_members;
drop policy "Owners and admins can change roles" on public.organization_members;
drop policy "Owners and admins can remove members, users can leave" on public.organization_members;
revoke insert, update, delete on public.organization_members from authenticated;

-- ---------------------------------------------------------------------------
-- The signed-in user's workspace, looked up by their user id. Runs as the
-- user, so row level security applies.
-- ---------------------------------------------------------------------------

create function public.my_workspace()
returns table (organization_id uuid, name text, slug text, role public.org_role)
language sql
stable
security invoker
set search_path = ''
as $$
  select o.id, o.name, o.slug, m.role
  from public.organization_members m
  join public.organizations o on o.id = m.organization_id
  where m.user_id = (select auth.uid())
  limit 1;
$$;

revoke execute on function public.my_workspace() from public, anon;
grant execute on function public.my_workspace() to authenticated;
