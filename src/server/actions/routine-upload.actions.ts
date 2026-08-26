"use server";

import { revalidatePath } from "next/cache";
import { getAdminDb } from "@/lib/supabase/admin";
import { createId } from "@/lib/ids";
import { getStorage, generateFileKey } from "@/lib/storage";
import { requirePermission, getAuthContext } from "@/lib/server-authorization";
import { validateElectroUploadFile } from "@/lib/electro-upload";

const UPLOAD_TABLE = "ElectroInstruction";

function sanitizeTitle(raw: string | null | undefined): string {
  const t = (raw ?? "").trim();
  if (!t) {
    throw { code: "TITLE_REQUIRED", message: "A title is required." };
  }
  if (t.length > 200) {
    throw { code: "TITLE_TOO_LONG", message: "Title is too long (max 200 characters)." };
  }
  return t;
}

function sanitizeOptionalText(raw: string | null | undefined, max: number): string | null {
  const t = (raw ?? "").trim();
  if (!t) return null;
  if (t.length > max) {
    throw { code: "TEXT_TOO_LONG", message: `Text is too long (max ${max} characters).` };
  }
  return t;
}

export async function listRoutineUploadedDocumentsForDashboard() {
  try {
    const context = await requirePermission("canReadRoutines");
    const { data: rows, error } = await getAdminDb()
      .from(UPLOAD_TABLE)
      .select("*")
      .eq("tenantId", context.tenantId)
      .order("sortOrder", { ascending: true })
      .order("createdAt", { ascending: false });

    if (error) {
      throw { code: "UPLOAD_LIST_FAILED", message: error.message };
    }

    return { success: true as const, data: rows ?? [] };
  } catch (error: unknown) {
    const err = error as { message?: string };
    return { success: false as const, error: err.message || "Could not load uploaded procedures." };
  }
}

export async function listRoutineUploadedDocumentsForEmployee() {
  try {
    const context = await getAuthContext();
    if (!context) {
      return { success: false as const, error: "Not signed in." };
    }
    if (!context.permissions.canReadRoutines) {
      return { success: false as const, error: "Not authorised." };
    }
    const { data: rows, error } = await getAdminDb()
      .from(UPLOAD_TABLE)
      .select("id, title, description, documentType, fileKey, mime, originalFileName, createdAt")
      .eq("tenantId", context.tenantId)
      .order("sortOrder", { ascending: true })
      .order("createdAt", { ascending: false });

    if (error) {
      throw { code: "UPLOAD_LIST_FAILED", message: error.message };
    }
    return { success: true as const, data: rows ?? [] };
  } catch (error: unknown) {
    const err = error as { message?: string };
    return { success: false as const, error: err.message || "Could not load uploaded procedures." };
  }
}

export async function createRoutineUploadedDocument(formData: FormData) {
  try {
    const context = await requirePermission("canCreateRoutines");
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return { success: false as const, error: { code: "MISSING_FILE", message: "Choose a file." } };
    }
    const valErr = validateElectroUploadFile(file);
    if (valErr) {
      return { success: false as const, error: valErr };
    }
    const title = sanitizeTitle(String(formData.get("title") ?? ""));
    const description = sanitizeOptionalText(String(formData.get("description") ?? ""), 4000);
    const rawType = String(formData.get("documentType") ?? "RUTINE").trim();
    const documentType = rawType === "INSTRUKS" ? "INSTRUKS" : "RUTINE";

    const { data: last } = await getAdminDb()
      .from(UPLOAD_TABLE)
      .select("sortOrder")
      .eq("tenantId", context.tenantId)
      .order("sortOrder", { ascending: false })
      .limit(1)
      .maybeSingle();
    const sortOrder = (last?.sortOrder ?? 0) + 1;

    const storage = getStorage();
    const fileKey = generateFileKey(context.tenantId, "routines/uploads", file.name);
    await storage.upload(fileKey, file);

    const now = new Date().toISOString();
    const { error } = await getAdminDb().from(UPLOAD_TABLE).insert({
      id: createId(),
      tenantId: context.tenantId,
      title,
      description,
      documentType,
      fileKey,
      mime: file.type || "application/octet-stream",
      originalFileName: file.name,
      sortOrder,
      createdById: context.userId,
      createdAt: now,
      updatedAt: now,
    });

    if (error) {
      throw { code: "CREATE_FAILED", message: error.message };
    }

    revalidatePath("/dashboard/procedures");
    revalidatePath("/ansatt/rutiner");
    return { success: true as const };
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    return {
      success: false as const,
      error: { code: err.code || "CREATE_FAILED", message: err.message || "Could not save the document." },
    };
  }
}

export async function deleteRoutineUploadedDocument(id: string) {
  try {
    const context = await requirePermission("canReadRoutines");
    const { data: row } = await getAdminDb()
      .from(UPLOAD_TABLE)
      .select("*")
      .eq("id", id)
      .eq("tenantId", context.tenantId)
      .maybeSingle();

    if (!row) {
      return { success: false as const, error: { code: "NOT_FOUND", message: "Document not found." } };
    }
    const mayDelete =
      context.permissions.canManageRoutines ||
      (context.permissions.canCreateRoutines && row.createdById === context.userId);
    if (!mayDelete) {
      return {
        success: false as const,
        error: { code: "FORBIDDEN", message: "You do not have permission to delete this document." },
      };
    }
    const { error } = await getAdminDb().from(UPLOAD_TABLE).delete().eq("id", row.id);
    if (error) {
      throw { code: "DELETE_FAILED", message: error.message };
    }
    try {
      const storage = getStorage();
      await storage.delete(row.fileKey);
    } catch {
      // File may already be gone.
    }
    revalidatePath("/dashboard/procedures");
    revalidatePath("/ansatt/rutiner");
    return { success: true as const };
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    return {
      success: false as const,
      error: { code: err.code || "DELETE_FAILED", message: err.message || "Could not delete the document." },
    };
  }
}
