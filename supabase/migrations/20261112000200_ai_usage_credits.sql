-- AI usage, credits and per-model limits.
--
-- Credits apply to the platform's built-in model only. Each user starts with
-- 100 credits (an internal budget of 5 USD, so 1 credit = 0.05 USD) and gets
-- 5 more every day (UTC), up to 100. Workspaces can also set their own daily
-- message limit for each model, including the built-in one.

-- ---------------------------------------------------------------------------
-- Usage: one row per chat reply. Written by the server only.
-- ---------------------------------------------------------------------------

create table public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  provider text not null check (provider in ('platform', 'anthropic', 'openai', 'gemini')),
  model text not null check (char_length(model) between 1 and 100),
  input_tokens integer not null default 0 check (input_tokens >= 0),
  output_tokens integer not null default 0 check (output_tokens >= 0),
  -- Only the built-in model uses credits.
  credits numeric(12, 4) not null default 0 check (credits >= 0),
  created_at timestamptz not null default now()
);

comment on table public.ai_usage is 'One row per AI chat reply. Written by server code only.';

create index ai_usage_organization_id_created_at_idx
  on public.ai_usage (organization_id, created_at desc);

alter table public.ai_usage enable row level security;

create policy "Members can view AI usage"
  on public.ai_usage
  for select
  to authenticated
  using (public.is_org_member(organization_id));

revoke insert, update, delete on public.ai_usage from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Credits: one row per user, topped up lazily when it's read.
-- ---------------------------------------------------------------------------

create table public.ai_credits (
  user_id uuid primary key references auth.users (id) on delete cascade,
  balance numeric(12, 4) not null check (balance >= 0),
  topped_up_on date not null default ((now() at time zone 'utc')::date)
);

comment on table public.ai_credits is 'Built-in model credits per user. Service role access only.';

alter table public.ai_credits enable row level security;

revoke all on public.ai_credits from anon, authenticated;

-- Returns the balance after applying any daily top-ups (5 a day, up to 100).
create function public.ai_credit_balance(p_user uuid)
returns numeric
language plpgsql
security definer
set search_path = ''
as $$
declare
  today date := (now() at time zone 'utc')::date;
  current_balance numeric;
begin
  insert into public.ai_credits (user_id, balance, topped_up_on)
  values (p_user, 100, today)
  on conflict (user_id) do nothing;

  update public.ai_credits
  set balance = least(100, balance + 5 * (today - topped_up_on)),
      topped_up_on = today
  where user_id = p_user and topped_up_on < today;

  select balance into current_balance from public.ai_credits where user_id = p_user;
  return current_balance;
end;
$$;

-- Takes credits off a user's balance, never below zero. Returns the new balance.
create function public.ai_charge_credits(p_user uuid, p_amount numeric)
returns numeric
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_balance numeric;
begin
  perform public.ai_credit_balance(p_user);

  update public.ai_credits
  set balance = greatest(0, balance - greatest(0, p_amount))
  where user_id = p_user
  returning balance into new_balance;

  return new_balance;
end;
$$;

revoke execute on function public.ai_credit_balance(uuid) from public, anon, authenticated;
revoke execute on function public.ai_charge_credits(uuid, numeric) from public, anon, authenticated;

-- What the signed-in user sees on the Usage page.
create function public.my_ai_credits()
returns table (balance numeric, cap numeric, daily_topup numeric)
language sql
security definer
set search_path = ''
as $$
  select public.ai_credit_balance((select auth.uid())), 100::numeric, 5::numeric
  where (select auth.uid()) is not null;
$$;

revoke execute on function public.my_ai_credits() from public, anon;
grant execute on function public.my_ai_credits() to authenticated;

-- ---------------------------------------------------------------------------
-- Limits: an optional daily message limit per model. No row means no limit.
-- ---------------------------------------------------------------------------

create table public.ai_model_limits (
  organization_id uuid not null references public.organizations (id) on delete cascade,
  provider text not null check (provider in ('platform', 'anthropic', 'openai', 'gemini')),
  daily_message_limit integer not null check (daily_message_limit between 1 and 10000),
  updated_at timestamptz not null default now(),
  primary key (organization_id, provider)
);

create trigger ai_model_limits_set_updated_at
  before update on public.ai_model_limits
  for each row
  execute function public.set_updated_at();

alter table public.ai_model_limits enable row level security;

create policy "Members can view model limits"
  on public.ai_model_limits
  for select
  to authenticated
  using (public.is_org_member(organization_id));

create policy "Owners and admins can create model limits"
  on public.ai_model_limits
  for insert
  to authenticated
  with check (
    public.has_org_role(organization_id, array['owner', 'admin']::public.org_role[])
  );

create policy "Owners and admins can update model limits"
  on public.ai_model_limits
  for update
  to authenticated
  using (
    public.has_org_role(organization_id, array['owner', 'admin']::public.org_role[])
  )
  with check (
    public.has_org_role(organization_id, array['owner', 'admin']::public.org_role[])
  );

create policy "Owners and admins can delete model limits"
  on public.ai_model_limits
  for delete
  to authenticated
  using (
    public.has_org_role(organization_id, array['owner', 'admin']::public.org_role[])
  );
