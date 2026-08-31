import { z } from "zod";
import {
  ControlFrequency,
  RiskCategory,
  RiskResponseStrategy,
  RiskStatus,
  RiskTrend,
} from "@prisma/client";

/** Prisma cuid, createId() (c + hex) and UUID user ids from auth. */
export const recordIdSchema = z
  .string()
  .min(8, "Invalid id")
  .max(36, "Invalid id")
  .regex(/^[A-Za-z0-9_-]+$/, "Invalid id");

const optionalRecordId = z.preprocess(
  (value) => (value === "" || value === undefined ? null : value),
  recordIdSchema.nullable().optional(),
);

/**
 * Workplace risk item (MHSWR 1999 / HSE INDG163).
 * Likelihood (1-5) × severity (1-5) = score (1-25). The matrix is practice, not a legal duty.
 */
export const createRiskSchema = z.object({
  tenantId: recordIdSchema,
  title: z.string().min(3, "Hazard must be at least 3 characters"),
  context: z.string().min(10, "Say who might be harmed and how"),
  likelihood: z.number().int().min(1).max(5),
  consequence: z.number().int().min(1).max(5),
  ownerId: recordIdSchema,
  status: z.nativeEnum(RiskStatus).default("OPEN"),
  category: z.nativeEnum(RiskCategory).default("SAFETY"),
  location: z.string().max(120).optional().nullable(),
  area: z.string().max(120).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  existingControls: z.string().min(8, "Record existing controls").max(2000),
  groupsAtRisk: z.string().max(500).optional().nullable(),
  controlFrequency: z.nativeEnum(ControlFrequency).default("ANNUAL"),
  riskStatement: z.string().max(500).optional().nullable(),
  residualLikelihood: z.number().int().min(1).max(5).optional().nullable(),
  residualConsequence: z.number().int().min(1).max(5).optional().nullable(),
  nextReviewDate: z.date().optional().nullable(),
  kpiId: optionalRecordId,
  inspectionTemplateId: optionalRecordId,
  linkedProcess: z.string().max(200).optional().nullable(),
  riskAppetite: z.string().max(500).optional().nullable(),
  riskTolerance: z.string().max(500).optional().nullable(),
  responseStrategy: z.nativeEnum(RiskResponseStrategy).default("REDUCE"),
  trend: z.nativeEnum(RiskTrend).default("STABLE"),
  reviewedAt: z.date().optional().nullable(),
  riskAssessmentId: optionalRecordId,
  assessmentDate: z.date().optional().nullable(),
});

export const updateRiskSchema = z.object({
  id: recordIdSchema,
  title: z.string().min(3).optional(),
  context: z.string().min(10).optional(),
  likelihood: z.number().int().min(1).max(5).optional(),
  consequence: z.number().int().min(1).max(5).optional(),
  ownerId: recordIdSchema.optional(),
  status: z.nativeEnum(RiskStatus).optional(),
  category: z.nativeEnum(RiskCategory).optional(),
  location: z.string().max(120).optional().nullable(),
  area: z.string().max(120).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  existingControls: z.string().min(8, "Record existing controls").max(2000).optional().nullable(),
  groupsAtRisk: z.string().max(500).optional().nullable(),
  controlFrequency: z.nativeEnum(ControlFrequency).optional(),
  riskStatement: z.string().max(500).optional().nullable(),
  residualLikelihood: z.number().int().min(1).max(5).optional().nullable(),
  residualConsequence: z.number().int().min(1).max(5).optional().nullable(),
  nextReviewDate: z.date().optional().nullable(),
  kpiId: optionalRecordId,
  inspectionTemplateId: optionalRecordId,
  linkedProcess: z.string().max(200).optional().nullable(),
  riskAppetite: z.string().max(500).optional().nullable(),
  riskTolerance: z.string().max(500).optional().nullable(),
  responseStrategy: z.nativeEnum(RiskResponseStrategy).optional(),
  trend: z.nativeEnum(RiskTrend).optional(),
  reviewedAt: z.date().optional().nullable(),
  riskAssessmentId: optionalRecordId,
  assessmentDate: z.date().optional().nullable(),
});

/** Create a documented risk assessment (MHSWR 1999). */
export const createRiskAssessmentSchema = z.object({
  tenantId: recordIdSchema,
  projectId: optionalRecordId,
  title: z.string().min(3, "Title must be at least 3 characters"),
  assessmentYear: z.number().int().min(2000).max(2100),
  // SRSCWR 1977 / HSCER 1996: consult employees and safety representatives
  participants: z.string().optional(),
});

// MHSWR 1999 review; ISO 45001 6.1 / 9.3 management review of the assessment
export const updateRiskAssessmentSchema = z.object({
  id: recordIdSchema,
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(200).optional(),
  participants: z.string().optional(),
  approvedById: optionalRecordId,
  approvedAt: z.coerce.date().optional().nullable(),
  reviewedById: optionalRecordId,
  reviewedAt: z.coerce.date().optional().nullable(),
  groupsAtRisk: z.string().max(500).optional().nullable(),
});

/** Enkel nivå for risikopunkt i årlig risikovurdering (ISO 45001) */
export const riskLevelToMatrix = {
  LOW: { likelihood: 1, consequence: 2 },      // score 2 – Lav
  MEDIUM: { likelihood: 2, consequence: 4 },  // score 8 – Moderat
  HIGH: { likelihood: 4, consequence: 4 },     // score 16 – Høy
  CRITICAL: { likelihood: 5, consequence: 5 }, // score 25 – Kritisk
} as const;

export type CreateRiskInput = z.infer<typeof createRiskSchema>;
export type UpdateRiskInput = z.infer<typeof updateRiskSchema>;
export type CreateRiskAssessmentInput = z.infer<typeof createRiskAssessmentSchema>;
export type UpdateRiskAssessmentInput = z.infer<typeof updateRiskAssessmentSchema>;

/**
 * Helper function to calculate risk score and level
 */
export function calculateRiskScore(likelihood: number, consequence: number) {
  const score = likelihood * consequence;
  
  let level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  let color: string;
  let bgColor: string;
  let textColor: string; // For badge text
  
  if (score >= 20) {
    level = "CRITICAL";
    color = "text-red-900";
    bgColor = "bg-red-100 border-red-300";
    textColor = "text-red-900";
  } else if (score >= 12) {
    level = "HIGH";
    color = "text-orange-900";
    bgColor = "bg-orange-100 border-orange-300";
    textColor = "text-orange-900";
  } else if (score >= 6) {
    level = "MEDIUM";
    color = "text-yellow-900";
    bgColor = "bg-yellow-100 border-yellow-300";
    textColor = "text-yellow-900";
  } else {
    level = "LOW";
    color = "text-green-900";
    bgColor = "bg-green-100 border-green-300";
    textColor = "text-green-900";
  }
  
  return { score, level, color, bgColor, textColor };
}

/**
 * Get color for risk matrix cell
 */
export function getMatrixCellColor(score: number): string {
  if (score >= 20) return "bg-red-500 hover:bg-red-600";
  if (score >= 12) return "bg-orange-500 hover:bg-orange-600";
  if (score >= 6) return "bg-yellow-500 hover:bg-yellow-600";
  return "bg-green-500 hover:bg-green-600";
}

