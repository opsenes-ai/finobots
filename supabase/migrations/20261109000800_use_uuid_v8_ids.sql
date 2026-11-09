-- UUID version 8 ids for users and organizations.
--
-- Format: 32 hexadecimal digits plus 4 hyphens (36 characters), stored as a
-- native uuid, which is 16 bytes (128 bits).
-- Version 8 means an application-defined layout. Ours is random bits with the
-- version nibble set to 8 and the standard variant bits kept.

create function public.uuid_v8()
returns uuid
language sql
volatile
set search_path = ''
as $$
  select encode(
    set_byte(b, 6, (get_byte(b, 6) & 15) | 128),  -- version nibble = 8
    'hex'
  )::uuid
  from (select uuid_send(gen_random_uuid()) as b) as t;
$$;

comment on function public.uuid_v8() is 'Generates a random version 8 uuid.';

-- Organizations: every new organization id is a version 8 uuid.
alter table public.organizations
  alter column id set default public.uuid_v8();

-- Users: auth.users.id is created by Supabase Auth and stays the internal key
-- for foreign keys and row level security. user_id is the app-level id,
-- assigned automatically when the profile is created at signup.
alter table public.profiles
  add column user_id uuid not null default public.uuid_v8();

alter table public.profiles
  add constraint profiles_user_id_key unique (user_id);

comment on column public.profiles.user_id is
  'App-level user id (uuid v8), assigned automatically at signup. Read-only for users.';

-- user_id is assigned once and never edited by the user. The existing update
-- policy allows any column, so limit updates to the editable ones.
revoke update on public.profiles from authenticated;
grant update (full_name, avatar_url) on public.profiles to authenticated;
