import { z } from "zod";
import { ActionEffectiveness, IncidentStage, IncidentType, IncidentStatus } from "@prisma/client";
import { PROJECT_REFERENCE_MAX_LENGTH } from "@/lib/incident-project-reference";

/**
 * Accident book + RIDDOR record.
 *
 * Legal basis:
 * - Social Security (Claims and Payments) Regulations 1979 (accident book; keep 3 years)
 * - RIDDOR 2013 (reportable death, specified injury, over-seven-day, disease, listed dangerous occurrence)
 * - HSWA 1974 s.2 (safe system of work)
 * - MHSWR 1999 (manage risk; competent person)
 * - HSE HSG245 (investigate accidents and incidents)
 *
 * Prisma enum keys stay (AVVIK, ULYKKE, NESTEN, …). Labels are British English.
 */

export const createIncidentSchema = z.object({
  tenantId: z.string().cuid(),
  type: z.nativeEnum(IncidentType),
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  // Optional at report: severity, RIDDOR flags, risk link, subcategories and
  // suggested actions are completed when the record is handled (HSG245; MHSWR 1999).
  severity: z.number().int().min(1).max(5, "Severity must be 1–5").nullish(),
  occurredAt: z.date(),
  reportedBy: z.string().cuid(),
  reportedForUserId: z.string().cuid().optional(),
  location: z.string().optional(),
  witnessName: z.string().optional(),
  immediateAction: z.string().optional(),
  injuryType: z.string().max(120).optional(),
  medicalAttentionRequired: z.boolean().optional(),
  lostTimeMinutes: z.number().int().min(0).optional(),
  riskReferenceId: z.string().cuid().optional(),
  customerName: z.string().max(140).optional().or(z.literal("")),
  customerEmail: z.union([z.string().email(), z.literal("")]).optional(),
  customerPhone: z.string().max(60).optional().or(z.literal("")),
  customerTicketId: z.string().max(120).optional().or(z.literal("")),
  responseDeadline: z.date().optional(),
  customerSatisfaction: z.number().int().min(1).max(5).optional(),
  projectId: z.string().cuid().optional(),
  projectReference: z.string().max(PROJECT_REFERENCE_MAX_LENGTH).optional().nullable(),
  subcategoryKeys: z.array(z.string()).optional(),
  involvedPersons: z.string().optional(),
  injuryDescription: z.string().optional(),
  suggestedActions: z.string().optional(),
  isFatal: z.boolean().optional(),
  isLostTimeIncident: z.boolean().optional(),
  lostWorkdays: z.number().int().min(0).optional(),
  isRestrictedWork: z.boolean().optional(),
});

export const updateIncidentSchema = z.object({
  id: z.string().cuid(),
  type: z.nativeEnum(IncidentType).optional(),
  title: z.string().min(5).optional(),
  description: z.string().min(20).optional(),
  severity: z.number().int().min(1).max(5).nullish(),
  occurredAt: z.date().optional(),
  location: z.string().optional(),
  witnessName: z.string().optional(),
  immediateAction: z.string().optional(),
  rootCause: z.string().optional(),
  contributingFactors: z.string().optional(),
  status: z.nativeEnum(IncidentStatus).optional(),
  injuryType: z.string().max(120).optional(),
  medicalAttentionRequired: z.boolean().optional(),
  lostTimeMinutes: z.number().int().min(0).optional(),
  riskReferenceId: z.string().cuid().optional().nullable(),
  measureEffectiveness: z.nativeEnum(ActionEffectiveness).optional(),
  stage: z.nativeEnum(IncidentStage).optional(),
  customerName: z.string().max(140).optional().or(z.literal("")),
  customerEmail: z.union([z.string().email(), z.literal("")]).optional().nullable(),
  customerPhone: z.string().max(60).optional().or(z.literal("")),
  customerTicketId: z.string().max(120).optional().or(z.literal("")),
  responseDeadline: z.date().optional().nullable(),
  customerSatisfaction: z.number().int().min(1).max(5).optional().nullable(),
  projectId: z.string().cuid().optional().nullable(),
  projectReference: z.string().max(PROJECT_REFERENCE_MAX_LENGTH).optional().nullable(),
  subcategoryKeys: z.array(z.string()).optional(),
  involvedPersons: z.string().optional(),
  injuryDescription: z.string().optional(),
  suggestedActions: z.string().optional(),
  // HSE-statistikk
  isFatal: z.boolean().optional(),
  isLostTimeIncident: z.boolean().optional(),
  lostWorkdays: z.number().int().min(0).optional(),
  isRestrictedWork: z.boolean().optional(),
  // Kilde: INTERNAL eller EXTERNAL
  source: z.enum(["INTERNAL", "EXTERNAL"]).optional(),
});

export const investigateIncidentSchema = z.object({
  id: z.string().cuid(),
  rootCause: z.string().min(20, "Investigation findings must be at least 20 characters"),
  contributingFactors: z.string().optional(),
  investigatedBy: z.string().cuid(),
});

export const closeIncidentSchema = z.object({
  id: z.string().cuid(),
  closedBy: z.string().cuid(),
  effectivenessReview: z.string().min(20, "Effectiveness review must be at least 20 characters"),
  lessonsLearned: z.string().optional(),
  measureEffectiveness: z.nativeEnum(ActionEffectiveness).optional(),
  noActionReason: z.string().optional(),
});

export type CreateIncidentInput = z.infer<typeof createIncidentSchema>;
export type UpdateIncidentInput = z.infer<typeof updateIncidentSchema>;
export type InvestigateIncidentInput = z.infer<typeof investigateIncidentSchema>;
export type CloseIncidentInput = z.infer<typeof closeIncidentSchema>;

/** Stored enum keys — labels are “Accident book” vs “Other record”. */
export type MainIncidentCategory = "AVVIK" | "RUH";

const ACCIDENT_BOOK_TYPES: ReadonlySet<IncidentType> = new Set<IncidentType>([
  "ULYKKE",
  "NESTEN",
  "FARLIG_SITUASJON",
  "YRKESSYKDOM",
  "SKADE",
]);

export function getMainCategory(type: IncidentType): MainIncidentCategory {
  return ACCIDENT_BOOK_TYPES.has(type) ? "RUH" : "AVVIK";
}

export type IncidentTypeGroup =
  | "AVVIK"
  | "RUH"
  | "HMS"
  | "KVALITET"
  | "MILJO"
  | "CUSTOMER";

export interface IncidentTypeGroupDefinition {
  group: IncidentTypeGroup;
  types: readonly IncidentType[];
  /** Types kept for stored records that can no longer be selected in the form. */
  legacyTypes?: readonly IncidentType[];
}

/**
 * One UK track: accident book / RIDDOR first, then quality, environment, customer.
 * The ruhModuleEnabled argument is ignored (kept so existing callers compile).
 */
export const UK_ACCIDENT_BOOK_GROUPS: readonly IncidentTypeGroupDefinition[] = [
  {
    group: "HMS",
    types: ["ULYKKE", "NESTEN", "FARLIG_SITUASJON", "YRKESSYKDOM", "HMS"],
    legacyTypes: ["AVVIK", "SKADE"],
  },
  { group: "KVALITET", types: ["KVALITET"] },
  { group: "MILJO", types: ["MILJO"] },
  { group: "CUSTOMER", types: ["CUSTOMER"] },
];

export const AVVIK_ONLY_GROUPS = UK_ACCIDENT_BOOK_GROUPS;
export const RUH_MODE_GROUPS = UK_ACCIDENT_BOOK_GROUPS;

export function getIncidentTypeGroups(
  _ruhModuleEnabled?: boolean
): readonly IncidentTypeGroupDefinition[] {
  return UK_ACCIDENT_BOOK_GROUPS;
}

export function getIncidentTypesForGroup(
  group: IncidentTypeGroup,
  ruhModuleEnabled?: boolean
): readonly IncidentType[] {
  const definition = getIncidentTypeGroups(ruhModuleEnabled).find(
    (candidate) => candidate.group === group
  );
  return definition?.types ?? [];
}

/**
 * Finner gruppen en type hører til, også for typer som bare finnes i eldre data.
 * Returnerer null når typen ikke hører til noen gruppe i gjeldende oppsett.
 */
export function getIncidentTypeGroup(
  type: IncidentType | "",
  ruhModuleEnabled?: boolean
): IncidentTypeGroup | null {
  if (!type) return null;
  const definition = getIncidentTypeGroups(ruhModuleEnabled).find(
    (candidate) =>
      candidate.types.includes(type) || (candidate.legacyTypes?.includes(type) ?? false)
  );
  return definition?.group ?? null;
}

/**
 * Grupper med bare én type trenger ikke et eget typevalg – typen velges direkte.
 */
export function getSingleTypeForGroup(
  group: IncidentTypeGroup,
  ruhModuleEnabled?: boolean
): IncidentType | null {
  const types = getIncidentTypesForGroup(group, ruhModuleEnabled);
  return types.length === 1 ? types[0] : null;
}

export function getMainCategoryLabel(category: MainIncidentCategory): string {
  return category === "RUH" ? "Accident book" : "Other record";
}

export function getMainCategoryColor(category: MainIncidentCategory): string {
  return category === "RUH"
    ? "bg-orange-50 text-orange-700 border-orange-300"
    : "bg-blue-50 text-blue-700 border-blue-300";
}

/**
 * Get incident type label
 */
export function getIncidentTypeLabel(type: IncidentType): string {
  const labels: Record<IncidentType, string> = {
    AVVIK: "Non-conformance",
    NESTEN: "Near miss",
    ULYKKE: "Accident / injury",
    FARLIG_SITUASJON: "Unsafe condition / dangerous occurrence",
    YRKESSYKDOM: "Occupational disease",
    SKADE: "Personal injury",
    MILJO: "Environmental incident",
    KVALITET: "Quality non-conformance",
    HMS: "H&S non-conformance",
    CUSTOMER: "Customer complaint",
  };
  return labels[type];
}

/**
 * Get incident type color
 */
export function getIncidentTypeColor(type: IncidentType): string {
  const colors: Record<IncidentType, string> = {
    AVVIK: "bg-orange-100 text-orange-800 border-orange-300",
    NESTEN: "bg-yellow-100 text-yellow-800 border-yellow-300",
    ULYKKE: "bg-red-100 text-red-800 border-red-300",
    FARLIG_SITUASJON: "bg-amber-100 text-amber-800 border-amber-300",
    YRKESSYKDOM: "bg-pink-100 text-pink-800 border-pink-300",
    SKADE: "bg-red-100 text-red-800 border-red-300",
    MILJO: "bg-green-100 text-green-800 border-green-300",
    KVALITET: "bg-blue-100 text-blue-800 border-blue-300",
    HMS: "bg-teal-100 text-teal-800 border-teal-300",
    CUSTOMER: "bg-purple-100 text-purple-800 border-purple-300",
  };
  return colors[type];
}

export function getSeverityInfo(severity: number | null | undefined): { label: string; color: string; bgColor: string; textColor: string } {
  if (severity === null || severity === undefined) {
    return {
      label: "Not assessed",
      color: "text-slate-700",
      bgColor: "bg-slate-100 border-slate-300",
      textColor: "text-slate-700",
    };
  }
  if (severity >= 5) {
    return {
      label: "Critical",
      color: "text-red-900",
      bgColor: "bg-red-100 border-red-300",
      textColor: "text-red-900",
    };
  } else if (severity >= 4) {
    return {
      label: "Serious",
      color: "text-orange-900",
      bgColor: "bg-orange-100 border-orange-300",
      textColor: "text-orange-900",
    };
  } else if (severity >= 3) {
    return {
      label: "Moderate",
      color: "text-yellow-900",
      bgColor: "bg-yellow-100 border-yellow-300",
      textColor: "text-yellow-900",
    };
  } else if (severity >= 2) {
    return {
      label: "Minor",
      color: "text-blue-900",
      bgColor: "bg-blue-100 border-blue-300",
      textColor: "text-blue-900",
    };
  } else {
    return {
      label: "Negligible",
      color: "text-gray-900",
      bgColor: "bg-gray-100 border-gray-300",
      textColor: "text-gray-900",
    };
  }
}

export function getIncidentStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    OPEN: "Recorded",
    INVESTIGATING: "Under investigation",
    ACTION_TAKEN: "Action taken",
    CLOSED: "Closed",
  };
  return labels[status] || status;
}

/**
 * Get status color
 */
export function getIncidentStatusColor(status: string): string {
  const colors: Record<string, string> = {
    OPEN: "bg-red-100 text-red-800 border-red-300",
    INVESTIGATING: "bg-yellow-100 text-yellow-800 border-yellow-300",
    ACTION_TAKEN: "bg-blue-100 text-blue-800 border-blue-300",
    CLOSED: "bg-green-100 text-green-800 border-green-300",
  };
  return colors[status] || "bg-gray-100 text-gray-800 border-gray-300";
}

export function getIncidentStageLabel(stage: IncidentStage): string {
  const labels: Record<IncidentStage, string> = {
    REPORTED: "Reported",
    UNDER_REVIEW: "Under review",
    ROOT_CAUSE: "Root cause found",
    ACTIONS_DEFINED: "Actions planned",
    ACTIONS_COMPLETE: "Actions completed",
    VERIFIED: "Verified",
  };
  return labels[stage];
}

export function getRiddorCategoryLabel(category: string | null | undefined): string {
  const labels: Record<string, string> = {
    death: "Death — report to HSE without delay",
    specified_injury: "Specified injury — report within 10 days",
    over_seven_day: "Over-seven-day injury — report within 15 days",
    occupational_disease: "Occupational disease — RIDDOR 2013",
    dangerous_occurrence: "Dangerous occurrence — RIDDOR if listed",
  };
  if (!category) return "Not RIDDOR-reportable (accident book)";
  return labels[category] ?? category;
}

