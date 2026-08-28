"use server";

import { prisma } from "@/lib/db";
import { getRequiredTenantContext } from "@/lib/tenant-context";
import { PreQualStatus } from "@prisma/client";

export async function listContractors(statusFilter?: PreQualStatus) {
  const { tenantId } = await getRequiredTenantContext();
  return prisma.contractorRegistration.findMany({
    where: {
      tenantId,
      ...(statusFilter ? { preQualificationStatus: statusFilter } : {}),
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getContractor(id: string) {
  const { tenantId } = await getRequiredTenantContext();
  return prisma.contractorRegistration.findFirst({
    where: { id, tenantId },
  });
}

export async function registerContractor(input: {
  companyName: string;
  companyNumber?: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  address?: string;
  tradeCategory?: string;
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

  if (!input.companyName.trim()) {
    throw { code: "VALIDATION", message: "Company name is required" };
  }
  if (!input.contactName.trim()) {
    throw { code: "VALIDATION", message: "Contact name is required" };
  }
  if (!input.contactEmail.trim()) {
    throw { code: "VALIDATION", message: "Contact email is required" };
  }

  return prisma.contractorRegistration.create({
    data: {
      tenantId,
      companyName: input.companyName.trim(),
      companyNumber: input.companyNumber?.trim() || null,
      contactName: input.contactName.trim(),
      contactEmail: input.contactEmail.trim(),
      contactPhone: input.contactPhone?.trim() || null,
      address: input.address?.trim() || null,
      tradeCategory: input.tradeCategory?.trim() || null,
      hasPublicLiabilityInsurance: input.hasPublicLiabilityInsurance,
      publicLiabilityAmount: input.publicLiabilityAmount,
      publicLiabilityExpiry: input.publicLiabilityExpiry,
      hasEmployersLiabilityInsurance: input.hasEmployersLiabilityInsurance,
      employersLiabilityAmount: input.employersLiabilityAmount,
      employersLiabilityExpiry: input.employersLiabilityExpiry,
      hasHealthSafetyPolicy: input.hasHealthSafetyPolicy,
      healthSafetyPolicyFile: input.healthSafetyPolicyFile,
      hasRiskAssessments: input.hasRiskAssessments,
      hasMethodStatements: input.hasMethodStatements,
      safetyAccreditations: input.safetyAccreditations,
      previousEnforcementAction: input.previousEnforcementAction,
      enforcementDetails: input.enforcementDetails,
      preQualificationStatus: PreQualStatus.PENDING,
    },
  });
}

export async function updatePreQualificationStatus(
  id: string,
  status: PreQualStatus,
  notes?: string,
) {
  const { tenantId, userId } = await getRequiredTenantContext();
  const contractor = await prisma.contractorRegistration.findFirst({
    where: { id, tenantId },
  });
  if (!contractor) {
    throw { code: "NOT_FOUND", message: "Contractor not found" };
  }
  return prisma.contractorRegistration.update({
    where: { id },
    data: {
      preQualificationStatus: status,
      preQualificationNotes: notes ?? contractor.preQualificationNotes,
      preQualifiedById: userId,
      preQualifiedAt: new Date(),
    },
  });
}
