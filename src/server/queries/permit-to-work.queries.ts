import { getAdminDb } from "@/lib/supabase/admin";
import { createId } from "@/lib/ids";
import type { PermitToWork, PermitToWorkStatus } from "@prisma/client";

function nowIso(): string {
  return new Date().toISOString();
}

function toIso(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function parseDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

function asPermit(row: Record<string, unknown>): PermitToWork {
  return {
    ...row,
    validFrom: parseDate(row.validFrom) ?? new Date(0),
    validTo: parseDate(row.validTo),
    createdAt: parseDate(row.createdAt) ?? new Date(0),
    updatedAt: parseDate(row.updatedAt) ?? new Date(0),
  } as PermitToWork;
}

export async function loadPermitsForTenant(tenantId: string): Promise<PermitToWork[]> {
  const { data, error } = await getAdminDb()
    .from("PermitToWork")
    .select("*")
    .eq("tenantId", tenantId)
    .order("validFrom", { ascending: false });
  if (error) {
    throw { code: "PERMIT_LIST_FAILED", message: error.message };
  }
  return (data ?? []).map((row) => asPermit(row as Record<string, unknown>));
}

export async function loadWorkforcePermits(tenantId: string): Promise<PermitToWork[]> {
  const { data, error } = await getAdminDb()
    .from("PermitToWork")
    .select("*")
    .eq("tenantId", tenantId)
    .in("status", ["ISSUED", "CLOSED"])
    .order("validFrom", { ascending: false });
  if (error) {
    throw { code: "PERMIT_LIST_FAILED", message: error.message };
  }
  return (data ?? []).map((row) => asPermit(row as Record<string, unknown>));
}

export async function loadPermitById(
  id: string,
  tenantId: string,
): Promise<PermitToWork | null> {
  const { data, error } = await getAdminDb()
    .from("PermitToWork")
    .select("*")
    .eq("id", id)
    .eq("tenantId", tenantId)
    .maybeSingle();
  if (error) {
    throw { code: "PERMIT_LOOKUP_FAILED", message: error.message };
  }
  if (!data) return null;
  return asPermit(data as Record<string, unknown>);
}

export async function insertPermitToWork(input: {
  tenantId: string;
  projectId?: string | null;
  type: string;
  title: string;
  location: string;
  validFrom: Date;
  validTo: Date;
  isolations: string;
}): Promise<PermitToWork> {
  const row = {
    id: createId(),
    tenantId: input.tenantId,
    projectId: input.projectId ?? null,
    type: input.type,
    title: input.title,
    location: input.location,
    validFrom: toIso(input.validFrom),
    validTo: toIso(input.validTo),
    status: "DRAFT" satisfies PermitToWorkStatus,
    isolations: input.isolations,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  const { data, error } = await getAdminDb()
    .from("PermitToWork")
    .insert(row)
    .select("*")
    .single();
  if (error) {
    throw { code: "PERMIT_CREATE_FAILED", message: error.message };
  }
  return asPermit(data as Record<string, unknown>);
}

export async function updatePermitRecord(
  id: string,
  tenantId: string,
  patch: { status?: PermitToWorkStatus; isolations?: string },
): Promise<PermitToWork> {
  const { data, error } = await getAdminDb()
    .from("PermitToWork")
    .update({ ...patch, updatedAt: nowIso() })
    .eq("id", id)
    .eq("tenantId", tenantId)
    .select("*")
    .single();
  if (error) {
    throw { code: "PERMIT_UPDATE_FAILED", message: error.message };
  }
  return asPermit(data as Record<string, unknown>);
}
