import { evaluateAdvisorCompanyInvite } from "@/lib/enterprise-membership";

export const EXTERNAL_CP_INVITE_DENIED =
  "Only HSEQ Nova can authorise an external competent person.";

export type ExistingUserInviteInput = {
  alreadyInThisTenant: boolean;
  otherTenantCount: number;
  canBeExternalCompetentPerson: boolean;
  companyAdminConfirmed?: boolean;
  hasActiveMembership?: boolean;
  hasAdvisorAssignment?: boolean;
};

export type ExistingUserInviteResult =
  | { ok: true; resetPassword: false }
  | { ok: false; status: 403 | 409; error: string };

export function evaluateExistingUserInvite(input: ExistingUserInviteInput): ExistingUserInviteResult {
  const result = evaluateAdvisorCompanyInvite({
    alreadyInThisTenant: input.alreadyInThisTenant,
    otherTenantCount: input.otherTenantCount,
    canBeExternalCompetentPerson: input.canBeExternalCompetentPerson,
    companyAdminConfirmed: Boolean(input.companyAdminConfirmed),
    hasActiveMembership: Boolean(input.hasActiveMembership),
    hasAdvisorAssignment: Boolean(input.hasAdvisorAssignment),
  });
  if (result.ok === false) {
    return { ok: false, status: result.status, error: result.error };
  }
  return { ok: true, resetPassword: false };
}

export function canSwitchToTenant(membershipTenantIds: readonly string[], requestedTenantId: string): boolean {
  return membershipTenantIds.includes(requestedTenantId);
}

export function resolveScopedTenantId(sessionTenantId: string, _claimedTenantId?: string | null): string {
  return sessionTenantId;
}
