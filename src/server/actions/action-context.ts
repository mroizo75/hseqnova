"use server";

import { getAdminDb } from "@/lib/supabase/admin";
import { getRequiredTenantContext } from "@/lib/tenant-context";
import type { Role } from "@prisma/client";

export async function getActionContext() {
  const tenantContext = await getRequiredTenantContext();
  const { data: membership, error } = await getAdminDb()
    .from("UserTenant")
    .select("role")
    .eq("userId", tenantContext.userId)
    .eq("tenantId", tenantContext.tenantId)
    .maybeSingle();

  if (error) {
    throw { code: "TENANT_LOOKUP_FAILED", message: error.message };
  }

  if (!membership) {
    throw new Error("User is not linked to the selected company");
  }

  return {
    user: { id: tenantContext.userId, email: tenantContext.email },
    tenantId: tenantContext.tenantId,
    role: membership.role as Role,
  };
}
