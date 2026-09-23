-- STAGING ONLY. All fixtures and assertions are rolled back.
-- Requires 20260923135915, 20260923150000 (two-follow-up limit) and
-- 20260923180000 (contact created/filled on a confirmed send).
BEGIN;
SELECT set_config('request.jwt.claim.sub',
  (SELECT id::text FROM public.profiles WHERE organization_id IS NOT NULL LIMIT 1), true);

-- (organization_id, key) is unique: park an existing prospecção board for this transaction.
UPDATE public.boards SET key = 'prospeccao-comercial-parked-by-test'
WHERE key = 'prospeccao-comercial'
  AND organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid());

INSERT INTO public.boards (id, organization_id, key, name)
SELECT '00000000-0000-4000-8000-000000000101', organization_id,
  'prospeccao-comercial', 'Teste assistido'
FROM public.profiles WHERE id = auth.uid();

INSERT INTO public.board_stages (id, organization_id, board_id, name, "order")
SELECT ('00000000-0000-4000-8000-0000000001' || lpad(n::text, 2, '0'))::uuid,
  organization_id, '00000000-0000-4000-8000-000000000101'::uuid, stage_name, n
FROM public.profiles,
  (VALUES (11, 'Novo Lead'), (12, 'Em Revisão'), (13, 'Aprovado para contato'),
    (14, 'Contatado'), (15, 'Respondeu'), (16, 'Reunião Agendada'),
    (17, 'Proposta Enviada'), (18, 'Negociação')) AS stages(n, stage_name)
WHERE profiles.id = auth.uid();

INSERT INTO public.contacts (id, organization_id, name, phone)
SELECT ('00000000-0000-4000-8000-0000000001' || lpad(n::text, 2, '0'))::uuid,
  organization_id, 'Teste WhatsApp ' || n, '11999990000'
FROM public.profiles,
  (VALUES (21), (22), (23), (24), (25), (27)) AS contacts(n)
WHERE profiles.id = auth.uid();

INSERT INTO public.contacts (id, organization_id, name)
SELECT '00000000-0000-4000-8000-000000000129', organization_id, 'Contato sem telefone'
FROM public.profiles WHERE id = auth.uid();

INSERT INTO public.crm_companies (id, organization_id, name)
SELECT '00000000-0000-4000-8000-000000000161', organization_id, 'Empresa Teste'
FROM public.profiles WHERE id = auth.uid();

INSERT INTO public.deals (id, organization_id, board_id, stage_id, contact_id, client_company_id, title)
SELECT ('00000000-0000-4000-8000-0000000001' || n)::uuid, organization_id,
  '00000000-0000-4000-8000-000000000101'::uuid, '00000000-0000-4000-8000-000000000111'::uuid,
  contact_id::uuid, company_id::uuid, 'Teste ' || n
FROM public.profiles,
  (VALUES ('38', NULL, '00000000-0000-4000-8000-000000000161'),
    ('39', '00000000-0000-4000-8000-000000000129', NULL),
    ('40', NULL, NULL)) AS fixtures(n, contact_id, company_id)
WHERE profiles.id = auth.uid();

INSERT INTO public.deals (id, organization_id, board_id, stage_id, contact_id, title)
SELECT ('00000000-0000-4000-8000-0000000001' || lpad(n::text, 2, '0'))::uuid,
  organization_id, '00000000-0000-4000-8000-000000000101'::uuid,
  ('00000000-0000-4000-8000-0000000001' || lpad(stage_n::text, 2, '0'))::uuid,
  ('00000000-0000-4000-8000-0000000001' || lpad((n - 10)::text, 2, '0'))::uuid, 'Teste ' || n
FROM public.profiles,
  (VALUES (31, 11), (32, 13), (33, 16), (34, 14), (35, 12), (37, 11)) AS fixtures(n, stage_n)
WHERE profiles.id = auth.uid();

INSERT INTO public.organizations (id, name)
VALUES ('00000000-0000-4000-8000-000000000201', 'Outro tenant temporário');
INSERT INTO public.boards (id, organization_id, key, name)
VALUES ('00000000-0000-4000-8000-000000000202',
  '00000000-0000-4000-8000-000000000201', 'prospeccao-comercial', 'Quadro externo');
INSERT INTO public.board_stages (id, organization_id, board_id, name, "order")
VALUES ('00000000-0000-4000-8000-000000000203',
  '00000000-0000-4000-8000-000000000201',
  '00000000-0000-4000-8000-000000000202', 'Novo Lead', 0);
INSERT INTO public.contacts (id, organization_id, name)
VALUES ('00000000-0000-4000-8000-000000000204',
  '00000000-0000-4000-8000-000000000201', 'Contato externo');
INSERT INTO public.deals (id, organization_id, board_id, stage_id, contact_id, title)
VALUES ('00000000-0000-4000-8000-000000000205',
  '00000000-0000-4000-8000-000000000201',
  '00000000-0000-4000-8000-000000000202',
  '00000000-0000-4000-8000-000000000203',
  '00000000-0000-4000-8000-000000000204', 'Negócio externo');

SET LOCAL ROLE authenticated;
DO $assert$
DECLARE
  result jsonb;
  task_id uuid;
  task2_id uuid;
  new_contact uuid;
  expected_due date;
  added integer := 0;
  rejected boolean;
BEGIN
  result := public.record_assisted_whatsapp(
    '00000000-0000-4000-8000-000000000131', 'initial_sent',
    E'Olá!\nA&B?', '00000000-0000-4000-8000-000000000141', NULL, '+5521911112222');
  IF result->>'stage_id' <> '00000000-0000-4000-8000-000000000114' THEN
    RAISE EXCEPTION 'Novo Lead não avançou';
  END IF;
  IF (SELECT phone FROM public.contacts WHERE id = '00000000-0000-4000-8000-000000000121') <> '11999990000'
     OR EXISTS (SELECT 1 FROM public.contacts WHERE phone = '+5521911112222') THEN
    RAISE EXCEPTION 'Telefone existente foi sobrescrito ou contato duplicado';
  END IF;
  IF (SELECT count(*) FROM public.activities
      WHERE deal_id = '00000000-0000-4000-8000-000000000131') <> 2 THEN
    RAISE EXCEPTION 'Atividade e TASK não foram criadas';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.activities
    WHERE deal_id = '00000000-0000-4000-8000-000000000131'
      AND type = 'NOTE' AND description = E'Olá!\nA&B?'
      AND metadata->>'channel' = 'whatsapp'
      AND metadata->>'event' = 'initial_sent'
      AND metadata->>'status' = 'manually_confirmed') THEN
    RAISE EXCEPTION 'Histórico ou mensagem divergente';
  END IF;
  expected_due := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  WHILE added < 2 LOOP
    expected_due := expected_due + 1;
    IF extract(isodow FROM expected_due) < 6 THEN added := added + 1; END IF;
  END LOOP;
  IF NOT EXISTS (SELECT 1 FROM public.activities
    WHERE deal_id = '00000000-0000-4000-8000-000000000131'
      AND type = 'TASK' AND completed = false
      AND (date AT TIME ZONE 'America/Sao_Paulo')::date = expected_due
      AND (date AT TIME ZONE 'America/Sao_Paulo')::time = time '09:00') THEN
    RAISE EXCEPTION 'Follow-up não caiu em dois dias úteis às 09h';
  END IF;

  result := public.record_assisted_whatsapp(
    '00000000-0000-4000-8000-000000000131', 'initial_sent',
    E'Olá!\nA&B?', '00000000-0000-4000-8000-000000000141');
  IF result->>'duplicate' <> 'true' OR
      (SELECT count(*) FROM public.activities
       WHERE deal_id = '00000000-0000-4000-8000-000000000131') <> 2 THEN
    RAISE EXCEPTION 'Confirmação duplicada criou registros';
  END IF;

  result := public.record_assisted_whatsapp(
    '00000000-0000-4000-8000-000000000132', 'initial_sent',
    'Aprovado', '00000000-0000-4000-8000-000000000142');
  IF result->>'stage_id' <> '00000000-0000-4000-8000-000000000114' THEN
    RAISE EXCEPTION 'Aprovado para contato não avançou';
  END IF;
  result := public.record_assisted_whatsapp(
    '00000000-0000-4000-8000-000000000135', 'initial_sent',
    'Revisão', '00000000-0000-4000-8000-000000000143');
  IF result->>'stage_id' <> '00000000-0000-4000-8000-000000000114' THEN
    RAISE EXCEPTION 'Em Revisão não avançou após confirmação explícita';
  END IF;
  result := public.record_assisted_whatsapp(
    '00000000-0000-4000-8000-000000000133', 'initial_sent',
    'Etapa avançada', '00000000-0000-4000-8000-000000000144');
  IF result->>'stage_id' <> '00000000-0000-4000-8000-000000000116' THEN
    RAISE EXCEPTION 'Etapa avançada regrediu';
  END IF;
  IF EXISTS (SELECT 1 FROM public.activities
    WHERE deal_id = '00000000-0000-4000-8000-000000000133' AND type = 'TASK') THEN
    RAISE EXCEPTION 'Etapa avançada iniciou lembretes';
  END IF;

  SELECT id INTO task_id FROM public.activities
  WHERE deal_id = '00000000-0000-4000-8000-000000000132'
    AND type = 'TASK' AND completed = false;
  IF (SELECT metadata->>'follow_up_number' FROM public.activities WHERE id = task_id) <> '1' THEN
    RAISE EXCEPTION 'TASK inicial não é o follow-up 1';
  END IF;
  result := public.record_assisted_whatsapp(
    '00000000-0000-4000-8000-000000000132', 'follow_up_sent',
    'Follow-up confirmado', '00000000-0000-4000-8000-000000000145', task_id);
  IF (SELECT completed FROM public.activities WHERE id = task_id) IS NOT TRUE
     OR NOT EXISTS (SELECT 1 FROM public.activities
       WHERE deal_id = '00000000-0000-4000-8000-000000000132'
         AND metadata->>'event' = 'follow_up_sent'
         AND metadata->>'follow_up_number' = '1')
     OR result->>'stage_id' <> '00000000-0000-4000-8000-000000000114' THEN
    RAISE EXCEPTION 'Follow-up não concluiu TASK ou mudou etapa incorretamente';
  END IF;

  SELECT id INTO task2_id FROM public.activities
  WHERE deal_id = '00000000-0000-4000-8000-000000000132'
    AND type = 'TASK' AND completed = false
    AND metadata->>'follow_up_number' = '2';
  IF task2_id IS NULL THEN
    RAISE EXCEPTION 'Follow-up 1 não criou a TASK do follow-up 2';
  END IF;
  result := public.record_assisted_whatsapp(
    '00000000-0000-4000-8000-000000000132', 'follow_up_sent',
    'Segundo follow-up', '00000000-0000-4000-8000-000000000151', task2_id);
  IF (SELECT completed FROM public.activities WHERE id = task2_id) IS NOT TRUE
     OR result->>'task_id' IS NOT NULL
     OR EXISTS (SELECT 1 FROM public.activities
       WHERE deal_id = '00000000-0000-4000-8000-000000000132'
         AND type = 'TASK' AND completed = false) THEN
    RAISE EXCEPTION 'Follow-up 2 criou uma terceira TASK';
  END IF;

  rejected := false;
  BEGIN
    PERFORM public.record_assisted_whatsapp(
      '00000000-0000-4000-8000-000000000132', 'initial_sent',
      'Reinício', '00000000-0000-4000-8000-000000000152');
  EXCEPTION WHEN OTHERS THEN rejected := true;
  END;
  IF NOT rejected THEN RAISE EXCEPTION 'Sequência encerrada foi reiniciada'; END IF;

  result := public.record_assisted_whatsapp(
    '00000000-0000-4000-8000-000000000131', 'replied',
    'Cliente respondeu', '00000000-0000-4000-8000-000000000146');
  IF result->>'stage_id' <> '00000000-0000-4000-8000-000000000115'
     OR EXISTS (SELECT 1 FROM public.activities
       WHERE deal_id = '00000000-0000-4000-8000-000000000131'
         AND type = 'TASK' AND completed = false) THEN
    RAISE EXCEPTION 'Resposta não avançou ou não concluiu follow-up';
  END IF;
  rejected := false;
  BEGIN
    PERFORM public.record_assisted_whatsapp(
      '00000000-0000-4000-8000-000000000131', 'initial_sent',
      'Após resposta', '00000000-0000-4000-8000-000000000153');
  EXCEPTION WHEN OTHERS THEN rejected := true;
  END;
  IF NOT rejected THEN RAISE EXCEPTION 'Envio após resposta reiniciou a sequência'; END IF;
  -- Retry of the same reply is idempotent, not an error.
  result := public.record_assisted_whatsapp(
    '00000000-0000-4000-8000-000000000131', 'replied',
    'Cliente respondeu', '00000000-0000-4000-8000-000000000146');
  IF result->>'duplicate' <> 'true' THEN
    RAISE EXCEPTION 'Repetição da resposta não foi idempotente';
  END IF;
  result := public.record_assisted_whatsapp(
    '00000000-0000-4000-8000-000000000133', 'replied',
    'Respondeu em etapa avançada', '00000000-0000-4000-8000-000000000147');
  IF result->>'stage_id' <> '00000000-0000-4000-8000-000000000116' THEN
    RAISE EXCEPTION 'Resposta regrediu etapa avançada';
  END IF;

  -- Deal without contact: the confirmed send creates exactly one contact, linked everywhere.
  result := public.record_assisted_whatsapp(
    '00000000-0000-4000-8000-000000000138', 'initial_sent',
    'Sem contato', '00000000-0000-4000-8000-000000000160', NULL, '+5521988887777');
  new_contact := (result->>'contact_id')::uuid;
  IF new_contact IS NULL OR result->>'contact_created' <> 'true'
     OR result->>'stage_id' <> '00000000-0000-4000-8000-000000000114'
     OR (SELECT count(*) FROM public.contacts WHERE phone = '+5521988887777') <> 1
     OR (SELECT contact_id FROM public.deals WHERE id = '00000000-0000-4000-8000-000000000138') <> new_contact
     OR NOT EXISTS (SELECT 1 FROM public.contacts WHERE id = new_contact
       AND name = '+5521988887777' AND source = 'whatsapp'
       AND client_company_id = '00000000-0000-4000-8000-000000000161'
       AND company_name = 'Empresa Teste')
     OR (SELECT count(*) FROM public.activities WHERE deal_id = '00000000-0000-4000-8000-000000000138'
       AND contact_id = new_contact) <> 2 THEN
    RAISE EXCEPTION 'Contato novo não foi criado, vinculado ou usado na atividade e TASK';
  END IF;
  result := public.record_assisted_whatsapp(
    '00000000-0000-4000-8000-000000000138', 'initial_sent',
    'Sem contato', '00000000-0000-4000-8000-000000000160', NULL, '+5521988887777');
  IF result->>'duplicate' <> 'true'
     OR (SELECT count(*) FROM public.contacts WHERE phone = '+5521988887777') <> 1
     OR (SELECT count(*) FROM public.activities WHERE deal_id = '00000000-0000-4000-8000-000000000138') <> 2 THEN
    RAISE EXCEPTION 'Repetição criou segundo contato ou atividade';
  END IF;
  -- Follow-up reuses the persisted contact and keeps its number.
  SELECT id INTO task_id FROM public.activities
  WHERE deal_id = '00000000-0000-4000-8000-000000000138' AND type = 'TASK' AND completed = false;
  result := public.record_assisted_whatsapp(
    '00000000-0000-4000-8000-000000000138', 'follow_up_sent',
    'Follow-up', '00000000-0000-4000-8000-000000000162', task_id, '+5521900001111');
  IF EXISTS (SELECT 1 FROM public.contacts WHERE phone = '+5521900001111')
     OR (SELECT phone FROM public.contacts WHERE id = new_contact) <> '+5521988887777'
     OR EXISTS (SELECT 1 FROM public.activities WHERE deal_id = '00000000-0000-4000-8000-000000000138'
       AND contact_id IS DISTINCT FROM new_contact) THEN
    RAISE EXCEPTION 'Follow-up não reutilizou o contato e o telefone salvos';
  END IF;

  -- Deal whose contact has no phone: the same contact gets it, nothing is duplicated.
  result := public.record_assisted_whatsapp(
    '00000000-0000-4000-8000-000000000139', 'initial_sent',
    'Contato sem telefone', '00000000-0000-4000-8000-000000000163', NULL, '+5521966665555');
  IF result->>'contact_created' <> 'false'
     OR (SELECT phone FROM public.contacts WHERE id = '00000000-0000-4000-8000-000000000129') <> '+5521966665555'
     OR (SELECT count(*) FROM public.contacts WHERE phone = '+5521966665555') <> 1
     OR (SELECT contact_id FROM public.deals WHERE id = '00000000-0000-4000-8000-000000000139')
        <> '00000000-0000-4000-8000-000000000129' THEN
    RAISE EXCEPTION 'Contato sem telefone não foi atualizado ou foi duplicado';
  END IF;

  -- No contact: a reply, a missing phone or a malformed one are refused without writing.
  rejected := false;
  BEGIN
    PERFORM public.record_assisted_whatsapp('00000000-0000-4000-8000-000000000140', 'replied',
      '', '00000000-0000-4000-8000-000000000164');
  EXCEPTION WHEN OTHERS THEN rejected := true;
  END;
  IF NOT rejected THEN RAISE EXCEPTION 'Resposta aceita sem contato'; END IF;
  rejected := false;
  BEGIN
    PERFORM public.record_assisted_whatsapp('00000000-0000-4000-8000-000000000140', 'initial_sent',
      'Sem telefone', '00000000-0000-4000-8000-000000000165');
  EXCEPTION WHEN OTHERS THEN rejected := true;
  END;
  IF NOT rejected THEN RAISE EXCEPTION 'Envio aceito sem contato e sem telefone'; END IF;
  rejected := false;
  BEGIN
    PERFORM public.record_assisted_whatsapp('00000000-0000-4000-8000-000000000140', 'initial_sent',
      'Telefone sem +', '00000000-0000-4000-8000-000000000166', NULL, '5521977776666');
  EXCEPTION WHEN OTHERS THEN rejected := true;
  END;
  IF NOT rejected THEN RAISE EXCEPTION 'Telefone fora do formato aceito'; END IF;

  rejected := false;
  BEGIN
    PERFORM public.record_assisted_whatsapp(
      '00000000-0000-4000-8000-000000000205', 'initial_sent',
      'Outro tenant', '00000000-0000-4000-8000-000000000148');
  EXCEPTION WHEN OTHERS THEN rejected := true;
  END;
  IF NOT rejected THEN RAISE EXCEPTION 'Isolamento entre organizações falhou'; END IF;

  rejected := false;
  BEGIN
    PERFORM public.record_assisted_whatsapp(
      '00000000-0000-4000-8000-000000000132', 'follow_up_sent',
      'Tarefa inexistente', '00000000-0000-4000-8000-000000000149',
      '00000000-0000-4000-8000-000000000199');
  EXCEPTION WHEN OTHERS THEN rejected := true;
  END;
  IF NOT rejected THEN RAISE EXCEPTION 'Follow-up aceitou tarefa inválida'; END IF;

  UPDATE public.board_stages SET name = 'Destino indisponível'
  WHERE id = '00000000-0000-4000-8000-000000000114';
  rejected := false;
  BEGIN
    PERFORM public.record_assisted_whatsapp(
      '00000000-0000-4000-8000-000000000137', 'initial_sent',
      'Não gravar', '00000000-0000-4000-8000-000000000150');
  EXCEPTION WHEN OTHERS THEN rejected := true;
  END;
  IF NOT rejected OR EXISTS (SELECT 1 FROM public.activities
    WHERE deal_id = '00000000-0000-4000-8000-000000000137') THEN
    RAISE EXCEPTION 'Falha de etapa não reverteu a atividade';
  END IF;
  -- Same failure after the contact was created: no contact, link, activity or task survives.
  rejected := false;
  BEGIN
    PERFORM public.record_assisted_whatsapp(
      '00000000-0000-4000-8000-000000000140', 'initial_sent',
      'Não gravar contato', '00000000-0000-4000-8000-000000000167', NULL, '+5521977776666');
  EXCEPTION WHEN OTHERS THEN rejected := true;
  END;
  IF NOT rejected
     OR EXISTS (SELECT 1 FROM public.contacts WHERE phone = '+5521977776666')
     OR (SELECT contact_id FROM public.deals WHERE id = '00000000-0000-4000-8000-000000000140') IS NOT NULL
     OR EXISTS (SELECT 1 FROM public.activities WHERE deal_id = '00000000-0000-4000-8000-000000000140') THEN
    RAISE EXCEPTION 'Falha no meio deixou contato, vínculo ou atividade';
  END IF;
END $assert$;
ROLLBACK;
SELECT 'whatsapp_assisted_staging_passed' AS result;
