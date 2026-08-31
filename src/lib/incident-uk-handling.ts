/**
 * What UK law and HSE guidance require when handling an accident-book record.
 *
 * - SSCPR 1979 / BI 510 accident book (keep 3 years)
 * - RIDDOR 2013 (report to HSE; keep a record of the report)
 * - HSE HSG245 (proportionate investigation and control measures)
 * - MHSWR 1999 (manage risk; review after an incident)
 * - SRSCWR 1977 / UK GDPR (consent before sharing with safety representatives)
 */

import { needsInjuredPersonDetails } from "@/lib/accident-book";

const ACCIDENT_BOOK_TYPES = new Set([
  "ULYKKE",
  "NESTEN",
  "FARLIG_SITUASJON",
  "YRKESSYKDOM",
  "HMS",
  "SKADE",
]);

export type UkHandlingCheck = {
  id: string;
  done: boolean;
  label: string;
  legal: string;
};

export type UkIncidentForHandling = {
  type: string;
  location?: string | null;
  involvedPersons?: string | null;
  reportedForUserId?: string | null;
  injuryType?: string | null;
  injuryDescription?: string | null;
  injuredPersonOccupation?: string | null;
  injuredPersonAddress?: string | null;
  injuredPersonRole?: string | null;
  shareWithSafetyRepsConsent?: boolean | null;
  reporterAcknowledged?: boolean | null;
  riddorReportable: boolean;
  riddorReportedAt?: Date | string | null;
  riddorReference?: string | null;
  riddorReportMethod?: string | null;
  isFatal?: boolean | null;
  rootCause?: string | null;
  measures: Array<{ status: string }>;
};

export function isAccidentBookType(type: string): boolean {
  return ACCIDENT_BOOK_TYPES.has(type);
}

function hasText(value?: string | null): boolean {
  return Boolean(value?.trim());
}

export function getUkIncidentHandlingChecks(incident: UkIncidentForHandling): UkHandlingCheck[] {
  const accidentBook = isAccidentBookType(incident.type);
  const injuryEvent = needsInjuredPersonDetails(incident.type, incident.injuredPersonRole);
  const measuresComplete =
    incident.measures.length === 0 || incident.measures.every((measure) => measure.status === "DONE");
  const injuredPersonNamed = hasText(incident.involvedPersons) || Boolean(incident.reportedForUserId);
  const legacyPersonRecord = injuredPersonNamed && !hasText(incident.injuredPersonOccupation);
  const personComplete =
    !injuryEvent ||
    (injuredPersonNamed &&
      (legacyPersonRecord ||
        (hasText(incident.injuredPersonOccupation) && hasText(incident.injuredPersonAddress))));
  const riddorRecordComplete =
    !incident.riddorReportable ||
    (Boolean(incident.riddorReportedAt) &&
      hasText(incident.riddorReference) &&
      hasText(incident.riddorReportMethod));

  return [
    {
      id: "place",
      done: !accidentBook || hasText(incident.location),
      label: "Place of accident",
      legal: "SSCPR 1979 / BI 510",
    },
    {
      id: "injuredPerson",
      done: personComplete,
      label: "Injured or involved person (name, occupation, address)",
      legal: "SSCPR 1979 / BI 510",
    },
    {
      id: "injury",
      done: !injuryEvent || hasText(incident.injuryDescription) || hasText(incident.injuryType),
      label: "Cause and nature of injury",
      legal: "SSCPR 1979 / BI 510",
    },
    {
      id: "consent",
      done: !injuryEvent || Boolean(incident.reporterAcknowledged),
      label: "Entry confirmed as an accurate record",
      legal: "BI 510 — person making the entry",
    },
    {
      id: "riddor",
      done: riddorRecordComplete,
      label: incident.isFatal
        ? "RIDDOR death: phone HSE (0345 300 9923), then record method and reference"
        : "RIDDOR report recorded (date, method and HSE reference)",
      legal: "RIDDOR 2013 — report before the investigation is finished",
    },
    {
      id: "investigate",
      done: hasText(incident.rootCause),
      label: "Investigation (in proportion to the risk)",
      legal: "HSE HSG245; MHSWR 1999",
    },
    {
      id: "actions",
      done: hasText(incident.rootCause) && measuresComplete,
      label: "Control measures followed up (or none required)",
      legal: "HSE HSG245 steps 3–4",
    },
  ];
}

export function canCloseUkIncident(incident: UkIncidentForHandling & { status: string }): boolean {
  if (incident.status === "CLOSED") return false;
  return getUkIncidentHandlingChecks(incident).every((check) => check.done);
}
