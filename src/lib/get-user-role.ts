/**
 * Server-side utility for å hente brukerens rolle
 */

import { getSessionAppUser, getMemberships } from "@/lib/membership";
import { Role } from "@prisma/client";

export async function getUserRole(): Promise<{ role: Role | null; tenantId: string | null }> {
  const ctx = await getSessionAppUser();
  if (!ctx?.tenantId) {
    return { role: null, tenantId: null };
  }

  const memberships = await getMemberships(ctx.user.id);
  const selected = memberships.find((membership) => membership.tenantId === ctx.tenantId);
  if (!selected) {
    return { role: null, tenantId: null };
  }

  return { role: selected.role, tenantId: selected.tenantId };
}
