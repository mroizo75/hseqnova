"use server";

import { revalidatePath } from "next/cache";
import { requirePermission, getAuthContext } from "@/lib/server-authorization";
import {
  countChildOrgChartNodes,
  deleteOrgChartNodeRecord,
  insertOrgChartNode,
  loadOrgChartNode,
  loadOrgChartNodes,
  reparentOrgChartChildren,
  updateOrgChartNodeRecord,
} from "@/server/queries/org-chart.queries";
import { HEALTH_SAFETY_POLICY_EMPLOYEE_PATH } from "@/lib/health-safety-policy";
import {
  dutyRequiresName,
  isOrgHsDutyKey,
  ORG_HS_DUTY_BY_KEY,
  assessOrgChartCoverage,
} from "@/lib/org-chart-duties";

const ORG_CHART_PATH = "/dashboard/organisasjonskart";

function revalidateOrgChartPaths() {
  revalidatePath(ORG_CHART_PATH);
  revalidatePath(HEALTH_SAFETY_POLICY_EMPLOYEE_PATH);
}

function errorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

function validateDutyName(hsDutyKey: string | null | undefined, name: string | null | undefined): string | null {
  if (dutyRequiresName(hsDutyKey) && !name?.trim()) {
    return "HSE requires the name of each person with specific health and safety responsibility.";
  }
  if (hsDutyKey && !isOrgHsDutyKey(hsDutyKey)) {
    return "Unknown health and safety duty.";
  }
  return null;
}

export async function getOrgChart() {
  try {
    const context = await getAuthContext();
    if (!context) {
      return { success: false, error: "Not authenticated" };
    }

    const nodes = await loadOrgChartNodes(context.tenantId);
    return { success: true, data: nodes };
  } catch (error: unknown) {
    return { success: false, error: errorMessage(error, "Could not load the organisation chart") };
  }
}

export async function createOrgChartNode(input: {
  parentId?: string | null;
  title: string;
  name?: string | null;
  department?: string | null;
  hsDutyKey?: string | null;
  hsDuty?: string | null;
  sortOrder?: number;
}) {
  try {
    const context = await requirePermission("canManageUsers");

    if (!input.title || input.title.trim().length === 0) {
      return { success: false, error: "Title is required" };
    }

    const dutyError = validateDutyName(input.hsDutyKey, input.name);
    if (dutyError) return { success: false, error: dutyError };

    if (input.parentId) {
      const parent = await loadOrgChartNode(input.parentId, context.tenantId);
      if (!parent) {
        return { success: false, error: "Parent role not found" };
      }
    }

    const node = await insertOrgChartNode({
      tenantId: context.tenantId,
      parentId: input.parentId ?? null,
      title: input.title.trim(),
      name: input.name?.trim() || null,
      department: input.department?.trim() || null,
      hsDutyKey: input.hsDutyKey && isOrgHsDutyKey(input.hsDutyKey) ? input.hsDutyKey : null,
      hsDuty: input.hsDuty?.trim() || null,
      sortOrder: input.sortOrder ?? 0,
    });

    revalidateOrgChartPaths();
    return { success: true, data: node };
  } catch (error: unknown) {
    return { success: false, error: errorMessage(error, "Could not create the organisation chart role") };
  }
}

export async function updateOrgChartNode(input: {
  id: string;
  parentId?: string | null;
  title?: string;
  name?: string | null;
  department?: string | null;
  hsDutyKey?: string | null;
  hsDuty?: string | null;
  sortOrder?: number;
}) {
  try {
    const context = await requirePermission("canManageUsers");

    const existing = await loadOrgChartNode(input.id, context.tenantId);
    if (!existing) {
      return { success: false, error: "Role not found" };
    }

    if (input.parentId === input.id) {
      return { success: false, error: "A role cannot be its own parent" };
    }

    const nextDutyKey = input.hsDutyKey !== undefined ? input.hsDutyKey : existing.hsDutyKey;
    const nextName = input.name !== undefined ? input.name : existing.name;
    const dutyError = validateDutyName(nextDutyKey, nextName);
    if (dutyError) return { success: false, error: dutyError };

    const patch: Record<string, unknown> = {};
    if (input.title !== undefined) patch.title = input.title.trim();
    if (input.name !== undefined) patch.name = input.name?.trim() || null;
    if (input.department !== undefined) patch.department = input.department?.trim() || null;
    if (input.hsDutyKey !== undefined) {
      patch.hsDutyKey = input.hsDutyKey && isOrgHsDutyKey(input.hsDutyKey) ? input.hsDutyKey : null;
    }
    if (input.hsDuty !== undefined) patch.hsDuty = input.hsDuty?.trim() || null;
    if (input.sortOrder !== undefined) patch.sortOrder = input.sortOrder;
    if (Object.prototype.hasOwnProperty.call(input, "parentId")) {
      if (input.parentId) {
        const parent = await loadOrgChartNode(input.parentId, context.tenantId);
        if (!parent) {
          return { success: false, error: "Parent role not found" };
        }
      }
      patch.parentId = input.parentId ?? null;
    }

    const node = await updateOrgChartNodeRecord(input.id, context.tenantId, patch);

    revalidateOrgChartPaths();
    return { success: true, data: node };
  } catch (error: unknown) {
    return { success: false, error: errorMessage(error, "Could not update the organisation chart role") };
  }
}

export async function deleteOrgChartNode(id: string) {
  try {
    const context = await requirePermission("canManageUsers");

    const existing = await loadOrgChartNode(id, context.tenantId);
    if (!existing) {
      return { success: false, error: "Role not found" };
    }

    const childCount = await countChildOrgChartNodes(id, context.tenantId);
    if (childCount > 0) {
      await reparentOrgChartChildren(id, existing.parentId, context.tenantId);
    }

    await deleteOrgChartNodeRecord(id, context.tenantId);

    revalidateOrgChartPaths();
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: errorMessage(error, "Could not delete the organisation chart role") };
  }
}

export async function seedMissingHsRoles() {
  try {
    const context = await requirePermission("canManageUsers");
    const nodes = await loadOrgChartNodes(context.tenantId);
    const coverage = assessOrgChartCoverage(nodes);
    if (coverage.absent.length === 0) {
      return { success: true, added: 0 };
    }

    const mdNode = nodes.find((node) => node.hsDutyKey === "md");
    let parentId = mdNode?.id ?? nodes.find((node) => !node.parentId)?.id ?? null;
    let added = 0;

    for (const key of coverage.absent) {
      const meta = ORG_HS_DUTY_BY_KEY[key];
      const created = await insertOrgChartNode({
        tenantId: context.tenantId,
        parentId: key === "md" ? null : parentId,
        title: meta.defaultTitle,
        name: null,
        hsDutyKey: key,
        hsDuty: meta.defaultDuty,
        sortOrder: nodes.length + added,
      });
      if (key === "md") {
        parentId = created.id;
      }
      added += 1;
    }

    revalidateOrgChartPaths();
    return { success: true, added };
  } catch (error: unknown) {
    return { success: false, error: errorMessage(error, "Could not add typical health and safety roles") };
  }
}
