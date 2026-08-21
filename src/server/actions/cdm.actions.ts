"use server";

import { prisma } from "@/lib/db";
import { getRequiredTenantContext } from "@/lib/tenant-context";
import { requireTenantModule } from "@/lib/require-tenant-module";
import { CdmDutyHolderRole } from "@prisma/client";

export async function listCdmDutyHolders(projectId: string) {
  await requireTenantModule("cdm");
  const { tenantId } = await getRequiredTenantContext();
  return prisma.cdmDutyHolder.findMany({
    where: { tenantId, projectId },
    orderBy: { createdAt: "asc" },
  });
}

export async function upsertCdmDutyHolder(input: {
  id?: string;
  projectId: string;
  role: CdmDutyHolderRole;
  organisationName: string;
  companyNumber?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
}) {
  await requireTenantModule("cdm");
  const { tenantId } = await getRequiredTenantContext();
  if (input.id) {
    return prisma.cdmDutyHolder.update({
      where: { id: input.id },
      data: {
        role: input.role,
        organisationName: input.organisationName,
        companyNumber: input.companyNumber,
        contactName: input.contactName,
        contactEmail: input.contactEmail,
        contactPhone: input.contactPhone,
      },
    });
  }
  return prisma.cdmDutyHolder.create({
    data: {
      tenantId,
      projectId: input.projectId,
      role: input.role,
      organisationName: input.organisationName,
      companyNumber: input.companyNumber,
      contactName: input.contactName,
      contactEmail: input.contactEmail,
      contactPhone: input.contactPhone,
    },
  });
}
