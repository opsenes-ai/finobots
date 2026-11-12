-- One daily message limit per workspace, instead of one per model.
-- ai_model_limits was added in the previous migration and has no data yet.

drop table public.ai_model_limits;

-- null means no limit.
alter table public.agent_settings
  add column daily_message_limit integer
    check (daily_message_limit is null or daily_message_limit between 1 and 10000);
