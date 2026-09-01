import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAdminDb } from "@/lib/supabase/admin";
import {
  isPlatformStaff,
  type PlatformStaff,
} from "@/lib/platform-access";

export async function requirePlatformStaff(): Promise<PlatformStaff | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return null;
  }

  const { data, error } = await getAdminDb()
    .from("User")
    .select("id, name, email, isSuperAdmin, isSupport, isSales, isSalesManager")
    .eq("email", session.user.email)
    .maybeSingle();

  if (error || !data || !isPlatformStaff(data)) {
    return null;
  }

  return {
    id: String(data.id),
    name: (data.name as string | null) ?? null,
    email: String(data.email),
    isSuperAdmin: Boolean(data.isSuperAdmin),
    isSupport: Boolean(data.isSupport),
    isSales: Boolean(data.isSales),
    isSalesManager: Boolean(data.isSalesManager),
  };
}
