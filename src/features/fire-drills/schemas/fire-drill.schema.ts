import { z } from "zod";
import {
  FIRE_DRILL_TYPE_LABELS,
  FIRE_DRILL_STATUS_LABELS,
  OBJECTIVES_ACHIEVED_LABELS,
} from "@/lib/fire-drill-uk";

export const FIRE_DRILL_TYPES = ["EVACUATION", "FIRE_SUPPRESSION", "ALARM_TEST", "FULL_SCALE"] as const;
export type FireDrillType = (typeof FIRE_DRILL_TYPES)[number];

export const FIRE_DRILL_STATUSES = ["PLANNED", "IN_PROGRESS", "COMPLETED", "EVALUATED", "CANCELLED"] as const;
export type FireDrillStatus = (typeof FIRE_DRILL_STATUSES)[number];

export { FIRE_DRILL_TYPE_LABELS, FIRE_DRILL_STATUS_LABELS, OBJECTIVES_ACHIEVED_LABELS };

export const createFireDrillSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  drillType: z.enum(FIRE_DRILL_TYPES),
  isAnnounced: z.boolean().default(true),
  plannedDate: z.date({ error: "Planned date and time are required" }),
  location: z.string().min(2, "Location is required"),
  responsibleId: z.string().min(1, "Drill leader is required"),
  objectives: z.string().min(10, "Objectives are required (at least 10 characters)"),
  scenario: z.string().optional(),
  riskAssessment: z.string().optional(),
  participantIds: z.array(z.string()).optional(),
  sharedPremises: z.boolean().default(false),
  buildingOwnerCoordinated: z.boolean().optional(),
  buildingOwnerName: z.string().optional(),
  otherTenantsInformed: z.boolean().optional(),
  fullBuildingEvacuation: z.boolean().optional(),
  totalBuildingOccupants: z.number().int().min(1).optional(),
});

export const completeFireDrillSchema = z.object({
  completedAt: z.date({ error: "Completion date is required" }),
  actualParticipantCount: z
    .number()
    .int()
    .min(1, "At least one participant is required"),
  evacuationTimeSeconds: z.number().int().min(1).optional(),
  observations: z.string().min(10, "Observations are required (at least 10 characters)"),
});

export const evaluateFireDrillSchema = z
  .object({
    objectivesAchieved: z.enum(["FULL", "PARTIAL", "NOT_ACHIEVED"], {
      error: "Say whether the objectives were met",
    }),
    evaluation: z.string().min(10, "Review notes are required (at least 10 characters)"),
    improvementPoints: z.string().min(5, "Improvement points are required"),
    procedureChangesNeeded: z.boolean().default(false),
    procedureChangesDesc: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.objectivesAchieved !== "FULL" &&
      (!data.procedureChangesDesc || data.procedureChangesDesc.trim().length < 5)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["procedureChangesDesc"],
        message:
          "If the drill was not fully satisfactory, record how the evacuation procedures will be changed (art.15).",
      });
    }
  });

export const updateFireDrillSchema = z.object({
  title: z.string().min(3).optional(),
  drillType: z.enum(FIRE_DRILL_TYPES).optional(),
  isAnnounced: z.boolean().optional(),
  plannedDate: z.date().optional(),
  location: z.string().min(2).optional(),
  responsibleId: z.string().min(1).optional(),
  objectives: z.string().min(10).optional(),
  scenario: z.string().optional(),
  riskAssessment: z.string().optional(),
  participantIds: z.array(z.string()).optional(),
  status: z.enum(FIRE_DRILL_STATUSES).optional(),
  sharedPremises: z.boolean().optional(),
  buildingOwnerCoordinated: z.boolean().optional(),
  buildingOwnerName: z.string().optional(),
  otherTenantsInformed: z.boolean().optional(),
  fullBuildingEvacuation: z.boolean().optional(),
  totalBuildingOccupants: z.number().int().min(1).optional(),
});

export type CreateFireDrillInput = z.infer<typeof createFireDrillSchema>;
export type CompleteFireDrillInput = z.infer<typeof completeFireDrillSchema>;
export type EvaluateFireDrillInput = z.infer<typeof evaluateFireDrillSchema>;
export type UpdateFireDrillInput = z.infer<typeof updateFireDrillSchema>;
