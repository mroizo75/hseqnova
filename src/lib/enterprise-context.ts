import { getServerSession } from "next-auth/next";
import type { EnterpriseRole } from "@prisma/client";

import { authOptions } from "@/lib/auth";
import { getAdminDb } from "@/lib/supabase/admin";
import {
  getEnterprisePermissions,
  type EnterprisePermissions,
} from "@/lib/enterprise-permissions";

export type EnterpriseContext = {
  userId: string;
  email: string;
  enterpriseId: string;
  role: EnterpriseRole;
  permissions: EnterprisePermissions;
  portfolioIds: string[] | null;
  analyticsEnabled: boolean;
  benchmarkEnabled: boolean;
  organisationName: string;
  programmeName: string | null;
  logoUrl: string | null;
  primaryColour: string | null;
  welcomeText: string | null;
  showPoweredBy: boolean;
};

export async function requireEnterpriseAccess(
  permission?: keyof EnterprisePermissions,
): Promise<EnterpriseContext> {
  const session = await getServerSession(authOptions);
  const sessionUserId = session?.user?.id?.trim() ?? "";
  const sessionEmail = session?.user?.email?.trim() ?? "";
  const sessionEnterpriseId = session?.user?.enterpriseId?.trim() ?? "";

  if (!sessionUserId || !sessionEmail || !sessionEnterpriseId) {
    throw { code: "UNAUTHORIZED", message: "Not authorised" };
  }

  const db = getAdminDb();
  const { data: membership, error } = await db
    .from("EnterpriseUser")
    .select("userId, enterpriseId, role")
    .eq("userId", sessionUserId)
    .eq("enterpriseId", sessionEnterpriseId)
    .maybeSingle();

  if (error) {
    throw { code: "ENTERPRISE_LOOKUP_FAILED", message: error.message };
  }
  if (!membership) {
    throw { code: "UNAUTHORIZED", message: "Not a member of this enterprise" };
  }

  const role = membership.role as EnterpriseRole;
  const permissions = getEnterprisePermissions(role);
  if (permission && !permissions[permission]) {
    throw { code: "FORBIDDEN", message: "You do not have permission for this action" };
  }

  const { data: organisation } = await db
    .from("EnterpriseOrganisation")
    .select(
      "id, name, programmeName, logoUrl, primaryColour, welcomeText, showPoweredBy, analyticsEnabled, benchmarkEnabled, status",
    )
    .eq("id", membership.enterpriseId)
    .maybeSingle();

  if (!organisation || organisation.status !== "ACTIVE") {
    throw { code: "UNAUTHORIZED", message: "Enterprise organisation is not active" };
  }

  let portfolioIds: string[] | null = null;
  if (!permissions.canViewAllPortfolios) {
    const { data: userRow } = await db
      .from("EnterpriseUser")
      .select("id")
      .eq("userId", sessionUserId)
      .eq("enterpriseId", sessionEnterpriseId)
      .maybeSingle();
    const { data: scopes } = userRow
      ? await db.from("EnterpriseUserPortfolio").select("portfolioId").eq("enterpriseUserId", userRow.id)
      : { data: [] as Array<{ portfolioId: string }> };
    portfolioIds = ((scopes ?? []) as Array<{ portfolioId: string }>).map((row) => row.portfolioId);
  }

  return {
    userId: membership.userId as string,
    email: sessionEmail,
    enterpriseId: membership.enterpriseId as string,
    role,
    permissions,
    portfolioIds,
    analyticsEnabled: Boolean(organisation.analyticsEnabled),
    benchmarkEnabled: Boolean(organisation.benchmarkEnabled),
    organisationName: organisation.name as string,
    programmeName: (organisation.programmeName as string | null) ?? null,
    logoUrl: (organisation.logoUrl as string | null) ?? null,
    primaryColour: (organisation.primaryColour as string | null) ?? null,
    welcomeText: (organisation.welcomeText as string | null) ?? null,
    showPoweredBy: organisation.showPoweredBy !== false,
  };
}

export function assertPortfolioScope(ctx: EnterpriseContext, portfolioId: string): void {
  if (ctx.portfolioIds === null) return;
  if (!ctx.portfolioIds.includes(portfolioId)) {
    throw { code: "FORBIDDEN", message: "This portfolio is outside your assignment" };
  }
}
