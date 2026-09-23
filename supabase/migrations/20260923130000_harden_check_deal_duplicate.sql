-- Harden check_deal_duplicate() against the caller's search_path.
--
-- Some databases still run the pre-20260221200002 version, with unqualified
-- table names and no fixed search_path. A trigger function without its own
-- search_path inherits the caller's, so any function declared with
-- `SET search_path = ''` (e.g. record_assisted_whatsapp) fails with
-- "relation deals does not exist" when it updates a deal that has a contact.
--
-- Same body as 20260221200002_fix_function_search_path.sql: only the table
-- names are qualified and the search_path is pinned. The business rule and the
-- trigger binding (check_deal_duplicate_trigger) are unchanged. Idempotent.

CREATE OR REPLACE FUNCTION public.check_deal_duplicate()
RETURNS TRIGGER
LANGUAGE plpgsql
VOLATILE
SET search_path = ''
AS $$
DECLARE
    existing_deal RECORD;
BEGIN
    IF NEW.contact_id IS NULL THEN
        RETURN NEW;
    END IF;

    SELECT d.id, d.title, bs.label as stage_name
    INTO existing_deal
    FROM public.deals d
    LEFT JOIN public.board_stages bs ON d.stage_id = bs.id
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
$$;
