-- ROLLBACK of the WhatsApp assistido migrations. DO NOT run unless reverting.
--
-- Undoes, in reverse order:
--   20260923180000_whatsapp_assisted_contact_on_confirm
--   20260923150000_whatsapp_assisted_follow_up_limit
--   20260923135915_whatsapp_assisted_activities
--   20260923130000_harden_check_deal_duplicate
--
-- BEFORE running: roll the Vercel production deploy back to the build before the
-- WhatsApp assistido merge. The new app calls record_assisted_whatsapp and reads
-- activities.metadata; the old app uses neither.
--
-- Rows written by the flow (WhatsApp NOTEs, follow-up TASKs, contacts created on
-- confirmation, stage moves) are ordinary CRM data and are kept.
--
-- State captured from production (mplmfhgunsymetqrqrkb) on 2026-09-23, before
-- the migrations: check_deal_duplicate owner postgres, ACL
-- {=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres},
-- VOLATILE, SECURITY INVOKER, no proconfig, md5(prosrc) = d48051ac2ac692e2a1fa5fb0c138ecc5.
-- record_assisted_whatsapp did not exist; activities had 14 columns, no metadata.

BEGIN;

-- 1+2+3. record_assisted_whatsapp: remove every version the migrations may have left.
DROP FUNCTION IF EXISTS public.record_assisted_whatsapp(uuid, text, text, uuid, uuid, text);
DROP FUNCTION IF EXISTS public.record_assisted_whatsapp(uuid, text, text, uuid, uuid);

-- 4. check_deal_duplicate: exact production body (unqualified names, no search_path).
-- CREATE OR REPLACE keeps the owner, the ACL and the trigger binding, and resets
-- proconfig to empty because no SET clause is given.
CREATE OR REPLACE FUNCTION public.check_deal_duplicate()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    existing_deal RECORD;
BEGIN
    IF NEW.contact_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Fix: Check if deal is OPEN via is_won/is_lost flags
    -- A deal is open if NOT won AND NOT lost
    SELECT d.id, d.title, bs.label as stage_name
    INTO existing_deal
    FROM deals d
    LEFT JOIN board_stages bs ON d.stage_id = bs.id
    WHERE d.contact_id = NEW.contact_id 
      AND d.stage_id = NEW.stage_id
      AND d.deleted_at IS NULL
      AND d.is_won = FALSE 
      AND d.is_lost = FALSE
      AND NEW.is_won = FALSE
      AND NEW.is_lost = FALSE
      AND (TG_OP = 'INSERT' OR d.id != NEW.id)
    LIMIT 1;

    IF FOUND THEN
        RAISE EXCEPTION 'Já existe um negócio para este contato no estágio "%". Mova o negócio existente ou escolha outro estágio.', 
            COALESCE(existing_deal.stage_name, 'desconhecido')
        USING ERRCODE = 'unique_violation';
    END IF;

    RETURN NEW;
END;
$function$;

-- The ACL is unchanged by the migrations; restated only to pin the captured state.
GRANT EXECUTE ON FUNCTION public.check_deal_duplicate() TO PUBLIC, anon, authenticated, service_role;

-- Guard: fail (and roll back) unless the restored function is byte-identical.
DO $check$
BEGIN
  IF (SELECT md5(prosrc) FROM pg_catalog.pg_proc
      WHERE oid = 'public.check_deal_duplicate()'::regprocedure) <> 'd48051ac2ac692e2a1fa5fb0c138ecc5'
     OR (SELECT proconfig FROM pg_catalog.pg_proc
      WHERE oid = 'public.check_deal_duplicate()'::regprocedure) IS NOT NULL
     OR EXISTS (SELECT 1 FROM pg_catalog.pg_proc WHERE proname = 'record_assisted_whatsapp') THEN
    RAISE EXCEPTION 'rollback: estado restaurado difere do capturado';
  END IF;
END $check$;

COMMIT;

-- 5. OPTIONAL, full revert only. Drops the WhatsApp history markers
-- (channel/event/request_id/follow_up_number) stored on activities; the
-- activities themselves stay. Run separately, after the block above.
-- BEGIN;
-- ALTER TABLE public.activities DROP COLUMN IF EXISTS metadata;
-- COMMIT;

-- 6. After running, remove from supabase_migrations.schema_migrations the four
-- versions recorded for these migrations (look them up by name first):
-- SELECT version, name FROM supabase_migrations.schema_migrations
-- WHERE name IN ('harden_check_deal_duplicate', 'whatsapp_assisted_activities',
--   'whatsapp_assisted_follow_up_limit', 'whatsapp_assisted_contact_on_confirm');
