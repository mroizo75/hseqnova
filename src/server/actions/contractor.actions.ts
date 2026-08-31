"use server";

import { revalidatePath } from "next/cache";
import { getRequiredTenantContext } from "@/lib/tenant-context";
import type { PreQualStatus } from "@prisma/client";
import {
  validateContractorForApproval,
  validateContractorRegistration,
} from "@/lib/contractor-uk";
import {
  insertContractor,
  loadContractorById,
  loadContractorsForTenant,
  toIso,
  updateContractorRecord,
} from "@/server/queries/contractor.queries";

export async function listContractors(statusFilter?: PreQualStatus) {
  const { tenantId } = await getRequiredTenantContext();
  return loadContractorsForTenant(tenantId, statusFilter);
}

export async function getContractor(id: string) {
  const { tenantId } = await getRequiredTenantContext();
  return loadContractorById(id, tenantId);
}

export async function registerContractor(input: {
  companyName: string;
  companyNumber?: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  address?: string;
  tradeCategory?: string;
  workToBeDone?: string;
  hostInformationProvided?: boolean;
  hasPublicLiabilityInsurance?: boolean;
  publicLiabilityAmount?: string;
  publicLiabilityExpiry?: Date;
  hasEmployersLiabilityInsurance?: boolean;
  employersLiabilityAmount?: string;
  employersLiabilityExpiry?: Date;
  hasHealthSafetyPolicy?: boolean;
  healthSafetyPolicyFile?: string;
  hasRiskAssessments?: boolean;
  hasMethodStatements?: boolean;
  safetyAccreditations?: string;
  previousEnforcementAction?: boolean;
  enforcementDetails?: string;
}) {
  const { tenantId } = await getRequiredTenantContext();
  const valid = validateContractorRegistration(input);
  if (valid.ok === false) {
    throw { code: valid.code, message: valid.message };
  }

  const hostInformationProvided = input.hostInformationProvided === true;
  const row = await insertContractor({
    tenantId,
    companyName: input.companyName.trim(),
    companyNumber: input.companyNumber?.trim() || null,
    contactName: input.contactName.trim(),
    contactEmail: input.contactEmail.trim(),
    contactPhone: input.contactPhone?.trim() || null,
    address: input.address?.trim() || null,
    tradeCategory: input.tradeCategory?.trim() || null,
    workToBeDone: input.workToBeDone?.trim() || null,
    hostInformationProvided,
    hostInformationProvidedAt: hostInformationProvided ? toIso(new Date()) : null,
    hasPublicLiabilityInsurance: input.hasPublicLiabilityInsurance ?? null,
    publicLiabilityAmount: input.publicLiabilityAmount?.trim() || null,
    publicLiabilityExpiry: toIso(input.publicLiabilityExpiry),
    hasEmployersLiabilityInsurance: input.hasEmployersLiabilityInsurance ?? null,
    employersLiabilityAmount: input.employersLiabilityAmount?.trim() || null,
    employersLiabilityExpiry: toIso(input.employersLiabilityExpiry),
    hasHealthSafetyPolicy: input.hasHealthSafetyPolicy ?? null,
    healthSafetyPolicyFile: input.healthSafetyPolicyFile ?? null,
    hasRiskAssessments: input.hasRiskAssessments ?? null,
    hasMethodStatements: input.hasMethodStatements ?? null,
    safetyAccreditations: input.safetyAccreditations ?? null,
    previousEnforcementAction: input.previousEnforcementAction ?? null,
    enforcementDetails: input.enforcementDetails?.trim() || null,
    preQualificationStatus: "PENDING",
  });
  revalidatePath("/dashboard/contractors");
  return row;
}

export async function updatePreQualificationStatus(
  id: string,
  status: PreQualStatus,
  notes?: string,
  extras?: {
    workToBeDone?: string;
    hostInformationProvided?: boolean;
  },
) {
  const { tenantId, userId } = await getRequiredTenantContext();
  const contractor = await loadContractorById(id, tenantId);
  if (!contractor) {
    throw { code: "NOT_FOUND", message: "Contractor not found" };
  }

  const workToBeDone = extras?.workToBeDone?.trim() || contractor.workToBeDone;
  const hostInformationProvided =
    extras?.hostInformationProvided ?? contractor.hostInformationProvided;

  if (status === "APPROVED") {
    const valid = validateContractorForApproval({
      workToBeDone,
      hostInformationProvided,
    });
    if (valid.ok === false) {
      throw { code: valid.code, message: valid.message };
    }
  }

  const hostJustSet = hostInformationProvided === true && !contractor.hostInformationProvided;
  const row = await updateContractorRecord(id, tenantId, {
    preQualificationStatus: status,
    preQualificationNotes: notes ?? contractor.preQualificationNotes,
    preQualifiedById: userId,
    preQualifiedAt: toIso(new Date()),
    workToBeDone: workToBeDone ?? null,
    hostInformationProvided,
    hostInformationProvidedAt: hostInformationProvided
      ? toIso(hostJustSet ? new Date() : contractor.hostInformationProvidedAt ?? new Date())
      : null,
  });
  revalidatePath("/dashboard/contractors");
  revalidatePath(`/dashboard/contractors/${id}`);
  return row;
}
