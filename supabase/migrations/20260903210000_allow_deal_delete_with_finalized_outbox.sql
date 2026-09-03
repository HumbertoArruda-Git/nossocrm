-- Deals cannot be deleted while landing outbox events are still processable
-- or retryable. Finalized events retain their history and may lose deal_id.

CREATE OR REPLACE FUNCTION public.prevent_deal_delete_with_active_landing_outbox()
RETURNS trigger
LANGUAGE plpgsql
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

COMMENT ON FUNCTION public.prevent_deal_delete_with_active_landing_outbox()
  IS 'Blocks deal deletion while landing outbox events remain processable or retryable; finalized events preserve history and may lose deal_id.';

DROP TRIGGER IF EXISTS prevent_deal_delete_with_active_landing_outbox
  ON public.deals;

CREATE TRIGGER prevent_deal_delete_with_active_landing_outbox
BEFORE DELETE ON public.deals
FOR EACH ROW
EXECUTE FUNCTION public.prevent_deal_delete_with_active_landing_outbox();

ALTER TABLE public.landing_outbox_events
  ALTER COLUMN deal_id DROP NOT NULL;

ALTER TABLE public.landing_outbox_events
  DROP CONSTRAINT IF EXISTS landing_outbox_events_deal_id_fkey;

ALTER TABLE public.landing_outbox_events
  ADD CONSTRAINT landing_outbox_events_deal_id_fkey
  FOREIGN KEY (deal_id)
  REFERENCES public.deals(id)
  ON DELETE SET NULL;
