/**
 * Using contractors — UK legal basis.
 *
 * HSWA 1974 s.3 — conduct the undertaking so that persons not in your
 * employment who may be affected are not exposed to risks, so far as is
 * reasonably practicable. Selecting a suitable contractor and controlling
 * the work is how this duty is met.
 *
 * MHSWR 1999 reg.11 — where two or more employers share a workplace,
 * co-operate, co-ordinate measures, and inform the other of risks arising
 * from your undertaking.
 *
 * MHSWR 1999 reg.12 — give the employer of people from an outside
 * undertaking comprehensible information on the risks from your work and
 * the measures you have taken, and give those people appropriate
 * instructions, including how to identify the person nominated to implement
 * evacuation procedures.
 *
 * INDG368 / HSG159 (guidance, not a named statutory form): identify the job;
 * select a contractor who can do it safely; assess the risks together;
 * provide information; co-operate and supervise in proportion to the risk.
 *
 * CDM 2015 reg.8 — for construction work, skills, knowledge, experience and
 * organisational capability. SSIP / CHAS is one way to show organisational
 * capability at pre-qualification; it is not a legal requirement and is not
 * proof they can manage this job (HSE competence / L153). Construction
 * duty holders stay in the CDM module.
 *
 * MHSWR 1999 reg.7 is the host's own competent person — not a contractor
 * appointment. Employers' Liability (Compulsory Insurance) Act 1969 is the
 * contractor's duty if they have employees; checking a certificate is good
 * practice, not a named client form.
 *
 * Official: legislation.gov.uk/ukpga/1974/37/section/3
 *           legislation.gov.uk/uksi/1999/3242/regulation/12
 *           hse.gov.uk/pubns/indg368.htm
 *           hse.gov.uk/competence/accreditation-schemes.htm
 */

export function validateContractorRegistration(input: {
  companyName?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  workToBeDone?: string | null;
}): { ok: true } | { ok: false; code: string; message: string } {
  if (!(input.companyName?.trim())) {
    return { ok: false, code: "CONTRACTOR_NAME_REQUIRED", message: "Company name is required." };
  }
  if (!(input.contactName?.trim())) {
    return { ok: false, code: "CONTRACTOR_CONTACT_REQUIRED", message: "Contact name is required." };
  }
  if (!(input.contactEmail?.trim())) {
    return { ok: false, code: "CONTRACTOR_EMAIL_REQUIRED", message: "Contact email is required." };
  }
  if ((input.workToBeDone?.trim() ?? "").length < 10) {
    return {
      ok: false,
      code: "CONTRACTOR_WORK_REQUIRED",
      message:
        "Describe the work they will do (INDG368 — identify the job before you select a contractor).",
    };
  }
  return { ok: true };
}

export function validateContractorForApproval(input: {
  workToBeDone?: string | null;
  hostInformationProvided?: boolean | null;
}): { ok: true } | { ok: false; code: string; message: string } {
  if ((input.workToBeDone?.trim() ?? "").length < 10) {
    return {
      ok: false,
      code: "CONTRACTOR_WORK_REQUIRED",
      message:
        "Describe the work they will do before they are approved (INDG368 — identify the job).",
    };
  }
  if (input.hostInformationProvided !== true) {
    return {
      ok: false,
      code: "CONTRACTOR_HOST_INFO_REQUIRED",
      message:
        "Record that they have been given comprehensible information on site risks, your controls and emergency arrangements (MHSWR 1999 regs 11 and 12).",
    };
  }
  return { ok: true };
}
