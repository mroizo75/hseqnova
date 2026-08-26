"use server";

import { revalidatePath } from "next/cache";
import { getRequiredTenantContext } from "@/lib/tenant-context";
import {
  createEnvironmentalAspectSchema,
  createEnvironmentalMeasurementSchema,
  updateEnvironmentalAspectSchema,
} from "@/features/environment/schemas/environment.schema";
import { AuditLog } from "@/lib/audit-log";
import {
  calculateSignificance,
  deleteEnvironmentalAspectRecord,
  getMeasurementStatus,
  insertEnvironmentalAspect,
  insertEnvironmentalMeasurement,
  loadEnvironmentalAspect,
  updateEnvironmentalAspectRecord,
} from "@/server/queries/environment.queries";

function errorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

const sanitizeString = (value?: string | null) => {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const parseOptionalDate = (value: unknown) => {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const parseOptionalNumber = (value: unknown) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

export async function createEnvironmentalAspect(input: Record<string, unknown>) {
  try {
    const { userId, tenantId } = await getRequiredTenantContext();
    const validated = createEnvironmentalAspectSchema.parse({
      ...input,
      tenantId,
      nextReviewDate: parseOptionalDate(input.nextReviewDate),
    });
    const significanceScore = calculateSignificance(validated.severity, validated.likelihood);

    const aspect = await insertEnvironmentalAspect({
      tenantId: validated.tenantId,
      title: validated.title,
      description: sanitizeString(validated.description),
      process: sanitizeString(validated.process),
      location: sanitizeString(validated.location),
      category: validated.category,
      impactType: validated.impactType,
      severity: validated.severity,
      likelihood: validated.likelihood,
      significanceScore,
      legalRequirement: sanitizeString(validated.legalRequirement),
      controlMeasures: sanitizeString(validated.controlMeasures),
      monitoringMethod: sanitizeString(validated.monitoringMethod),
      monitoringFrequency: validated.monitoringFrequency,
      ownerId: validated.ownerId || null,
      goalId: validated.goalId || null,
      status: validated.status,
      nextReviewDate: validated.nextReviewDate ?? null,
    });

    await AuditLog.log(tenantId, userId, "ENVIRONMENTAL_ASPECT_CREATED", "EnvironmentalAspect", aspect.id, {
      title: aspect.title,
      category: aspect.category,
      significanceScore: aspect.significanceScore,
    });

    revalidatePath("/dashboard/environment");
    return { success: true, data: aspect };
  } catch (error: unknown) {
    return { success: false, error: errorMessage(error, "Could not create the environmental aspect") };
  }
}

export async function updateEnvironmentalAspect(input: Record<string, unknown>) {
  try {
    const { userId, tenantId } = await getRequiredTenantContext();
    const validated = updateEnvironmentalAspectSchema.parse({
      ...input,
      nextReviewDate:
        input.nextReviewDate === null ? null : parseOptionalDate(input.nextReviewDate),
    });

    const existing = await loadEnvironmentalAspect(validated.id, tenantId);
    if (!existing) {
      return { success: false, error: "Environmental aspect not found" };
    }

    const severity = validated.severity ?? existing.severity;
    const likelihood = validated.likelihood ?? existing.likelihood;

    const aspect = await updateEnvironmentalAspectRecord(validated.id, tenantId, {
      title: validated.title ?? existing.title,
      description:
        validated.description !== undefined ? sanitizeString(validated.description) : existing.description,
      process: validated.process !== undefined ? sanitizeString(validated.process) : existing.process,
      location: validated.location !== undefined ? sanitizeString(validated.location) : existing.location,
      category: validated.category ?? existing.category,
      impactType: validated.impactType ?? existing.impactType,
      severity,
      likelihood,
      significanceScore: calculateSignificance(severity, likelihood),
      legalRequirement:
        validated.legalRequirement !== undefined
          ? sanitizeString(validated.legalRequirement)
          : existing.legalRequirement,
      controlMeasures:
        validated.controlMeasures !== undefined
          ? sanitizeString(validated.controlMeasures)
          : existing.controlMeasures,
      monitoringMethod:
        validated.monitoringMethod !== undefined
          ? sanitizeString(validated.monitoringMethod)
          : existing.monitoringMethod,
      monitoringFrequency: validated.monitoringFrequency ?? existing.monitoringFrequency,
      ownerId: validated.ownerId === undefined ? existing.ownerId : validated.ownerId,
      goalId: validated.goalId === undefined ? existing.goalId : validated.goalId,
      status: validated.status ?? existing.status,
      nextReviewDate:
        validated.nextReviewDate === undefined
          ? existing.nextReviewDate?.toISOString() ?? null
          : validated.nextReviewDate
            ? validated.nextReviewDate.toISOString()
            : null,
    });

    await AuditLog.log(tenantId, userId, "ENVIRONMENTAL_ASPECT_UPDATED", "EnvironmentalAspect", aspect.id, {
      title: aspect.title,
      status: aspect.status,
    });

    revalidatePath("/dashboard/environment");
    revalidatePath(`/dashboard/environment/${aspect.id}`);
    return { success: true, data: aspect };
  } catch (error: unknown) {
    return { success: false, error: errorMessage(error, "Could not update the environmental aspect") };
  }
}

export async function deleteEnvironmentalAspect(id: string) {
  try {
    const { userId, tenantId } = await getRequiredTenantContext();
    const aspect = await loadEnvironmentalAspect(id, tenantId);
    if (!aspect) {
      return { success: false, error: "Environmental aspect not found" };
    }

    await deleteEnvironmentalAspectRecord(id, tenantId);

    await AuditLog.log(tenantId, userId, "ENVIRONMENTAL_ASPECT_DELETED", "EnvironmentalAspect", id, {
      title: aspect.title,
    });

    revalidatePath("/dashboard/environment");
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: errorMessage(error, "Could not delete the environmental aspect") };
  }
}

export async function createEnvironmentalMeasurement(input: Record<string, unknown>) {
  try {
    const { userId, tenantId } = await getRequiredTenantContext();
    const validated = createEnvironmentalMeasurementSchema.parse({
      ...input,
      tenantId,
      measuredValue: Number(input.measuredValue),
      limitValue: parseOptionalNumber(input.limitValue),
      targetValue: parseOptionalNumber(input.targetValue),
      measurementDate: parseOptionalDate(input.measurementDate) ?? new Date(),
    });

    const aspect = await loadEnvironmentalAspect(validated.aspectId, tenantId);
    if (!aspect) {
      return { success: false, error: "Environmental aspect not found" };
    }

    const status = getMeasurementStatus(
      validated.measuredValue,
      validated.limitValue,
      validated.targetValue
    );

    const measurement = await insertEnvironmentalMeasurement({
      tenantId: validated.tenantId,
      aspectId: validated.aspectId,
      parameter: validated.parameter,
      unit: sanitizeString(validated.unit),
      method: sanitizeString(validated.method),
      limitValue: validated.limitValue ?? null,
      targetValue: validated.targetValue ?? null,
      measuredValue: validated.measuredValue,
      measurementDate: validated.measurementDate,
      status,
      notes: sanitizeString(validated.notes),
      responsibleId: validated.responsibleId || null,
    });

    await updateEnvironmentalAspectRecord(validated.aspectId, tenantId, {
      lastMeasurementDate: validated.measurementDate.toISOString(),
      ...(status === "NON_COMPLIANT" ? { status: "MONITORED" } : {}),
    });

    await AuditLog.log(
      tenantId,
      userId,
      "ENVIRONMENTAL_MEASUREMENT_RECORDED",
      "EnvironmentalMeasurement",
      measurement.id,
      {
        parameter: measurement.parameter,
        value: measurement.measuredValue,
        status: measurement.status,
      }
    );

    revalidatePath("/dashboard/environment");
    revalidatePath(`/dashboard/environment/${validated.aspectId}`);
    return { success: true, data: measurement };
  } catch (error: unknown) {
    return { success: false, error: errorMessage(error, "Could not record the measurement") };
  }
}
