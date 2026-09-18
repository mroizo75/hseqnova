import { z } from "zod";
import { ISO_9001_CLAUSES as ISO_9001_IMS, auditClauseOptions } from "@/features/iso/lib/clauses";

/**
 * ISO 9001 - 9.2 Internrevisjon
 * 
 * Organisasjonen skal gjennomføre interne revisjoner med planlagte intervaller for å gi
 * informasjon om ledelsessystemet er:
 * a) I samsvar med organisasjonens egne krav for sitt ledelsessystem
 * b) I samsvar med kravene i denne internasjonale standarden
 * c) Effektivt implementert og vedlikeholdt
 * 
 * Organisasjonen skal:
 * - Planlegge, etablere, implementere og vedlikeholde et revisjonsprogram
 * - Definere revisjonskriterier og omfang for hver revisjon
 * - Velge revisorer og gjennomføre revisjoner for å sikre objektivitet og upartiskhet
 * - Sikre at resultatene rapporteres til relevant ledelse
 * - Ta korrigerende tiltak uten unødig forsinkelse
 * - Beholde dokumentert informasjon som bevis
 */

export const createAuditSchema = z.object({
  tenantId: z.string().cuid(),
  title: z.string().min(5, "Tittel må være minst 5 tegn"),
  auditType: z.enum(["INTERNAL", "EXTERNAL", "SUPPLIER", "CERTIFICATION"]),
  scope: z.string().min(20, "Omfang må være minst 20 tegn"),
  criteria: z.string().min(20, "Revisjonskriterier må være minst 20 tegn"),
  leadAuditorId: z.string().cuid(),
  teamMemberIds: z.array(z.string().cuid()).optional(),
  scheduledDate: z.date(),
  area: z.string().min(2, "Område må være minst 2 tegn"),
  department: z.string().optional(),
  status: z.enum(["PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).default("PLANNED"),
});

export const updateAuditSchema = z.object({
  id: z.string().cuid(),
  title: z.string().min(5).optional(),
  auditType: z.enum(["INTERNAL", "EXTERNAL", "SUPPLIER", "CERTIFICATION"]).optional(),
  scope: z.string().min(20).optional(),
  criteria: z.string().min(20).optional(),
  leadAuditorId: z.string().cuid().optional(),
  teamMemberIds: z.array(z.string().cuid()).optional(),
  scheduledDate: z.date().optional(),
  completedAt: z.date().optional(),
  area: z.string().optional(),
  department: z.string().optional(),
  status: z.enum(["PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
  summary: z.string().optional(),
  conclusion: z.string().optional(),
});

export const createFindingSchema = z.object({
  auditId: z.string().cuid(),
  findingType: z.enum(["MAJOR_NC", "MINOR_NC", "OBSERVATION", "STRENGTH"]),
  clause: z.string().min(1, "ISO 9001 klausul må spesifiseres"),
  description: z.string().min(20, "Beskrivelse må være minst 20 tegn"),
  evidence: z.string().min(10, "Bevis må være minst 10 tegn"),
  requirement: z.string().min(10, "Krav må være minst 10 tegn"),
  responsibleId: z.string().cuid(),
  dueDate: z.date().optional(),
});

export const updateFindingSchema = z.object({
  id: z.string().cuid(),
  findingType: z.enum(["MAJOR_NC", "MINOR_NC", "OBSERVATION", "STRENGTH"]).optional(),
  clause: z.string().optional(),
  description: z.string().optional(),
  evidence: z.string().optional(),
  requirement: z.string().optional(),
  responsibleId: z.string().cuid().optional(),
  dueDate: z.date().optional(),
  correctiveAction: z.string().optional(),
  rootCause: z.string().optional(),
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "VERIFIED"]).optional(),
});

export type CreateAuditInput = z.infer<typeof createAuditSchema>;
export type UpdateAuditInput = z.infer<typeof updateAuditSchema>;
export type CreateFindingInput = z.infer<typeof createFindingSchema>;
export type UpdateFindingInput = z.infer<typeof updateFindingSchema>;

/**
 * Audit Type Labels (Norsk)
 */
export function getAuditTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    INTERNAL: "Internal audit",
    EXTERNAL: "External audit",
    SUPPLIER: "Supplier audit",
    CERTIFICATION: "Certification audit",
  };
  return labels[type] || type;
}

/**
 * Audit Type Colors
 */
export function getAuditTypeColor(type: string): string {
  const colors: Record<string, string> = {
    INTERNAL: "bg-blue-100 text-blue-800 border-blue-300",
    EXTERNAL: "bg-purple-100 text-purple-800 border-purple-300",
    SUPPLIER: "bg-orange-100 text-orange-800 border-orange-300",
    CERTIFICATION: "bg-green-100 text-green-800 border-green-300",
  };
  return colors[type] || "bg-gray-100 text-gray-800 border-gray-300";
}

/**
 * Audit Status Labels
 */
export function getAuditStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PLANNED: "Planned",
    IN_PROGRESS: "In progress",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
  };
  return labels[status] || status;
}

/**
 * Audit Status Colors
 */
export function getAuditStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PLANNED: "bg-gray-100 text-gray-800 border-gray-300",
    IN_PROGRESS: "bg-yellow-100 text-black border-yellow-300",
    COMPLETED: "bg-green-100 text-green-800 border-green-300",
    CANCELLED: "bg-red-100 text-red-800 border-red-300",
  };
  return colors[status] || "bg-gray-100 text-gray-800 border-gray-300";
}

/**
 * Finding Type Labels
 */
export function getFindingTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    MAJOR_NC: "Major nonconformity",
    MINOR_NC: "Minor nonconformity",
    OBSERVATION: "Observation",
    STRENGTH: "Strength",
  };
  return labels[type] || type;
}

/**
 * Finding Type Colors
 */
export function getFindingTypeColor(type: string): string {
  const colors: Record<string, string> = {
    MAJOR_NC: "bg-red-100 text-red-800 border-red-300",
    MINOR_NC: "bg-orange-100 text-orange-800 border-orange-300",
    OBSERVATION: "bg-yellow-100 text-black border-yellow-300",
    STRENGTH: "bg-green-100 text-green-800 border-green-300",
  };
  return colors[type] || "bg-gray-100 text-gray-800 border-gray-300";
}

/**
 * Finding Status Labels
 */
export function getFindingStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    OPEN: "Open",
    IN_PROGRESS: "In progress",
    RESOLVED: "Resolved",
    VERIFIED: "Verified",
  };
  return labels[status] || status;
}

/**
 * Finding Status Colors
 */
export function getFindingStatusColor(status: string): string {
  const colors: Record<string, string> = {
    OPEN: "bg-red-100 text-red-800 border-red-300",
    IN_PROGRESS: "bg-yellow-100 text-black border-yellow-300",
    RESOLVED: "bg-blue-100 text-blue-800 border-blue-300",
    VERIFIED: "bg-green-100 text-green-800 border-green-300",
  };
  return colors[status] || "bg-gray-100 text-gray-800 border-gray-300";
}

export const ISO_9001_CLAUSES = ISO_9001_IMS.map((c) => ({
  clause: c.clause,
  title: c.title,
}));

export { auditClauseOptions };


