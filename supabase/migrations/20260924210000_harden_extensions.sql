-- F-14 (security audit 2026-09-23): extensions in the public schema.
--
-- unaccent: moved from public to extensions. No function, index or code path uses it; only
-- the one-off slug backfill in 20251201000000_schema_init did.
--
-- pg_net stays as it is, on purpose. Its http_* functions are executable by PUBLIC, but the
-- grants belong to supabase_admin, so the postgres role cannot revoke them (a REVOKE here is
-- a silent no-op, verified in staging). They are also unreachable from the Data API: the
-- net schema is not exposed, and no function in public passes caller input to net.*. The
-- only caller, notify_deal_stage_changed(), is SECURITY DEFINER and builds its own request.
-- Idempotent.

CREATE SCHEMA IF NOT EXISTS extensions;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'unaccent'
             AND extnamespace = 'public'::regnamespace) THEN
    ALTER EXTENSION unaccent SET SCHEMA extensions;
  END IF;
END $$;
