-- STAGING ONLY. Everything is rolled back; the last SELECT returns a report.
-- Checks 20260923210000 (signup/profile role), 20260923210100 (definer RPC grants) and
-- 20260924120000 (profiles guard trigger, survives an accidental table-wide grant).
-- Expected after the migrations: every line marked "(esperado: ...)" matches its outcome.
BEGIN;
SELECT set_config('sec.report', '', true);
SELECT set_config('sec.org', (SELECT id::text FROM public.organizations WHERE deleted_at IS NULL ORDER BY created_at LIMIT 1), true);
SELECT set_config('sec.deal', (SELECT id::text FROM public.deals
  WHERE organization_id = current_setting('sec.org')::uuid AND deleted_at IS NULL LIMIT 1), true);

-- Self-signup asking for admin in user metadata, and a server-created admin (app metadata).
INSERT INTO auth.users (id, email, raw_user_meta_data, raw_app_meta_data)
VALUES
  ('00000000-0000-4000-8000-00000000a001', 'sec-selfsignup@example.test',
   '{"role":"admin","organization_id":"00000000-0000-4000-8000-00000000a0ff"}', '{}'),
  ('00000000-0000-4000-8000-00000000a002', 'sec-server-admin@example.test',
   '{}', '{"role":"admin"}');

DO $$
DECLARE r text;
BEGIN
  SELECT role || ' @ ' || CASE WHEN organization_id::text = current_setting('sec.org') THEN 'org única' ELSE organization_id::text END
    INTO r FROM public.profiles WHERE id = '00000000-0000-4000-8000-00000000a001';
  PERFORM set_config('sec.report', current_setting('sec.report')
    || 'signup pedindo admin nos metadados -> ' || coalesce(r, 'sem perfil') || ' (esperado: user @ org única)' || E'\n', true);
  SELECT role INTO r FROM public.profiles WHERE id = '00000000-0000-4000-8000-00000000a002';
  PERFORM set_config('sec.report', current_setting('sec.report')
    || 'admin definido pelo servidor (app_metadata) -> ' || coalesce(r, 'sem perfil') || ' (esperado: admin)' || E'\n', true);
END $$;

-- Signed-in self-signup user.
SELECT set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-00000000a001', true);
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-00000000a001","role":"authenticated"}', true);
SET LOCAL ROLE authenticated;
DO $$
DECLARE
  tests text[][] := ARRAY[
    ['UPDATE public.profiles SET role = ''admin'' WHERE id = auth.uid()', 'usuário muda o próprio role', 'NEGADO'],
    -- Same value: measures the column privilege, not the foreign key.
    ['UPDATE public.profiles SET organization_id = organization_id WHERE id = auth.uid()', 'usuário muda a própria organização', 'NEGADO'],
    ['UPDATE public.profiles SET first_name = ''Teste'', phone = ''+5511999990000'' WHERE id = auth.uid()', 'usuário edita dados pessoais', 'ok'],
    ['UPDATE public.profiles SET name = ''Outro'' WHERE id = auth.uid()', 'usuário edita coluna legada name', 'NEGADO'],
    ['SELECT public.get_contact_stage_counts()', 'logado: get_contact_stage_counts', 'ok'],
    ['SELECT public.log_audit_event(''SEC_TEST'', ''test'', NULL, ''{}''::jsonb, ''info'')', 'logado: log_audit_event', 'ok'],
    ['SELECT public.mark_deal_won(' || quote_literal(current_setting('sec.deal')) || '::uuid)', 'logado: mark_deal_won', 'NEGADO'],
    ['SELECT public.get_dashboard_stats()', 'logado: get_dashboard_stats', 'NEGADO'],
    ['SELECT public.cleanup_rate_limits(0)', 'logado: cleanup_rate_limits', 'NEGADO'],
    ['UPDATE public.deals SET updated_at = now() WHERE id = ' || quote_literal(current_setting('sec.deal')) || '::uuid', 'logado: UPDATE em deal dispara triggers sem EXECUTE', 'ok']
  ];
  i int;
BEGIN
  FOR i IN 1..array_length(tests, 1) LOOP
    BEGIN
      EXECUTE tests[i][1];
      PERFORM set_config('sec.report', current_setting('sec.report') || tests[i][2] || ' -> ok (esperado: ' || tests[i][3] || ')' || E'\n', true);
    EXCEPTION
      WHEN insufficient_privilege THEN
        PERFORM set_config('sec.report', current_setting('sec.report') || tests[i][2] || ' -> NEGADO (esperado: ' || tests[i][3] || ')' || E'\n', true);
      WHEN OTHERS THEN
        PERFORM set_config('sec.report', current_setting('sec.report') || tests[i][2] || ' -> ERRO ' || SQLSTATE || ' ' || SQLERRM || ' (esperado: ' || tests[i][3] || ')' || E'\n', true);
    END;
  END LOOP;
END $$;
RESET ROLE;

-- Accidental table-wide grant (rolled back with everything else): the guard trigger must
-- still refuse role/org changes.
GRANT UPDATE ON public.profiles TO authenticated;
SET LOCAL ROLE authenticated;
DO $$
DECLARE
  tests text[][] := ARRAY[
    ['UPDATE public.profiles SET role = ''admin'' WHERE id = auth.uid()', 'com GRANT acidental: usuário muda o próprio role', 'NEGADO'],
    ['UPDATE public.profiles SET organization_id = gen_random_uuid() WHERE id = auth.uid()', 'com GRANT acidental: usuário muda a própria organização', 'NEGADO'],
    ['UPDATE public.profiles SET nickname = ''Apelido'' WHERE id = auth.uid()', 'com GRANT acidental: usuário edita dados pessoais', 'ok']
  ];
  i int;
BEGIN
  FOR i IN 1..array_length(tests, 1) LOOP
    BEGIN
      EXECUTE tests[i][1];
      PERFORM set_config('sec.report', current_setting('sec.report') || tests[i][2] || ' -> ok (esperado: ' || tests[i][3] || ')' || E'\n', true);
    EXCEPTION
      WHEN insufficient_privilege THEN
        PERFORM set_config('sec.report', current_setting('sec.report') || tests[i][2] || ' -> NEGADO (esperado: ' || tests[i][3] || ')' || E'\n', true);
      WHEN OTHERS THEN
        PERFORM set_config('sec.report', current_setting('sec.report') || tests[i][2] || ' -> ERRO ' || SQLSTATE || ' ' || SQLERRM || ' (esperado: ' || tests[i][3] || ')' || E'\n', true);
    END;
  END LOOP;
END $$;
RESET ROLE;

-- Server-created admin: API key management still works.
SELECT set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-00000000a002', true);
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-00000000a002","role":"authenticated"}', true);
SET LOCAL ROLE authenticated;
DO $$
BEGIN
  PERFORM * FROM public.create_api_key('sec test');
  PERFORM set_config('sec.report', current_setting('sec.report') || 'admin: create_api_key -> ok (esperado: ok)' || E'\n', true);
EXCEPTION WHEN OTHERS THEN
  PERFORM set_config('sec.report', current_setting('sec.report') || 'admin: create_api_key -> ERRO ' || SQLSTATE || ' ' || SQLERRM || ' (esperado: ok)' || E'\n', true);
END $$;
RESET ROLE;

-- No session at all (public API key only).
SELECT set_config('request.jwt.claim.sub', '', true);
SELECT set_config('request.jwt.claims', '{"role":"anon"}', true);
SET LOCAL ROLE anon;
DO $$
DECLARE
  tests text[][] := ARRAY[
    ['SELECT public.mark_deal_won(' || quote_literal(current_setting('sec.deal')) || '::uuid)', 'anônimo: mark_deal_won', 'NEGADO'],
    ['SELECT public.mark_deal_lost(' || quote_literal(current_setting('sec.deal')) || '::uuid, ''x'')', 'anônimo: mark_deal_lost', 'NEGADO'],
    ['SELECT public.reopen_deal(' || quote_literal(current_setting('sec.deal')) || '::uuid)', 'anônimo: reopen_deal', 'NEGADO'],
    ['SELECT public.get_dashboard_stats()', 'anônimo: get_dashboard_stats', 'NEGADO'],
    ['SELECT public.get_contact_stage_counts()', 'anônimo: get_contact_stage_counts', 'NEGADO'],
    ['SELECT public.cleanup_rate_limits(0)', 'anônimo: cleanup_rate_limits', 'NEGADO'],
    ['SELECT public.log_audit_event(''SEC_TEST'', ''test'', NULL, ''{}''::jsonb, ''info'')', 'anônimo: log_audit_event', 'NEGADO'],
    ['SELECT public.get_singleton_organization_id()', 'anônimo: get_singleton_organization_id', 'NEGADO'],
    ['SELECT public._api_key_make_token()', 'anônimo: _api_key_make_token', 'NEGADO'],
    ['SELECT * FROM public.create_api_key(''x'')', 'anônimo: create_api_key', 'NEGADO'],
    ['SELECT public.is_instance_initialized()', 'anônimo: is_instance_initialized', 'ok'],
    ['SELECT * FROM public.validate_api_key(''ncrm_invalid'')', 'anônimo: validate_api_key', 'ok']
  ];
  i int;
BEGIN
  FOR i IN 1..array_length(tests, 1) LOOP
    BEGIN
      EXECUTE tests[i][1];
      PERFORM set_config('sec.report', current_setting('sec.report') || tests[i][2] || ' -> ok (esperado: ' || tests[i][3] || ')' || E'\n', true);
    EXCEPTION
      WHEN insufficient_privilege THEN
        PERFORM set_config('sec.report', current_setting('sec.report') || tests[i][2] || ' -> NEGADO (esperado: ' || tests[i][3] || ')' || E'\n', true);
      WHEN OTHERS THEN
        PERFORM set_config('sec.report', current_setting('sec.report') || tests[i][2] || ' -> ERRO ' || SQLSTATE || ' ' || SQLERRM || ' (esperado: ' || tests[i][3] || ')' || E'\n', true);
    END;
  END LOOP;
END $$;
RESET ROLE;

SELECT current_setting('sec.report') AS report,
  (SELECT count(*) FROM regexp_matches(current_setting('sec.report'),
     '-> (ok|NEGADO) \(esperado: \1\)', 'g')) AS matches,
  (SELECT count(*) FROM regexp_matches(current_setting('sec.report'), E'\n', 'g')) AS total;
ROLLBACK;
