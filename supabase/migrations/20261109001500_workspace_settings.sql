-- Workspace, agent, and notification settings.

-- ---------------------------------------------------------------------------
-- General settings live on the workspace itself.
-- ---------------------------------------------------------------------------

alter table public.organizations
  add column default_currency text not null default 'USD'
    check (default_currency ~ '^[A-Z]{3}$'),
  add column timezone text not null default 'UTC'
    check (char_length(timezone) between 1 and 64),
  add column date_format text not null default 'YYYY-MM-DD'
    check (date_format in ('YYYY-MM-DD', 'DD/MM/YYYY', 'MM/DD/YYYY')),
  -- null keeps data until it's deleted.
  add column retention_days integer
    check (retention_days is null or retention_days between 30 and 3650);

-- The existing update policy limits this to owners and admins.
grant update (default_currency, timezone, date_format, retention_days)
  on public.organizations to authenticated;

-- ---------------------------------------------------------------------------
-- Agent settings: one row per workspace. When there's no row, the defaults
-- below apply. Provider API keys are not stored here; they're server secrets.
-- ---------------------------------------------------------------------------

create table public.agent_settings (
  organization_id uuid primary key references public.organizations (id) on delete cascade,
  provider text not null default 'openai'
    check (char_length(provider) between 1 and 50),
  model text check (model is null or char_length(model) between 1 and 100),
  instructions text check (instructions is null or char_length(instructions) <= 4000),
  -- true means the action needs approval before it runs.
  approval_rules jsonb not null
    default '{"send_invoice": true, "send_reminder": true}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger agent_settings_set_updated_at
  before update on public.agent_settings
  for each row
  execute function public.set_updated_at();

alter table public.agent_settings enable row level security;

create policy "Members can view agent settings"
  on public.agent_settings
  for select
  to authenticated
  using (public.is_org_member(organization_id));

create policy "Owners and admins can create agent settings"
  on public.agent_settings
  for insert
  to authenticated
  with check (
    public.has_org_role(organization_id, array['owner', 'admin']::public.org_role[])
  );

create policy "Owners and admins can update agent settings"
  on public.agent_settings
  for update
  to authenticated
  using (
    public.has_org_role(organization_id, array['owner', 'admin']::public.org_role[])
  )
  with check (
    public.has_org_role(organization_id, array['owner', 'admin']::public.org_role[])
  );

-- ---------------------------------------------------------------------------
-- Notification preferences: one row per user, private to that user.
-- ---------------------------------------------------------------------------

create table public.notification_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email_enabled boolean not null default true,
  in_app_enabled boolean not null default true,
  alerts jsonb not null
    default '{"payments": true, "invoices": true, "approvals": true}'::jsonb,
  digest text not null default 'weekly' check (digest in ('off', 'daily', 'weekly')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger notification_preferences_set_updated_at
  before update on public.notification_preferences
  for each row
  execute function public.set_updated_at();

alter table public.notification_preferences enable row level security;

create policy "Users can view their own notification preferences"
  on public.notification_preferences
  for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can create their own notification preferences"
  on public.notification_preferences
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "Users can update their own notification preferences"
  on public.notification_preferences
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
