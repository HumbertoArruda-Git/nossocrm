-- Second barrier for profiles.role / profiles.organization_id (from the unmerged branch
-- security/fix-profiles-privilege-escalation, 2026-08-31).
--
-- 20260923210000 already limits the client's UPDATE to personal columns. Column grants are
-- easy to undo by accident: a "GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated"
-- would silently let users promote themselves again. This trigger rejects the change for
-- API roles regardless of grants. service_role, the table owner and SECURITY DEFINER
-- functions run as other roles and are unaffected (invites, setup, installer).
--
-- Also drops the legacy name/avatar columns from the client grant: only handle_new_user()
-- and service-role upserts write them; the profile screen edits first_name, last_name,
-- nickname, phone and avatar_url.
-- Idempotent.

CREATE OR REPLACE FUNCTION public.profiles_guard_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  IF current_user IN ('anon', 'authenticated') THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'profiles.role não pode ser alterado por %', current_user
        USING ERRCODE = '42501';
    END IF;
    IF NEW.organization_id IS DISTINCT FROM OLD.organization_id THEN
      RAISE EXCEPTION 'profiles.organization_id não pode ser alterado por %', current_user
        USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.profiles_guard_privileged_columns() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS profiles_guard_privileged_columns ON public.profiles;
CREATE TRIGGER profiles_guard_privileged_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  WHEN (OLD.role IS DISTINCT FROM NEW.role
        OR OLD.organization_id IS DISTINCT FROM NEW.organization_id)
  EXECUTE FUNCTION public.profiles_guard_privileged_columns();

REVOKE UPDATE (name, avatar) ON public.profiles FROM authenticated;
