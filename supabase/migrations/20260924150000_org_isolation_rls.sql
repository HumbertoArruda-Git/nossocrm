-- F-02 (security audit 2026-09-23): tenant isolation in the database.
--
-- Production still ran the original "Enable all access for authenticated users" policies
-- (USING (true)): any signed-in account could read and write every organization's data
-- through the Data API, regardless of the app's own organization_id filters. Staging had
-- org-isolation policies applied outside migrations, plus a trigger that fills
-- organization_id on inserts; production had neither.
--
-- This migration brings both environments to the same, versioned state:
--   * org-owned tables: rows of the caller's organization only (read and write);
--   * deal_notes / deal_files: through the parent deal's organization;
--   * per-user AI tables and consents: the caller's own rows only;
--   * profiles: same organization only (was: everyone); organizations: own org, read-only
--     from the client (was: anyone could update any organization);
--   * audit_logs / security_alerts: read own org; audit rows inserted only as oneself;
--   * lifecycle_stages (global catalog): everyone reads, only admins write;
--   * rate_limits: no client access (only SECURITY DEFINER functions use it).
-- The organization-filling trigger is recreated hardened (SECURITY INVOKER, fixed
-- search_path) and orphan activities get their organization back first.
-- service_role and SECURITY DEFINER functions bypass RLS and are unaffected.
-- Idempotent.

-- 1. Caller's organization, readable inside policies without recursing into profiles RLS.
CREATE OR REPLACE FUNCTION public.current_user_org_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT p.organization_id FROM public.profiles AS p WHERE p.id = auth.uid();
$$;
REVOKE ALL ON FUNCTION public.current_user_org_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_user_org_id() TO authenticated, service_role;

-- 2. Fill organization_id on client inserts (the app relies on it for these tables).
CREATE OR REPLACE FUNCTION public.set_organization_id_from_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  IF NEW.organization_id IS NULL THEN
    NEW.organization_id := public.current_user_org_id();
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.set_organization_id_from_profile() FROM PUBLIC, anon, authenticated;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['activities', 'board_stages', 'contacts', 'crm_companies', 'deal_items'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', t || '_set_org_id', t);
    EXECUTE format('CREATE TRIGGER %I BEFORE INSERT ON public.%I FOR EACH ROW
                    EXECUTE FUNCTION public.set_organization_id_from_profile()', t || '_set_org_id', t);
  END LOOP;
END $$;

-- 3. Orphan activities would disappear under isolation: take the deal's or contact's
--    organization, or the only organization when there is exactly one.
UPDATE public.activities AS a
SET organization_id = COALESCE(
  (SELECT d.organization_id FROM public.deals AS d WHERE d.id = a.deal_id),
  (SELECT c.organization_id FROM public.contacts AS c WHERE c.id = a.contact_id),
  (SELECT CASE WHEN count(*) = 1 THEN (array_agg(o.id))[1] END FROM public.organizations AS o))
WHERE a.organization_id IS NULL;

-- 4. Drop every previous policy on the affected tables (production and staging names).
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

-- 5. Org-owned tables.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'activities', 'boards', 'board_stages', 'contacts', 'crm_companies',
    'custom_field_definitions', 'deal_items', 'deals', 'leads', 'products', 'tags',
    'system_notifications'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL TO authenticated
                    USING (organization_id = public.current_user_org_id())
                    WITH CHECK (organization_id = public.current_user_org_id())', t || '_org_isolate', t);
  END LOOP;
END $$;

-- 6. Children of deals.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['deal_notes', 'deal_files'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY %1$I ON public.%2$I FOR ALL TO authenticated
                    USING (EXISTS (SELECT 1 FROM public.deals AS d
                                   WHERE d.id = %2$I.deal_id AND d.organization_id = public.current_user_org_id()))
                    WITH CHECK (EXISTS (SELECT 1 FROM public.deals AS d
                                   WHERE d.id = %2$I.deal_id AND d.organization_id = public.current_user_org_id()))',
                   t || '_org_isolate', t);
  END LOOP;
END $$;

-- 7. Per-user tables.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['ai_audio_notes', 'ai_conversations', 'ai_decisions',
                           'ai_suggestion_interactions', 'user_consents'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL TO authenticated
                    USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())', t || '_user_isolate', t);
  END LOOP;
END $$;

-- 8. Audit and security records.
CREATE POLICY audit_logs_select ON public.audit_logs FOR SELECT TO authenticated
  USING (organization_id = public.current_user_org_id() OR user_id = auth.uid());
CREATE POLICY audit_logs_insert_self ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid()
              AND (organization_id IS NULL OR organization_id = public.current_user_org_id()));
CREATE POLICY security_alerts_select ON public.security_alerts FOR SELECT TO authenticated
  USING (organization_id = public.current_user_org_id());

-- 9. Global lifecycle catalog: read for everyone signed in, write for admins.
CREATE POLICY lifecycle_stages_select ON public.lifecycle_stages FOR SELECT TO authenticated
  USING (true);
CREATE POLICY lifecycle_stages_admin_write ON public.lifecycle_stages FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles AS p WHERE p.id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles AS p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- 10. rate_limits: RLS on, no policy -> no client access (consume_rate_limit is SECURITY DEFINER).
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- 11. Organizations: read own; writes only through the service role (setup, installer).
CREATE POLICY organizations_select_own ON public.organizations FOR SELECT TO authenticated
  USING (id = public.current_user_org_id() AND deleted_at IS NULL);

-- 12. Profiles: same organization (members list), always oneself; update stays self-only.
CREATE POLICY profiles_select_same_org ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR organization_id = public.current_user_org_id());
CREATE POLICY profiles_update ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());
