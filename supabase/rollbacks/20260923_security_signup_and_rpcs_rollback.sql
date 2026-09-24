-- ROLLBACK of 20260923210000_harden_signup_profile_role and 20260923210100_restrict_definer_rpcs.
-- DO NOT run unless reverting. It RESTORES THE VULNERABLE STATE found by the 2026-09-23 audit
-- (self-signup can become admin; SECURITY DEFINER RPCs callable without login). Keep public
-- signup disabled while this state is live.
--
-- State captured from production (mplmfhgunsymetqrqrkb) on 2026-09-23, before the migrations:
-- handle_new_user md5(prosrc) = 6060b010fd9da8eb89c2064093e67eac, no proconfig; function ACLs
-- granted EXECUTE to anon, authenticated and service_role (and PUBLIC, except create_api_key,
-- revoke_api_key, validate_api_key); cleanup_rate_limits, get_singleton_organization_id and
-- log_audit_event had search_path=public, the others none; profiles had table-level UPDATE
-- for anon and authenticated.

BEGIN;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_org_id uuid;
BEGIN
    v_org_id := (new.raw_user_meta_data->>'organization_id')::uuid;
    IF v_org_id IS NULL THEN
        v_org_id := public.get_singleton_organization_id();
    END IF;

    IF v_org_id IS NULL THEN
        RAISE EXCEPTION 'Nenhuma organization encontrada. Rode o setup inicial antes de criar usuários.';
    END IF;

    -- Create Profile
    INSERT INTO public.profiles (id, email, name, avatar, role, organization_id)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
        new.raw_user_meta_data->>'avatar_url',
        COALESCE(new.raw_user_meta_data->>'role', 'user'),
        v_org_id
    );

    -- Create User Settings (idempotente)
    INSERT INTO public.user_settings (user_id)
    VALUES (new.id)
    ON CONFLICT (user_id) DO NOTHING;

    RETURN new;
END;
$function$;

GRANT EXECUTE ON FUNCTION public._api_key_make_token() TO PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public._api_key_sha256_hex(text) TO PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_rate_limits(integer) TO PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_contact_stage_counts() TO PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_dashboard_stats() TO PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_singleton_organization_id() TO PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_organization() TO PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.handle_user_email_update() TO PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_instance_initialized() TO PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.log_audit_event(text, text, uuid, jsonb, text) TO PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.mark_deal_lost(uuid, text) TO PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.mark_deal_won(uuid) TO PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.notify_deal_stage_changed() TO PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.reopen_deal(uuid) TO PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_api_key(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.revoke_api_key(uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.validate_api_key(text) TO anon, authenticated, service_role;

ALTER FUNCTION public._api_key_make_token() RESET search_path;
ALTER FUNCTION public._api_key_sha256_hex(text) RESET search_path;
ALTER FUNCTION public.create_api_key(text) RESET search_path;
ALTER FUNCTION public.get_contact_stage_counts() RESET search_path;
ALTER FUNCTION public.get_dashboard_stats() RESET search_path;
ALTER FUNCTION public.handle_new_organization() RESET search_path;
ALTER FUNCTION public.handle_user_email_update() RESET search_path;
ALTER FUNCTION public.is_instance_initialized() RESET search_path;
ALTER FUNCTION public.mark_deal_lost(uuid, text) RESET search_path;
ALTER FUNCTION public.mark_deal_won(uuid) RESET search_path;
ALTER FUNCTION public.notify_deal_stage_changed() RESET search_path;
ALTER FUNCTION public.reopen_deal(uuid) RESET search_path;
ALTER FUNCTION public.revoke_api_key(uuid) RESET search_path;
ALTER FUNCTION public.validate_api_key(text) RESET search_path;

REVOKE UPDATE (name, avatar, avatar_url, first_name, last_name, nickname, phone, updated_at)
  ON public.profiles FROM authenticated;
GRANT UPDATE ON public.profiles TO anon, authenticated;

DO $check$
BEGIN
  IF (SELECT md5(prosrc) FROM pg_catalog.pg_proc WHERE oid = 'public.handle_new_user()'::regprocedure)
       <> '6060b010fd9da8eb89c2064093e67eac'
     OR NOT has_function_privilege('anon', 'public.mark_deal_won(uuid)', 'EXECUTE')
     OR NOT has_table_privilege('authenticated', 'public.profiles', 'UPDATE') THEN
    RAISE EXCEPTION 'rollback: estado restaurado difere do capturado';
  END IF;
END $check$;

COMMIT;
