/**
 * COSHH health record — UK legal basis.
 *
 * COSHH 2002 reg.11(1)–(2) — where it is appropriate for the protection of
 * employees who are or may be exposed, they must be under suitable health
 * surveillance (identifiable disease or adverse effect, reasonable likelihood,
 * valid low-risk technique; or Schedule 6 substances/processes).
 *
 * COSHH 2002 reg.11(3) — make and maintain a health record containing
 * particulars approved by the Executive; keep it available for at least 40
 * years from the date of the last entry.
 *
 * COSHH 2002 reg.11(4) — on reasonable notice, give the employee access to
 * their personal health record. Provide copies to the appropriate authority
 * if required. If the employer ceases to trade, notify the HSE and make the
 * records available. Do not send the record to the HSE in the ordinary course.
 *
 * HSE health-record particulars (G401 / COSHH FAQ): name, home address,
 * National Insurance number; substance or process and how often; protective
 * measures; date exposure started; fitness-for-work statement. Do not store
 * clinical test data — those stay with occupational health (medical record).
 *
 * Official: legislation.gov.uk/uksi/2002/2677/regulation/11
 *           hse.gov.uk/health-surveillance/record-keeping.htm
 *           hse.gov.uk/coshh/faq.htm
 */

export const COSHH_HEALTH_RECORD_YEARS = 40;

export const FITNESS_FOR_WORK = {
  PENDING: "Not yet assessed",
  FIT: "Fit for this work",
  FIT_WITH_RESTRICTIONS: "Fit with restrictions",
  UNFIT: "Not fit for this work",
} as const;

export type FitnessForWork = keyof typeof FITNESS_FOR_WORK;

const FITNESS_KEYS = new Set(Object.keys(FITNESS_FOR_WORK));

export function isFitnessForWork(value: string | null | undefined): value is FitnessForWork {
  return Boolean(value && FITNESS_KEYS.has(value));
}

export function fitnessForWorkLabel(value: string | null | undefined): string {
  if (value && isFitnessForWork(value)) return FITNESS_FOR_WORK[value];
  return "Not recorded";
}

export function validateHealthRecord(input: {
  employeeName?: string | null;
  homeAddress?: string | null;
  exposureAgent?: string | null;
  exposureStartDate?: Date | string | null;
  duration?: string | null;
  ppeUsed?: string | null;
  healthCheckRequired?: boolean;
  healthCheckDone?: boolean;
  fitnessForWork?: string | null;
}): { ok: true } | { ok: false; code: string; message: string } {
  if ((input.employeeName?.trim() ?? "").length < 2) {
    return {
      ok: false,
      code: "HEALTH_RECORD_NAME_REQUIRED",
      message: "Record the employee’s name (HSE health-record particulars).",
    };
  }
  if ((input.homeAddress?.trim() ?? "").length < 5) {
    return {
      ok: false,
      code: "HEALTH_RECORD_ADDRESS_REQUIRED",
      message:
        "Record the employee’s home address (HSE health-record particulars — name, address and National Insurance number).",
    };
  }
  if ((input.exposureAgent?.trim() ?? "").length < 2) {
    return {
      ok: false,
      code: "HEALTH_RECORD_SUBSTANCE_REQUIRED",
      message: "Name the substance or process they work with (COSHH 2002 reg.11).",
    };
  }
  if (!input.exposureStartDate) {
    return {
      ok: false,
      code: "HEALTH_RECORD_START_REQUIRED",
      message: "Record when exposure started (HSE health-record particulars).",
    };
  }
  if ((input.duration?.trim() ?? "").length < 3) {
    return {
      ok: false,
      code: "HEALTH_RECORD_FREQUENCY_REQUIRED",
      message: "Say how often they are exposed (HSE — frequency of use).",
    };
  }
  if ((input.ppeUsed?.trim() ?? "").length < 3) {
    return {
      ok: false,
      code: "HEALTH_RECORD_PPE_REQUIRED",
      message: "Record the protective measures provided (HSE health-record particulars).",
    };
  }
  if (input.healthCheckRequired) {
    if (!isFitnessForWork(input.fitnessForWork ?? null)) {
      return {
        ok: false,
        code: "HEALTH_RECORD_FITNESS_REQUIRED",
        message:
          "Record the fitness-for-work statement (HSE). Do not store clinical test results on this record.",
      };
    }
    if (input.healthCheckDone && input.fitnessForWork === "PENDING") {
      return {
        ok: false,
        code: "HEALTH_RECORD_FITNESS_CONCLUSION",
        message:
          "When surveillance is completed, record whether the person is fit, fit with restrictions, or not fit.",
      };
    }
  }
  return { ok: true };
}
