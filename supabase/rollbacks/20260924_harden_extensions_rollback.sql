-- ROLLBACK of 20260924210000_harden_extensions. DO NOT run unless reverting.
-- Puts unaccent back in the public schema, where production had it on 2026-09-24.
BEGIN;
ALTER EXTENSION unaccent SET SCHEMA public;
COMMIT;
