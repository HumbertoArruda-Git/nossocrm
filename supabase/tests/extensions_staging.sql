-- STAGING ONLY. Everything is rolled back; the last SELECT returns a report.
-- Checks 20260924210000 (F-14): unaccent out of public, deal webhooks (pg_net) still fire.
-- pg_net itself is not reachable from the Data API (net schema not exposed); that is checked
-- over HTTP, not here. Each line reads "<caso> -> <resultado> (esperado: <x>)".
BEGIN;
SELECT set_config('ext.report', '', true);

INSERT INTO public.organizations (id, name) VALUES ('00000000-0000-4000-8000-00000000d0a0', 'Org A (teste)');
INSERT INTO auth.users (id, email, raw_user_meta_data, raw_app_meta_data) VALUES
  ('00000000-0000-4000-8000-00000000d0a1', 'ext-a@example.test', '{}',
   '{"organization_id":"00000000-0000-4000-8000-00000000d0a0"}');
INSERT INTO public.boards (id, organization_id, name) VALUES
  ('00000000-0000-4000-8000-00000000d1a0', '00000000-0000-4000-8000-00000000d0a0', 'Board A');
INSERT INTO public.board_stages (id, organization_id, board_id, name, label, "order") VALUES
  ('00000000-0000-4000-8000-00000000d2a0', '00000000-0000-4000-8000-00000000d0a0', '00000000-0000-4000-8000-00000000d1a0', 'Etapa 1', 'Etapa 1', 0),
  ('00000000-0000-4000-8000-00000000d2a1', '00000000-0000-4000-8000-00000000d0a0', '00000000-0000-4000-8000-00000000d1a0', 'Etapa 2', 'Etapa 2', 1);
INSERT INTO public.deals (id, organization_id, board_id, stage_id, title) VALUES
  ('00000000-0000-4000-8000-00000000d4a0', '00000000-0000-4000-8000-00000000d0a0', '00000000-0000-4000-8000-00000000d1a0', '00000000-0000-4000-8000-00000000d2a0', 'Deal A');
INSERT INTO public.integration_outbound_endpoints (organization_id, name, url, secret, events, active) VALUES
  ('00000000-0000-4000-8000-00000000d0a0', 'teste', 'http://127.0.0.1:9/webhook', 'segredo-teste', ARRAY['deal.stage_changed'], true);

-- authenticated: moving a deal fires the webhook trigger.
SELECT set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-00000000d0a1', true);
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-00000000d0a1","role":"authenticated"}', true);
SET LOCAL ROLE authenticated;
DO $$
DECLARE r text; n bigint;
BEGIN
  BEGIN
    UPDATE public.deals SET stage_id = '00000000-0000-4000-8000-00000000d2a1' WHERE id = '00000000-0000-4000-8000-00000000d4a0';
    GET DIAGNOSTICS n = ROW_COUNT; r := 'rows=' || n;
  EXCEPTION WHEN OTHERS THEN r := 'ERRO ' || SQLSTATE || ' ' || left(SQLERRM, 60); END;
  PERFORM set_config('ext.report', current_setting('ext.report') || 'logado move deal de etapa -> ' || r || ' (esperado: rows=1)' || E'\n', true);
END $$;
RESET ROLE;

SELECT set_config('ext.report', current_setting('ext.report')
  || 'webhook enfileirado pelo gatilho -> ' || (
     SELECT coalesce(string_agg(status || CASE WHEN request_id IS NOT NULL THEN '+request' ELSE '' END, ','), 'nenhum')
     FROM public.webhook_deliveries WHERE organization_id = '00000000-0000-4000-8000-00000000d0a0')
  || ' (esperado: queued+request)' || E'\n', true);
SELECT set_config('ext.report', current_setting('ext.report')
  || 'unaccent fora de public -> ' || (
     SELECT (extnamespace <> 'public'::regnamespace)::text FROM pg_extension WHERE extname = 'unaccent')
  || ' (esperado: true)' || E'\n', true);

SELECT current_setting('ext.report') AS report,
  (SELECT count(*) FROM regexp_matches(current_setting('ext.report'), '-> ([^\n]*) \(esperado: \1\)', 'g')) AS matches,
  (SELECT count(*) FROM regexp_matches(current_setting('ext.report'), E'\n', 'g')) AS total;
ROLLBACK;
