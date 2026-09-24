-- ROLLBACK of 20260924190000_storage_policies_and_trigger_search_path. DO NOT run unless reverting.
-- It RESTORES THE OPEN STORAGE POLICIES production had on 2026-09-24 (any signed-in account
-- reads, uploads and deletes any deal file and any avatar) and the trigger functions without
-- a pinned search_path, exactly as read from production before the migration.

BEGIN;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;
ALTER FUNCTION public.update_updated_at_column() RESET search_path;

CREATE OR REPLACE FUNCTION public.cascade_soft_delete_deals()
RETURNS trigger LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
        UPDATE deals SET deleted_at = NEW.deleted_at WHERE board_id = NEW.id AND deleted_at IS NULL;
    END IF;
    RETURN NEW;
END;
$$;
ALTER FUNCTION public.cascade_soft_delete_deals() RESET search_path;

CREATE OR REPLACE FUNCTION public.cascade_soft_delete_activities_by_contact()
RETURNS trigger LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
        UPDATE activities SET deleted_at = NEW.deleted_at WHERE contact_id = NEW.id AND deleted_at IS NULL;
    END IF;
    RETURN NEW;
END;
$$;
ALTER FUNCTION public.cascade_soft_delete_activities_by_contact() RESET search_path;

DROP POLICY IF EXISTS deal_files_read ON storage.objects;
DROP POLICY IF EXISTS deal_files_upload ON storage.objects;
DROP POLICY IF EXISTS deal_files_delete ON storage.objects;
DROP POLICY IF EXISTS avatar_upload ON storage.objects;
DROP POLICY IF EXISTS avatar_update ON storage.objects;
DROP POLICY IF EXISTS avatar_delete ON storage.objects;

CREATE POLICY deal_files_read ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'deal-files');
CREATE POLICY deal_files_upload ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'deal-files');
CREATE POLICY deal_files_delete ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'deal-files');
CREATE POLICY avatar_upload ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars');
CREATE POLICY avatar_update ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars');
CREATE POLICY avatar_delete ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars');

COMMIT;
