-- HSEQ Nova Row Level Security
-- Apply in Supabase SQL editor after 0001_init.sql.
-- Use SECURITY DEFINER helpers so policies never query User from inside User policies.

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public."User"
    WHERE "isSuperAdmin" = true
      AND (id::text = auth.uid()::text OR "supabaseUserId"::text = auth.uid()::text)
  );
$$;

CREATE OR REPLACE FUNCTION public.current_tenant_ids()
RETURNS SETOF TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ut."tenantId"
  FROM public."UserTenant" ut
  JOIN public."User" u ON u.id = ut."userId"
  WHERE u.id::text = auth.uid()::text OR u."supabaseUserId"::text = auth.uid()::text;
$$;

ALTER TABLE public."Tenant" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_member_select ON public."Tenant";
CREATE POLICY tenant_member_select ON public."Tenant"
  FOR SELECT
  USING (id IN (SELECT public.current_tenant_ids()) OR public.is_super_admin());

ALTER TABLE public."Incident" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS incident_tenant_all ON public."Incident";
CREATE POLICY incident_tenant_all ON public."Incident"
  FOR ALL
  USING ("tenantId" IN (SELECT public.current_tenant_ids()) OR public.is_super_admin())
  WITH CHECK ("tenantId" IN (SELECT public.current_tenant_ids()) OR public.is_super_admin());

ALTER TABLE public."TenantModule" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_module_select ON public."TenantModule";
CREATE POLICY tenant_module_select ON public."TenantModule"
  FOR SELECT
  USING ("tenantId" IN (SELECT public.current_tenant_ids()) OR public.is_super_admin());

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public."User" (id, email, "supabaseUserId", "preferredLocale")
  VALUES (gen_random_uuid()::text, NEW.email, NEW.id::text, 'en-GB')
  ON CONFLICT ("supabaseUserId") DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();
