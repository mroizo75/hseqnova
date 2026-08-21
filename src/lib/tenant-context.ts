import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth";
import { getAdminDb } from "@/lib/supabase/admin";

export type TenantContext = {
  userId: string;
  email: string;
  tenantId: string;
};

export const getRequiredTenantContext = async (): Promise<TenantContext> => {
  const session = await getServerSession(authOptions);
  const sessionUserId = session?.user?.id?.trim() ?? "";
  const sessionEmail = session?.user?.email?.trim() ?? "";
  const sessionTenantId = session?.user?.tenantId?.trim() ?? "";

  if (!sessionUserId || !sessionEmail || !sessionTenantId) {
    throw new Error("Unauthorized");
  }

  const { data: membership, error } = await getAdminDb()
    .from("UserTenant")
    .select("userId, tenantId")
    .eq("userId", sessionUserId)
    .eq("tenantId", sessionTenantId)
    .maybeSingle();

  if (error) {
    throw { code: "TENANT_LOOKUP_FAILED", message: error.message };
  }

  if (!membership) {
    throw new Error("User not associated with selected tenant");
  }

  return {
    userId: membership.userId as string,
    email: sessionEmail,
    tenantId: membership.tenantId as string,
  };
};
