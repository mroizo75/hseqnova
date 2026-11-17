/** Commercial lead time before a training competence record expires. */

export const MIN_FOLLOW_UP_MONTHS = 4;
export const MAX_FOLLOW_UP_MONTHS = 24;
export const DEFAULT_FOLLOW_UP_MONTHS = 4;
export const DEFAULT_VALIDITY_MONTHS = 36;
export const MIN_VALIDITY_MONTHS = 5;
export const MAX_VALIDITY_MONTHS = 60;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

export function parseFollowUpMonths(value: number): number {
  if (!Number.isInteger(value) || value < MIN_FOLLOW_UP_MONTHS || value > MAX_FOLLOW_UP_MONTHS) {
    throw {
      code: "FOLLOW_UP_MONTHS",
      message: `Contact lead time must be a whole number of months from ${MIN_FOLLOW_UP_MONTHS} to ${MAX_FOLLOW_UP_MONTHS}.`,
    };
  }
  return value;
}

export function parseValidityMonths(value: number, followUpMonths: number): number {
  if (!Number.isInteger(value) || value < MIN_VALIDITY_MONTHS || value > MAX_VALIDITY_MONTHS) {
    throw {
      code: "VALIDITY_MONTHS",
      message: `Competence period must be a whole number of months from ${MIN_VALIDITY_MONTHS} to ${MAX_VALIDITY_MONTHS}.`,
    };
  }
  if (value <= followUpMonths) {
    throw {
      code: "VALIDITY_SHORTER_THAN_LEAD",
      message: `Competence lasts ${value} months, and the contact lead time is ${followUpMonths} months. Lengthen the competence period so the follow-up falls before it expires.`,
    };
  }
  return value;
}

export function addCalendarMonths(isoDate: string, months: number): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate) || !Number.isInteger(months)) {
    throw { code: "INVALID_DATE", message: "Enter a course date" };
  }
  const [year, month, day] = isoDate.split("-").map(Number);
  const target = new Date(Date.UTC(year, month - 1 + months, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  return target.toISOString().slice(0, 10);
}

export function scheduleCompetence(input: {
  courseDate: string;
  validityMonths: number;
  followUpMonths: number;
  today?: string;
}): { validUntil: string; followUpAt: string } {
  const validityMonths = parseValidityMonths(input.validityMonths, input.followUpMonths);
  const followUpMonths = parseFollowUpMonths(input.followUpMonths);
  const validUntil = addCalendarMonths(input.courseDate, validityMonths);
  let followUpAt = addCalendarMonths(validUntil, -followUpMonths);
  const today = input.today ?? new Date().toISOString().slice(0, 10);
  if (followUpAt < today) {
    followUpAt = today;
  }
  return { validUntil, followUpAt };
}

export function formatUkDate(isoDate: string): string {
  const [year, month, day] = isoDate.slice(0, 10).split("-").map(Number);
  const label = MONTHS[month - 1];
  if (!label || !year || !day) {
    return isoDate.slice(0, 10);
  }
  return `${day} ${label} ${year}`;
}

export function trainingFollowUpTitle(company: string, courseTitle: string, validUntil: string): string {
  return `Contact ${company} before ${courseTitle} expires (${formatUkDate(validUntil)})`;
}
