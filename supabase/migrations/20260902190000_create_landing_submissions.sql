BEGIN;

CREATE TABLE public.landing_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idempotency_key UUID NOT NULL,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
    name TEXT,
    email TEXT,
    phone TEXT,
    company_name TEXT,
    message TEXT,
    subject TEXT,
    source_page TEXT,
    content_fingerprint TEXT,
    crm_contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
    crm_deal_id UUID REFERENCES public.deals(id) ON DELETE SET NULL,
    crm_activity_id UUID REFERENCES public.activities(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'processed', 'failed_retryable', 'failed_terminal')),
    processing_token UUID,
    response_code INTEGER CHECK (response_code IS NULL OR response_code BETWEEN 100 AND 599),
    last_error_code TEXT,
    last_error_at TIMESTAMPTZ,
    attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
    processing_started_at TIMESTAMPTZ,
    processed_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    next_retry_at TIMESTAMPTZ,
    pii_anonymized_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT landing_submissions_idempotency_key_unique UNIQUE (idempotency_key),
    CONSTRAINT landing_submissions_processing_token_unique UNIQUE (processing_token),
    CONSTRAINT landing_submissions_processed_consistency CHECK (
        status <> 'processed' OR (processed_at IS NOT NULL AND crm_contact_id IS NOT NULL AND crm_deal_id IS NOT NULL)
    ),
    CONSTRAINT landing_submissions_processing_consistency CHECK (
        status <> 'processing' OR (processing_started_at IS NOT NULL AND processing_token IS NOT NULL)
    ),
    CONSTRAINT landing_submissions_not_processing_token CHECK (
        status = 'processing' OR processing_token IS NULL
    ),
    CONSTRAINT landing_submissions_anonymization_consistency CHECK (
        pii_anonymized_at IS NULL OR (
            name IS NULL AND email IS NULL AND phone IS NULL AND company_name IS NULL
            AND message IS NULL AND content_fingerprint IS NULL
        )
    )
);

CREATE INDEX idx_landing_submissions_org_created_at
    ON public.landing_submissions (organization_id, created_at DESC);
CREATE INDEX idx_landing_submissions_retry
    ON public.landing_submissions (status, next_retry_at)
    WHERE status IN ('pending', 'failed_retryable');
CREATE INDEX idx_landing_submissions_processing
    ON public.landing_submissions (processing_started_at)
    WHERE status = 'processing';
CREATE INDEX idx_landing_submissions_crm_deal
    ON public.landing_submissions (crm_deal_id)
    WHERE crm_deal_id IS NOT NULL;
CREATE INDEX idx_landing_submissions_crm_contact
    ON public.landing_submissions (crm_contact_id)
    WHERE crm_contact_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.set_landing_submission_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER landing_submissions_updated_at
BEFORE UPDATE ON public.landing_submissions
FOR EACH ROW
EXECUTE FUNCTION public.set_landing_submission_updated_at();

CREATE OR REPLACE FUNCTION public.claim_landing_submission(
    p_idempotency_key UUID,
    p_processing_timeout INTERVAL DEFAULT INTERVAL '10 minutes'
)
RETURNS TABLE (
    submission_id UUID,
    claim_status TEXT,
    processing_token UUID,
    attempt_count INTEGER,
    crm_contact_id UUID,
    crm_deal_id UUID,
    crm_activity_id UUID,
    response_code INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_token UUID := gen_random_uuid();
BEGIN
    RETURN QUERY
    UPDATE public.landing_submissions AS s
    SET status = 'processing', processing_token = v_token,
        processing_started_at = NOW(), attempt_count = s.attempt_count + 1,
        last_error_code = NULL, last_error_at = NULL, next_retry_at = NULL
    WHERE s.idempotency_key = p_idempotency_key
      AND (
          s.status = 'pending'
          OR (s.status = 'failed_retryable' AND (s.next_retry_at IS NULL OR s.next_retry_at <= NOW()))
          OR (s.status = 'processing' AND s.processing_started_at < NOW() - p_processing_timeout)
      )
    RETURNING s.id, 'claimed'::TEXT, s.processing_token, s.attempt_count,
              s.crm_contact_id, s.crm_deal_id, s.crm_activity_id, s.response_code;

    IF FOUND THEN RETURN; END IF;

    RETURN QUERY
    SELECT s.id,
           CASE WHEN s.status = 'processed' THEN 'processed'
                WHEN s.status = 'processing' THEN 'in_progress'
                WHEN s.status = 'failed_retryable' THEN 'retry_not_due'
                WHEN s.status = 'failed_terminal' THEN 'terminal_failure'
                ELSE 'unavailable' END,
           s.processing_token, s.attempt_count, s.crm_contact_id,
           s.crm_deal_id, s.crm_activity_id, s.response_code
    FROM public.landing_submissions AS s
    WHERE s.idempotency_key = p_idempotency_key;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_landing_submission(
    p_submission_id UUID,
    p_processing_token UUID,
    p_crm_contact_id UUID,
    p_crm_deal_id UUID,
    p_crm_activity_id UUID,
    p_response_code INTEGER DEFAULT 201
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    UPDATE public.landing_submissions
    SET status = 'processed', processing_token = NULL,
        processing_started_at = NULL, crm_contact_id = p_crm_contact_id,
        crm_deal_id = p_crm_deal_id, crm_activity_id = p_crm_activity_id,
        response_code = p_response_code, processed_at = NOW(), next_retry_at = NULL
    WHERE id = p_submission_id AND status = 'processing'
      AND processing_token = p_processing_token;
    RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.fail_landing_submission(
    p_submission_id UUID,
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
BEGIN
    UPDATE public.landing_submissions
    SET status = CASE WHEN p_retryable THEN 'failed_retryable' ELSE 'failed_terminal' END,
        processing_token = NULL, processing_started_at = NULL,
        last_error_code = LEFT(p_error_code, 120), last_error_at = NOW(),
        failed_at = NOW(),
        next_retry_at = CASE WHEN p_retryable THEN COALESCE(p_next_retry_at, NOW() + INTERVAL '5 minutes') ELSE NULL END
    WHERE id = p_submission_id AND status = 'processing'
      AND processing_token = p_processing_token;
    RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.anonymize_processed_landing_submissions(
    p_operational_window INTERVAL DEFAULT INTERVAL '7 days'
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE v_count INTEGER;
BEGIN
    UPDATE public.landing_submissions
    SET name = NULL, email = NULL, phone = NULL, company_name = NULL,
        message = NULL, content_fingerprint = NULL, pii_anonymized_at = NOW()
    WHERE status = 'processed' AND pii_anonymized_at IS NULL
      AND processed_at <= NOW() - p_operational_window;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;

ALTER TABLE public.landing_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_submissions FORCE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.landing_submissions FROM PUBLIC;
REVOKE ALL ON TABLE public.landing_submissions FROM anon;
REVOKE ALL ON TABLE public.landing_submissions FROM authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.landing_submissions TO service_role;

REVOKE ALL ON FUNCTION public.claim_landing_submission(UUID, INTERVAL) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.complete_landing_submission(UUID, UUID, UUID, UUID, UUID, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fail_landing_submission(UUID, UUID, TEXT, BOOLEAN, TIMESTAMPTZ) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.anonymize_processed_landing_submissions(INTERVAL) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.claim_landing_submission(UUID, INTERVAL) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.complete_landing_submission(UUID, UUID, UUID, UUID, UUID, INTEGER) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.fail_landing_submission(UUID, UUID, TEXT, BOOLEAN, TIMESTAMPTZ) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.anonymize_processed_landing_submissions(INTERVAL) FROM anon, authenticated;

GRANT EXECUTE ON FUNCTION public.claim_landing_submission(UUID, INTERVAL) TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_landing_submission(UUID, UUID, UUID, UUID, UUID, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.fail_landing_submission(UUID, UUID, TEXT, BOOLEAN, TIMESTAMPTZ) TO service_role;
GRANT EXECUTE ON FUNCTION public.anonymize_processed_landing_submissions(INTERVAL) TO service_role;

COMMIT;
