"use server";

import { revalidatePath } from "next/cache";
import { getAdminDb } from "@/lib/supabase/admin";
import { createId } from "@/lib/ids";
import { getActionContext } from "./action-context";
import { validateFireRiskRecorded } from "@/lib/fire-risk-uk";

function toIso(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function calculateOverallRisk(likelihood: number, severity: number): string {
  const score = likelihood * severity;
  if (score >= 15) return "HIGH";
  if (score >= 8) return "MEDIUM";
  return "LOW";
}

export async function listFireRiskAssessments(tenantId: string) {
  try {
    await getActionContext();
    const { data, error } = await getAdminDb()
      .from("FireRiskAssessment")
      .select("*")
      .eq("tenantId", tenantId)
      .order("createdAt", { ascending: false });

    if (error) {
      throw { code: "FIRE_RISK_LIST_FAILED", message: error.message };
    }
    return { success: true as const, data: data ?? [] };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Could not load fire risk assessments";
    return { success: false as const, error: message };
  }
}

export async function getFireRiskAssessment(id: string) {
  try {
    const { tenantId } = await getActionContext();
    const { data, error } = await getAdminDb()
      .from("FireRiskAssessment")
      .select("*")
      .eq("id", id)
      .eq("tenantId", tenantId)
      .maybeSingle();

    if (error) {
      throw { code: "FIRE_RISK_GET_FAILED", message: error.message };
    }
    if (!data) {
      return { success: false as const, error: "Fire risk assessment not found" };
    }
    return { success: true as const, data };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Could not load fire risk assessment";
    return { success: false as const, error: message };
  }
}

export async function createFireRiskAssessment(input: {
  tenantId: string;
  title: string;
  buildingName: string;
  buildingAddress?: string | null;
  assessedById?: string | null;
  assessedAt?: string | null;
  reviewDate?: string | null;
  ignitionSources?: string | null;
  fuelSources?: string | null;
  oxygenSources?: string | null;
  peopleAtRisk?: string | null;
  maxOccupancy?: number | null;
  fireDetection?: string | null;
  fireAlarmSystem?: string | null;
  emergencyLighting?: string | null;
  fireExtinguishers?: string | null;
  escapeRoutes?: string | null;
  signage?: string | null;
  likelihoodOfFire?: number | null;
  consequenceSeverity?: number | null;
  additionalMeasures?: string | null;
  responsiblePersonName?: string | null;
  responsiblePersonAddress?: string | null;
  assessorName?: string | null;
  assessorOrganisation?: string | null;
}) {
  try {
    const { user, tenantId } = await getActionContext();

    const overallRiskLevel =
      input.likelihoodOfFire && input.consequenceSeverity
        ? calculateOverallRisk(input.likelihoodOfFire, input.consequenceSeverity)
        : null;

    const now = new Date().toISOString();
    const { data, error } = await getAdminDb()
      .from("FireRiskAssessment")
      .insert({
        id: createId(),
        tenantId,
        title: input.title.trim(),
        buildingName: input.buildingName.trim(),
        buildingAddress: input.buildingAddress?.trim() || null,
        assessedById: input.assessedById || user.id,
        assessedAt: toIso(input.assessedAt),
        reviewDate: toIso(input.reviewDate),
        status: "DRAFT",
        ignitionSources: input.ignitionSources || null,
        fuelSources: input.fuelSources || null,
        oxygenSources: input.oxygenSources || null,
        peopleAtRisk: input.peopleAtRisk || null,
        maxOccupancy: input.maxOccupancy ?? null,
        fireDetection: input.fireDetection?.trim() || null,
        fireAlarmSystem: input.fireAlarmSystem?.trim() || null,
        emergencyLighting: input.emergencyLighting?.trim() || null,
        fireExtinguishers: input.fireExtinguishers?.trim() || null,
        escapeRoutes: input.escapeRoutes?.trim() || null,
        signage: input.signage?.trim() || null,
        likelihoodOfFire: input.likelihoodOfFire ?? null,
        consequenceSeverity: input.consequenceSeverity ?? null,
        overallRiskLevel,
        additionalMeasures: input.additionalMeasures || null,
        responsiblePersonName: input.responsiblePersonName?.trim() || null,
        responsiblePersonAddress: input.responsiblePersonAddress?.trim() || null,
        assessorName: input.assessorName?.trim() || null,
        assessorOrganisation: input.assessorOrganisation?.trim() || null,
        createdAt: now,
        updatedAt: now,
      })
      .select("*")
      .single();

    if (error || !data) {
      throw { code: "FIRE_RISK_CREATE_FAILED", message: error?.message || "Could not create fire risk assessment" };
    }

    revalidatePath("/dashboard/fire-risk");
    return { success: true as const, data };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Could not create fire risk assessment";
    return { success: false as const, error: message };
  }
}

export async function updateFireRiskAssessment(
  id: string,
  input: {
    title?: string;
    buildingName?: string;
    buildingAddress?: string | null;
    assessedById?: string | null;
    assessedAt?: string | null;
    reviewDate?: string | null;
    status?: string;
    ignitionSources?: string | null;
    fuelSources?: string | null;
    oxygenSources?: string | null;
    peopleAtRisk?: string | null;
    maxOccupancy?: number | null;
    fireDetection?: string | null;
    fireAlarmSystem?: string | null;
    emergencyLighting?: string | null;
    fireExtinguishers?: string | null;
    escapeRoutes?: string | null;
    signage?: string | null;
    likelihoodOfFire?: number | null;
    consequenceSeverity?: number | null;
    additionalMeasures?: string | null;
    responsiblePersonName?: string | null;
    responsiblePersonAddress?: string | null;
    assessorName?: string | null;
    assessorOrganisation?: string | null;
  },
) {
  try {
    const { tenantId } = await getActionContext();

    const { data: existing } = await getAdminDb()
      .from("FireRiskAssessment")
      .select("*")
      .eq("id", id)
      .eq("tenantId", tenantId)
      .maybeSingle();

    if (!existing) {
      return { success: false as const, error: "Fire risk assessment not found" };
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (input.title !== undefined) updateData.title = input.title.trim();
    if (input.buildingName !== undefined) updateData.buildingName = input.buildingName.trim();
    if (input.buildingAddress !== undefined) updateData.buildingAddress = input.buildingAddress?.trim() || null;
    if (input.assessedById !== undefined) updateData.assessedById = input.assessedById;
    if (input.assessedAt !== undefined) updateData.assessedAt = toIso(input.assessedAt);
    if (input.reviewDate !== undefined) updateData.reviewDate = toIso(input.reviewDate);
    if (input.status !== undefined) updateData.status = input.status;
    if (input.ignitionSources !== undefined) updateData.ignitionSources = input.ignitionSources;
    if (input.fuelSources !== undefined) updateData.fuelSources = input.fuelSources;
    if (input.oxygenSources !== undefined) updateData.oxygenSources = input.oxygenSources;
    if (input.peopleAtRisk !== undefined) updateData.peopleAtRisk = input.peopleAtRisk;
    if (input.maxOccupancy !== undefined) updateData.maxOccupancy = input.maxOccupancy;
    if (input.fireDetection !== undefined) updateData.fireDetection = input.fireDetection?.trim() || null;
    if (input.fireAlarmSystem !== undefined) updateData.fireAlarmSystem = input.fireAlarmSystem?.trim() || null;
    if (input.emergencyLighting !== undefined) updateData.emergencyLighting = input.emergencyLighting?.trim() || null;
    if (input.fireExtinguishers !== undefined) updateData.fireExtinguishers = input.fireExtinguishers?.trim() || null;
    if (input.escapeRoutes !== undefined) updateData.escapeRoutes = input.escapeRoutes?.trim() || null;
    if (input.signage !== undefined) updateData.signage = input.signage?.trim() || null;
    if (input.additionalMeasures !== undefined) updateData.additionalMeasures = input.additionalMeasures;
    if (input.responsiblePersonName !== undefined) {
      updateData.responsiblePersonName = input.responsiblePersonName?.trim() || null;
    }
    if (input.responsiblePersonAddress !== undefined) {
      updateData.responsiblePersonAddress = input.responsiblePersonAddress?.trim() || null;
    }
    if (input.assessorName !== undefined) updateData.assessorName = input.assessorName?.trim() || null;
    if (input.assessorOrganisation !== undefined) {
      updateData.assessorOrganisation = input.assessorOrganisation?.trim() || null;
    }

    const likelihood = input.likelihoodOfFire ?? existing.likelihoodOfFire;
    const severity = input.consequenceSeverity ?? existing.consequenceSeverity;
    if (input.likelihoodOfFire !== undefined) updateData.likelihoodOfFire = input.likelihoodOfFire;
    if (input.consequenceSeverity !== undefined) updateData.consequenceSeverity = input.consequenceSeverity;
    if (likelihood && severity) {
      updateData.overallRiskLevel = calculateOverallRisk(likelihood, severity);
    }

    if (input.status === "COMPLETED") {
      const merged = { ...existing, ...updateData };
      const valid = validateFireRiskRecorded(merged);
      if (valid.ok === false) {
        return { success: false as const, error: valid.message };
      }
    }

    const { data, error } = await getAdminDb()
      .from("FireRiskAssessment")
      .update(updateData)
      .eq("id", id)
      .eq("tenantId", tenantId)
      .select("*")
      .single();

    if (error || !data) {
      throw { code: "FIRE_RISK_UPDATE_FAILED", message: error?.message || "Could not update fire risk assessment" };
    }

    revalidatePath("/dashboard/fire-risk");
    revalidatePath(`/dashboard/fire-risk/${id}`);
    return { success: true as const, data };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Could not update fire risk assessment";
    return { success: false as const, error: message };
  }
}

export async function completeFireRiskAssessment(id: string) {
  try {
    const { tenantId } = await getActionContext();
    const { data: existing } = await getAdminDb()
      .from("FireRiskAssessment")
      .select("*")
      .eq("id", id)
      .eq("tenantId", tenantId)
      .maybeSingle();

    if (!existing) {
      return { success: false as const, error: "Fire risk assessment not found" };
    }

    const valid = validateFireRiskRecorded(existing);
    if (valid.ok === false) {
      return { success: false as const, error: valid.message };
    }

    const { data, error } = await getAdminDb()
      .from("FireRiskAssessment")
      .update({ status: "COMPLETED", updatedAt: new Date().toISOString() })
      .eq("id", id)
      .eq("tenantId", tenantId)
      .select("*")
      .single();

    if (error || !data) {
      throw { code: "FIRE_RISK_COMPLETE_FAILED", message: error?.message || "Could not complete fire risk assessment" };
    }

    revalidatePath("/dashboard/fire-risk");
    revalidatePath(`/dashboard/fire-risk/${id}`);
    revalidatePath("/ansatt/brannoevelser");
    return { success: true as const, data };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Could not complete fire risk assessment";
    return { success: false as const, error: message };
  }
}

export async function deleteFireRiskAssessment(id: string) {
  try {
    const { tenantId } = await getActionContext();

    const { data: existing } = await getAdminDb()
      .from("FireRiskAssessment")
      .select("id, status")
      .eq("id", id)
      .eq("tenantId", tenantId)
      .maybeSingle();

    if (!existing) {
      return { success: false as const, error: "Fire risk assessment not found" };
    }

    const { error } = await getAdminDb()
      .from("FireRiskAssessment")
      .update({ status: "ARCHIVED", updatedAt: new Date().toISOString() })
      .eq("id", id)
      .eq("tenantId", tenantId);

    if (error) {
      throw { code: "FIRE_RISK_DELETE_FAILED", message: error.message };
    }

    revalidatePath("/dashboard/fire-risk");
    return { success: true as const };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Could not archive fire risk assessment";
    return { success: false as const, error: message };
  }
}
