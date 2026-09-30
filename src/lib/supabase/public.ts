import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let publicDb: SupabaseClient | undefined;

/**
 * Anonymous client without user cookies. RLS applies, so it can only read public rows.
 * Safe in sitemap, RSS and other routes that run outside a user session.
 */
export function getPublicDb(): SupabaseClient {
  if (publicDb) {
    return publicDb;
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) {
    throw {
      code: "SUPABASE_NOT_CONFIGURED",
      message: "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set",
    };
  }
  publicDb = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return publicDb;
}
