/**
 * Training and competence — UK legal basis.
 *
 * HSWA 1974 s.2(2)(c) — information, instruction, training and supervision
 *   as is necessary, so far as is reasonably practicable.
 * MHSWR 1999 reg.13(1) — take capabilities into account when entrusting tasks.
 * MHSWR 1999 reg.13(2) — adequate H&S training on recruitment and when
 *   exposed to new or increased risks (change of role, new equipment,
 *   new technology, new system of work).
 * MHSWR 1999 reg.13(3) — repeated periodically where appropriate; adapted
 *   to new or changed risks; during working hours.
 *
 * There is no statutory training form. HSE: keep records so you can decide
 * when refresher training is needed. Records stay with the employer — they
 * are not submitted to the HSE.
 * Official: hse.gov.uk/simple-health-safety/training/decide.htm
 *           legislation.gov.uk/uksi/1999/3242/regulation/13
 */

export const PERSONNEL_DOCUMENT_TYPES = [
  {
    key: "cv",
    title: "Curriculum vitae (CV)",
    provider: "Personnel file",
    expires: false,
  },
  {
    key: "diploma",
    title: "Diploma / qualification",
    provider: "Awarding body",
    expires: false,
  },
  {
    key: "certificate",
    title: "Certificate",
    provider: "Training provider",
    expires: true,
  },
] as const;

export type PersonnelDocumentTypeKey = (typeof PERSONNEL_DOCUMENT_TYPES)[number]["key"];

/** Why this training was given — MHSWR 1999 reg.13(2) and (3). */
export const MHSWR_TRAINING_REASONS = {
  recruitment: {
    label: "On recruitment / induction",
    legalRef: "MHSWR 1999 reg.13(2)(a)",
  },
  change_of_role: {
    label: "Change of job or extra responsibilities",
    legalRef: "MHSWR 1999 reg.13(2)(b)(i)",
  },
  new_equipment: {
    label: "New or changed work equipment",
    legalRef: "MHSWR 1999 reg.13(2)(b)(ii)",
  },
  new_technology: {
    label: "New technology",
    legalRef: "MHSWR 1999 reg.13(2)(b)(iii)",
  },
  new_system_of_work: {
    label: "New or changed system of work",
    legalRef: "MHSWR 1999 reg.13(2)(b)(iv)",
  },
  periodic: {
    label: "Periodic refresher",
    legalRef: "MHSWR 1999 reg.13(3)(a)",
  },
} as const;

export const MHSWR_TRAINING_REASON_KEYS = [
  "recruitment",
  "change_of_role",
  "new_equipment",
  "new_technology",
  "new_system_of_work",
  "periodic",
] as const;

export type MhswrTrainingReason = (typeof MHSWR_TRAINING_REASON_KEYS)[number];

export function isMhswrTrainingReason(value: string | null | undefined): value is MhswrTrainingReason {
  return Boolean(value && value in MHSWR_TRAINING_REASONS);
}

export function mhswrReasonLabel(raw: string | null | undefined): string {
  if (isMhswrTrainingReason(raw)) {
    const meta = MHSWR_TRAINING_REASONS[raw];
    return `${meta.label} (${meta.legalRef})`;
  }
  return "Not recorded";
}

export function validateTrainingMhswrReason(
  raw: string | null | undefined,
): { ok: true; reason: MhswrTrainingReason } | { ok: false; code: string; message: string } {
  if (!isMhswrTrainingReason(raw)) {
    return {
      ok: false,
      code: "MHSWR_REASON_REQUIRED",
      message:
        "Say why this training was given (MHSWR 1999 reg.13 — recruitment, new or increased risk, or periodic refresher).",
    };
  }
  return { ok: true, reason: raw };
}

export function formatTrainingDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB");
}
