export const EXTERNAL_CP_INVITE_DENIED =
  "Only HSEQ Nova can authorise an external competent person.";

export type ExistingUserInviteInput = {
  alreadyInThisTenant: boolean;
  otherTenantCount: number;
  canBeExternalCompetentPerson: boolean;
};

export type ExistingUserInviteResult =
  | { ok: true; resetPassword: false }
  | { ok: false; status: 403 | 409; error: string };

export function evaluateExistingUserInvite(input: ExistingUserInviteInput): ExistingUserInviteResult {
  if (input.alreadyInThisTenant) {
    return { ok: false, status: 409, error: "This person is already a member of this company" };
  }
  if (input.otherTenantCount > 0 && !input.canBeExternalCompetentPerson) {
    return { ok: false, status: 403, error: EXTERNAL_CP_INVITE_DENIED };
  }
  return { ok: true, resetPassword: false };
}

export function canSwitchToTenant(membershipTenantIds: readonly string[], requestedTenantId: string): boolean {
  return membershipTenantIds.includes(requestedTenantId);
}

export function resolveScopedTenantId(sessionTenantId: string, _claimedTenantId?: string | null): string {
  return sessionTenantId;
}
