/**
 * Digital safety board — UK legal basis.
 *
 * CDM 2015 does not require a digital board. The principal contractor
 * (or the contractor on a single-contractor project) must:
 *   reg.12 — construction phase plan with health and safety arrangements
 *            and site rules, before setting up the site;
 *   reg.13(4)(a) — a suitable site induction;
 *   reg.13(4)(b) — steps to prevent unauthorised access;
 *   reg.6(3)(b) — if the project is notifiable, display the F10 notice
 *            in the site office where it can be read by any worker.
 *
 * HSE “Site rules and induction”: rules must be clear and brought to the
 * attention of everyone on site. This board is a way to do that. It does
 * not replace the written CPP or the HSE F10 submission.
 *
 * A daily site register is not a CDM 2015 duty (that was a Norwegian
 * leftover). Check-in is operational access control.
 *
 * Official: legislation.gov.uk/uksi/2015/51/regulation/13
 *           hse.gov.uk/construction/safetytopics/site-rules-induction.htm
 *           hse.gov.uk/construction/cdm/2015/principal-contractors.htm
 */

import {
  evaluatePreNotificationRequirement,
} from "@/lib/construction-compliance-rules";
import { isF10Submitted } from "@/lib/cdm-uk";

export type BoardDutyItem = {
  label: string;
  ok: boolean | null;
  ref: string;
};

export function constructionSiteInformationChecks(input: {
  cppStatus?: string | null;
  f10?: {
    status?: string | null;
    expectedStartDate?: Date | string | null;
    expectedEndDate?: Date | string | null;
    maxWorkersSimultaneous?: number | null;
  } | null;
  checkinsToday?: number;
}): BoardDutyItem[] {
  const cppActive = input.cppStatus === "ACTIVE";
  const f10 = input.f10 ?? null;
  const notifiable = f10
    ? evaluatePreNotificationRequirement({
        expectedStartDate: f10.expectedStartDate,
        expectedEndDate: f10.expectedEndDate,
        maxWorkersSimultaneous: f10.maxWorkersSimultaneous,
      }).isRequired
    : false;
  const f10Submitted = f10 ? isF10Submitted(f10.status) : false;

  const f10Item: BoardDutyItem = !f10
    ? {
        label: "F10 displayed in the site office if the project is notifiable",
        ok: null,
        ref: "CDM 2015 reg.6",
      }
    : !notifiable
      ? {
          label: "F10 not required on the current programme",
          ok: true,
          ref: "CDM 2015 reg.6",
        }
      : {
          label: "F10 submitted — display a copy in the site office",
          ok: f10Submitted,
          ref: "CDM 2015 reg.6",
        };

  return [
    {
      label: "Construction phase plan active",
      ok: input.cppStatus == null ? null : cppActive,
      ref: "CDM 2015 reg.12",
    },
    f10Item,
    {
      label: "Suitable site induction arranged",
      ok: null,
      ref: "CDM 2015 reg.13(4)(a)",
    },
    {
      label: "Site register check (operational — not a CDM duty)",
      ok:
        input.checkinsToday === undefined ? null : input.checkinsToday > 0,
      ref: "—",
    },
  ];
}

export function generalSiteInformationChecks(): BoardDutyItem[] {
  return [
    {
      label: "Written health and safety policy",
      ok: null,
      ref: "HSWA 1974 s.2(3)",
    },
    {
      label: "Risk assessments in place",
      ok: null,
      ref: "MHSWR 1999 reg.3",
    },
    {
      label: "Emergency procedures",
      ok: null,
      ref: "FSO 2005 / MHSWR reg.8",
    },
    {
      label: "Information for people on site",
      ok: null,
      ref: "HSWA s.2 / MHSWR reg.10",
    },
  ];
}
