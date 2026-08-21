/**
 * Database access for HSEQ Nova.
 *
 * Supabase is reached only via NEXT_PUBLIC_SUPABASE_URL + anon / service role.
 * Never add DATABASE_URL or DIRECT_URL against Supabase.
 */
import { PrismaClient } from "@prisma/client";
import { getAdminDb } from "@/lib/supabase/admin";

export { getAdminDb, createAdminDb } from "@/lib/supabase/admin";

/**
 * @deprecated Prisma is not connected to Supabase. Use getAdminDb()
 * (service role) or createClient() from @/lib/supabase/server (anon + RLS).
 */
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    if (prop === "then" || prop === "$$typeof") {
      return undefined;
    }
    throw {
      code: "PRISMA_DISABLED",
      message: `prisma.${String(prop)} is disabled. Query Supabase with getAdminDb() using the service role key.`,
    };
  },
}) as PrismaClient;

export const db = prisma;
