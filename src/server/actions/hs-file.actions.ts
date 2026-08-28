"use server";

import { getRequiredTenantContext } from "@/lib/tenant-context";
import { requireTenantModule } from "@/lib/require-tenant-module";
import { getAdminDb } from "@/lib/supabase/admin";

const HS_FILE_CATEGORIES = [
  "AS_BUILT_DRAWINGS",
  "DESIGN_CRITERIA",
  "HAZARDOUS_MATERIALS",
  "MAINTENANCE_PROCEDURES",
  "SERVICES_INFORMATION",
  "STRUCTURAL_INFORMATION",
  "EQUIPMENT_MANUALS",
  "EMERGENCY_PROCEDURES",
  "CLEANING_PROCEDURES",
  "OTHER",
] as const;

type HsFileCategory = (typeof HS_FILE_CATEGORIES)[number];

function isValidCategory(value: string): value is HsFileCategory {
  return HS_FILE_CATEGORIES.includes(value as HsFileCategory);
}

export async function listHsFileEntries(projectId: string) {
  await requireTenantModule("cdm");
  const { tenantId } = await getRequiredTenantContext();

  const { data: project } = await getAdminDb()
    .from("Project")
    .select("id")
    .eq("id", projectId)
    .eq("tenantId", tenantId)
    .maybeSingle();

  if (!project) {
    throw { code: "PROJECT_NOT_FOUND", message: "Project not found" };
  }

  const { data, error } = await getAdminDb()
    .from("HealthSafetyFileEntry")
    .select("*")
    .eq("projectId", projectId)
    .eq("tenantId", tenantId)
    .order("category", { ascending: true })
    .order("createdAt", { ascending: false });

  if (error) {
    throw { code: "HS_FILE_QUERY_FAILED", message: error.message };
  }

  return data ?? [];
}

export async function createHsFileEntry(input: {
  projectId: string;
  category: string;
  title: string;
  description?: string;
  fileKey?: string;
  fileName?: string;
}) {
  await requireTenantModule("cdm");
  const { tenantId, userId } = await getRequiredTenantContext();

  const { data: project } = await getAdminDb()
    .from("Project")
    .select("id")
    .eq("id", input.projectId)
    .eq("tenantId", tenantId)
    .maybeSingle();

  if (!project) {
    throw { code: "PROJECT_NOT_FOUND", message: "Project not found" };
  }

  if (!input.title.trim()) {
    throw { code: "VALIDATION_ERROR", message: "Title is required" };
  }

  if (!isValidCategory(input.category)) {
    throw { code: "VALIDATION_ERROR", message: "Invalid category" };
  }

  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  const { data, error } = await getAdminDb()
    .from("HealthSafetyFileEntry")
    .insert({
      id,
      tenantId,
      projectId: input.projectId,
      category: input.category,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      fileKey: input.fileKey || null,
      fileName: input.fileName || null,
      addedById: userId,
      createdAt: now,
      updatedAt: now,
    })
    .select()
    .single();

  if (error) {
    throw { code: "HS_FILE_INSERT_FAILED", message: error.message };
  }

  return data;
}

export async function updateHsFileEntry(
  id: string,
  input: {
    category?: string;
    title?: string;
    description?: string;
    fileKey?: string;
    fileName?: string;
  }
) {
  await requireTenantModule("cdm");
  const { tenantId } = await getRequiredTenantContext();

  const { data: existing } = await getAdminDb()
    .from("HealthSafetyFileEntry")
    .select("id")
    .eq("id", id)
    .eq("tenantId", tenantId)
    .maybeSingle();

  if (!existing) {
    throw { code: "HS_FILE_ENTRY_NOT_FOUND", message: "Entry not found" };
  }

  const updates: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  };

  if (input.title !== undefined) {
    if (!input.title.trim()) {
      throw { code: "VALIDATION_ERROR", message: "Title is required" };
    }
    updates.title = input.title.trim();
  }
  if (input.category !== undefined) {
    if (!isValidCategory(input.category)) {
      throw { code: "VALIDATION_ERROR", message: "Invalid category" };
    }
    updates.category = input.category;
  }
  if (input.description !== undefined) {
    updates.description = input.description.trim() || null;
  }
  if (input.fileKey !== undefined) {
    updates.fileKey = input.fileKey || null;
  }
  if (input.fileName !== undefined) {
    updates.fileName = input.fileName || null;
  }

  const { data, error } = await getAdminDb()
    .from("HealthSafetyFileEntry")
    .update(updates)
    .eq("id", id)
    .eq("tenantId", tenantId)
    .select()
    .single();

  if (error) {
    throw { code: "HS_FILE_UPDATE_FAILED", message: error.message };
  }

  return data;
}

export async function deleteHsFileEntry(id: string) {
  await requireTenantModule("cdm");
  const { tenantId } = await getRequiredTenantContext();

  const { data: existing } = await getAdminDb()
    .from("HealthSafetyFileEntry")
    .select("id")
    .eq("id", id)
    .eq("tenantId", tenantId)
    .maybeSingle();

  if (!existing) {
    throw { code: "HS_FILE_ENTRY_NOT_FOUND", message: "Entry not found" };
  }

  const { error } = await getAdminDb()
    .from("HealthSafetyFileEntry")
    .delete()
    .eq("id", id)
    .eq("tenantId", tenantId);

  if (error) {
    throw { code: "HS_FILE_DELETE_FAILED", message: error.message };
  }

  return { deleted: true };
}
