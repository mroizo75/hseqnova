import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getAdminDb } from "@/lib/supabase/admin";
import { IncidentStage, IncidentStatus, IncidentType } from "@prisma/client";
import { createNotification, notifyUsersByRoles } from "@/server/actions/notification.actions";
import { normalizeProjectReference } from "@/lib/incident-project-reference";
import { assessRiddor } from "@/lib/riddor";

function parseBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") {
    return value;
  }
  return undefined;
}

function parseNullableNumber(value: unknown): number | null | undefined {
  if (value === null) {
    return null;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value === "string") {
    if (value.trim().length === 0) {
      return null;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function parseNullableText(value: unknown): string | null | undefined {
  if (value === null) {
    return null;
  }
  if (typeof value !== "string") {
    return undefined;
  }
  return value.trim() || null;
}

function parseIncidentType(value: unknown): IncidentType | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim().toUpperCase();
  const validTypes = new Set<IncidentType>([
    "ULYKKE",
    "NESTEN",
    "FARLIG_SITUASJON",
    "YRKESSYKDOM",
    "AVVIK",
    "MILJO",
    "KVALITET",
    "CUSTOMER",
    "HMS",
    "SKADE",
  ]);

  return validTypes.has(normalized as IncidentType)
    ? (normalized as IncidentType)
    : undefined;
}

function parseProjectId(value: unknown): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: "No organisation access." }, { status: 403 });
    }

    const db = getAdminDb();
    const body = await request.json();
    const { status } = body;
    const responsibleId =
      typeof body.responsibleId === "string" && body.responsibleId.trim().length > 0
        ? body.responsibleId.trim()
        : null;
    const severity = parseNullableNumber(body.severity);
    if (severity !== null && severity !== undefined && (severity < 1 || severity > 5)) {
      return NextResponse.json({ error: "Invalid severity." }, { status: 400 });
    }
    const type = parseIncidentType(body.type);
    const projectId = parseProjectId(body.projectId);
    const projectReference =
      body.projectReference === undefined
        ? undefined
        : normalizeProjectReference(body.projectReference);
    const subcategoryKeys = Array.isArray(body.subcategoryKeys)
      ? body.subcategoryKeys.filter((value: unknown): value is string => typeof value === "string")
      : undefined;
    if (body.type !== undefined && type === undefined) {
      return NextResponse.json({ error: "Invalid incident type." }, { status: 400 });
    }
    if (body.projectId !== undefined && projectId === undefined) {
      return NextResponse.json({ error: "Invalid project." }, { status: 400 });
    }
    if (projectId) {
      const { data: project } = await db
        .from("Project")
        .select("id")
        .eq("id", projectId)
        .eq("tenantId", tenantId)
        .maybeSingle();
      if (!project) {
        return NextResponse.json({ error: "Project does not exist in this organisation." }, { status: 400 });
      }
    }
    if (responsibleId) {
      const { data: membership } = await db
        .from("UserTenant")
        .select("id")
        .eq("userId", responsibleId)
        .eq("tenantId", tenantId)
        .maybeSingle();
      if (!membership) {
        return NextResponse.json(
          { error: "The assigned person is not in this organisation." },
          { status: 400 }
        );
      }
    }
    const source = typeof body.source === "string" && ["INTERNAL", "EXTERNAL"].includes(body.source)
      ? body.source
      : undefined;
    const medicalAttentionRequired = parseBoolean(body.medicalAttentionRequired);
    const isFatal = parseBoolean(body.isFatal);
    const isLostTimeIncident = parseBoolean(body.isLostTimeIncident);
    const isRestrictedWork = parseBoolean(body.isRestrictedWork);
    const lostWorkdays = parseNullableNumber(body.lostWorkdays);
    const isFirstAidCase = parseBoolean(body.isFirstAidCase);
    const isProductionStop = parseBoolean(body.isProductionStop);
    const productionStopHours = parseNullableNumber(body.productionStopHours);
    const isPropertyDamage = parseBoolean(body.isPropertyDamage);
    const estimatedDamageCost = parseNullableNumber(body.estimatedDamageCost);
    const isEnvironmentalRelease = parseBoolean(body.isEnvironmentalRelease);
    const overSevenDayInjury = parseBoolean(body.overSevenDayInjury);
    const environmentalDescription =
      typeof body.environmentalDescription === "string"
        ? body.environmentalDescription.trim() || null
        : undefined;
    const involvedPersons = parseNullableText(body.involvedPersons);
    const injuryType = parseNullableText(body.injuryType);
    const injuryDescription = parseNullableText(body.injuryDescription);
    const suggestedActions = parseNullableText(body.suggestedActions);
    const location = parseNullableText(body.location);
    const riddorReference = parseNullableText(body.riddorReference);
    const riddorReportedAt =
      body.riddorReportedAt === undefined
        ? undefined
        : body.riddorReportedAt === null || body.riddorReportedAt === ""
          ? null
          : new Date(body.riddorReportedAt as string);
    if (riddorReportedAt instanceof Date && Number.isNaN(riddorReportedAt.getTime())) {
      return NextResponse.json({ error: "Invalid RIDDOR report date." }, { status: 400 });
    }

    const requiresHseCompletion = status && status !== "OPEN";
    if (requiresHseCompletion && isLostTimeIncident && (lostWorkdays === null || lostWorkdays === undefined)) {
      return NextResponse.json(
        { error: "Lost workdays must be entered when a lost-time injury is selected." },
        { status: 400 }
      );
    }

    const stageMap: Record<IncidentStatus, IncidentStage> = {
      OPEN: "REPORTED",
      INVESTIGATING: "UNDER_REVIEW",
      ACTION_TAKEN: "ACTIONS_DEFINED",
      CLOSED: "VERIFIED",
    };

    const { data: existingIncident } = await db
      .from("Incident")
      .select("id, title, type, severity, isRestrictedWork, responsibleId, avviksnummer, occurredAt, injuryType, medicalAttentionRequired, isFatal, isLostTimeIncident, lostWorkdays, overSevenDayInjury")
      .eq("id", id)
      .eq("tenantId", tenantId)
      .maybeSingle();

    if (!existingIncident) {
      return NextResponse.json({ error: "Incident not found." }, { status: 404 });
    }

    const mergedType = type ?? existingIncident.type;
    const mergedFatal = isFatal ?? existingIncident.isFatal;
    const mergedLti = isLostTimeIncident ?? existingIncident.isLostTimeIncident;
    const mergedLostDays = lostWorkdays === undefined ? existingIncident.lostWorkdays : lostWorkdays;
    const mergedOverSeven = overSevenDayInjury ?? existingIncident.overSevenDayInjury;
    const mergedInjuryType = injuryType === undefined ? existingIncident.injuryType : injuryType;
    const mergedMedical = medicalAttentionRequired ?? existingIncident.medicalAttentionRequired;
    const riddor = assessRiddor({
      type: mergedType,
      isFatal: mergedFatal ?? false,
      isLostTimeIncident: mergedLti ?? false,
      lostWorkdays: mergedLostDays,
      overSevenDayInjury: mergedOverSeven ?? false,
      injuryType: mergedInjuryType,
      medicalAttentionRequired: mergedMedical ?? false,
      occurredAt: new Date(existingIncident.occurredAt),
    });

    const { data: incident, error } = await db
      .from("Incident")
      .update({
        type: type ?? undefined,
        subcategoryKeys:
          subcategoryKeys === undefined
            ? undefined
            : subcategoryKeys.length > 0
              ? JSON.stringify(subcategoryKeys)
              : null,
        projectId: projectId === undefined ? undefined : projectId,
        projectReference,
        status,
        severity,
        responsibleId,
        stage: stageMap[status as IncidentStatus] || "REPORTED",
        medicalAttentionRequired:
          medicalAttentionRequired === undefined ? undefined : medicalAttentionRequired,
        isFatal: isFatal === undefined ? undefined : isFatal,
        isLostTimeIncident: isLostTimeIncident === undefined ? undefined : isLostTimeIncident,
        isRestrictedWork: isRestrictedWork === undefined ? undefined : isRestrictedWork,
        lostWorkdays:
          lostWorkdays === undefined
            ? undefined
            : isLostTimeIncident
              ? lostWorkdays
              : null,
        isFirstAidCase: isFirstAidCase === undefined ? undefined : isFirstAidCase,
        isProductionStop: isProductionStop === undefined ? undefined : isProductionStop,
        productionStopHours:
          productionStopHours === undefined
            ? undefined
            : isProductionStop
              ? productionStopHours
              : null,
        isPropertyDamage: isPropertyDamage === undefined ? undefined : isPropertyDamage,
        estimatedDamageCost:
          estimatedDamageCost === undefined
            ? undefined
            : isPropertyDamage
              ? estimatedDamageCost
              : null,
        isEnvironmentalRelease: isEnvironmentalRelease === undefined ? undefined : isEnvironmentalRelease,
        environmentalDescription:
          environmentalDescription === undefined
            ? undefined
            : isEnvironmentalRelease
              ? environmentalDescription
              : null,
        involvedPersons,
        injuryType,
        injuryDescription,
        suggestedActions,
        location,
        source: source ?? undefined,
        overSevenDayInjury: overSevenDayInjury === undefined ? undefined : overSevenDayInjury,
        riddorReportable: riddor.reportable,
        riddorCategory: riddor.category,
        riddorDueAt: riddor.dueAt?.toISOString() ?? null,
        riddorReportedAt:
          riddorReportedAt === undefined
            ? undefined
            : riddorReportedAt
              ? riddorReportedAt.toISOString()
              : null,
        riddorReference: riddorReference === undefined ? undefined : riddorReference,
        accidentBookEntry: riddor.accidentBookEntry,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("tenantId", tenantId)
      .select("*")
      .maybeSingle();

    if (error || !incident) {
      return NextResponse.json({ error: error?.message || "Could not update incident." }, { status: 500 });
    }

    revalidatePath(`/dashboard/incidents/${id}`);
    revalidatePath("/dashboard/incidents");

    if (incident.responsibleId && incident.responsibleId !== existingIncident.responsibleId) {
      await createNotification({
        tenantId,
        userId: incident.responsibleId,
        type: "NEW_INCIDENT",
        title: "Incident assigned to you",
        message: `${incident.avviksnummer ?? incident.type}: ${incident.title} has been sent to you for handling.`,
        link: `/dashboard/incidents/${incident.id}`,
      });
    }

    const becameStopWork =
      existingIncident.isRestrictedWork !== true && incident.isRestrictedWork === true;
    if (becameStopWork || (incident.severity ?? 0) >= 5) {
      await notifyUsersByRoles(tenantId, ["ADMIN", "HMS"], {
        type: "NEW_INCIDENT",
        title: "CRITICAL: Stopped work",
        message: `${incident.type}: ${incident.title} — stopped work needs immediate follow-up.`,
        link: `/dashboard/incidents/${incident.id}`,
      });
    }

    return NextResponse.json({ success: true, incident });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal error while updating the incident.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
