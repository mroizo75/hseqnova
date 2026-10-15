import { randomBytes } from "node:crypto";
import { z } from "zod";

/**
 * A record shared from one organisation into another.
 * The employer who imports it keeps the copy (MHSWR 1999 reg.3 risk assessments;
 * Social Security (Claims and Payments) Regulations 1979 accident book).
 */
export const RECORD_SHARE_KINDS = ["RISK_ASSESSMENT", "INCIDENT", "DOCUMENT"] as const;
export type RecordShareKind = (typeof RECORD_SHARE_KINDS)[number];

export const SHARE_TTL_MS = 14 * 24 * 60 * 60 * 1000;

export function createShareToken(): string {
  return randomBytes(24).toString("hex");
}

const text = (max: number) => z.string().max(max).nullable();
const actionTitles = z.array(z.string().min(1).max(300)).max(20);

export const sharedControlSchema = z.object({
  title: z.string().min(1).max(300),
  description: text(4000),
  controlType: z.string().min(1).max(40),
  status: z.string().min(1).max(40),
  effectiveness: z.string().min(1).max(40),
});

export const sharedRiskItemSchema = z.object({
  title: z.string().min(1).max(300),
  context: z.string().max(8000),
  description: text(4000),
  likelihood: z.number().int().min(1).max(5),
  consequence: z.number().int().min(1).max(5),
  status: z.string().min(1).max(40),
  category: z.string().min(1).max(40),
  location: text(120),
  area: text(120),
  existingControls: text(4000),
  groupsAtRisk: text(500),
  residualLikelihood: z.number().int().min(1).max(5).nullable(),
  residualConsequence: z.number().int().min(1).max(5).nullable(),
  riskStatement: text(4000),
  responseStrategy: z.string().min(1).max(40),
  controls: z.array(sharedControlSchema).max(40),
  actions: actionTitles,
});

export const riskAssessmentShareSchema = z.object({
  version: z.literal(1),
  kind: z.literal("RISK_ASSESSMENT"),
  title: z.string().min(3).max(200),
  assessmentYear: z.number().int().min(2000).max(2100),
  participants: text(8000),
  groupsAtRisk: text(2000),
  sourceOrganisation: z.string().min(1).max(200),
  risks: z.array(sharedRiskItemSchema).max(200),
});

export const incidentShareSchema = z.object({
  version: z.literal(1),
  kind: z.literal("INCIDENT"),
  title: z.string().min(3).max(300),
  description: z.string().min(1).max(20000),
  type: z.string().min(1).max(40),
  severity: z.number().int().min(1).max(5).nullable(),
  occurredAt: z.string().min(8).max(40),
  statusWhenShared: z.string().min(1).max(40),
  location: text(300),
  witnessName: text(200),
  witnessAddress: text(500),
  immediateAction: text(8000),
  rootCause: text(8000),
  contributingFactors: text(8000),
  injuryType: text(200),
  injuryDescription: text(8000),
  involvedPersons: text(4000),
  injuredPersonOccupation: text(200),
  injuredPersonAddress: text(500),
  injuredPersonRole: text(40),
  suggestedActions: text(8000),
  lessonsLearned: text(8000),
  medicalAttentionRequired: z.boolean(),
  isFatal: z.boolean(),
  isLostTimeIncident: z.boolean(),
  lostWorkdays: z.number().int().min(0).max(10000).nullable(),
  isRestrictedWork: z.boolean(),
  specifiedInjury: z.boolean(),
  listedOccupationalDisease: z.boolean(),
  listedDangerousOccurrence: z.boolean(),
  nonWorkerTakenToHospital: z.boolean(),
  overSevenDayInjury: z.boolean(),
  overThreeDayInjury: z.boolean(),
  accidentBookEntry: z.boolean(),
  riddorReportable: z.boolean(),
  riddorCategory: text(80),
  riddorReference: text(80),
  riddorAlreadyReported: z.boolean(),
  subcategoryKeys: z.array(z.string().min(1).max(80)).max(30),
  originalReference: text(40),
  projectReference: text(120),
  sourceOrganisation: z.string().min(1).max(200),
  actions: actionTitles,
});

export const documentShareSchema = z.object({
  version: z.literal(1),
  kind: z.literal("DOCUMENT"),
  title: z.string().min(1).max(300),
  documentKind: z.string().min(1).max(40),
  versionLabel: z.string().min(1).max(40),
  mime: z.string().min(1).max(200),
  planSummary: text(8000),
  doSummary: text(8000),
  checkSummary: text(8000),
  actSummary: text(8000),
  reviewIntervalMonths: z.number().int().min(1).max(60),
  sourceOrganisation: z.string().min(1).max(200),
  fileName: z.string().min(1).max(200),
});

export type RiskAssessmentSharePayload = z.infer<typeof riskAssessmentShareSchema>;
export type IncidentSharePayload = z.infer<typeof incidentShareSchema>;
export type DocumentSharePayload = z.infer<typeof documentShareSchema>;
export type RecordSharePayload =
  | RiskAssessmentSharePayload
  | IncidentSharePayload
  | DocumentSharePayload;

export type SharePermissions = {
  canCreateRisks: boolean;
  canReadIncidents: boolean;
  canCreateIncidents: boolean;
  canCreateDocuments: boolean;
  canApproveDocuments: boolean;
};

export type ShareGate =
  | { ok: true }
  | {
      ok: false;
      code: "EXPIRED" | "REVOKED" | "ALREADY_IMPORTED" | "SAME_ORGANISATION";
    };

export function shareExpiresAt(now = new Date()): Date {
  return new Date(now.getTime() + SHARE_TTL_MS);
}

export function shareRecordPath(token: string): string {
  return `/dashboard/share/${token}`;
}

export function shareKindLabel(kind: RecordShareKind): string {
  if (kind === "RISK_ASSESSMENT") return "risk assessment";
  if (kind === "INCIDENT") return "incident record";
  return "document";
}

export function mayShareRecord(kind: RecordShareKind, permissions: SharePermissions): boolean {
  if (kind === "RISK_ASSESSMENT") return permissions.canCreateRisks;
  if (kind === "INCIDENT") return permissions.canReadIncidents;
  return permissions.canCreateDocuments || permissions.canApproveDocuments;
}

export function mayImportRecord(kind: RecordShareKind, permissions: SharePermissions): boolean {
  if (kind === "RISK_ASSESSMENT") return permissions.canCreateRisks;
  if (kind === "INCIDENT") return permissions.canReadIncidents && permissions.canCreateIncidents;
  return permissions.canCreateDocuments;
}

export function assessShareImport(input: {
  now: Date;
  expiresAt: Date;
  revokedAt: Date | null;
  importedAt: Date | null;
  sourceTenantId: string;
  destinationTenantId: string;
}): ShareGate {
  if (input.revokedAt) return { ok: false, code: "REVOKED" };
  if (input.importedAt) return { ok: false, code: "ALREADY_IMPORTED" };
  if (input.expiresAt.getTime() <= input.now.getTime()) return { ok: false, code: "EXPIRED" };
  if (input.sourceTenantId === input.destinationTenantId) {
    return { ok: false, code: "SAME_ORGANISATION" };
  }
  return { ok: true };
}

export function shareGateMessage(code: Exclude<ShareGate, { ok: true }>["code"]): string {
  if (code === "EXPIRED") return "This share link has expired. Ask the sender for a new one.";
  if (code === "REVOKED") return "This share link has been withdrawn.";
  if (code === "ALREADY_IMPORTED") return "This record has already been imported.";
  return "Import this into the customer's organisation, not the one that created the share.";
}

export function sharedDocumentSlug(title: string, recordId: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  const suffix = recordId.replace(/[^a-z0-9]/gi, "").slice(-6).toLowerCase() || "copy";
  return `${base || "document"}-shared-${suffix}`;
}

export function riskContextForImport(context: string, title: string): string {
  const trimmed = context.trim();
  if (trimmed.length >= 10) return trimmed.slice(0, 4000);
  const fallback = `${title.trim()}. Shared from another organisation.`;
  return fallback.length >= 10 ? fallback.slice(0, 4000) : "Shared workplace risk assessment.";
}

export function existingControlsForImport(value: string | null): string {
  const trimmed = (value ?? "").trim();
  if (trimmed.length >= 8) return trimmed.slice(0, 2000);
  if (!trimmed) return "Recorded on the shared assessment.";
  return `${trimmed}. Recorded on the shared assessment.`.slice(0, 2000);
}

export function parseSharePayload(kind: RecordShareKind, payload: unknown): RecordSharePayload {
  if (kind === "RISK_ASSESSMENT") return riskAssessmentShareSchema.parse(payload);
  if (kind === "INCIDENT") return incidentShareSchema.parse(payload);
  return documentShareSchema.parse(payload);
}

export function shareEmailContent(input: {
  organisationName: string;
  title: string;
  kind: RecordShareKind;
  url: string;
  expiresAt: Date;
  note: string | null;
}): { subject: string; html: string } {
  const label = shareKindLabel(input.kind);
  const expires = input.expiresAt.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const note = input.note?.trim()
    ? `<p style="margin:16px 0"><strong>Note from the sender</strong><br>${escapeHtml(input.note.trim())}</p>`
    : "";
  const personal =
    input.kind === "INCIDENT"
      ? `<p style="margin:16px 0">This may include personal data from the accident book. Import it only into the employer's HSEQ Nova organisation. Keep accident book entries for at least three years.</p>`
      : "";
  const subject = `${input.organisationName} shared a ${label}: ${input.title}`;
  const html = `<p>${escapeHtml(input.organisationName)} has shared a ${label} with you in HSEQ Nova.</p>
<p><strong>${escapeHtml(input.title)}</strong></p>
${note}
${personal}
<p>Sign in to the organisation that should keep the record, then import it. The link expires on ${expires} and can be imported once.</p>
<p><a href="${escapeHtml(input.url)}">Open the shared record</a></p>`;
  return { subject, html };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
