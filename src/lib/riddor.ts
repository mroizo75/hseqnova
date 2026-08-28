export type RiddorCategory =
  | "death"
  | "specified_injury"
  | "over_seven_day"
  | "occupational_disease"
  | "dangerous_occurrence"
  | null;

export interface RiddorTriageInput {
  type: string;
  isFatal?: boolean;
  isLostTimeIncident?: boolean;
  lostWorkdays?: number | null;
  overSevenDayInjury?: boolean;
  injuryType?: string | null;
  description?: string | null;
  medicalAttentionRequired?: boolean;
  occurredAt: Date;
}

export interface RiddorTriageResult {
  reportable: boolean;
  category: RiddorCategory;
  dueAt: Date | null;
  accidentBookEntry: boolean;
}

/**
 * RIDDOR 2013 reg.4 — full list of specified injuries.
 * @see https://www.legislation.gov.uk/uksi/2013/1471/regulation/4
 */
const SPECIFIED_INJURY_HINTS = [
  "fracture",
  "amputation",
  "dislocation",
  "sight",
  "eye",
  "chemical burn",
  "metal burn",
  "crush",
  "burn",
  "scalp",
  "scalping",
  "unconscious",
  "loss of consciousness",
  "resuscitation",
  "hypothermia",
  "asphyxia",
  "exposure to substance",
  "absorbed through skin",
];

/**
 * RIDDOR 2013 Schedule 2 — dangerous occurrences that are reportable.
 * @see https://www.legislation.gov.uk/uksi/2013/1471/schedule/2
 */
const DANGEROUS_OCCURRENCE_HINTS = [
  "collapse",
  "scaffold",
  "scaffolding",
  "lifting machinery",
  "crane",
  "hoist",
  "lift failure",
  "explosion",
  "electrical",
  "electric shock",
  "gas incident",
  "pipeline",
  "overhead line",
  "breathing apparatus",
  "diving",
  "radiation",
  "malfunction",
  "pressure vessel",
  "boiler",
  "freight container",
  "overhead",
  "excavation",
  "wall collapse",
  "floor collapse",
  "building collapse",
  "structure collapse",
  "biological agent",
  "fire",
  "substance release",
  "chemical release",
];

export function assessRiddor(input: RiddorTriageInput): RiddorTriageResult {
  const occurredAt = input.occurredAt;
  const accidentBookEntry = true;

  if (input.isFatal || input.type === "ULYKKE" && /fatal|death/i.test(input.injuryType ?? "")) {
    return {
      reportable: true,
      category: "death",
      dueAt: occurredAt,
      accidentBookEntry,
    };
  }

  const injury = (input.injuryType ?? "").toLowerCase();
  if (SPECIFIED_INJURY_HINTS.some((hint) => injury.includes(hint))) {
    const dueAt = new Date(occurredAt);
    dueAt.setDate(dueAt.getDate() + 10);
    return {
      reportable: true,
      category: "specified_injury",
      dueAt,
      accidentBookEntry,
    };
  }

  const daysOff = input.lostWorkdays ?? 0;
  if (input.overSevenDayInjury || daysOff >= 7 || (input.isLostTimeIncident && daysOff >= 7)) {
    const dueAt = new Date(occurredAt);
    dueAt.setDate(dueAt.getDate() + 15);
    return {
      reportable: true,
      category: "over_seven_day",
      dueAt,
      accidentBookEntry,
    };
  }

  if (input.type === "YRKESSYKDOM") {
    const dueAt = new Date(occurredAt);
    dueAt.setDate(dueAt.getDate() + 10);
    return {
      reportable: true,
      category: "occupational_disease",
      dueAt,
      accidentBookEntry,
    };
  }

  // RIDDOR 2013 Schedule 2 — dangerous occurrences are reportable
  // when they match a listed category. Near misses without a listed
  // category remain non-reportable but are kept in the accident book.
  if (input.type === "FARLIG_SITUASJON" || input.type === "NESTEN") {
    const desc = [input.injuryType ?? "", input.description ?? ""].join(" ").toLowerCase();
    const isListed = DANGEROUS_OCCURRENCE_HINTS.some((hint) => desc.includes(hint));
    if (isListed) {
      const dueAt = new Date(occurredAt);
      dueAt.setDate(dueAt.getDate() + 10);
      return {
        reportable: true,
        category: "dangerous_occurrence",
        dueAt,
        accidentBookEntry,
      };
    }
    return {
      reportable: false,
      category: null,
      dueAt: null,
      accidentBookEntry,
    };
  }

  return {
    reportable: false,
    category: null,
    dueAt: null,
    accidentBookEntry,
  };
}
