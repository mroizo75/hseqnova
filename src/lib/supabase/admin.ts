import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const ADMIN_FETCH_TIMEOUT_MS = 8_000;

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

async function adminFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const attempt = () =>
    fetch(input, {
      ...init,
      signal: AbortSignal.timeout(ADMIN_FETCH_TIMEOUT_MS),
    });

  try {
    return await attempt();
  } catch {
    return attempt();
  }
}

/** Server-side database client. Bypasses RLS. Never use in the browser. */
export function createAdminDb(): SupabaseClient {
  const { url, serviceRole } = requireSupabaseEnv();
  return createClient(url, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: adminFetch },
  });
}

let adminDb: SupabaseClient | undefined;

export function getAdminDb(): SupabaseClient {
  if (!adminDb) {
    adminDb = createAdminDb();
  }
  return adminDb;
}
