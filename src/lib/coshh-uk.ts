/**
 * COSHH register and assessment — UK legal basis.
 *
 * COSHH 2002 reg.6 — do not carry out work liable to expose employees to a
 * substance hazardous to health unless a suitable and sufficient assessment
 * of the risk, and of the steps needed to meet the Regulations, has been
 * made and those steps implemented. Record the significant findings and the
 * steps taken to meet reg.7 where there are five or more employees.
 *
 * COSHH 2002 reg.7 — prevent exposure, or where that is not reasonably
 * practicable, adequately control it.
 *
 * COSHH 2002 reg.12 — give employees the names of the substances, the risk,
 * access to the safety data sheet, the significant findings of the assessment,
 * and the precautions they must take.
 *
 * A safety data sheet is the first stage of the assessment. It is not a
 * substitute for a COSHH assessment (HSE COSHH FAQ).
 *
 * Health surveillance and 40-year health records are COSHH 2002 reg.11 —
 * that record sits in the exposure register (a separate module).
 *
 * Official: legislation.gov.uk/uksi/2002/2677/regulation/6
 *           legislation.gov.uk/uksi/2002/2677/regulation/12
 *           hse.gov.uk/coshh/basics/assessment.htm
 */

export function validateCoshhAssessment(input: {
  chemicalId?: string | null;
  taskDescription?: string | null;
  exposureRoutes?: string | null;
  existingControls?: string | null;
}): { ok: true } | { ok: false; code: string; message: string } {
  if (!(input.chemicalId?.trim())) {
    return {
      ok: false,
      code: "COSHH_SUBSTANCE_REQUIRED",
      message:
        "Name the hazardous substance from the COSHH register (COSHH 2002 reg.6 — identify the substances).",
    };
  }
  if ((input.taskDescription?.trim() ?? "").length < 10) {
    return {
      ok: false,
      code: "COSHH_TASK_REQUIRED",
      message:
        "Describe the task (COSHH 2002 reg.6 — the assessment is of the work, not only the product).",
    };
  }
  if ((input.exposureRoutes?.trim() ?? "").length < 3) {
    return {
      ok: false,
      code: "COSHH_ROUTES_REQUIRED",
      message: "Say how people may be exposed (COSHH 2002 reg.6(2)).",
    };
  }
  if ((input.existingControls?.trim() ?? "").length < 3) {
    return {
      ok: false,
      code: "COSHH_CONTROLS_REQUIRED",
      message:
        "Record the steps taken to prevent or control exposure (COSHH 2002 regs 6(4)(b) and 7).",
    };
  }
  return { ok: true };
}
