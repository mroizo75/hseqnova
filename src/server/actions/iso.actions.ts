"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getRequiredTenantContext } from "@/lib/tenant-context";
import { requireTenantModule, getEnabledModuleKeys } from "@/lib/require-tenant-module";
import { AuditLog } from "@/lib/audit-log";
import {
  completeIsoConsultationMeeting,
  deleteIsoContextIssue,
  deleteIsoInterestedParty,
  deleteIsoLegalRequirement,
  evaluateIsoLegalRequirement,
  generateIsoImplementationTasks,
  insertIsoChange,
  insertIsoConsultationMeeting,
  insertIsoContextIssue,
  insertIsoCustomerFeedback,
  insertIsoInterestedParty,
  insertIsoLegalRequirement,
  insertIsoProcess,
  deleteIsoProcess,
  linkIsoClauseDocument,
  unlinkIsoClauseDocument,
  loadIsoReadiness,
  seedDefaultLegalRequirements,
  updateIsoChangeStatus,
  upsertIsoClauseAssessment,
  upsertIsoScope,
  assertUserIsTenantMember,
} from "@/server/queries/iso.queries";

function errorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

async function requireIso() {
  await requireTenantModule("iso");
  return getRequiredTenantContext();
}

const contextSchema = z.object({
  kind: z.enum(["INTERNAL", "EXTERNAL", "OPPORTUNITY"]),
  title: z.string().min(3),
  description: z.string().optional(),
  relevance: z.string().optional(),
});

export async function createIsoContextIssue(input: Record<string, unknown>) {
  try {
    const { tenantId, userId } = await requireIso();
    const validated = contextSchema.parse(input);
    const row = await insertIsoContextIssue({ tenantId, ...validated });
    await AuditLog.log(tenantId, userId, "ISO_CONTEXT_CREATED", "IsoContextIssue", row.id, {
      title: row.title,
    });
    revalidatePath("/dashboard/iso");
    return { success: true as const, data: row };
  } catch (error) {
    return { success: false as const, error: errorMessage(error, "Could not save the context issue") };
  }
}

export async function removeIsoContextIssue(id: string) {
  try {
    const { tenantId, userId } = await requireIso();
    await deleteIsoContextIssue(tenantId, id);
    await AuditLog.log(tenantId, userId, "ISO_CONTEXT_DELETED", "IsoContextIssue", id, {});
    revalidatePath("/dashboard/iso");
    return { success: true as const };
  } catch (error) {
    return { success: false as const, error: errorMessage(error, "Could not delete the context issue") };
  }
}

const partySchema = z.object({
  name: z.string().min(2),
  partyType: z.enum(["WORKERS", "CONTRACTOR", "CUSTOMER", "REGULATOR", "COMMUNITY", "OTHER"]),
  needs: z.string().min(5),
  expectations: z.string().min(5),
  consultationMethod: z.string().optional(),
});

export async function createIsoInterestedParty(input: Record<string, unknown>) {
  try {
    const { tenantId, userId } = await requireIso();
    const validated = partySchema.parse(input);
    const row = await insertIsoInterestedParty({ tenantId, ...validated });
    await AuditLog.log(tenantId, userId, "ISO_PARTY_CREATED", "IsoInterestedParty", row.id, {
      name: row.name,
    });
    revalidatePath("/dashboard/iso");
    return { success: true as const, data: row };
  } catch (error) {
    return { success: false as const, error: errorMessage(error, "Could not save the interested party") };
  }
}

export async function removeIsoInterestedParty(id: string) {
  try {
    const { tenantId, userId } = await requireIso();
    await deleteIsoInterestedParty(tenantId, id);
    await AuditLog.log(tenantId, userId, "ISO_PARTY_DELETED", "IsoInterestedParty", id, {});
    revalidatePath("/dashboard/iso");
    return { success: true as const };
  } catch (error) {
    return { success: false as const, error: errorMessage(error, "Could not delete the interested party") };
  }
}

const scopeSchema = z.object({
  ohAndSScope: z.string().min(20),
  qualityScope: z.string().optional(),
  inclusions: z.string().optional(),
  exclusions: z.string().optional(),
  sites: z.string().optional(),
  excludeDesign: z.boolean().optional(),
  excludeDesignJustification: z.string().optional(),
  approve: z.boolean().optional(),
});

export async function saveIsoScope(input: Record<string, unknown>) {
  try {
    const { tenantId, userId } = await requireIso();
    const validated = scopeSchema.parse(input);
    if (
      validated.excludeDesign &&
      (!validated.excludeDesignJustification || validated.excludeDesignJustification.trim().length < 20)
    ) {
      return {
        success: false as const,
        error: "Write why ISO 9001 clause 8.3 does not apply (at least 20 characters). ISO 9001:2015 4.3.",
      };
    }
    const row = await upsertIsoScope({
      tenantId,
      ...validated,
      approvedById: userId,
    });
    await AuditLog.log(tenantId, userId, "ISO_SCOPE_SAVED", "IsoScope", row.id, {});
    revalidatePath("/dashboard/iso");
    return { success: true as const, data: row };
  } catch (error) {
    return { success: false as const, error: errorMessage(error, "Could not save the scope") };
  }
}

const legalSchema = z.object({
  title: z.string().min(3),
  source: z.string().min(2),
  reference: z.string().optional(),
  appliesBecause: z.string().optional(),
});

export async function createIsoLegalRequirement(input: Record<string, unknown>) {
  try {
    const { tenantId, userId } = await requireIso();
    const validated = legalSchema.parse(input);
    const row = await insertIsoLegalRequirement({ tenantId, ...validated });
    await AuditLog.log(tenantId, userId, "ISO_LEGAL_CREATED", "IsoLegalRequirement", row.id, {
      title: row.title,
    });
    revalidatePath("/dashboard/legal-register");
    revalidatePath("/dashboard/iso");
    return { success: true as const, data: row };
  } catch (error) {
    return { success: false as const, error: errorMessage(error, "Could not save the legal requirement") };
  }
}

export async function seedIsoLegalRegister() {
  try {
    const { tenantId } = await requireIso();
    const count = await seedDefaultLegalRequirements(tenantId);
    revalidatePath("/dashboard/legal-register");
    revalidatePath("/dashboard/iso");
    return { success: true as const, count };
  } catch (error) {
    return { success: false as const, error: errorMessage(error, "Could not seed the legal register") };
  }
}

const evalSchema = z.object({
  id: z.string().min(1),
  result: z.enum(["COMPLIANT", "PARTIAL", "NON_COMPLIANT"]),
  notes: z.string().optional(),
  nextEvaluationDate: z.string().optional(),
});

export async function evaluateLegalRequirement(input: Record<string, unknown>) {
  try {
    const { tenantId, userId } = await requireIso();
    const validated = evalSchema.parse(input);
    await evaluateIsoLegalRequirement({
      tenantId,
      id: validated.id,
      result: validated.result,
      notes: validated.notes,
      nextEvaluationDate: validated.nextEvaluationDate ? new Date(validated.nextEvaluationDate) : null,
    });
    await AuditLog.log(tenantId, userId, "ISO_LEGAL_EVALUATED", "IsoLegalRequirement", validated.id, {
      result: validated.result,
    });
    revalidatePath("/dashboard/legal-register");
    revalidatePath("/dashboard/iso");
    return { success: true as const };
  } catch (error) {
    return { success: false as const, error: errorMessage(error, "Could not record the evaluation") };
  }
}

export async function removeIsoLegalRequirement(id: string) {
  try {
    const { tenantId, userId } = await requireIso();
    await deleteIsoLegalRequirement(tenantId, id);
    await AuditLog.log(tenantId, userId, "ISO_LEGAL_DELETED", "IsoLegalRequirement", id, {});
    revalidatePath("/dashboard/legal-register");
    return { success: true as const };
  } catch (error) {
    return { success: false as const, error: errorMessage(error, "Could not delete the requirement") };
  }
}

const changeSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  changeType: z.enum(["PROCESS", "PLANT", "ORGANISATION", "LEGAL", "OTHER"]),
  riskImpact: z.string().optional(),
  trainingImpact: z.string().optional(),
  documentImpact: z.string().optional(),
});

export async function createIsoChange(input: Record<string, unknown>) {
  try {
    const { tenantId, userId } = await requireIso();
    const validated = changeSchema.parse(input);
    const row = await insertIsoChange({ tenantId, createdById: userId, ...validated });
    await AuditLog.log(tenantId, userId, "ISO_CHANGE_CREATED", "IsoChange", row.id, { title: row.title });
    revalidatePath("/dashboard/changes");
    revalidatePath("/dashboard/iso");
    return { success: true as const, data: row };
  } catch (error) {
    return { success: false as const, error: errorMessage(error, "Could not save the change") };
  }
}

export async function setIsoChangeStatus(id: string, status: string) {
  try {
    const { tenantId, userId } = await requireIso();
    await updateIsoChangeStatus({ tenantId, id, status, approvedById: userId });
    await AuditLog.log(tenantId, userId, "ISO_CHANGE_STATUS", "IsoChange", id, { status });
    revalidatePath("/dashboard/changes");
    revalidatePath("/dashboard/iso");
    return { success: true as const };
  } catch (error) {
    return { success: false as const, error: errorMessage(error, "Could not update the change") };
  }
}

const meetingSchema = z.object({
  title: z.string().min(3),
  scheduledDate: z.string().min(1),
  location: z.string().optional(),
  notes: z.string().optional(),
});

export async function createConsultationMeeting(input: Record<string, unknown>) {
  try {
    const { tenantId, userId } = await requireIso();
    const validated = meetingSchema.parse(input);
    const row = await insertIsoConsultationMeeting({
      tenantId,
      organizer: userId,
      title: validated.title,
      scheduledDate: new Date(validated.scheduledDate),
      location: validated.location,
      notes: validated.notes,
    });
    await AuditLog.log(tenantId, userId, "ISO_MEETING_CREATED", "Meeting", row.id, { title: row.title });
    revalidatePath("/dashboard/meetings");
    revalidatePath("/dashboard/iso");
    revalidatePath("/dashboard/iso/consultation");
    return { success: true as const, data: row };
  } catch (error) {
    return { success: false as const, error: errorMessage(error, "Could not save the meeting") };
  }
}

export async function completeConsultationMeeting(id: string, summary: string) {
  try {
    const { tenantId, userId } = await requireIso();
    await completeIsoConsultationMeeting(tenantId, id, summary);
    await AuditLog.log(tenantId, userId, "ISO_MEETING_COMPLETED", "Meeting", id, {});
    revalidatePath("/dashboard/meetings");
    revalidatePath("/dashboard/iso/consultation");
    return { success: true as const };
  } catch (error) {
    return { success: false as const, error: errorMessage(error, "Could not complete the meeting") };
  }
}

const assessmentSchema = z.object({
  requirementId: z.string().min(1),
  assessedLevel: z.enum(["COMPLIANT", "PARTIAL", "GAP", "MAJOR_GAP"]).nullable().optional(),
  responsibleUserId: z.string().nullable().optional(),
  notes: z.string().optional(),
  nextReviewAt: z.string().optional(),
});

export async function saveIsoClauseAssessment(input: Record<string, unknown>) {
  try {
    const { tenantId, userId } = await requireIso();
    const validated = assessmentSchema.parse(input);
    if (validated.responsibleUserId) {
      const member = await assertUserIsTenantMember(tenantId, validated.responsibleUserId);
      if (!member) {
        return { success: false as const, error: "Responsible person must be a member of this company" };
      }
    }
    const row = await upsertIsoClauseAssessment({
      tenantId,
      requirementId: validated.requirementId,
      assessedLevel: validated.assessedLevel ?? null,
      responsibleUserId: validated.responsibleUserId ?? null,
      lastReviewedAt: new Date(),
      nextReviewAt: validated.nextReviewAt ? new Date(validated.nextReviewAt) : null,
      notes: validated.notes,
    });
    await AuditLog.log(tenantId, userId, "ISO_ASSESSMENT_SAVED", "IsoClauseAssessment", row.id, {
      requirementId: validated.requirementId,
      assessedLevel: validated.assessedLevel,
    });
    revalidatePath("/dashboard/iso");
    revalidatePath("/dashboard/iso/clauses");
    return { success: true as const, data: row };
  } catch (error) {
    return { success: false as const, error: errorMessage(error, "Could not save the assessment") };
  }
}

export async function generateIsoGapTasks() {
  try {
    const { tenantId, userId } = await requireIso();
    const modules = await getEnabledModuleKeys(tenantId);
    const { matrix } = await loadIsoReadiness(tenantId, modules);
    const count = await generateIsoImplementationTasks({
      tenantId,
      responsibleFallbackId: userId,
      matrix,
    });
    await AuditLog.log(tenantId, userId, "ISO_GAP_TASKS_GENERATED", "Measure", tenantId, { count });
    revalidatePath("/dashboard/iso");
    revalidatePath("/dashboard/iso/clauses");
    revalidatePath("/dashboard/actions");
    return { success: true as const, count };
  } catch (error) {
    return { success: false as const, error: errorMessage(error, "Could not generate implementation tasks") };
  }
}

const linkDocumentSchema = z.object({
  documentId: z.string().min(8),
  requirementId: z.string().min(3),
  clauseKey: z.string().min(3),
  role: z.enum(["PROCEDURE", "POLICY", "RECORD", "EXTERNAL", "FORM"]).optional(),
});

export async function linkIsoDocument(input: Record<string, unknown>) {
  try {
    const { tenantId, userId } = await requireIso();
    const validated = linkDocumentSchema.parse(input);
    await linkIsoClauseDocument({ tenantId, ...validated });
    await AuditLog.log(tenantId, userId, "ISO_DOCUMENT_LINKED", "IsoClauseDocument", validated.documentId, {
      clauseKey: validated.clauseKey,
    });
    revalidatePath("/dashboard/iso");
    revalidatePath("/dashboard/iso/clauses");
    revalidatePath(`/dashboard/iso/clauses/${validated.clauseKey}`);
    return { success: true as const };
  } catch (error) {
    return { success: false as const, error: errorMessage(error, "Could not link the document") };
  }
}

export async function unlinkIsoDocument(linkId: string, clauseKey: string) {
  try {
    const { tenantId, userId } = await requireIso();
    await unlinkIsoClauseDocument(tenantId, linkId);
    await AuditLog.log(tenantId, userId, "ISO_DOCUMENT_UNLINKED", "IsoClauseDocument", linkId, { clauseKey });
    revalidatePath("/dashboard/iso/clauses");
    revalidatePath(`/dashboard/iso/clauses/${clauseKey}`);
    return { success: true as const };
  } catch (error) {
    return { success: false as const, error: errorMessage(error, "Could not remove the document link") };
  }
}

const processSchema = z.object({
  name: z.string().min(3),
  purpose: z.string().min(8),
  ownerId: z.string().optional(),
  inputs: z.string().optional(),
  outputs: z.string().optional(),
});

export async function createIsoProcess(input: Record<string, unknown>) {
  try {
    const { tenantId, userId } = await requireIso();
    const validated = processSchema.parse(input);
    if (validated.ownerId) {
      const member = await assertUserIsTenantMember(tenantId, validated.ownerId);
      if (!member) {
        return { success: false as const, error: "Process owner must be a member of this company" };
      }
    }
    const row = await insertIsoProcess({
      tenantId,
      name: validated.name,
      purpose: validated.purpose,
      ownerId: validated.ownerId || null,
      inputs: validated.inputs,
      outputs: validated.outputs,
    });
    await AuditLog.log(tenantId, userId, "ISO_PROCESS_CREATED", "IsoProcess", row.id, { name: row.name });
    revalidatePath("/dashboard/iso/processes");
    revalidatePath("/dashboard/iso");
    return { success: true as const };
  } catch (error) {
    return { success: false as const, error: errorMessage(error, "Could not save the process") };
  }
}

export async function removeIsoProcess(id: string) {
  try {
    const { tenantId, userId } = await requireIso();
    await deleteIsoProcess(tenantId, id);
    await AuditLog.log(tenantId, userId, "ISO_PROCESS_DELETED", "IsoProcess", id, {});
    revalidatePath("/dashboard/iso/processes");
    return { success: true as const };
  } catch (error) {
    return { success: false as const, error: errorMessage(error, "Could not delete the process") };
  }
}

const feedbackSchema = z.object({
  summary: z.string().min(5),
  customerCompany: z.string().optional(),
  sentiment: z.enum(["POSITIVE", "NEUTRAL", "NEGATIVE"]).optional(),
  source: z.enum(["EMAIL", "PHONE", "MEETING", "SURVEY", "SOCIAL", "OTHER"]).optional(),
});

export async function recordIsoCustomerFeedback(input: Record<string, unknown>) {
  try {
    const { tenantId, userId } = await requireIso();
    const validated = feedbackSchema.parse(input);
    await insertIsoCustomerFeedback({
      tenantId,
      recordedById: userId,
      summary: validated.summary,
      customerCompany: validated.customerCompany,
      sentiment: validated.sentiment,
      source: validated.source,
    });
    await AuditLog.log(tenantId, userId, "ISO_CUSTOMER_FEEDBACK", "CustomerFeedback", tenantId, {});
    revalidatePath("/dashboard/iso/processes");
    revalidatePath("/dashboard/iso");
    return { success: true as const };
  } catch (error) {
    return { success: false as const, error: errorMessage(error, "Could not save customer feedback") };
  }
}
