-- Assisted WhatsApp: up to two manual follow-ups, and a sequence that never restarts.
-- Same signature as 20260923135915; only the body changes.
CREATE OR REPLACE FUNCTION public.record_assisted_whatsapp(
  p_deal_id uuid,
  p_event text,
  p_message text,
  p_request_id uuid,
  p_follow_up_task_id uuid DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_max_follow_ups constant integer := 2;
  v_org_id uuid;
  v_deal public.deals%ROWTYPE;
  v_board_key text;
  v_contact_org_id uuid;
  v_stage_name text;
  v_target_stage_id uuid;
  v_existing_id uuid;
  v_activity_id uuid;
  v_task_id uuid;
  v_follow_up_number integer;
  v_next_follow_up integer;
  v_due_date date;
  v_days_added integer := 0;
  v_now timestamptz := now();
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;
  IF p_request_id IS NULL OR p_event IS NULL OR p_event NOT IN ('initial_sent', 'follow_up_sent', 'replied') THEN
    RAISE EXCEPTION 'Evento ou chave de confirmação inválida';
  END IF;
  IF length(coalesce(p_message, '')) > 10000
     OR (p_event <> 'replied' AND length(btrim(coalesce(p_message, ''))) = 0) THEN
    RAISE EXCEPTION 'Mensagem inválida';
  END IF;

  SELECT organization_id INTO v_org_id
  FROM public.profiles WHERE id = auth.uid();
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Organização não encontrada';
  END IF;

  -- Serializes confirmations for this deal, including retries with the same key.
  SELECT * INTO v_deal
  FROM public.deals
  WHERE id = p_deal_id AND organization_id = v_org_id AND deleted_at IS NULL
  FOR UPDATE;
  IF NOT FOUND OR v_deal.contact_id IS NULL OR v_deal.is_won OR v_deal.is_lost THEN
    RAISE EXCEPTION 'Negócio indisponível';
  END IF;

  SELECT key INTO v_board_key
  FROM public.boards
  WHERE id = v_deal.board_id AND organization_id = v_org_id AND deleted_at IS NULL;
  IF v_board_key IS DISTINCT FROM 'prospeccao-comercial' THEN
    RAISE EXCEPTION 'Fluxo disponível apenas para prospecção comercial';
  END IF;

  SELECT organization_id INTO v_contact_org_id
  FROM public.contacts
  WHERE id = v_deal.contact_id AND organization_id = v_org_id AND deleted_at IS NULL;
  IF v_contact_org_id IS DISTINCT FROM v_org_id THEN
    RAISE EXCEPTION 'Contato indisponível';
  END IF;

  SELECT id INTO v_existing_id FROM public.activities
  WHERE deal_id = p_deal_id AND organization_id = v_org_id
    AND metadata->>'request_id' = p_request_id::text
    AND deleted_at IS NULL
  LIMIT 1;
  IF v_existing_id IS NOT NULL THEN
    RETURN jsonb_build_object('activity_id', v_existing_id, 'stage_id', v_deal.stage_id, 'duplicate', true);
  END IF;

  -- A reply ends the sequence for good: nothing restarts it.
  IF EXISTS (SELECT 1 FROM public.activities
    WHERE deal_id = p_deal_id AND organization_id = v_org_id AND deleted_at IS NULL
      AND metadata->>'channel' = 'whatsapp' AND metadata->>'event' = 'replied') THEN
    RAISE EXCEPTION 'Resposta já registrada; sequência encerrada';
  END IF;

  IF p_event = 'initial_sent' AND EXISTS (SELECT 1 FROM public.activities
    WHERE deal_id = p_deal_id AND organization_id = v_org_id AND deleted_at IS NULL
      AND metadata->>'channel' = 'whatsapp'
      AND metadata->>'event' IN ('initial_sent', 'follow_up_sent', 'follow_up_due')) THEN
    RAISE EXCEPTION 'Sequência já iniciada';
  END IF;

  SELECT name INTO v_stage_name FROM public.board_stages
  WHERE id = v_deal.stage_id AND board_id = v_deal.board_id AND organization_id = v_org_id;
  IF v_stage_name IS NULL THEN
    RAISE EXCEPTION 'Etapa do negócio indisponível';
  END IF;

  IF p_event = 'follow_up_sent' THEN
    SELECT id, coalesce((metadata->>'follow_up_number')::integer, 1)
    INTO v_task_id, v_follow_up_number
    FROM public.activities
    WHERE id = p_follow_up_task_id AND deal_id = p_deal_id
      AND contact_id = v_deal.contact_id AND organization_id = v_org_id
      AND type = 'TASK' AND completed = false AND deleted_at IS NULL
      AND metadata->>'channel' = 'whatsapp'
      AND metadata->>'event' = 'follow_up_due'
    FOR UPDATE;
    IF v_task_id IS NULL THEN
      RAISE EXCEPTION 'Tarefa de follow-up indisponível';
    END IF;
    UPDATE public.activities
    SET completed = true, metadata = metadata || jsonb_build_object('status', 'done')
    WHERE id = v_task_id;
  END IF;

  INSERT INTO public.activities
    (organization_id, deal_id, contact_id, owner_id, type, title, description, date, completed, metadata)
  VALUES
    (v_org_id, p_deal_id, v_deal.contact_id, auth.uid(), 'NOTE',
     CASE p_event WHEN 'initial_sent' THEN 'WhatsApp inicial confirmado'
       WHEN 'follow_up_sent' THEN 'Follow-up ' || v_follow_up_number || ' WhatsApp confirmado'
       ELSE 'Resposta WhatsApp informada' END,
     CASE WHEN p_event = 'replied' AND btrim(coalesce(p_message, '')) = ''
       THEN 'Resposta informada manualmente.' ELSE p_message END,
     v_now, true,
     jsonb_build_object('channel', 'whatsapp', 'event', p_event,
       'status', 'manually_confirmed', 'request_id', p_request_id::text)
     || CASE WHEN p_event = 'follow_up_sent'
          THEN jsonb_build_object('follow_up_number', v_follow_up_number) ELSE '{}'::jsonb END)
  RETURNING id INTO v_activity_id;

  IF p_event = 'replied' THEN
    UPDATE public.activities
    SET completed = true, metadata = metadata || jsonb_build_object('status', 'cancelled_by_reply')
    WHERE deal_id = p_deal_id AND organization_id = v_org_id
      AND contact_id = v_deal.contact_id AND type = 'TASK'
      AND completed = false AND deleted_at IS NULL
      AND metadata->>'channel' = 'whatsapp'
      AND metadata->>'event' = 'follow_up_due';
  END IF;

  IF (p_event IN ('initial_sent', 'follow_up_sent')
      AND v_stage_name IN ('Novo Lead', 'Aprovado para contato', 'Em Revisão'))
     OR (p_event = 'replied' AND v_stage_name = 'Contatado') THEN
    SELECT id INTO v_target_stage_id FROM public.board_stages
    WHERE board_id = v_deal.board_id AND organization_id = v_org_id
      AND name = CASE WHEN p_event = 'replied' THEN 'Respondeu' ELSE 'Contatado' END
    LIMIT 1;
    IF v_target_stage_id IS NULL THEN
      RAISE EXCEPTION 'Etapa de destino indisponível';
    END IF;
    UPDATE public.deals
    SET stage_id = v_target_stage_id, status = v_target_stage_id::text,
      last_stage_change_date = v_now, updated_at = v_now
    WHERE id = p_deal_id AND organization_id = v_org_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Não foi possível atualizar a etapa';
    END IF;
    v_stage_name := CASE WHEN p_event = 'replied' THEN 'Respondeu' ELSE 'Contatado' END;
  END IF;

  -- Reminders only while the deal waits in Contatado; advanced stages never restart it.
  v_next_follow_up := CASE
    WHEN p_event = 'initial_sent' THEN 1
    WHEN p_event = 'follow_up_sent' AND v_follow_up_number < v_max_follow_ups THEN v_follow_up_number + 1
    ELSE NULL END;
  v_task_id := NULL;
  IF v_next_follow_up IS NOT NULL AND v_stage_name = 'Contatado' THEN
    v_due_date := (v_now AT TIME ZONE 'America/Sao_Paulo')::date;
    WHILE v_days_added < 2 LOOP
      v_due_date := v_due_date + 1;
      IF extract(isodow FROM v_due_date) < 6 THEN
        v_days_added := v_days_added + 1;
      END IF;
    END LOOP;
    INSERT INTO public.activities
      (organization_id, deal_id, contact_id, owner_id, type, title, description, date, completed, metadata)
    VALUES
      (v_org_id, p_deal_id, v_deal.contact_id, auth.uid(), 'TASK',
       'Follow-up ' || v_next_follow_up || ' WhatsApp', 'Retomar contato pelo WhatsApp.',
       (v_due_date + time '09:00') AT TIME ZONE 'America/Sao_Paulo',
       false, jsonb_build_object('channel', 'whatsapp', 'event', 'follow_up_due',
         'status', 'pending', 'follow_up_number', v_next_follow_up,
         'source_activity_id', v_activity_id::text))
    RETURNING id INTO v_task_id;
  END IF;

  RETURN jsonb_build_object('activity_id', v_activity_id,
    'stage_id', coalesce(v_target_stage_id, v_deal.stage_id),
    'task_id', v_task_id, 'follow_up_number', v_follow_up_number, 'duplicate', false);
END;
$$;

REVOKE ALL ON FUNCTION public.record_assisted_whatsapp(uuid, text, text, uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_assisted_whatsapp(uuid, text, text, uuid, uuid) TO authenticated;
