"use server";

import { revalidatePath } from "next/cache";
import { getRequiredTenantContext } from "@/lib/tenant-context";
import { getAuthContext } from "@/lib/server-authorization";
import { getAuthUserById } from "@/lib/auth-db";
import { generateSequenceNumber } from "@/lib/sequence";
import { requireTenantModule } from "@/lib/require-tenant-module";
import {
  createSjaSchema,
  updateSjaSchema,
  createSjaTemplateSchema,
} from "@/features/sja/schemas/sja.schema";
import { withAuditLog } from "@/lib/audit-log";
import {
  deactivateSjaTemplate,
  deleteSjaAnalysisRecord,
  insertSjaAnalysis,
  insertSjaTemplate,
  loadSjaAnalysesForTenant,
  loadSjaById,
  loadSjaProject,
  loadSjaTemplateById,
  loadSjaTemplates,
  logSjaAction,
  updateSjaAnalysisRecord,
} from "@/server/queries/sja.queries";

function errorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

async function actorName(userId: string, fallbackEmail: string): Promise<string> {
  const user = await getAuthUserById(userId);
  return user?.name || user?.email || fallbackEmail;
}

function revalidateSjaPaths(projectId?: string | null, analysisId?: string | null) {
  revalidatePath("/dashboard/sja");
  revalidatePath("/ansatt/sja");
  if (analysisId) {
    revalidatePath(`/dashboard/sja/${analysisId}`);
    revalidatePath(`/ansatt/sja/${analysisId}`);
  }
  if (projectId) {
    revalidatePath(`/dashboard/projects/${projectId}`);
  }
}

export async function getSjaAnalyses(_tenantId: string) {
  try {
    await requireTenantModule("sja");
    const auth = await getAuthContext();
    if (!auth) {
      return { success: false, error: "Unauthorised" };
    }

    const canReadAll = auth.permissions.canReadSja;
    const canReadOwn = auth.permissions.canReadOwnSja;
    if (!canReadAll && !canReadOwn) {
      return { success: false, error: "Not authorised to view RAMS" };
    }

    const analyses = await loadSjaAnalysesForTenant(auth.tenantId, {
      createdById: canReadAll ? undefined : auth.userId,
    });
    return { success: true, data: analyses, ownOnly: !canReadAll };
  } catch (error: unknown) {
    return { success: false, error: errorMessage(error, "Could not load RAMS") };
  }
}

export async function getSjaAnalysis(id: string) {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return { success: false, error: "Unauthorised" };
    }

    const canReadAll = auth.permissions.canReadSja;
    const canReadOwn = auth.permissions.canReadOwnSja;
    if (!canReadAll && !canReadOwn) {
      return { success: false, error: "Not authorised to view RAMS" };
    }

    const analysis = await loadSjaById(id, auth.tenantId, {
      createdById: canReadAll ? undefined : auth.userId,
    });
    if (!analysis) {
      return { success: false, error: "RAMS not found" };
    }
    return { success: true, data: analysis };
  } catch (error: unknown) {
    return { success: false, error: errorMessage(error, "Could not load RAMS") };
  }
}

export async function createSjaAnalysis(input: unknown) {
  try {
    await requireTenantModule("sja");
    const auth = await getAuthContext();
    if (!auth) {
      return { success: false, error: "Unauthorised" };
    }
    if (!auth.permissions.canCreateSja) {
      return { success: false, error: "Not authorised to create RAMS" };
    }
    const { userId, tenantId, userEmail: email } = auth;
    const raw = (input ?? {}) as Record<string, unknown>;
    const validated = createSjaSchema.parse({
      ...raw,
      tenantId,
      plannedDate: new Date(String(raw.plannedDate)),
    });

    if (validated.projectId) {
      const project = await loadSjaProject(validated.projectId, tenantId);
      if (!project) {
        return { success: false, error: "Project not found" };
      }
    }

    const sjaNummer = await generateSequenceNumber(
      tenantId,
      "SJA",
      new Date(validated.plannedDate).getFullYear(),
    );

    const analysis = await insertSjaAnalysis({
      tenantId,
      sjaNummer,
      title: validated.title,
      description: validated.description,
      workLocation: validated.workLocation,
      plannedDate: validated.plannedDate,
      responsibleName: validated.responsibleName,
      participants: validated.participants,
      additionalConditions: validated.additionalConditions ?? null,
      weatherConditions: validated.weatherConditions ?? null,
      createdById: userId,
      createdByName: await actorName(userId, email),
      templateId: validated.templateId ?? null,
      templateName: validated.templateName ?? null,
      projectId: validated.projectId ?? null,
      hazards: validated.hazards,
    });

    await logSjaAction({
      tenantId,
      userId,
      action: "SJA_CREATED",
      resource: `SjaAnalysis:${analysis.id}`,
      metadata: { title: analysis.title },
    });

    await withAuditLog(tenantId, userId, "SjaAnalysis", analysis.id, "CREATED", { title: analysis.title });

    revalidateSjaPaths(validated.projectId, analysis.id);
    return { success: true, data: analysis };
  } catch (error: unknown) {
    return { success: false, error: errorMessage(error, "Could not create the RAMS") };
  }
}

export async function updateSjaAnalysis(input: unknown) {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return { success: false, error: "Unauthorised" };
    }
    const { userId, tenantId, userEmail: email } = auth;
    const raw = (input ?? {}) as Record<string, unknown>;
    const validated = updateSjaSchema.parse({
      ...raw,
      plannedDate: raw.plannedDate ? new Date(String(raw.plannedDate)) : undefined,
    });

    const existing = await loadSjaById(validated.id, tenantId);
    if (!existing) {
      return { success: false, error: "RAMS not found" };
    }

    const isOwner = existing.createdById === userId;
    if (!isOwner && !auth.permissions.canReadSja) {
      return { success: false, error: "RAMS not found" };
    }

    const concluding =
      Boolean(validated.conclusion) && validated.conclusion !== "NOT_DECIDED";
    if (concluding && !auth.permissions.canApproveSja) {
      return { success: false, error: "Not authorised to approve RAMS" };
    }

    const patch: Record<string, unknown> = {};
    if (validated.title) patch.title = validated.title;
    if (validated.description !== undefined) patch.description = validated.description || null;
    if (validated.workLocation) patch.workLocation = validated.workLocation;
    if (validated.plannedDate) patch.plannedDate = validated.plannedDate;
    if (validated.responsibleName) patch.responsibleName = validated.responsibleName;
    if (validated.participants !== undefined) patch.participants = validated.participants || null;
    if (validated.status) patch.status = validated.status;

    if (validated.conclusion) {
      patch.conclusion = validated.conclusion;
      patch.conclusionComment = validated.conclusionComment || null;
      if (validated.conclusion === "APPROVED" || validated.conclusion === "CONDITIONAL") {
        patch.approvedById = userId;
        patch.approvedByName = await actorName(userId, email);
        patch.approvedAt = new Date();
        if (existing.status === "DRAFT") {
          patch.status = "ACTIVE";
        }
      }
    }

    const analysis = await updateSjaAnalysisRecord(validated.id, tenantId, patch, validated.hazards);

    await logSjaAction({
      tenantId,
      userId,
      action: "SJA_UPDATED",
      resource: `SjaAnalysis:${analysis.id}`,
      metadata: { title: analysis.title, status: analysis.status },
    });

    await withAuditLog(tenantId, userId, "SjaAnalysis", analysis.id, "UPDATED", { title: analysis.title, status: analysis.status });

    revalidateSjaPaths(analysis.projectId, analysis.id);
    return { success: true, data: analysis };
  } catch (error: unknown) {
    return { success: false, error: errorMessage(error, "Could not update the RAMS") };
  }
}

export async function deleteSjaAnalysis(id: string) {
  try {
    const { userId, tenantId } = await getRequiredTenantContext();
    const analysis = await loadSjaById(id, tenantId);
    if (!analysis) {
      return { success: false, error: "RAMS not found" };
    }

    await deleteSjaAnalysisRecord(id, tenantId);
    await logSjaAction({
      tenantId,
      userId,
      action: "SJA_DELETED",
      resource: `SjaAnalysis:${id}`,
      metadata: { title: analysis.title },
    });

    await withAuditLog(tenantId, userId, "SjaAnalysis", id, "DELETED", { title: analysis.title });

    revalidateSjaPaths(analysis.projectId);
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: errorMessage(error, "Could not delete the RAMS") };
  }
}

export async function getSjaTemplates(_tenantId: string) {
  try {
    const { tenantId } = await getRequiredTenantContext();
    const templates = await loadSjaTemplates(tenantId);
    return { success: true, data: templates };
  } catch (error: unknown) {
    return { success: false, error: errorMessage(error, "Could not load RAMS templates") };
  }
}

export async function createSjaTemplate(input: unknown) {
  try {
    const { userId, tenantId, email } = await getRequiredTenantContext();
    const raw = (input ?? {}) as Record<string, unknown>;
    const validated = createSjaTemplateSchema.parse({ ...raw, tenantId });

    const template = await insertSjaTemplate({
      tenantId,
      name: validated.name,
      description: validated.description ?? null,
      workLocation: validated.workLocation ?? null,
      createdById: userId,
      createdByName: await actorName(userId, email),
      hazards: validated.hazards,
    });

    await logSjaAction({
      tenantId,
      userId,
      action: "SJA_TEMPLATE_CREATED",
      resource: `SjaTemplate:${template.id}`,
      metadata: { name: template.name },
    });

    await withAuditLog(tenantId, userId, "SjaTemplate", template.id, "CREATED", { name: template.name });

    revalidateSjaPaths();
    return { success: true, data: template };
  } catch (error: unknown) {
    return { success: false, error: errorMessage(error, "Could not create the RAMS template") };
  }
}

export async function deleteSjaTemplate(id: string) {
  try {
    const { userId, tenantId } = await getRequiredTenantContext();
    const template = await loadSjaTemplateById(id, tenantId);
    if (!template) {
      return { success: false, error: "RAMS template not found" };
    }

    await deactivateSjaTemplate(id, tenantId);
    await logSjaAction({
      tenantId,
      userId,
      action: "SJA_TEMPLATE_DELETED",
      resource: `SjaTemplate:${id}`,
      metadata: { name: template.name },
    });

    await withAuditLog(tenantId, userId, "SjaTemplate", id, "DELETED", { name: template.name });

    revalidateSjaPaths();
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: errorMessage(error, "Could not delete the RAMS template") };
  }
}

export async function getSjaStats(_tenantId: string) {
  try {
    const { tenantId } = await getRequiredTenantContext();
    const analyses = await loadSjaAnalysesForTenant(tenantId);
    return {
      success: true,
      data: {
        total: analyses.length,
        draft: analyses.filter((row) => row.status === "DRAFT").length,
        active: analyses.filter((row) => row.status === "ACTIVE").length,
        completed: analyses.filter((row) => row.status === "COMPLETED").length,
        cancelled: analyses.filter((row) => row.status === "CANCELLED").length,
        approved: analyses.filter((row) => row.conclusion === "APPROVED").length,
        rejected: analyses.filter((row) => row.conclusion === "REJECTED").length,
      },
    };
  } catch (error: unknown) {
    return { success: false, error: errorMessage(error, "Could not load RAMS statistics") };
  }
}
