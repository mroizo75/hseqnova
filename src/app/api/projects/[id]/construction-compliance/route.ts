import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { getAuthMembership } from "@/lib/auth-db";
import { AuditLog } from "@/lib/audit-log";
import {
  buildConstructionComplianceValidation,
  evaluatePreNotificationRequirement,
  validatePreNotificationForSubmission,
  validateShaPlanForActive,
} from "@/lib/construction-compliance-rules";
import type { Role } from "@prisma/client";
import { getPermissions } from "@/lib/permissions";
import {
  createErrorResponse,
  createSuccessResponse,
  ErrorCodes,
  handleApiError,
} from "@/lib/validations/api";
import { loadProjectSummary } from "@/server/queries/projects.queries";
import {
  insertRosterEntry,
  loadCdmChangeLogs,
  loadCdmEmployees,
  loadPreNotification,
  loadRosterChecks,
  loadRosterEntries,
  loadRosterEntry,
  loadShaPlan,
  loadTenantOrg,
  loadUsersByIds,
  toDateOnly,
  updateRosterEntry,
  upsertDailyCheck,
  upsertPreNotification,
  upsertShaPlan,
} from "@/server/queries/construction-compliance.queries";

const shaPlanSchema = z.object({
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).optional(),
  organizationChart: z.string().optional().nullable(),
  progressPlan: z.string().optional().nullable(),
  specificMeasures: z.string().optional().nullable(),
  changeProcedure: z.string().optional().nullable(),
  builderName: z.string().optional().nullable(),
  builderRepresentativeName: z.string().optional().nullable(),
  builderRepresentativeContact: z.string().optional().nullable(),
  coordinatorPlanningName: z.string().optional().nullable(),
  coordinatorExecutionName: z.string().optional().nullable(),
  conflictAssessmentDocumented: z.boolean().optional(),
  availableOnSite: z.boolean().optional(),
  lastReviewedAt: z.string().optional().nullable(),
});

const preNotificationSchema = z.object({
  status: z.enum(["DRAFT", "READY_TO_SUBMIT", "SUBMITTED", "UPDATED_AFTER_SUBMISSION"]).optional(),
  sentAt: z.string().optional().nullable(),
  submissionDate: z.string().optional().nullable(),
  projectAddress: z.string().min(2).optional(),
  projectType: z.string().min(2).optional(),
  builderName: z.string().min(2).optional(),
  builderOrgNumber: z.string().optional().nullable(),
  builderAddress: z.string().optional().nullable(),
  builderPhone: z.string().optional().nullable(),
  builderRepresentativeName: z.string().optional().nullable(),
  builderRepresentativePhone: z.string().optional().nullable(),
  coordinators: z.string().optional().nullable(),
  designers: z.string().optional().nullable(),
  contractors: z.string().optional().nullable(),
  expectedStartDate: z.string().optional(),
  expectedEndDate: z.string().optional().nullable(),
  maxWorkersSimultaneous: z.number().int().positive().optional().nullable(),
  plannedBusinessesCount: z.number().int().positive().optional().nullable(),
  visibleAtSite: z.boolean().optional(),
  localAuthority: z.string().optional().nullable(),
  clientDutyAcknowledged: z.boolean().optional(),
});

const updatePayloadSchema = z.object({
  shaPlan: shaPlanSchema.optional(),
  preNotification: preNotificationSchema.optional(),
});

const rosterEntrySchema = z.object({
  fullName: z.string().min(2),
  birthDate: z.string(),
  employerName: z.string().min(2),
  employerOrgNumber: z.string().optional().nullable(),
  hiringCompanyName: z.string().optional().nullable(),
  hmsCardNumber: z.string().optional().nullable(),
  startedAtSiteDate: z.string().optional().nullable(),
  endedAtSiteDate: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  notes: z.string().optional().nullable(),
});

const rosterCheckSchema = z.object({
  checkedDate: z.string(),
  notes: z.string().optional().nullable(),
});

const postPayloadSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("ADD_ROSTER_ENTRY"),
    data: rosterEntrySchema,
  }),
  z.object({
    action: z.literal("CHECK_ROSTER_DAY"),
    data: rosterCheckSchema,
  }),
]);

const patchPayloadSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("UPDATE_ROSTER_ENTRY"),
    rosterEntryId: z.string().min(1),
    data: rosterEntrySchema.partial(),
  }),
  z.object({
    action: z.literal("CLOSE_ROSTER_ENTRY"),
    rosterEntryId: z.string().min(1),
    endedAtSiteDate: z.string().optional(),
    notes: z.string().optional().nullable(),
  }),
]);

function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function toCsvValue(value: string | null | undefined): string {
  if (!value) return "";
  if (value.includes(",") || value.includes("\"") || value.includes("\n")) {
    return `"${value.replace(/"/g, "\"\"")}"`;
  }
  return value;
}

function normalizeValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "boolean" || typeof value === "number") return String(value);
  if (value instanceof Date) return value.toISOString();
  return JSON.stringify(value);
}

function buildChangedFields(
  previous: Record<string, unknown> | null | undefined,
  patch: Record<string, unknown>
) {
  return Object.entries(patch)
    .map(([field, nextValue]) => {
      const prevValue = previous?.[field];
      const previousNormalized = normalizeValue(prevValue);
      const nextNormalized = normalizeValue(nextValue);
      if (previousNormalized === nextNormalized) return null;
      return {
        field,
        from: previousNormalized || null,
        to: nextNormalized || null,
      };
    })
    .filter((item): item is { field: string; from: string | null; to: string | null } => item !== null);
}

function parseAuditMetadata(metadata: string | null) {
  if (!metadata) return null;
  try {
    return JSON.parse(metadata);
  } catch {
    return null;
  }
}

async function getTenantAndProject(projectId: string, userId: string, tenantId: string | null | undefined) {
  if (!tenantId) return null;
  const membership = await getAuthMembership(userId, tenantId);
  if (!membership) return null;

  const project = await loadProjectSummary(projectId, tenantId);
  if (!project) return null;

  return { tenantId, role: membership.role, project };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createErrorResponse(ErrorCodes.UNAUTHORIZED, "Not authenticated", 401);
    }

    const { id } = await params;
    const context = await getTenantAndProject(id, session.user.id, session.user.tenantId);
    if (!context) {
      return createErrorResponse(ErrorCodes.NOT_FOUND, "Project not found", 404);
    }
    const permissions = getPermissions(context.role as Role);
    if (!permissions.canReadConstructionCompliance) {
      return createErrorResponse(ErrorCodes.FORBIDDEN, "Insufficient access", 403);
    }

    const [tenant, shaPlan, preNotification, rosterEntries, rosterChecks, availableEmployees, changeLogs] =
      await Promise.all([
        loadTenantOrg(context.tenantId),
        loadShaPlan(context.project.id),
        loadPreNotification(context.project.id),
        loadRosterEntries(context.project.id, context.tenantId),
        loadRosterChecks(context.project.id, context.tenantId, 30),
        loadCdmEmployees(context.tenantId),
        loadCdmChangeLogs(context.tenantId, context.project.id),
      ]);

    const userMap = await loadUsersByIds(changeLogs.map((entry) => entry.userId));
    const latestCheck = rosterChecks[0];
    const todayKey = formatDateOnly(new Date());
    const latestCheckKey = latestCheck ? formatDateOnly(new Date(latestCheck.checkedDate)) : null;
    const hasActiveWorkers = rosterEntries.some((entry) => entry.isActive);
    const isDailyCheckMissing = hasActiveWorkers && latestCheckKey !== todayKey;
    const preNotificationRequirement = evaluatePreNotificationRequirement(preNotification);
    const complianceValidation = buildConstructionComplianceValidation(shaPlan, preNotification);

    const format = request.nextUrl.searchParams.get("format");
    if (format === "csv") {
      const headers = [
        "Name",
        "Date of birth",
        "Employer",
        "Company number",
        "Labour-hire company",
        "CSCS / card number",
        "Start date",
        "End date",
        "Active",
        "Notes",
      ];
      const lines = rosterEntries.map((entry) =>
        [
          entry.fullName,
          formatDateOnly(new Date(entry.birthDate)),
          entry.employerName,
          entry.employerOrgNumber,
          entry.hiringCompanyName,
          entry.hmsCardNumber,
          entry.startedAtSiteDate ? formatDateOnly(new Date(entry.startedAtSiteDate)) : "",
          entry.endedAtSiteDate ? formatDateOnly(new Date(entry.endedAtSiteDate)) : "",
          entry.isActive ? "Yes" : "No",
          entry.notes,
        ]
          .map((value) => toCsvValue(value))
          .join(",")
      );
      const csv = [headers.join(","), ...lines].join("\n");
      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename=\"site-register-${context.project.id}.csv\"`,
        },
      });
    }

    return createSuccessResponse({
      project: context.project,
      tenant,
      shaPlan,
      preNotification,
      rosterEntries,
      rosterChecks,
      availableEmployees,
      isDailyCheckMissing,
      latestCheckDate: latestCheck?.checkedDate ?? null,
      preNotificationRequirement,
      complianceValidation,
      changeLogs: changeLogs.map((entry) => {
        const user = userMap.get(entry.userId);
        return {
          id: entry.id,
          action: entry.action,
          createdAt: entry.createdAt,
          changedBy: user?.name || user?.email || "Unknown user",
          changedByEmail: user?.email ?? null,
          metadata: parseAuditMetadata(entry.metadata),
        };
      }),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createErrorResponse(ErrorCodes.UNAUTHORIZED, "Not authenticated", 401);
    }

    const payload = updatePayloadSchema.parse(await request.json());
    if (!payload.shaPlan && !payload.preNotification) {
      return createErrorResponse(ErrorCodes.VALIDATION_ERROR, "No update data provided", 400);
    }

    const { id } = await params;
    const context = await getTenantAndProject(id, session.user.id, session.user.tenantId);
    if (!context) {
      return createErrorResponse(ErrorCodes.NOT_FOUND, "Project not found", 404);
    }
    const permissions = getPermissions(context.role as Role);
    if (!permissions.canManageConstructionCompliance) {
      return createErrorResponse(ErrorCodes.FORBIDDEN, "Insufficient access", 403);
    }

    const [existingShaPlan, existingPreNotification] = await Promise.all([
      loadShaPlan(context.project.id),
      loadPreNotification(context.project.id),
    ]);

    const nextShaPlan = payload.shaPlan
      ? {
          ...existingShaPlan,
          ...payload.shaPlan,
        }
      : existingShaPlan;
    const nextPreNotification = payload.preNotification
      ? {
          ...existingPreNotification,
          ...payload.preNotification,
        }
      : existingPreNotification;

    if (payload.shaPlan?.status === "ACTIVE") {
      const shaValidation = validateShaPlanForActive(nextShaPlan);
      if (!shaValidation.isValid) {
        return createErrorResponse(
          ErrorCodes.VALIDATION_ERROR,
          `Construction Phase Plan is missing required fields before it can be set active: ${shaValidation.missingFields.join(", ")}`,
          400
        );
      }
    }

    const nextPreNotificationStatus = payload.preNotification?.status ?? nextPreNotification?.status;
    if (
      nextPreNotificationStatus &&
      ["SUBMITTED", "UPDATED_AFTER_SUBMISSION"].includes(nextPreNotificationStatus)
    ) {
      const preValidation = validatePreNotificationForSubmission(nextPreNotification);
      if (!preValidation.isValid) {
        return createErrorResponse(
          ErrorCodes.VALIDATION_ERROR,
          `F10 is missing required fields before submission: ${preValidation.missingFields.join(", ")}`,
          400
        );
      }
    }

    if (payload.shaPlan) {
      await upsertShaPlan({
        tenantId: context.tenantId,
        projectId: context.project.id,
        create: {
          status: payload.shaPlan.status ?? "DRAFT",
          organizationChart: payload.shaPlan.organizationChart ?? null,
          progressPlan: payload.shaPlan.progressPlan ?? null,
          specificMeasures: payload.shaPlan.specificMeasures ?? null,
          changeProcedure: payload.shaPlan.changeProcedure ?? null,
          builderName: payload.shaPlan.builderName ?? context.project.clientName ?? null,
          builderRepresentativeName: payload.shaPlan.builderRepresentativeName ?? null,
          builderRepresentativeContact: payload.shaPlan.builderRepresentativeContact ?? null,
          coordinatorPlanningName: payload.shaPlan.coordinatorPlanningName ?? null,
          coordinatorExecutionName: payload.shaPlan.coordinatorExecutionName ?? null,
          conflictAssessmentDocumented: payload.shaPlan.conflictAssessmentDocumented ?? false,
          availableOnSite: payload.shaPlan.availableOnSite ?? false,
          lastReviewedAt: payload.shaPlan.lastReviewedAt ?? null,
        },
        update: {
          ...(payload.shaPlan.status !== undefined && { status: payload.shaPlan.status }),
          ...(payload.shaPlan.organizationChart !== undefined && {
            organizationChart: payload.shaPlan.organizationChart,
          }),
          ...(payload.shaPlan.progressPlan !== undefined && {
            progressPlan: payload.shaPlan.progressPlan,
          }),
          ...(payload.shaPlan.specificMeasures !== undefined && {
            specificMeasures: payload.shaPlan.specificMeasures,
          }),
          ...(payload.shaPlan.changeProcedure !== undefined && {
            changeProcedure: payload.shaPlan.changeProcedure,
          }),
          ...(payload.shaPlan.builderName !== undefined && { builderName: payload.shaPlan.builderName }),
          ...(payload.shaPlan.builderRepresentativeName !== undefined && {
            builderRepresentativeName: payload.shaPlan.builderRepresentativeName,
          }),
          ...(payload.shaPlan.builderRepresentativeContact !== undefined && {
            builderRepresentativeContact: payload.shaPlan.builderRepresentativeContact,
          }),
          ...(payload.shaPlan.coordinatorPlanningName !== undefined && {
            coordinatorPlanningName: payload.shaPlan.coordinatorPlanningName,
          }),
          ...(payload.shaPlan.coordinatorExecutionName !== undefined && {
            coordinatorExecutionName: payload.shaPlan.coordinatorExecutionName,
          }),
          ...(payload.shaPlan.conflictAssessmentDocumented !== undefined && {
            conflictAssessmentDocumented: payload.shaPlan.conflictAssessmentDocumented,
          }),
          ...(payload.shaPlan.availableOnSite !== undefined && {
            availableOnSite: payload.shaPlan.availableOnSite,
          }),
          ...(payload.shaPlan.lastReviewedAt !== undefined && {
            lastReviewedAt: payload.shaPlan.lastReviewedAt,
          }),
        },
      });
    }

    if (payload.preNotification) {
      await upsertPreNotification({
        tenantId: context.tenantId,
        projectId: context.project.id,
        create: {
          status: payload.preNotification.status ?? "DRAFT",
          sentAt: payload.preNotification.sentAt ?? null,
          submissionDate: payload.preNotification.submissionDate ?? null,
          projectAddress: payload.preNotification.projectAddress ?? context.project.location ?? "Address missing",
          projectType: payload.preNotification.projectType ?? "Construction work",
          builderName: payload.preNotification.builderName ?? context.project.clientName ?? "Unspecified client",
          builderOrgNumber: payload.preNotification.builderOrgNumber ?? null,
          builderAddress: payload.preNotification.builderAddress ?? null,
          builderPhone: payload.preNotification.builderPhone ?? null,
          builderRepresentativeName: payload.preNotification.builderRepresentativeName ?? null,
          builderRepresentativePhone: payload.preNotification.builderRepresentativePhone ?? null,
          coordinators: payload.preNotification.coordinators ?? null,
          designers: payload.preNotification.designers ?? null,
          contractors: payload.preNotification.contractors ?? null,
          expectedStartDate: payload.preNotification.expectedStartDate ?? new Date().toISOString(),
          expectedEndDate: payload.preNotification.expectedEndDate ?? null,
          maxWorkersSimultaneous: payload.preNotification.maxWorkersSimultaneous ?? null,
          plannedBusinessesCount: payload.preNotification.plannedBusinessesCount ?? null,
          visibleAtSite: payload.preNotification.visibleAtSite ?? false,
          localAuthority: payload.preNotification.localAuthority ?? null,
          clientDutyAcknowledged: payload.preNotification.clientDutyAcknowledged ?? false,
        },
        update: {
          ...(payload.preNotification.status !== undefined && { status: payload.preNotification.status }),
          ...(payload.preNotification.sentAt !== undefined && {
            sentAt: payload.preNotification.sentAt,
          }),
          ...(payload.preNotification.submissionDate !== undefined && {
            submissionDate: payload.preNotification.submissionDate,
          }),
          ...(payload.preNotification.projectAddress !== undefined && {
            projectAddress: payload.preNotification.projectAddress,
          }),
          ...(payload.preNotification.projectType !== undefined && {
            projectType: payload.preNotification.projectType,
          }),
          ...(payload.preNotification.builderName !== undefined && {
            builderName: payload.preNotification.builderName,
          }),
          ...(payload.preNotification.builderOrgNumber !== undefined && {
            builderOrgNumber: payload.preNotification.builderOrgNumber,
          }),
          ...(payload.preNotification.builderAddress !== undefined && {
            builderAddress: payload.preNotification.builderAddress,
          }),
          ...(payload.preNotification.builderPhone !== undefined && {
            builderPhone: payload.preNotification.builderPhone,
          }),
          ...(payload.preNotification.builderRepresentativeName !== undefined && {
            builderRepresentativeName: payload.preNotification.builderRepresentativeName,
          }),
          ...(payload.preNotification.builderRepresentativePhone !== undefined && {
            builderRepresentativePhone: payload.preNotification.builderRepresentativePhone,
          }),
          ...(payload.preNotification.coordinators !== undefined && {
            coordinators: payload.preNotification.coordinators,
          }),
          ...(payload.preNotification.designers !== undefined && {
            designers: payload.preNotification.designers,
          }),
          ...(payload.preNotification.contractors !== undefined && {
            contractors: payload.preNotification.contractors,
          }),
          ...(payload.preNotification.expectedStartDate !== undefined && {
            expectedStartDate: payload.preNotification.expectedStartDate,
          }),
          ...(payload.preNotification.expectedEndDate !== undefined && {
            expectedEndDate: payload.preNotification.expectedEndDate,
          }),
          ...(payload.preNotification.maxWorkersSimultaneous !== undefined && {
            maxWorkersSimultaneous: payload.preNotification.maxWorkersSimultaneous,
          }),
          ...(payload.preNotification.plannedBusinessesCount !== undefined && {
            plannedBusinessesCount: payload.preNotification.plannedBusinessesCount,
          }),
          ...(payload.preNotification.visibleAtSite !== undefined && {
            visibleAtSite: payload.preNotification.visibleAtSite,
          }),
          ...(payload.preNotification.localAuthority !== undefined && {
            localAuthority: payload.preNotification.localAuthority,
          }),
          ...(payload.preNotification.clientDutyAcknowledged !== undefined && {
            clientDutyAcknowledged: payload.preNotification.clientDutyAcknowledged,
          }),
        },
      });
    }

    if (payload.shaPlan) {
      const changedFields = buildChangedFields(existingShaPlan, payload.shaPlan as Record<string, unknown>);
      await AuditLog.log(
        context.tenantId,
        session.user.id,
        "CONSTRUCTION_SHA_PLAN_UPDATED",
        "Project",
        context.project.id,
        { changedFields },
      );
    }
    if (payload.preNotification) {
      const changedFields = buildChangedFields(
        existingPreNotification,
        payload.preNotification as Record<string, unknown>
      );
      const requirement = evaluatePreNotificationRequirement(nextPreNotification);
      await AuditLog.log(
        context.tenantId,
        session.user.id,
        "CONSTRUCTION_PRE_NOTIFICATION_UPDATED",
        "Project",
        context.project.id,
        { changedFields, requirement },
      );
    }
    await AuditLog.log(
      context.tenantId,
      session.user.id,
      "CONSTRUCTION_COMPLIANCE_UPDATED",
      "Project",
      context.project.id,
    );

    return createSuccessResponse(undefined, "CDM 2015 records updated");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createErrorResponse(ErrorCodes.UNAUTHORIZED, "Not authenticated", 401);
    }

    const payload = postPayloadSchema.parse(await request.json());
    const { id } = await params;
    const context = await getTenantAndProject(id, session.user.id, session.user.tenantId);
    if (!context) {
      return createErrorResponse(ErrorCodes.NOT_FOUND, "Project not found", 404);
    }
    const permissions = getPermissions(context.role as Role);
    if (!permissions.canManageConstructionCompliance) {
      return createErrorResponse(ErrorCodes.FORBIDDEN, "Insufficient access", 403);
    }

    if (payload.action === "ADD_ROSTER_ENTRY") {
      const entry = await insertRosterEntry({
        tenantId: context.tenantId,
        projectId: context.project.id,
        fullName: payload.data.fullName,
        birthDate: toDateOnly(payload.data.birthDate),
        employerName: payload.data.employerName,
        employerOrgNumber: payload.data.employerOrgNumber ?? null,
        hiringCompanyName: payload.data.hiringCompanyName ?? null,
        hmsCardNumber: payload.data.hmsCardNumber ?? null,
        startedAtSiteDate: toDateOnly(payload.data.startedAtSiteDate ?? null),
        endedAtSiteDate: toDateOnly(payload.data.endedAtSiteDate ?? null),
        isActive: payload.data.isActive ?? true,
        notes: payload.data.notes ?? null,
      });

      await AuditLog.log(
        context.tenantId,
        session.user.id,
        "CONSTRUCTION_ROSTER_ENTRY_CREATED",
        "ConstructionRosterEntry",
        entry.id,
      );

      return createSuccessResponse({ entry }, "Person added to the site register", 201);
    }

    const check = await upsertDailyCheck({
      tenantId: context.tenantId,
      projectId: context.project.id,
      checkedDate: payload.data.checkedDate,
      checkedById: session.user.id,
      notes: payload.data.notes ?? null,
    });

    await AuditLog.log(
      context.tenantId,
      session.user.id,
      "CONSTRUCTION_ROSTER_DAILY_CHECK",
      "ConstructionRosterDailyCheck",
      check.id,
    );

    return createSuccessResponse({ check }, "Daily check recorded", 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createErrorResponse(ErrorCodes.UNAUTHORIZED, "Not authenticated", 401);
    }

    const payload = patchPayloadSchema.parse(await request.json());
    const { id } = await params;
    const context = await getTenantAndProject(id, session.user.id, session.user.tenantId);
    if (!context) {
      return createErrorResponse(ErrorCodes.NOT_FOUND, "Project not found", 404);
    }
    const permissions = getPermissions(context.role as Role);
    if (!permissions.canManageConstructionCompliance) {
      return createErrorResponse(ErrorCodes.FORBIDDEN, "Insufficient access", 403);
    }

    const existingEntry = await loadRosterEntry(payload.rosterEntryId, context.project.id, context.tenantId);
    if (!existingEntry) {
      return createErrorResponse(ErrorCodes.NOT_FOUND, "Site register entry not found", 404);
    }

    if (payload.action === "UPDATE_ROSTER_ENTRY") {
      const updated = await updateRosterEntry(existingEntry.id, {
        ...(payload.data.fullName !== undefined && { fullName: payload.data.fullName }),
        ...(payload.data.birthDate !== undefined && {
          birthDate: toDateOnly(payload.data.birthDate),
        }),
        ...(payload.data.employerName !== undefined && { employerName: payload.data.employerName }),
        ...(payload.data.employerOrgNumber !== undefined && {
          employerOrgNumber: payload.data.employerOrgNumber,
        }),
        ...(payload.data.hiringCompanyName !== undefined && {
          hiringCompanyName: payload.data.hiringCompanyName,
        }),
        ...(payload.data.hmsCardNumber !== undefined && {
          hmsCardNumber: payload.data.hmsCardNumber,
        }),
        ...(payload.data.startedAtSiteDate !== undefined && {
          startedAtSiteDate: toDateOnly(payload.data.startedAtSiteDate ?? null),
        }),
        ...(payload.data.endedAtSiteDate !== undefined && {
          endedAtSiteDate: toDateOnly(payload.data.endedAtSiteDate ?? null),
        }),
        ...(payload.data.isActive !== undefined && { isActive: payload.data.isActive }),
        ...(payload.data.notes !== undefined && { notes: payload.data.notes }),
      });

      await AuditLog.log(
        context.tenantId,
        session.user.id,
        "CONSTRUCTION_ROSTER_ENTRY_UPDATED",
        "ConstructionRosterEntry",
        updated.id,
      );

      return createSuccessResponse({ entry: updated }, "Site register entry updated");
    }

    const closed = await updateRosterEntry(existingEntry.id, {
      isActive: false,
      endedAtSiteDate: toDateOnly(payload.endedAtSiteDate ?? new Date()),
      ...(payload.notes !== undefined && { notes: payload.notes }),
    });

    await AuditLog.log(
      context.tenantId,
      session.user.id,
      "CONSTRUCTION_ROSTER_ENTRY_CLOSED",
      "ConstructionRosterEntry",
      closed.id,
    );

    return createSuccessResponse({ entry: closed }, "Site register entry closed");
  } catch (error) {
    return handleApiError(error);
  }
}
