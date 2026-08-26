import { z } from "zod";
import { SjaStatus, SjaConclusion } from "@prisma/client";

const optionalId = z.preprocess(
  (value) => (value === "" || value == null ? undefined : value),
  z.string().min(1).optional(),
);

/**
 * RAMS — risk assessment and method statement.
 * MHSWR 1999 reg.3: suitable and sufficient risk assessment.
 * CDM 2015 reg.15: contractor must plan, manage and monitor work and inform workers of the risks.
 */
export const sjaHazardSchema = z.object({
  activity: z.string().min(1, "Activity is required"),
  hazard: z.string().min(1, "Hazard is required"),
  consequence: z.string().optional(),
  probability: z.number().min(1).max(5).default(1),
  severity: z.number().min(1).max(5).default(1),
  measures: z.string().min(1, "Control measures are required"),
  responsibleName: z.string().optional(),
  sortOrder: z.number().default(0),
});

export const createSjaSchema = z.object({
  tenantId: z.string().min(1),
  projectId: optionalId,
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  workLocation: z.string().min(1, "Work location is required"),
  plannedDate: z.date(),
  responsibleName: z.string().min(1, "A competent person must be named"),
  participants: z.string().min(1, "Everyone doing the work must be named"),
  additionalConditions: z.string().optional(),
  weatherConditions: z.string().optional(),
  templateId: optionalId,
  templateName: z.string().optional(),
  hazards: z.array(sjaHazardSchema).min(1, "Identify at least one hazard"),
});

export const updateSjaSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(3).optional(),
  description: z.string().optional(),
  workLocation: z.string().min(1).optional(),
  plannedDate: z.date().optional(),
  responsibleName: z.string().min(1).optional(),
  participants: z.string().optional(),
  status: z.nativeEnum(SjaStatus).optional(),
  conclusion: z.nativeEnum(SjaConclusion).optional(),
  conclusionComment: z.string().optional(),
  hazards: z.array(sjaHazardSchema).optional(),
});

export const createSjaTemplateSchema = z.object({
  tenantId: z.string().min(1),
  name: z.string().min(3, "Template name must be at least 3 characters"),
  description: z.string().optional(),
  workLocation: z.string().optional(),
  hazards: z.array(sjaHazardSchema).min(1, "Add at least one hazard to the template"),
});

export type CreateSjaInput = z.infer<typeof createSjaSchema>;
export type UpdateSjaInput = z.infer<typeof updateSjaSchema>;
export type SjaHazardInput = z.infer<typeof sjaHazardSchema>;
export type CreateSjaTemplateInput = z.infer<typeof createSjaTemplateSchema>;

export function getSjaStatusLabel(status: SjaStatus): string {
  const labels: Record<SjaStatus, string> = {
    DRAFT: "Draft",
    ACTIVE: "Live",
    COMPLETED: "Complete",
    CANCELLED: "Cancelled",
  };
  return labels[status];
}

export function getSjaStatusColor(status: SjaStatus): string {
  const colors: Record<SjaStatus, string> = {
    DRAFT: "bg-gray-100 text-gray-800 border-gray-300",
    ACTIVE: "bg-green-100 text-green-800 border-green-300",
    COMPLETED: "bg-blue-100 text-blue-800 border-blue-300",
    CANCELLED: "bg-red-100 text-red-800 border-red-300",
  };
  return colors[status];
}

export function getSjaConclusionLabel(conclusion: SjaConclusion): string {
  const labels: Record<SjaConclusion, string> = {
    NOT_DECIDED: "Not decided",
    APPROVED: "Approved — work may start",
    CONDITIONAL: "Approved with conditions",
    REJECTED: "Rejected — work must not start",
  };
  return labels[conclusion];
}

export function getSjaConclusionColor(conclusion: SjaConclusion): string {
  const colors: Record<SjaConclusion, string> = {
    NOT_DECIDED: "bg-gray-100 text-gray-800 border-gray-300",
    APPROVED: "bg-green-100 text-green-800 border-green-300",
    CONDITIONAL: "bg-yellow-100 text-yellow-800 border-yellow-300",
    REJECTED: "bg-red-100 text-red-800 border-red-300",
  };
  return colors[conclusion];
}

export function getRiskColor(riskLevel: number): string {
  if (riskLevel >= 15) return "bg-red-600 text-white";
  if (riskLevel >= 10) return "bg-orange-500 text-white";
  if (riskLevel >= 5) return "bg-yellow-400 text-yellow-900";
  return "bg-green-500 text-white";
}

export function getRiskLabel(riskLevel: number): string {
  if (riskLevel >= 15) return "Very high";
  if (riskLevel >= 10) return "High";
  if (riskLevel >= 5) return "Medium";
  return "Low";
}
