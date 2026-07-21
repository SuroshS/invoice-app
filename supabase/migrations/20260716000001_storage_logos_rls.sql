-- Phase 3 of the Supabase security migration — Storage.
--
-- Only bucket in use anywhere in this codebase: `logos` (verified via grep —
-- AppContext.jsx's uploadLogo() is the only Storage caller in the app).
-- Objects are uploaded to `${userId}/logo.<ext>` (AppContext.jsx).
--
-- Design:
--   - READ stays public at the bucket level (see accompanying explanation —
--     logos are non-sensitive branding assets already freely visible on every
--     PDF the business sends out; switching to signed URLs would require
--     real code changes to how logoUrl is stored/consumed, which conflicts
--     with preserving the current UX). VERIFY the `logos` bucket's "Public
--     bucket" toggle is actually ON in Storage settings — that flag, not any
--     RLS policy, is what makes getPublicUrl() work.
--   - WRITE (insert/update/delete) is restricted to each user's own folder,
--     enforced by the OBJECT PATH itself via storage.foldername(name), not
--     by the owner column (unreliable for objects uploaded under the
--     mis-configured service-role key) and not by client-side JS (the
--     current uploadLogo() path construction is a UX nicety, not a security
--     boundary — this migration makes the real boundary server-side).
--
-- Idempotent: drops every existing policy on storage.objects for this
-- bucket by name before recreating, same approach as the settings/invoices
-- migration — safe to re-run.

do $$
declare
  pol record;
begin
  for pol in
    select policyname from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname in (
        'logos_public_read',
        'logos_insert_own_folder',
        'logos_update_own_folder',
        'logos_delete_own_folder'
      )
  loop
    execute format('drop policy if exists %I on storage.objects', pol.policyname);
  end loop;
end $$;

-- Explicit SELECT policy for defense-in-depth — covers authenticated reads
-- (e.g. if anything ever fetches via a signed URL or direct API call instead
-- of the public getPublicUrl() endpoint). Harmless alongside the bucket's
-- own public flag; not a substitute for it.
create policy "logos_public_read"
  on storage.objects
  for select
  using (bucket_id = 'logos');

create policy "logos_insert_own_folder"
  on storage.objects
  for insert
  with check (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "logos_update_own_folder"
  on storage.objects
  for update
  using (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "logos_delete_own_folder"
  on storage.objects
  for delete
  using (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Nothing in the app currently deletes a logo object directly (Settings.jsx's
-- "Replace Logo" flow uses upload(..., { upsert: true }), which is an
-- UPDATE, not a DELETE) — the DELETE policy above is included anyway since
-- it's still correctly scoped to least-privilege (own folder only) and
-- costs nothing to have ready for when/if a "remove logo" action is added.
