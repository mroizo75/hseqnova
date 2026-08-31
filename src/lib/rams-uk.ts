/**
 * RAMS — risk assessment and method statement.
 *
 * MHSWR 1999 reg.3 — suitable and sufficient risk assessment: identify the
 * hazards, who might be harmed and how, and the existing / further controls.
 * Record the significant findings where there are five or more employees.
 *
 * A method statement is industry practice, not a named statutory form. Combined
 * with the risk assessment it is RAMS. Without a method of work the record is
 * only a risk assessment.
 *
 * CDM 2015 reg.15 — contractors must plan, manage and monitor construction work
 * and inform workers of the risks. Task-level RAMS is evidence the principal
 * contractor uses to coordinate (regs 13 and 15). The Construction Phase Plan
 * (reg.12) is a separate duty — not this module.
 *
 * MHSWR 1999 reg.10 / reg.13 — give employees comprehensible information on
 * the risks and the preventive and protective measures; brief them before work.
 *
 * There is no statutory RAMS form. Records stay with the employer — they are
 * not submitted to the HSE.
 *
 * Official: legislation.gov.uk/uksi/1999/3242/regulation/3
 *           legislation.gov.uk/uksi/2015/51/regulation/15
 *           hse.gov.uk/simple-health-safety/risk/index.htm
 */

export const RAMS_METHOD_MIN_CHARS = 20;
export const RAMS_HARM_MIN_CHARS = 3;

export const RAMS_METHOD_REQUIRED_MESSAGE =
  "Describe the method of work (at least 20 characters). A RAMS without a method is only a risk assessment.";

export const RAMS_HARM_REQUIRED_MESSAGE =
  "Say how someone might be harmed (MHSWR 1999 — significant findings).";

export function validateRamsMethod(
  raw: string | null | undefined,
): { ok: true; method: string } | { ok: false; code: string; message: string } {
  const method = raw?.trim() ?? "";
  if (method.length < RAMS_METHOD_MIN_CHARS) {
    return {
      ok: false,
      code: "RAMS_METHOD_REQUIRED",
      message: RAMS_METHOD_REQUIRED_MESSAGE,
    };
  }
  return { ok: true, method };
}

export function validateWhoMightBeHarmed(
  raw: string | null | undefined,
): { ok: true; consequence: string } | { ok: false; code: string; message: string } {
  const consequence = raw?.trim() ?? "";
  if (consequence.length < RAMS_HARM_MIN_CHARS) {
    return {
      ok: false,
      code: "RAMS_HARM_REQUIRED",
      message: RAMS_HARM_REQUIRED_MESSAGE,
    };
  }
  return { ok: true, consequence };
}
