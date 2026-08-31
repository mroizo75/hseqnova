import { z } from "zod";
import { MHSWR_TRAINING_REASON_KEYS } from "@/lib/training-uk";

/**
 * HSWA 1974 s.2(2)(c) and MHSWR 1999 reg.13.
 * Keep a record of who was trained, in what, when, and why.
 */

export const createTrainingSchema = z.object({
  tenantId: z.string().min(1, "Organisation is required"),
  userId: z.string().min(1, "Employee is required"),
  courseKey: z.string().min(2, "Course ID must be at least 2 characters"),
  title: z.string().min(3, "Title must be at least 3 characters"),
  provider: z.string().min(2, "Provider must be at least 2 characters"),
  completedAt: z.date().optional(),
  validUntil: z.date().optional(),
  proofDocKey: z.string().optional(),
  isRequired: z.boolean().default(false),
  mhswrReason: z.enum(MHSWR_TRAINING_REASON_KEYS, {
    error: "Say why this training was given (MHSWR 1999 reg.13)",
  }),
  effectiveness: z.string().optional(),
});

export const updateTrainingSchema = z.object({
  id: z.string().min(1, "Training is required"),
  title: z.string().min(3).optional(),
  provider: z.string().min(2).optional(),
  completedAt: z.date().optional(),
  validUntil: z.date().optional(),
  proofDocKey: z.string().optional(),
  mhswrReason: z.enum(MHSWR_TRAINING_REASON_KEYS).optional(),
  effectiveness: z.string().optional(),
});

export const evaluateTrainingSchema = z.object({
  id: z.string().min(1, "Training is required"),
  effectiveness: z.string().min(20, "The evaluation must be at least 20 characters"),
  evaluatedBy: z.string().min(1, "Evaluator is required"),
});

export type CreateTrainingInput = z.infer<typeof createTrainingSchema>;
export type UpdateTrainingInput = z.infer<typeof updateTrainingSchema>;
export type EvaluateTrainingInput = z.infer<typeof evaluateTrainingSchema>;

/**
 * Get training status
 */
export function getTrainingStatus(training: {
  completedAt: Date | null;
  validUntil: Date | null;
}): "NOT_STARTED" | "COMPLETED" | "VALID" | "EXPIRING_SOON" | "EXPIRED" {
  if (!training.completedAt) {
    return "NOT_STARTED";
  }

  if (!training.validUntil) {
    return "COMPLETED";
  }

  const now = new Date();
  const validUntil = new Date(training.validUntil);
  const daysUntilExpiry = Math.ceil((validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntilExpiry < 0) {
    return "EXPIRED";
  } else if (daysUntilExpiry <= 30) {
    return "EXPIRING_SOON";
  } else {
    return "VALID";
  }
}

/**
 * Get status label
 */
export function getTrainingStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    NOT_STARTED: "Not recorded",
    COMPLETED: "Completed",
    VALID: "Valid",
    EXPIRING_SOON: "Expiring soon",
    EXPIRED: "Expired",
  };
  return labels[status] || status;
}

export function uniqueByCourseKey<T extends { courseKey: string }>(rows: T[]): T[] {
  const seen = new Set<string>();
  return rows.filter((row) => {
    if (seen.has(row.courseKey)) return false;
    seen.add(row.courseKey);
    return true;
  });
}

/**
 * Get status color
 */
export function getTrainingStatusColor(status: string): string {
  const colors: Record<string, string> = {
    NOT_STARTED: "bg-gray-100 text-gray-800 border-gray-300",
    COMPLETED: "bg-green-100 text-green-800 border-green-300",
    VALID: "bg-green-100 text-green-800 border-green-300",
    EXPIRING_SOON: "bg-yellow-100 text-black border-yellow-300",
    EXPIRED: "bg-red-100 text-red-800 border-red-300",
  };
  return colors[status] || "bg-gray-100 text-gray-800 border-gray-300";
}

/**
 * Standard H&S courses. Keys stay stable so existing records still match.
 */
export const STANDARD_COURSES = [
  {
    key: "hms-intro",
    title: "Health and safety induction",
    description:
      "Information, instruction and training for new employees (HSWA 1974 s.2(2)(c); MHSWR 1999 reg.13(2)(a)).",
    isRequired: true,
    validityYears: null,
  },
  {
    key: "working-at-height",
    title: "Working at height",
    description: "Safe use of ladders, scaffolding and fall-arrest equipment (Work at Height Regulations 2005).",
    isRequired: false,
    validityYears: 3,
  },
  {
    key: "first-aid",
    title: "First aid",
    description: "Emergency first aid and resuscitation (Health and Safety (First-Aid) Regulations 1981).",
    isRequired: false,
    validityYears: 2,
  },
  {
    key: "fire-safety",
    title: "Fire safety",
    description: "Fire precautions, escape routes and extinguishers (Fire Safety Order 2005 art.21).",
    isRequired: true,
    validityYears: 1,
  },
  {
    key: "chemical-handling",
    title: "COSHH / hazardous substances",
    description: "Safe handling and storage of hazardous substances (COSHH 2002).",
    isRequired: false,
    validityYears: 3,
  },
  {
    key: "forklift",
    title: "Lift-truck operator",
    description: "Operator training before using a lift truck (HSE ACOP L117).",
    isRequired: false,
    validityYears: 5,
  },
  {
    key: "hot-work",
    title: "Hot work",
    description: "Permit and competence for welding, cutting or other hot work.",
    isRequired: false,
    validityYears: 3,
  },
  {
    key: "confined-space",
    title: "Confined spaces",
    description: "Safe working in confined spaces (Confined Spaces Regulations 1997).",
    isRequired: false,
    validityYears: 3,
  },
];

