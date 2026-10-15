"use server";

import { revalidatePath } from "next/cache";
import {
  DocumentKind,
  IncidentStage,
  IncidentStatus,
  IncidentType,
  RiskCategory,
  RiskControlEffectiveness,
  RiskControlStatus,
  RiskControlType,
  RiskResponseStrategy,
  RiskStatus,
} from "@prisma/client";
import { z } from "zod";
import { getAdminDb } from "@/lib/supabase/admin";
import { getAuthContext } from "@/lib/server-authorization";
import { createId } from "@/lib/ids";
import { sendEmail } from "@/lib/email";
import { generateFileKey, getStorage } from "@/lib/storage";
import { calculateNextReviewDate } from "@/lib/document-utils";
import { generateSequenceNumber } from "@/lib/sequence";
import {
  assessShareImport,
  createShareToken,
  documentShareSchema,
  existingControlsForImport,
  incidentShareSchema,
  mayImportRecord,
  mayShareRecord,
  parseSharePayload,
  riskAssessmentShareSchema,
  riskContextForImport,
  shareEmailContent,
  shareExpiresAt,
  shareGateMessage,
  shareKindLabel,
  shareRecordPath,
  sharedDocumentSlug,
  type DocumentSharePayload,
  type IncidentSharePayload,
  type RecordShareKind,
  type RecordSharePayload,
  type RiskAssessmentSharePayload,
} from "@/lib/record-share";

const createShareInput = z.object({
  recordType: z.enum(["RISK_ASSESSMENT", "INCIDENT", "DOCUMENT"]),
  recordId: z.string().min(8).max(40),
  recipientEmail: z.string().email().optional().or(z.literal("")),
  note: z.string().max(1000).optional(),
});

type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

function fail(message: string): { success: false; error: string } {
  return { success: false, error: message };
}

function textOrNull(value: unknown, max = 8000): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

function bool(value: unknown): boolean {
  return value === true;
}

function intOrNull(value: unknown, min: number, max: number): number | null {
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(number) || number < min || number > max) return null;
  return number;
}

function clampScore(value: unknown): number {
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(number)) return 1;
  return Math.min(5, Math.max(1, number));
}

function oneOf<T extends string>(value: string, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

function appOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "https://hseqnova.co.uk";
  return raw.replace(/\/+$/, "");
}

async function organisationName(tenantId: string): Promise<string> {
  const { data } = await getAdminDb().from("Tenant").select("name").eq("id", tenantId).maybeSingle();
  const name = data?.name;
  return typeof name === "string" && name.trim() ? name.trim() : "An organisation";
}

async function writeAudit(input: {
  tenantId: string;
  userId: string;
  action: string;
  resource: string;
}): Promise<void> {
  await getAdminDb().from("AuditLog").insert({
    id: createId(),
    tenantId: input.tenantId,
    userId: input.userId,
    action: input.action,
    resource: input.resource,
  });
}

async function buildPayload(
  tenantId: string,
  kind: RecordShareKind,
  recordId: string,
  organisation: string,
): Promise<{ payload: RecordSharePayload; title: string; sourceFileKey: string | null }> {
  const db = getAdminDb();

  if (kind === "RISK_ASSESSMENT") {
    const { data: assessment } = await db
      .from("RiskAssessment")
      .select("id, title, assessmentYear, participants, groupsAtRisk")
      .eq("id", recordId)
      .eq("tenantId", tenantId)
      .maybeSingle();
    if (!assessment) throw { code: "NOT_FOUND", message: "Risk assessment not found." };

    const { data: risks } = await db
      .from("Risk")
      .select(
        "id, title, context, description, likelihood, consequence, status, category, location, area, existingControls, groupsAtRisk, residualLikelihood, residualConsequence, riskStatement, responseStrategy",
      )
      .eq("tenantId", tenantId)
      .eq("riskAssessmentId", recordId);

    const riskRows = risks ?? [];
    const riskIds = riskRows.map((row) => String(row.id));
    const [{ data: controls }, { data: measures }] = await Promise.all([
      riskIds.length
        ? db
            .from("RiskControl")
            .select("riskId, title, description, controlType, status, effectiveness")
            .eq("tenantId", tenantId)
            .in("riskId", riskIds)
        : Promise.resolve({ data: [] as Array<Record<string, unknown>> }),
      riskIds.length
        ? db.from("Measure").select("riskId, title").eq("tenantId", tenantId).in("riskId", riskIds)
        : Promise.resolve({ data: [] as Array<Record<string, unknown>> }),
    ]);

    const payload = riskAssessmentShareSchema.parse({
      version: 1,
      kind: "RISK_ASSESSMENT",
      title: String(assessment.title),
      assessmentYear: Number(assessment.assessmentYear) || new Date().getFullYear(),
      participants: textOrNull(assessment.participants),
      groupsAtRisk: textOrNull(assessment.groupsAtRisk, 2000),
      sourceOrganisation: organisation,
      risks: riskRows.map((risk) => ({
        title: String(risk.title || "Hazard").slice(0, 300),
        context: String(risk.context || ""),
        description: textOrNull(risk.description, 4000),
        likelihood: clampScore(risk.likelihood),
        consequence: clampScore(risk.consequence),
        status: String(risk.status || "OPEN"),
        category: String(risk.category || "SAFETY"),
        location: textOrNull(risk.location, 120),
        area: textOrNull(risk.area, 120),
        existingControls: textOrNull(risk.existingControls, 4000),
        groupsAtRisk: textOrNull(risk.groupsAtRisk, 500),
        residualLikelihood: intOrNull(risk.residualLikelihood, 1, 5),
        residualConsequence: intOrNull(risk.residualConsequence, 1, 5),
        riskStatement: textOrNull(risk.riskStatement, 4000),
        responseStrategy: String(risk.responseStrategy || "REDUCE"),
        controls: (controls ?? [])
          .filter((control) => control.riskId === risk.id)
          .slice(0, 40)
          .map((control) => ({
            title: String(control.title || "Control").slice(0, 300),
            description: textOrNull(control.description, 4000),
            controlType: String(control.controlType || "ADMINISTRATIVE"),
            status: String(control.status || "ACTIVE"),
            effectiveness: String(control.effectiveness || "NOT_TESTED"),
          })),
        actions: (measures ?? [])
          .filter((measure) => measure.riskId === risk.id)
          .map((measure) => String(measure.title || "").trim())
          .filter(Boolean)
          .slice(0, 20),
      })),
    });

    return { payload, title: payload.title, sourceFileKey: null };
  }

  if (kind === "INCIDENT") {
    const { data: incident } = await db
      .from("Incident")
      .select(
        "id, title, description, type, severity, occurredAt, status, location, witnessName, witnessAddress, immediateAction, rootCause, contributingFactors, injuryType, injuryDescription, involvedPersons, injuredPersonOccupation, injuredPersonAddress, injuredPersonRole, suggestedActions, lessonsLearned, medicalAttentionRequired, isFatal, isLostTimeIncident, lostWorkdays, isRestrictedWork, specifiedInjury, listedOccupationalDisease, listedDangerousOccurrence, nonWorkerTakenToHospital, overSevenDayInjury, overThreeDayInjury, accidentBookEntry, riddorReportable, riddorCategory, riddorReference, riddorReportedAt, subcategoryKeys, avviksnummer, projectReference",
      )
      .eq("id", recordId)
      .eq("tenantId", tenantId)
      .maybeSingle();
    if (!incident) throw { code: "NOT_FOUND", message: "Incident not found." };

    const { data: measures } = await db
      .from("Measure")
      .select("title")
      .eq("tenantId", tenantId)
      .eq("incidentId", recordId);

    let subcategoryKeys: string[] = [];
    if (typeof incident.subcategoryKeys === "string" && incident.subcategoryKeys) {
      try {
        const parsed = JSON.parse(incident.subcategoryKeys) as unknown;
        if (Array.isArray(parsed)) {
          subcategoryKeys = parsed.filter((value): value is string => typeof value === "string").slice(0, 30);
        }
      } catch {
        subcategoryKeys = [];
      }
    }

    const payload = incidentShareSchema.parse({
      version: 1,
      kind: "INCIDENT",
      title: String(incident.title),
      description: String(incident.description || "No description recorded."),
      type: String(incident.type),
      severity: intOrNull(incident.severity, 1, 5),
      occurredAt: new Date(String(incident.occurredAt)).toISOString(),
      statusWhenShared: String(incident.status || "OPEN"),
      location: textOrNull(incident.location, 300),
      witnessName: textOrNull(incident.witnessName, 200),
      witnessAddress: textOrNull(incident.witnessAddress, 500),
      immediateAction: textOrNull(incident.immediateAction),
      rootCause: textOrNull(incident.rootCause),
      contributingFactors: textOrNull(incident.contributingFactors),
      injuryType: textOrNull(incident.injuryType, 200),
      injuryDescription: textOrNull(incident.injuryDescription),
      involvedPersons: textOrNull(incident.involvedPersons, 4000),
      injuredPersonOccupation: textOrNull(incident.injuredPersonOccupation, 200),
      injuredPersonAddress: textOrNull(incident.injuredPersonAddress, 500),
      injuredPersonRole: textOrNull(incident.injuredPersonRole, 40),
      suggestedActions: textOrNull(incident.suggestedActions),
      lessonsLearned: textOrNull(incident.lessonsLearned),
      medicalAttentionRequired: bool(incident.medicalAttentionRequired),
      isFatal: bool(incident.isFatal),
      isLostTimeIncident: bool(incident.isLostTimeIncident),
      lostWorkdays: intOrNull(incident.lostWorkdays, 0, 10000),
      isRestrictedWork: bool(incident.isRestrictedWork),
      specifiedInjury: bool(incident.specifiedInjury),
      listedOccupationalDisease: bool(incident.listedOccupationalDisease),
      listedDangerousOccurrence: bool(incident.listedDangerousOccurrence),
      nonWorkerTakenToHospital: bool(incident.nonWorkerTakenToHospital),
      overSevenDayInjury: bool(incident.overSevenDayInjury),
      overThreeDayInjury: bool(incident.overThreeDayInjury),
      accidentBookEntry: incident.accidentBookEntry !== false,
      riddorReportable: bool(incident.riddorReportable),
      riddorCategory: textOrNull(incident.riddorCategory, 80),
      riddorReference: textOrNull(incident.riddorReference, 80),
      riddorAlreadyReported: Boolean(incident.riddorReportedAt || incident.riddorReference),
      subcategoryKeys,
      originalReference: textOrNull(incident.avviksnummer, 40),
      projectReference: textOrNull(incident.projectReference, 120),
      sourceOrganisation: organisation,
      actions: (measures ?? [])
        .map((measure) => String(measure.title || "").trim())
        .filter(Boolean)
        .slice(0, 20),
    });

    return { payload, title: payload.title, sourceFileKey: null };
  }

  const { data: document } = await db
    .from("Document")
    .select(
      "id, title, kind, version, mime, fileKey, planSummary, doSummary, checkSummary, actSummary, reviewIntervalMonths",
    )
    .eq("id", recordId)
    .eq("tenantId", tenantId)
    .maybeSingle();
  if (!document) throw { code: "NOT_FOUND", message: "Document not found." };
  if (!document.fileKey) throw { code: "NO_FILE", message: "This document has no file to share." };

  const fileName = String(document.fileKey).split("/").pop() || "document";
  const interval = intOrNull(document.reviewIntervalMonths, 1, 60) ?? 12;
  const payload = documentShareSchema.parse({
    version: 1,
    kind: "DOCUMENT",
    title: String(document.title),
    documentKind: String(document.kind),
    versionLabel: String(document.version || "v1.0"),
    mime: String(document.mime || "application/octet-stream"),
    planSummary: textOrNull(document.planSummary),
    doSummary: textOrNull(document.doSummary),
    checkSummary: textOrNull(document.checkSummary),
    actSummary: textOrNull(document.actSummary),
    reviewIntervalMonths: interval,
    sourceOrganisation: organisation,
    fileName: fileName.slice(0, 200),
  });

  return { payload, title: payload.title, sourceFileKey: String(document.fileKey) };
}

export async function createRecordShare(input: {
  recordType: RecordShareKind;
  recordId: string;
  recipientEmail?: string;
  note?: string;
}): Promise<
  ActionResult<{ url: string; expiresAt: string; emailed: boolean; emailError: string | null }>
> {
  try {
    const auth = await getAuthContext();
    if (!auth) return fail("Sign in to continue.");

    const parsed = createShareInput.parse(input);
    if (!mayShareRecord(parsed.recordType, auth.permissions)) {
      return fail("You do not have permission to share this record.");
    }

    const organisation = await organisationName(auth.tenantId);
    const built = await buildPayload(auth.tenantId, parsed.recordType, parsed.recordId, organisation);
    const token = createShareToken();
    const expiresAt = shareExpiresAt();
    const email = parsed.recipientEmail?.trim() || null;
    const note = parsed.note?.trim() || null;
    const now = new Date().toISOString();

    const { error } = await getAdminDb().from("RecordShare").insert({
      id: createId(),
      token,
      sourceTenantId: auth.tenantId,
      recordType: parsed.recordType,
      recordId: parsed.recordId,
      title: built.title,
      createdById: auth.userId,
      recipientEmail: email,
      note,
      payload: built.payload,
      sourceFileKey: built.sourceFileKey,
      expiresAt: expiresAt.toISOString(),
      createdAt: now,
    });
    if (error) return fail(error.message || "Could not create the share.");

    const url = `${appOrigin()}${shareRecordPath(token)}`;
    let emailed = false;
    let emailError: string | null = null;
    if (email) {
      try {
        const message = shareEmailContent({
          organisationName: organisation,
          title: built.title,
          kind: parsed.recordType,
          url,
          expiresAt,
          note,
        });
        await sendEmail({ to: email, subject: message.subject, html: message.html });
        emailed = true;
      } catch (sendError) {
        emailError =
          sendError && typeof sendError === "object" && "message" in sendError
            ? String((sendError as { message?: string }).message)
            : "The link was created, but the email could not be sent.";
      }
    }

    await writeAudit({
      tenantId: auth.tenantId,
      userId: auth.userId,
      action: "RECORD_SHARED",
      resource: `${parsed.recordType}:${parsed.recordId}`,
    });

    return {
      success: true,
      data: { url, expiresAt: expiresAt.toISOString(), emailed, emailError },
    };
  } catch (error) {
    if (error && typeof error === "object" && "message" in error) {
      return fail(String((error as { message?: string }).message));
    }
    return fail("Could not share this record.");
  }
}

export type SharePreview = {
  title: string;
  kind: RecordShareKind;
  kindLabel: string;
  sourceOrganisation: string;
  expiresAt: string;
  itemCount: number;
  personalData: boolean;
  canImport: boolean;
  blockedReason: string | null;
};

export async function previewRecordShare(token: string): Promise<ActionResult<SharePreview>> {
  try {
    const auth = await getAuthContext();
    if (!auth) return fail("Sign in to continue.");
    const share = await loadShare(token);
    if (!share) return fail("This share link is not valid.");

    const payload = parseSharePayload(share.recordType, share.payload);
    const gate = assessShareImport({
      now: new Date(),
      expiresAt: new Date(share.expiresAt),
      revokedAt: share.revokedAt ? new Date(share.revokedAt) : null,
      importedAt: share.importedAt ? new Date(share.importedAt) : null,
      sourceTenantId: share.sourceTenantId,
      destinationTenantId: auth.tenantId,
    });
    const permitted = mayImportRecord(share.recordType, auth.permissions);
    const blockedReason =
      "code" in gate
        ? shareGateMessage(gate.code)
        : permitted
          ? null
          : "You do not have permission to import this into the current organisation.";

    return {
      success: true,
      data: {
        title: share.title,
        kind: share.recordType,
        kindLabel: shareKindLabel(share.recordType),
        sourceOrganisation: payload.sourceOrganisation,
        expiresAt: share.expiresAt,
        itemCount:
          payload.kind === "RISK_ASSESSMENT" ? payload.risks.length : payload.kind === "INCIDENT" ? 1 : 1,
        personalData: payload.kind === "INCIDENT",
        canImport: gate.ok && permitted,
        blockedReason,
      },
    };
  } catch {
    return fail("This share link could not be read.");
  }
}

export async function importRecordShare(
  token: string,
): Promise<ActionResult<{ href: string }>> {
  const auth = await getAuthContext();
  if (!auth) return fail("Sign in to continue.");

  const share = await loadShare(token);
  if (!share) return fail("This share link is not valid.");
  if (!mayImportRecord(share.recordType, auth.permissions)) {
    return fail("You do not have permission to import this into the current organisation.");
  }

  let payload: RecordSharePayload;
  try {
    payload = parseSharePayload(share.recordType, share.payload);
  } catch {
    return fail("This shared record is not in a format HSEQ Nova can import.");
  }

  const gate = assessShareImport({
    now: new Date(),
    expiresAt: new Date(share.expiresAt),
    revokedAt: share.revokedAt ? new Date(share.revokedAt) : null,
    importedAt: share.importedAt ? new Date(share.importedAt) : null,
    sourceTenantId: share.sourceTenantId,
    destinationTenantId: auth.tenantId,
  });
  if ("code" in gate) return fail(shareGateMessage(gate.code));

  let fileBuffer: Buffer | null = null;
  if (payload.kind === "DOCUMENT") {
    if (!share.sourceFileKey) return fail("The shared document has no file.");
    fileBuffer = await getStorage().get(share.sourceFileKey);
    if (!fileBuffer) return fail("The shared file is no longer available. Ask the sender to share it again.");
  }

  const claimed = await claimShare(share.id, auth.tenantId);
  if (!claimed) return fail("This record has already been imported.");

  try {
    const importedId =
      payload.kind === "RISK_ASSESSMENT"
        ? await importRiskAssessment(payload, auth.tenantId, auth.userId)
        : payload.kind === "INCIDENT"
          ? await importIncident(payload, auth.tenantId, auth.userId)
          : await importDocument(payload, fileBuffer as Buffer, auth.tenantId, auth.userId, auth.userEmail);

    await getAdminDb()
      .from("RecordShare")
      .update({ importedRecordId: importedId })
      .eq("id", share.id);

    await writeAudit({
      tenantId: auth.tenantId,
      userId: auth.userId,
      action: "RECORD_IMPORTED",
      resource: `${share.recordType}:${importedId}`,
    });

    const href =
      payload.kind === "RISK_ASSESSMENT"
        ? `/dashboard/risks/assessment/${importedId}`
        : payload.kind === "INCIDENT"
          ? `/dashboard/incidents/${importedId}`
          : `/dashboard/documents/${importedId}`;

    revalidatePath("/dashboard/risks");
    revalidatePath("/dashboard/incidents");
    revalidatePath("/dashboard/documents");
    return { success: true, data: { href } };
  } catch (error) {
    await releaseShare(share.id);
    const message =
      error && typeof error === "object" && "message" in error
        ? String((error as { message?: string }).message)
        : "Could not import this record.";
    return fail(message);
  }
}

type ShareRow = {
  id: string;
  token: string;
  sourceTenantId: string;
  recordType: RecordShareKind;
  title: string;
  payload: unknown;
  sourceFileKey: string | null;
  expiresAt: string;
  revokedAt: string | null;
  importedAt: string | null;
};

async function loadShare(token: string): Promise<ShareRow | null> {
  if (!/^[a-f0-9]{48}$/.test(token)) return null;
  const { data } = await getAdminDb()
    .from("RecordShare")
    .select(
      "id, token, sourceTenantId, recordType, title, payload, sourceFileKey, expiresAt, revokedAt, importedAt",
    )
    .eq("token", token)
    .maybeSingle();
  if (!data) return null;
  if (data.recordType !== "RISK_ASSESSMENT" && data.recordType !== "INCIDENT" && data.recordType !== "DOCUMENT") {
    return null;
  }
  return data as ShareRow;
}

async function claimShare(id: string, tenantId: string): Promise<boolean> {
  const { data } = await getAdminDb()
    .from("RecordShare")
    .update({
      importedAt: new Date().toISOString(),
      importedByTenantId: tenantId,
      importedRecordId: "pending",
    })
    .eq("id", id)
    .is("importedAt", null)
    .select("id")
    .maybeSingle();
  return Boolean(data?.id);
}

async function releaseShare(id: string): Promise<void> {
  await getAdminDb()
    .from("RecordShare")
    .update({ importedAt: null, importedByTenantId: null, importedRecordId: null })
    .eq("id", id)
    .eq("importedRecordId", "pending");
}

async function importRiskAssessment(
  payload: RiskAssessmentSharePayload,
  tenantId: string,
  userId: string,
): Promise<string> {
  const db = getAdminDb();
  const now = new Date().toISOString();
  const assessmentId = createId();
  const importedOn = new Date().toLocaleDateString("en-GB");
  const participants = [
    `Imported from ${payload.sourceOrganisation} on ${importedOn}.`,
    payload.participants,
  ]
    .filter(Boolean)
    .join("\n\n")
    .slice(0, 8000);

  const { error } = await db.from("RiskAssessment").insert({
    id: assessmentId,
    tenantId,
    title: payload.title,
    assessmentYear: payload.assessmentYear,
    participants,
    groupsAtRisk: payload.groupsAtRisk,
    createdAt: now,
    updatedAt: now,
  });
  if (error) throw { code: "IMPORT_FAILED", message: error.message };

  const createdRiskIds: string[] = [];
  try {
  for (const item of payload.risks) {
    const riskId = createId();
    const likelihood = clampScore(item.likelihood);
    const consequence = clampScore(item.consequence);
    const { error: riskError } = await db.from("Risk").insert({
      id: riskId,
      tenantId,
      riskAssessmentId: assessmentId,
      title: item.title.slice(0, 300),
      context: riskContextForImport(item.context, item.title),
      description: item.description,
      existingControls: existingControlsForImport(item.existingControls),
      groupsAtRisk: item.groupsAtRisk,
      location: item.location,
      area: item.area,
      category: oneOf(item.category, Object.values(RiskCategory), RiskCategory.SAFETY),
      likelihood,
      consequence,
      score: likelihood * consequence,
      ownerId: userId,
      status: oneOf(item.status, Object.values(RiskStatus), RiskStatus.OPEN),
      riskStatement: item.riskStatement,
      controlFrequency: "ANNUAL",
      residualLikelihood: item.residualLikelihood,
      residualConsequence: item.residualConsequence,
      residualScore:
        item.residualLikelihood && item.residualConsequence
          ? item.residualLikelihood * item.residualConsequence
          : null,
      responseStrategy: oneOf(
        item.responseStrategy,
        Object.values(RiskResponseStrategy),
        RiskResponseStrategy.REDUCE,
      ),
      createdById: userId,
      updatedById: userId,
      createdAt: now,
      updatedAt: now,
    });
    if (riskError) throw { code: "IMPORT_FAILED", message: riskError.message };
    createdRiskIds.push(riskId);

    if (item.controls.length > 0) {
      const { error: controlError } = await db.from("RiskControl").insert(
        item.controls.map((control) => ({
          id: createId(),
          tenantId,
          riskId,
          title: control.title,
          description: control.description,
          controlType: oneOf(control.controlType, Object.values(RiskControlType), RiskControlType.ADMINISTRATIVE),
          status: oneOf(control.status, Object.values(RiskControlStatus), RiskControlStatus.ACTIVE),
          effectiveness: oneOf(
            control.effectiveness,
            Object.values(RiskControlEffectiveness),
            RiskControlEffectiveness.NOT_TESTED,
          ),
          createdAt: now,
          updatedAt: now,
        })),
      );
      if (controlError) throw { code: "IMPORT_FAILED", message: controlError.message };
    }

    if (item.actions.length > 0) {
      const dueAt = new Date();
      dueAt.setDate(dueAt.getDate() + 14);
      const { error: measureError } = await db.from("Measure").insert(
        item.actions.map((title) => ({
          id: createId(),
          tenantId,
          riskId,
          title,
          description: `Action copied from the risk assessment shared by ${payload.sourceOrganisation}. Confirm the owner and the due date.`,
          dueAt: dueAt.toISOString(),
          responsibleId: userId,
          category: "CORRECTIVE",
          followUpFrequency: "ANNUAL",
          createdById: userId,
          updatedAt: now,
        })),
      );
      if (measureError) throw { code: "IMPORT_FAILED", message: measureError.message };
    }
  }
  } catch (error) {
    if (createdRiskIds.length > 0) {
      await db.from("Measure").delete().eq("tenantId", tenantId).in("riskId", createdRiskIds);
      await db.from("RiskControl").delete().eq("tenantId", tenantId).in("riskId", createdRiskIds);
      await db.from("Risk").delete().eq("tenantId", tenantId).in("id", createdRiskIds);
    }
    await db.from("RiskAssessment").delete().eq("id", assessmentId).eq("tenantId", tenantId);
    throw error;
  }

  return assessmentId;
}

async function importIncident(
  payload: IncidentSharePayload,
  tenantId: string,
  userId: string,
): Promise<string> {
  const occurred = new Date(payload.occurredAt);
  if (Number.isNaN(occurred.getTime())) {
    throw { code: "IMPORT_FAILED", message: "The shared incident has no valid date." };
  }
  const type = oneOf(payload.type, Object.values(IncidentType), "" as IncidentType);
  if (!type) throw { code: "IMPORT_FAILED", message: "This incident type cannot be imported." };

  const avviksnummer = await generateSequenceNumber(tenantId, "AVVIK", occurred.getFullYear());
  const now = new Date().toISOString();
  const incidentId = createId();
  const footer = [
    "",
    `Imported from ${payload.sourceOrganisation} on ${new Date().toLocaleDateString("en-GB")}.`,
    payload.originalReference ? `Original reference: ${payload.originalReference}.` : null,
    `Status when shared: ${payload.statusWhenShared}.`,
  ]
    .filter(Boolean)
    .join("\n");

  const { error } = await getAdminDb().from("Incident").insert({
    id: incidentId,
    tenantId,
    avviksnummer,
    type,
    title: payload.title,
    description: `${payload.description}${footer}`.slice(0, 20000),
    severity: payload.severity,
    occurredAt: occurred.toISOString(),
    reportedBy: userId,
    location: payload.location,
    witnessName: payload.witnessName,
    witnessAddress: payload.witnessAddress,
    immediateAction: payload.immediateAction,
    rootCause: payload.rootCause,
    contributingFactors: payload.contributingFactors,
    injuryType: payload.injuryType,
    injuryDescription: payload.injuryDescription,
    involvedPersons: payload.involvedPersons,
    injuredPersonOccupation: payload.injuredPersonOccupation,
    injuredPersonAddress: payload.injuredPersonAddress,
    injuredPersonRole: payload.injuredPersonRole,
    suggestedActions: payload.suggestedActions,
    lessonsLearned: payload.lessonsLearned,
    medicalAttentionRequired: payload.medicalAttentionRequired,
    isFatal: payload.isFatal,
    isLostTimeIncident: payload.isLostTimeIncident,
    lostWorkdays: payload.lostWorkdays,
    isRestrictedWork: payload.isRestrictedWork,
    specifiedInjury: payload.specifiedInjury,
    listedOccupationalDisease: payload.listedOccupationalDisease,
    listedDangerousOccurrence: payload.listedDangerousOccurrence,
    nonWorkerTakenToHospital: payload.nonWorkerTakenToHospital,
    overSevenDayInjury: payload.overSevenDayInjury,
    overThreeDayInjury: payload.overThreeDayInjury,
    accidentBookEntry: payload.accidentBookEntry,
    riddorReportable: payload.riddorReportable,
    riddorCategory: payload.riddorCategory,
    riddorReference: payload.riddorReference,
    riddorReportedAt: payload.riddorAlreadyReported ? now : null,
    subcategoryKeys: payload.subcategoryKeys.length ? JSON.stringify(payload.subcategoryKeys) : null,
    projectReference: payload.projectReference,
    source: "EXTERNAL",
    status: IncidentStatus.OPEN,
    stage: IncidentStage.REPORTED,
    createdById: userId,
    updatedById: userId,
    updatedAt: now,
  });
  if (error) throw { code: "IMPORT_FAILED", message: error.message };

  if (payload.actions.length > 0) {
    const dueAt = new Date();
    dueAt.setDate(dueAt.getDate() + 14);
    await getAdminDb().from("Measure").insert(
      payload.actions.map((title) => ({
        id: createId(),
        tenantId,
        incidentId,
        title,
        description: `Action copied from the incident shared by ${payload.sourceOrganisation}. Confirm the owner and the due date.`,
        dueAt: dueAt.toISOString(),
        responsibleId: userId,
        category: "CORRECTIVE",
        followUpFrequency: "ANNUAL",
        createdById: userId,
        updatedAt: now,
      })),
    );
  }

  return incidentId;
}

async function importDocument(
  payload: DocumentSharePayload,
  file: Buffer,
  tenantId: string,
  userId: string,
  userEmail: string,
): Promise<string> {
  const kind = oneOf(payload.documentKind, Object.values(DocumentKind), "" as DocumentKind);
  if (!kind) throw { code: "IMPORT_FAILED", message: "This document type cannot be imported." };

  const documentId = createId();
  const slug = sharedDocumentSlug(payload.title, documentId);
  const fileKey = generateFileKey(tenantId, "documents", payload.fileName);
  await getStorage().upload(fileKey, file);
  const now = new Date();
  const nextReview = calculateNextReviewDate(now, payload.reviewIntervalMonths);

  const { error } = await getAdminDb().from("Document").insert({
    id: documentId,
    tenantId,
    kind,
    title: payload.title,
    slug,
    version: payload.versionLabel,
    status: "DRAFT",
    fileKey,
    mime: payload.mime,
    ownerId: userId,
    updatedBy: userEmail,
    reviewIntervalMonths: payload.reviewIntervalMonths,
    effectiveFrom: now.toISOString(),
    planSummary: payload.planSummary,
    doSummary: payload.doSummary,
    checkSummary: payload.checkSummary,
    actSummary: payload.actSummary,
    nextReviewDate: nextReview.toISOString(),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  });
  if (error) throw { code: "IMPORT_FAILED", message: error.message };

  const { error: versionError } = await getAdminDb().from("DocumentVersion").insert({
    id: createId(),
    tenantId,
    documentId,
    version: payload.versionLabel,
    fileKey,
    mime: payload.mime,
    uploadedBy: userEmail,
    changeComment: `Imported from ${payload.sourceOrganisation}. Review and approve before this becomes the working copy.`,
  });
  if (versionError) {
    await getAdminDb().from("Document").delete().eq("id", documentId).eq("tenantId", tenantId);
    throw { code: "IMPORT_FAILED", message: versionError.message };
  }

  return documentId;
}
