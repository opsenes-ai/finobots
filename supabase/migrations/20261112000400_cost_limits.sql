-- Limits in USD (daily, weekly, monthly) instead of a message count.
-- Every usage row now records an estimated cost, for built-in and own keys.

alter table public.agent_settings
  drop column daily_message_limit,
  -- null means no limit.
  add column daily_limit_usd numeric(10, 2)
    check (daily_limit_usd is null or daily_limit_usd between 0.01 and 100000),
  add column weekly_limit_usd numeric(10, 2)
    check (weekly_limit_usd is null or weekly_limit_usd between 0.01 and 100000),
  add column monthly_limit_usd numeric(10, 2)
    check (monthly_limit_usd is null or monthly_limit_usd between 0.01 and 100000),
  -- A shorter period can't be allowed more than a longer one.
  add constraint agent_settings_limits_ordered check (
    (daily_limit_usd is null or weekly_limit_usd is null or daily_limit_usd <= weekly_limit_usd)
    and (weekly_limit_usd is null or monthly_limit_usd is null or weekly_limit_usd <= monthly_limit_usd)
    and (daily_limit_usd is null or monthly_limit_usd is null or daily_limit_usd <= monthly_limit_usd)
  );

alter table public.ai_usage
  add column cost_usd numeric(12, 6) not null default 0 check (cost_usd >= 0);

-- Existing built-in rows: 1 credit is 0.05 USD.
update public.ai_usage set cost_usd = credits * 0.05 where provider = 'platform';

-- Spend so far today, this week (from Monday) and this month, all in UTC.
-- Runs as the caller, so row level security limits it to their workspace.
create function public.ai_spend(p_org uuid)
returns table (day numeric, week numeric, month numeric)
language sql
stable
set search_path = ''
as $$
  select
    coalesce(sum(cost_usd) filter (
      where created_at >= date_trunc('day', now() at time zone 'utc') at time zone 'utc'), 0),
    coalesce(sum(cost_usd) filter (
      where created_at >= date_trunc('week', now() at time zone 'utc') at time zone 'utc'), 0),
    coalesce(sum(cost_usd), 0)
  from public.ai_usage
  where organization_id = p_org
    and created_at >= date_trunc('month', now() at time zone 'utc') at time zone 'utc';
$$;

revoke execute on function public.ai_spend(uuid) from public, anon;
grant execute on function public.ai_spend(uuid) to authenticated;
