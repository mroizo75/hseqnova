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
