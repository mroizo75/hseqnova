"use server";

import { revalidatePath } from "next/cache";
import { getRequiredTenantContext } from "@/lib/tenant-context";
import { requireTenantModule } from "@/lib/require-tenant-module";
import { validateCoshhAssessment } from "@/lib/coshh-uk";
import { loadChemicalById } from "@/server/queries/chemicals.queries";
import {
  insertCoshhAssessment,
  loadCoshhAssessmentById,
  loadCoshhAssessmentsForChemical,
  loadCoshhAssessmentsForTenant,
} from "@/server/queries/coshh.queries";

function errorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

function revalidateCoshhPaths(id?: string, chemicalId?: string | null) {
  revalidatePath("/dashboard/coshh-assessments");
  revalidatePath("/dashboard/chemicals");
  revalidatePath("/ansatt/stoffkartotek");
  if (id) {
    revalidatePath(`/dashboard/coshh-assessments/${id}`);
  }
  if (chemicalId) {
    revalidatePath(`/dashboard/chemicals/${chemicalId}`);
    revalidatePath(`/ansatt/stoffkartotek/${chemicalId}`);
  }
}

export async function listCoshhAssessments() {
  await requireTenantModule("chemicals");
  const { tenantId } = await getRequiredTenantContext();
  return loadCoshhAssessmentsForTenant(tenantId);
}

export async function getCoshhAssessment(id: string) {
  await requireTenantModule("chemicals");
  const { tenantId } = await getRequiredTenantContext();
  return loadCoshhAssessmentById(id, tenantId);
}

export async function listCoshhAssessmentsForChemical(chemicalId: string) {
  const { tenantId } = await getRequiredTenantContext();
  return loadCoshhAssessmentsForChemical(tenantId, chemicalId);
}

export async function createCoshhAssessment(input: {
  chemicalId?: string;
  taskDescription: string;
  exposureRoutes?: string;
  existingControls?: string;
  additionalControls?: string;
  healthSurveillance?: boolean;
  reviewDueAt?: Date;
}) {
  try {
    await requireTenantModule("chemicals");
    const { tenantId } = await getRequiredTenantContext();
    const validated = validateCoshhAssessment({
      chemicalId: input.chemicalId,
      taskDescription: input.taskDescription,
      exposureRoutes: input.exposureRoutes,
      existingControls: input.existingControls,
    });
    if (validated.ok === false) {
      return { success: false as const, error: validated.message };
    }

    const chemical = await loadChemicalById(input.chemicalId!.trim(), tenantId);
    if (!chemical) {
      return { success: false as const, error: "Substance not found in the COSHH register" };
    }

    const assessment = await insertCoshhAssessment({
      tenantId,
      chemicalId: chemical.id,
      taskDescription: input.taskDescription.trim(),
      exposureRoutes: input.exposureRoutes!.trim(),
      existingControls: input.existingControls!.trim(),
      additionalControls: input.additionalControls?.trim() || null,
      healthSurveillance: input.healthSurveillance ?? false,
      reviewDueAt: input.reviewDueAt ?? null,
    });
    revalidateCoshhPaths(assessment.id, chemical.id);
    return { success: true as const, data: assessment };
  } catch (error: unknown) {
    return { success: false as const, error: errorMessage(error, "Could not create the COSHH assessment") };
  }
}
