-- Transactions: money in or out of an account.
-- amount is signed: positive for inflow, negative for outflow.

create type public.transaction_status as enum ('pending', 'completed', 'failed', 'refunded', 'cancelled');

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  account_id uuid not null,
  external_id text,
  amount numeric(19, 4) not null,
  currency text not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  status public.transaction_status not null default 'completed',
  description text,
  counterparty text,
  category text,
  occurred_at timestamptz not null default now(),
  -- Path of a receipt in the user-uploads bucket, e.g. <user_id>/receipt.pdf
  receipt_path text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (account_id, external_id),
  -- Keeps a transaction and its account in the same organization.
  foreign key (account_id, organization_id)
    references public.accounts (id, organization_id)
    on delete cascade
);

comment on table public.transactions is 'A single financial transaction on an account.';

create index transactions_organization_occurred_idx
  on public.transactions (organization_id, occurred_at desc);
create index transactions_account_id_idx on public.transactions (account_id);

create trigger transactions_set_updated_at
  before update on public.transactions
  for each row
  execute function public.set_updated_at();

alter table public.transactions enable row level security;

create policy "Members can view transactions"
  on public.transactions
  for select
  to authenticated
  using (public.is_org_member(organization_id));

create policy "Members can create transactions"
  on public.transactions
  for insert
  to authenticated
  with check (public.is_org_member(organization_id));

create policy "Members can update transactions"
  on public.transactions
  for update
  to authenticated
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

create policy "Owners and admins can delete transactions"
  on public.transactions
  for delete
  to authenticated
  using (
    public.has_org_role(organization_id, array['owner', 'admin']::public.org_role[])
  );
