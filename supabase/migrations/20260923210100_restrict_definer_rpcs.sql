-- F-03 (security audit 2026-09-23): SECURITY DEFINER functions bypass RLS, and PostgreSQL
-- grants EXECUTE to PUBLIC by default, so anyone holding the public API key could call them
-- through /rest/v1/rpc. mark_deal_won/lost and reopen_deal changed any deal without checking
-- the caller; cleanup_rate_limits could wipe the landing form's rate limit.
--
-- Only grants change; no function body is replaced, so staging and production keep their
-- own (diverging) bodies. Access after this migration:
--   anon + authenticated: is_instance_initialized (pre-login screen), validate_api_key (public API)
--   authenticated only:   get_contact_stage_counts, log_audit_event, create_api_key, revoke_api_key
--   service_role only:    everything else (unused by the app, internal helpers or trigger functions;
--                         triggers fire without EXECUTE privilege)
-- Functions without a pinned search_path get the path they already resolved with
-- (public, extensions: pgcrypto lives in extensions). Stricter existing settings are kept.
-- Idempotent.

DO $$
DECLARE
  f record;
  fn regprocedure;
BEGIN
  FOR f IN
    SELECT * FROM (VALUES
      ('public.is_instance_initialized()',                              'anon'),
      ('public.validate_api_key(text)',                                 'anon'),
      ('public.get_contact_stage_counts()',                             'authenticated'),
      ('public.log_audit_event(text, text, uuid, jsonb, text)',         'authenticated'),
      ('public.create_api_key(text)',                                   'authenticated'),
      ('public.revoke_api_key(uuid)',                                   'authenticated'),
      ('public.mark_deal_won(uuid)',                                    'service_role'),
      ('public.mark_deal_lost(uuid, text)',                             'service_role'),
      ('public.reopen_deal(uuid)',                                      'service_role'),
      ('public.get_dashboard_stats()',                                  'service_role'),
      ('public.cleanup_rate_limits(integer)',                           'service_role'),
      ('public.get_singleton_organization_id()',                        'service_role'),
      ('public._api_key_make_token()',                                  'service_role'),
      ('public._api_key_sha256_hex(text)',                              'service_role'),
      ('public.handle_new_organization()',                              'service_role'),
      ('public.handle_user_email_update()',                             'service_role'),
      ('public.notify_deal_stage_changed()',                            'service_role')
    ) AS t(signature, lowest_role)
  LOOP
    fn := to_regprocedure(f.signature);
    CONTINUE WHEN fn IS NULL;  -- absent in this environment

    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', fn);
    IF f.lowest_role IN ('anon', 'authenticated') THEN
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', fn);
    END IF;
    IF f.lowest_role = 'anon' THEN
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO anon', fn);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_catalog.pg_proc p, unnest(coalesce(p.proconfig, '{}')) cfg
      WHERE p.oid = fn AND cfg LIKE 'search_path=%'
    ) THEN
      EXECUTE format('ALTER FUNCTION %s SET search_path = public, extensions', fn);
    END IF;
  END LOOP;
END $$;
