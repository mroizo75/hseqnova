import { z } from "zod";
import {
  ActionEffectiveness,
  ActionStatus,
  ControlFrequency,
  MeasureCategory,
} from "@prisma/client";

const optionalId = z.preprocess(
  (value) => (value === "" || value == null ? undefined : value),
  z.string().min(1).optional(),
);

/**
 * MHSWR 1999 reg.5: arrangements for preventive and protective measures.
 * HSG245: each control needs what (title), who (responsibleId), when (dueAt).
 */
export const createMeasureSchema = z.object({
  tenantId: z.string().min(1),
  projectId: optionalId,
  riskId: optionalId,
  incidentId: optionalId,
  auditId: optionalId,
  goalId: optionalId,
  fireDrillId: optionalId,
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.preprocess(
    (value) => (value === "" || value == null ? undefined : value),
    z.string().min(10, "Description must be at least 10 characters").optional(),
  ),
  dueAt: z.date(),
  responsibleId: z.string().min(1),
  status: z.nativeEnum(ActionStatus).default("PENDING"),
  category: z.nativeEnum(MeasureCategory).default("CORRECTIVE"),
  followUpFrequency: z.nativeEnum(ControlFrequency).default("ANNUAL"),
  costEstimate: z.number().int().min(0).optional(),
  benefitEstimate: z.number().int().min(0).optional(),
});

export const updateMeasureSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(3).optional(),
  description: z.preprocess(
    (value) => (value === "" || value == null ? undefined : value),
    z.string().min(1).optional(),
  ),
  dueAt: z.date().optional(),
  responsibleId: z.string().min(1).optional(),
  status: z.nativeEnum(ActionStatus).optional(),
  category: z.nativeEnum(MeasureCategory).optional(),
  followUpFrequency: z.nativeEnum(ControlFrequency).optional(),
  costEstimate: z.number().int().min(0).optional(),
  benefitEstimate: z.number().int().min(0).optional(),
  completedAt: z.date().optional(),
  effectiveness: z.nativeEnum(ActionEffectiveness).optional(),
  effectivenessNote: z.string().optional(),
});

export const completeMeasureSchema = z.object({
  id: z.string().min(1),
  completedAt: z.date(),
  completionNote: z
    .string()
    .min(10, "Say what was done (HSG245 — monitor implementation)"),
  effectiveness: z.nativeEnum(ActionEffectiveness).default("NOT_EVALUATED"),
});

/** Named owner records progress — HSG245 monitor implementation. */
export const ownerProgressSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["IN_PROGRESS", "DONE"]),
  completionNote: z.preprocess(
    (value) => (value === "" || value == null ? undefined : value),
    z.string().min(10).optional(),
  ),
});

export type CreateMeasureInput = z.infer<typeof createMeasureSchema>;
export type UpdateMeasureInput = z.infer<typeof updateMeasureSchema>;
export type CompleteMeasureInput = z.infer<typeof completeMeasureSchema>;
export type OwnerProgressInput = z.infer<typeof ownerProgressSchema>;

export function isMeasureOverdue(dueAt: Date, status: ActionStatus): boolean {
  if (status === "DONE") return false;
  return new Date() > new Date(dueAt);
}

export function getMeasureStatusLabel(status: ActionStatus): string {
  const labels: Record<ActionStatus, string> = {
    PENDING: "Not started",
    IN_PROGRESS: "In progress",
    DONE: "Complete",
    OVERDUE: "Overdue",
  };
  return labels[status];
}

export function getMeasureStatusColor(status: ActionStatus): string {
  const colors: Record<ActionStatus, string> = {
    PENDING: "bg-gray-100 text-gray-800 border-gray-300",
    IN_PROGRESS: "bg-blue-100 text-blue-800 border-blue-300",
    DONE: "bg-green-100 text-green-800 border-green-300",
    OVERDUE: "bg-red-100 text-red-800 border-red-300",
  };
  return colors[status];
}
