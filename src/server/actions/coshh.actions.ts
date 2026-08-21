"use server";

import { prisma } from "@/lib/db";
import { getRequiredTenantContext } from "@/lib/tenant-context";
import { requireTenantModule } from "@/lib/require-tenant-module";

export async function listCoshhAssessments() {
  await requireTenantModule("coshh");
  const { tenantId } = await getRequiredTenantContext();
  return prisma.coshhAssessment.findMany({
    where: { tenantId },
    orderBy: { updatedAt: "desc" },
  });
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
  await requireTenantModule("coshh");
  const { tenantId } = await getRequiredTenantContext();
  if (!input.taskDescription.trim()) {
    throw { code: "VALIDATION", message: "Task description is required" };
  }
  return prisma.coshhAssessment.create({
    data: {
      tenantId,
      chemicalId: input.chemicalId,
      taskDescription: input.taskDescription.trim(),
      exposureRoutes: input.exposureRoutes,
      existingControls: input.existingControls,
      additionalControls: input.additionalControls,
      healthSurveillance: input.healthSurveillance ?? false,
      reviewDueAt: input.reviewDueAt,
    },
  });
}
