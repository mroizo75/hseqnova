"use server";

import { revalidatePath } from "next/cache";
import { getAdminDb } from "@/lib/supabase/admin";
import { createId } from "@/lib/ids";
import { AuditLog } from "@/lib/audit-log";
import { DocumentSignerRole } from "@prisma/client";
import { requirePermission, requireResourceAccess } from "@/lib/server-authorization";

type ActionError = { code: string; message: string; details?: unknown };

export async function getDocumentSignatures(documentId: string) {
  try {
    await requireResourceAccess("document", documentId);
    const db = getAdminDb();
    const { data: signatures, error } = await db
      .from("DocumentSignature")
      .select("*")
      .eq("documentId", documentId)
      .order("role", { ascending: true });

    if (error) {
      throw { code: "SIGNATURE_LIST_FAILED", message: error.message };
    }

    const rows = signatures ?? [];
    const userIds = [...new Set(rows.map((row: { signedById: string }) => row.signedById))];
    let people: Array<{ id: string; name: string | null; email: string | null }> = [];
    if (userIds.length > 0) {
      const { data: users } = await db.from("User").select("id, name, email").in("id", userIds);
      people = (users ?? []) as Array<{ id: string; name: string | null; email: string | null }>;
    }
    const peopleById = new Map(people.map((person) => [person.id, person]));

    return {
      success: true as const,
      data: rows.map((signature: { signedById: string }) => ({
        ...signature,
        signedBy: peopleById.get(signature.signedById) ?? null,
      })),
    };
  } catch (error: unknown) {
    const err = error as ActionError;
    return { success: false as const, error: err.message || "Could not load signatures." };
  }
}

export async function signDocument(input: {
  documentId: string;
  role: DocumentSignerRole;
  signatureImg: string;
  comment?: string;
}) {
  try {
    const context = await requirePermission("canReadDocuments");
    const db = getAdminDb();
    const { data: document } = await db.from("Document").select("*").eq("id", input.documentId).maybeSingle();

    if (!document) {
      return { success: false as const, error: "Document not found." };
    }

    if (document.tenantId !== context.tenantId) {
      return { success: false as const, error: "Not authorised." };
    }

    if (input.role === "GODKJENT_AV") {
      await requirePermission("canApproveDocuments");
    }

    if (!input.signatureImg || !input.signatureImg.startsWith("data:image/")) {
      return { success: false as const, error: "Invalid signature." };
    }

    const now = new Date().toISOString();
    const { data: existing } = await db
      .from("DocumentSignature")
      .select("id")
      .eq("documentId", input.documentId)
      .eq("signedById", context.userId)
      .eq("role", input.role)
      .maybeSingle();

    let signature;
    if (existing) {
      const { data, error } = await db
        .from("DocumentSignature")
        .update({
          signatureImg: input.signatureImg,
          comment: input.comment ?? null,
          signedAt: now,
        })
        .eq("id", existing.id)
        .select("*")
        .single();
      if (error || !data) {
        throw { code: "SIGNATURE_UPDATE_FAILED", message: error?.message || "Could not update the signature." };
      }
      signature = data;
    } else {
      const { data, error } = await db
        .from("DocumentSignature")
        .insert({
          id: createId(),
          tenantId: context.tenantId,
          documentId: input.documentId,
          signedById: context.userId,
          role: input.role,
          signatureImg: input.signatureImg,
          comment: input.comment ?? null,
          signedAt: now,
        })
        .select("*")
        .single();
      if (error || !data) {
        throw { code: "SIGNATURE_CREATE_FAILED", message: error?.message || "Could not save the signature." };
      }
      signature = data;
    }

    const { data: signer } = await db
      .from("User")
      .select("id, name, email")
      .eq("id", context.userId)
      .maybeSingle();

    await AuditLog.log(context.tenantId, context.userId, "DOCUMENT_SIGNED", "Document", input.documentId, {
      role: input.role,
      documentTitle: document.title,
    });

    revalidatePath(`/dashboard/documents/${input.documentId}`);
    return {
      success: true as const,
      data: { ...signature, signedBy: signer ?? null },
    };
  } catch (error: unknown) {
    const err = error as ActionError;
    return { success: false as const, error: err.message || "Could not sign the document." };
  }
}

export async function removeDocumentSignature(signatureId: string) {
  try {
    const context = await requirePermission("canApproveDocuments");
    const db = getAdminDb();
    const { data: signature } = await db
      .from("DocumentSignature")
      .select("*")
      .eq("id", signatureId)
      .maybeSingle();

    if (!signature) {
      return { success: false as const, error: "Signature not found." };
    }

    if (signature.tenantId !== context.tenantId) {
      return { success: false as const, error: "Not authorised." };
    }

    const { error } = await db.from("DocumentSignature").delete().eq("id", signatureId);
    if (error) {
      throw { code: "SIGNATURE_DELETE_FAILED", message: error.message };
    }

    revalidatePath(`/dashboard/documents/${signature.documentId}`);
    return { success: true as const };
  } catch (error: unknown) {
    const err = error as ActionError;
    return { success: false as const, error: err.message || "Could not remove the signature." };
  }
}
