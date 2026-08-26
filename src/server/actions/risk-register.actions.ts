"use server";

import { revalidatePath } from "next/cache";
import { getAdminDb } from "@/lib/supabase/admin";
import { createId } from "@/lib/ids";
import { z } from "zod";
import {
  ControlFrequency,
  RiskAuditRelation,
  RiskControlEffectiveness,
  RiskControlStatus,
  RiskControlType,
  RiskDocumentRelation,
} from "@prisma/client";
import { getActionContext } from "./action-context";

const sanitizeText = (value?: string | null) => {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const parseOptionalDateIso = (value: string | null | undefined) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
};

const baseRevalidate = (riskId: string) => {
  revalidatePath("/dashboard/risks");
  revalidatePath(`/dashboard/risks/${riskId}`);
  revalidatePath("/dashboard/risk-register");
};

async function insertAuditLog(input: {
  tenantId: string;
  userId: string;
  action: string;
  resource: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await getAdminDb().from("AuditLog").insert({
    id: createId(),
    tenantId: input.tenantId,
    userId: input.userId,
    action: input.action,
    resource: input.resource,
    metadata: input.metadata ? JSON.stringify(input.metadata) : null,
  });
}

const controlSchema = z.object({
  riskId: z.string().cuid(),
  title: z.string().min(3),
  description: z.string().max(2000).optional().nullable(),
  controlType: z.nativeEnum(RiskControlType),
  ownerId: z.string().cuid().optional().nullable(),
  frequency: z.nativeEnum(ControlFrequency).optional().nullable(),
  effectiveness: z.nativeEnum(RiskControlEffectiveness).default("NOT_TESTED"),
  status: z.nativeEnum(RiskControlStatus).default("ACTIVE"),
  monitoringMethod: z.string().max(250).optional().nullable(),
  evidenceDocumentId: z.string().cuid().optional().nullable(),
  nextTestDate: z.string().optional().nullable(),
  lastTestedAt: z.string().optional().nullable(),
});

const updateControlSchema = z.object({
  id: z.string().cuid(),
  riskId: z.string().cuid(),
  title: z.string().min(3).optional(),
  description: z.string().max(2000).optional().nullable(),
  controlType: z.nativeEnum(RiskControlType).optional(),
  ownerId: z.string().cuid().optional().nullable(),
  frequency: z.nativeEnum(ControlFrequency).optional().nullable(),
  effectiveness: z.nativeEnum(RiskControlEffectiveness).optional(),
  status: z.nativeEnum(RiskControlStatus).optional(),
  monitoringMethod: z.string().max(250).optional().nullable(),
  evidenceDocumentId: z.string().cuid().optional().nullable(),
  nextTestDate: z.string().optional().nullable(),
  lastTestedAt: z.string().optional().nullable(),
});

const documentLinkSchema = z.object({
  riskId: z.string().cuid(),
  documentId: z.string().cuid(),
  relation: z.nativeEnum(RiskDocumentRelation).default("SUPPORTING"),
  note: z.string().max(500).optional().nullable(),
});

const auditLinkSchema = z.object({
  riskId: z.string().cuid(),
  auditId: z.string().cuid(),
  relation: z.nativeEnum(RiskAuditRelation).default("CONTROL_TEST"),
  summary: z.string().max(500).optional().nullable(),
});

export async function createRiskControl(input: z.infer<typeof controlSchema>) {
  try {
    const { tenantId, user } = await getActionContext();
    const validated = controlSchema.parse(input);
    const now = new Date().toISOString();

    const { data: control, error } = await getAdminDb()
      .from("RiskControl")
      .insert({
        id: createId(),
        tenantId,
        riskId: validated.riskId,
        title: validated.title,
        description: sanitizeText(validated.description),
        controlType: validated.controlType,
        ownerId: validated.ownerId ?? null,
        frequency: validated.frequency ?? null,
        effectiveness: validated.effectiveness,
        status: validated.status,
        monitoringMethod: sanitizeText(validated.monitoringMethod),
        evidenceDocumentId: validated.evidenceDocumentId ?? null,
        nextTestDate: parseOptionalDateIso(validated.nextTestDate),
        lastTestedAt: parseOptionalDateIso(validated.lastTestedAt),
        createdAt: now,
        updatedAt: now,
      })
      .select("*")
      .single();

    if (error || !control) {
      throw { code: "RISK_CONTROL_CREATE_FAILED", message: error?.message || "Could not create control" };
    }

    await insertAuditLog({
      tenantId,
      userId: user.id,
      action: "RISK_CONTROL_CREATED",
      resource: `RiskControl:${control.id}`,
      metadata: { title: control.title, riskId: control.riskId },
    });

    baseRevalidate(validated.riskId);
    return { success: true, data: control };
  } catch (error: any) {
    return { success: false, error: error.message || "Could not create control" };
  }
}

export async function updateRiskControl(input: z.infer<typeof updateControlSchema>) {
  try {
    const { tenantId, user } = await getActionContext();
    const validated = updateControlSchema.parse(input);

    const { data: existing } = await getAdminDb()
      .from("RiskControl")
      .select("*")
      .eq("id", validated.id)
      .eq("tenantId", tenantId)
      .maybeSingle();

    if (!existing) {
      return { success: false, error: "Control not found" };
    }

    const data: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (validated.title) data.title = validated.title;
    if (validated.description !== undefined) data.description = sanitizeText(validated.description);
    if (validated.controlType) data.controlType = validated.controlType;
    if (validated.ownerId !== undefined) data.ownerId = validated.ownerId ?? null;
    if (validated.frequency !== undefined) data.frequency = validated.frequency ?? null;
    if (validated.effectiveness) data.effectiveness = validated.effectiveness;
    if (validated.status) data.status = validated.status;
    if (validated.monitoringMethod !== undefined) {
      data.monitoringMethod = sanitizeText(validated.monitoringMethod);
    }
    if (validated.evidenceDocumentId !== undefined) {
      data.evidenceDocumentId = validated.evidenceDocumentId ?? null;
    }
    if (validated.nextTestDate !== undefined) {
      data.nextTestDate = parseOptionalDateIso(validated.nextTestDate);
    }
    if (validated.lastTestedAt !== undefined) {
      data.lastTestedAt = parseOptionalDateIso(validated.lastTestedAt);
    }

    const { data: control, error } = await getAdminDb()
      .from("RiskControl")
      .update(data)
      .eq("id", validated.id)
      .eq("tenantId", tenantId)
      .select("*")
      .single();

    if (error || !control) {
      throw { code: "RISK_CONTROL_UPDATE_FAILED", message: error?.message || "Could not update control" };
    }

    await insertAuditLog({
      tenantId,
      userId: user.id,
      action: "RISK_CONTROL_UPDATED",
      resource: `RiskControl:${control.id}`,
      metadata: { title: control.title, riskId: control.riskId, status: control.status },
    });

    baseRevalidate(control.riskId);
    return { success: true, data: control };
  } catch (error: any) {
    return { success: false, error: error.message || "Could not update control" };
  }
}

export async function deleteRiskControl(controlId: string) {
  try {
    const { tenantId, user } = await getActionContext();
    const { data: control } = await getAdminDb()
      .from("RiskControl")
      .select("id, riskId")
      .eq("id", controlId)
      .eq("tenantId", tenantId)
      .maybeSingle();

    if (!control) {
      return { success: false, error: "Control not found" };
    }

    const { error } = await getAdminDb()
      .from("RiskControl")
      .delete()
      .eq("id", controlId)
      .eq("tenantId", tenantId);
    if (error) {
      throw { code: "RISK_CONTROL_DELETE_FAILED", message: error.message };
    }

    await insertAuditLog({
      tenantId,
      userId: user.id,
      action: "RISK_CONTROL_DELETED",
      resource: `RiskControl:${controlId}`,
      metadata: { riskId: control.riskId },
    });

    baseRevalidate(control.riskId);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Could not delete control" };
  }
}

export async function linkDocumentToRisk(input: z.infer<typeof documentLinkSchema>) {
  try {
    const { tenantId, user } = await getActionContext();
    const validated = documentLinkSchema.parse(input);

    const { data: document } = await getAdminDb()
      .from("Document")
      .select("id")
      .eq("id", validated.documentId)
      .eq("tenantId", tenantId)
      .maybeSingle();

    if (!document) {
      throw { code: "DOCUMENT_NOT_FOUND", message: "Document not found" };
    }

    const { data: existing } = await getAdminDb()
      .from("RiskDocumentLink")
      .select("id")
      .eq("riskId", validated.riskId)
      .eq("documentId", validated.documentId)
      .maybeSingle();

    const payload = {
      relation: validated.relation,
      note: sanitizeText(validated.note),
    };

    const { data: link, error } = existing
      ? await getAdminDb()
          .from("RiskDocumentLink")
          .update(payload)
          .eq("id", existing.id)
          .select("*")
          .single()
      : await getAdminDb()
          .from("RiskDocumentLink")
          .insert({
            id: createId(),
            tenantId,
            riskId: validated.riskId,
            documentId: validated.documentId,
            ...payload,
          })
          .select("*")
          .single();

    if (error || !link) {
      throw { code: "RISK_DOCUMENT_LINK_FAILED", message: error?.message || "Could not link document" };
    }

    await insertAuditLog({
      tenantId,
      userId: user.id,
      action: "RISK_DOCUMENT_LINKED",
      resource: `Risk:${validated.riskId}`,
      metadata: { documentId: validated.documentId, relation: validated.relation },
    });

    baseRevalidate(validated.riskId);
    return { success: true, data: link };
  } catch (error: any) {
    return { success: false, error: error.message || "Could not link document" };
  }
}

export async function unlinkDocumentFromRisk(linkId: string) {
  try {
    const { tenantId } = await getActionContext();
    const { data: link } = await getAdminDb()
      .from("RiskDocumentLink")
      .select("id, riskId")
      .eq("id", linkId)
      .eq("tenantId", tenantId)
      .maybeSingle();
    if (!link) {
      return { success: false, error: "Document link not found" };
    }

    const { error } = await getAdminDb().from("RiskDocumentLink").delete().eq("id", linkId).eq("tenantId", tenantId);
    if (error) {
      throw { code: "RISK_DOCUMENT_UNLINK_FAILED", message: error.message };
    }
    baseRevalidate(link.riskId);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Could not remove link" };
  }
}

export async function linkAuditToRisk(input: z.infer<typeof auditLinkSchema>) {
  try {
    const { tenantId, user } = await getActionContext();
    const validated = auditLinkSchema.parse(input);

    const { data: audit } = await getAdminDb()
      .from("Audit")
      .select("id")
      .eq("id", validated.auditId)
      .eq("tenantId", tenantId)
      .maybeSingle();

    if (!audit) {
      throw { code: "AUDIT_NOT_FOUND", message: "Audit not found" };
    }

    const { data: existing } = await getAdminDb()
      .from("RiskAuditLink")
      .select("id")
      .eq("riskId", validated.riskId)
      .eq("auditId", validated.auditId)
      .maybeSingle();

    const payload = {
      relation: validated.relation,
      summary: sanitizeText(validated.summary),
    };

    const { data: link, error } = existing
      ? await getAdminDb()
          .from("RiskAuditLink")
          .update(payload)
          .eq("id", existing.id)
          .select("*")
          .single()
      : await getAdminDb()
          .from("RiskAuditLink")
          .insert({
            id: createId(),
            tenantId,
            riskId: validated.riskId,
            auditId: validated.auditId,
            ...payload,
          })
          .select("*")
          .single();

    if (error || !link) {
      throw { code: "RISK_AUDIT_LINK_FAILED", message: error?.message || "Could not link audit" };
    }

    await insertAuditLog({
      tenantId,
      userId: user.id,
      action: "RISK_AUDIT_LINKED",
      resource: `Risk:${validated.riskId}`,
      metadata: { auditId: validated.auditId, relation: validated.relation },
    });

    baseRevalidate(validated.riskId);
    return { success: true, data: link };
  } catch (error: any) {
    return { success: false, error: error.message || "Could not link audit" };
  }
}

export async function unlinkAuditFromRisk(linkId: string) {
  try {
    const { tenantId } = await getActionContext();
    const { data: link } = await getAdminDb()
      .from("RiskAuditLink")
      .select("id, riskId")
      .eq("id", linkId)
      .eq("tenantId", tenantId)
      .maybeSingle();

    if (!link) {
      return { success: false, error: "Audit link not found" };
    }

    const { error } = await getAdminDb().from("RiskAuditLink").delete().eq("id", linkId).eq("tenantId", tenantId);
    if (error) {
      throw { code: "RISK_AUDIT_UNLINK_FAILED", message: error.message };
    }
    baseRevalidate(link.riskId);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Could not remove link" };
  }
}
