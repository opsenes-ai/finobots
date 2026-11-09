-- Usernames and organization names.
--
-- At signup both are derived from the email address and made unique:
--   test@example.com  ->  username "test",  organization name "example"
--   next "test"       ->  "test1", then "test2", ...
--   next "example"    ->  "example1", then "example2", ...
--
-- Rules:
--   - user_id and organizations.id are assigned automatically and cannot be changed.
--   - username and organizations.name can be changed, are alphanumeric only
--     (a-z, A-Z, 0-9), 1 to 32 characters, and unique ignoring case.

-- ---------------------------------------------------------------------------
-- Name allocation helpers. Internal only: not callable by API roles, because
-- they would reveal which names are already taken.
-- ---------------------------------------------------------------------------

create function public.unique_username(base text)
returns text
language plpgsql
set search_path = ''
as $$
declare
  candidate text;
  suffix integer := 0;
begin
  base := lower(regexp_replace(coalesce(base, ''), '[^a-zA-Z0-9]', '', 'g'));
  if base = '' then
    base := 'user';
  end if;
  base := left(base, 28);

  candidate := base;
  while exists (
    select 1 from public.profiles where lower(username) = candidate
  ) loop
    suffix := suffix + 1;
    candidate := base || suffix::text;
  end loop;

  return candidate;
end;
$$;

create function public.unique_org_name(base text)
returns text
language plpgsql
set search_path = ''
as $$
declare
  candidate text;
  suffix integer := 0;
begin
  base := lower(regexp_replace(coalesce(base, ''), '[^a-zA-Z0-9]', '', 'g'));
  if base = '' then
    base := 'org';
  end if;
  base := left(base, 28);

  candidate := base;
  while exists (
    select 1 from public.organizations where lower(name) = candidate
  ) loop
    suffix := suffix + 1;
    candidate := base || suffix::text;
  end loop;

  return candidate;
end;
$$;

revoke execute on function public.unique_username(text) from public, anon, authenticated;
revoke execute on function public.unique_org_name(text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Profiles: username column. Existing profiles are backfilled from their email.
-- ---------------------------------------------------------------------------

alter table public.profiles add column username text;

do $$
declare
  r record;
begin
  for r in
    select p.id, u.email
    from public.profiles p
    join auth.users u on u.id = p.id
    order by p.created_at
  loop
    update public.profiles
    set username = public.unique_username(split_part(coalesce(r.email, ''), '@', 1))
    where id = r.id;
  end loop;
end;
$$;

alter table public.profiles alter column username set not null;

alter table public.profiles
  add constraint profiles_username_format
  check (username ~ '^[a-zA-Z0-9]{1,32}$');

create unique index profiles_username_lower_key
  on public.profiles (lower(username));

-- ---------------------------------------------------------------------------
-- Organizations: existing names are replaced with the new style, then the
-- format rule and uniqueness are enforced.
-- ---------------------------------------------------------------------------

do $$
declare
  r record;
begin
  for r in
    select o.id, u.email
    from public.organizations o
    left join auth.users u on u.id = o.created_by
    order by o.created_at
  loop
    update public.organizations
    set name = public.unique_org_name(
      split_part(split_part(coalesce(r.email, ''), '@', 2), '.', 1)
    )
    where id = r.id;
  end loop;
end;
$$;

alter table public.organizations
  add constraint organizations_name_format
  check (name ~ '^[a-zA-Z0-9]{1,32}$');

create unique index organizations_name_lower_key
  on public.organizations (lower(name));

-- ---------------------------------------------------------------------------
-- Signup: assign username and organization name automatically.
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  email_local text;
  email_domain text;
begin
  email_local := split_part(coalesce(new.email, ''), '@', 1);
  email_domain := split_part(split_part(coalesce(new.email, ''), '@', 2), '.', 1);

  -- Allocate names one signup at a time so two people signing up together
  -- cannot be handed the same name.
  perform pg_advisory_xact_lock(hashtext('finobots_signup_names'));

  -- user_id (uuid v8) is filled in by the column default.
  insert into public.profiles (id, full_name, username)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    public.unique_username(email_local)
  );

  -- Organization id (uuid v8) is filled in by the column default. The
  -- on_organization_created trigger makes the new user its owner.
  insert into public.organizations (name, slug, created_by)
  values (
    public.unique_org_name(email_domain),
    'org-' || replace(new.id::text, '-', ''),
    new.id
  );

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Who can change what. Ids, slug and created_by are fixed once assigned.
-- ---------------------------------------------------------------------------

-- Profiles: full_name, avatar_url (earlier migration) and now username.
grant update (username) on public.profiles to authenticated;

-- Organizations: only the name is editable. Row level security still limits
-- the update to owners and admins.
revoke update on public.organizations from authenticated;
grant update (name) on public.organizations to authenticated;
