-- ROLLBACK of 20260924120000_guard_profiles_privileged_columns. DO NOT run unless reverting.
-- Removes only the second barrier: column grants from 20260923210000 still keep role and
-- organization_id out of the client's reach.

BEGIN;

DROP TRIGGER IF EXISTS profiles_guard_privileged_columns ON public.profiles;
DROP FUNCTION IF EXISTS public.profiles_guard_privileged_columns();
GRANT UPDATE (name, avatar) ON public.profiles TO authenticated;

DO $check$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_catalog.pg_trigger WHERE tgname = 'profiles_guard_privileged_columns')
     OR has_column_privilege('authenticated', 'public.profiles', 'role', 'UPDATE') THEN
    RAISE EXCEPTION 'rollback: estado inesperado';
  END IF;
END $check$;

COMMIT;
