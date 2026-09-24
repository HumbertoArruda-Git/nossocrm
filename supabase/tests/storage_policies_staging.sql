-- STAGING ONLY. Everything is rolled back; the last SELECT returns a report.
-- Checks 20260924190000: storage policies (deal-files, avatars) and trigger search_path.
-- Each line reads "<caso> -> <resultado> (esperado: <x>)"; all should match.
BEGIN;
SELECT set_config('st.report', '', true);

INSERT INTO public.organizations (id, name) VALUES
  ('00000000-0000-4000-8000-00000000c0a0', 'Org A (teste)'),
  ('00000000-0000-4000-8000-00000000c0b0', 'Org B (teste)');
INSERT INTO auth.users (id, email, raw_user_meta_data, raw_app_meta_data) VALUES
  ('00000000-0000-4000-8000-00000000c0a1', 'st-a@example.test', '{}',
   '{"organization_id":"00000000-0000-4000-8000-00000000c0a0"}'),
  ('00000000-0000-4000-8000-00000000c0b1', 'st-b@example.test', '{}',
   '{"organization_id":"00000000-0000-4000-8000-00000000c0b0"}');
INSERT INTO public.boards (id, organization_id, name) VALUES
  ('00000000-0000-4000-8000-00000000c1a0', '00000000-0000-4000-8000-00000000c0a0', 'Board A'),
  ('00000000-0000-4000-8000-00000000c1b0', '00000000-0000-4000-8000-00000000c0b0', 'Board B');
INSERT INTO public.board_stages (id, organization_id, board_id, name, "order") VALUES
  ('00000000-0000-4000-8000-00000000c2a0', '00000000-0000-4000-8000-00000000c0a0', '00000000-0000-4000-8000-00000000c1a0', 'Etapa A', 0),
  ('00000000-0000-4000-8000-00000000c2b0', '00000000-0000-4000-8000-00000000c0b0', '00000000-0000-4000-8000-00000000c1b0', 'Etapa B', 0);
INSERT INTO public.deals (id, organization_id, board_id, stage_id, title) VALUES
  ('00000000-0000-4000-8000-00000000c4a0', '00000000-0000-4000-8000-00000000c0a0', '00000000-0000-4000-8000-00000000c1a0', '00000000-0000-4000-8000-00000000c2a0', 'Deal A'),
  ('00000000-0000-4000-8000-00000000c4b0', '00000000-0000-4000-8000-00000000c0b0', '00000000-0000-4000-8000-00000000c1b0', '00000000-0000-4000-8000-00000000c2b0', 'Deal B');
INSERT INTO storage.objects (bucket_id, name) VALUES
  ('deal-files', '00000000-0000-4000-8000-00000000c4b0/arquivo-b.pdf'),
  ('avatars', 'avatars/00000000-0000-4000-8000-00000000c0b1.png');

SELECT set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-00000000c0a1', true);
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-00000000c0a1","role":"authenticated"}', true);
SET LOCAL ROLE authenticated;
DO $$
DECLARE
  cases text[][] := ARRAY[
    ['envia arquivo em deal próprio', 'INSERT INTO storage.objects (bucket_id, name) VALUES (''deal-files'', ''00000000-0000-4000-8000-00000000c4a0/a.pdf'')', 'dml', 'rows=1'],
    ['lê arquivo de deal próprio', 'SELECT count(*) FROM storage.objects WHERE bucket_id = ''deal-files'' AND name LIKE ''00000000-0000-4000-8000-00000000c4a0/%''', 'count', '1'],
    ['envia arquivo em deal da org B', 'INSERT INTO storage.objects (bucket_id, name) VALUES (''deal-files'', ''00000000-0000-4000-8000-00000000c4b0/x.pdf'')', 'dml', 'NEGADO'],
    ['lê arquivo de deal da org B', 'SELECT count(*) FROM storage.objects WHERE bucket_id = ''deal-files'' AND name LIKE ''00000000-0000-4000-8000-00000000c4b0/%''', 'count', '0'],
    ['envia arquivo fora de pasta de deal', 'INSERT INTO storage.objects (bucket_id, name) VALUES (''deal-files'', ''solto.pdf'')', 'dml', 'NEGADO'],
    ['envia o próprio avatar', 'INSERT INTO storage.objects (bucket_id, name) VALUES (''avatars'', ''avatars/00000000-0000-4000-8000-00000000c0a1.png'')', 'dml', 'rows=1'],
    ['troca o próprio avatar', 'UPDATE storage.objects SET metadata = ''{}'' WHERE bucket_id = ''avatars'' AND name = ''avatars/00000000-0000-4000-8000-00000000c0a1.png''', 'dml', 'rows=1'],
    ['envia avatar em nome de B', 'INSERT INTO storage.objects (bucket_id, name) VALUES (''avatars'', ''avatars/00000000-0000-4000-8000-00000000c0b1.jpg'')', 'dml', 'NEGADO'],
    ['altera avatar de B', 'UPDATE storage.objects SET metadata = ''{}'' WHERE bucket_id = ''avatars'' AND name = ''avatars/00000000-0000-4000-8000-00000000c0b1.png''', 'dml', 'rows=0'],
    ['lê avatar de B (bucket público)', 'SELECT count(*) FROM storage.objects WHERE bucket_id = ''avatars'' AND name = ''avatars/00000000-0000-4000-8000-00000000c0b1.png''', 'count', '1']
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
    PERFORM set_config('st.report', current_setting('st.report')
      || cases[i][1] || ' -> ' || r || ' (esperado: ' || cases[i][4] || ')' || E'\n', true);
  END LOOP;
END $$;
RESET ROLE;

-- Trigger functions: pinned search_path and still working.
SELECT set_config('st.report', current_setting('st.report')
  || 'funções de gatilho sem search_path -> ' || (
     SELECT count(*) FROM pg_proc p JOIN pg_namespace ns ON ns.oid = p.pronamespace
     WHERE ns.nspname = 'public' AND p.proname IN ('update_updated_at_column', 'cascade_soft_delete_deals', 'cascade_soft_delete_activities_by_contact')
       AND NOT EXISTS (SELECT 1 FROM unnest(coalesce(p.proconfig, '{}')) c WHERE c LIKE 'search_path=%'))
  || ' (esperado: 0)' || E'\n', true);
UPDATE public.boards SET deleted_at = now() WHERE id = '00000000-0000-4000-8000-00000000c1a0';
SELECT set_config('st.report', current_setting('st.report')
  || 'apagar board apaga seus deals -> ' || (SELECT (deleted_at IS NOT NULL)::text FROM public.deals WHERE id = '00000000-0000-4000-8000-00000000c4a0')
  || ' (esperado: true)' || E'\n', true);

SELECT current_setting('st.report') AS report,
  (SELECT count(*) FROM regexp_matches(current_setting('st.report'), '-> ([^\n]*) \(esperado: \1\)', 'g')) AS matches,
  (SELECT count(*) FROM regexp_matches(current_setting('st.report'), E'\n', 'g')) AS total;
ROLLBACK;
