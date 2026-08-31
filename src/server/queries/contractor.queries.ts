import { getAdminDb } from "@/lib/supabase/admin";
import { createId } from "@/lib/ids";
import type { PreQualStatus } from "@prisma/client";

function nowIso(): string {
  return new Date().toISOString();
}

function parseDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

function toIso(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function asBool(value: unknown): boolean {
  return value === true || value === "true";
}

function asBoolOrNull(value: unknown): boolean | null {
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  return null;
}

export type ContractorRow = {
  id: string;
  tenantId: string;
  companyName: string;
  companyNumber: string | null;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  address: string | null;
  tradeCategory: string | null;
  workToBeDone: string | null;
  hostInformationProvided: boolean;
  hostInformationProvidedAt: Date | null;
  hasPublicLiabilityInsurance: boolean | null;
  publicLiabilityAmount: string | null;
  publicLiabilityExpiry: Date | null;
  hasEmployersLiabilityInsurance: boolean | null;
  employersLiabilityAmount: string | null;
  employersLiabilityExpiry: Date | null;
  hasHealthSafetyPolicy: boolean | null;
  healthSafetyPolicyFile: string | null;
  hasRiskAssessments: boolean | null;
  hasMethodStatements: boolean | null;
  safetyAccreditations: string | null;
  previousEnforcementAction: boolean | null;
  enforcementDetails: string | null;
  preQualificationStatus: PreQualStatus;
  preQualificationNotes: string | null;
  preQualifiedById: string | null;
  preQualifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

function asContractor(row: Record<string, unknown>): ContractorRow {
  return {
    id: row.id as string,
    tenantId: row.tenantId as string,
    companyName: row.companyName as string,
    companyNumber: (row.companyNumber as string | null) ?? null,
    contactName: row.contactName as string,
    contactEmail: row.contactEmail as string,
    contactPhone: (row.contactPhone as string | null) ?? null,
    address: (row.address as string | null) ?? null,
    tradeCategory: (row.tradeCategory as string | null) ?? null,
    workToBeDone: (row.workToBeDone as string | null) ?? null,
    hostInformationProvided: asBool(row.hostInformationProvided),
    hostInformationProvidedAt: parseDate(row.hostInformationProvidedAt),
    hasPublicLiabilityInsurance: asBoolOrNull(row.hasPublicLiabilityInsurance),
    publicLiabilityAmount: (row.publicLiabilityAmount as string | null) ?? null,
    publicLiabilityExpiry: parseDate(row.publicLiabilityExpiry),
    hasEmployersLiabilityInsurance: asBoolOrNull(row.hasEmployersLiabilityInsurance),
    employersLiabilityAmount: (row.employersLiabilityAmount as string | null) ?? null,
    employersLiabilityExpiry: parseDate(row.employersLiabilityExpiry),
    hasHealthSafetyPolicy: asBoolOrNull(row.hasHealthSafetyPolicy),
    healthSafetyPolicyFile: (row.healthSafetyPolicyFile as string | null) ?? null,
    hasRiskAssessments: asBoolOrNull(row.hasRiskAssessments),
    hasMethodStatements: asBoolOrNull(row.hasMethodStatements),
    safetyAccreditations: (row.safetyAccreditations as string | null) ?? null,
    previousEnforcementAction: asBoolOrNull(row.previousEnforcementAction),
    enforcementDetails: (row.enforcementDetails as string | null) ?? null,
    preQualificationStatus: row.preQualificationStatus as PreQualStatus,
    preQualificationNotes: (row.preQualificationNotes as string | null) ?? null,
    preQualifiedById: (row.preQualifiedById as string | null) ?? null,
    preQualifiedAt: parseDate(row.preQualifiedAt),
    createdAt: parseDate(row.createdAt) ?? new Date(0),
    updatedAt: parseDate(row.updatedAt) ?? new Date(0),
  };
}

export async function loadContractorsForTenant(
  tenantId: string,
  statusFilter?: PreQualStatus,
): Promise<ContractorRow[]> {
  let query = getAdminDb()
    .from("ContractorRegistration")
    .select("*")
    .eq("tenantId", tenantId)
    .order("createdAt", { ascending: false });
  if (statusFilter) {
    query = query.eq("preQualificationStatus", statusFilter);
  }
  const { data, error } = await query;
  if (error) {
    throw { code: "CONTRACTOR_LIST_FAILED", message: error.message };
  }
  return (data ?? []).map((row) => asContractor(row as Record<string, unknown>));
}

export async function loadContractorById(
  id: string,
  tenantId: string,
): Promise<ContractorRow | null> {
  const { data, error } = await getAdminDb()
    .from("ContractorRegistration")
    .select("*")
    .eq("id", id)
    .eq("tenantId", tenantId)
    .maybeSingle();
  if (error) {
    throw { code: "CONTRACTOR_LOOKUP_FAILED", message: error.message };
  }
  return data ? asContractor(data as Record<string, unknown>) : null;
}

export async function insertContractor(
  input: Record<string, unknown>,
): Promise<ContractorRow> {
  const now = nowIso();
  const { data, error } = await getAdminDb()
    .from("ContractorRegistration")
    .insert({
      id: createId(),
      ...input,
      createdAt: now,
      updatedAt: now,
    })
    .select("*")
    .single();
  if (error || !data) {
    throw { code: "CONTRACTOR_CREATE_FAILED", message: error?.message || "Could not register the contractor" };
  }
  return asContractor(data as Record<string, unknown>);
}

export async function updateContractorRecord(
  id: string,
  tenantId: string,
  patch: Record<string, unknown>,
): Promise<ContractorRow> {
  const { data, error } = await getAdminDb()
    .from("ContractorRegistration")
    .update({ ...patch, updatedAt: nowIso() })
    .eq("id", id)
    .eq("tenantId", tenantId)
    .select("*")
    .single();
  if (error || !data) {
    throw { code: "CONTRACTOR_UPDATE_FAILED", message: error?.message || "Could not update the contractor" };
  }
  return asContractor(data as Record<string, unknown>);
}

export { toIso };
