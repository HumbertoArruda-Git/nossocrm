-- Recuperação automática de submissões da landing e fila de notificação.
--
-- Dois buracos que esta migration fecha:
--
-- 1. Uma submissão só era retomada quando o MESMO visitante reenviava o mesmo
--    formulário com a mesma chave de idempotência. Na prática isso nunca
--    acontece: quem já viu "recebemos sua mensagem" vai embora. Qualquer
--    submissão travada em `processing` ou `failed_retryable` ficava parada para
--    sempre, e o contato se perdia em silêncio.
--    `claim_next_landing_submission` permite que um worker varra e retome.
--
-- 2. O e-mail de aviso para o time era disparado uma única vez, depois de a
--    submissão já estar marcada como `processed`. Falha do provedor virava
--    apenas uma linha de log: o lead ficava salvo no CRM e ninguém era avisado.
--    As colunas e RPCs de notificação transformam isso numa fila com tentativas,
--    backoff e estado terminal explícito.
BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Retomada de submissões pendentes ou travadas
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.claim_next_landing_submission(
    p_organization_id UUID,
    p_processing_timeout INTERVAL DEFAULT INTERVAL '10 minutes',
    p_max_attempts INTEGER DEFAULT 5,
    p_pending_grace INTERVAL DEFAULT INTERVAL '2 minutes'
)
RETURNS TABLE (
    submission_id UUID,
    processing_token UUID,
    attempt_count INTEGER,
    crm_contact_id UUID,
    crm_deal_id UUID,
    crm_activity_id UUID,
    name TEXT,
    email TEXT,
    phone TEXT,
    company_name TEXT,
    message TEXT,
    subject TEXT,
    source_page TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_token UUID := gen_random_uuid();
    v_id UUID;
BEGIN
    -- A carência em `pending` existe para não competir com a requisição que
    -- acabou de inserir a linha e está prestes a reivindicá-la.
    SELECT s.id INTO v_id
    FROM public.landing_submissions AS s
    WHERE s.organization_id = p_organization_id
      AND s.pii_anonymized_at IS NULL
      AND s.email IS NOT NULL
      AND s.attempt_count < p_max_attempts
      AND (
          (s.status = 'pending' AND s.created_at <= NOW() - p_pending_grace)
          OR (s.status = 'failed_retryable' AND (s.next_retry_at IS NULL OR s.next_retry_at <= NOW()))
          OR (s.status = 'processing' AND s.processing_started_at < NOW() - p_processing_timeout)
      )
    ORDER BY s.created_at
    LIMIT 1
    FOR UPDATE SKIP LOCKED;

    IF v_id IS NULL THEN
        RETURN;
    END IF;

    RETURN QUERY
    UPDATE public.landing_submissions AS s
    SET status = 'processing', processing_token = v_token,
        processing_started_at = NOW(), attempt_count = s.attempt_count + 1,
        last_error_code = NULL, last_error_at = NULL, next_retry_at = NULL
    WHERE s.id = v_id
    RETURNING s.id, s.processing_token, s.attempt_count,
              s.crm_contact_id, s.crm_deal_id, s.crm_activity_id,
              s.name, s.email, s.phone, s.company_name,
              s.message, s.subject, s.source_page;
END;
$$;

-- ---------------------------------------------------------------------------
-- 2. Fila de notificação
-- ---------------------------------------------------------------------------

ALTER TABLE public.landing_submissions
    ADD COLUMN IF NOT EXISTS notified_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS notification_attempt_count INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS notification_error_code TEXT,
    ADD COLUMN IF NOT EXISTS notification_next_retry_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS notification_failed_at TIMESTAMPTZ;

-- `notification_next_retry_at IS NULL` significa "vencida agora"; o estado
-- terminal é marcado por `notification_failed_at`, nunca pela ausência de data.
CREATE INDEX IF NOT EXISTS idx_landing_submissions_notification_pending
    ON public.landing_submissions (notification_next_retry_at)
    WHERE status = 'processed' AND notified_at IS NULL AND notification_failed_at IS NULL;

CREATE OR REPLACE FUNCTION public.claim_landing_notification(
    p_organization_id UUID,
    p_max_attempts INTEGER DEFAULT 5,
    p_retry_interval INTERVAL DEFAULT INTERVAL '5 minutes'
)
RETURNS TABLE (
    submission_id UUID,
    attempt_count INTEGER,
    name TEXT,
    email TEXT,
    phone TEXT,
    company_name TEXT,
    message TEXT,
    subject TEXT,
    source_page TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_id UUID;
BEGIN
    SELECT s.id INTO v_id
    FROM public.landing_submissions AS s
    WHERE s.organization_id = p_organization_id
      AND s.status = 'processed'
      AND s.notified_at IS NULL
      AND s.notification_failed_at IS NULL
      AND s.pii_anonymized_at IS NULL
      AND s.email IS NOT NULL
      AND s.notification_attempt_count < p_max_attempts
      AND (s.notification_next_retry_at IS NULL OR s.notification_next_retry_at <= NOW())
    ORDER BY s.processed_at
    LIMIT 1
    FOR UPDATE SKIP LOCKED;

    IF v_id IS NULL THEN
        RETURN;
    END IF;

    -- A próxima tentativa já é agendada na reivindicação. Se este worker morrer
    -- no meio do envio, a linha não é reprocessada imediatamente por outro.
    RETURN QUERY
    UPDATE public.landing_submissions AS s
    SET notification_attempt_count = s.notification_attempt_count + 1,
        notification_next_retry_at = NOW() + p_retry_interval * POWER(2, LEAST(s.notification_attempt_count, 4))
    WHERE s.id = v_id
    RETURNING s.id, s.notification_attempt_count, s.name, s.email, s.phone,
              s.company_name, s.message, s.subject, s.source_page;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_landing_notification(p_submission_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    UPDATE public.landing_submissions
    SET notified_at = NOW(), notification_next_retry_at = NULL,
        notification_error_code = NULL, notification_failed_at = NULL
    WHERE id = p_submission_id AND notified_at IS NULL;
    RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.fail_landing_notification(
    p_submission_id UUID,
    p_error_code TEXT,
    p_retryable BOOLEAN,
    p_max_attempts INTEGER DEFAULT 5
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    UPDATE public.landing_submissions AS s
    SET notification_error_code = LEFT(p_error_code, 120),
        notification_failed_at = CASE
            WHEN p_retryable AND s.notification_attempt_count < p_max_attempts THEN NULL
            ELSE NOW()
        END
    WHERE s.id = p_submission_id AND s.notified_at IS NULL;
    RETURN FOUND;
END;
$$;

-- Uma submissão ainda não avisada não pode ser anonimizada: sem os dados não há
-- como notificar, e o contato ficaria salvo sem ninguém saber que ele chegou.
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
      AND processed_at <= NOW() - p_operational_window
      AND (notified_at IS NOT NULL OR notification_failed_at IS NOT NULL);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;

-- ---------------------------------------------------------------------------
-- 3. Permissões
-- ---------------------------------------------------------------------------

REVOKE ALL ON FUNCTION public.claim_next_landing_submission(UUID, INTERVAL, INTEGER, INTERVAL) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.claim_landing_notification(UUID, INTEGER, INTERVAL) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.complete_landing_notification(UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fail_landing_notification(UUID, TEXT, BOOLEAN, INTEGER) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.anonymize_processed_landing_submissions(INTERVAL) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.claim_next_landing_submission(UUID, INTERVAL, INTEGER, INTERVAL) TO service_role;
GRANT EXECUTE ON FUNCTION public.claim_landing_notification(UUID, INTEGER, INTERVAL) TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_landing_notification(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.fail_landing_notification(UUID, TEXT, BOOLEAN, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.anonymize_processed_landing_submissions(INTERVAL) TO service_role;

COMMIT;
