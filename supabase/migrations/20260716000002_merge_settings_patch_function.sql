-- Replaces the stripe-webhook Edge Function's read-modify-write concurrency
-- workaround (optimistic concurrency retry loop on `updated_at`) with a
-- single, genuinely atomic Postgres-native JSONB merge. Concurrent calls for
-- the same user_id are serialized by Postgres's own row-level locking during
-- the UPDATE — there is no window for a race to occur at all, unlike the
-- retry-based approach it replaces.
--
-- IMPORTANT — deployment sequencing: this migration must be applied BEFORE
-- (or atomically alongside) deploying the updated stripe-webhook function
-- code that calls this RPC. Deploying the code first would fail every write
-- (the function wouldn't exist yet); deploying only this migration without
-- the code update is harmless (the old code doesn't reference this
-- function, so it simply goes unused until the code catches up).

-- NOTE on merge depth: the `||` jsonb operator below is a SHALLOW merge —
-- if a key exists on both sides, the incoming (excluded.data) value replaces
-- the existing one entirely, it does not recurse into nested objects. This
-- is safe today because every field stripe-webhook actually patches
-- (subscriptionActive, subscriptionStatus, stripeCustomerId,
-- subscriptionUpdatedAt, cancelAtPeriodEnd, currentPeriodEnd, planInterval,
-- planAmount, planCurrency) is a scalar, and none of them collide with the
-- one nested object that exists in this schema (settings.data.policyVersions,
-- written once at first login — see AppContext.jsx — and never touched by
-- this webhook). If a future patch ever needs to set a key that is itself a
-- nested object (rather than a scalar), do NOT assume this function will
-- merge into it correctly — it will overwrite that object's other sub-keys
-- entirely. That would need a different, deeper merge expression (e.g.
-- jsonb_set targeting the specific sub-path) or a dedicated function.
create or replace function public.merge_settings_patch(p_user_id uuid, p_patch jsonb)
returns void
language sql
security invoker
set search_path = public, pg_temp
as $$
  insert into public.settings (user_id, data, updated_at)
  values (p_user_id, p_patch, now())
  on conflict (user_id)
  do update set
    data = public.settings.data || excluded.data,
    updated_at = now();
$$;

-- Least privilege: Postgres grants EXECUTE on new functions to PUBLIC by
-- default, which — via Supabase's anon/authenticated roles inheriting from
-- PUBLIC — would otherwise make this callable directly from the frontend via
-- PostgREST's /rpc endpoint with an arbitrary p_user_id, bypassing RLS
-- entirely (the function itself doesn't check auth.uid() = p_user_id,
-- because it doesn't need to: it's only ever meant to be called by the
-- service_role client inside stripe-webhook, which already has unrestricted
-- access to this table by design). Explicitly revoke from everyone, then
-- grant only to service_role.
revoke all on function public.merge_settings_patch(uuid, jsonb) from public;
revoke all on function public.merge_settings_patch(uuid, jsonb) from anon;
revoke all on function public.merge_settings_patch(uuid, jsonb) from authenticated;
grant execute on function public.merge_settings_patch(uuid, jsonb) to service_role;
