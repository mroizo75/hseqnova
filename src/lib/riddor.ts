export type RiddorCategory =
  | "death"
  | "specified_injury"
  | "over_seven_day"
  | "occupational_disease"
  | "dangerous_occurrence"
  | "non_worker"
  | null;

export interface RiddorTriageInput {
  type: string;
  isFatal?: boolean;
  specifiedInjury?: boolean;
  overSevenDayInjury?: boolean;
  lostWorkdays?: number | null;
  listedOccupationalDisease?: boolean;
  listedDangerousOccurrence?: boolean;
  nonWorkerTakenToHospital?: boolean;
  occurredAt: Date;
}

export interface RiddorTriageResult {
  reportable: boolean;
  category: RiddorCategory;
  dueAt: Date | null;
  accidentBookEntry: boolean;
}

function addDays(from: Date, days: number): Date {
  const dueAt = new Date(from);
  dueAt.setDate(dueAt.getDate() + days);
  return dueAt;
}

/**
 * RIDDOR 2013 triage from explicit competent-person flags.
 * Type alone is never enough: occupational disease and dangerous
 * occurrences are reportable only when they match the listed categories.
 *
 * @see https://www.legislation.gov.uk/uksi/2013/1471
 * @see https://www.hse.gov.uk/riddor/
 */
export function assessRiddor(input: RiddorTriageInput): RiddorTriageResult {
  const occurredAt = input.occurredAt;
  const accidentBookEntry = true;
  const daysOff = input.lostWorkdays ?? 0;

  if (input.isFatal) {
    return { reportable: true, category: "death", dueAt: occurredAt, accidentBookEntry };
  }

  if (input.specifiedInjury) {
    return {
      reportable: true,
      category: "specified_injury",
      dueAt: addDays(occurredAt, 10),
      accidentBookEntry,
    };
  }

  if (input.nonWorkerTakenToHospital) {
    return {
      reportable: true,
      category: "non_worker",
      dueAt: addDays(occurredAt, 10),
      accidentBookEntry,
    };
  }

  if (input.overSevenDayInjury || daysOff > 7) {
    return {
      reportable: true,
      category: "over_seven_day",
      dueAt: addDays(occurredAt, 15),
      accidentBookEntry,
    };
  }

  if (input.listedOccupationalDisease) {
    return {
      reportable: true,
      category: "occupational_disease",
      dueAt: addDays(occurredAt, 10),
      accidentBookEntry,
    };
  }

  if (input.listedDangerousOccurrence) {
    return {
      reportable: true,
      category: "dangerous_occurrence",
      dueAt: addDays(occurredAt, 10),
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
