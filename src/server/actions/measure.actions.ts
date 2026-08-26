"use server";

import { revalidatePath } from "next/cache";
import { getRequiredTenantContext } from "@/lib/tenant-context";
import {
  createMeasureSchema,
  updateMeasureSchema,
  completeMeasureSchema,
  isMeasureOverdue,
} from "@/features/measures/schemas/measure.schema";
import {
  closeRiskIfAllMeasuresDone,
  deleteMeasureRecord,
  incidentMeasuresAllDone,
  insertMeasure,
  loadFireDrillForTenant,
  loadMeasureById,
  loadMeasuresForTenant,
  loadProjectForTenant,
  logMeasureAction,
  markRiskMitigating,
  updateIncidentActionStage,
  updateMeasureRecord,
} from "@/server/queries/measures.queries";

function errorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

const parseOptionalNumber = (value: unknown) => {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

function revalidateMeasurePaths(input: {
  projectId?: string | null;
  riskId?: string | null;
  incidentId?: string | null;
  fireDrillId?: string | null;
  measureId?: string | null;
}) {
  revalidatePath("/dashboard/risks");
  revalidatePath("/dashboard/actions");
  if (input.measureId) {
    revalidatePath(`/dashboard/measures/${input.measureId}`);
  }
  if (input.projectId) {
    revalidatePath(`/dashboard/projects/${input.projectId}`);
  }
  if (input.riskId) {
    revalidatePath(`/dashboard/risks/${input.riskId}`);
  }
  if (input.incidentId) {
    revalidatePath(`/dashboard/incidents/${input.incidentId}`);
  }
  if (input.fireDrillId) {
    revalidatePath(`/dashboard/fire-drills/${input.fireDrillId}`);
  }
}

export async function getMeasures(_tenantId: string) {
  try {
    const { tenantId } = await getRequiredTenantContext();
    const measures = await loadMeasuresForTenant(tenantId);
    const data = measures.map((measure) =>
      isMeasureOverdue(measure.dueAt, measure.status) ? { ...measure, status: "OVERDUE" as const } : measure,
    );
    return { success: true, data };
  } catch (error: unknown) {
    return { success: false, error: errorMessage(error, "Could not load actions") };
  }
}

export async function getMeasure(id: string) {
  try {
    const { tenantId } = await getRequiredTenantContext();
    const measure = await loadMeasureById(id, tenantId);
    if (!measure) {
      return { success: false, error: "Action not found", data: null };
    }
    return { success: true, data: measure };
  } catch (error: unknown) {
    return { success: false, error: errorMessage(error, "Could not load actions"), data: null };
  }
}

export async function getMeasuresByRisk(riskId: string) {
  try {
    const { tenantId } = await getRequiredTenantContext();
    const measures = await loadMeasuresForTenant(tenantId, { riskId });
    return { success: true, data: measures };
  } catch (error: unknown) {
    return { success: false, error: errorMessage(error, "Could not load actions") };
  }
}

export async function createMeasure(input: unknown) {
  try {
    const { userId, tenantId } = await getRequiredTenantContext();
    const raw = (input ?? {}) as Record<string, unknown>;
    const validated = createMeasureSchema.parse({
      ...raw,
      tenantId,
      dueAt: new Date(String(raw.dueAt)),
      costEstimate: parseOptionalNumber(raw.costEstimate),
      benefitEstimate: parseOptionalNumber(raw.benefitEstimate),
    });

    if (validated.projectId) {
      const project = await loadProjectForTenant(validated.projectId, tenantId);
      if (!project) {
        return { success: false, error: "Project not found" };
      }
    }

    if (validated.fireDrillId) {
      const fireDrill = await loadFireDrillForTenant(validated.fireDrillId, tenantId);
      if (!fireDrill) {
        return { success: false, error: "Fire drill not found" };
      }
    }

    const measure = await insertMeasure({
      tenantId,
      projectId: validated.projectId,
      riskId: validated.riskId,
      incidentId: validated.incidentId,
      auditId: validated.auditId,
      goalId: validated.goalId,
      fireDrillId: validated.fireDrillId,
      title: validated.title,
      description: validated.description,
      dueAt: validated.dueAt,
      responsibleId: validated.responsibleId,
      status: validated.status,
      category: validated.category,
      followUpFrequency: validated.followUpFrequency,
      costEstimate: validated.costEstimate,
      benefitEstimate: validated.benefitEstimate,
    });

    if (validated.riskId) {
      await markRiskMitigating(validated.riskId, tenantId);
    }

    if (validated.incidentId) {
      await updateIncidentActionStage(validated.incidentId, tenantId, "ACTIONS_DEFINED", "ACTION_TAKEN");
    }

    await logMeasureAction({
      tenantId,
      userId,
      action: "MEASURE_CREATED",
      resource: `Measure:${measure.id}`,
      metadata: {
        title: measure.title,
        riskId: validated.riskId,
        responsibleId: validated.responsibleId,
      },
    });

    revalidateMeasurePaths({
      projectId: validated.projectId,
      riskId: validated.riskId,
      incidentId: validated.incidentId,
      fireDrillId: validated.fireDrillId,
      measureId: measure.id,
    });

    return { success: true, data: measure };
  } catch (error: unknown) {
    return { success: false, error: errorMessage(error, "Could not create the action") };
  }
}

export async function updateMeasure(input: unknown) {
  try {
    const { userId, tenantId } = await getRequiredTenantContext();
    const raw = (input ?? {}) as Record<string, unknown>;
    const validated = updateMeasureSchema.parse({
      ...raw,
      dueAt: raw.dueAt ? new Date(String(raw.dueAt)) : undefined,
      costEstimate: parseOptionalNumber(raw.costEstimate),
      benefitEstimate: parseOptionalNumber(raw.benefitEstimate),
      completedAt: raw.completedAt ? new Date(String(raw.completedAt)) : undefined,
    });

    const existingMeasure = await loadMeasureById(validated.id, tenantId);
    if (!existingMeasure) {
      return { success: false, error: "Action not found" };
    }

    const { id, ...rest } = validated;
    const data: Record<string, unknown> = { ...rest };

    if (validated.status === "DONE") {
      data.completedAt = validated.completedAt ?? new Date();
    } else if (validated.status) {
      data.completedAt = null;
      data.effectiveness = "NOT_EVALUATED";
      data.effectivenessNote = null;
    }

    const measure = await updateMeasureRecord(
      id,
      tenantId,
      Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined)),
    );

    await logMeasureAction({
      tenantId,
      userId,
      action: "MEASURE_UPDATED",
      resource: `Measure:${measure.id}`,
      metadata: { title: measure.title },
    });

    revalidateMeasurePaths({
      riskId: measure.riskId,
      incidentId: measure.incidentId,
      fireDrillId: measure.fireDrillId,
      measureId: measure.id,
    });

    return { success: true, data: measure };
  } catch (error: unknown) {
    return { success: false, error: errorMessage(error, "Could not update the action") };
  }
}

export async function completeMeasure(input: unknown) {
  try {
    const { userId, tenantId } = await getRequiredTenantContext();
    const raw = (input ?? {}) as Record<string, unknown>;
    const validated = completeMeasureSchema.parse({
      ...raw,
      completedAt: new Date(String(raw.completedAt)),
    });

    const existing = await loadMeasureById(validated.id, tenantId);
    if (!existing) {
      return { success: false, error: "Action not found" };
    }

    const measure = await updateMeasureRecord(validated.id, tenantId, {
      status: "DONE",
      completedAt: validated.completedAt,
      effectiveness: validated.effectiveness,
      effectivenessNote: validated.completionNote,
    });

    if (measure.riskId) {
      await closeRiskIfAllMeasuresDone(measure.riskId, tenantId);
    }

    if (measure.incidentId) {
      const allDone = await incidentMeasuresAllDone(measure.incidentId, tenantId);
      await updateIncidentActionStage(
        measure.incidentId,
        tenantId,
        allDone ? "ACTIONS_COMPLETE" : "ACTIONS_DEFINED",
      );
    }

    await logMeasureAction({
      tenantId,
      userId,
      action: "MEASURE_COMPLETED",
      resource: `Measure:${measure.id}`,
      metadata: {
        title: measure.title,
        completionNote: validated.completionNote,
      },
    });

    revalidateMeasurePaths({
      riskId: measure.riskId,
      incidentId: measure.incidentId,
      fireDrillId: measure.fireDrillId,
      measureId: measure.id,
    });

    return { success: true, data: measure };
  } catch (error: unknown) {
    return { success: false, error: errorMessage(error, "Could not complete the action") };
  }
}

export async function deleteMeasure(id: string) {
  try {
    const { userId, tenantId } = await getRequiredTenantContext();
    const measure = await loadMeasureById(id, tenantId);
    if (!measure) {
      return { success: false, error: "Action not found" };
    }

    await deleteMeasureRecord(id, tenantId);

    await logMeasureAction({
      tenantId,
      userId,
      action: "MEASURE_DELETED",
      resource: `Measure:${id}`,
      metadata: { title: measure.title },
    });

    revalidateMeasurePaths({
      riskId: measure.riskId,
      incidentId: measure.incidentId,
      fireDrillId: measure.fireDrillId,
    });

    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: errorMessage(error, "Could not delete the action") };
  }
}

export async function getMeasureStats(_tenantId: string) {
  try {
    const { tenantId } = await getRequiredTenantContext();
    const measures = await loadMeasuresForTenant(tenantId);
    const now = new Date();
    const overdue = measures.filter((measure) => measure.status !== "DONE" && new Date(measure.dueAt) < now).length;

    return {
      success: true,
      data: {
        total: measures.length,
        pending: measures.filter((measure) => measure.status === "PENDING").length,
        inProgress: measures.filter((measure) => measure.status === "IN_PROGRESS").length,
        done: measures.filter((measure) => measure.status === "DONE").length,
        overdue,
      },
    };
  } catch (error: unknown) {
    return { success: false, error: errorMessage(error, "Could not load statistics") };
  }
}
