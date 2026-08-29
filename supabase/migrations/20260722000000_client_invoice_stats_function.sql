-- Aggregates invoice counts/totals per client entirely in Postgres, instead
-- of the frontend fetching every invoice's full JSONB payload (line items,
-- notes, addresses — everything) and summing client-side (see Clients.jsx).
-- Returns one row per client with linked invoices (M rows, tiny payload)
-- instead of one row per invoice (N rows, the full record each). Replaces
-- the earlier cache-then-network workaround with an actually-cheap query —
-- no caching needed because there's much less to fetch in the first place.
--
-- SECURITY INVOKER + auth.uid() (no p_user_id parameter) — this is called
-- directly by the authenticated frontend user via their own session,
-- unlike merge_settings_patch (only ever called by the service-role client
-- inside stripe-webhook). Deriving the user from auth.uid() means there's
-- no argument a caller could tamper with to see someone else's data, and
-- the WHERE clause pins it explicitly too — RLS on `invoices` staying
-- correct isn't the only thing standing between this function and leaking
-- another user's rows.
create or replace function public.get_client_invoice_stats()
returns table (
  client_id uuid,
  invoice_count bigint,
  total_billed numeric
)
language sql
security invoker
set search_path = public, pg_temp
as $$
  select
    (data ->> 'clientId')::uuid as client_id,
    count(*) as invoice_count,
    coalesce(
      sum(
        case when coalesce(data ->> 'type', 'Invoice') <> 'Quote'
        then (data ->> 'total')::numeric
        else 0 end
      ),
      0
    ) as total_billed
  from public.invoices
  where user_id = auth.uid()
    and data ->> 'clientId' is not null
  group by data ->> 'clientId';
$$;

-- Least privilege, same reasoning as merge_settings_patch's grants: revoke
-- the default PUBLIC execute grant before adding the one back it actually
-- needs — direct end-user calls via PostgREST's /rpc endpoint, so
-- `authenticated`, not `service_role`.
revoke all on function public.get_client_invoice_stats() from public;
revoke all on function public.get_client_invoice_stats() from anon;
grant execute on function public.get_client_invoice_stats() to authenticated;
