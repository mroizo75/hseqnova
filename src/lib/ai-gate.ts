import { getAdminDb } from "@/lib/supabase/admin";

export class AiAddonNotEnabledError extends Error {
  constructor() {
    super("AI Pro add-on is not enabled for this organisation. Contact your administrator to subscribe.");
    this.name = "AiAddonNotEnabledError";
  }
}

type TenantAiRow = {
  aiAddonEnabled: boolean | null;
  aiMonthlyCallCount: number | null;
  aiMonthlyCallResetAt: string | null;
};

/**
 * Verify the tenant has the AI Pro add-on enabled.
 * Throws AiAddonNotEnabledError if not.
 * Also increments the monthly call counter.
 */
export async function requireAiAddon(tenantId: string): Promise<void> {
  const db = getAdminDb();
  const { data, error } = await db
    .from("Tenant")
    .select("aiAddonEnabled, aiMonthlyCallCount, aiMonthlyCallResetAt")
    .eq("id", tenantId)
    .maybeSingle();

  if (error) {
    throw { code: "TENANT_LOOKUP_FAILED", message: error.message };
  }

  const tenant = data as TenantAiRow | null;
  if (!tenant?.aiAddonEnabled) {
    throw new AiAddonNotEnabledError();
  }

  const now = new Date();
  const resetAt = tenant.aiMonthlyCallResetAt ? new Date(tenant.aiMonthlyCallResetAt) : null;
  const shouldReset = !resetAt || Number.isNaN(resetAt.getTime()) || resetAt.getTime() < now.getTime();
  const nextCount = shouldReset ? 1 : (tenant.aiMonthlyCallCount ?? 0) + 1;
  const nextReset = shouldReset
    ? new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString()
    : tenant.aiMonthlyCallResetAt;

  const { error: updateError } = await db
    .from("Tenant")
    .update({
      aiMonthlyCallCount: nextCount,
      aiMonthlyCallResetAt: nextReset,
      updatedAt: now.toISOString(),
    })
    .eq("id", tenantId);

  if (updateError) {
    throw { code: "TENANT_UPDATE_FAILED", message: updateError.message };
  }
}

/**
 * Check if AI addon is enabled without throwing — for conditional UI rendering.
 */
export async function hasAiAddon(tenantId: string): Promise<boolean> {
  const { data, error } = await getAdminDb()
    .from("Tenant")
    .select("aiAddonEnabled")
    .eq("id", tenantId)
    .maybeSingle();

  if (error) {
    throw { code: "TENANT_LOOKUP_FAILED", message: error.message };
  }

  return data?.aiAddonEnabled === true;
}
