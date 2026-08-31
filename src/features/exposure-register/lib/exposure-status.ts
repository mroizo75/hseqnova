/**
 * COSHH 2002 reg. 11: health records where health surveillance applies.
 * Keep at least 40 years from the last entry (reg.11(3)).
 */
import { COSHH_HEALTH_RECORD_YEARS } from "@/lib/health-record-uk";

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

export function computeRetentionUntilDate(
  retentionYears: number = COSHH_HEALTH_RECORD_YEARS,
  from = new Date(),
): Date {
  const years = Math.max(retentionYears, COSHH_HEALTH_RECORD_YEARS);
  const date = new Date(from);
  date.setFullYear(date.getFullYear() + years);
  return date;
}
