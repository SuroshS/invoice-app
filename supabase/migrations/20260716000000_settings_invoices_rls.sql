-- Phase 2 of the Supabase security migration (frontend service_role → anon key).
--
-- This migration assumes `settings` and `invoices` already exist in production
-- with the shape inferred from every query in this codebase (see AppContext.jsx):
--   settings(user_id uuid unique, data jsonb, updated_at timestamptz, ...)
--   invoices(id <pk>, user_id uuid, data jsonb, created_at timestamptz, ...)
-- VERIFY these column names/types match your live schema before applying —
-- this repo has never tracked migrations, so this is reconstructed from code,
-- not read from the database directly. See the verification queries provided
-- alongside this migration (RLS-enabled check, existing-policy check,
-- unique-constraint check) — run those first.
--
-- Policies are least-privilege: every policy scopes to auth.uid() = user_id.
-- No policy allows unauthenticated access. Nothing here disables RLS anywhere.
--
-- Idempotency:
--   - `enable row level security` is already a safe no-op if RLS is already
--     on (verified Postgres behavior, not an assumption).
--   - Rather than assume no pre-existing policies exist under a different
--     name than the ones below, this drops EVERY existing policy on these
--     two tables first (whatever it's actually named) before creating the
--     canonical set — a genuine replace, not a "hope the names match" drop.

do $$
declare
  pol record;
begin
  for pol in
    select policyname, tablename from pg_policies
    where schemaname = 'public' and tablename in ('settings', 'invoices')
  loop
    execute format('drop policy if exists %I on public.%I', pol.policyname, pol.tablename);
  end loop;
end $$;

-- ============================================================
-- settings
-- ============================================================

alter table public.settings enable row level security;

create policy "settings_select_own"
  on public.settings
  for select
  using (auth.uid() = user_id);

create policy "settings_insert_own"
  on public.settings
  for insert
  with check (auth.uid() = user_id);

create policy "settings_update_own"
  on public.settings
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- No DELETE policy on settings, intentionally. Nothing in the current
-- codebase deletes a settings row from the client — "Delete all data" /
-- "Delete account" in the Danger Zone are documented UI-only stubs with no
-- backing logic yet. When that's implemented, it should go through a
-- server-side Edge Function (service_role) rather than a client DELETE
-- policy here, since real account deletion needs to also cascade across
-- auth.users and the logos Storage bucket in one coordinated operation —
-- broader than anything a single-table client policy should grant.

-- ============================================================
-- invoices
-- ============================================================

alter table public.invoices enable row level security;

create policy "invoices_select_own"
  on public.invoices
  for select
  using (auth.uid() = user_id);

create policy "invoices_insert_own"
  on public.invoices
  for insert
  with check (auth.uid() = user_id);

create policy "invoices_update_own"
  on public.invoices
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "invoices_delete_own"
  on public.invoices
  for delete
  using (auth.uid() = user_id);

-- ============================================================
-- Indexes
-- ============================================================

-- The one query this whole app makes most often (every login/reload):
--   .eq("user_id", id).order("created_at", { ascending: false }).limit(50)
-- A composite index lets Postgres satisfy the filter + sort + limit in a
-- single index scan instead of a filter-then-sort. This is the single
-- highest-impact index for this app's actual query pattern.
create index if not exists idx_invoices_user_id_created_at
  on public.invoices (user_id, created_at desc);

-- settings.user_id must already have a UNIQUE constraint for the app's
-- upsert(..., { onConflict: "user_id" }) calls to have ever worked — this
-- migration doesn't add one, since adding a duplicate unique constraint
-- would fail. Verify it exists (see the accompanying verification query)
-- before assuming the INSERT/UPDATE policies above will upsert correctly.

-- ============================================================
-- DOCUMENTED, NOT APPLIED — invoice number uniqueness
-- ============================================================
-- invoiceNumber/quoteNumber (e.g. "INV-42") currently live only inside the
-- `data` JSONB blob, generated client-side from
-- settings.nextInvoiceNumber/nextQuoteNumber (AppContext.jsx) — there is no
-- database-level uniqueness constraint on them today, per-user or global.
-- Whether one is appropriate depends on a business decision this migration
-- doesn't make:
--   - Per-user uniqueness (e.g. a composite unique index on
--     (user_id, (data->>'invoiceNumber'))) would mirror how numbering
--     already behaves in practice (each user has their own counter), and
--     would catch a real bug (duplicate numbers for one user) without
--     affecting other users.
--   - Global uniqueness across all users would be unnecessary and almost
--     certainly wrong — two different businesses both legitimately have an
--     "INV-1".
-- Not adding either here. Flagging per your note that this is worth
-- documenting, not necessarily acting on now — the existing numbering logic
-- is explicitly called out elsewhere as something not to change without
-- deliberate review (gaps/collisions have real accounting consequences).

-- ============================================================
-- OPTIONAL — foreign keys to auth.users (not required for RLS to work,
-- but good practice for referential integrity). DO NOT apply this section
-- without first confirming there are no orphaned user_id values (e.g. rows
-- from a deleted test account) — it will fail on any mismatch.
-- ============================================================

-- alter table public.settings
--   add constraint settings_user_id_fkey
--   foreign key (user_id) references auth.users(id) on delete cascade;

-- alter table public.invoices
--   add constraint invoices_user_id_fkey
--   foreign key (user_id) references auth.users(id) on delete cascade;
