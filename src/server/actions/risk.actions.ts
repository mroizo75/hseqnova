"use server";

import { revalidatePath } from "next/cache";
import { getAdminDb } from "@/lib/supabase/admin";
import { createId } from "@/lib/ids";
import {
  createRiskSchema,
  updateRiskSchema,
  createRiskAssessmentSchema,
  updateRiskAssessmentSchema,
  riskLevelToMatrix,
} from "@/features/risks/schemas/risk.schema";
import { ControlFrequency, RiskCategory } from "@prisma/client";
import { calculateNextReviewDate } from "@/lib/document-utils";
import { getActionContext } from "./action-context";
import { getPermissions } from "@/lib/permissions";
import {
  loadRiskAssessmentDetail,
  loadRiskAssessmentsForList,
  loadRiskDetail,
  loadRisksForList,
} from "@/server/queries/risks.queries";
import {
  getUkRiskStarterByKeys,
  getUkRiskStarterIndustryLabel,
  resolveUkRiskStarterIndustry,
} from "@/lib/uk-risk-starters";
import { isSupportedIndustry } from "@/lib/industry-packages";
import { sanitizeIndustryRiskPack } from "@/lib/industry-risk-pack";
import { serializeGroupsAtRisk } from "@/lib/risk-mhswr";

const sanitizeString = (value?: string | null) => {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const parseOptionalNumber = (value: any) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const parseOptionalDate = (value: any) => {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const getNextReviewDateForFrequency = (base: Date, frequency: ControlFrequency) => {
  switch (frequency) {
    case "WEEKLY":
      return new Date(base.getTime() + 7 * 24 * 60 * 60 * 1000);
    case "MONTHLY":
      return calculateNextReviewDate(base, 1);
    case "QUARTERLY":
      return calculateNextReviewDate(base, 3);
    case "ANNUAL":
      return calculateNextReviewDate(base, 12);
    case "BIENNIAL":
      return calculateNextReviewDate(base, 24);
    default:
      return calculateNextReviewDate(base, 12);
  }
};

function toIso(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

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

export async function getRisks(tenantId: string) {
  try {
    await getActionContext();
    const risks = await loadRisksForList(tenantId);
    return { success: true, data: risks };
  } catch (error: any) {
    return { success: false, error: error.message || "Could not load risks" };
  }
}

export async function getRisk(id: string) {
  try {
    const { tenantId } = await getActionContext();
    const risk = await loadRiskDetail(tenantId, id);
    if (!risk) {
      return { success: false, error: "Risk not found" };
    }
    return { success: true, data: risk };
  } catch (error: any) {
    return { success: false, error: error.message || "Could not load risk" };
  }
}

// Opprett ny risiko
export async function createRisk(input: any) {
  try {
    const { user, tenantId, role } = await getActionContext();
    const normalizedInput = {
      ...input,
      tenantId,
      likelihood: Number(input.likelihood),
      consequence: Number(input.consequence),
      residualLikelihood: parseOptionalNumber(input.residualLikelihood),
      residualConsequence: parseOptionalNumber(input.residualConsequence),
      nextReviewDate: parseOptionalDate(input.nextReviewDate),
      reviewedAt: parseOptionalDate(input.reviewedAt),
      assessmentDate: parseOptionalDate(input.assessmentDate),
    };
    const validated = createRiskSchema.parse(normalizedInput);

    const score = validated.likelihood * validated.consequence;
    const residualScore =
      validated.residualLikelihood && validated.residualConsequence
        ? validated.residualLikelihood * validated.residualConsequence
        : null;
    const controlFrequency = validated.controlFrequency ?? ControlFrequency.ANNUAL;
    const nextReviewDate =
      validated.nextReviewDate ??
      getNextReviewDateForFrequency(new Date(), controlFrequency);
    
    const now = new Date().toISOString();
    const riskId = createId();
    const { data: risk, error } = await getAdminDb()
      .from("Risk")
      .insert({
        id: riskId,
        tenantId: validated.tenantId,
        riskAssessmentId: validated.riskAssessmentId ?? null,
        title: validated.title,
        context: validated.context,
        description: sanitizeString(validated.description),
        existingControls: sanitizeString(validated.existingControls),
        groupsAtRisk: sanitizeString(validated.groupsAtRisk),
        location: sanitizeString(validated.location),
        area: sanitizeString(validated.area),
        category: validated.category,
        likelihood: validated.likelihood,
        consequence: validated.consequence,
        score,
        ownerId: validated.ownerId,
        status: validated.status,
        riskStatement: sanitizeString(validated.riskStatement),
        controlFrequency,
        nextReviewDate: toIso(nextReviewDate),
        residualLikelihood: validated.residualLikelihood ?? null,
        residualConsequence: validated.residualConsequence ?? null,
        residualScore,
        kpiId: validated.kpiId ?? null,
        inspectionTemplateId: validated.inspectionTemplateId ?? null,
        linkedProcess: sanitizeString(validated.linkedProcess),
        riskAppetite: sanitizeString(validated.riskAppetite),
        riskTolerance: sanitizeString(validated.riskTolerance),
        responseStrategy: validated.responseStrategy,
        trend: validated.trend,
        reviewedAt: toIso(validated.reviewedAt ?? null),
        assessmentDate: toIso(validated.assessmentDate ?? null),
        createdAt: now,
        updatedAt: now,
      })
      .select("*")
      .single();

    if (error || !risk) {
      throw { code: "RISK_CREATE_FAILED", message: error?.message || "Could not create risk" };
    }

    await getAdminDb().from("RiskHistory").insert({
      id: createId(),
      tenantId,
      riskId: risk.id,
      changeType: "CREATED",
      newScore: score,
      changedById: user.id,
    });

    await insertAuditLog({
      tenantId,
      userId: user.id,
      action: "RISK_CREATED",
      resource: `Risk:${risk.id}`,
      metadata: { title: risk.title, score },
    });
    
    revalidatePath("/dashboard/risks");
    revalidatePath("/ansatt/risikovurderinger");
    return { success: true, data: risk };
  } catch (error: any) {
    console.error("Create risk error:", error);
    return { success: false, error: error.message || "Could not create the risk" };
  }
}

// Oppdater risiko
export async function updateRisk(input: any) {
  try {
    const { user, tenantId, role } = await getActionContext();
    const nextReviewValue =
      input.nextReviewDate === "" || input.nextReviewDate === null
        ? null
        : parseOptionalDate(input.nextReviewDate);
    const normalizedInput = {
      ...input,
      likelihood: parseOptionalNumber(input.likelihood),
      consequence: parseOptionalNumber(input.consequence),
      residualLikelihood: parseOptionalNumber(input.residualLikelihood),
      residualConsequence: parseOptionalNumber(input.residualConsequence),
      nextReviewDate: nextReviewValue,
      reviewedAt: parseOptionalDate(input.reviewedAt),
    };
    const validated = updateRiskSchema.parse(normalizedInput);
    
    const { data: existingRisk } = await getAdminDb()
      .from("Risk")
      .select("*")
      .eq("id", validated.id)
      .eq("tenantId", tenantId)
      .maybeSingle();
    
    if (!existingRisk) {
      return { success: false, error: "Risk not found" };
    }
    
    // Beregn ny score hvis likelihood eller consequence endres
    const likelihood = validated.likelihood ?? existingRisk.likelihood;
    const consequence = validated.consequence ?? existingRisk.consequence;
    const score = likelihood * consequence;
    const residualLikelihood = validated.residualLikelihood ?? existingRisk.residualLikelihood ?? undefined;
    const residualConsequence = validated.residualConsequence ?? existingRisk.residualConsequence ?? undefined;
    const residualScore =
      residualLikelihood && residualConsequence
        ? residualLikelihood * residualConsequence
        : null;

    const updateData: Record<string, unknown> = {
      score,
      updatedAt: new Date().toISOString(),
    };

    if (validated.title) updateData.title = validated.title;
    if (validated.context) updateData.context = validated.context;
    if (validated.description !== undefined) updateData.description = sanitizeString(validated.description);
    if (validated.existingControls !== undefined) updateData.existingControls = sanitizeString(validated.existingControls);
    if (validated.groupsAtRisk !== undefined) updateData.groupsAtRisk = sanitizeString(validated.groupsAtRisk);
    if (validated.location !== undefined) updateData.location = sanitizeString(validated.location);
    if (validated.area !== undefined) updateData.area = sanitizeString(validated.area);
    if (validated.ownerId) updateData.ownerId = validated.ownerId;
    if (validated.status) updateData.status = validated.status;
    if (validated.category) updateData.category = validated.category;
    if (validated.riskStatement !== undefined) updateData.riskStatement = sanitizeString(validated.riskStatement);
    if (validated.linkedProcess !== undefined) updateData.linkedProcess = sanitizeString(validated.linkedProcess);
    if (validated.riskAppetite !== undefined) updateData.riskAppetite = sanitizeString(validated.riskAppetite);
    if (validated.riskTolerance !== undefined) updateData.riskTolerance = sanitizeString(validated.riskTolerance);
    if (validated.responseStrategy) updateData.responseStrategy = validated.responseStrategy;
    if (validated.trend) updateData.trend = validated.trend;
    if (validated.kpiId !== undefined) updateData.kpiId = validated.kpiId ?? null;
    if (validated.inspectionTemplateId !== undefined) updateData.inspectionTemplateId = validated.inspectionTemplateId ?? null;
    if (validated.likelihood !== undefined) updateData.likelihood = validated.likelihood;
    if (validated.consequence !== undefined) updateData.consequence = validated.consequence;
    if (validated.residualLikelihood !== undefined) updateData.residualLikelihood = validated.residualLikelihood;
    if (validated.residualConsequence !== undefined) updateData.residualConsequence = validated.residualConsequence;
    updateData.residualScore = residualScore;
    if (validated.reviewedAt !== undefined) {
      updateData.reviewedAt = toIso(validated.reviewedAt ?? null);
    }

    let nextReviewDateToPersist = validated.nextReviewDate;
    if (validated.nextReviewDate === null) {
      nextReviewDateToPersist = null;
    } else if (validated.nextReviewDate === undefined && validated.controlFrequency) {
      nextReviewDateToPersist = getNextReviewDateForFrequency(
        existingRisk.nextReviewDate ? new Date(existingRisk.nextReviewDate) : new Date(),
        validated.controlFrequency
      );
    }

    if (nextReviewDateToPersist !== undefined) {
      updateData.nextReviewDate = toIso(nextReviewDateToPersist);
    }

    if (validated.controlFrequency) {
      updateData.controlFrequency = validated.controlFrequency;
    }
    if (validated.riskAssessmentId !== undefined) updateData.riskAssessmentId = validated.riskAssessmentId;
    if (validated.assessmentDate !== undefined) updateData.assessmentDate = toIso(validated.assessmentDate);

    const { data: risk, error } = await getAdminDb()
      .from("Risk")
      .update(updateData)
      .eq("id", validated.id)
      .eq("tenantId", tenantId)
      .select("*")
      .single();

    if (error || !risk) {
      throw { code: "RISK_UPDATE_FAILED", message: error?.message || "Could not update risk" };
    }

    // --- Risk history tracking (MHSWR reg.4) ---
    const scoreChanged = existingRisk.score !== score;
    const trackedFields = [
      "title", "context", "description", "existingControls", "location",
      "area", "category", "status", "riskStatement", "responseStrategy",
      "trend", "controlFrequency", "likelihood", "consequence",
      "residualLikelihood", "residualConsequence",
    ] as const;
    const changedFieldsMap: Record<string, { old: unknown; new: unknown }> = {};
    for (const field of trackedFields) {
      const oldVal = existingRisk[field];
      const newVal = (updateData as Record<string, unknown>)[field];
      if (newVal !== undefined && String(newVal) !== String(oldVal ?? "")) {
        changedFieldsMap[field] = { old: oldVal, new: newVal };
      }
    }

    const changeType = scoreChanged
      ? "SCORE_CHANGED"
      : Object.keys(changedFieldsMap).length > 0
        ? "UPDATED"
        : "UPDATED";

    await getAdminDb().from("RiskHistory").insert({
      id: createId(),
      tenantId,
      riskId: validated.id,
      changeType,
      previousScore: scoreChanged ? existingRisk.score : null,
      newScore: scoreChanged ? score : null,
      changedFields: Object.keys(changedFieldsMap).length > 0
        ? JSON.stringify(changedFieldsMap)
        : null,
      changedById: user.id,
    });

    await insertAuditLog({
      tenantId,
      userId: user.id,
      action: "RISK_UPDATED",
      resource: `Risk:${risk.id}`,
      metadata: { title: risk.title, score },
    });
    
    revalidatePath("/dashboard/risks");
    revalidatePath("/ansatt/risikovurderinger");
    revalidatePath(`/dashboard/risks/${risk.id}`);
    return { success: true, data: risk };
  } catch (error: any) {
    console.error("Update risk error:", error);
    return { success: false, error: error.message || "Could not update the risk" };
  }
}

// Slett risiko
export async function deleteRisk(id: string) {
  try {
    const { user, tenantId, role } = await getActionContext();
    
    const { data: risk } = await getAdminDb()
      .from("Risk")
      .select("id, title")
      .eq("id", id)
      .eq("tenantId", tenantId)
      .maybeSingle();
    
    if (!risk) {
      return { success: false, error: "Risk not found" };
    }
    
    const { error } = await getAdminDb().from("Risk").delete().eq("id", id).eq("tenantId", tenantId);
    if (error) {
      throw { code: "RISK_DELETE_FAILED", message: error.message };
    }

    await insertAuditLog({
      tenantId,
      userId: user.id,
      action: "RISK_DELETED",
      resource: `Risk:${id}`,
      metadata: { title: risk.title },
    });
    
    revalidatePath("/dashboard/risks");
    revalidatePath("/ansatt/risikovurderinger");
    return { success: true };
  } catch (error: any) {
    console.error("Delete risk error:", error);
    return { success: false, error: error.message || "Could not delete the risk" };
  }
}

// Få statistikk over risikoer
export async function getRiskStats(tenantId: string) {
  try {
    await getActionContext();
    
    const { data: rows } = await getAdminDb().from("Risk").select("score, status").eq("tenantId", tenantId);
    const risks = (rows ?? []) as Array<{ score: number; status: string }>;
    
    const stats = {
      total: risks.length,
      critical: risks.filter(r => r.score >= 20).length,
      high: risks.filter(r => r.score >= 12 && r.score < 20).length,
      medium: risks.filter(r => r.score >= 6 && r.score < 12).length,
      low: risks.filter(r => r.score < 6).length,
      open: risks.filter(r => r.status === "OPEN").length,
      mitigating: risks.filter(r => r.status === "MITIGATING").length,
      accepted: risks.filter(r => r.status === "ACCEPTED").length,
      closed: risks.filter(r => r.status === "CLOSED").length,
    };
    
    return { success: true, data: stats };
  } catch (error: any) {
    console.error("Get risk stats error:", error);
    return { success: false, error: error.message || "Could not load statistics" };
  }
}

// —— Risikovurdering (årlig dokument med risikopunkter) ——

export async function createRiskAssessment(input: {
  tenantId: string;
  projectId?: string | null;
  title: string;
  assessmentYear: number;
  participants?: string;
}) {
  try {
    const { user, tenantId } = await getActionContext();
    const validated = createRiskAssessmentSchema.parse({ ...input, tenantId });
    if (validated.projectId) {
      const { data: project } = await getAdminDb()
        .from("Project")
        .select("id")
        .eq("id", validated.projectId)
        .eq("tenantId", validated.tenantId)
        .maybeSingle();
      if (!project) {
        return { success: false, error: "Project not found for this organisation" };
      }
    }

    const now = new Date().toISOString();
    const { data: assessment, error } = await getAdminDb()
      .from("RiskAssessment")
      .insert({
        id: createId(),
        tenantId: validated.tenantId,
        projectId: validated.projectId ?? null,
        title: validated.title,
        assessmentYear: validated.assessmentYear,
        participants: validated.participants?.trim() || null,
        createdAt: now,
        updatedAt: now,
      })
      .select("*")
      .single();

    if (error || !assessment) {
      throw { code: "RISK_ASSESSMENT_CREATE_FAILED", message: error?.message || "Could not create assessment" };
    }

    await insertAuditLog({
      tenantId,
      userId: user.id,
      action: "RISK_ASSESSMENT_CREATED",
      resource: `RiskAssessment:${assessment.id}`,
      metadata: { title: assessment.title, year: assessment.assessmentYear },
    });

    revalidatePath("/dashboard/risks");
    revalidatePath("/ansatt/risikovurderinger");
    revalidatePath(`/dashboard/risks/assessment/${assessment.id}`);
    return { success: true, data: assessment };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Could not create the risk assessment";
    return { success: false, error: message };
  }
}

export async function updateRiskAssessment(input: {
  id: string;
  title?: string;
  participants?: string;
  approvedById?: string | null;
  approvedAt?: string | null;
  reviewedById?: string | null;
  reviewedAt?: string | null;
  groupsAtRisk?: string | null;
}) {
  try {
    const { user, tenantId, role } = await getActionContext();
    const validated = updateRiskAssessmentSchema.parse(input);

    const { data: existing } = await getAdminDb()
      .from("RiskAssessment")
      .select("*")
      .eq("id", validated.id)
      .eq("tenantId", tenantId)
      .maybeSingle();
    if (!existing) return { success: false, error: "Risk assessment not found" };

    if (validated.title !== undefined) {
      const permissions = getPermissions(role);
      if (!permissions.canCreateRisks) {
        return { success: false, error: "No access to change the assessment title" };
      }
    }

    const { data: assessment, error } = await getAdminDb()
      .from("RiskAssessment")
      .update({
        ...(validated.title !== undefined && { title: validated.title }),
        participants:
          validated.participants !== undefined ? validated.participants?.trim() || null : undefined,
        approvedById: validated.approvedById,
        approvedAt: validated.approvedAt ? toIso(validated.approvedAt) : validated.approvedAt,
        reviewedById: validated.reviewedById,
        reviewedAt: validated.reviewedAt ? toIso(validated.reviewedAt) : validated.reviewedAt,
        ...(validated.groupsAtRisk !== undefined && { groupsAtRisk: validated.groupsAtRisk?.trim() || null }),
        updatedAt: new Date().toISOString(),
      })
      .eq("id", validated.id)
      .eq("tenantId", tenantId)
      .select("*")
      .single();

    if (error || !assessment) {
      throw { code: "RISK_ASSESSMENT_UPDATE_FAILED", message: error?.message || "Could not update assessment" };
    }

    await insertAuditLog({
      tenantId,
      userId: user.id,
      action: "RISK_ASSESSMENT_UPDATED",
      resource: `RiskAssessment:${assessment.id}`,
      metadata: {
        title: assessment.title,
        previousTitle: validated.title !== undefined ? existing.title : undefined,
      },
    });

    revalidatePath(`/dashboard/risks/assessment/${assessment.id}`);
    revalidatePath("/dashboard/risks");
    revalidatePath("/ansatt/risikovurderinger");
    return { success: true, data: assessment };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Could not update the risk assessment";
    return { success: false, error: message };
  }
}

export async function getRiskAssessments(tenantId: string) {
  try {
    await getActionContext();
    const assessments = await loadRiskAssessmentsForList(tenantId);
    return { success: true, data: assessments };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Could not load risk assessments";
    return { success: false, error: message };
  }
}

export async function getRiskAssessment(assessmentId: string) {
  try {
    const { tenantId } = await getActionContext();
    const assessment = await loadRiskAssessmentDetail(tenantId, assessmentId);
    if (!assessment) return { success: false, error: "Risk assessment not found" };
    return { success: true, data: assessment };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Could not load the risk assessment";
    return { success: false, error: message };
  }
}

export async function deleteRiskAssessment(assessmentId: string) {
  try {
    const { user, tenantId } = await getActionContext();
    const { data: assessment } = await getAdminDb()
      .from("RiskAssessment")
      .select("id, title")
      .eq("id", assessmentId)
      .eq("tenantId", tenantId)
      .maybeSingle();
    if (!assessment) return { success: false, error: "Risk assessment not found" };

    const { count } = await getAdminDb()
      .from("Risk")
      .select("id", { count: "exact", head: true })
      .eq("riskAssessmentId", assessmentId)
      .eq("tenantId", tenantId);

    const { error } = await getAdminDb().from("RiskAssessment").delete().eq("id", assessmentId).eq("tenantId", tenantId);
    if (error) {
      throw { code: "RISK_ASSESSMENT_DELETE_FAILED", message: error.message };
    }

    await insertAuditLog({
      tenantId,
      userId: user.id,
      action: "RISK_ASSESSMENT_DELETED",
      resource: `RiskAssessment:${assessmentId}`,
      metadata: { title: assessment.title, risksCount: count ?? 0 },
    });

    revalidatePath("/dashboard/risks");
    revalidatePath("/ansatt/risikovurderinger");
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Could not delete the risk assessment";
    return { success: false, error: message };
  }
}

/** Legg til risikopunkt i en risikovurdering (tittel, beskrivelse, konsekvens, nivå, kategori, dato) */
export async function addRiskAssessmentItem(input: {
  riskAssessmentId: string;
  tenantId: string;
  ownerId: string;
  title: string;
  level: keyof typeof riskLevelToMatrix;
  category: string;
  assessmentDate?: string | null;
  nextReviewDate?: string | null;
  whoMightBeHarmed?: string | null;
  beskrivelse?: string | null;
  konsekvens?: string | null;
  existingControls?: string | null;
  groupsAtRisk?: string | null;
  suggestedMeasures?: string[];
}) {
  try {
    const { tenantId: ctxTenantId } = await getActionContext();
    if (input.tenantId !== ctxTenantId) return { success: false, error: "Not authorised" };

    const { data: assessment } = await getAdminDb()
      .from("RiskAssessment")
      .select("id")
      .eq("id", input.riskAssessmentId)
      .eq("tenantId", input.tenantId)
      .maybeSingle();
    if (!assessment) return { success: false, error: "Risk assessment not found" };

    const { likelihood, consequence } = riskLevelToMatrix[input.level];
    const score = likelihood * consequence;
    const context = (input.whoMightBeHarmed ?? input.beskrivelse ?? "").trim();
    if (context.length < 10) {
      return {
        success: false,
        error: "Record who might be harmed and how (MHSWR 1999 reg.3(6); HSE).",
      };
    }
    const existingControls = (input.existingControls ?? "").trim();
    if (existingControls.length < 8) {
      return {
        success: false,
        error: "Record existing controls — what you are already doing to control the risk (HSE).",
      };
    }
    const riskStatement = (input.konsekvens ?? "").trim() || null;

    const normalizedMeasures = (input.suggestedMeasures ?? [])
      .map((item) => item.trim())
      .filter((item, index, array) => item.length > 0 && array.indexOf(item) === index)
      .slice(0, 5);

    const now = new Date().toISOString();
    const riskId = createId();
    const { data: risk, error } = await getAdminDb()
      .from("Risk")
      .insert({
        id: riskId,
        tenantId: input.tenantId,
        riskAssessmentId: input.riskAssessmentId,
        title: input.title,
        context,
        riskStatement,
        existingControls,
        groupsAtRisk: (input.groupsAtRisk ?? "").trim() || null,
        likelihood,
        consequence,
        score,
        ownerId: input.ownerId,
        status: "OPEN",
        category: input.category as RiskCategory,
        assessmentDate: input.assessmentDate ? toIso(input.assessmentDate) : null,
        nextReviewDate: input.nextReviewDate ? toIso(input.nextReviewDate) : null,
        controlFrequency: input.nextReviewDate ? "ANNUAL" : null,
        createdAt: now,
        updatedAt: now,
      })
      .select("*")
      .single();

    if (error || !risk) {
      throw { code: "RISK_ITEM_CREATE_FAILED", message: error?.message || "Could not add risk item" };
    }

    if (normalizedMeasures.length > 0) {
      const dueAt = new Date();
      dueAt.setDate(dueAt.getDate() + 30);
      const { error: measureError } = await getAdminDb().from("Measure").insert(
        normalizedMeasures.map((measureTitle) => ({
          id: createId(),
          tenantId: input.tenantId,
          riskId: risk.id,
          title: measureTitle,
          description: "AI-suggested action. Confirm owner, due date and effect when you follow it up.",
          dueAt: dueAt.toISOString(),
          responsibleId: input.ownerId,
          category: "MITIGATION",
          followUpFrequency: "ANNUAL",
          createdAt: now,
          updatedAt: now,
        })),
      );
      if (measureError) {
        throw { code: "MEASURE_CREATE_FAILED", message: measureError.message };
      }
    }

    revalidatePath("/dashboard/risks");
    revalidatePath("/ansatt/risikovurderinger");
    revalidatePath(`/dashboard/risks/assessment/${input.riskAssessmentId}`);
    return { success: true, data: risk };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Could not add the risk item";
    return { success: false, error: message };
  }
}

const MAX_STARTER_HAZARDS = 20;

export async function createRiskAssessmentFromStarter(input: {
  industry: string;
  hazardKeys: string[];
  assessmentId?: string | null;
}): Promise<{ success: boolean; assessmentId?: string; error?: string }> {
  try {
    const { user, tenantId, role } = await getActionContext();
    const permissions = getPermissions(role);
    if (!permissions.canCreateRisks) {
      return { success: false, error: "You do not have permission to create risk assessments" };
    }

    const uniqueKeys = [...new Set(input.hazardKeys.map((key) => key.trim()).filter(Boolean))].slice(
      0,
      MAX_STARTER_HAZARDS,
    );
    if (uniqueKeys.length === 0) {
      return { success: false, error: "Select at least one hazard that applies to your workplace" };
    }

    const packIndustry = resolveUkRiskStarterIndustry(input.industry);
    const hazards = getUkRiskStarterByKeys(packIndustry, uniqueKeys);
    if (hazards.length === 0) {
      return { success: false, error: "Those hazards are not in this starter pack" };
    }

    const db = getAdminDb();
    const year = new Date().getFullYear();
    let assessmentId = input.assessmentId?.trim() || null;

    if (assessmentId) {
      const { data: existing } = await db
        .from("RiskAssessment")
        .select("id")
        .eq("id", assessmentId)
        .eq("tenantId", tenantId)
        .maybeSingle();
      if (!existing) {
        return { success: false, error: "Risk assessment not found" };
      }
    } else {
      const industryLabel = getUkRiskStarterIndustryLabel(packIndustry);
      const now = new Date().toISOString();
      const createdId = createId();
      const { data: assessment, error } = await db
        .from("RiskAssessment")
        .insert({
          id: createdId,
          tenantId,
          title: `${industryLabel} risk assessment ${year}`,
          assessmentYear: year,
          createdAt: now,
          updatedAt: now,
        })
        .select("id")
        .single();
      if (error || !assessment) {
        return { success: false, error: error?.message || "Could not create the risk assessment" };
      }
      assessmentId = assessment.id as string;
    }

    const now = new Date().toISOString();
    const nextReview = new Date();
    nextReview.setFullYear(nextReview.getFullYear() + 1);
    const nextReviewIso = nextReview.toISOString();

    const riskRows = hazards.map((hazard) => {
      const score = hazard.likelihood * hazard.consequence;
      return {
        id: createId(),
        tenantId,
        riskAssessmentId: assessmentId,
        title: hazard.title,
        context: `${hazard.context} Who might be harmed: ${hazard.whoAtRisk}.`,
        description: hazard.legalRef,
        existingControls: hazard.existingControls,
        likelihood: hazard.likelihood,
        consequence: hazard.consequence,
        score,
        ownerId: user.id,
        status: "OPEN",
        category: hazard.category,
        controlFrequency: "ANNUAL",
        nextReviewDate: nextReviewIso,
        assessmentDate: now,
        createdAt: now,
        updatedAt: now,
      };
    });

    const { error: riskError } = await db.from("Risk").insert(riskRows);
    if (riskError) {
      return { success: false, error: riskError.message || "Could not add the selected hazards" };
    }

    await db.from("RiskHistory").insert(
      riskRows.map((row) => ({
        id: createId(),
        tenantId,
        riskId: row.id,
        changeType: "CREATED",
        newScore: row.score,
        changedById: user.id,
      })),
    );

    await insertAuditLog({
      tenantId,
      userId: user.id,
      action: "RISK_ASSESSMENT_STARTER_APPLIED",
      resource: `RiskAssessment:${assessmentId}`,
      metadata: { industry: packIndustry, count: riskRows.length },
    });

    if (isSupportedIndustry(packIndustry)) {
      await db
        .from("Tenant")
        .update({ industry: packIndustry, updatedAt: now })
        .eq("id", tenantId);
    }

    revalidatePath("/dashboard/risks");
    revalidatePath("/ansatt/risikovurderinger");
    revalidatePath(`/dashboard/risks/assessment/${assessmentId}`);
    return { success: true, assessmentId };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Could not create the risk assessment from the starter";
    return { success: false, error: message };
  }
}

export async function createRiskAssessmentFromGeneratedPack(input: {
  industryLabel: string;
  hazards: unknown[];
  assessmentId?: string | null;
}): Promise<{ success: boolean; assessmentId?: string; error?: string }> {
  try {
    const { user, tenantId, role } = await getActionContext();
    const permissions = getPermissions(role);
    if (!permissions.canCreateRisks) {
      return { success: false, error: "You do not have permission to create risk assessments" };
    }

    const pack = sanitizeIndustryRiskPack({
      industryLabel: input.industryLabel,
      hazards: input.hazards,
    });
    const hazards = pack.hazards.slice(0, MAX_STARTER_HAZARDS);
    if (hazards.length === 0) {
      return { success: false, error: "Select at least one hazard that applies to your workplace" };
    }

    const db = getAdminDb();
    const year = new Date().getFullYear();
    let assessmentId = input.assessmentId?.trim() || null;
    const industryLabel = pack.industryLabel;

    if (assessmentId) {
      const { data: existing } = await db
        .from("RiskAssessment")
        .select("id")
        .eq("id", assessmentId)
        .eq("tenantId", tenantId)
        .maybeSingle();
      if (!existing) {
        return { success: false, error: "Risk assessment not found" };
      }
    } else {
      const now = new Date().toISOString();
      const createdId = createId();
      const { data: assessment, error } = await db
        .from("RiskAssessment")
        .insert({
          id: createdId,
          tenantId,
          title: `${industryLabel} risk assessment ${year}`,
          assessmentYear: year,
          createdAt: now,
          updatedAt: now,
        })
        .select("id")
        .single();
      if (error || !assessment) {
        return { success: false, error: error?.message || "Could not create the risk assessment" };
      }
      assessmentId = assessment.id as string;
    }

    const now = new Date().toISOString();
    const nextReview = new Date();
    nextReview.setFullYear(nextReview.getFullYear() + 1);
    const nextReviewIso = nextReview.toISOString();

    const riskRows = hazards.map((hazard) => {
      const score = hazard.likelihood * hazard.consequence;
      return {
        id: createId(),
        tenantId,
        riskAssessmentId: assessmentId,
        title: hazard.title,
        context: hazard.context,
        description: hazard.legalRef,
        existingControls: hazard.existingControls,
        groupsAtRisk: serializeGroupsAtRisk(hazard.whoAtRisk),
        likelihood: hazard.likelihood,
        consequence: hazard.consequence,
        score,
        ownerId: user.id,
        status: "OPEN",
        category: hazard.category,
        controlFrequency: "ANNUAL",
        nextReviewDate: nextReviewIso,
        assessmentDate: now,
        createdAt: now,
        updatedAt: now,
      };
    });

    const { error: riskError } = await db.from("Risk").insert(riskRows);
    if (riskError) {
      return { success: false, error: riskError.message || "Could not add the selected hazards" };
    }

    await db.from("RiskHistory").insert(
      riskRows.map((row) => ({
        id: createId(),
        tenantId,
        riskId: row.id,
        changeType: "CREATED",
        newScore: row.score,
        changedById: user.id,
      })),
    );

    await insertAuditLog({
      tenantId,
      userId: user.id,
      action: "RISK_ASSESSMENT_AI_PACK_APPLIED",
      resource: `RiskAssessment:${assessmentId}`,
      metadata: { industry: industryLabel, count: riskRows.length },
    });

    revalidatePath("/dashboard/risks");
    revalidatePath("/ansatt/risikovurderinger");
    revalidatePath(`/dashboard/risks/assessment/${assessmentId}`);
    return { success: true, assessmentId };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Could not create the risk assessment from the draft";
    return { success: false, error: message };
  }
}
