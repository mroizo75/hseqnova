/**
 * Workplace inspections — UK legal basis.
 * Prisma enum values stay Norwegian (VERNERUNDE etc.). Labels only change here.
 *
 * MHSWR 1999 reg.5 — monitor preventive and protective measures; write the
 * arrangements down if there are five or more employees.
 * SRSCWR 1977 reg.5 — union safety representatives may inspect every three months.
 * SRSCWR 1977 reg.6 — inspection after a notifiable accident, occurrence or disease.
 * HSE F2534 — record that a safety representative inspection took place.
 * HSE F2533 — notify the employer of unsafe or unhealthy conditions.
 * These records are kept internally. They are not submitted to the HSE.
 */

export const INSPECTION_TYPE_LABELS = {
  VERNERUNDE: "Workplace inspection",
  HMS_INSPEKSJON: "Management inspection",
  SHA_PLAN: "Construction site inspection",
  SIKKERHETSVANDRING: "Safety representative inspection",
  ANDRE: "Statutory / other",
  BRANNØVELSE: "Fire drill",
} as const;

export type InspectionTypeKey = keyof typeof INSPECTION_TYPE_LABELS;

export function inspectionTypeLabel(type: string): string {
  return INSPECTION_TYPE_LABELS[type as InspectionTypeKey] ?? type;
}

/** Why the inspection is taking place. Prisma type enum stays Norwegian. */
export const INSPECTION_LEGAL_BASIS = {
  monitoring: {
    label: "Employer monitoring",
    legalRef: "MHSWR 1999 reg.5",
  },
  safety_rep: {
    label: "Safety representative inspection (three-monthly)",
    legalRef: "SRSCWR 1977 reg.5(1)",
  },
  after_change: {
    label: "Inspection after a substantial change in work",
    legalRef: "SRSCWR 1977 reg.5(2)",
  },
  after_accident: {
    label: "Inspection after a notifiable accident, occurrence or disease",
    legalRef: "SRSCWR 1977 reg.6",
  },
  cdm_monitor: {
    label: "Construction phase monitoring",
    legalRef: "CDM 2015",
  },
} as const;

export type InspectionLegalBasisKey = keyof typeof INSPECTION_LEGAL_BASIS;

export const INSPECTION_LEGAL_BASIS_KEYS = Object.keys(
  INSPECTION_LEGAL_BASIS,
) as InspectionLegalBasisKey[];

export function defaultLegalBasisForType(type: string): InspectionLegalBasisKey {
  if (type === "SIKKERHETSVANDRING") return "safety_rep";
  if (type === "SHA_PLAN") return "cdm_monitor";
  return "monitoring";
}

export function resolveLegalBasis(
  raw: string | null | undefined,
  type: string,
): InspectionLegalBasisKey {
  if (raw && raw in INSPECTION_LEGAL_BASIS) {
    return raw as InspectionLegalBasisKey;
  }
  return defaultLegalBasisForType(type);
}

export function legalBasisLabel(raw: string | null | undefined, type: string): string {
  const key = resolveLegalBasis(raw, type);
  const meta = INSPECTION_LEGAL_BASIS[key];
  return `${meta.label} (${meta.legalRef})`;
}

export interface InspectionRecordInput {
  scheduledDate?: string | null;
  location?: string | null;
  conductedBy?: string | null;
}

export function validateInspectionRecord(
  input: InspectionRecordInput,
): { ok: true } | { ok: false; code: string; message: string } {
  if (!input.scheduledDate || String(input.scheduledDate).trim().length === 0) {
    return {
      ok: false,
      code: "INSPECTION_DATE_REQUIRED",
      message: "Date and time of the inspection are required (HSE F2534).",
    };
  }
  if (!input.location || String(input.location).trim().length === 0) {
    return {
      ok: false,
      code: "INSPECTION_LOCATION_REQUIRED",
      message: "Area of the workplace inspected is required (HSE F2534).",
    };
  }
  if (!input.conductedBy || String(input.conductedBy).trim().length === 0) {
    return {
      ok: false,
      code: "INSPECTION_INSPECTOR_REQUIRED",
      message: "Name of the person taking part in the inspection is required (HSE F2534).",
    };
  }
  return { ok: true };
}

export interface InspectionFindingInput {
  title?: string | null;
  description?: string | null;
  responsibleId?: string | null;
  dueDate?: string | null;
}

export function validateInspectionFinding(
  input: InspectionFindingInput,
): { ok: true } | { ok: false; code: string; message: string } {
  if (!input.title || String(input.title).trim().length === 0) {
    return { ok: false, code: "FINDING_TITLE_REQUIRED", message: "Describe the unsafe or unhealthy condition." };
  }
  if (!input.description || String(input.description).trim().length === 0) {
    return { ok: false, code: "FINDING_DETAIL_REQUIRED", message: "Record what was found and why it matters." };
  }
  if (!input.responsibleId || String(input.responsibleId).trim().length === 0) {
    return {
      ok: false,
      code: "FINDING_OWNER_REQUIRED",
      message: "Name who will follow this up (HSE expects the employer to decide action).",
    };
  }
  if (!input.dueDate || String(input.dueDate).trim().length === 0) {
    return {
      ok: false,
      code: "FINDING_DUE_REQUIRED",
      message: "Set a due date for the action.",
    };
  }
  return { ok: true };
}
