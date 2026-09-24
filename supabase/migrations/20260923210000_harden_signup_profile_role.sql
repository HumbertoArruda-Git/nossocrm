-- F-01 (security audit 2026-09-23): a self-registered user could become admin.
--
-- 1. handle_new_user() took role and organization_id from raw_user_meta_data, which the
--    person signing up controls. Both now come from raw_app_meta_data, which only the
--    service role can set; without it the user joins the single organization as 'user'.
--    Setup and invite routes keep working: they upsert role/organization with the service
--    role right after creating the user. Same body the staging project already runs.
-- 2. The profiles_update policy lets a user edit their own row, and the table-level UPDATE
--    grant covered role and organization_id. Clients may now update only personal fields.
-- Idempotent.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_org_id UUID;
BEGIN
    v_org_id := NULLIF(new.raw_app_meta_data->>'organization_id', '')::UUID;
    IF v_org_id IS NULL THEN
        SELECT o.id INTO v_org_id FROM public.organizations AS o WHERE o.deleted_at IS NULL ORDER BY o.created_at ASC LIMIT 1;
    ELSE
        IF NOT EXISTS (SELECT 1 FROM public.organizations AS o WHERE o.id = v_org_id AND o.deleted_at IS NULL) THEN
            RAISE EXCEPTION 'Organization not found';
        END IF;
    END IF;
    IF v_org_id IS NULL THEN
        RAISE EXCEPTION 'Nenhuma organization encontrada. Rode o setup inicial antes de criar usuários.';
    END IF;
    INSERT INTO public.profiles (id, email, name, avatar, role, organization_id)
    VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)), new.raw_user_meta_data->>'avatar_url', COALESCE(new.raw_app_meta_data->>'role', 'user'), v_org_id);
    INSERT INTO public.user_settings (user_id) VALUES (new.id) ON CONFLICT (user_id) DO NOTHING;
    RETURN new;
END;
$$;

-- Trigger-only function: triggers fire without EXECUTE, so no API role needs it.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Column-level grants: a table-level UPDATE grant would override any column revoke.
REVOKE UPDATE ON public.profiles FROM anon, authenticated;
GRANT UPDATE (name, avatar, avatar_url, first_name, last_name, nickname, phone, updated_at)
  ON public.profiles TO authenticated;
