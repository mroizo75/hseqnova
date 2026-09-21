"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { z } from "zod";
import type {
  EnterpriseDomainKey,
  EnterpriseRelationshipType,
  EnterpriseRole,
  EnterpriseVisibilityLevel,
} from "@prisma/client";

import { authOptions } from "@/lib/auth";
import { canProvisionEnterprise } from "@/lib/platform-access";
import { getAdminDb } from "@/lib/supabase/admin";
import { createId } from "@/lib/ids";
import { requireEnterpriseAccess, assertPortfolioScope } from "@/lib/enterprise-context";
import { getAuthContext } from "@/lib/server-authorization";
import {
  accessRowsFromMap,
  defaultAccessForRelationship,
  defaultShareLossStatistics,
  withAnalyticsAccess,
} from "@/lib/enterprise-visibility";
import {
  acceptMembership,
  declineMembership,
  membershipStatusOnInvite,
  parseCompanyImportCsv,
} from "@/lib/enterprise-membership";
import { slugifyEnterpriseName } from "@/lib/enterprise-stats";
import { evaluateExistingUserInvite } from "@/lib/external-competent-person";
import { sendEnterpriseConnectionEmail } from "@/lib/email-service";

const relationshipSchema = z.enum([
  "GROUP_SUBSIDIARY",
  "INSURED",
  "CONTRACTOR",
  "FRANCHISEE",
  "MEMBER",
  "SUPPLY_CHAIN",
  "OTHER",
]);

const roleSchema = z.enum([
  "OWNER",
  "ADMIN",
  "PORTFOLIO_MANAGER",
  "HSEQ_MANAGER",
  "RISK_MANAGER",
  "ADVISOR",
  "AUDITOR",
  "READ_ONLY",
]);

function actionError(error: unknown): { success: false; error: string } {
  if (error && typeof error === "object" && "message" in error) {
    return { success: false, error: String((error as { message: string }).message) };
  }
  return { success: false, error: "Something went wrong" };
}

async function requirePlatformProvisioner() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !canProvisionEnterprise(session.user)) {
    throw { code: "UNAUTHORIZED", message: "Only HSEQ Nova staff can create a group" };
  }
  return session.user;
}

const DEFAULT_STANDARDS = [
  {
    name: "Manufacturing risk standard",
    description: "Current risk assessments, COSHH, training, inspections and closed critical actions.",
    rules: [
      { domainKey: "RISKS" as const, ruleKey: "risks_current", label: "Risk assessments current" },
      { domainKey: "COSHH" as const, ruleKey: "coshh_current", label: "COSHH current" },
      { domainKey: "TRAINING" as const, ruleKey: "training_current", label: "Mandatory training current" },
      { domainKey: "INSPECTIONS" as const, ruleKey: "inspections_monthly", label: "Inspections completed" },
      { domainKey: "ACTIONS" as const, ruleKey: "critical_actions_resolved", label: "Critical actions resolved" },
      { domainKey: "INCIDENTS" as const, ruleKey: "incidents_investigated", label: "Incidents investigated" },
      { domainKey: "MANAGEMENT_REVIEW" as const, ruleKey: "management_review_completed", label: "Management review completed" },
    ],
  },
  {
    name: "Approved contractor standard",
    description: "RAMS, competence, inspections and corrective actions for contractor networks.",
    rules: [
      { domainKey: "RAMS" as const, ruleKey: "rams_current", label: "RAMS current" },
      { domainKey: "TRAINING" as const, ruleKey: "training_current", label: "Competence current" },
      { domainKey: "INSPECTIONS" as const, ruleKey: "inspections_monthly", label: "Site inspections completed" },
      { domainKey: "ACTIONS" as const, ruleKey: "critical_actions_resolved", label: "Corrective actions closed" },
    ],
  },
];

export async function provisionEnterpriseOrganisation(input: {
  name: string;
  type: string;
  ownerEmail: string;
  ownerName: string;
  programmeName?: string;
}) {
  try {
    await requirePlatformProvisioner();
    const name = input.name.trim();
    if (name.length < 2) return { success: false as const, error: "Name is required" };
    const email = input.ownerEmail.trim().toLowerCase();
    const db = getAdminDb();
    let slug = slugifyEnterpriseName(name);
    const { data: existingSlug } = await db.from("EnterpriseOrganisation").select("id").eq("slug", slug).maybeSingle();
    if (existingSlug) slug = `${slug}-${createId().slice(-6)}`;

    const orgId = createId();
    await db.from("EnterpriseOrganisation").insert({
      id: orgId,
      name,
      slug,
      type: input.type,
      programmeName: input.programmeName?.trim() || null,
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const defaultPortfolioId = createId();
    let defaultStandardId: string | null = null;
    for (const [index, standard] of DEFAULT_STANDARDS.entries()) {
      const standardId = createId();
      if (index === 0) defaultStandardId = standardId;
      await db.from("EnterpriseStandard").insert({
        id: standardId,
        enterpriseId: orgId,
        name: standard.name,
        description: standard.description,
        isDefault: index === 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      await db.from("EnterpriseStandardRequirement").insert(
        standard.rules.map((rule) => ({
          id: createId(),
          standardId,
          domainKey: rule.domainKey,
          ruleKey: rule.ruleKey,
          label: rule.label,
          createdAt: new Date().toISOString(),
        })),
      );
    }

    await db.from("EnterprisePortfolio").insert({
      id: defaultPortfolioId,
      enterpriseId: orgId,
      name: "Default portfolio",
      standardId: defaultStandardId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const { data: owner } = await db.from("User").select("id, email, name").eq("email", email).maybeSingle();
    let userId = owner?.id as string | undefined;
    if (!userId) {
      userId = createId();
      await db.from("User").insert({
        id: userId,
        email,
        name: input.ownerName.trim() || email,
        preferredLocale: "en-GB",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    await db.from("EnterpriseUser").insert({
      id: createId(),
      userId,
      enterpriseId: orgId,
      role: "OWNER",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    await db.from("User").update({ lastEnterpriseId: orgId, updatedAt: new Date().toISOString() }).eq("id", userId);

    revalidatePath("/admin/enterprises");
    return { success: true as const, data: { id: orgId, slug } };
  } catch (error) {
    return actionError(error);
  }
}

export async function updateEnterpriseBranding(input: {
  programmeName?: string;
  welcomeText?: string;
  primaryColour?: string;
  onboardingMessage?: string;
  logoUrl?: string;
  showPoweredBy?: boolean;
  analyticsEnabled?: boolean;
  benchmarkEnabled?: boolean;
}) {
  try {
    const ctx = await requireEnterpriseAccess("canManageBranding");
    await getAdminDb()
      .from("EnterpriseOrganisation")
      .update({
        ...input,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", ctx.enterpriseId);
    revalidatePath("/enterprise/administration");
    return { success: true as const };
  } catch (error) {
    return actionError(error);
  }
}

export async function createEnterprisePortfolio(input: { name: string; sector?: string; region?: string; standardId?: string }) {
  try {
    const ctx = await requireEnterpriseAccess("canManagePortfolios");
    const name = input.name.trim();
    if (!name) return { success: false as const, error: "Portfolio name is required" };
    await getAdminDb()
      .from("EnterprisePortfolio")
      .insert({
        id: createId(),
        enterpriseId: ctx.enterpriseId,
        name,
        sector: input.sector?.trim() || null,
        region: input.region?.trim() || null,
        standardId: input.standardId || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    revalidatePath("/enterprise/portfolios");
    return { success: true as const };
  } catch (error) {
    return actionError(error);
  }
}

export async function inviteCompanyToPortfolio(input: {
  portfolioId: string;
  companyNumber?: string;
  tenantId?: string;
  companyName: string;
  contactEmail: string;
  relationshipType: EnterpriseRelationshipType;
  skipConsent?: boolean;
}) {
  try {
    const ctx = await requireEnterpriseAccess("canInviteCompanies");
    assertPortfolioScope(ctx, input.portfolioId);
    const db = getAdminDb();
    let tenantId = input.tenantId?.trim() || null;
    if (!tenantId && input.companyNumber) {
      const { data: tenant } = await db
        .from("Tenant")
        .select("id, name")
        .eq("companyNumber", input.companyNumber.trim())
        .maybeSingle();
      tenantId = (tenant?.id as string | undefined) ?? null;
    }

    const transition = membershipStatusOnInvite({
      relationshipType: input.relationshipType,
      skipConsent: Boolean(input.skipConsent && ctx.permissions.canManageOrganisation),
    });
    if ("error" in transition) return { success: false as const, error: transition.error };

    const { data: org } = await db
      .from("EnterpriseOrganisation")
      .select("analyticsEnabled, name, programmeName")
      .eq("id", ctx.enterpriseId)
      .maybeSingle();

    const inviteId = createId();
    const token = randomBytes(24).toString("hex");
    await db.from("EnterpriseInvite").insert({
      id: inviteId,
      enterpriseId: ctx.enterpriseId,
      portfolioId: input.portfolioId,
      tenantId,
      companyName: input.companyName.trim(),
      companyNumber: input.companyNumber?.trim() || null,
      contactEmail: input.contactEmail.trim().toLowerCase(),
      token,
      status: "INVITED",
      relationshipType: input.relationshipType,
      createdByUserId: ctx.userId,
      createdAt: new Date().toISOString(),
    });

    if (tenantId) {
      const membershipId = createId();
      const shareLoss = defaultShareLossStatistics(input.relationshipType);
      await db.from("EnterpriseMembership").insert({
        id: membershipId,
        portfolioId: input.portfolioId,
        tenantId,
        relationshipType: input.relationshipType,
        status: transition.status,
        requiresCompanyConsent: transition.status !== "ACTIVE",
        shareLossStatistics: shareLoss,
        invitedAt: new Date().toISOString(),
        acceptedAt: transition.status === "ACTIVE" ? new Date().toISOString() : null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      const access = withAnalyticsAccess(
        defaultAccessForRelationship(input.relationshipType),
        Boolean(org?.analyticsEnabled),
        shareLoss,
      );
      await db.from("EnterpriseMembershipAccess").insert(
        accessRowsFromMap(access).map((row) => ({
          id: createId(),
          membershipId,
          ...row,
        })),
      );
    }

    await sendEnterpriseConnectionEmail({
      to: input.contactEmail.trim().toLowerCase(),
      companyName: input.companyName.trim(),
      programmeName: (org?.programmeName as string | null) || (org?.name as string) || "HSEQ programme",
      token,
    });

    revalidatePath("/enterprise/companies");
    return { success: true as const, data: { token } };
  } catch (error) {
    return actionError(error);
  }
}

export async function importCompaniesCsv(input: { csv: string; portfolioId: string; relationshipType: EnterpriseRelationshipType }) {
  try {
    const ctx = await requireEnterpriseAccess("canImportCompanies");
    assertPortfolioScope(ctx, input.portfolioId);
    const rows = parseCompanyImportCsv(input.csv);
    if (rows.length === 0) return { success: false as const, error: "No company rows found" };
    const batchId = createId();
    const db = getAdminDb();
    await db.from("EnterpriseImportBatch").insert({
      id: batchId,
      enterpriseId: ctx.enterpriseId,
      portfolioId: input.portfolioId,
      filename: "upload.csv",
      status: "PROCESSING",
      createdByUserId: ctx.userId,
      createdAt: new Date().toISOString(),
    });
    let invited = 0;
    for (const row of rows) {
      const result = await inviteCompanyToPortfolio({
        portfolioId: input.portfolioId,
        companyName: row.companyName,
        companyNumber: row.companyNumber || undefined,
        contactEmail: row.email || "unspecified@invalid.local",
        relationshipType: input.relationshipType,
      });
      await db.from("EnterpriseImportRow").insert({
        id: createId(),
        batchId,
        companyName: row.companyName,
        companyNumber: row.companyNumber || null,
        email: row.email || null,
        portfolioName: row.portfolio || null,
        status: result.success ? "INVITED" : "EXPIRED",
        error: result.success ? null : "error" in result ? result.error : "Failed",
      });
      if (result.success) invited += 1;
    }
    await db
      .from("EnterpriseImportBatch")
      .update({ status: "COMPLETED", completedAt: new Date().toISOString() })
      .eq("id", batchId);
    revalidatePath("/enterprise/administration");
    return { success: true as const, data: { invited, total: rows.length } };
  } catch (error) {
    return actionError(error);
  }
}

export async function respondToEnterpriseConnection(input: {
  membershipId: string;
  accept: boolean;
  shareLossStatistics?: boolean;
}) {
  try {
    const auth = await getAuthContext();
    if (!auth?.permissions.canUpdateSettings) {
      return { success: false as const, error: "Only a company administrator can change this connection" };
    }
    const db = getAdminDb();
    const { data: membership } = await db
      .from("EnterpriseMembership")
      .select("id, status, tenantId")
      .eq("id", input.membershipId)
      .eq("tenantId", auth.tenantId)
      .maybeSingle();
    if (!membership) return { success: false as const, error: "Connection not found" };
    const decision = input.accept
      ? acceptMembership({ status: membership.status as string, actorIsCompanyAdmin: true })
      : declineMembership({ status: membership.status as string, actorIsCompanyAdmin: true });
    if ("error" in decision) return { success: false as const, error: decision.error };
    await db
      .from("EnterpriseMembership")
      .update({
        status: decision.status,
        acceptedAt: input.accept ? new Date().toISOString() : null,
        shareLossStatistics: input.accept ? Boolean(input.shareLossStatistics) : false,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", input.membershipId);
    revalidatePath("/dashboard/settings/connected-organisations");
    return { success: true as const };
  } catch (error) {
    return actionError(error);
  }
}

export async function updateMembershipVisibility(input: {
  membershipId: string;
  domainKey: EnterpriseDomainKey;
  visibilityLevel: EnterpriseVisibilityLevel;
  shareLossStatistics?: boolean;
}) {
  try {
    const auth = await getAuthContext();
    if (!auth?.permissions.canUpdateSettings) {
      return { success: false as const, error: "Only a company administrator can change visibility" };
    }
    if (input.visibilityLevel === "FULL" && input.domainKey === "INCIDENTS") {
      return { success: false as const, error: "Full incident access must be granted separately" };
    }
    const db = getAdminDb();
    const { data: membership } = await db
      .from("EnterpriseMembership")
      .select("id")
      .eq("id", input.membershipId)
      .eq("tenantId", auth.tenantId)
      .maybeSingle();
    if (!membership) return { success: false as const, error: "Connection not found" };
    const { data: existing } = await db
      .from("EnterpriseMembershipAccess")
      .select("id")
      .eq("membershipId", input.membershipId)
      .eq("domainKey", input.domainKey)
      .maybeSingle();
    if (existing) {
      await db
        .from("EnterpriseMembershipAccess")
        .update({ visibilityLevel: input.visibilityLevel })
        .eq("id", existing.id);
    } else {
      await db.from("EnterpriseMembershipAccess").insert({
        id: createId(),
        membershipId: input.membershipId,
        domainKey: input.domainKey,
        visibilityLevel: input.visibilityLevel,
      });
    }
    if (input.shareLossStatistics !== undefined) {
      await db
        .from("EnterpriseMembership")
        .update({ shareLossStatistics: input.shareLossStatistics, updatedAt: new Date().toISOString() })
        .eq("id", input.membershipId);
    }
    revalidatePath("/dashboard/settings/connected-organisations");
    return { success: true as const };
  } catch (error) {
    return actionError(error);
  }
}

export async function shareDocumentWithEnterprise(input: { membershipId: string; documentId: string }) {
  try {
    const auth = await getAuthContext();
    if (!auth?.permissions.canUpdateSettings) {
      return { success: false as const, error: "Only a company administrator can share evidence" };
    }
    const db = getAdminDb();
    const { data: document } = await db
      .from("Document")
      .select("id")
      .eq("id", input.documentId)
      .eq("tenantId", auth.tenantId)
      .maybeSingle();
    if (!document) return { success: false as const, error: "Document not found" };
    await db.from("EnterpriseEvidenceShare").upsert(
      {
        id: createId(),
        membershipId: input.membershipId,
        documentId: input.documentId,
        sharedByUserId: auth.userId,
        createdAt: new Date().toISOString(),
      },
      { onConflict: "membershipId,documentId" },
    );
    revalidatePath("/dashboard/settings/connected-organisations");
    return { success: true as const };
  } catch (error) {
    return actionError(error);
  }
}

export async function createImprovementRequest(input: { membershipId: string; title: string; message: string }) {
  try {
    const ctx = await requireEnterpriseAccess("canRequestImprovement");
    const title = input.title.trim();
    if (!title) return { success: false as const, error: "Title is required" };
    const db = getAdminDb();
    const { data: membership } = await db
      .from("EnterpriseMembership")
      .select("id, portfolioId, portfolio:EnterprisePortfolio(enterpriseId)")
      .eq("id", input.membershipId)
      .maybeSingle();
    const portfolio = membership?.portfolio as { enterpriseId?: string } | null;
    if (!membership || portfolio?.enterpriseId !== ctx.enterpriseId) {
      return { success: false as const, error: "Company is not in this enterprise" };
    }
    assertPortfolioScope(ctx, membership.portfolioId as string);
    await db.from("EnterpriseImprovementRequest").insert({
      id: createId(),
      membershipId: input.membershipId,
      requestedByUserId: ctx.userId,
      title,
      message: input.message.trim(),
      status: "REQUESTED",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    revalidatePath("/enterprise/companies");
    return { success: true as const };
  } catch (error) {
    return actionError(error);
  }
}

export async function createEnterpriseStandard(input: {
  name: string;
  description?: string;
  rules: Array<{ domainKey: EnterpriseDomainKey; ruleKey: string; label: string; threshold?: number }>;
}) {
  try {
    const ctx = await requireEnterpriseAccess("canManageStandards");
    const standardId = createId();
    const db = getAdminDb();
    await db.from("EnterpriseStandard").insert({
      id: standardId,
      enterpriseId: ctx.enterpriseId,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      isDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    if (input.rules.length > 0) {
      await db.from("EnterpriseStandardRequirement").insert(
        input.rules.map((rule) => ({
          id: createId(),
          standardId,
          domainKey: rule.domainKey,
          ruleKey: rule.ruleKey,
          label: rule.label,
          threshold: rule.threshold ?? null,
          createdAt: new Date().toISOString(),
        })),
      );
    }
    revalidatePath("/enterprise/standards");
    return { success: true as const };
  } catch (error) {
    return actionError(error);
  }
}

export async function assignAdvisor(input: {
  email: string;
  scopeType: "ENTERPRISE" | "PORTFOLIO" | "MEMBERSHIP";
  scopeId: string;
  canAssistInWorkspace?: boolean;
}) {
  try {
    const ctx = await requireEnterpriseAccess("canAssignAdvisors");
    const db = getAdminDb();
    const { data: user } = await db
      .from("User")
      .select("id, email")
      .eq("email", input.email.trim().toLowerCase())
      .maybeSingle();
    if (!user) return { success: false as const, error: "No HSEQ Nova user exists with that email" };
    const { data: membership } = await db
      .from("EnterpriseUser")
      .select("id")
      .eq("userId", user.id)
      .eq("enterpriseId", ctx.enterpriseId)
      .maybeSingle();
    if (!membership) {
      await db.from("EnterpriseUser").insert({
        id: createId(),
        userId: user.id,
        enterpriseId: ctx.enterpriseId,
        role: "ADVISOR",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    await db.from("EnterpriseAdvisorAssignment").insert({
      id: createId(),
      enterpriseId: ctx.enterpriseId,
      userId: user.id,
      scopeType: input.scopeType,
      scopeId: input.scopeId,
      canAssistInWorkspace: Boolean(input.canAssistInWorkspace),
      createdAt: new Date().toISOString(),
    });
    revalidatePath("/enterprise/advisors");
    return { success: true as const };
  } catch (error) {
    return actionError(error);
  }
}

export async function inviteAdvisorIntoCompany(input: { advisorUserId: string; tenantId: string }) {
  try {
    const auth = await getAuthContext();
    if (!auth?.permissions.canInviteUsers) {
      return { success: false as const, error: "Only a company administrator can invite an advisor" };
    }
    const db = getAdminDb();
    const { data: existing } = await db
      .from("UserTenant")
      .select("id")
      .eq("userId", input.advisorUserId)
      .eq("tenantId", auth.tenantId)
      .maybeSingle();
    const { count: otherCount } = await db
      .from("UserTenant")
      .select("id", { count: "exact", head: true })
      .eq("userId", input.advisorUserId);
    const { data: user } = await db
      .from("User")
      .select("canBeExternalCompetentPerson")
      .eq("id", input.advisorUserId)
      .maybeSingle();
    const { data: membership } = await db
      .from("EnterpriseMembership")
      .select("id, status")
      .eq("tenantId", auth.tenantId)
      .eq("status", "ACTIVE")
      .limit(1)
      .maybeSingle();
    const { data: assignment } = await db
      .from("EnterpriseAdvisorAssignment")
      .select("id")
      .eq("userId", input.advisorUserId)
      .limit(1)
      .maybeSingle();
    const decision = evaluateExistingUserInvite({
      alreadyInThisTenant: Boolean(existing),
      otherTenantCount: otherCount ?? 0,
      canBeExternalCompetentPerson: Boolean(user?.canBeExternalCompetentPerson),
      companyAdminConfirmed: true,
      hasActiveMembership: Boolean(membership),
      hasAdvisorAssignment: Boolean(assignment),
    });
    if ("error" in decision) return { success: false as const, error: decision.error };
    await db.from("UserTenant").insert({
      id: createId(),
      userId: input.advisorUserId,
      tenantId: auth.tenantId,
      role: "HMS",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    revalidatePath("/dashboard/users");
    return { success: true as const };
  } catch (error) {
    return actionError(error);
  }
}

export async function addEnterpriseUser(input: { email: string; role: EnterpriseRole }) {
  try {
    const ctx = await requireEnterpriseAccess("canManageUsers");
    roleSchema.parse(input.role);
    const db = getAdminDb();
    const { data: user } = await db
      .from("User")
      .select("id")
      .eq("email", input.email.trim().toLowerCase())
      .maybeSingle();
    if (!user) return { success: false as const, error: "No HSEQ Nova user exists with that email" };
    await db.from("EnterpriseUser").upsert(
      {
        id: createId(),
        userId: user.id,
        enterpriseId: ctx.enterpriseId,
        role: input.role,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { onConflict: "userId,enterpriseId" },
    );
    revalidatePath("/enterprise/administration");
    return { success: true as const };
  } catch (error) {
    return actionError(error);
  }
}

export async function acknowledgeEnterpriseAlert(alertId: string) {
  try {
    const ctx = await requireEnterpriseAccess("canManageAlerts");
    await getAdminDb()
      .from("EnterpriseAlert")
      .update({ acknowledgedAt: new Date().toISOString() })
      .eq("id", alertId)
      .eq("enterpriseId", ctx.enterpriseId);
    revalidatePath("/enterprise/alerts");
    return { success: true as const };
  } catch (error) {
    return actionError(error);
  }
}

export async function createActionFromImprovementRequest(input: {
  requestId: string;
  title: string;
  dueAt: string;
}) {
  try {
    const auth = await getAuthContext();
    if (!auth?.permissions.canCreateActions) {
      return { success: false as const, error: "You cannot create actions" };
    }
    const db = getAdminDb();
    const { data: request } = await db
      .from("EnterpriseImprovementRequest")
      .select("id, membershipId, status")
      .eq("id", input.requestId)
      .maybeSingle();
    if (!request) return { success: false as const, error: "Request not found" };
    const { data: membership } = await db
      .from("EnterpriseMembership")
      .select("id, tenantId")
      .eq("id", request.membershipId as string)
      .eq("tenantId", auth.tenantId)
      .maybeSingle();
    if (!membership) return { success: false as const, error: "Request is not for this company" };
    const dueAt = new Date(input.dueAt);
    if (Number.isNaN(dueAt.getTime())) return { success: false as const, error: "Due date is required" };
    await db.from("Measure").insert({
      id: createId(),
      tenantId: auth.tenantId,
      title: input.title.trim(),
      dueAt: dueAt.toISOString(),
      responsibleId: auth.userId,
      status: "PENDING",
      enterpriseImprovementRequestId: input.requestId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    await db
      .from("EnterpriseImprovementRequest")
      .update({ status: "IN_PROGRESS", updatedAt: new Date().toISOString() })
      .eq("id", input.requestId);
    revalidatePath("/dashboard/actions");
    revalidatePath("/dashboard/settings/connected-organisations");
    return { success: true as const };
  } catch (error) {
    return actionError(error);
  }
}
