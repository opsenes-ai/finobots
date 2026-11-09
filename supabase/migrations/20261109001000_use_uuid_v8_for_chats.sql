-- UUID version 8 ids for chats.
-- Uses public.uuid_v8(): a native uuid (16 bytes, 36 characters with
-- hyphens), version 8 layout.

alter table public.chats
  alter column id set default public.uuid_v8();
