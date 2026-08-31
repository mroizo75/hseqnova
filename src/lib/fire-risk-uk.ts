/**
 * Fire risk assessment — UK legal basis.
 *
 * Regulatory Reform (Fire Safety) Order 2005 art.9: the responsible person
 * must make a suitable and sufficient assessment of the risks to relevant
 * persons, to identify the general fire precautions they need to take.
 * Review it regularly and when the premises or the work changes.
 *
 * Building Safety Act 2022 s.156 amended the Order: record the completed
 * assessment in full (not only “significant findings”), record fire safety
 * arrangements in all circumstances, record the responsible person’s name
 * and a UK address, and record the name (and organisation, if any) of anyone
 * engaged to carry out or review the assessment.
 *
 * Art.15 (procedures, nominated persons, drills) is the same Order — not a
 * second product. Official:
 *   legislation.gov.uk/uksi/2005/1541/article/9
 *   gov.uk/government/publications/check-your-fire-safety-responsibilities-under-section-156-of-the-building-safety-act-2022
 */

export type FireRiskRecordInput = {
  buildingName?: string | null;
  responsiblePersonName?: string | null;
  responsiblePersonAddress?: string | null;
  assessorName?: string | null;
  peopleAtRisk?: string | null;
  fireDetection?: string | null;
  fireAlarmSystem?: string | null;
  emergencyLighting?: string | null;
  fireExtinguishers?: string | null;
  escapeRoutes?: string | null;
  signage?: string | null;
  reviewDate?: Date | string | null;
};

function hasText(value: string | null | undefined): boolean {
  return Boolean(value && value.trim().length > 0);
}

function peopleAtRiskRecorded(raw: string | null | undefined): boolean {
  if (!raw?.trim()) return false;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return false;
    return Object.values(parsed as Record<string, unknown>).some((value) => value === true);
  } catch {
    return false;
  }
}

export function validateFireRiskRecorded(
  input: FireRiskRecordInput,
): { ok: true } | { ok: false; code: string; message: string } {
  if (!hasText(input.buildingName)) {
    return { ok: false, code: "FRA_BUILDING_REQUIRED", message: "Name the premises being assessed." };
  }
  if ((input.responsiblePersonName?.trim() ?? "").length < 2) {
    return {
      ok: false,
      code: "FRA_RP_NAME_REQUIRED",
      message:
        "Record the responsible person’s name (Fire Safety Order art.3; Building Safety Act 2022 s.156).",
    };
  }
  if ((input.responsiblePersonAddress?.trim() ?? "").length < 8) {
    return {
      ok: false,
      code: "FRA_RP_ADDRESS_REQUIRED",
      message: "Record a UK address for the responsible person (Building Safety Act 2022 s.156).",
    };
  }
  if ((input.assessorName?.trim() ?? "").length < 2) {
    return {
      ok: false,
      code: "FRA_ASSESSOR_REQUIRED",
      message:
        "Record who carried out or reviewed this assessment (Building Safety Act 2022 s.156).",
    };
  }
  if (!peopleAtRiskRecorded(input.peopleAtRisk)) {
    return {
      ok: false,
      code: "FRA_PEOPLE_REQUIRED",
      message:
        "Identify who is at risk, including any group especially at risk (art.9; GOV.UK 5-step checklist).",
    };
  }
  const hasArrangements = [
    input.fireDetection,
    input.fireAlarmSystem,
    input.emergencyLighting,
    input.fireExtinguishers,
    input.escapeRoutes,
    input.signage,
  ].some((value) => hasText(value));
  if (!hasArrangements) {
    return {
      ok: false,
      code: "FRA_ARRANGEMENTS_REQUIRED",
      message: "Record the fire safety arrangements for these premises (art.9 as amended by s.156).",
    };
  }
  if (!input.reviewDate) {
    return {
      ok: false,
      code: "FRA_REVIEW_REQUIRED",
      message: "Set a review date. The assessment must be kept up to date (art.9(3)).",
    };
  }
  return { ok: true };
}
