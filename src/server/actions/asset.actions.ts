"use server";

import { revalidatePath } from "next/cache";
import { getRequiredTenantContext } from "@/lib/tenant-context";
import { getAdminDb } from "@/lib/supabase/admin";
import { createId } from "@/lib/ids";

function errorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

function nowIso(): string {
  return new Date().toISOString();
}

export async function listAssets() {
  try {
    const { tenantId } = await getRequiredTenantContext();
    const { data, error } = await getAdminDb()
      .from("Asset")
      .select("*")
      .eq("tenantId", tenantId)
      .order("createdAt", { ascending: false });
    if (error) {
      throw { code: "ASSET_LIST_FAILED", message: error.message };
    }
    return { success: true, data: data ?? [] };
  } catch (error: unknown) {
    return { success: false, error: errorMessage(error, "Could not load the asset register") };
  }
}

export async function getAsset(id: string) {
  try {
    const { tenantId } = await getRequiredTenantContext();
    const { data, error } = await getAdminDb()
      .from("Asset")
      .select("*")
      .eq("id", id)
      .eq("tenantId", tenantId)
      .maybeSingle();
    if (error) {
      throw { code: "ASSET_LOOKUP_FAILED", message: error.message };
    }
    if (!data) {
      return { success: false, error: "Asset not found" };
    }
    return { success: true, data };
  } catch (error: unknown) {
    return { success: false, error: errorMessage(error, "Could not load the asset") };
  }
}

export async function createAsset(input: unknown) {
  try {
    const { userId, tenantId } = await getRequiredTenantContext();
    const raw = (input ?? {}) as Record<string, unknown>;
    const name = typeof raw.name === "string" ? raw.name.trim() : "";
    if (!name) {
      return { success: false, error: "Asset name is required" };
    }
    const category = typeof raw.category === "string" ? raw.category : "";
    if (!category) {
      return { success: false, error: "Category is required" };
    }

    const now = nowIso();
    const { data, error } = await getAdminDb()
      .from("Asset")
      .insert({
        id: createId(),
        tenantId,
        name,
        assetTag: typeof raw.assetTag === "string" ? raw.assetTag.trim() || null : null,
        category,
        manufacturer: typeof raw.manufacturer === "string" ? raw.manufacturer.trim() || null : null,
        model: typeof raw.model === "string" ? raw.model.trim() || null : null,
        serialNumber: typeof raw.serialNumber === "string" ? raw.serialNumber.trim() || null : null,
        location: typeof raw.location === "string" ? raw.location.trim() || null : null,
        department: typeof raw.department === "string" ? raw.department.trim() || null : null,
        purchaseDate: raw.purchaseDate ? new Date(String(raw.purchaseDate)).toISOString() : null,
        commissionDate: raw.commissionDate ? new Date(String(raw.commissionDate)).toISOString() : null,
        status: typeof raw.status === "string" ? raw.status : "ACTIVE",
        notes: typeof raw.notes === "string" ? raw.notes.trim() || null : null,
        inspectionFrequency: typeof raw.inspectionFrequency === "string" ? raw.inspectionFrequency : "ANNUAL",
        nextInspectionDue: raw.nextInspectionDue ? new Date(String(raw.nextInspectionDue)).toISOString() : null,
        inspectionProvider: typeof raw.inspectionProvider === "string" ? raw.inspectionProvider.trim() || null : null,
        safeWorkingLoad: typeof raw.safeWorkingLoad === "string" ? raw.safeWorkingLoad.trim() || null : null,
        thoroughExamDue: raw.thoroughExamDue ? new Date(String(raw.thoroughExamDue)).toISOString() : null,
        insuranceCertKey: typeof raw.insuranceCertKey === "string" ? raw.insuranceCertKey.trim() || null : null,
        certificationExpiry: raw.certificationExpiry ? new Date(String(raw.certificationExpiry)).toISOString() : null,
        createdById: userId,
        createdAt: now,
        updatedAt: now,
      })
      .select("*")
      .single();

    if (error || !data) {
      throw { code: "ASSET_CREATE_FAILED", message: error?.message || "Could not create the asset" };
    }

    revalidatePath("/dashboard/assets");
    return { success: true, data };
  } catch (error: unknown) {
    return { success: false, error: errorMessage(error, "Could not create the asset") };
  }
}

export async function updateAsset(id: string, input: unknown) {
  try {
    const { tenantId } = await getRequiredTenantContext();
    const raw = (input ?? {}) as Record<string, unknown>;

    const patch: Record<string, unknown> = { updatedAt: nowIso() };
    const stringFields = [
      "name", "assetTag", "category", "manufacturer", "model", "serialNumber",
      "location", "department", "status", "notes", "inspectionFrequency",
      "inspectionProvider", "safeWorkingLoad", "insuranceCertKey",
    ];
    for (const key of stringFields) {
      if (key in raw) {
        patch[key] = typeof raw[key] === "string" ? raw[key] : null;
      }
    }
    const dateFields = [
      "purchaseDate", "commissionDate", "decommissionDate",
      "lastInspectionDate", "nextInspectionDue", "thoroughExamDue",
      "lastThoroughExam", "certificationExpiry",
    ];
    for (const key of dateFields) {
      if (key in raw) {
        patch[key] = raw[key] ? new Date(String(raw[key])).toISOString() : null;
      }
    }

    const { data, error } = await getAdminDb()
      .from("Asset")
      .update(patch)
      .eq("id", id)
      .eq("tenantId", tenantId)
      .select("*")
      .single();

    if (error || !data) {
      throw { code: "ASSET_UPDATE_FAILED", message: error?.message || "Could not update the asset" };
    }

    revalidatePath("/dashboard/assets");
    revalidatePath(`/dashboard/assets/${id}`);
    return { success: true, data };
  } catch (error: unknown) {
    return { success: false, error: errorMessage(error, "Could not update the asset") };
  }
}

export async function deleteAsset(id: string) {
  try {
    const { tenantId } = await getRequiredTenantContext();
    const { error } = await getAdminDb()
      .from("Asset")
      .delete()
      .eq("id", id)
      .eq("tenantId", tenantId);
    if (error) {
      throw { code: "ASSET_DELETE_FAILED", message: error.message };
    }

    revalidatePath("/dashboard/assets");
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: errorMessage(error, "Could not delete the asset") };
  }
}

export async function listAssetInspections(assetId: string) {
  try {
    const { tenantId } = await getRequiredTenantContext();
    const { data, error } = await getAdminDb()
      .from("AssetInspection")
      .select("*")
      .eq("tenantId", tenantId)
      .eq("assetId", assetId)
      .order("inspectionDate", { ascending: false });
    if (error) {
      throw { code: "INSPECTION_LIST_FAILED", message: error.message };
    }
    return { success: true, data: data ?? [] };
  } catch (error: unknown) {
    return { success: false, error: errorMessage(error, "Could not load inspections") };
  }
}

export async function createAssetInspection(input: unknown) {
  try {
    const { tenantId } = await getRequiredTenantContext();
    const raw = (input ?? {}) as Record<string, unknown>;
    const assetId = typeof raw.assetId === "string" ? raw.assetId : "";
    if (!assetId) {
      return { success: false, error: "Asset ID is required" };
    }
    const inspectedBy = typeof raw.inspectedBy === "string" ? raw.inspectedBy.trim() : "";
    if (!inspectedBy) {
      return { success: false, error: "Inspector name is required" };
    }

    const now = nowIso();
    const inspectionDate = raw.inspectionDate
      ? new Date(String(raw.inspectionDate)).toISOString()
      : now;

    const { data, error } = await getAdminDb()
      .from("AssetInspection")
      .insert({
        id: createId(),
        tenantId,
        assetId,
        inspectionDate,
        inspectedBy,
        inspectionType: typeof raw.inspectionType === "string" ? raw.inspectionType : "ROUTINE",
        result: typeof raw.result === "string" ? raw.result : "PASS",
        findings: typeof raw.findings === "string" ? raw.findings.trim() || null : null,
        actionRequired: typeof raw.actionRequired === "string" ? raw.actionRequired.trim() || null : null,
        nextDueDate: raw.nextDueDate ? new Date(String(raw.nextDueDate)).toISOString() : null,
        certificateKey: typeof raw.certificateKey === "string" ? raw.certificateKey.trim() || null : null,
        createdAt: now,
        updatedAt: now,
      })
      .select("*")
      .single();

    if (error || !data) {
      throw { code: "INSPECTION_CREATE_FAILED", message: error?.message || "Could not record the inspection" };
    }

    await getAdminDb()
      .from("Asset")
      .update({
        lastInspectionDate: inspectionDate,
        nextInspectionDue: data.nextDueDate,
        updatedAt: now,
      })
      .eq("id", assetId)
      .eq("tenantId", tenantId);

    revalidatePath(`/dashboard/assets/${assetId}`);
    revalidatePath("/dashboard/assets");
    return { success: true, data };
  } catch (error: unknown) {
    return { success: false, error: errorMessage(error, "Could not record the inspection") };
  }
}

export async function listAssetMaintenance(assetId: string) {
  try {
    const { tenantId } = await getRequiredTenantContext();
    const { data, error } = await getAdminDb()
      .from("AssetMaintenance")
      .select("*")
      .eq("tenantId", tenantId)
      .eq("assetId", assetId)
      .order("maintenanceDate", { ascending: false });
    if (error) {
      throw { code: "MAINTENANCE_LIST_FAILED", message: error.message };
    }
    return { success: true, data: data ?? [] };
  } catch (error: unknown) {
    return { success: false, error: errorMessage(error, "Could not load maintenance records") };
  }
}

export async function createAssetMaintenance(input: unknown) {
  try {
    const { tenantId } = await getRequiredTenantContext();
    const raw = (input ?? {}) as Record<string, unknown>;
    const assetId = typeof raw.assetId === "string" ? raw.assetId : "";
    if (!assetId) {
      return { success: false, error: "Asset ID is required" };
    }
    const performedBy = typeof raw.performedBy === "string" ? raw.performedBy.trim() : "";
    if (!performedBy) {
      return { success: false, error: "Performed by is required" };
    }
    const description = typeof raw.description === "string" ? raw.description.trim() : "";
    if (!description) {
      return { success: false, error: "Description is required" };
    }

    const now = nowIso();
    const { data, error } = await getAdminDb()
      .from("AssetMaintenance")
      .insert({
        id: createId(),
        tenantId,
        assetId,
        maintenanceDate: raw.maintenanceDate
          ? new Date(String(raw.maintenanceDate)).toISOString()
          : now,
        performedBy,
        description,
        cost: raw.cost ? Number(raw.cost) : null,
        nextDueDate: raw.nextDueDate ? new Date(String(raw.nextDueDate)).toISOString() : null,
        createdAt: now,
        updatedAt: now,
      })
      .select("*")
      .single();

    if (error || !data) {
      throw { code: "MAINTENANCE_CREATE_FAILED", message: error?.message || "Could not record maintenance" };
    }

    revalidatePath(`/dashboard/assets/${assetId}`);
    revalidatePath("/dashboard/assets");
    return { success: true, data };
  } catch (error: unknown) {
    return { success: false, error: errorMessage(error, "Could not record maintenance") };
  }
}
