import { getAdminDb } from "@/lib/supabase/admin";
import { createId } from "@/lib/ids";
import type { OrgChartNode } from "@prisma/client";

function nowIso(): string {
  return new Date().toISOString();
}

function parseDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function asOrgChartNode(row: Record<string, unknown>): OrgChartNode {
  return {
    ...row,
    sortOrder: Number(row.sortOrder ?? 0),
    createdAt: parseDate(row.createdAt) ?? new Date(0),
    updatedAt: parseDate(row.updatedAt) ?? new Date(0),
  } as OrgChartNode;
}

export async function loadOrgChartNodes(tenantId: string): Promise<OrgChartNode[]> {
  const { data, error } = await getAdminDb()
    .from("OrgChartNode")
    .select("*")
    .eq("tenantId", tenantId)
    .order("sortOrder", { ascending: true })
    .order("createdAt", { ascending: true });
  if (error) {
    throw { code: "ORG_CHART_LIST_FAILED", message: error.message };
  }
  return (data ?? []).map((row) => asOrgChartNode(row as Record<string, unknown>));
}

export async function loadOrgChartNode(id: string, tenantId: string): Promise<OrgChartNode | null> {
  const { data, error } = await getAdminDb()
    .from("OrgChartNode")
    .select("*")
    .eq("id", id)
    .eq("tenantId", tenantId)
    .maybeSingle();
  if (error) {
    throw { code: "ORG_CHART_LOOKUP_FAILED", message: error.message };
  }
  return data ? asOrgChartNode(data as Record<string, unknown>) : null;
}

export async function insertOrgChartNode(input: {
  tenantId: string;
  parentId?: string | null;
  title: string;
  name?: string | null;
  department?: string | null;
  sortOrder?: number;
}): Promise<OrgChartNode> {
  const now = nowIso();
  const { data, error } = await getAdminDb()
    .from("OrgChartNode")
    .insert({
      id: createId(),
      tenantId: input.tenantId,
      parentId: input.parentId ?? null,
      title: input.title,
      name: input.name ?? null,
      department: input.department ?? null,
      sortOrder: input.sortOrder ?? 0,
      createdAt: now,
      updatedAt: now,
    })
    .select("*")
    .single();
  if (error || !data) {
    throw { code: "ORG_CHART_CREATE_FAILED", message: error?.message || "Could not create the organisation chart role" };
  }
  return asOrgChartNode(data as Record<string, unknown>);
}

export async function updateOrgChartNodeRecord(
  id: string,
  tenantId: string,
  patch: Record<string, unknown>,
): Promise<OrgChartNode> {
  const serialized: Record<string, unknown> = { updatedAt: nowIso() };
  for (const [key, value] of Object.entries(patch)) {
    if (key === "id" || key === "tenantId") continue;
    serialized[key] = value;
  }
  const { data, error } = await getAdminDb()
    .from("OrgChartNode")
    .update(serialized)
    .eq("id", id)
    .eq("tenantId", tenantId)
    .select("*")
    .single();
  if (error || !data) {
    throw { code: "ORG_CHART_UPDATE_FAILED", message: error?.message || "Could not update the organisation chart role" };
  }
  return asOrgChartNode(data as Record<string, unknown>);
}

export async function reparentOrgChartChildren(
  parentId: string,
  newParentId: string | null,
  tenantId: string,
): Promise<void> {
  const { error } = await getAdminDb()
    .from("OrgChartNode")
    .update({ parentId: newParentId, updatedAt: nowIso() })
    .eq("parentId", parentId)
    .eq("tenantId", tenantId);
  if (error) {
    throw { code: "ORG_CHART_REPARENT_FAILED", message: error.message };
  }
}

export async function deleteOrgChartNodeRecord(id: string, tenantId: string): Promise<void> {
  const { error } = await getAdminDb().from("OrgChartNode").delete().eq("id", id).eq("tenantId", tenantId);
  if (error) {
    throw { code: "ORG_CHART_DELETE_FAILED", message: error.message };
  }
}

export async function countChildOrgChartNodes(parentId: string, tenantId: string): Promise<number> {
  const { count, error } = await getAdminDb()
    .from("OrgChartNode")
    .select("id", { count: "exact", head: true })
    .eq("parentId", parentId)
    .eq("tenantId", tenantId);
  if (error) {
    throw { code: "ORG_CHART_COUNT_FAILED", message: error.message };
  }
  return count ?? 0;
}
