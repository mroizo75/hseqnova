import { z } from "zod";

/**
 * ISO 9001 - 7.2 Kompetanse
 * 
 * Organisasjonen skal:
 * a) Bestemme nødvendig kompetanse for personer som gjør arbeid som påvirker ytelse og effektivitet
 * b) Sikre at disse personene er kompetente basert på utdanning, opplæring eller erfaring
 * c) Der det er aktuelt, ta tiltak for å anskaffe nødvendig kompetanse og evaluere effektiviteten
 * d) Beholde aktuell dokumentert informasjon som bevis på kompetanse
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
  effectiveness: z.string().optional(),
});

export const updateTrainingSchema = z.object({
  id: z.string().min(1, "Training is required"),
  title: z.string().min(3).optional(),
  provider: z.string().min(2).optional(),
  completedAt: z.date().optional(),
  validUntil: z.date().optional(),
  proofDocKey: z.string().optional(),
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
    EXPIRING_SOON: "bg-yellow-100 text-black border-yellow-300", // Sort tekst på gul
    EXPIRED: "bg-red-100 text-red-800 border-red-300",
  };
  return colors[status] || "bg-gray-100 text-gray-800 border-gray-300";
}

/**
 * Standard HMS kurs som bør være i systemet
 */
export const STANDARD_COURSES = [
  {
    key: "hms-intro",
    title: "HMS Introduksjon",
    description: "Grunnleggende HMS-opplæring for alle ansatte",
    isRequired: true,
    validityYears: null, // Ikke utløpsdato
  },
  {
    key: "working-at-height",
    title: "Arbeid i høyden",
    description: "Sikker bruk av stige, stillas og fallutstyr",
    isRequired: false,
    validityYears: 3,
  },
  {
    key: "first-aid",
    title: "Førstehjelp",
    description: "Grunnleggende førstehjelp og hjerte-lungeredning",
    isRequired: false,
    validityYears: 2,
  },
  {
    key: "fire-safety",
    title: "Brannsikkerhet",
    description: "Brannvernopplæring og bruk av slokkeutstyr",
    isRequired: true,
    validityYears: 1,
  },
  {
    key: "chemical-handling",
    title: "Kjemikaliehåndtering",
    description: "Sikker håndtering og lagring av kjemikalier",
    isRequired: false,
    validityYears: 3,
  },
  {
    key: "forklift",
    title: "Truckførerbevis",
    description: "Godkjent opplæring for truckkjøring",
    isRequired: false,
    validityYears: 5,
  },
  {
    key: "hot-work",
    title: "Varmt arbeid",
    description: "Sertifikat for varmt arbeid (sveising, skjæring)",
    isRequired: false,
    validityYears: 3,
  },
  {
    key: "confined-space",
    title: "Arbeid i trange rom",
    description: "Sikkerhet ved arbeid i trange/lukkede rom",
    isRequired: false,
    validityYears: 3,
  },
];

