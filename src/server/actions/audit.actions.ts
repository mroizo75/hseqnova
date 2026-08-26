"use server";

import { revalidatePath } from "next/cache";
import { getRequiredTenantContext } from "@/lib/tenant-context";
import {
  createAuditSchema,
  updateAuditSchema,
  createFindingSchema,
  updateFindingSchema,
} from "@/features/audits/schemas/audit.schema";
import { AuditLog } from "@/lib/audit-log";
import {
  deleteAuditRecord,
  deleteFindingRecord,
  insertAudit,
  insertFinding,
  loadAudit,
  loadAudits,
  loadFindingWithAudit,
  updateAuditRecord,
  updateFindingRecord,
} from "@/server/queries/audits.queries";

function errorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

export async function getAudits(_tenantId: string) {
  try {
    const { tenantId } = await getRequiredTenantContext();
    const audits = await loadAudits(tenantId);
    return { success: true, data: audits };
  } catch (error: unknown) {
    return { success: false, error: errorMessage(error, "Could not load audits") };
  }
}

export async function getAudit(auditId: string) {
  try {
    const { tenantId } = await getRequiredTenantContext();
    const audit = await loadAudit(auditId, tenantId);
    if (!audit) {
      return { success: false, error: "Audit not found" };
    }
    return { success: true, data: audit };
  } catch (error: unknown) {
    return { success: false, error: errorMessage(error, "Could not load the audit") };
  }
}

export async function createAudit(input: Record<string, unknown>) {
  try {
    const { userId, tenantId } = await getRequiredTenantContext();
    const validated = createAuditSchema.parse({
      ...input,
      tenantId,
      scheduledDate: new Date(input.scheduledDate as string),
    });

    const audit = await insertAudit({
      tenantId: validated.tenantId,
      title: validated.title,
      auditType: validated.auditType,
      scope: validated.scope,
      criteria: validated.criteria,
      leadAuditorId: validated.leadAuditorId,
      teamMemberIds: validated.teamMemberIds,
      scheduledDate: validated.scheduledDate,
      area: validated.area,
      department: validated.department,
      status: validated.status,
    });

    await AuditLog.log(tenantId, userId, "AUDIT_CREATED", "Audit", audit.id, {
      title: audit.title,
      scheduledDate: audit.scheduledDate,
    });

    revalidatePath("/dashboard/audits");
    return { success: true, data: audit };
  } catch (error: unknown) {
    return { success: false, error: errorMessage(error, "Could not create the audit") };
  }
}

export async function updateAudit(input: Record<string, unknown>) {
  try {
    const { userId, tenantId } = await getRequiredTenantContext();
    const validated = updateAuditSchema.parse({
      ...input,
      scheduledDate: input.scheduledDate ? new Date(input.scheduledDate as string) : undefined,
      completedAt: input.completedAt ? new Date(input.completedAt as string) : undefined,
    });

    const existingAudit = await loadAudit(validated.id, tenantId);
    if (!existingAudit) {
      return { success: false, error: "Audit not found" };
    }

    const audit = await updateAuditRecord({
      id: validated.id,
      tenantId,
      title: validated.title,
      auditType: validated.auditType,
      scope: validated.scope,
      criteria: validated.criteria,
      leadAuditorId: validated.leadAuditorId,
      teamMemberIds: validated.teamMemberIds,
      scheduledDate: validated.scheduledDate,
      completedAt: validated.completedAt,
      area: validated.area,
      department: validated.department,
      status: validated.status,
      summary: validated.summary,
      conclusion: validated.conclusion,
    });

    await AuditLog.log(tenantId, userId, "AUDIT_UPDATED", "Audit", audit.id, {
      title: audit.title,
    });

    revalidatePath("/dashboard/audits");
    revalidatePath(`/dashboard/audits/${audit.id}`);
    return { success: true, data: audit };
  } catch (error: unknown) {
    return { success: false, error: errorMessage(error, "Could not update the audit") };
  }
}

export async function deleteAudit(auditId: string) {
  try {
    const { userId, tenantId } = await getRequiredTenantContext();
    const audit = await loadAudit(auditId, tenantId);
    if (!audit) {
      return { success: false, error: "Audit not found" };
    }

    if (audit.reportKey) {
      const storage = await import("@/lib/storage").then((module) => module.getStorage());
      await storage.delete(audit.reportKey);
    }

    await deleteAuditRecord(auditId, tenantId);

    await AuditLog.log(tenantId, userId, "AUDIT_DELETED", "Audit", auditId, {
      title: audit.title,
    });

    revalidatePath("/dashboard/audits");
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: errorMessage(error, "Could not delete the audit") };
  }
}

export async function getAuditStats(_tenantId: string) {
  try {
    const { tenantId } = await getRequiredTenantContext();
    const audits = await loadAudits(tenantId);
    const findings = audits.flatMap((audit) => audit.findings);

    return {
      success: true,
      data: {
        total: audits.length,
        planned: audits.filter((audit) => audit.status === "PLANNED").length,
        inProgress: audits.filter((audit) => audit.status === "IN_PROGRESS").length,
        completed: audits.filter((audit) => audit.status === "COMPLETED").length,
        totalFindings: findings.length,
        majorNCs: findings.filter((finding) => finding.findingType === "MAJOR_NC").length,
        minorNCs: findings.filter((finding) => finding.findingType === "MINOR_NC").length,
        observations: findings.filter((finding) => finding.findingType === "OBSERVATION").length,
        strengths: findings.filter((finding) => finding.findingType === "STRENGTH").length,
      },
    };
  } catch (error: unknown) {
    return { success: false, error: errorMessage(error, "Could not load audit statistics") };
  }
}

export async function createFinding(input: Record<string, unknown>) {
  try {
    const { userId, tenantId } = await getRequiredTenantContext();
    const validated = createFindingSchema.parse({
      ...input,
      dueDate: input.dueDate ? new Date(input.dueDate as string) : undefined,
    });

    const audit = await loadAudit(validated.auditId, tenantId);
    if (!audit) {
      return { success: false, error: "Audit not found" };
    }

    const finding = await insertFinding({
      auditId: validated.auditId,
      findingType: validated.findingType,
      clause: validated.clause,
      description: validated.description,
      evidence: validated.evidence,
      requirement: validated.requirement,
      responsibleId: validated.responsibleId,
      dueDate: validated.dueDate,
    });

    await AuditLog.log(tenantId, userId, "AUDIT_FINDING_CREATED", "AuditFinding", finding.id, {
      auditId: audit.id,
      findingType: finding.findingType,
    });

    revalidatePath("/dashboard/audits");
    revalidatePath(`/dashboard/audits/${audit.id}`);
    return { success: true, data: finding };
  } catch (error: unknown) {
    return { success: false, error: errorMessage(error, "Could not record the finding") };
  }
}

export async function updateFinding(input: Record<string, unknown>) {
  try {
    const { userId, tenantId } = await getRequiredTenantContext();
    const validated = updateFindingSchema.parse({
      ...input,
      dueDate: input.dueDate ? new Date(input.dueDate as string) : undefined,
    });

    const existing = await loadFindingWithAudit(validated.id);
    if (!existing || existing.tenantId !== tenantId) {
      return { success: false, error: "Finding not found" };
    }

    const finding = await updateFindingRecord({
      id: validated.id,
      findingType: validated.findingType,
      clause: validated.clause,
      description: validated.description,
      evidence: validated.evidence,
      requirement: validated.requirement,
      responsibleId: validated.responsibleId,
      dueDate: validated.dueDate,
      correctiveAction: validated.correctiveAction,
      rootCause: validated.rootCause,
      status: validated.status,
    });

    await AuditLog.log(tenantId, userId, "AUDIT_FINDING_UPDATED", "AuditFinding", finding.id, {
      status: finding.status,
    });

    revalidatePath("/dashboard/audits");
    revalidatePath(`/dashboard/audits/${existing.finding.auditId}`);
    return { success: true, data: finding };
  } catch (error: unknown) {
    return { success: false, error: errorMessage(error, "Could not update the finding") };
  }
}

export async function verifyFinding(findingId: string) {
  try {
    const { userId, tenantId } = await getRequiredTenantContext();
    const existing = await loadFindingWithAudit(findingId);
    if (!existing || existing.tenantId !== tenantId) {
      return { success: false, error: "Finding not found" };
    }
    if (existing.finding.status !== "RESOLVED") {
      return { success: false, error: "The finding must be resolved before it can be verified" };
    }

    const updatedFinding = await updateFindingRecord({
      id: findingId,
      status: "VERIFIED",
      verifiedById: userId,
      verifiedAt: new Date(),
      closedAt: new Date(),
    });

    await AuditLog.log(tenantId, userId, "AUDIT_FINDING_VERIFIED", "AuditFinding", updatedFinding.id, {
      verifiedBy: userId,
    });

    revalidatePath("/dashboard/audits");
    revalidatePath(`/dashboard/audits/${existing.finding.auditId}`);
    return { success: true, data: updatedFinding };
  } catch (error: unknown) {
    return { success: false, error: errorMessage(error, "Could not verify the finding") };
  }
}

export async function deleteFinding(findingId: string) {
  try {
    const { userId, tenantId } = await getRequiredTenantContext();
    const existing = await loadFindingWithAudit(findingId);
    if (!existing || existing.tenantId !== tenantId) {
      return { success: false, error: "Finding not found" };
    }

    await deleteFindingRecord(findingId);

    await AuditLog.log(tenantId, userId, "AUDIT_FINDING_DELETED", "AuditFinding", findingId, {
      auditId: existing.finding.auditId,
    });

    revalidatePath("/dashboard/audits");
    revalidatePath(`/dashboard/audits/${existing.finding.auditId}`);
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: errorMessage(error, "Could not delete the finding") };
  }
}
