import type { EnterpriseRelationshipType } from "@prisma/client";
import { requiresCompanyConsent } from "@/lib/enterprise-visibility";

export type MembershipTransition =
  | { ok: true; status: "ACTIVE" | "PENDING" | "DECLINED" }
  | { ok: false; error: string };

export function membershipStatusOnInvite(input: {
  relationshipType: EnterpriseRelationshipType;
  skipConsent: boolean;
}): MembershipTransition {
  const needsConsent = requiresCompanyConsent(input.relationshipType);
  if (!needsConsent && input.skipConsent) {
    return { ok: true, status: "ACTIVE" };
  }
  return { ok: true, status: "PENDING" };
}

export function acceptMembership(input: {
  status: string;
  actorIsCompanyAdmin: boolean;
}): MembershipTransition {
  if (!input.actorIsCompanyAdmin) {
    return { ok: false, error: "Only a company administrator can accept this connection" };
  }
  if (input.status !== "PENDING" && input.status !== "INVITED") {
    return { ok: false, error: "This connection is not waiting for a decision" };
  }
  return { ok: true, status: "ACTIVE" };
}

export function declineMembership(input: {
  status: string;
  actorIsCompanyAdmin: boolean;
}): MembershipTransition {
  if (!input.actorIsCompanyAdmin) {
    return { ok: false, error: "Only a company administrator can decline this connection" };
  }
  if (input.status !== "PENDING" && input.status !== "INVITED") {
    return { ok: false, error: "This connection is not waiting for a decision" };
  }
  return { ok: true, status: "DECLINED" };
}

export type AdvisorInviteDecision =
  | { ok: true }
  | { ok: false; status: 403 | 409; error: string };

export function evaluateAdvisorCompanyInvite(input: {
  alreadyInThisTenant: boolean;
  companyAdminConfirmed: boolean;
  hasActiveMembership: boolean;
  hasAdvisorAssignment: boolean;
  canBeExternalCompetentPerson: boolean;
  otherTenantCount: number;
}): AdvisorInviteDecision {
  if (input.alreadyInThisTenant) {
    return { ok: false, status: 409, error: "This person is already a member of this company" };
  }
  if (input.otherTenantCount === 0) {
    return { ok: true };
  }
  if (input.canBeExternalCompetentPerson) {
    return { ok: true };
  }
  if (
    input.companyAdminConfirmed &&
    input.hasActiveMembership &&
    input.hasAdvisorAssignment
  ) {
    return { ok: true };
  }
  return {
    ok: false,
    status: 403,
    error: "Only HSEQ Nova can authorise an external competent person.",
  };
}

export function parseCompanyImportCsv(text: string): Array<{
  companyName: string;
  companyNumber: string;
  email: string;
  portfolio: string;
}> {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];
  const header = lines[0].toLowerCase();
  const start = header.includes("company") ? 1 : 0;
  const rows: Array<{
    companyName: string;
    companyNumber: string;
    email: string;
    portfolio: string;
  }> = [];
  for (const line of lines.slice(start)) {
    const parts = line.split(",").map((part) => part.trim().replace(/^"|"$/g, ""));
    const [companyName, companyNumber, email, portfolio] = parts;
    if (!companyName) continue;
    rows.push({
      companyName,
      companyNumber: companyNumber ?? "",
      email: (email ?? "").toLowerCase(),
      portfolio: portfolio ?? "",
    });
  }
  return rows;
}
