-- ROLLBACK of 20260924150000_org_isolation_rls. DO NOT run unless reverting.
-- It RESTORES THE OPEN POLICIES production had on 2026-09-24 (any signed-in account reads
-- and writes every organization's data). Keep public signup disabled while it is live.
--
-- The policies below were generated from production's pg_policies before the migration.
-- The organization_id filled on orphan activities is kept (harmless).

BEGIN;

DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT tablename, policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename IN (
      'activities', 'boards', 'board_stages', 'contacts', 'crm_companies',
      'custom_field_definitions', 'deal_items', 'deals', 'leads', 'products', 'tags',
      'system_notifications', 'deal_notes', 'deal_files', 'ai_audio_notes', 'ai_conversations',
      'ai_decisions', 'ai_suggestion_interactions', 'user_consents', 'audit_logs',
      'security_alerts', 'lifecycle_stages', 'rate_limits', 'organizations', 'profiles')
  LOOP
    EXECUTE format('DROP POLICY %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

DROP TRIGGER IF EXISTS activities_set_org_id ON public.activities;
DROP TRIGGER IF EXISTS board_stages_set_org_id ON public.board_stages;
DROP TRIGGER IF EXISTS contacts_set_org_id ON public.contacts;
DROP TRIGGER IF EXISTS crm_companies_set_org_id ON public.crm_companies;
DROP TRIGGER IF EXISTS deal_items_set_org_id ON public.deal_items;
DROP FUNCTION IF EXISTS public.set_organization_id_from_profile();
DROP FUNCTION IF EXISTS public.current_user_org_id();

CREATE POLICY "Enable all access for authenticated users" ON public.activities AS PERMISSIVE FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all access for authenticated users" ON public.ai_audio_notes AS PERMISSIVE FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all access for authenticated users" ON public.ai_conversations AS PERMISSIVE FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all access for authenticated users" ON public.ai_decisions AS PERMISSIVE FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all access for authenticated users" ON public.ai_suggestion_interactions AS PERMISSIVE FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all access for authenticated users" ON public.audit_logs AS PERMISSIVE FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable delete access for authenticated users" ON public.board_stages AS PERMISSIVE FOR DELETE TO authenticated USING (true);
CREATE POLICY "Enable insert access for authenticated users" ON public.board_stages AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable read access for authenticated users" ON public.board_stages AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable update access for authenticated users" ON public.board_stages AS PERMISSIVE FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Enable delete access for authenticated users" ON public.boards AS PERMISSIVE FOR DELETE TO authenticated USING (true);
CREATE POLICY "Enable insert access for authenticated users" ON public.boards AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable read access for authenticated users" ON public.boards AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable update access for authenticated users" ON public.boards AS PERMISSIVE FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Enable all access for authenticated users" ON public.contacts AS PERMISSIVE FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all access for authenticated users" ON public.crm_companies AS PERMISSIVE FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all access for authenticated users" ON public.custom_field_definitions AS PERMISSIVE FOR ALL TO authenticated USING (true);
CREATE POLICY deal_files_access ON public.deal_files AS PERMISSIVE FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for authenticated users" ON public.deal_items AS PERMISSIVE FOR ALL TO authenticated USING (true);
CREATE POLICY deal_notes_access ON public.deal_notes AS PERMISSIVE FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for authenticated users" ON public.deals AS PERMISSIVE FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all access for authenticated users" ON public.leads AS PERMISSIVE FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all access for authenticated users" ON public.lifecycle_stages AS PERMISSIVE FOR ALL TO authenticated USING (true);
CREATE POLICY authenticated_access ON public.organizations AS PERMISSIVE FOR ALL TO authenticated USING ((deleted_at IS NULL)) WITH CHECK (true);
CREATE POLICY "Enable all access for authenticated users" ON public.products AS PERMISSIVE FOR ALL TO authenticated USING (true);
CREATE POLICY profiles_select ON public.profiles AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY profiles_update ON public.profiles AS PERMISSIVE FOR UPDATE TO authenticated USING ((id = auth.uid())) WITH CHECK ((id = auth.uid()));
CREATE POLICY "Enable all access for authenticated users" ON public.rate_limits AS PERMISSIVE FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all access for authenticated users" ON public.security_alerts AS PERMISSIVE FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all access for authenticated users" ON public.system_notifications AS PERMISSIVE FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all access for authenticated users" ON public.tags AS PERMISSIVE FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all access for authenticated users" ON public.user_consents AS PERMISSIVE FOR ALL TO authenticated USING (true);

DO $check$
BEGIN
  IF (SELECT count(*) FROM pg_policies WHERE schemaname = 'public' AND tablename IN (
        'activities', 'boards', 'board_stages', 'contacts', 'crm_companies',
        'custom_field_definitions', 'deal_items', 'deals', 'leads', 'products', 'tags',
        'system_notifications', 'deal_notes', 'deal_files', 'ai_audio_notes', 'ai_conversations',
        'ai_decisions', 'ai_suggestion_interactions', 'user_consents', 'audit_logs',
        'security_alerts', 'lifecycle_stages', 'rate_limits', 'organizations', 'profiles')) <> 32 THEN
    RAISE EXCEPTION 'rollback: número de policies difere do capturado (32)';
  END IF;
END $check$;

COMMIT;
