/**
 * RIDDOR 2013 deadline calculator.
 *
 * Reporting deadlines per RIDDOR 2013:
 *  - Death: notify immediately (quickest practicable means), written follow-up within 10 days
 *  - Specified injury (reg. 4): 10 days
 *  - Over-seven-day incapacitation (reg. 4): 15 days from day of incapacity
 *  - Dangerous occurrence (Schedule 2): 10 days
 *  - Occupational disease (reg. 8): 10 days from diagnosis
 *
 * @see https://www.legislation.gov.uk/uksi/2013/1471/regulation/3
 */

import type { RiddorCategory } from "@/lib/riddor";

export interface RiddorDeadline {
  incidentId: string;
  incidentTitle: string;
  incidentType: string;
  incidentDate: Date;
  deadlineDate: Date;
  deadlineType: "immediate" | "10_days" | "15_days";
  isOverdue: boolean;
  daysRemaining: number;
  riddorCategory: RiddorCategory;
  riddorReportedAt?: Date | null;
}

interface IncidentInput {
  id: string;
  title: string;
  type: string;
  occurredAt: Date | string;
  riddorReportable: boolean;
  riddorCategory: RiddorCategory;
  riddorDueAt: Date | string | null;
  riddorReportedAt?: Date | string | null;
}

const DEADLINE_TYPE_MAP: Record<string, "immediate" | "10_days" | "15_days"> = {
  death: "immediate",
  specified_injury: "10_days",
  over_seven_day: "15_days",
  occupational_disease: "10_days",
  dangerous_occurrence: "10_days",
};

export function calculateRiddorDeadline(
  incident: IncidentInput,
): RiddorDeadline | null {
  if (!incident.riddorReportable || !incident.riddorCategory) {
    return null;
  }

  const deadlineDate = incident.riddorDueAt
    ? new Date(incident.riddorDueAt)
    : null;

  if (!deadlineDate) return null;

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const dueNormalised = new Date(deadlineDate);
  dueNormalised.setHours(0, 0, 0, 0);

  const diffMs = dueNormalised.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const isOverdue = daysRemaining < 0;

  return {
    incidentId: incident.id,
    incidentTitle: incident.title,
    incidentType: incident.type,
    incidentDate: new Date(incident.occurredAt),
    deadlineDate,
    deadlineType: DEADLINE_TYPE_MAP[incident.riddorCategory] ?? "10_days",
    isOverdue,
    daysRemaining,
    riddorCategory: incident.riddorCategory,
    riddorReportedAt: incident.riddorReportedAt
      ? new Date(incident.riddorReportedAt as string)
      : null,
  };
}

export function getOverdueRiddorReports(
  incidents: IncidentInput[],
): RiddorDeadline[] {
  return incidents
    .map(calculateRiddorDeadline)
    .filter((d): d is RiddorDeadline => d !== null && d.isOverdue)
    .sort((a, b) => a.daysRemaining - b.daysRemaining);
}

export function getApproachingRiddorDeadlines(
  incidents: IncidentInput[],
  withinDays = 7,
): RiddorDeadline[] {
  return incidents
    .map(calculateRiddorDeadline)
    .filter(
      (d): d is RiddorDeadline =>
        d !== null && !d.isOverdue && d.daysRemaining <= withinDays,
    )
    .sort((a, b) => a.daysRemaining - b.daysRemaining);
}

export function getAllPendingRiddorDeadlines(
  incidents: IncidentInput[],
): RiddorDeadline[] {
  return incidents
    .map(calculateRiddorDeadline)
    .filter((d): d is RiddorDeadline => d !== null)
    .filter((d) => !d.riddorReportedAt)
    .sort((a, b) => a.daysRemaining - b.daysRemaining);
}
