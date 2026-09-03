BEGIN;

CREATE OR REPLACE FUNCTION public.claim_landing_outbox_event(
    p_event_id UUID DEFAULT NULL,
    p_processing_timeout INTERVAL DEFAULT INTERVAL '10 minutes'
)
RETURNS TABLE (
    event_id UUID,
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

    -- A fifth attempt that expires cannot remain processing forever.
    UPDATE public.landing_outbox_events
    SET status = 'failed_terminal', processing_token = NULL,
        processing_started_at = NULL, next_retry_at = NULL,
        last_error_code = 'MAX_ATTEMPTS'
    WHERE status = 'processing'
      AND processing_started_at < NOW() - p_processing_timeout
      AND attempt_count >= 5
      AND (p_event_id IS NULL OR id = p_event_id);

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
    RETURNING e.id, e.event_type, e.occurred_at, e.organization_id,
        e.submission_id, e.contact_id, e.deal_id, e.status,
        e.processing_token, e.attempt_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_landing_outbox_event(
    p_event_id UUID,
    p_processing_token UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    UPDATE public.landing_outbox_events
    SET status = 'delivered', delivered_at = NOW(),
        processing_token = NULL, processing_started_at = NULL,
        next_retry_at = NULL, last_error_code = NULL
    WHERE id = p_event_id AND status = 'processing'
      AND processing_token = p_processing_token;
    RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.fail_landing_outbox_event(
    p_event_id UUID,
    p_processing_token UUID,
    p_error_code TEXT,
    p_retryable BOOLEAN,
    p_next_retry_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_error_code TEXT;
BEGIN
    v_error_code := CASE p_error_code
        WHEN 'TIMEOUT' THEN 'TIMEOUT'
        WHEN 'NETWORK_ERROR' THEN 'NETWORK_ERROR'
        WHEN 'HTTP_408' THEN 'HTTP_408'
        WHEN 'HTTP_429' THEN 'HTTP_429'
        WHEN 'HTTP_5XX' THEN 'HTTP_5XX'
        WHEN 'CONFIG_INVALID' THEN 'CONFIG_INVALID'
        WHEN 'PROTOCOL_INVALID' THEN 'PROTOCOL_INVALID'
        WHEN 'DESTINATION_BLOCKED' THEN 'DESTINATION_BLOCKED'
        WHEN 'PAYLOAD_INVALID' THEN 'PAYLOAD_INVALID'
        WHEN 'AUTH_MISSING' THEN 'AUTH_MISSING'
        WHEN 'MAX_ATTEMPTS' THEN 'MAX_ATTEMPTS'
        ELSE 'UNKNOWN_ERROR'
    END;

    UPDATE public.landing_outbox_events
    SET status = CASE
            WHEN p_retryable AND attempt_count < 5 THEN 'failed_retryable'
            ELSE 'failed_terminal'
        END,
        processing_token = NULL, processing_started_at = NULL,
        next_retry_at = CASE
            WHEN p_retryable AND attempt_count < 5
            THEN COALESCE(p_next_retry_at, NOW() + INTERVAL '5 minutes')
            ELSE NULL
        END,
        last_error_code = CASE
            WHEN p_retryable AND attempt_count >= 5 THEN 'MAX_ATTEMPTS'
            ELSE v_error_code
        END
    WHERE id = p_event_id AND status = 'processing'
      AND processing_token = p_processing_token;
    RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_landing_outbox_event(UUID, INTERVAL) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.complete_landing_outbox_event(UUID, UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fail_landing_outbox_event(UUID, UUID, TEXT, BOOLEAN, TIMESTAMPTZ) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_landing_outbox_event(UUID, INTERVAL) TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_landing_outbox_event(UUID, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.fail_landing_outbox_event(UUID, UUID, TEXT, BOOLEAN, TIMESTAMPTZ) TO service_role;

COMMIT;
