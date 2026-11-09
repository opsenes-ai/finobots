-- New users automatically get a profile and a personal organization.
--
-- IDs are native Postgres uuid columns (16 bytes each):
--   profiles.id          = auth.users.id (assigned by Supabase Auth)
--   organizations.id     = gen_random_uuid() (assigned by the table default)
--
-- The user becomes the organization's owner through the existing
-- on_organization_created trigger, which inserts into organization_members.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  display_name text;
begin
  -- Prefer the name given at signup, fall back to the email prefix.
  display_name := coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'My'
  );

  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');

  -- The slug is derived from the unique user id, so it cannot collide.
  -- Users can rename the organization later.
  insert into public.organizations (name, slug, created_by)
  values (
    left(display_name, 80) || '''s workspace',
    'org-' || replace(new.id::text, '-', ''),
    new.id
  );

  return new;
end;
$$;
