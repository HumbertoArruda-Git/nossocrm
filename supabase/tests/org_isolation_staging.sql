-- STAGING ONLY. Everything is rolled back; the last SELECT returns a report.
-- Checks 20260924150000 (tenant isolation): user A (org A) against org B's data.
-- Each line reads "<caso> -> <resultado> (esperado: <x>)"; all should match.
BEGIN;
SELECT set_config('iso.report', '', true);

INSERT INTO public.organizations (id, name) VALUES
  ('00000000-0000-4000-8000-00000000b0a0', 'Org A (teste)'),
  ('00000000-0000-4000-8000-00000000b0b0', 'Org B (teste)');
INSERT INTO auth.users (id, email, raw_user_meta_data, raw_app_meta_data) VALUES
  ('00000000-0000-4000-8000-00000000b0a1', 'iso-a@example.test', '{}',
   '{"organization_id":"00000000-0000-4000-8000-00000000b0a0"}'),
  ('00000000-0000-4000-8000-00000000b0b1', 'iso-b@example.test', '{}',
   '{"organization_id":"00000000-0000-4000-8000-00000000b0b0"}');
INSERT INTO public.boards (id, organization_id, name) VALUES
  ('00000000-0000-4000-8000-00000000b1a0', '00000000-0000-4000-8000-00000000b0a0', 'Board A'),
  ('00000000-0000-4000-8000-00000000b1b0', '00000000-0000-4000-8000-00000000b0b0', 'Board B');
INSERT INTO public.board_stages (id, organization_id, board_id, name, "order") VALUES
  ('00000000-0000-4000-8000-00000000b2a0', '00000000-0000-4000-8000-00000000b0a0', '00000000-0000-4000-8000-00000000b1a0', 'Etapa A', 0),
  ('00000000-0000-4000-8000-00000000b2b0', '00000000-0000-4000-8000-00000000b0b0', '00000000-0000-4000-8000-00000000b1b0', 'Etapa B', 0);
INSERT INTO public.contacts (id, organization_id, name) VALUES
  ('00000000-0000-4000-8000-00000000b3a0', '00000000-0000-4000-8000-00000000b0a0', 'Contato A'),
  ('00000000-0000-4000-8000-00000000b3b0', '00000000-0000-4000-8000-00000000b0b0', 'Contato B');
INSERT INTO public.deals (id, organization_id, board_id, stage_id, contact_id, title) VALUES
  ('00000000-0000-4000-8000-00000000b4a0', '00000000-0000-4000-8000-00000000b0a0', '00000000-0000-4000-8000-00000000b1a0', '00000000-0000-4000-8000-00000000b2a0', '00000000-0000-4000-8000-00000000b3a0', 'Deal A'),
  ('00000000-0000-4000-8000-00000000b4b0', '00000000-0000-4000-8000-00000000b0b0', '00000000-0000-4000-8000-00000000b1b0', '00000000-0000-4000-8000-00000000b2b0', '00000000-0000-4000-8000-00000000b3b0', 'Deal B');
INSERT INTO public.activities (id, organization_id, deal_id, type, title, date) VALUES
  ('00000000-0000-4000-8000-00000000b5b0', '00000000-0000-4000-8000-00000000b0b0', '00000000-0000-4000-8000-00000000b4b0', 'NOTE', 'Atividade B', now());
INSERT INTO public.deal_notes (id, deal_id, content) VALUES
  ('00000000-0000-4000-8000-00000000b6b0', '00000000-0000-4000-8000-00000000b4b0', 'Nota B');

SELECT set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-00000000b0a1', true);
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-00000000b0a1","role":"authenticated"}', true);
SET LOCAL ROLE authenticated;
DO $$
DECLARE
  -- label | sql | kind (count|dml|scalar) | expected
  cases text[][] := ARRAY[
    ['lê deals da própria org', 'SELECT count(*) FROM public.deals WHERE organization_id = ''00000000-0000-4000-8000-00000000b0a0''', 'count', '1'],
    ['lê deals da org B', 'SELECT count(*) FROM public.deals WHERE organization_id = ''00000000-0000-4000-8000-00000000b0b0''', 'count', '0'],
    ['lê contatos da org B', 'SELECT count(*) FROM public.contacts WHERE organization_id = ''00000000-0000-4000-8000-00000000b0b0''', 'count', '0'],
    ['lê atividades da org B', 'SELECT count(*) FROM public.activities WHERE id = ''00000000-0000-4000-8000-00000000b5b0''', 'count', '0'],
    ['lê nota de deal da org B', 'SELECT count(*) FROM public.deal_notes WHERE id = ''00000000-0000-4000-8000-00000000b6b0''', 'count', '0'],
    ['lê perfil do usuário B', 'SELECT count(*) FROM public.profiles WHERE id = ''00000000-0000-4000-8000-00000000b0b1''', 'count', '0'],
    ['lê o próprio perfil', 'SELECT count(*) FROM public.profiles WHERE id = auth.uid()', 'count', '1'],
    ['organizações visíveis', 'SELECT count(*) FROM public.organizations', 'count', '1'],
    ['cria deal na org B', 'INSERT INTO public.deals (organization_id, board_id, stage_id, title) VALUES (''00000000-0000-4000-8000-00000000b0b0'', ''00000000-0000-4000-8000-00000000b1b0'', ''00000000-0000-4000-8000-00000000b2b0'', ''x'')', 'dml', 'NEGADO'],
    ['cria contato sem informar org (gatilho preenche)', 'INSERT INTO public.contacts (name) VALUES (''Novo A'')', 'dml', 'rows=1'],
    ['contato novo ficou na org A', 'SELECT count(*) FROM public.contacts WHERE name = ''Novo A'' AND organization_id = ''00000000-0000-4000-8000-00000000b0a0''', 'count', '1'],
    ['altera deal da org B', 'UPDATE public.deals SET title = ''invadido'' WHERE id = ''00000000-0000-4000-8000-00000000b4b0''', 'dml', 'rows=0'],
    ['move o próprio deal para a org B', 'UPDATE public.deals SET organization_id = ''00000000-0000-4000-8000-00000000b0b0'' WHERE id = ''00000000-0000-4000-8000-00000000b4a0''', 'dml', 'NEGADO'],
    ['altera o próprio deal', 'UPDATE public.deals SET title = ''Deal A2'' WHERE id = ''00000000-0000-4000-8000-00000000b4a0''', 'dml', 'rows=1'],
    ['apaga deal da org B', 'DELETE FROM public.deals WHERE id = ''00000000-0000-4000-8000-00000000b4b0''', 'dml', 'rows=0'],
    ['cria nota em deal da org B', 'INSERT INTO public.deal_notes (deal_id, content) VALUES (''00000000-0000-4000-8000-00000000b4b0'', ''x'')', 'dml', 'NEGADO'],
    ['altera a organização B', 'UPDATE public.organizations SET name = ''x'' WHERE id = ''00000000-0000-4000-8000-00000000b0b0''', 'dml', 'rows=0'],
    ['altera a própria organização pelo navegador', 'UPDATE public.organizations SET name = ''x'' WHERE id = ''00000000-0000-4000-8000-00000000b0a0''', 'dml', 'rows=0'],
    ['cria organização pelo navegador', 'INSERT INTO public.organizations (name) VALUES (''x'')', 'dml', 'NEGADO'],
    ['lê estágios do ciclo de vida', 'SELECT (count(*) > 0)::int FROM public.lifecycle_stages', 'count', '1'],
    ['usuário comum altera ciclo de vida', 'UPDATE public.lifecycle_stages SET name = name', 'dml', 'rows=0'],
    ['lê rate_limits', 'SELECT count(*) FROM public.rate_limits', 'count', '0'],
    ['grava auditoria em nome de B', 'INSERT INTO public.audit_logs (user_id, action, resource_type, severity) VALUES (''00000000-0000-4000-8000-00000000b0b1'', ''x'', ''x'', ''info'')', 'dml', 'NEGADO'],
    ['grava auditoria em nome próprio', 'INSERT INTO public.audit_logs (user_id, action, resource_type, severity) VALUES (auth.uid(), ''x'', ''x'', ''info'')', 'dml', 'rows=1']
  ];
  i int; n bigint; r text;
BEGIN
  FOR i IN 1..array_length(cases, 1) LOOP
    BEGIN
      IF cases[i][3] = 'count' THEN
        EXECUTE cases[i][2] INTO n; r := n::text;
      ELSE
        EXECUTE cases[i][2]; GET DIAGNOSTICS n = ROW_COUNT; r := 'rows=' || n;
      END IF;
    EXCEPTION
      WHEN insufficient_privilege THEN r := 'NEGADO';
      WHEN OTHERS THEN r := 'ERRO ' || SQLSTATE || ' ' || left(SQLERRM, 80);
    END;
    PERFORM set_config('iso.report', current_setting('iso.report')
      || cases[i][1] || ' -> ' || r || ' (esperado: ' || cases[i][4] || ')' || E'\n', true);
  END LOOP;
END $$;
RESET ROLE;

SELECT current_setting('iso.report') AS report,
  (SELECT count(*) FROM regexp_matches(current_setting('iso.report'), '-> ([^\n]*) \(esperado: \1\)', 'g')) AS matches,
  (SELECT count(*) FROM regexp_matches(current_setting('iso.report'), E'\n', 'g')) AS total;
ROLLBACK;
