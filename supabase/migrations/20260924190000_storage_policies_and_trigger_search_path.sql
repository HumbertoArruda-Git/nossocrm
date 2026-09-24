-- Security audit 2026-09-23, remaining database items.
--
-- F-07: three trigger functions ran with the caller's search_path. They are recreated with
-- schema-qualified names and an empty search_path (same behavior; staging already had this
-- outside migrations).
--
-- Storage: the deal-files and avatars policies only checked the bucket, so any signed-in
-- account could read, overwrite or delete any organization's deal files and anyone's avatar.
--   * deal-files: paths are "<deal_id>/<uuid>.<ext>" (lib/supabase/dealFiles.ts); access now
--     requires the deal to belong to the caller's organization.
--   * avatars: paths are "avatars/<profile_id>.<ext>" (features/profile/ProfilePage.tsx);
--     writes now require the file to be the caller's own. Reads stay public (public bucket).
-- Idempotent.

-- 1. F-07: pinned search_path on trigger functions.
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.cascade_soft_delete_deals()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
        UPDATE public.deals SET deleted_at = NEW.deleted_at WHERE board_id = NEW.id AND deleted_at IS NULL;
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.cascade_soft_delete_activities_by_contact()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
        UPDATE public.activities SET deleted_at = NEW.deleted_at WHERE contact_id = NEW.id AND deleted_at IS NULL;
    END IF;
    RETURN NEW;
END;
$$;

-- 2. deal-files: only objects under a deal of the caller's organization.
DROP POLICY IF EXISTS deal_files_read ON storage.objects;
DROP POLICY IF EXISTS deal_files_upload ON storage.objects;
DROP POLICY IF EXISTS deal_files_delete ON storage.objects;

CREATE POLICY deal_files_read ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'deal-files' AND EXISTS (
    SELECT 1 FROM public.deals AS d
    WHERE d.id::text = (storage.foldername(name))[1]
      AND d.organization_id = public.current_user_org_id()));
CREATE POLICY deal_files_upload ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'deal-files' AND EXISTS (
    SELECT 1 FROM public.deals AS d
    WHERE d.id::text = (storage.foldername(name))[1]
      AND d.organization_id = public.current_user_org_id()));
CREATE POLICY deal_files_delete ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'deal-files' AND EXISTS (
    SELECT 1 FROM public.deals AS d
    WHERE d.id::text = (storage.foldername(name))[1]
      AND d.organization_id = public.current_user_org_id()));

-- 3. avatars: public read; write only "avatars/<own id>.<ext>".
DROP POLICY IF EXISTS avatar_upload ON storage.objects;
DROP POLICY IF EXISTS avatar_update ON storage.objects;
DROP POLICY IF EXISTS avatar_delete ON storage.objects;

CREATE POLICY avatar_upload ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars'
              AND split_part(storage.filename(name), '.', 1) = (SELECT auth.uid())::text);
CREATE POLICY avatar_update ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars'
         AND split_part(storage.filename(name), '.', 1) = (SELECT auth.uid())::text)
  WITH CHECK (bucket_id = 'avatars'
              AND split_part(storage.filename(name), '.', 1) = (SELECT auth.uid())::text);
CREATE POLICY avatar_delete ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars'
         AND split_part(storage.filename(name), '.', 1) = (SELECT auth.uid())::text);
