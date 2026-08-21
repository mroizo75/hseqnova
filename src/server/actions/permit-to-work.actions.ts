"use server";

import { prisma } from "@/lib/db";
import { getRequiredTenantContext } from "@/lib/tenant-context";
import { requireTenantModule } from "@/lib/require-tenant-module";
import { PermitToWorkStatus } from "@prisma/client";

export async function listPermitsToWork() {
  await requireTenantModule("permitToWork");
  const { tenantId } = await getRequiredTenantContext();
  return prisma.permitToWork.findMany({
    where: { tenantId },
    orderBy: { validFrom: "desc" },
  });
}

export async function createPermitToWork(input: {
  projectId?: string;
  type: string;
  title: string;
  location?: string;
  validFrom: Date;
  validTo?: Date;
  isolations?: string;
}) {
  await requireTenantModule("permitToWork");
  const { tenantId } = await getRequiredTenantContext();
  if (!input.title.trim()) {
    throw { code: "VALIDATION", message: "Title is required" };
  }
  return prisma.permitToWork.create({
    data: {
      tenantId,
      projectId: input.projectId,
      type: input.type,
      title: input.title.trim(),
      location: input.location,
      validFrom: input.validFrom,
      validTo: input.validTo,
      isolations: input.isolations,
      status: PermitToWorkStatus.DRAFT,
    },
  });
}
