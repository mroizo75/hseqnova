import type { CrmDealStage } from "./types";
import type { TenantCrmInput } from "./types";

export function dealStageFromTenant(tenant: {
  status?: string | null;
  onboardingStatus?: string | null;
}): CrmDealStage {
  if (tenant.status === "CANCELLED" || tenant.status === "SUSPENDED") {
    return "LOST";
  }
  if (tenant.status === "ACTIVE") {
    return "WON";
  }
  if (
    tenant.onboardingStatus === "NOT_STARTED" ||
    tenant.onboardingStatus === "IN_PROGRESS" ||
    tenant.onboardingStatus === "ADMIN_CREATED"
  ) {
    return "NEW";
  }
  return "DEMO";
}

export function canUserAccessOwnedRecord(opts: {
  viewerId: string;
  canSeeAll: boolean;
  ownerId: string | null;
}): boolean {
  if (opts.canSeeAll) {
    return true;
  }
  return opts.ownerId === opts.viewerId;
}

export function applyOwnerScope<T extends { ownerId?: string | null }>(
  records: T[],
  opts: { viewerId: string; canSeeAll: boolean },
): T[] {
  if (opts.canSeeAll) {
    return records;
  }
  return records.filter((record) => record.ownerId === opts.viewerId);
}

export function organisationPayloadFromTenant(tenant: TenantCrmInput) {
  return {
    name: tenant.name,
    companyNumber: tenant.companyNumber ?? tenant.orgNumber ?? null,
    industry: tenant.industry ?? null,
    employeeCount: tenant.employeeCount ?? null,
    address: tenant.address ?? null,
    city: tenant.city ?? null,
    postalCode: tenant.postalCode ?? null,
    notes: tenant.notes ?? null,
  };
}

export function crmReplyToAddress(opts: {
  owner: { name: string | null; email: string } | null;
  staff: { name: string | null; email: string };
}): string {
  const person = opts.owner ?? opts.staff;
  const email = person.email.trim();
  const name = person.name?.trim();
  return name ? `${name} <${email}>` : email;
}
