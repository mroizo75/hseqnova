/**
 * MHSWR 1999 reg.3 — suitable and sufficient risk assessment.
 * HSE: identify hazards, who might be harmed, existing controls, further action, review.
 * https://www.hse.gov.uk/simple-health-safety/risk/steps-needed-to-manage-risk.htm
 * Record (5+ employees): significant findings + any group especially at risk (reg.3(6)).
 */

export const RISK_WHO_KEYS = [
  "employees",
  "young_persons",
  "new_expectant_mothers",
  "disabled",
  "migrant",
  "contractors",
  "visitors_public",
] as const;

export type RiskWhoKey = (typeof RISK_WHO_KEYS)[number];

/** MHSWR reg.3(6)(b) / HSE vulnerable workers. */
export const RISK_ESPECIALLY_AT_RISK_KEYS = [
  "young_persons",
  "new_expectant_mothers",
  "disabled",
  "migrant",
] as const;

export const RISK_WHO_META: Record<
  RiskWhoKey,
  { label: string; legalRef: string; especiallyAtRisk: boolean }
> = {
  employees: {
    label: "Employees",
    legalRef: "MHSWR 1999 reg.3(1)(a)",
    especiallyAtRisk: false,
  },
  young_persons: {
    label: "Young persons",
    legalRef: "MHSWR 1999 reg.3(4)–(5)",
    especiallyAtRisk: true,
  },
  new_expectant_mothers: {
    label: "New or expectant mothers",
    legalRef: "MHSWR 1999 regs 16–18",
    especiallyAtRisk: true,
  },
  disabled: {
    label: "Workers with a disability",
    legalRef: "HSE — workers with particular requirements",
    especiallyAtRisk: true,
  },
  migrant: {
    label: "Migrant workers",
    legalRef: "HSE — workers with particular requirements",
    especiallyAtRisk: true,
  },
  contractors: {
    label: "Contractors",
    legalRef: "MHSWR 1999 reg.3(1)(b)",
    especiallyAtRisk: false,
  },
  visitors_public: {
    label: "Visitors / members of the public",
    legalRef: "MHSWR 1999 reg.3(1)(b)",
    especiallyAtRisk: false,
  },
};

const NONE_IDENTIFIED = "none";

export function parseGroupsAtRisk(raw: string | null | undefined): string[] {
  if (raw == null || raw.trim() === "") return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return raw.split(",").map((item) => item.trim()).filter(Boolean);
  }
}

export function serializeGroupsAtRisk(keys: string[] | string | null | undefined): string {
  const list = Array.isArray(keys)
    ? keys
    : typeof keys === "string" && keys.trim()
      ? [keys]
      : [];
  const unique = [...new Set(list.filter(Boolean))];
  return JSON.stringify(unique);
}

export function formatGroupsAtRiskLabels(raw: string | null | undefined): string[] {
  return parseGroupsAtRisk(raw).map((key) => {
    if (key === NONE_IDENTIFIED) return "None identified";
    return RISK_WHO_META[key as RiskWhoKey]?.label ?? key;
  });
}

export function groupsAtRiskIsRecorded(raw: string | null | undefined): boolean {
  return raw != null && raw.trim() !== "";
}

export function hasSignificantFindings(risk: {
  title?: string | null;
  context?: string | null;
  existingControls?: string | null;
}): boolean {
  const title = (risk.title ?? "").trim();
  const context = (risk.context ?? "").trim();
  const controls = (risk.existingControls ?? "").trim();
  return title.length >= 3 && context.length >= 10 && controls.length >= 8;
}

export type MhswrRecordCheck = {
  significantFindings: boolean;
  groupsRecorded: boolean;
  reviewRecorded: boolean;
  consulted: boolean;
  complete: boolean;
};

export function assessMhswrRecord(input: {
  risks: Array<{ title?: string | null; context?: string | null; existingControls?: string | null; nextReviewDate?: Date | string | null }>;
  groupsAtRisk?: string | null;
  participants?: string | null;
  reviewedAt?: Date | string | null;
}): MhswrRecordCheck {
  const significantFindings = input.risks.some(hasSignificantFindings);
  const groupsRecorded = groupsAtRiskIsRecorded(input.groupsAtRisk);
  const reviewRecorded =
    Boolean(input.reviewedAt) ||
    input.risks.some((risk) => Boolean(risk.nextReviewDate));
  const consulted = Boolean(input.participants?.trim());
  return {
    significantFindings,
    groupsRecorded,
    reviewRecorded,
    consulted,
    complete: significantFindings && groupsRecorded && reviewRecorded,
  };
}

export { NONE_IDENTIFIED as GROUPS_NONE_IDENTIFIED };
