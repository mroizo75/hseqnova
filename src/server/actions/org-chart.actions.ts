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

function errorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
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
  sortOrder?: number;
}) {
  try {
    const context = await requirePermission("canManageUsers");

    if (!input.title || input.title.trim().length === 0) {
      return { success: false, error: "Title is required" };
    }

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
      sortOrder: input.sortOrder ?? 0,
    });

    revalidatePath("/dashboard/organisasjonskart");
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

    const patch: Record<string, unknown> = {};
    if (input.title !== undefined) patch.title = input.title.trim();
    if (input.name !== undefined) patch.name = input.name?.trim() || null;
    if (input.department !== undefined) patch.department = input.department?.trim() || null;
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

    revalidatePath("/dashboard/organisasjonskart");
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

    revalidatePath("/dashboard/organisasjonskart");
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: errorMessage(error, "Could not delete the organisation chart role") };
  }
}
