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
  medicalAttentionRequired?: boolean;
  occurredAt: Date;
}

export interface RiddorTriageResult {
  reportable: boolean;
  category: RiddorCategory;
  dueAt: Date | null;
  accidentBookEntry: boolean;
}

const SPECIFIED_INJURY_HINTS = [
  "fracture",
  "amputation",
  "sight",
  "crush",
  "burn",
  "scalp",
  "unconscious",
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

  if (input.type === "FARLIG_SITUASJON" || input.type === "NESTEN") {
    return {
      reportable: false,
      category: "dangerous_occurrence",
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
