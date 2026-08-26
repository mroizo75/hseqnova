"use server";

import { getRequiredTenantContext } from "@/lib/tenant-context";
import { requireTenantModule } from "@/lib/require-tenant-module";
import {
  loadDutyHoldersForProject,
  loadProjectById,
  replaceDutyHoldersForProject,
  syncCdmFreeTextFromDutyHolders,
} from "@/server/queries/projects.queries";
import {
  validateDutyHolders,
  type CdmDutyHolderRoleKey,
} from "@/features/projects/lib/cdm-duty-holders";

export async function listCdmDutyHolders(projectId: string) {
  await requireTenantModule("cdm");
  const { tenantId } = await getRequiredTenantContext();
  const project = await loadProjectById(projectId, tenantId);
  if (!project) {
    throw { code: "PROJECT_NOT_FOUND", message: "Project not found" };
  }
  return loadDutyHoldersForProject(projectId, tenantId);
}

export async function upsertCdmDutyHolder(input: {
  id?: string;
  projectId: string;
  role: CdmDutyHolderRoleKey;
  organisationName: string;
  companyNumber?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
}) {
  await requireTenantModule("cdm");
  const { tenantId } = await getRequiredTenantContext();
  const project = await loadProjectById(input.projectId, tenantId);
  if (!project) {
    throw { code: "PROJECT_NOT_FOUND", message: "Project not found" };
  }

  const existing = await loadDutyHoldersForProject(input.projectId, tenantId);
  const next = existing
    .filter((row) => row.id !== input.id)
    .map((row) => ({
      id: row.id,
      role: row.role as CdmDutyHolderRoleKey,
      organisationName: row.organisationName,
      companyNumber: row.companyNumber,
      contactName: row.contactName,
      contactEmail: row.contactEmail,
      contactPhone: row.contactPhone,
    }));
  next.push({
    id: input.id,
    role: input.role,
    organisationName: input.organisationName,
    companyNumber: input.companyNumber ?? null,
    contactName: input.contactName ?? null,
    contactEmail: input.contactEmail ?? null,
    contactPhone: input.contactPhone ?? null,
  });

  const validated = validateDutyHolders(next);
  if (!validated.ok) {
    throw { code: "CDM_DUTY_HOLDER_INVALID", message: validated.message };
  }

  const saved = await replaceDutyHoldersForProject({
    tenantId,
    projectId: input.projectId,
    holders: validated.holders,
  });
  await syncCdmFreeTextFromDutyHolders(input.projectId, tenantId, saved);
  return saved.find((row) => row.role === input.role && row.organisationName === input.organisationName) ?? saved[0];
}
