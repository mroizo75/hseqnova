import type { ControlFrequency, RiskCategory, RiskStatus } from "@prisma/client";

/** MHSWR 1999 / ISO 45001: inherent (before controls) vs residual (after controls). */
export const RISK_LEVEL_LABELS: Record<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL", string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

export const RISK_STATUS_LABELS: Record<RiskStatus, string> = {
  OPEN: "Identified",
  MITIGATING: "Controls in progress",
  ACCEPTED: "Accepted",
  CLOSED: "Closed",
};

export const RISK_CATEGORY_LABELS: Record<RiskCategory, string> = {
  OPERATIONAL: "Operational",
  SAFETY: "Safety",
  HEALTH: "Health",
  ENVIRONMENTAL: "Environmental",
  INFORMATION_SECURITY: "Information security",
  LEGAL: "Legal",
  STRATEGIC: "Strategic",
  PSYCHOSOCIAL: "Psychosocial",
  ERGONOMIC: "Ergonomic",
  ORGANISATIONAL: "Organisational",
  PHYSICAL: "Physical",
};

export const CONTROL_FREQUENCY_LABELS: Record<ControlFrequency, string> = {
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  QUARTERLY: "Quarterly",
  ANNUAL: "Annual",
  BIENNIAL: "Biennial",
};

export const LIKELIHOOD_SCALE: Record<number, string> = {
  1: "Very unlikely",
  2: "Unlikely",
  3: "Possible",
  4: "Likely",
  5: "Almost certain",
};

export const CONSEQUENCE_SCALE: Record<number, string> = {
  1: "Negligible",
  2: "Minor",
  3: "Moderate",
  4: "Major",
  5: "Catastrophic",
};

export function formatRiskDate(value?: Date | string | null): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
