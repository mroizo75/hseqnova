import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAdminDb } from "@/lib/supabase/admin";
import type { Role } from "@prisma/client";

export type MembershipRow = {
  tenantId: string;
  role: Role;
};

export async function resolveTenantId(
  userId: string,
  sessionTenantId?: string | null,
): Promise<string | null> {
  const db = getAdminDb();
  if (sessionTenantId) {
    const { data } = await db
      .from("UserTenant")
      .select("tenantId")
      .eq("userId", userId)
      .eq("tenantId", sessionTenantId)
      .maybeSingle();
    if (data?.tenantId) {
      return data.tenantId as string;
    }
  }

  const { data } = await db
    .from("UserTenant")
    .select("tenantId")
    .eq("userId", userId)
    .limit(1)
    .maybeSingle();

  return (data?.tenantId as string | undefined) ?? null;
}

export async function getMemberships(userId: string): Promise<MembershipRow[]> {
  const { data, error } = await getAdminDb()
    .from("UserTenant")
    .select("tenantId, role")
    .eq("userId", userId);

  if (error) {
    throw { code: "MEMBERSHIP_LOOKUP_FAILED", message: error.message };
  }

  return (data ?? []) as MembershipRow[];
}

export async function getAppUser(opts: { id?: string; email?: string }) {
  const db = getAdminDb();
  let query = db
    .from("User")
    .select("id, email, name, image, isSuperAdmin, isSupport, isSales, isSalesManager, lastTenantId");

  if (opts.id) {
    query = query.eq("id", opts.id);
  } else if (opts.email) {
    query = query.eq("email", opts.email);
  } else {
    return null;
  }

  const { data, error } = await query.maybeSingle();
  if (error) {
    throw { code: "USER_LOOKUP_FAILED", message: error.message };
  }
  return data as {
    id: string;
    email: string;
    name: string | null;
    image: string | null;
    isSuperAdmin: boolean;
    isSupport: boolean;
    isSales: boolean;
    isSalesManager: boolean;
    lastTenantId: string | null;
  } | null;
}

export async function getSessionAppUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email && !session?.user?.id) {
    return null;
  }

  const user = session.user.id
    ? await getAppUser({ id: session.user.id })
    : await getAppUser({ email: session.user.email! });

  if (!user) {
    return null;
  }

  return {
    session,
    user,
    tenantId: await resolveTenantId(user.id, session.user.tenantId),
  };
}
