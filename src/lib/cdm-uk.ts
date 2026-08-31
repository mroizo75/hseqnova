/**
 * CDM 2015 — Construction (Design and Management) Regulations 2015.
 *
 * Client (reg.4) — make suitable arrangements; appoint competent people;
 * provide pre-construction information; ensure a construction phase plan
 * exists before the construction phase; ensure a health and safety file is
 * prepared and handed over.
 *
 * Appointment (reg.5) — where there will be more than one contractor, the
 * client must appoint a principal designer and a principal contractor in
 * writing. If they fail to appoint, they must fulfil those duties themselves.
 *
 * Notification (reg.6) — a project is notifiable if construction work is
 * scheduled to last longer than 30 working days and have more than 20 workers
 * working simultaneously at any point, or to exceed 500 person days. The
 * client must notify the HSE (F10) as soon as practicable before the
 * construction phase, with the particulars in Schedule 1, and display a copy
 * in the site office. Notify via hse.gov.uk/forms/notification/f10.htm —
 * this product records the particulars; it does not submit the form.
 *
 * Construction phase plan (reg.12) — drawn up before setting up the site;
 * health and safety arrangements, site rules, and measures for Schedule 3
 * risks. Principal contractor (more than one contractor) or the contractor
 * (single contractor).
 *
 * Health and safety file (reg.12(5)–(10)) — prepared by the principal
 * designer during the pre-construction phase; passed to the client at the
 * end of the project. Information likely to be needed for later work.
 *
 * Official: legislation.gov.uk/uksi/2015/51
 *           hse.gov.uk/construction/cdm/2015
 */

export const F10_HSE_URL = "https://www.hse.gov.uk/forms/notification/f10.htm";

export function isF10Submitted(status: string | null | undefined): boolean {
  return status === "SUBMITTED" || status === "UPDATED_AFTER_SUBMISSION";
}
