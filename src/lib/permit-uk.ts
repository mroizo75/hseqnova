/**
 * Permit to work — UK legal basis.
 *
 * There is no named “Permit to Work Regulation”. The duty is a safe system of
 * work (HSWA 1974 s.2) and a suitable and sufficient risk assessment
 * (MHSWR 1999 reg.3). A permit is the written control that says what work is
 * done, when, where, and which parts are safe.
 *
 * Confined Spaces Regulations 1997:
 *   reg.4 — do not enter unless it is not reasonably practicable to avoid it;
 *           then a safe system of work.
 *   reg.5 — suitable and sufficient emergency / rescue arrangements before
 *           anyone enters. Absolute — not created by the permit form.
 * ACOP L101 / INDG258: a permit-to-work is usually required where there is a
 * reasonably foreseeable risk of serious injury. Essential features include
 * who may authorise the job and who specifies the precautions.
 *
 * HSG250 is HSE guidance (not law) on permit systems: time-limited, issued by
 * a competent person, accepted by the person in charge of the work, closed
 * when finished. Records stay with the employer — they are not submitted to
 * the HSE. CDM 2015 does not name a permit form (the CPP is a separate duty).
 *
 * Official: legislation.gov.uk/uksi/1997/1713/regulation/5
 *           hse.gov.uk/pubns/indg258.pdf
 *           hse.gov.uk/pubns/books/hsg250.htm
 */

export const PERMIT_TYPES = {
  HOT_WORK: "Hot work",
  CONFINED_SPACE: "Confined space",
  WORKING_AT_HEIGHT: "Working at height",
  EXCAVATION: "Excavation",
  ELECTRICAL: "Electrical",
  GENERAL: "General",
} as const;

export type PermitTypeKey = keyof typeof PERMIT_TYPES;

export const PERMIT_TYPE_KEYS = Object.keys(PERMIT_TYPES) as PermitTypeKey[];

export function permitTypeLabel(type: string): string {
  return PERMIT_TYPES[type as PermitTypeKey] ?? type;
}

export function isPermitType(value: string): value is PermitTypeKey {
  return value in PERMIT_TYPES;
}

export type PermitPayload = {
  description: string;
  hazards: string;
  controlMeasures: string;
  isolationsRequired: string;
  ppeRequired: string[];
  emergencyArrangements: string;
  issuerName: string;
  acceptorName: string;
  issuedAt: string | null;
};

const emptyPayload = (): PermitPayload => ({
  description: "",
  hazards: "",
  controlMeasures: "",
  isolationsRequired: "",
  ppeRequired: [],
  emergencyArrangements: "",
  issuerName: "",
  acceptorName: "",
  issuedAt: null,
});

export function parsePermitPayload(raw: string | null | undefined): PermitPayload {
  const base = emptyPayload();
  if (!raw?.trim()) return base;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      description: typeof parsed.description === "string" ? parsed.description : "",
      hazards: typeof parsed.hazards === "string" ? parsed.hazards : "",
      controlMeasures: typeof parsed.controlMeasures === "string" ? parsed.controlMeasures : "",
      isolationsRequired:
        typeof parsed.isolationsRequired === "string" ? parsed.isolationsRequired : "",
      ppeRequired: Array.isArray(parsed.ppeRequired)
        ? parsed.ppeRequired.filter((item): item is string => typeof item === "string")
        : [],
      emergencyArrangements:
        typeof parsed.emergencyArrangements === "string" ? parsed.emergencyArrangements : "",
      issuerName: typeof parsed.issuerName === "string" ? parsed.issuerName : "",
      acceptorName: typeof parsed.acceptorName === "string" ? parsed.acceptorName : "",
      issuedAt: typeof parsed.issuedAt === "string" ? parsed.issuedAt : null,
    };
  } catch {
    return base;
  }
}

export function serializePermitPayload(payload: PermitPayload): string {
  return JSON.stringify(payload);
}

type ActionResult = { ok: true } | { ok: false; code: string; message: string };

export function validatePermitCreate(input: {
  type?: string | null;
  title?: string | null;
  location?: string | null;
  validFrom?: Date | string | null;
  validTo?: Date | string | null;
  description?: string | null;
  hazards?: string | null;
  controlMeasures?: string | null;
  emergencyArrangements?: string | null;
}): ActionResult {
  if (!input.type || !isPermitType(input.type)) {
    return { ok: false, code: "PERMIT_TYPE_REQUIRED", message: "Select the type of permit." };
  }
  if ((input.title?.trim() ?? "").length < 3) {
    return {
      ok: false,
      code: "PERMIT_TITLE_REQUIRED",
      message: "Give the permit a title (HSG250 — say exactly what work is to be done).",
    };
  }
  if (!(input.location?.trim())) {
    return {
      ok: false,
      code: "PERMIT_LOCATION_REQUIRED",
      message: "Say where the work will take place.",
    };
  }
  const from = toDate(input.validFrom);
  const to = toDate(input.validTo);
  if (!from) {
    return {
      ok: false,
      code: "PERMIT_FROM_REQUIRED",
      message: "Set when the permit starts.",
    };
  }
  if (!to) {
    return {
      ok: false,
      code: "PERMIT_UNTIL_REQUIRED",
      message: "Set when the permit ends (HSG250 — permits are time-limited).",
    };
  }
  if (to.getTime() <= from.getTime()) {
    return {
      ok: false,
      code: "PERMIT_UNTIL_INVALID",
      message: "Valid-to must be after valid-from.",
    };
  }
  if ((input.description?.trim() ?? "").length < 10) {
    return {
      ok: false,
      code: "PERMIT_WORK_REQUIRED",
      message: "Describe the work (HSWA 1974 s.2 — a safe system of work).",
    };
  }
  if ((input.hazards?.trim() ?? "").length < 3) {
    return {
      ok: false,
      code: "PERMIT_HAZARDS_REQUIRED",
      message: "Record the hazards (MHSWR 1999 reg.3).",
    };
  }
  if ((input.controlMeasures?.trim() ?? "").length < 3) {
    return {
      ok: false,
      code: "PERMIT_CONTROLS_REQUIRED",
      message: "Record the control measures (MHSWR 1999 reg.3).",
    };
  }
  if (input.type === "CONFINED_SPACE" && (input.emergencyArrangements?.trim() ?? "").length < 10) {
    return {
      ok: false,
      code: "PERMIT_RESCUE_REQUIRED",
      message:
        "Record emergency and rescue arrangements before anyone enters (Confined Spaces Regulations 1997 reg.5).",
    };
  }
  return { ok: true };
}

export function validatePermitIssue(input: {
  type: string;
  validTo?: Date | string | null;
  location?: string | null;
  payload: PermitPayload;
  issuerName?: string | null;
  acceptorName?: string | null;
}): ActionResult {
  const content = validatePermitCreate({
    type: input.type,
    title: "Permit",
    location: input.location,
    validFrom: new Date("2000-01-01T00:00:00Z"),
    validTo: input.validTo ?? new Date("2099-01-01T00:00:00Z"),
    description: input.payload.description,
    hazards: input.payload.hazards,
    controlMeasures: input.payload.controlMeasures,
    emergencyArrangements: input.payload.emergencyArrangements,
  });
  if (!content.ok) {
    return content;
  }
  if (!toDate(input.validTo)) {
    return {
      ok: false,
      code: "PERMIT_UNTIL_REQUIRED",
      message: "Set when the permit ends before it is issued (HSG250 — permits are time-limited).",
    };
  }
  if (!(input.issuerName?.trim())) {
    return {
      ok: false,
      code: "PERMIT_ISSUER_REQUIRED",
      message: "Name the person who authorises this permit (INDG258 — who may authorise the job).",
    };
  }
  if (!(input.acceptorName?.trim())) {
    return {
      ok: false,
      code: "PERMIT_ACCEPTOR_REQUIRED",
      message: "Name the person in charge of the work (HSG250 — the acceptor).",
    };
  }
  return { ok: true };
}

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function isPermitLiveForWorkforce(status: string): boolean {
  return status === "ISSUED" || status === "CLOSED";
}
