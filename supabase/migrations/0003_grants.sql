-- Privileges for HSEQ Nova
-- Apply in the Supabase SQL editor. Tables were created without GRANTs,
-- so the service role (and therefore the app) cannot read or write yet.
-- Do not GRANT to anon until RLS covers every table.

GRANT USAGE ON SCHEMA public TO service_role;

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON FUNCTIONS TO service_role;

-- Auth trigger must set updatedAt (NOT NULL, no default) and keep User.id
-- aligned with auth.uid() so login can match either column.
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public."User" (id, email, "supabaseUserId", "preferredLocale", "updatedAt")
  VALUES (NEW.id::text, NEW.email, NEW.id::text, 'en-GB', NOW())
  ON CONFLICT ("email") DO UPDATE
    SET "supabaseUserId" = EXCLUDED."supabaseUserId",
        "updatedAt" = NOW()
  WHERE public."User"."supabaseUserId" IS NULL
     OR public."User"."supabaseUserId" = EXCLUDED."supabaseUserId";
  RETURN NEW;
END;
$$;
