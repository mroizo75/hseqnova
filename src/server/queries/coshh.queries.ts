import { getAdminDb } from "@/lib/supabase/admin";
import { createId } from "@/lib/ids";
import type { CoshhAssessment } from "@prisma/client";

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

function asAssessment(row: Record<string, unknown>): CoshhAssessment {
  return {
    ...row,
    healthSurveillance: Boolean(row.healthSurveillance),
    reviewDueAt: parseDate(row.reviewDueAt),
    createdAt: parseDate(row.createdAt) ?? new Date(0),
    updatedAt: parseDate(row.updatedAt) ?? new Date(0),
  } as CoshhAssessment;
}

export async function loadCoshhAssessmentsForTenant(
  tenantId: string,
): Promise<CoshhAssessment[]> {
  const { data, error } = await getAdminDb()
    .from("CoshhAssessment")
    .select("*")
    .eq("tenantId", tenantId)
    .order("updatedAt", { ascending: false });
  if (error) {
    throw { code: "COSHH_LIST_FAILED", message: error.message };
  }
  return (data ?? []).map((row) => asAssessment(row as Record<string, unknown>));
}

export async function loadCoshhAssessmentById(
  id: string,
  tenantId: string,
): Promise<CoshhAssessment | null> {
  const { data, error } = await getAdminDb()
    .from("CoshhAssessment")
    .select("*")
    .eq("id", id)
    .eq("tenantId", tenantId)
    .maybeSingle();
  if (error) {
    throw { code: "COSHH_LOOKUP_FAILED", message: error.message };
  }
  return data ? asAssessment(data as Record<string, unknown>) : null;
}

export async function loadCoshhAssessmentsForChemical(
  tenantId: string,
  chemicalId: string,
): Promise<CoshhAssessment[]> {
  const { data, error } = await getAdminDb()
    .from("CoshhAssessment")
    .select("*")
    .eq("tenantId", tenantId)
    .eq("chemicalId", chemicalId)
    .order("updatedAt", { ascending: false });
  if (error) {
    throw { code: "COSHH_LIST_FAILED", message: error.message };
  }
  return (data ?? []).map((row) => asAssessment(row as Record<string, unknown>));
}

export async function insertCoshhAssessment(input: {
  tenantId: string;
  chemicalId: string;
  taskDescription: string;
  exposureRoutes: string;
  existingControls: string;
  additionalControls?: string | null;
  healthSurveillance: boolean;
  reviewDueAt?: Date | null;
}): Promise<CoshhAssessment> {
  const row = {
    id: createId(),
    tenantId: input.tenantId,
    chemicalId: input.chemicalId,
    taskDescription: input.taskDescription,
    exposureRoutes: input.exposureRoutes,
    existingControls: input.existingControls,
    additionalControls: input.additionalControls ?? null,
    healthSurveillance: input.healthSurveillance,
    reviewDueAt: toIso(input.reviewDueAt),
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  const { data, error } = await getAdminDb()
    .from("CoshhAssessment")
    .insert(row)
    .select("*")
    .single();
  if (error) {
    throw { code: "COSHH_CREATE_FAILED", message: error.message };
  }
  return asAssessment(data as Record<string, unknown>);
}
