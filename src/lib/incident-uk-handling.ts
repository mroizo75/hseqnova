/**
 * What UK law and HSE guidance require when handling an accident-book record.
 *
 * - SSCPR 1979 / BI 510 accident book (keep 3 years)
 * - RIDDOR 2013 (report to HSE; keep a record of the report)
 * - HSE HSG245 (proportionate investigation and control measures)
 * - MHSWR 1999 (manage risk; review after an incident)
 */

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
  riddorReportable: boolean;
  riddorReportedAt?: Date | string | null;
  rootCause?: string | null;
  measures: Array<{ status: string }>;
};

export function isAccidentBookType(type: string): boolean {
  return ACCIDENT_BOOK_TYPES.has(type);
}

export function getUkIncidentHandlingChecks(incident: UkIncidentForHandling): UkHandlingCheck[] {
  const accidentBook = isAccidentBookType(incident.type);
  const injuryEvent = incident.type === "ULYKKE" || incident.type === "YRKESSYKDOM" || incident.type === "SKADE";
  const measuresComplete =
    incident.measures.length === 0 || incident.measures.every((measure) => measure.status === "DONE");

  return [
    {
      id: "place",
      done: !accidentBook || Boolean(incident.location?.trim()),
      label: "Place of accident",
      legal: "SSCPR 1979 / BI 510",
    },
    {
      id: "injuredPerson",
      done: !accidentBook || Boolean(incident.involvedPersons?.trim() || incident.reportedForUserId),
      label: "Injured or involved person (name, occupation, address)",
      legal: "SSCPR 1979 / BI 510",
    },
    {
      id: "injury",
      done: !injuryEvent || Boolean(incident.injuryDescription?.trim() || incident.injuryType?.trim()),
      label: "Cause and nature of injury",
      legal: "SSCPR 1979 / BI 510",
    },
    {
      id: "riddor",
      done: !incident.riddorReportable || Boolean(incident.riddorReportedAt),
      label: "RIDDOR report recorded (date and HSE reference)",
      legal: "RIDDOR 2013 — report before the investigation is finished",
    },
    {
      id: "investigate",
      done: Boolean(incident.rootCause?.trim()),
      label: "Investigation (in proportion to the risk)",
      legal: "HSE HSG245; MHSWR 1999",
    },
    {
      id: "actions",
      done: Boolean(incident.rootCause?.trim()) && measuresComplete,
      label: "Control measures followed up (or none required)",
      legal: "HSE HSG245 steps 3–4",
    },
  ];
}

export function canCloseUkIncident(incident: {
  rootCause?: string | null;
  status: string;
  measures: Array<{ status: string }>;
}): boolean {
  if (incident.status === "CLOSED") return false;
  if (!incident.rootCause?.trim()) return false;
  if (incident.measures.length === 0) return true;
  return incident.measures.every((measure) => measure.status === "DONE");
}
