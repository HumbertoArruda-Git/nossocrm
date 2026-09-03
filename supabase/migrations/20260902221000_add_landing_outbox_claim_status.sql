BEGIN;

DROP FUNCTION public.claim_landing_outbox_event(UUID, INTERVAL);

CREATE FUNCTION public.claim_landing_outbox_event(
    p_event_id UUID DEFAULT NULL,
    p_processing_timeout INTERVAL DEFAULT INTERVAL '10 minutes'
)
RETURNS TABLE (
    event_id UUID,
    claim_status TEXT,
    event_type TEXT,
    occurred_at TIMESTAMPTZ,
    organization_id UUID,
    submission_id UUID,
    contact_id UUID,
    deal_id UUID,
    status TEXT,
    processing_token UUID,
    attempt_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF p_processing_timeout <= INTERVAL '0 seconds' THEN
        RAISE EXCEPTION 'Processing timeout must be positive';
    END IF;

    UPDATE public.landing_outbox_events AS expired
    SET status = 'failed_terminal', processing_token = NULL,
        processing_started_at = NULL, next_retry_at = NULL,
        last_error_code = 'MAX_ATTEMPTS'
    WHERE expired.status = 'processing'
      AND expired.processing_started_at < NOW() - p_processing_timeout
      AND expired.attempt_count >= 5
      AND (p_event_id IS NULL OR expired.id = p_event_id);

    RETURN QUERY
    WITH candidate AS (
        SELECT e.id
        FROM public.landing_outbox_events AS e
        WHERE (p_event_id IS NULL OR e.id = p_event_id)
          AND e.attempt_count < 5
          AND (
              e.status = 'pending'
              OR (e.status = 'failed_retryable'
                  AND (e.next_retry_at IS NULL OR e.next_retry_at <= NOW()))
              OR (e.status = 'processing'
                  AND e.processing_started_at < NOW() - p_processing_timeout)
          )
        ORDER BY e.next_retry_at NULLS FIRST, e.created_at, e.id
        FOR UPDATE SKIP LOCKED
        LIMIT 1
    )
    UPDATE public.landing_outbox_events AS e
    SET status = 'processing', processing_token = gen_random_uuid(),
        processing_started_at = NOW(), attempt_count = e.attempt_count + 1,
        next_retry_at = NULL, last_error_code = NULL
    FROM candidate
    WHERE e.id = candidate.id
    RETURNING e.id, 'claimed'::TEXT, e.event_type, e.occurred_at,
        e.organization_id, e.submission_id, e.contact_id, e.deal_id,
        e.status, e.processing_token, e.attempt_count;

    IF FOUND THEN RETURN; END IF;

    IF p_event_id IS NOT NULL THEN
        RETURN QUERY
        SELECT e.id,
            CASE WHEN e.status = 'processing' THEN 'in_progress'
                 WHEN e.status = 'delivered' THEN 'delivered'
                 WHEN e.status = 'failed_retryable' THEN 'retry_not_due'
                 WHEN e.status = 'failed_terminal' THEN 'terminal_failure'
                 ELSE 'unavailable' END,
            e.event_type, e.occurred_at, e.organization_id,
            e.submission_id, e.contact_id, e.deal_id, e.status,
            e.processing_token, e.attempt_count
        FROM public.landing_outbox_events AS e
        WHERE e.id = p_event_id;
    END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_landing_outbox_event(UUID, INTERVAL) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_landing_outbox_event(UUID, INTERVAL) TO service_role;

COMMIT;
