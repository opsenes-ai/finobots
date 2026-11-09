-- Private storage buckets.
--
-- avatars          <user_id>/<file>              Only the user.
-- workspace-files  <org_id>/<area>/<file>        Only members of that workspace.
--   areas: receipts, imports (members upload), exports (written by the server)
--
-- The existing user-uploads bucket is left as it is, so nothing stored there
-- is lost.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'avatars',
    'avatars',
    false,
    2097152, -- 2 MiB
    array['image/png', 'image/jpeg', 'image/webp']
  ),
  (
    'workspace-files',
    'workspace-files',
    false,
    20971520, -- 20 MiB
    array[
      'image/png',
      'image/jpeg',
      'image/webp',
      'application/pdf',
      'text/csv',
      'application/json',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
  )
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- avatars: a folder per user.
-- ---------------------------------------------------------------------------

create policy "Users can view their own avatar"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users can upload their own avatar"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users can replace their own avatar"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users can delete their own avatar"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- ---------------------------------------------------------------------------
-- workspace-files: a folder per workspace. The workspace folder is compared
-- as text, so a malformed path is simply denied instead of raising an error.
-- ---------------------------------------------------------------------------

create policy "Members can view workspace files"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'workspace-files'
    and (storage.foldername(name))[1] in (
      select m.organization_id::text
      from public.organization_members m
      where m.user_id = (select auth.uid())
    )
  );

create policy "Members can upload receipts and imports"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'workspace-files'
    and (storage.foldername(name))[2] in ('receipts', 'imports')
    and (storage.foldername(name))[1] in (
      select m.organization_id::text
      from public.organization_members m
      where m.user_id = (select auth.uid())
    )
  );

create policy "Members can replace receipts and imports"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'workspace-files'
    and (storage.foldername(name))[2] in ('receipts', 'imports')
    and (storage.foldername(name))[1] in (
      select m.organization_id::text
      from public.organization_members m
      where m.user_id = (select auth.uid())
    )
  )
  with check (
    bucket_id = 'workspace-files'
    and (storage.foldername(name))[2] in ('receipts', 'imports')
    and (storage.foldername(name))[1] in (
      select m.organization_id::text
      from public.organization_members m
      where m.user_id = (select auth.uid())
    )
  );

create policy "Members can delete receipts and imports"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'workspace-files'
    and (storage.foldername(name))[2] in ('receipts', 'imports')
    and (storage.foldername(name))[1] in (
      select m.organization_id::text
      from public.organization_members m
      where m.user_id = (select auth.uid())
    )
  );
