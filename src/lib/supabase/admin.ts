import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function requireSupabaseEnv(): { url: string; serviceRole: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceRole) {
    throw {
      code: "SUPABASE_NOT_CONFIGURED",
      message: "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set. Do not use a Postgres DATABASE_URL against Supabase.",
    };
  }
  return { url, serviceRole };
}

/** Server-side database client. Bypasses RLS. Never use in the browser. */
export function createAdminDb(): SupabaseClient {
  const { url, serviceRole } = requireSupabaseEnv();
  return createClient(url, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

let adminDb: SupabaseClient | undefined;

export function getAdminDb(): SupabaseClient {
  if (!adminDb) {
    adminDb = createAdminDb();
  }
  return adminDb;
}
