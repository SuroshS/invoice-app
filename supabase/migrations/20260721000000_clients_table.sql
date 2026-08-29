-- Adds a `clients` table so invoices can link to a stable client record
-- instead of being matched by free-typed name/email strings each time.
-- Backs the new "Clients" nav page (roster + invoice count) and the
-- new/existing client picker in CreateInvoice.jsx.
--
-- Invoices themselves are NOT altered by this migration — the link lives as
-- `clientId` inside invoices.data (JSONB), consistent with this app's
-- existing schema-light pattern (see AppContext.jsx). Invoice records also
-- keep their own billToName/billToEmail/billToPhone/billToAddress snapshot
-- at save time, so editing a client's details later does not silently
-- rewrite the client info printed on past invoices.

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_clients_user_id on public.clients (user_id);

alter table public.clients enable row level security;

do $$
declare
  pol record;
begin
  for pol in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'clients'
  loop
    execute format('drop policy if exists %I on public.clients', pol.policyname);
  end loop;
end $$;

create policy "clients_select_own"
  on public.clients
  for select
  using (auth.uid() = user_id);

create policy "clients_insert_own"
  on public.clients
  for insert
  with check (auth.uid() = user_id);

create policy "clients_update_own"
  on public.clients
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "clients_delete_own"
  on public.clients
  for delete
  using (auth.uid() = user_id);

-- Composite index supporting the Clients page's per-client invoice lookup
-- (invoices.data->>'clientId' = eq.<id>), same reasoning as the existing
-- idx_invoices_user_id_created_at index in the prior migration.
create index if not exists idx_invoices_client_id
  on public.invoices ((data ->> 'clientId'));
