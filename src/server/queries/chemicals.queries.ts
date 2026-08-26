import { getAdminDb } from "@/lib/supabase/admin";
import { createId } from "@/lib/ids";
import type { Chemical } from "@prisma/client";

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

export function asChemical(row: Record<string, unknown>): Chemical {
  return {
    ...row,
    quantity: row.quantity == null ? null : Number(row.quantity),
    hazardLevel: row.hazardLevel == null ? null : Number(row.hazardLevel),
    isCMR: Boolean(row.isCMR),
    isSVHC: Boolean(row.isSVHC),
    containsIsocyanates: Boolean(row.containsIsocyanates),
    sdsDate: parseDate(row.sdsDate),
    nextReviewDate: parseDate(row.nextReviewDate),
    lastVerifiedAt: parseDate(row.lastVerifiedAt),
    lastEchaSync: parseDate(row.lastEchaSync),
    createdAt: parseDate(row.createdAt) ?? new Date(0),
    updatedAt: parseDate(row.updatedAt) ?? new Date(0),
  } as Chemical;
}

export async function loadChemicalsForTenant(
  tenantId: string,
  opts?: { status?: string },
): Promise<Chemical[]> {
  let query = getAdminDb().from("Chemical").select("*").eq("tenantId", tenantId);
  if (opts?.status) {
    query = query.eq("status", opts.status);
  }
  const { data, error } = await query.order("createdAt", { ascending: false });
  if (error) {
    throw { code: "CHEMICAL_LIST_FAILED", message: error.message };
  }
  return (data ?? []).map((row) => asChemical(row as Record<string, unknown>));
}

export async function loadChemicalById(id: string, tenantId: string): Promise<Chemical | null> {
  const { data, error } = await getAdminDb()
    .from("Chemical")
    .select("*")
    .eq("id", id)
    .eq("tenantId", tenantId)
    .maybeSingle();
  if (error) {
    throw { code: "CHEMICAL_LOOKUP_FAILED", message: error.message };
  }
  return data ? asChemical(data as Record<string, unknown>) : null;
}

export async function countActiveExposuresForChemical(chemicalId: string, tenantId: string): Promise<number> {
  const { count, error } = await getAdminDb()
    .from("ExposureRegister")
    .select("id", { count: "exact", head: true })
    .eq("tenantId", tenantId)
    .eq("chemicalId", chemicalId)
    .neq("status", "ARCHIVED");
  if (error) {
    throw { code: "EXPOSURE_COUNT_FAILED", message: error.message };
  }
  return count ?? 0;
}

export async function insertChemical(input: Record<string, unknown>): Promise<Chemical> {
  const now = nowIso();
  const { data, error } = await getAdminDb()
    .from("Chemical")
    .insert({
      id: createId(),
      ...input,
      createdAt: now,
      updatedAt: now,
    })
    .select("*")
    .single();
  if (error || !data) {
    throw { code: "CHEMICAL_CREATE_FAILED", message: error?.message || "Could not create the COSHH record" };
  }
  return asChemical(data as Record<string, unknown>);
}

export async function updateChemicalRecord(
  id: string,
  tenantId: string,
  patch: Record<string, unknown>,
): Promise<Chemical> {
  const serialized: Record<string, unknown> = { updatedAt: nowIso() };
  for (const [key, value] of Object.entries(patch)) {
    if (key === "id" || key === "tenantId") continue;
    serialized[key] = value instanceof Date ? value.toISOString() : value;
  }
  const { data, error } = await getAdminDb()
    .from("Chemical")
    .update(serialized)
    .eq("id", id)
    .eq("tenantId", tenantId)
    .select("*")
    .single();
  if (error || !data) {
    throw { code: "CHEMICAL_UPDATE_FAILED", message: error?.message || "Could not update the COSHH record" };
  }
  return asChemical(data as Record<string, unknown>);
}

export async function deleteChemicalRecord(id: string, tenantId: string): Promise<void> {
  const { error } = await getAdminDb().from("Chemical").delete().eq("id", id).eq("tenantId", tenantId);
  if (error) {
    throw { code: "CHEMICAL_DELETE_FAILED", message: error.message };
  }
}

export { toIso };
