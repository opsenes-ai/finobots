-- Messages in a chat. Private to the user who owns the chat, like chats.
-- Messages are immutable: they can be added or deleted, not edited.

create type public.chat_message_role as enum ('user', 'assistant');

create table public.chat_messages (
  id uuid primary key default public.uuid_v8(),
  chat_id uuid not null references public.chats (id) on delete cascade,
  role public.chat_message_role not null,
  content text not null check (char_length(content) <= 32000),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

comment on table public.chat_messages is 'A message in a chat between a user and the agent.';

create index chat_messages_chat_created_idx
  on public.chat_messages (chat_id, created_at);

alter table public.chat_messages enable row level security;

create policy "Users can view messages in their own chats"
  on public.chat_messages
  for select
  to authenticated
  using (
    exists (
      select 1 from public.chats c
      where c.id = chat_id and c.user_id = (select auth.uid())
    )
  );

create policy "Users can add messages to their own chats"
  on public.chat_messages
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.chats c
      where c.id = chat_id and c.user_id = (select auth.uid())
    )
  );

create policy "Users can delete messages in their own chats"
  on public.chat_messages
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.chats c
      where c.id = chat_id and c.user_id = (select auth.uid())
    )
  );

revoke update on public.chat_messages from authenticated;

-- A new message moves its chat to the top of Recents.
create function public.touch_chat_on_message()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  update public.chats set updated_at = now() where id = new.chat_id;
  return new;
end;
$$;

create trigger chat_messages_touch_chat
  after insert on public.chat_messages
  for each row
  execute function public.touch_chat_on_message();
