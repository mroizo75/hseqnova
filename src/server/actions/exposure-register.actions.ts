"use server";

import { revalidatePath } from "next/cache";
import { getRequiredTenantContext } from "@/lib/tenant-context";
import { ExposureRegisterStatus, ExposureType } from "@prisma/client";
import { encryptField, decryptField } from "@/lib/field-encryption";
import {
  chemicalExistsInTenant,
  insertExposureRegister,
  loadEmployeesForTenant,
  loadExposureById,
  loadExposureRegistersForTenant,
  loadOpenRisksForSelect,
  loadRuhReportsForSelect,
  loadUserNameEmail,
  membershipExists,
  riskExistsInTenant,
  ruhReportExistsInTenant,
  toIso,
  updateExposureRecord,
} from "@/server/queries/exposure-register.queries";
import {
  computeRetentionUntilDate,
  deriveExposureStatus,
} from "@/features/exposure-register/lib/exposure-status";
import { isValidNiNumber, normalizeNiNumber } from "@/features/exposure-register/lib/ni-number";

function errorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

async function getSessionContext() {
  const tenantContext = await getRequiredTenantContext();
  const user = await loadUserNameEmail(tenantContext.userId);
  if (!user) {
    throw { code: "USER_NOT_FOUND", message: "User not found" };
  }
  return { user, tenantId: tenantContext.tenantId };
}

type ExposureRelationInput = {
  employeeId?: string | null;
  chemicalId?: string | null;
  ruhReportId?: string | null;
  riskId?: string | null;
};

async function assertTenantScopedExposureRelations(
  tenantId: string,
  relations: ExposureRelationInput,
): Promise<void> {
  const { employeeId, chemicalId, ruhReportId, riskId } = relations;

  if (employeeId) {
    const exists = await membershipExists(employeeId, tenantId);
    if (!exists) {
      throw { code: "EMPLOYEE_NOT_IN_TENANT", message: "Employee is not in this organisation" };
    }
  }

  if (chemicalId) {
    const exists = await chemicalExistsInTenant(chemicalId, tenantId);
    if (!exists) {
      throw { code: "CHEMICAL_NOT_IN_TENANT", message: "Chemical is not in this organisation" };
    }
  }

  if (ruhReportId) {
    const exists = await ruhReportExistsInTenant(ruhReportId, tenantId);
    if (!exists) {
      throw { code: "INCIDENT_NOT_IN_TENANT", message: "Accident book entry is not in this organisation" };
    }
  }

  if (riskId) {
    const exists = await riskExistsInTenant(riskId, tenantId);
    if (!exists) {
      throw { code: "RISK_NOT_IN_TENANT", message: "Risk assessment is not in this organisation" };
    }
  }
}

export async function getExposureRegisters(_tenantId: string) {
  try {
    const { tenantId } = await getSessionContext();
    const entries = await loadExposureRegistersForTenant(tenantId);
    return { success: true, data: entries };
  } catch (error: unknown) {
    return { success: false, error: errorMessage(error, "Could not load health records") };
  }
}

export async function getExposureRegister(id: string) {
  try {
    const { tenantId } = await getSessionContext();
    const entry = await loadExposureById(id, tenantId);
    if (!entry) return { success: false, error: "Not found" };
    return {
      success: true,
      data: {
        ...entry,
        employeeBirthNumber: decryptField(entry.employeeBirthNumber),
      },
    };
  } catch (error: unknown) {
    return { success: false, error: errorMessage(error, "Could not load the record") };
  }
}

export interface CreateExposureRegisterInput {
  employeeId?: string;
  employeeName: string;
  employeeBirthNumber: string;
  department?: string;
  jobTitle: string;
  workLocation: string;
  employmentStartDate?: Date;
  employmentEndDate?: Date;
  chemicalId?: string;
  exposureAgent: string;
  casNumber?: string;
  exposureType: ExposureType;
  exposureStartDate: Date;
  exposureEndDate?: Date;
  duration?: string;
  ppeUsed?: string;
  riskAssessmentDone: boolean;
  healthCheckRequired: boolean;
  healthCheckDone: boolean;
  healthCheckDate?: Date;
  retentionYears: number;
  ruhReportId?: string;
  riskId?: string;
  comment?: string;
}

export async function createExposureRegister(input: CreateExposureRegisterInput) {
  try {
    const { tenantId, user } = await getSessionContext();
    const nino = normalizeNiNumber(input.employeeBirthNumber);
    if (!isValidNiNumber(nino)) {
      return { success: false, error: "Enter a valid National Insurance number" };
    }

    await assertTenantScopedExposureRelations(tenantId, {
      employeeId: input.employeeId,
      chemicalId: input.chemicalId,
      ruhReportId: input.ruhReportId,
      riskId: input.riskId,
    });

    const entry = await insertExposureRegister({
      tenantId,
      employeeId: input.employeeId || null,
      employeeName: input.employeeName,
      employeeBirthNumber: encryptField(nino),
      department: input.department || null,
      jobTitle: input.jobTitle,
      workLocation: input.workLocation,
      employmentStartDate: toIso(input.employmentStartDate ?? null),
      employmentEndDate: toIso(input.employmentEndDate ?? null),
      chemicalId: input.chemicalId || null,
      exposureAgent: input.exposureAgent,
      casNumber: input.casNumber || null,
      exposureType: input.exposureType,
      exposureStartDate: toIso(input.exposureStartDate),
      exposureEndDate: toIso(input.exposureEndDate ?? null),
      duration: input.duration || null,
      ppeUsed: input.ppeUsed || null,
      riskAssessmentDone: input.riskAssessmentDone,
      healthCheckRequired: input.healthCheckRequired,
      healthCheckDone: input.healthCheckDone,
      healthCheckDate: toIso(input.healthCheckDate ?? null),
      retentionYears: input.retentionYears,
      retentionUntilDate: toIso(computeRetentionUntilDate(input.retentionYears)),
      status: deriveExposureStatus(input.exposureEndDate),
      ruhReportId: input.ruhReportId || null,
      riskId: input.riskId || null,
      comment: input.comment || null,
      registeredBy: user.name || user.email,
    });

    revalidatePath("/dashboard/exposure-register");
    return { success: true, data: entry };
  } catch (error: unknown) {
    return { success: false, error: errorMessage(error, "Could not create the health record") };
  }
}

export type UpdateExposureRegisterInput = Partial<CreateExposureRegisterInput> & {
  status?: ExposureRegisterStatus;
};

export async function updateExposureRegister(id: string, input: UpdateExposureRegisterInput) {
  try {
    const { tenantId } = await getSessionContext();
    const existing = await loadExposureById(id, tenantId);
    if (!existing) return { success: false, error: "Not found" };
    if (existing.status === "ARCHIVED") {
      return { success: false, error: "Archived records cannot be changed" };
    }

    const resolvedEndDate =
      input.exposureEndDate !== undefined ? input.exposureEndDate || null : existing.exposureEndDate;

    await assertTenantScopedExposureRelations(tenantId, {
      employeeId: input.employeeId,
      chemicalId: input.chemicalId,
      ruhReportId: input.ruhReportId,
      riskId: input.riskId,
    });

    const patch: Record<string, unknown> = {
      status: deriveExposureStatus(resolvedEndDate, input.status ?? null),
    };
    if (input.employeeId !== undefined) patch.employeeId = input.employeeId || null;
    if (input.employeeName) patch.employeeName = input.employeeName;
    if (input.employeeBirthNumber) {
      const nino = normalizeNiNumber(input.employeeBirthNumber);
      const existingNi = normalizeNiNumber(decryptField(existing.employeeBirthNumber));
      if (isValidNiNumber(nino)) {
        patch.employeeBirthNumber = encryptField(nino);
      } else if (nino !== existingNi) {
        return { success: false, error: "Enter a valid National Insurance number" };
      }
    }
    if (input.department !== undefined) patch.department = input.department || null;
    if (input.jobTitle) patch.jobTitle = input.jobTitle;
    if (input.workLocation) patch.workLocation = input.workLocation;
    if (input.employmentStartDate !== undefined) patch.employmentStartDate = input.employmentStartDate || null;
    if (input.employmentEndDate !== undefined) patch.employmentEndDate = input.employmentEndDate || null;
    if (input.chemicalId !== undefined) patch.chemicalId = input.chemicalId || null;
    if (input.exposureAgent) patch.exposureAgent = input.exposureAgent;
    if (input.casNumber !== undefined) patch.casNumber = input.casNumber || null;
    if (input.exposureType) patch.exposureType = input.exposureType;
    if (input.exposureStartDate) patch.exposureStartDate = input.exposureStartDate;
    if (input.exposureEndDate !== undefined) patch.exposureEndDate = input.exposureEndDate || null;
    if (input.duration !== undefined) patch.duration = input.duration || null;
    if (input.ppeUsed !== undefined) patch.ppeUsed = input.ppeUsed || null;
    if (input.riskAssessmentDone !== undefined) patch.riskAssessmentDone = input.riskAssessmentDone;
    if (input.healthCheckRequired !== undefined) patch.healthCheckRequired = input.healthCheckRequired;
    if (input.healthCheckDone !== undefined) patch.healthCheckDone = input.healthCheckDone;
    if (input.healthCheckDate !== undefined) patch.healthCheckDate = input.healthCheckDate || null;
    if (input.retentionYears !== undefined) {
      patch.retentionYears = input.retentionYears;
      patch.retentionUntilDate = computeRetentionUntilDate(input.retentionYears);
    }
    if (input.ruhReportId !== undefined) patch.ruhReportId = input.ruhReportId || null;
    if (input.riskId !== undefined) patch.riskId = input.riskId || null;
    if (input.comment !== undefined) patch.comment = input.comment || null;

    const updated = await updateExposureRecord(id, tenantId, patch);
    revalidatePath("/dashboard/exposure-register");
    return { success: true, data: updated };
  } catch (error: unknown) {
    return { success: false, error: errorMessage(error, "Could not update the health record") };
  }
}

export async function archiveExposureRegister(id: string) {
  try {
    const { tenantId } = await getSessionContext();
    const existing = await loadExposureById(id, tenantId);
    if (!existing) return { success: false, error: "Not found" };

    const now = new Date();
    if (existing.retentionUntilDate > now) {
      return {
        success: false,
        error: `Cannot archive before the retention period ends (${existing.retentionUntilDate.toLocaleDateString("en-GB")})`,
      };
    }

    await updateExposureRecord(id, tenantId, { status: "ARCHIVED", archivedAt: now });
    revalidatePath("/dashboard/exposure-register");
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: errorMessage(error, "Could not archive the record") };
  }
}

export async function markExposureInactive(id: string, endDate: Date) {
  try {
    const { tenantId } = await getSessionContext();
    const existing = await loadExposureById(id, tenantId);
    if (!existing) return { success: false, error: "Not found" };

    await updateExposureRecord(id, tenantId, {
      status: "INACTIVE",
      exposureEndDate: endDate,
    });

    revalidatePath("/dashboard/exposure-register");
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: errorMessage(error, "Could not update the record") };
  }
}

export async function getRisksForTenant(_tenantId: string) {
  try {
    const { tenantId } = await getSessionContext();
    const risks = await loadOpenRisksForSelect(tenantId);
    return { success: true, data: risks };
  } catch (error: unknown) {
    return { success: false, error: errorMessage(error, "Could not load risk assessments") };
  }
}

export async function getRuhReportsForTenant(_tenantId: string) {
  try {
    const { tenantId } = await getSessionContext();
    const reports = await loadRuhReportsForSelect(tenantId);
    return { success: true, data: reports };
  } catch (error: unknown) {
    return { success: false, error: errorMessage(error, "Could not load accident book entries") };
  }
}

export async function getEmployeesForTenant(_tenantId: string) {
  try {
    const { tenantId } = await getSessionContext();
    const employees = await loadEmployeesForTenant(tenantId);
    return { success: true, data: employees };
  } catch (error: unknown) {
    return { success: false, error: errorMessage(error, "Could not load employees") };
  }
}
