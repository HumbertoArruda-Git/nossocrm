BEGIN;

REVOKE ALL ON FUNCTION public.claim_landing_submission(UUID, INTERVAL) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.complete_landing_submission(UUID, UUID, UUID, UUID, UUID, INTEGER) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fail_landing_submission(UUID, UUID, TEXT, BOOLEAN, TIMESTAMPTZ) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.anonymize_processed_landing_submissions(INTERVAL) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.claim_landing_submission(UUID, INTERVAL) TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_landing_submission(UUID, UUID, UUID, UUID, UUID, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.fail_landing_submission(UUID, UUID, TEXT, BOOLEAN, TIMESTAMPTZ) TO service_role;
GRANT EXECUTE ON FUNCTION public.anonymize_processed_landing_submissions(INTERVAL) TO service_role;

COMMIT;
