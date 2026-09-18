"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getRequiredTenantContext } from "@/lib/tenant-context";
import { requireTenantModule } from "@/lib/require-tenant-module";
import { AuditLog } from "@/lib/audit-log";
import {
  completeIsoConsultationMeeting,
  deleteIsoContextIssue,
  deleteIsoInterestedParty,
  deleteIsoLegalRequirement,
  evaluateIsoLegalRequirement,
  insertIsoChange,
  insertIsoConsultationMeeting,
  insertIsoContextIssue,
  insertIsoInterestedParty,
  insertIsoLegalRequirement,
  seedDefaultLegalRequirements,
  updateIsoChangeStatus,
  upsertIsoScope,
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
  approve: z.boolean().optional(),
});

export async function saveIsoScope(input: Record<string, unknown>) {
  try {
    const { tenantId, userId } = await requireIso();
    const validated = scopeSchema.parse(input);
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
    return { success: true as const };
  } catch (error) {
    return { success: false as const, error: errorMessage(error, "Could not complete the meeting") };
  }
}
