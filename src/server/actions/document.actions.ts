"use server";

import { revalidatePath } from "next/cache";
import { getAdminDb } from "@/lib/supabase/admin";
import { createId } from "@/lib/ids";
import { AuditLog } from "@/lib/audit-log";
import {
  createDocumentSchema,
  updateDocumentSchema,
  approveDocumentSchema,
} from "@/features/documents/schemas/document.schema";
import { getStorage, generateFileKey } from "@/lib/storage";
import { DocStatus } from "@prisma/client";
import { requirePermission, requireResourceAccess } from "@/lib/server-authorization";
import { calculateNextReviewDate, parseDateInput } from "@/lib/document-utils";
import { convertDocumentToPDF } from "@/lib/adobe-pdf";

type ActionError = { code: string; message: string; details?: unknown };

function fail(code: string, message: string, details?: unknown): ActionError {
  return { code, message, details };
}

function toIso(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

const sanitizeText = (value?: string | null) => {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const parseIntInput = (value?: string | null) => {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

async function assertTenantUser(tenantId: string, userId: string) {
  const { data: member } = await getAdminDb()
    .from("UserTenant")
    .select("id")
    .eq("tenantId", tenantId)
    .eq("userId", userId)
    .maybeSingle();

  if (!member) {
    throw fail("INVALID_OWNER", "That person is not a member of this organisation.");
  }
}

async function resolveTemplate(tenantId: string, templateId: string) {
  const { data: template } = await getAdminDb()
    .from("DocumentTemplate")
    .select("*")
    .eq("id", templateId)
    .maybeSingle();

  if (!template || (template.tenantId !== tenantId && !template.isGlobal)) {
    throw fail("TEMPLATE_NOT_FOUND", "The selected template was not found.");
  }

  return template;
}

export async function getDocuments(tenantId: string) {
  try {
    await requirePermission("canReadDocuments");

    const { data: documents, error } = await getAdminDb()
      .from("Document")
      .select("*")
      .eq("tenantId", tenantId)
      .order("createdAt", { ascending: false });

    if (error) {
      throw fail("DOCUMENT_LIST_FAILED", error.message);
    }

    const ids = ((documents ?? []) as Array<{ id: string }>).map((row) => row.id);
    let versions: unknown[] = [];
    if (ids.length > 0) {
      const { data: versionRows } = await getAdminDb()
        .from("DocumentVersion")
        .select("*")
        .in("documentId", ids)
        .order("createdAt", { ascending: false });
      versions = versionRows ?? [];
    }

    const versionsByDoc = new Map<string, unknown[]>();
    for (const version of versions as Array<{ documentId: string }>) {
      const list = versionsByDoc.get(version.documentId) ?? [];
      if (list.length < 5) {
        list.push(version);
        versionsByDoc.set(version.documentId, list);
      }
    }

    return {
      success: true as const,
      data: ((documents ?? []) as Array<{ id: string }>).map((doc) => ({
        ...doc,
        versions: versionsByDoc.get(doc.id) ?? [],
      })),
    };
  } catch (error: unknown) {
    const err = error as ActionError;
    return { success: false as const, error: err.message || "Could not load documents." };
  }
}

export async function getDocument(id: string) {
  try {
    await requireResourceAccess("document", id);

    const db = getAdminDb();
    const { data: document, error } = await db.from("Document").select("*").eq("id", id).maybeSingle();

    if (error) {
      throw fail("DOCUMENT_LOAD_FAILED", error.message);
    }
    if (!document) {
      return { success: false as const, error: "Document not found." };
    }

    const [{ data: tenant }, { data: versions }] = await Promise.all([
      db.from("Tenant").select("name").eq("id", document.tenantId).maybeSingle(),
      db.from("DocumentVersion").select("*").eq("documentId", id).order("createdAt", { ascending: false }),
    ]);

    return {
      success: true as const,
      data: {
        ...document,
        tenant: tenant ? { name: tenant.name } : null,
        versions: versions ?? [],
      },
    };
  } catch (error: unknown) {
    const err = error as ActionError;
    return { success: false as const, error: err.message || "Could not load the document." };
  }
}

export async function createDocument(formData: FormData) {
  try {
    const context = await requirePermission("canCreateDocuments");

    const fileEntry = formData.get("file");
    const changeComment = formData.get("changeComment") as string | null;
    const visibleToRolesStr = formData.get("visibleToRoles") as string | null;
    const ownerIdRaw = (formData.get("ownerId") as string | null) || null;
    const templateIdRaw = (formData.get("templateId") as string | null) || null;
    const reviewIntervalRaw = formData.get("reviewIntervalMonths") as string | null;
    const reviewIntervalValue = parseIntInput(reviewIntervalRaw);
    const reviewIntervalProvided = typeof reviewIntervalValue === "number" && !Number.isNaN(reviewIntervalValue);
    const effectiveFromValue = parseDateInput(formData.get("effectiveFrom") as string | null);
    const effectiveToValue = parseDateInput(formData.get("effectiveTo") as string | null);
    const planSummary = sanitizeText(formData.get("planSummary") as string | null);
    const doSummary = sanitizeText(formData.get("doSummary") as string | null);
    const checkSummary = sanitizeText(formData.get("checkSummary") as string | null);
    const actSummary = sanitizeText(formData.get("actSummary") as string | null);
    const data = {
      tenantId: formData.get("tenantId") as string,
      kind: formData.get("kind") as string,
      title: formData.get("title") as string,
      version: (formData.get("version") as string) || "v1.0",
    };

    if (!fileEntry || typeof fileEntry === "string") {
      return { success: false as const, error: "A file is required." };
    }

    const file = fileEntry as Blob & { name: string };
    const validated = createDocumentSchema.parse({
      ...data,
      ownerId: ownerIdRaw,
      templateId: templateIdRaw,
      reviewIntervalMonths: reviewIntervalValue,
      effectiveFrom: effectiveFromValue,
      effectiveTo: effectiveToValue,
      planSummary,
      doSummary,
      checkSummary,
      actSummary,
      file,
    });

    const baseSlug = validated.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const db = getAdminDb();
    const { data: existingBySlug } = await db
      .from("Document")
      .select("id")
      .eq("tenantId", validated.tenantId)
      .eq("slug", baseSlug)
      .maybeSingle();

    if (existingBySlug) {
      return {
        success: false as const,
        error: `A document named "${validated.title}" already exists. Upload a new version instead.`,
        existingDocumentId: existingBySlug.id,
      };
    }

    const storage = getStorage();
    const fileKey = generateFileKey(validated.tenantId, "documents", file.name);
    await storage.upload(fileKey, file);

    let visibleToRoles: string[] | null = null;
    if (visibleToRolesStr) {
      try {
        visibleToRoles = JSON.parse(visibleToRolesStr);
      } catch {
        visibleToRoles = null;
      }
    }

    if (validated.ownerId) {
      await assertTenantUser(validated.tenantId, validated.ownerId);
    }

    let template: Awaited<ReturnType<typeof resolveTemplate>> | null = null;
    if (validated.templateId) {
      template = await resolveTemplate(validated.tenantId, validated.templateId);
    }

    const resolvedReviewInterval = reviewIntervalProvided
      ? validated.reviewIntervalMonths
      : template?.defaultReviewIntervalMonths || validated.reviewIntervalMonths;

    const resolvedEffectiveFrom = validated.effectiveFrom ?? new Date();
    const nextReviewDate = calculateNextReviewDate(resolvedEffectiveFrom, resolvedReviewInterval);
    const now = new Date().toISOString();
    const documentId = createId();
    const mime = file.type || "application/octet-stream";

    const { data: document, error: insertError } = await db
      .from("Document")
      .insert({
        id: documentId,
        tenantId: validated.tenantId,
        kind: validated.kind,
        title: validated.title,
        slug: baseSlug,
        version: validated.version,
        status: DocStatus.DRAFT,
        fileKey,
        mime,
        updatedBy: context.userEmail,
        ownerId: validated.ownerId,
        templateId: validated.templateId,
        reviewIntervalMonths: resolvedReviewInterval,
        effectiveFrom: toIso(resolvedEffectiveFrom),
        effectiveTo: toIso(validated.effectiveTo),
        planSummary: validated.planSummary ?? null,
        doSummary: validated.doSummary ?? null,
        checkSummary: validated.checkSummary ?? null,
        actSummary: validated.actSummary ?? null,
        nextReviewDate: toIso(nextReviewDate),
        visibleToRoles: visibleToRoles || null,
        createdAt: now,
        updatedAt: now,
      })
      .select("*")
      .single();

    if (insertError || !document) {
      throw fail("DOCUMENT_CREATE_FAILED", insertError?.message || "Could not create the document.");
    }

    const { error: versionError } = await db.from("DocumentVersion").insert({
      id: createId(),
      tenantId: validated.tenantId,
      documentId,
      version: validated.version,
      fileKey,
      mime,
      uploadedBy: context.userEmail,
      changeComment: changeComment || "Initial version",
    });

    if (versionError) {
      throw fail("DOCUMENT_VERSION_CREATE_FAILED", versionError.message);
    }

    await AuditLog.log(validated.tenantId, context.userId, "DOCUMENT_CREATED", "Document", document.id, {
      title: validated.title,
      version: validated.version,
      kind: validated.kind,
      templateId: validated.templateId,
      ownerId: validated.ownerId,
      reviewIntervalMonths: resolvedReviewInterval,
    });

    revalidatePath(`/dashboard/documents`);
    return { success: true as const, data: document };
  } catch (error: unknown) {
    const err = error as ActionError;
    return { success: false as const, error: err.message || "Could not create the document." };
  }
}

export async function uploadNewVersion(formData: FormData) {
  try {
    const context = await requirePermission("canCreateDocuments");

    const documentId = formData.get("documentId") as string;
    const fileEntry = formData.get("file");
    const version = formData.get("version") as string;
    const changeComment = formData.get("changeComment") as string;

    if (!fileEntry || typeof fileEntry === "string" || !version || !changeComment) {
      return { success: false as const, error: "File, version and change comment are required." };
    }

    const file = fileEntry as Blob & { name: string };
    const db = getAdminDb();
    const { data: document } = await db.from("Document").select("*").eq("id", documentId).maybeSingle();

    if (!document) {
      return { success: false as const, error: "Document not found." };
    }

    const { data: existingVersions } = await db
      .from("DocumentVersion")
      .select("version")
      .eq("documentId", document.id);

    if ((existingVersions ?? []).some((row: { version: string }) => row.version === version)) {
      return {
        success: false as const,
        error: `Version ${version} already exists. Use a new version number.`,
      };
    }

    const storage = getStorage();
    const fileKey = generateFileKey(document.tenantId, "documents", file.name);
    await storage.upload(fileKey, file);

    const now = new Date().toISOString();
    await db
      .from("DocumentVersion")
      .update({ supersededAt: now })
      .eq("documentId", document.id)
      .is("supersededAt", null);

    const mime = file.type || "application/octet-stream";
    const { error: versionError } = await db.from("DocumentVersion").insert({
      id: createId(),
      tenantId: document.tenantId,
      documentId: document.id,
      version,
      fileKey,
      mime,
      uploadedBy: context.userEmail,
      changeComment,
    });

    if (versionError) {
      throw fail("DOCUMENT_VERSION_CREATE_FAILED", versionError.message);
    }

    const { data: updatedDocument, error: updateError } = await db
      .from("Document")
      .update({
        version,
        fileKey,
        mime,
        status: DocStatus.DRAFT,
        approvedBy: null,
        approvedAt: null,
        updatedBy: context.userEmail,
        updatedAt: now,
      })
      .eq("id", documentId)
      .select("*")
      .single();

    if (updateError || !updatedDocument) {
      throw fail("DOCUMENT_UPDATE_FAILED", updateError?.message || "Could not update the document.");
    }

    await AuditLog.log(document.tenantId, context.userId, "DOCUMENT_VERSION_UPLOADED", "Document", document.id, {
      version,
      changeComment,
      previousVersion: document.version,
    });

    const viewCacheKey = `${document.tenantId}/documents/pdf/${document.id}.pdf`;
    try {
      await storage.delete(viewCacheKey);
    } catch {
      // Cache may not exist yet.
    }

    revalidatePath(`/dashboard/documents`);
    revalidatePath(`/dashboard/documents/${documentId}`);
    return { success: true as const, data: updatedDocument };
  } catch (error: unknown) {
    const err = error as ActionError;
    return { success: false as const, error: err.message || "Could not upload the new version." };
  }
}

export async function updateDocument(input: Record<string, unknown>) {
  try {
    const context = await requirePermission("canCreateDocuments");

    const hasField = (key: string) => Object.prototype.hasOwnProperty.call(input, key);
    const reviewIntervalProvided = hasField("reviewIntervalMonths");
    const payload = {
      ...input,
      reviewIntervalMonths: reviewIntervalProvided
        ? parseIntInput(input.reviewIntervalMonths as string | null)
        : undefined,
      effectiveFrom: hasField("effectiveFrom")
        ? parseDateInput(input.effectiveFrom as string | null)
        : undefined,
      effectiveTo: hasField("effectiveTo") ? parseDateInput(input.effectiveTo as string | null) : undefined,
      planSummary: hasField("planSummary") ? sanitizeText(input.planSummary as string | null) : undefined,
      doSummary: hasField("doSummary") ? sanitizeText(input.doSummary as string | null) : undefined,
      checkSummary: hasField("checkSummary") ? sanitizeText(input.checkSummary as string | null) : undefined,
      actSummary: hasField("actSummary") ? sanitizeText(input.actSummary as string | null) : undefined,
    };

    const validated = updateDocumentSchema.parse(payload);
    const db = getAdminDb();
    const { data: document } = await db.from("Document").select("*").eq("id", validated.id).maybeSingle();

    if (!document) {
      return { success: false as const, error: "Document not found." };
    }

    if (validated.ownerId) {
      await assertTenantUser(document.tenantId, validated.ownerId);
    }

    let template: Awaited<ReturnType<typeof resolveTemplate>> | null = null;
    const templateFieldProvided = hasField("templateId");
    if (validated.templateId) {
      template = await resolveTemplate(document.tenantId, validated.templateId);
    }

    const resolvedReviewInterval = (() => {
      if (reviewIntervalProvided && validated.reviewIntervalMonths) {
        return validated.reviewIntervalMonths;
      }
      if (templateFieldProvided && template) {
        return template.defaultReviewIntervalMonths as number;
      }
      return document.reviewIntervalMonths ?? 12;
    })();

    const resolvedEffectiveFrom = hasField("effectiveFrom")
      ? (validated.effectiveFrom ?? null)
      : document.effectiveFrom;

    const effectiveFromForCalc = resolvedEffectiveFrom ?? document.effectiveFrom ?? new Date();
    const nextReviewDate = calculateNextReviewDate(
      new Date(effectiveFromForCalc),
      resolvedReviewInterval
    );

    const updateData: Record<string, unknown> = {
      updatedBy: context.userEmail,
      updatedAt: new Date().toISOString(),
    };

    if (validated.title) updateData.title = validated.title;
    if (validated.kind) updateData.kind = validated.kind;
    if (validated.version) updateData.version = validated.version;
    if (hasField("visibleToRoles")) {
      updateData.visibleToRoles =
        validated.visibleToRoles && validated.visibleToRoles.length > 0 ? validated.visibleToRoles : null;
    }
    if (hasField("ownerId")) {
      updateData.ownerId = validated.ownerId ?? null;
    }
    if (templateFieldProvided) {
      updateData.templateId = validated.templateId ?? null;
    }
    if (hasField("planSummary")) updateData.planSummary = validated.planSummary ?? null;
    if (hasField("doSummary")) updateData.doSummary = validated.doSummary ?? null;
    if (hasField("checkSummary")) updateData.checkSummary = validated.checkSummary ?? null;
    if (hasField("actSummary")) updateData.actSummary = validated.actSummary ?? null;
    if (hasField("effectiveFrom")) updateData.effectiveFrom = toIso(resolvedEffectiveFrom);
    if (hasField("effectiveTo")) updateData.effectiveTo = toIso(validated.effectiveTo ?? null);

    if (reviewIntervalProvided || templateFieldProvided || hasField("effectiveFrom")) {
      updateData.reviewIntervalMonths = resolvedReviewInterval;
      updateData.nextReviewDate = toIso(nextReviewDate);
    }

    const { data: updated, error } = await db
      .from("Document")
      .update(updateData)
      .eq("id", validated.id)
      .select("*")
      .single();

    if (error || !updated) {
      throw fail("DOCUMENT_UPDATE_FAILED", error?.message || "Could not update the document.");
    }

    await AuditLog.log(updated.tenantId, context.userId, "DOCUMENT_UPDATED", "Document", updated.id, {
      ...validated,
      reviewIntervalMonths: resolvedReviewInterval,
    });

    revalidatePath(`/dashboard/documents`);
    revalidatePath(`/dashboard/documents/${validated.id}`);
    return { success: true as const, data: updated };
  } catch (error: unknown) {
    const err = error as ActionError;
    return { success: false as const, error: err.message || "Could not update the document." };
  }
}

export async function approveDocument(input: unknown) {
  try {
    const context = await requirePermission("canApproveDocuments");
    const validated = approveDocumentSchema.parse(input);
    const db = getAdminDb();
    const { data: document } = await db.from("Document").select("*").eq("id", validated.id).maybeSingle();

    if (!document) {
      return { success: false as const, error: "Document not found." };
    }

    const reviewIntervalMonths = document.reviewIntervalMonths ?? 12;
    const effectiveFrom = document.effectiveFrom ?? new Date();
    const nextReviewDate = calculateNextReviewDate(new Date(effectiveFrom), reviewIntervalMonths);
    const now = new Date().toISOString();

    const { data: approved, error } = await db
      .from("Document")
      .update({
        status: DocStatus.APPROVED,
        approvedBy: validated.approvedBy,
        approvedAt: now,
        nextReviewDate: toIso(nextReviewDate),
        updatedAt: now,
      })
      .eq("id", validated.id)
      .select("*")
      .single();

    if (error || !approved) {
      throw fail("DOCUMENT_APPROVE_FAILED", error?.message || "Could not approve the document.");
    }

    const { data: latestVersion } = await db
      .from("DocumentVersion")
      .select("id")
      .eq("documentId", document.id)
      .order("createdAt", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestVersion) {
      await db
        .from("DocumentVersion")
        .update({
          approvedBy: validated.approvedBy,
          approvedAt: now,
        })
        .eq("id", latestVersion.id);
    }

    await AuditLog.log(document.tenantId, context.userId, "DOCUMENT_APPROVED", "Document", document.id, {
      version: document.version,
      approvedBy: validated.approvedBy,
    });

    revalidatePath(`/dashboard/documents`);
    revalidatePath(`/dashboard/documents/${validated.id}`);
    return { success: true as const, data: approved };
  } catch (error: unknown) {
    const err = error as ActionError;
    return { success: false as const, error: err.message || "Could not approve the document." };
  }
}

export async function deleteDocument(id: string) {
  try {
    const context = await requirePermission("canDeleteDocuments");
    const db = getAdminDb();
    const { data: document } = await db.from("Document").select("*").eq("id", id).maybeSingle();

    if (!document) {
      return { success: false as const, error: "Document not found." };
    }

    if (document.kind === "LAW") {
      return { success: false as const, error: "Legislation documents cannot be deleted." };
    }

    const { data: versions } = await db.from("DocumentVersion").select("fileKey").eq("documentId", id);
    const storage = getStorage();

    for (const version of versions ?? []) {
      try {
        await storage.delete(version.fileKey);
      } catch {
        // Continue so the controlled-document record can still be removed.
      }
    }

    try {
      await storage.delete(document.fileKey);
    } catch {
      // File may already be gone.
    }

    const viewCacheKey = `${document.tenantId}/documents/pdf/${document.id}.pdf`;
    try {
      await storage.delete(viewCacheKey);
    } catch {
      // Cache may not exist.
    }

    await AuditLog.log(document.tenantId, context.userId, "DOCUMENT_DELETED", "Document", document.id, {
      title: document.title,
      version: document.version,
    });

    const { error } = await db.from("Document").delete().eq("id", id);
    if (error) {
      throw fail("DOCUMENT_DELETE_FAILED", error.message);
    }

    revalidatePath(`/dashboard/documents`);
    return { success: true as const, data: null };
  } catch (error: unknown) {
    const err = error as ActionError;
    return { success: false as const, error: err.message || "Could not delete the document." };
  }
}

export async function getDocumentDownloadUrl(id: string) {
  try {
    await requireResourceAccess("document", id);

    const { data: document } = await getAdminDb().from("Document").select("fileKey").eq("id", id).maybeSingle();

    if (!document) {
      return { success: false as const, error: "Document not found." };
    }

    const storage = getStorage();
    const url = await storage.getUrl(document.fileKey, 3600);

    return { success: true as const, data: { url } };
  } catch (error: unknown) {
    const err = error as ActionError;
    return { success: false as const, error: err.message || "Could not generate a download link." };
  }
}

export async function convertDocumentToPDFAction(id: string) {
  try {
    const context = await requireResourceAccess("document", id);
    const { data: document } = await getAdminDb().from("Document").select("*").eq("id", id).maybeSingle();

    if (!document) {
      return { success: false as const, error: "Document not found." };
    }

    const isWordDocument =
      document.mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      document.mime === "application/msword";

    if (!isWordDocument) {
      return { success: false as const, error: "Only Word documents can be converted to PDF." };
    }

    const storage = getStorage();
    const documentBuffer = await storage.get(document.fileKey);

    if (!documentBuffer) {
      return { success: false as const, error: "Could not load the document file." };
    }

    const pdfBuffer = await convertDocumentToPDF(documentBuffer, document.mime);
    const pdfKey = generateFileKey(context.tenantId, "documents/pdf", `${document.title}-converted.pdf`);
    await storage.upload(pdfKey, pdfBuffer, { "Content-Type": "application/pdf" });
    const pdfUrl = await storage.getUrl(pdfKey, 3600);

    return { success: true as const, data: { url: pdfUrl, filename: `${document.title}.pdf` } };
  } catch (error: unknown) {
    const err = error as ActionError;
    return { success: false as const, error: err.message || "Could not convert the document to PDF." };
  }
}
