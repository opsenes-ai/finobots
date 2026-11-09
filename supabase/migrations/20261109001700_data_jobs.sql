-- Import and export jobs.
--
-- Owners and admins request a job; server code processes it and records the
-- result. Files live in the workspace-files bucket under the workspace's
-- folder, which the file_path check enforces.

create type public.data_job_kind as enum ('import', 'export');
create type public.data_job_status as enum ('pending', 'processing', 'completed', 'failed');

create table public.data_jobs (
  id uuid primary key default public.uuid_v8(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  kind public.data_job_kind not null,
  status public.data_job_status not null default 'pending',
  format text not null check (format in ('csv', 'json')),
  file_path text check (file_path is null or file_path like organization_id::text || '/%'),
  row_count integer check (row_count is null or row_count >= 0),
  error text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

comment on table public.data_jobs is 'Import and export jobs for a workspace.';

create index data_jobs_organization_created_idx
  on public.data_jobs (organization_id, created_at desc);

create trigger data_jobs_set_updated_at
  before update on public.data_jobs
  for each row
  execute function public.set_updated_at();

alter table public.data_jobs enable row level security;

create policy "Members can view data jobs"
  on public.data_jobs
  for select
  to authenticated
  using (public.is_org_member(organization_id));

create policy "Owners and admins can request data jobs"
  on public.data_jobs
  for insert
  to authenticated
  with check (
    public.has_org_role(organization_id, array['owner', 'admin']::public.org_role[])
    and status = 'pending'
    and created_by = (select auth.uid())
    and row_count is null
    and error is null
    and completed_at is null
  );

-- Progress and results are written only by server code.
revoke update, delete on public.data_jobs from authenticated;
