/**
 * Accident book helpers (BI 510).
 *
 * Legal basis:
 * - Social Security (Claims and Payments) Regulations 1979
 * - RIDDOR 2013
 * - SRSCWR 1977 (safety representatives; personal data only with consent)
 */

export const INJURED_PERSON_ROLES = [
  "employee",
  "contractor",
  "visitor",
  "member_of_public",
] as const;

export type InjuredPersonRole = (typeof INJURED_PERSON_ROLES)[number];

export const RIDDOR_REPORT_METHODS = ["phone", "online"] as const;
export type RiddorReportMethod = (typeof RIDDOR_REPORT_METHODS)[number];

const INJURY_TYPES = new Set(["ULYKKE", "YRKESSYKDOM", "SKADE"]);

export function isInjuryEventType(type: string): boolean {
  return INJURY_TYPES.has(type);
}

export function needsInjuredPersonDetails(
  type: string,
  role?: string | null
): boolean {
  return isInjuryEventType(type) || role === "member_of_public" || role === "visitor";
}

export function isInjuredPersonRole(value: string | null | undefined): value is InjuredPersonRole {
  return Boolean(value && (INJURED_PERSON_ROLES as readonly string[]).includes(value));
}

export function isRiddorReportMethod(value: string | null | undefined): value is RiddorReportMethod {
  return Boolean(value && (RIDDOR_REPORT_METHODS as readonly string[]).includes(value));
}

export function titleFromDescription(description: string): string {
  const firstLine = description.trim().split(/\r?\n/)[0] ?? "";
  const collapsed = firstLine.replace(/\s+/g, " ").trim();
  if (collapsed.length >= 5) {
    return collapsed.slice(0, 80);
  }
  return "Accident book entry";
}

export function composeInvolvedPersons(input: {
  name?: string | null;
  occupation?: string | null;
  address?: string | null;
  role?: string | null;
}): string | undefined {
  const lines = [
    input.name?.trim(),
    input.occupation?.trim() ? `Occupation: ${input.occupation.trim()}` : null,
    input.address?.trim() ? `Address: ${input.address.trim()}` : null,
    input.role?.trim() ? `Role: ${labelInjuredPersonRole(input.role)}` : null,
  ].filter((line): line is string => Boolean(line));
  return lines.length > 0 ? lines.join("\n") : undefined;
}

export function labelInjuredPersonRole(role: string | null | undefined): string {
  switch (role) {
    case "employee":
      return "Employee";
    case "contractor":
      return "Contractor";
    case "visitor":
      return "Visitor";
    case "member_of_public":
      return "Member of the public";
    default:
      return role ?? "";
  }
}

export function labelRiddorReportMethod(method: string | null | undefined): string {
  if (method === "phone") return "Telephone (Incident Contact Centre 0345 300 9923)";
  if (method === "online") return "Online (hse.gov.uk/riddor)";
  return method ?? "";
}
