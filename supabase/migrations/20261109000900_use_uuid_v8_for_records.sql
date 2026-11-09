-- UUID version 8 ids for connections, accounts, and transactions.
-- Uses public.uuid_v8() from the previous migration: a native uuid
-- (16 bytes, 36 characters with hyphens), version 8 layout.

alter table public.connections
  alter column id set default public.uuid_v8();

alter table public.accounts
  alter column id set default public.uuid_v8();

alter table public.transactions
  alter column id set default public.uuid_v8();
