/**
 * Fire drills — UK legal basis.
 * Prisma enum values stay as stored (EVACUATION, EVALUATED, etc.). Labels only.
 *
 * Regulatory Reform (Fire Safety) Order 2005:
 * - art.15 — procedures including safety drills; nominate competent persons
 *   to implement evacuation
 * - art.21 — adequate safety training, repeated periodically
 * - art.22 — co-operation and co-ordination where more than one responsible
 *   person shares the premises
 *
 * Frequency is not prescribed in the Order. HSE and GOV.UK guidance is at
 * least annually, more often for higher-risk premises. Records stay with
 * the responsible person — they are not submitted to the HSE.
 */

export const FIRE_DRILL_TYPE_LABELS = {
  EVACUATION: "Evacuation drill",
  FIRE_SUPPRESSION: "Extinguisher training",
  ALARM_TEST: "Fire alarm test",
  FULL_SCALE: "Full evacuation drill",
} as const;

export const FIRE_DRILL_STATUS_LABELS = {
  PLANNED: "Planned",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  EVALUATED: "Reviewed",
  CANCELLED: "Cancelled",
} as const;

export const OBJECTIVES_ACHIEVED_LABELS = {
  FULL: "Yes — all objectives met",
  PARTIAL: "Partly — some objectives met",
  NOT_ACHIEVED: "No — objectives not met",
} as const;

export function fireDrillTypeLabel(type: string): string {
  return FIRE_DRILL_TYPE_LABELS[type as keyof typeof FIRE_DRILL_TYPE_LABELS] ?? type;
}

export function fireDrillStatusLabel(status: string): string {
  return FIRE_DRILL_STATUS_LABELS[status as keyof typeof FIRE_DRILL_STATUS_LABELS] ?? status;
}

/** Evacuation time belongs on a safety drill that tests leaving the premises (art.15). */
export function evacuationTimeIsRequired(drillType: string): boolean {
  return drillType === "EVACUATION" || drillType === "FULL_SCALE";
}

export function formatEvacuationTime(seconds: number): string {
  if (seconds < 60) return `${seconds} seconds`;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  if (remainder === 0) return minutes === 1 ? "1 minute" : `${minutes} minutes`;
  return `${minutes} min ${remainder} s`;
}

export function validateFireDrillComplete(input: {
  drillType: string;
  completedAt?: Date | string | null;
  actualParticipantCount?: number | null;
  evacuationTimeSeconds?: number | null;
  observations?: string | null;
}): { ok: true } | { ok: false; code: string; message: string } {
  if (!input.completedAt) {
    return {
      ok: false,
      code: "DRILL_DATE_REQUIRED",
      message: "Date of the drill is required (fire safety log).",
    };
  }
  if (!input.actualParticipantCount || input.actualParticipantCount < 1) {
    return {
      ok: false,
      code: "DRILL_HEADCOUNT_REQUIRED",
      message: "Record how many people took part.",
    };
  }
  if (
    evacuationTimeIsRequired(input.drillType) &&
    !(input.evacuationTimeSeconds && input.evacuationTimeSeconds >= 1)
  ) {
    return {
      ok: false,
      code: "EVAC_TIME_REQUIRED",
      message:
        "Record the time taken to evacuate the premises (Fire Safety Order 2005 art.15).",
    };
  }
  if (!input.observations || input.observations.trim().length < 10) {
    return {
      ok: false,
      code: "DRILL_OBSERVATIONS_REQUIRED",
      message: "Record what was observed, including anything unsatisfactory.",
    };
  }
  return { ok: true };
}

export function validateFireDrillReview(input: {
  objectivesAchieved?: string | null;
  evaluation?: string | null;
  improvementPoints?: string | null;
  procedureChangesDesc?: string | null;
}): { ok: true } | { ok: false; code: string; message: string } {
  if (
    input.objectivesAchieved !== "FULL" &&
    input.objectivesAchieved !== "PARTIAL" &&
    input.objectivesAchieved !== "NOT_ACHIEVED"
  ) {
    return {
      ok: false,
      code: "DRILL_OUTCOME_REQUIRED",
      message: "Say whether the drill was satisfactory.",
    };
  }
  if (!input.evaluation || input.evaluation.trim().length < 10) {
    return {
      ok: false,
      code: "DRILL_REVIEW_REQUIRED",
      message: "Record the review of the drill.",
    };
  }
  if (!input.improvementPoints || input.improvementPoints.trim().length < 5) {
    return {
      ok: false,
      code: "DRILL_IMPROVEMENTS_REQUIRED",
      message: "Record improvement points, even if the drill went well.",
    };
  }
  if (
    input.objectivesAchieved !== "FULL" &&
    (!input.procedureChangesDesc || input.procedureChangesDesc.trim().length < 5)
  ) {
    return {
      ok: false,
      code: "PROCEDURE_CHANGE_REQUIRED",
      message:
        "If the drill was not fully satisfactory, record how the evacuation procedures will be changed (art.15).",
    };
  }
  return { ok: true };
}

export type NamedFireMarshal = { name: string; title: string };

export function namedFireMarshals(
  nodes: Array<{ hsDutyKey?: string | null; name?: string | null; title?: string | null }>,
): NamedFireMarshal[] {
  return nodes
    .filter((node) => node.hsDutyKey === "fire" && Boolean(node.name?.trim()))
    .map((node) => ({
      name: (node.name ?? "").trim(),
      title: (node.title ?? "").trim() || "Fire marshal",
    }));
}
