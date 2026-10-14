export const DEMO_REGISTRATION_TYPE = "DEMO";

export const DEMO_DURATION_DAYS = [7, 14, 30] as const;
export type DemoDurationDays = (typeof DEMO_DURATION_DAYS)[number];

export function isDemoRegistration(registrationType: string | null | undefined): boolean {
  return registrationType === DEMO_REGISTRATION_TYPE;
}

export function isDemoAccessExpired(tenant: {
  registrationType?: string | null;
  trialEndsAt?: string | Date | null;
  status?: string | null;
}): boolean {
  if (!isDemoRegistration(tenant.registrationType)) return false;
  if (tenant.status === "ACTIVE") return false;
  if (!tenant.trialEndsAt) return false;
  return new Date(tenant.trialEndsAt).getTime() <= Date.now();
}

export function demoEndsAt(days: number, from = new Date()): Date {
  const ends = new Date(from);
  ends.setDate(ends.getDate() + days);
  return ends;
}
