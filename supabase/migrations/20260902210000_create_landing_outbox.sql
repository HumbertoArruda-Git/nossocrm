BEGIN;

CREATE TABLE public.landing_outbox_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL DEFAULT 'landing.lead.processed',
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
    submission_id UUID NOT NULL REFERENCES public.landing_submissions(id) ON DELETE RESTRICT,
    contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE RESTRICT,
    deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE RESTRICT,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'processing', 'delivered', 'failed_retryable', 'failed_terminal')),
    attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
    next_retry_at TIMESTAMPTZ,
    last_error_code TEXT,
    processing_token UUID,
    processing_started_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT landing_outbox_event_type_check
        CHECK (event_type = 'landing.lead.processed'),
    CONSTRAINT landing_outbox_submission_unique UNIQUE (submission_id),
    CONSTRAINT landing_outbox_processing_token_unique UNIQUE (processing_token),
    CONSTRAINT landing_outbox_processing_consistency CHECK (
        status <> 'processing'
        OR (processing_started_at IS NOT NULL AND processing_token IS NOT NULL)
    ),
    CONSTRAINT landing_outbox_not_processing_token CHECK (
        status = 'processing' OR processing_token IS NULL
    ),
    CONSTRAINT landing_outbox_delivered_consistency CHECK (
        status <> 'delivered' OR delivered_at IS NOT NULL
    ),
    CONSTRAINT landing_outbox_retry_consistency CHECK (
        status <> 'failed_retryable' OR next_retry_at IS NOT NULL
    )
);

CREATE INDEX idx_landing_outbox_delivery
    ON public.landing_outbox_events (status, next_retry_at, created_at)
    WHERE status IN ('pending', 'failed_retryable');

CREATE INDEX idx_landing_outbox_processing
    ON public.landing_outbox_events (processing_started_at)
    WHERE status = 'processing';

CREATE INDEX idx_landing_outbox_org_created_at
    ON public.landing_outbox_events (organization_id, created_at DESC);

CREATE INDEX idx_landing_outbox_deal
    ON public.landing_outbox_events (deal_id);

CREATE OR REPLACE FUNCTION public.set_landing_outbox_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER landing_outbox_events_updated_at
BEFORE UPDATE ON public.landing_outbox_events
FOR EACH ROW
EXECUTE FUNCTION public.set_landing_outbox_updated_at();

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
DECLARE
    v_event_contact_id UUID;
    v_event_deal_id UUID;
BEGIN
    IF p_crm_contact_id IS NULL OR p_crm_deal_id IS NULL THEN
        RAISE EXCEPTION 'CRM contact and deal are required';
    END IF;

    UPDATE public.landing_submissions
    SET status = 'processed', processing_token = NULL,
        processing_started_at = NULL, crm_contact_id = p_crm_contact_id,
        crm_deal_id = p_crm_deal_id, crm_activity_id = p_crm_activity_id,
        response_code = p_response_code, processed_at = NOW(), next_retry_at = NULL
    WHERE id = p_submission_id AND status = 'processing'
      AND processing_token = p_processing_token;

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    INSERT INTO public.landing_outbox_events (
        organization_id, submission_id, contact_id, deal_id
    )
    SELECT s.organization_id, s.id, s.crm_contact_id, s.crm_deal_id
    FROM public.landing_submissions AS s
    WHERE s.id = p_submission_id
    ON CONFLICT (submission_id) DO NOTHING;

    SELECT e.contact_id, e.deal_id
    INTO v_event_contact_id, v_event_deal_id
    FROM public.landing_outbox_events AS e
    WHERE e.submission_id = p_submission_id;

    IF v_event_contact_id IS DISTINCT FROM p_crm_contact_id
       OR v_event_deal_id IS DISTINCT FROM p_crm_deal_id THEN
        RAISE EXCEPTION 'Landing outbox event identity mismatch';
    END IF;

    RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_landing_outbox_events(
    p_delivered_before INTERVAL DEFAULT INTERVAL '90 days'
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    IF p_delivered_before <= INTERVAL '0 seconds' THEN
        RAISE EXCEPTION 'Retention interval must be positive';
    END IF;

    DELETE FROM public.landing_outbox_events
    WHERE status = 'delivered'
      AND delivered_at <= NOW() - p_delivered_before;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;

ALTER TABLE public.landing_outbox_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_outbox_events FORCE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.landing_outbox_events FROM PUBLIC;
REVOKE ALL ON TABLE public.landing_outbox_events FROM anon;
REVOKE ALL ON TABLE public.landing_outbox_events FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.landing_outbox_events TO service_role;

REVOKE ALL ON FUNCTION public.complete_landing_submission(UUID, UUID, UUID, UUID, UUID, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_landing_submission(UUID, UUID, UUID, UUID, UUID, INTEGER) TO service_role;

REVOKE ALL ON FUNCTION public.cleanup_landing_outbox_events(INTERVAL) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_landing_outbox_events(INTERVAL) TO service_role;

COMMIT;
