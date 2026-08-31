"use server";

import { revalidatePath } from "next/cache";
import { getAdminDb } from "@/lib/supabase/admin";
import { createId } from "@/lib/ids";
import { generateSequenceNumber } from "@/lib/sequence";
import { onIncidentCreated, onIncidentClosed } from "@/features/hms-ai/lib/event-handler";
import { getRequiredTenantContext } from "@/lib/tenant-context";
import { getAuthContext } from "@/lib/server-authorization";
import {
  createIncidentSchema,
  updateIncidentSchema,
  investigateIncidentSchema,
  closeIncidentSchema,
} from "@/features/incidents/schemas/incident.schema";
import { notifyUsersByRoles } from "./notification.actions";
import { IncidentStage, IncidentStatus } from "@prisma/client";
import {
  parseModuleVisibilityConfig,
  getNotifyRolesForModule,
} from "@/lib/module-visibility";
import { dispatchNewIncidentNotifications } from "@/lib/incident-notification-routing.server";
import { CLOSE_LOOP_MESSAGES, evaluateIncidentCloseLoop } from "@/lib/incident-close-loop";
import { normalizeProjectReference } from "@/lib/incident-project-reference";
import { resolveIncidentProjectId } from "@/lib/incident-project-reference.server";
import {
  loadIncidentDetail,
  loadIncidentsForList,
} from "@/server/queries/incidents.queries";

type SessionUser = { id: string; email: string; name: string | null };

async function getSessionContext(): Promise<{ user: SessionUser; tenantId: string }> {
  const context = await getRequiredTenantContext();
  const { data: user, error } = await getAdminDb()
    .from("User")
    .select("id, email, name")
    .eq("id", context.userId)
    .maybeSingle();

  if (error) {
    throw { code: "USER_LOOKUP_FAILED", message: error.message };
  }
  if (!user) {
    throw { code: "UNAUTHORIZED", message: "Unauthorised" };
  }

  return {
    user: user as SessionUser,
    tenantId: context.tenantId,
  };
}

async function getTenantModuleVisibility(tenantId: string) {
  const { data: tenant } = await getAdminDb()
    .from("Tenant")
    .select("moduleVisibilityConfig")
    .eq("id", tenantId)
    .maybeSingle();
  return parseModuleVisibilityConfig(tenant?.moduleVisibilityConfig);
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

const sanitizeString = (value?: string | null) => {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const parseOptionalNumber = (value: unknown) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const parseBoolean = (value: unknown) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value.toLowerCase() === "true") return true;
    if (value.toLowerCase() === "false") return false;
  }
  return undefined;
};

const parseOptionalDate = (value: unknown) => {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value as string);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const normalizeSuggestedMeasures = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item, index, array) => item.length > 0 && array.indexOf(item) === index)
    .slice(0, 5);
};

const assertTenantScopedRelations = async (input: {
  tenantId: string;
  projectId?: string | null;
  riskReferenceId?: string | null;
  reportedForUserId?: string | null;
}): Promise<void> => {
  const db = getAdminDb();

  if (input.projectId) {
    const { data: project } = await db
      .from("Project")
      .select("id")
      .eq("id", input.projectId)
      .eq("tenantId", input.tenantId)
      .maybeSingle();
    if (!project) {
      throw { code: "PROJECT_NOT_FOUND", message: "Project does not exist in this organisation" };
    }
  }

  if (input.riskReferenceId) {
    const { data: risk } = await db
      .from("Risk")
      .select("id")
      .eq("id", input.riskReferenceId)
      .eq("tenantId", input.tenantId)
      .maybeSingle();
    if (!risk) {
      throw { code: "RISK_NOT_FOUND", message: "Risk reference does not exist in this organisation" };
    }
  }

  if (input.reportedForUserId) {
    const { data: membership } = await db
      .from("UserTenant")
      .select("userId")
      .eq("userId", input.reportedForUserId)
      .eq("tenantId", input.tenantId)
      .maybeSingle();
    if (!membership) {
      throw {
        code: "REPORTED_FOR_NOT_FOUND",
        message: "The person this is reported for is not in this organisation",
      };
    }
  }
};

const stageFromStatus = (status: IncidentStatus): IncidentStage => {
  switch (status) {
    case "INVESTIGATING":
      return "UNDER_REVIEW";
    case "ACTION_TAKEN":
      return "ACTIONS_DEFINED";
    case "CLOSED":
      return "VERIFIED";
    case "OPEN":
    default:
      return "REPORTED";
  }
};

const buildCriticalStopWorkNotification = (incident: {
  id: string;
  type: string;
  title: string;
}): {
  type: "NEW_INCIDENT";
  title: string;
  message: string;
  link: string;
} => {
  return {
    type: "NEW_INCIDENT",
    title: "CRITICAL: Stopped work",
    message: `${incident.type}: ${incident.title} — stopped work needs immediate follow-up.`,
    link: `/dashboard/incidents/${incident.id}`,
  };
};

export async function getIncidents(_tenantId: string) {
  try {
    const auth = await getAuthContext();
    if (!auth) throw { code: "UNAUTHORIZED", message: "Not authenticated" };

    const canReadAll = auth.permissions.canReadIncidents;
    const canReadOwn = auth.permissions.canReadOwnIncidents;

    if (!canReadAll && !canReadOwn) {
      throw { code: "FORBIDDEN", message: "Not authorised to view the accident book" };
    }

    const incidents = await loadIncidentsForList({
      tenantId: auth.tenantId,
      reportedBy: canReadAll ? undefined : auth.userId,
    });

    return { success: true, data: incidents, ownOnly: !canReadAll };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : (error as { message?: string })?.message;
    return { success: false, error: message || "Could not load accident book entries" };
  }
}

export async function getIncident(id: string) {
  try {
    const auth = await getAuthContext();
    if (!auth) throw { code: "UNAUTHORIZED", message: "Not authenticated" };

    const canReadAll = auth.permissions.canReadIncidents;
    const canReadOwn = auth.permissions.canReadOwnIncidents;

    if (!canReadAll && !canReadOwn) {
      throw { code: "FORBIDDEN", message: "Not authorised to view the accident book" };
    }

    const incident = await loadIncidentDetail({
      id,
      tenantId: auth.tenantId,
      reportedBy: canReadAll ? undefined : auth.userId,
    });

    if (!incident) {
      return { success: false, error: "Incident not found" };
    }

    return { success: true, data: incident };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : (error as { message?: string })?.message;
    return { success: false, error: message || "Could not load incident" };
  }
}

export async function createIncident(input: Record<string, unknown>) {
  try {
    const { user, tenantId } = await getSessionContext();
    const normalizedInput = {
      ...input,
      tenantId,
      reportedBy: user.id,
      occurredAt: new Date(input.occurredAt as string),
      lostTimeMinutes: parseOptionalNumber(input.lostTimeMinutes),
      lostWorkdays: parseOptionalNumber(input.lostWorkdays),
      medicalAttentionRequired: parseBoolean(input.medicalAttentionRequired),
      isFatal: parseBoolean(input.isFatal) ?? false,
      isLostTimeIncident: parseBoolean(input.isLostTimeIncident) ?? false,
      isRestrictedWork: parseBoolean(input.isRestrictedWork) ?? false,
      shareWithSafetyRepsConsent: parseBoolean(input.shareWithSafetyRepsConsent) ?? false,
      reporterAcknowledged: parseBoolean(input.reporterAcknowledged) ?? false,
      specifiedInjury: parseBoolean(input.specifiedInjury) ?? false,
      listedOccupationalDisease: parseBoolean(input.listedOccupationalDisease) ?? false,
      listedDangerousOccurrence: parseBoolean(input.listedDangerousOccurrence) ?? false,
      nonWorkerTakenToHospital: parseBoolean(input.nonWorkerTakenToHospital) ?? false,
      overThreeDayInjury: parseBoolean(input.overThreeDayInjury) ?? false,
      responseDeadline: parseOptionalDate(input.responseDeadline),
      customerSatisfaction: parseOptionalNumber(input.customerSatisfaction),
      subcategoryKeys: Array.isArray(input.subcategoryKeys) ? input.subcategoryKeys : [],
      aiSuggestedMeasures: normalizeSuggestedMeasures(input.aiSuggestedMeasures),
    };
    const validated = createIncidentSchema.parse(normalizedInput);
    await assertTenantScopedRelations({
      tenantId,
      projectId: validated.projectId ?? null,
      riskReferenceId: validated.riskReferenceId ?? null,
      reportedForUserId: validated.reportedForUserId ?? null,
    });

    const avviksnummer = await generateSequenceNumber(
      validated.tenantId,
      "AVVIK",
      new Date(validated.occurredAt).getFullYear()
    );

    const projectReference = normalizeProjectReference(validated.projectReference);
    const projectId = await resolveIncidentProjectId({
      tenantId,
      projectId: validated.projectId ?? null,
      projectReference,
    });

    const { assessRiddor } = await import("@/lib/riddor");
    const riddor = assessRiddor({
      type: validated.type,
      isFatal: validated.isFatal ?? false,
      specifiedInjury: validated.specifiedInjury ?? false,
      overSevenDayInjury: Boolean(input.overSevenDayInjury),
      lostWorkdays: validated.lostWorkdays,
      listedOccupationalDisease: validated.listedOccupationalDisease ?? false,
      listedDangerousOccurrence: validated.listedDangerousOccurrence ?? false,
      nonWorkerTakenToHospital: validated.nonWorkerTakenToHospital ?? false,
      occurredAt: validated.occurredAt,
    });

    const now = new Date().toISOString();
    const incidentId = createId();
    const db = getAdminDb();
    const { data: incident, error } = await db
      .from("Incident")
      .insert({
        id: incidentId,
        tenantId: validated.tenantId,
        avviksnummer,
        type: validated.type,
        title: validated.title,
        description: validated.description,
        severity: validated.severity ?? null,
        occurredAt: validated.occurredAt.toISOString(),
        reportedBy: user.id,
        reportedForUserId: validated.reportedForUserId ?? null,
        location: sanitizeString(validated.location),
        witnessName: sanitizeString(validated.witnessName),
        immediateAction: sanitizeString(validated.immediateAction),
        injuryType: sanitizeString(validated.injuryType),
        medicalAttentionRequired: validated.medicalAttentionRequired ?? false,
        lostTimeMinutes: validated.lostTimeMinutes ?? null,
        riskReferenceId: validated.riskReferenceId ?? null,
        customerName: sanitizeString(validated.customerName),
        customerEmail: sanitizeString(validated.customerEmail),
        customerPhone: sanitizeString(validated.customerPhone),
        customerTicketId: sanitizeString(validated.customerTicketId),
        responseDeadline: validated.responseDeadline?.toISOString() ?? null,
        customerSatisfaction: validated.customerSatisfaction ?? null,
        projectId,
        projectReference,
        subcategoryKeys: validated.subcategoryKeys?.length
          ? JSON.stringify(validated.subcategoryKeys)
          : null,
        involvedPersons: sanitizeString(validated.involvedPersons),
        injuryDescription: sanitizeString(validated.injuryDescription),
        suggestedActions: sanitizeString(validated.suggestedActions),
        injuredPersonOccupation: sanitizeString(validated.injuredPersonOccupation),
        injuredPersonAddress: sanitizeString(validated.injuredPersonAddress),
        injuredPersonRole: validated.injuredPersonRole ?? null,
        witnessAddress: sanitizeString(validated.witnessAddress),
        shareWithSafetyRepsConsent: validated.shareWithSafetyRepsConsent ?? false,
        reporterAcknowledged: validated.reporterAcknowledged ?? false,
        specifiedInjury: validated.specifiedInjury ?? false,
        listedOccupationalDisease: validated.listedOccupationalDisease ?? false,
        listedDangerousOccurrence: validated.listedDangerousOccurrence ?? false,
        nonWorkerTakenToHospital: validated.nonWorkerTakenToHospital ?? false,
        overThreeDayInjury: validated.overThreeDayInjury ?? false,
        isFatal: validated.isFatal ?? false,
        isLostTimeIncident: validated.isLostTimeIncident ?? false,
        lostWorkdays: validated.lostWorkdays ?? null,
        isRestrictedWork: validated.isRestrictedWork ?? false,
        riddorReportable: riddor.reportable,
        riddorCategory: riddor.category,
        riddorDueAt: riddor.dueAt?.toISOString() ?? null,
        overSevenDayInjury: Boolean(input.overSevenDayInjury),
        accidentBookEntry: riddor.accidentBookEntry,
        stage: IncidentStage.REPORTED,
        updatedAt: now,
      })
      .select("*")
      .maybeSingle();

    if (error || !incident) {
      throw { code: "INCIDENT_CREATE_FAILED", message: error?.message || "Could not record incident" };
    }

    if (normalizedInput.aiSuggestedMeasures.length > 0) {
      const dueAt = new Date();
      dueAt.setDate(dueAt.getDate() + 14);
      await db.from("Measure").insert(
        normalizedInput.aiSuggestedMeasures.map((title) => ({
          id: createId(),
          tenantId,
          incidentId: incident.id,
          title,
          description: "AI-suggested action from incident analysis. Confirm owner and effect.",
          dueAt: dueAt.toISOString(),
          responsibleId: user.id,
          category: "CORRECTIVE",
          followUpFrequency: "ANNUAL",
          updatedAt: now,
        }))
      );
    }

    void (async () => {
      try {
        await insertAuditLog({
          tenantId,
          userId: user.id,
          action: "INCIDENT_CREATED",
          resource: `Incident:${incident.id}`,
          metadata: {
            title: incident.title,
            type: incident.type,
            severity: incident.severity,
          },
        });
        const visConfig = await getTenantModuleVisibility(tenantId);
        const notifyRoles = getNotifyRolesForModule(visConfig, "incidents", ["ADMIN", "HMS", "LEDER"]);
        await dispatchNewIncidentNotifications({
          tenantId,
          reporterId: user.id,
          projectId: incident.projectId,
          fallbackRoles: notifyRoles,
          incidentId: incident.id,
          title: incident.title,
          typeLabel: incident.type,
        });
        if (incident.isRestrictedWork || (incident.severity ?? 0) >= 5) {
          const criticalRoles = getNotifyRolesForModule(visConfig, "incidents", ["ADMIN", "HMS"]);
          await notifyUsersByRoles(
            tenantId,
            criticalRoles,
            buildCriticalStopWorkNotification(incident),
          );
        }
      } catch {
        // Notifications must not block the reporter
      }
    })();

    revalidatePath("/dashboard/incidents");
    onIncidentCreated(tenantId, incident.id).catch(() => {});

    return { success: true, data: incident };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : (error as { message?: string })?.message;
    return { success: false, error: message || "Could not record incident" };
  }
}

export async function updateIncident(input: Record<string, unknown>) {
  try {
    const { user, tenantId } = await getSessionContext();
    const normalizedInput = {
      ...input,
      occurredAt: input.occurredAt ? new Date(input.occurredAt as string) : undefined,
      lostTimeMinutes: parseOptionalNumber(input.lostTimeMinutes),
      lostWorkdays: parseOptionalNumber(input.lostWorkdays),
      medicalAttentionRequired: parseBoolean(input.medicalAttentionRequired),
      isFatal: parseBoolean(input.isFatal),
      isLostTimeIncident: parseBoolean(input.isLostTimeIncident),
      isRestrictedWork: parseBoolean(input.isRestrictedWork),
      responseDeadline: parseOptionalDate(input.responseDeadline),
      customerSatisfaction: parseOptionalNumber(input.customerSatisfaction),
      subcategoryKeys: Array.isArray(input.subcategoryKeys) ? input.subcategoryKeys : undefined,
    };
    const validated = updateIncidentSchema.parse(normalizedInput);
    await assertTenantScopedRelations({
      tenantId,
      projectId: validated.projectId,
      riskReferenceId: validated.riskReferenceId,
    });

    const db = getAdminDb();
    const { data: existingIncident } = await db
      .from("Incident")
      .select("*")
      .eq("id", validated.id)
      .eq("tenantId", tenantId)
      .maybeSingle();

    if (!existingIncident) {
      return { success: false, error: "Incident not found" };
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (validated.title) updateData.title = validated.title;
    if (validated.description) updateData.description = validated.description;
    if (validated.type) updateData.type = validated.type;
    if (validated.severity !== undefined) updateData.severity = validated.severity;
    if (validated.occurredAt) updateData.occurredAt = validated.occurredAt.toISOString();
    if (validated.location !== undefined) updateData.location = sanitizeString(validated.location);
    if (validated.witnessName !== undefined) updateData.witnessName = sanitizeString(validated.witnessName);
    if (validated.immediateAction !== undefined) updateData.immediateAction = sanitizeString(validated.immediateAction);
    if (validated.rootCause !== undefined) updateData.rootCause = validated.rootCause;
    if (validated.contributingFactors !== undefined) updateData.contributingFactors = validated.contributingFactors;
    if (validated.injuryType !== undefined) updateData.injuryType = sanitizeString(validated.injuryType);
    if (validated.medicalAttentionRequired !== undefined) updateData.medicalAttentionRequired = validated.medicalAttentionRequired;
    if (validated.lostTimeMinutes !== undefined) updateData.lostTimeMinutes = validated.lostTimeMinutes;
    if (validated.riskReferenceId !== undefined) updateData.riskReferenceId = validated.riskReferenceId ?? null;
    if (validated.measureEffectiveness) updateData.measureEffectiveness = validated.measureEffectiveness;
    if (validated.customerName !== undefined) updateData.customerName = sanitizeString(validated.customerName);
    if (validated.customerEmail !== undefined) updateData.customerEmail = sanitizeString(validated.customerEmail);
    if (validated.customerPhone !== undefined) updateData.customerPhone = sanitizeString(validated.customerPhone);
    if (validated.customerTicketId !== undefined) updateData.customerTicketId = sanitizeString(validated.customerTicketId);
    if (validated.responseDeadline !== undefined) {
      updateData.responseDeadline = validated.responseDeadline?.toISOString() ?? null;
    }
    if (validated.customerSatisfaction !== undefined) updateData.customerSatisfaction = validated.customerSatisfaction ?? null;
    if (validated.projectId !== undefined) updateData.projectId = validated.projectId ?? null;
    if (validated.projectReference !== undefined) {
      updateData.projectReference = normalizeProjectReference(validated.projectReference);
    }
    if (validated.subcategoryKeys !== undefined) {
      updateData.subcategoryKeys = validated.subcategoryKeys.length
        ? JSON.stringify(validated.subcategoryKeys)
        : null;
    }
    if (validated.involvedPersons !== undefined) updateData.involvedPersons = sanitizeString(validated.involvedPersons);
    if (validated.injuryDescription !== undefined) updateData.injuryDescription = sanitizeString(validated.injuryDescription);
    if (validated.suggestedActions !== undefined) updateData.suggestedActions = sanitizeString(validated.suggestedActions);
    if (validated.isFatal !== undefined) updateData.isFatal = validated.isFatal;
    if (validated.isLostTimeIncident !== undefined) updateData.isLostTimeIncident = validated.isLostTimeIncident;
    if (validated.lostWorkdays !== undefined) updateData.lostWorkdays = validated.lostWorkdays;
    if (validated.isRestrictedWork !== undefined) updateData.isRestrictedWork = validated.isRestrictedWork;
    if (validated.source !== undefined) updateData.source = validated.source;

    let stageToPersist = validated.stage;
    if (!stageToPersist && validated.status) {
      stageToPersist = stageFromStatus(validated.status);
    }
    if (stageToPersist && stageToPersist !== existingIncident.stage) {
      updateData.stage = stageToPersist;
    }
    if (validated.status) {
      updateData.status = validated.status;
    }

    const { data: incident, error } = await db
      .from("Incident")
      .update(updateData)
      .eq("id", validated.id)
      .eq("tenantId", tenantId)
      .select("*")
      .maybeSingle();

    if (error || !incident) {
      throw { code: "INCIDENT_UPDATE_FAILED", message: error?.message || "Could not update incident" };
    }

    const statusChanged = existingIncident.status !== incident.status;
    const becameStopWork = existingIncident.isRestrictedWork !== true && incident.isRestrictedWork === true;
    const substantiveFields = [
      "injuryDescription", "involvedPersons", "rootCause", "contributingFactors",
      "immediateAction", "suggestedActions", "injuryType", "medicalAttentionRequired",
      "isFatal", "isLostTimeIncident", "measureEffectiveness",
    ] as const;
    const substantiveChange = !statusChanged && substantiveFields.some(
      (field) => updateData[field] !== undefined && updateData[field] !== existingIncident[field],
    );

    void (async () => {
      try {
        await insertAuditLog({
          tenantId,
          userId: user.id,
          action: "INCIDENT_UPDATED",
          resource: `Incident:${incident.id}`,
          metadata: { title: incident.title },
        });
        const visConfig = await getTenantModuleVisibility(tenantId);
        if (statusChanged) {
          const notifyRoles = getNotifyRolesForModule(visConfig, "incidents", ["ADMIN", "HMS", "LEDER"]);
          await notifyUsersByRoles(tenantId, notifyRoles, {
            type: "INCIDENT_UPDATED",
            title: "Incident updated",
            message: `${incident.type}: ${incident.title} — status changed to ${incident.status}`,
            link: `/dashboard/incidents/${incident.id}`,
          });
        } else if (substantiveChange) {
          const changedLabels: string[] = [];
          if (updateData.injuryDescription !== undefined) changedLabels.push("injury description");
          if (updateData.involvedPersons !== undefined) changedLabels.push("people involved");
          if (updateData.rootCause !== undefined) changedLabels.push("root cause");
          if (updateData.contributingFactors !== undefined) changedLabels.push("contributing factors");
          if (updateData.immediateAction !== undefined) changedLabels.push("immediate action");
          if (updateData.suggestedActions !== undefined) changedLabels.push("suggested actions");
          if (updateData.measureEffectiveness !== undefined) changedLabels.push("action effectiveness");
          if (updateData.isFatal !== undefined || updateData.isLostTimeIncident !== undefined) {
            changedLabels.push("severity / RIDDOR flags");
          }

          const notifyRoles = getNotifyRolesForModule(visConfig, "incidents", ["ADMIN", "HMS"]);
          await notifyUsersByRoles(tenantId, notifyRoles, {
            type: "INCIDENT_UPDATED",
            title: "New information added to incident",
            message: `${incident.type}: ${incident.title} — updated: ${changedLabels.join(", ")}`,
            link: `/dashboard/incidents/${incident.id}`,
          });
        }
        if (becameStopWork || (incident.severity ?? 0) >= 5) {
          const criticalRoles = getNotifyRolesForModule(visConfig, "incidents", ["ADMIN", "HMS"]);
          await notifyUsersByRoles(
            tenantId,
            criticalRoles,
            buildCriticalStopWorkNotification(incident),
          );
        }
      } catch {
        // Notifications must not block the handler
      }
    })();

    revalidatePath("/dashboard/incidents");
    revalidatePath(`/dashboard/incidents/${incident.id}`);
    return { success: true, data: incident };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : (error as { message?: string })?.message;
    return { success: false, error: message || "Could not update incident" };
  }
}

export async function investigateIncident(input: Record<string, unknown>) {
  try {
    const { user, tenantId } = await getSessionContext();
    const validated = investigateIncidentSchema.parse(input);
    const db = getAdminDb();

    const { data: incident, error } = await db
      .from("Incident")
      .update({
        rootCause: validated.rootCause,
        contributingFactors: validated.contributingFactors,
        investigatedBy: user.id,
        investigatedAt: new Date().toISOString(),
        status: "INVESTIGATING",
        stage: IncidentStage.ROOT_CAUSE,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", validated.id)
      .eq("tenantId", tenantId)
      .select("*")
      .maybeSingle();

    if (error || !incident) {
      throw { code: "INCIDENT_INVESTIGATE_FAILED", message: error?.message || "Could not save investigation" };
    }

    void (async () => {
      try {
        await insertAuditLog({
          tenantId,
          userId: user.id,
          action: "INCIDENT_INVESTIGATED",
          resource: `Incident:${incident.id}`,
          metadata: { title: incident.title, rootCause: validated.rootCause },
        });
        const visConfig = await getTenantModuleVisibility(tenantId);
        const notifyRoles = getNotifyRolesForModule(visConfig, "incidents", ["ADMIN", "HMS", "LEDER"]);
        await notifyUsersByRoles(tenantId, notifyRoles, {
          type: "INCIDENT_UPDATED",
          title: "Root cause analysis completed",
          message: `${incident.type}: ${incident.title} — investigated by ${user.name ?? "unknown"}`,
          link: `/dashboard/incidents/${incident.id}`,
        });
      } catch {
        // Notifications must not block the investigator
      }
    })();

    revalidatePath("/dashboard/incidents");
    revalidatePath(`/dashboard/incidents/${incident.id}`);
    return { success: true, data: incident };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : (error as { message?: string })?.message;
    return { success: false, error: message || "Could not save investigation" };
  }
}

export async function closeIncident(input: Record<string, unknown>) {
  try {
    const { user, tenantId } = await getSessionContext();
    const validated = closeIncidentSchema.parse(input);
    const db = getAdminDb();

    const { data: measures } = await db
      .from("Measure")
      .select("status")
      .eq("incidentId", validated.id)
      .eq("tenantId", tenantId);

    const { data: existing } = await db
      .from("Incident")
      .select("*")
      .eq("id", validated.id)
      .eq("tenantId", tenantId)
      .maybeSingle();
    if (!existing) {
      return { success: false, error: "Incident not found" };
    }

    const { canCloseUkIncident } = await import("@/lib/incident-uk-handling");
    if (
      !canCloseUkIncident({
        ...existing,
        riddorReportable: Boolean(existing.riddorReportable),
        measures: (measures ?? []).map((measure) => ({ status: String(measure.status) })),
        status: String(existing.status),
      })
    ) {
      return {
        success: false,
        error: "Complete the accident book and RIDDOR fields, and the investigation, before closing.",
      };
    }

    const loop = evaluateIncidentCloseLoop({
      measureStatuses: (measures ?? []).map((measure) => String(measure.status)),
      noActionReason: validated.noActionReason,
    });
    if (loop.ok !== true) {
      return { success: false, error: CLOSE_LOOP_MESSAGES[loop.code] };
    }

    const { data: incident, error } = await db
      .from("Incident")
      .update({
        status: "CLOSED",
        closedBy: user.id,
        closedAt: new Date().toISOString(),
        effectivenessReview: validated.effectivenessReview,
        lessonsLearned:
          loop.path === "no_action"
            ? [`No action: ${validated.noActionReason?.trim()}`, validated.lessonsLearned]
                .filter(Boolean)
                .join("\n\n")
            : validated.lessonsLearned,
        measureEffectiveness: validated.measureEffectiveness,
        stage: IncidentStage.VERIFIED,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", validated.id)
      .eq("tenantId", tenantId)
      .select("*")
      .maybeSingle();

    if (error || !incident) {
      throw { code: "INCIDENT_CLOSE_FAILED", message: error?.message || "Could not close incident" };
    }

    void (async () => {
      try {
        await insertAuditLog({
          tenantId,
          userId: user.id,
          action: "INCIDENT_CLOSED",
          resource: `Incident:${incident.id}`,
          metadata: {
            title: incident.title,
            effectivenessReview: validated.effectivenessReview,
          },
        });
        const visConfig = await getTenantModuleVisibility(tenantId);
        const notifyRoles = getNotifyRolesForModule(visConfig, "incidents", ["ADMIN", "HMS", "LEDER"]);
        await notifyUsersByRoles(tenantId, notifyRoles, {
          type: "INCIDENT_CLOSED",
          title: "Incident closed",
          message: `${incident.type}: ${incident.title} is now closed`,
          link: `/dashboard/incidents/${incident.id}`,
        });
      } catch {
        // Notifications must not block closure
      }
    })();

    revalidatePath("/dashboard/incidents");
    revalidatePath(`/dashboard/incidents/${incident.id}`);
    onIncidentClosed(tenantId, incident.id).catch(() => {});

    return { success: true, data: incident };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : (error as { message?: string })?.message;
    return { success: false, error: message || "Could not close incident" };
  }
}

export async function createUploadedIncident(formData: FormData) {
  try {
    const { user, tenantId } = await getSessionContext();
    const title = (formData.get("title") as string | null)?.trim() ?? "";
    const source = (formData.get("source") as string | null)?.trim() ?? "EXTERNAL";
    const file = formData.get("file") as File | null;

    if (!title || title.length < 3) {
      return { success: false, error: "Title must be at least 3 characters." };
    }
    if (source !== "INTERNAL" && source !== "EXTERNAL") {
      return { success: false, error: "Invalid source. Must be INTERNAL or EXTERNAL." };
    }

    const avviksnummer = await generateSequenceNumber(tenantId, "AVVIK", new Date().getFullYear());
    const now = new Date().toISOString();
    const db = getAdminDb();
    const { data: incident, error } = await db
      .from("Incident")
      .insert({
        id: createId(),
        tenantId,
        avviksnummer,
        type: "AVVIK",
        title,
        description:
          source === "EXTERNAL"
            ? "External record — see attached file for details."
            : "Record created via file upload.",
        severity: null,
        occurredAt: now,
        reportedBy: user.id,
        status: "OPEN",
        stage: IncidentStage.REPORTED,
        source,
        accidentBookEntry: true,
        updatedAt: now,
      })
      .select("*")
      .maybeSingle();

    if (error || !incident) {
      throw { code: "INCIDENT_UPLOAD_FAILED", message: error?.message || "Could not create record" };
    }

    if (file && file.size > 0) {
      const { getStorage, generateFileKey } = await import("@/lib/storage");
      const storage = getStorage();
      const fileKey = generateFileKey(tenantId, "incidents", file.name);
      await storage.upload(fileKey, file);
      await db.from("Attachment").insert({
        id: createId(),
        tenantId,
        incidentId: incident.id,
        fileKey,
        name: file.name,
        mime: file.type || "application/octet-stream",
        size: file.size,
      });
    }

    void (async () => {
      try {
        await insertAuditLog({
          tenantId,
          userId: user.id,
          action: "INCIDENT_CREATED",
          resource: `Incident:${incident.id}`,
          metadata: {
            title: incident.title,
            source,
            uploadedFile: file?.name ?? null,
          },
        });
        const visConfig = await getTenantModuleVisibility(tenantId);
        const notifyRoles = getNotifyRolesForModule(visConfig, "incidents", ["ADMIN", "HMS", "LEDER"]);
        await notifyUsersByRoles(tenantId, notifyRoles, {
          type: "NEW_INCIDENT",
          title: "New accident book entry",
          message: `${source === "EXTERNAL" ? "External" : "Internal"} record: ${incident.title}`,
          link: `/dashboard/incidents/${incident.id}`,
        });
      } catch {
        // Notifications must not block the reporter
      }
    })();

    revalidatePath("/dashboard/incidents");
    return { success: true, data: incident };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : (error as { message?: string })?.message;
    return { success: false, error: message || "Could not create record" };
  }
}

export async function deleteIncident(id: string) {
  try {
    const { user, tenantId } = await getSessionContext();
    const db = getAdminDb();

    const { data: incident } = await db
      .from("Incident")
      .select("*")
      .eq("id", id)
      .eq("tenantId", tenantId)
      .maybeSingle();

    if (!incident) {
      return { success: false, error: "Incident not found" };
    }

    const { data: attachments } = await db
      .from("Attachment")
      .select("fileKey")
      .eq("incidentId", id)
      .eq("tenantId", tenantId);

    const storage = await import("@/lib/storage").then((mod) => mod.getStorage());
    for (const attachment of attachments ?? []) {
      await storage.delete(attachment.fileKey);
    }

    await db.from("Attachment").delete().eq("incidentId", id).eq("tenantId", tenantId);
    await db.from("Incident").delete().eq("id", id).eq("tenantId", tenantId);

    await insertAuditLog({
      tenantId,
      userId: user.id,
      action: "INCIDENT_DELETED",
      resource: `Incident:${id}`,
      metadata: { title: incident.title },
    });

    revalidatePath("/dashboard/incidents");
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : (error as { message?: string })?.message;
    return { success: false, error: message || "Could not delete incident" };
  }
}

export async function getIncidentStats(_tenantId: string) {
  try {
    const { tenantId } = await getSessionContext();
    const { data: incidents } = await getAdminDb()
      .from("Incident")
      .select("status, type, severity, riddorReportable")
      .eq("tenantId", tenantId);

    const rows = incidents ?? [];
    const stats = {
      total: rows.length,
      open: rows.filter((row) => row.status === "OPEN").length,
      investigating: rows.filter((row) => row.status === "INVESTIGATING").length,
      actionTaken: rows.filter((row) => row.status === "ACTION_TAKEN").length,
      closed: rows.filter((row) => row.status === "CLOSED").length,
      riddor: rows.filter((row) => row.riddorReportable === true).length,
      byType: {
        ulykke: rows.filter((row) => row.type === "ULYKKE").length,
        nesten: rows.filter((row) => row.type === "NESTEN").length,
        sykdom: rows.filter((row) => row.type === "YRKESSYKDOM").length,
        miljo: rows.filter((row) => row.type === "MILJO").length,
        kvalitet: rows.filter((row) => row.type === "KVALITET").length,
      },
      bySeverity: {
        critical: rows.filter((row) => (row.severity ?? 0) >= 5).length,
        high: rows.filter((row) => row.severity === 4).length,
        medium: rows.filter((row) => row.severity === 3).length,
        low: rows.filter((row) => row.severity !== null && row.severity <= 2).length,
        notAssessed: rows.filter((row) => row.severity === null).length,
      },
    };

    return { success: true, data: stats };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : (error as { message?: string })?.message;
    return { success: false, error: message || "Could not load statistics" };
  }
}
