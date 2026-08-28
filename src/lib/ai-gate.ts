import { prisma } from "@/lib/db";

export class AiAddonNotEnabledError extends Error {
  constructor() {
    super("AI Pro add-on is not enabled for this organisation. Contact your administrator to subscribe.");
    this.name = "AiAddonNotEnabledError";
  }
}

/**
 * Verify the tenant has the AI Pro add-on enabled.
 * Throws AiAddonNotEnabledError if not.
 * Also increments the monthly call counter.
 */
export async function requireAiAddon(tenantId: string): Promise<void> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      aiAddonEnabled: true,
      aiMonthlyCallCount: true,
      aiMonthlyCallResetAt: true,
    },
  });

  if (!tenant?.aiAddonEnabled) {
    throw new AiAddonNotEnabledError();
  }

  const now = new Date();
  const resetAt = tenant.aiMonthlyCallResetAt ? new Date(tenant.aiMonthlyCallResetAt) : null;
  const shouldReset = !resetAt || resetAt.getTime() < now.getTime();

  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      aiMonthlyCallCount: shouldReset ? 1 : { increment: 1 },
      aiMonthlyCallResetAt: shouldReset
        ? new Date(now.getFullYear(), now.getMonth() + 1, 1)
        : undefined,
    },
  });
}

/**
 * Check if AI addon is enabled without throwing — for conditional UI rendering.
 */
export async function hasAiAddon(tenantId: string): Promise<boolean> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { aiAddonEnabled: true },
  });
  return tenant?.aiAddonEnabled === true;
}
