/**
 * COSHH 2002 reg. 11: health records where health surveillance applies.
 * Keep 40 years.
 */
export type ExposureRegisterStatusValue = "ACTIVE" | "INACTIVE" | "ARCHIVED";

export function deriveExposureStatus(
  exposureEndDate: Date | string | null | undefined,
  explicitStatus?: ExposureRegisterStatusValue | null,
  now = new Date(),
): ExposureRegisterStatusValue {
  if (explicitStatus) return explicitStatus;
  if (exposureEndDate && new Date(exposureEndDate) < now) {
    return "INACTIVE";
  }
  return "ACTIVE";
}

export function effectiveExposureStatus(
  status: ExposureRegisterStatusValue,
  exposureEndDate: Date | string | null | undefined,
  now = new Date(),
): ExposureRegisterStatusValue {
  if (status !== "ARCHIVED" && exposureEndDate && new Date(exposureEndDate) < now) {
    return "INACTIVE";
  }
  return status;
}

export function isHealthSurveillancePending(
  healthCheckRequired: boolean,
  healthCheckDone: boolean,
): boolean {
  return healthCheckRequired && !healthCheckDone;
}

export function computeRetentionUntilDate(retentionYears: number, from = new Date()): Date {
  const date = new Date(from);
  date.setFullYear(date.getFullYear() + retentionYears);
  return date;
}
