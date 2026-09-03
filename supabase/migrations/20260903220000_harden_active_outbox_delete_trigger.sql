-- The delete guard must inspect the private outbox without granting CRM users
-- direct access to landing_outbox_events.

CREATE OR REPLACE FUNCTION public.prevent_deal_delete_with_active_landing_outbox()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.landing_outbox_events
    WHERE deal_id = OLD.id
      AND status IN ('pending', 'processing', 'failed_retryable')
  ) THEN
    RAISE EXCEPTION 'Cannot delete deal while active landing outbox events exist'
      USING ERRCODE = 'restrict_violation';
  END IF;

  RETURN OLD;
END;
$$;

ALTER FUNCTION public.prevent_deal_delete_with_active_landing_outbox()
  OWNER TO postgres;

COMMENT ON FUNCTION public.prevent_deal_delete_with_active_landing_outbox()
  IS 'Blocks deal deletion while landing outbox events remain processable or retryable; finalized events preserve history and may lose deal_id.';

REVOKE ALL ON FUNCTION public.prevent_deal_delete_with_active_landing_outbox()
  FROM PUBLIC, anon, authenticated;
