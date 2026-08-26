"use server";

import { revalidatePath } from "next/cache";
import { NotificationType, Role, RoutineStatus } from "@prisma/client";
import { getAdminDb } from "@/lib/supabase/admin";
import { createId } from "@/lib/ids";
import { matchesIndustryScope, toIndustryScopeJson } from "@/lib/industry-scope";
import { requirePermission } from "@/lib/server-authorization";
import { createNotification } from "@/server/actions/notification.actions";
import { ensureGlobalRoutineTemplateLibrarySeeded } from "@/server/actions/routine-library.actions";
import { onRoutineUpdated } from "@/features/hms-ai/lib/event-handler";
import { canCreateInspectionTemplate } from "@/lib/template-policy";
import { withAuditLog } from "@/lib/audit-log";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { SessionUser } from "@/types";
import {
  loadRoutineDetail,
  loadRoutineTemplates,
  loadRoutinesForList,
} from "@/server/queries/routines.queries";

const PROCEDURES_PATH = "/dashboard/procedures";

type ActionError = { code: string; message: string; details?: unknown };

type RoutineTemplateListInput = {
  query?: string;
  category?: string;
  includeInactive?: boolean;
};

type RoutineUpdateInput = {
  id: string;
  title?: string;
  description?: string | null;
  category?: string | null;
  content?: unknown;
  legalReference?: string | null;
  status?: RoutineStatus;
  reviewIntervalMonths?: number;
  nextReviewAt?: Date | null;
  lastReviewedAt?: Date | null;
};

function toIso(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function normalizeQuery(query?: string): string | undefined {
  const value = query?.trim();
  return value && value.length > 0 ? value : undefined;
}

async function getTenantIndustry(tenantId: string): Promise<string | null> {
  const { data: tenant } = await getAdminDb()
    .from("Tenant")
    .select("industry")
    .eq("id", tenantId)
    .maybeSingle();
  return tenant?.industry?.trim().toLowerCase() ?? null;
}

async function notifyLeadersAndHms(tenantId: string, title: string, message: string, link: string) {
  const { data: recipients } = await getAdminDb()
    .from("UserTenant")
    .select("userId, role")
    .eq("tenantId", tenantId)
    .in("role", [Role.ADMIN, Role.HMS, Role.LEDER]);

  const userIds = [...new Set(((recipients ?? []) as Array<{ userId: string }>).map((row) => row.userId))];
  await Promise.all(
    userIds.map((userId) =>
      createNotification({
        tenantId,
        userId,
        type: NotificationType.ROUTINE_REVIEW_DUE,
        title,
        message,
        link,
      }).catch(() => undefined)
    )
  );
}

export async function listRecommendedRoutineTemplates(input: RoutineTemplateListInput = {}) {
  try {
    await ensureGlobalRoutineTemplateLibrarySeeded();
    const context = await requirePermission("canReadRoutines");
    const query = normalizeQuery(input.query);
    const tenantIndustry = await getTenantIndustry(context.tenantId);
    const templates = await loadRoutineTemplates({
      tenantId: context.tenantId,
      query,
      category: input.category,
      includeInactive: input.includeInactive,
    });
    const filteredTemplates = templates.filter((template) =>
      matchesIndustryScope(template.industryScope, tenantIndustry)
    );
    return { success: true as const, data: filteredTemplates };
  } catch (error: unknown) {
    const err = error as ActionError;
    return {
      success: false as const,
      error: err.message || "Could not load recommended procedure templates.",
    };
  }
}

export async function listAllRoutineTemplates(input: RoutineTemplateListInput = {}) {
  try {
    await ensureGlobalRoutineTemplateLibrarySeeded();
    const context = await requirePermission("canReadRoutines");
    const templates = await loadRoutineTemplates({
      tenantId: context.tenantId,
      query: normalizeQuery(input.query),
      category: input.category,
      includeInactive: input.includeInactive,
    });
    return { success: true as const, data: templates };
  } catch (error: unknown) {
    const err = error as ActionError;
    return { success: false as const, error: err.message || "Could not load procedure templates." };
  }
}

export async function listTenantRoutines(query?: string, options?: { forEmployee?: boolean }) {
  try {
    const context = await requirePermission("canReadRoutines");
    const routines = await loadRoutinesForList({
      tenantId: context.tenantId,
      query: normalizeQuery(query),
      forEmployee: options?.forEmployee,
    });
    return { success: true as const, data: routines };
  } catch (error: unknown) {
    const err = error as ActionError;
    return { success: false as const, error: err.message || "Could not load procedures." };
  }
}

export async function getRoutineById(routineId: string, options?: { forEmployee?: boolean }) {
  try {
    const context = await requirePermission("canReadRoutines");
    const routine = await loadRoutineDetail({
      id: routineId,
      tenantId: context.tenantId,
      forEmployee: options?.forEmployee,
    });
    if (!routine) {
      return { success: false as const, error: "Procedure not found." };
    }
    return { success: true as const, data: routine };
  } catch (error: unknown) {
    const err = error as ActionError;
    return { success: false as const, error: err.message || "Could not load the procedure." };
  }
}

export async function createRoutineFromTemplate(templateId: string) {
  try {
    const context = await requirePermission("canCreateRoutines");
    const db = getAdminDb();
    const { data: template } = await db
      .from("RoutineTemplate")
      .select("*")
      .eq("id", templateId)
      .eq("isActive", true)
      .maybeSingle();

    if (!template || (template.tenantId !== context.tenantId && !template.isGlobal)) {
      return { success: false as const, error: "Procedure template not found." };
    }

    const { count } = await db
      .from("Routine")
      .select("id", { count: "exact", head: true })
      .eq("tenantId", context.tenantId)
      .ilike("title", `%${template.title}%`);

    const existingCount = count ?? 0;
    const title = existingCount === 0 ? template.title : `${template.title} (${existingCount + 1})`;
    const now = new Date().toISOString();
    const { data: routine, error } = await db
      .from("Routine")
      .insert({
        id: createId(),
        tenantId: context.tenantId,
        templateId: template.id,
        title,
        description: template.description,
        category: template.category,
        content: template.content,
        legalReference: template.legalReference,
        createdBy: context.userId,
        createdAt: now,
        updatedAt: now,
      })
      .select("*")
      .single();

    if (error || !routine) {
      throw { code: "ROUTINE_CREATE_FAILED", message: error?.message || "Could not create the procedure." };
    }

    await withAuditLog(context.tenantId, context.userId, "Routine", routine.id, "CREATED", { title: routine.title });

    revalidatePath(PROCEDURES_PATH);
    revalidatePath(`${PROCEDURES_PATH}/templates`);
    return { success: true as const, data: routine };
  } catch (error: unknown) {
    const err = error as ActionError;
    return { success: false as const, error: err.message || "Could not create the procedure from the template." };
  }
}

export async function updateRoutine(input: RoutineUpdateInput) {
  try {
    const context = await requirePermission("canCreateRoutines");
    const db = getAdminDb();
    const { data: existing } = await db
      .from("Routine")
      .select("id")
      .eq("id", input.id)
      .eq("tenantId", context.tenantId)
      .maybeSingle();

    if (!existing) {
      return { success: false as const, error: "Procedure not found." };
    }

    const payload: Record<string, unknown> = {
      updatedBy: context.userId,
      updatedAt: new Date().toISOString(),
    };
    if (input.title !== undefined) payload.title = input.title;
    if (input.description !== undefined) payload.description = input.description;
    if (input.category !== undefined) payload.category = input.category;
    if (input.content !== undefined) payload.content = input.content;
    if (input.legalReference !== undefined) payload.legalReference = input.legalReference;
    if (input.status !== undefined) payload.status = input.status;
    if (input.reviewIntervalMonths !== undefined) payload.reviewIntervalMonths = input.reviewIntervalMonths;
    if (input.nextReviewAt !== undefined) payload.nextReviewAt = toIso(input.nextReviewAt);
    if (input.lastReviewedAt !== undefined) payload.lastReviewedAt = toIso(input.lastReviewedAt);

    const { data: routine, error } = await db
      .from("Routine")
      .update(payload)
      .eq("id", input.id)
      .select("*")
      .single();

    if (error || !routine) {
      throw { code: "ROUTINE_UPDATE_FAILED", message: error?.message || "Could not update the procedure." };
    }

    await withAuditLog(context.tenantId, context.userId, "Routine", routine.id, "UPDATED", { title: routine.title });

    revalidatePath(PROCEDURES_PATH);
    revalidatePath(`${PROCEDURES_PATH}/${routine.id}`);
    onRoutineUpdated(context.tenantId, routine.id).catch(() => undefined);
    return { success: true as const, data: routine };
  } catch (error: unknown) {
    const err = error as ActionError;
    return { success: false as const, error: err.message || "Could not update the procedure." };
  }
}

export async function assignRoutineResponsible(routineId: string, responsibleUserId: string) {
  try {
    const context = await requirePermission("canCreateRoutines");
    const db = getAdminDb();
    const [{ data: routine }, { data: member }] = await Promise.all([
      db.from("Routine").select("*").eq("id", routineId).eq("tenantId", context.tenantId).maybeSingle(),
      db
        .from("UserTenant")
        .select("userId")
        .eq("userId", responsibleUserId)
        .eq("tenantId", context.tenantId)
        .maybeSingle(),
    ]);

    if (!routine) {
      return { success: false as const, error: "Procedure not found." };
    }
    if (!member) {
      return { success: false as const, error: "That person is not a member of this organisation." };
    }

    const now = new Date().toISOString();
    const { data: updated, error } = await db
      .from("Routine")
      .update({
        responsibleId: responsibleUserId,
        updatedBy: context.userId,
        updatedAt: now,
      })
      .eq("id", routineId)
      .select("*")
      .single();

    if (error || !updated) {
      throw { code: "ROUTINE_ASSIGN_FAILED", message: error?.message || "Could not assign the owner." };
    }

    await withAuditLog(context.tenantId, context.userId, "Routine", routineId, "UPDATED", { assignedTo: responsibleUserId });

    await createNotification({
      tenantId: context.tenantId,
      userId: responsibleUserId,
      type: NotificationType.ROUTINE_ASSIGNED,
      title: "Procedure assigned",
      message: `You are the owner of “${updated.title}”.`,
      link: `${PROCEDURES_PATH}/${updated.id}`,
    }).catch(() => undefined);

    revalidatePath(`${PROCEDURES_PATH}/${updated.id}`);
    return { success: true as const, data: updated };
  } catch (error: unknown) {
    const err = error as ActionError;
    return { success: false as const, error: err.message || "Could not assign the owner." };
  }
}

export async function scheduleRoutineFollowUp(
  routineId: string,
  nextReviewAt: Date,
  reviewIntervalMonths?: number
) {
  try {
    const context = await requirePermission("canCreateRoutines");
    const db = getAdminDb();
    const { data: routine } = await db
      .from("Routine")
      .select("*")
      .eq("id", routineId)
      .eq("tenantId", context.tenantId)
      .maybeSingle();

    if (!routine) {
      return { success: false as const, error: "Procedure not found." };
    }

    const now = new Date().toISOString();
    const { data: updated, error } = await db
      .from("Routine")
      .update({
        nextReviewAt: toIso(nextReviewAt),
        reviewIntervalMonths: reviewIntervalMonths ?? routine.reviewIntervalMonths,
        status: RoutineStatus.ACTIVE,
        updatedBy: context.userId,
        updatedAt: now,
      })
      .eq("id", routineId)
      .select("*")
      .single();

    if (error || !updated) {
      throw { code: "ROUTINE_SCHEDULE_FAILED", message: error?.message || "Could not set the review date." };
    }

    await withAuditLog(context.tenantId, context.userId, "Routine", routineId, "UPDATED", { scheduledReview: true });

    await notifyLeadersAndHms(
      context.tenantId,
      "Review date updated",
      `“${updated.title}” has a new review date.`,
      `${PROCEDURES_PATH}/${updated.id}`
    );

    revalidatePath(PROCEDURES_PATH);
    revalidatePath(`${PROCEDURES_PATH}/${updated.id}`);
    return { success: true as const, data: updated };
  } catch (error: unknown) {
    const err = error as ActionError;
    return { success: false as const, error: err.message || "Could not schedule the review." };
  }
}

export async function createRoutineTemplate(input: {
  title: string;
  description?: string;
  category?: string;
  content?: unknown;
  legalReference?: string;
  isGlobal?: boolean;
  industryScope?: string[];
}) {
  try {
    const context = await requirePermission("canCreateRoutines");
    const session = await getServerSession(authOptions);
    const isSuperAdmin = Boolean((session?.user as SessionUser | undefined)?.isSuperAdmin);
    if (!canCreateInspectionTemplate(isSuperAdmin)) {
      return {
        success: false as const,
        error: "New templates are set up by HSEQ Nova. You can edit the text on existing templates.",
      };
    }

    const now = new Date().toISOString();
    const { data: template, error } = await getAdminDb()
      .from("RoutineTemplate")
      .insert({
        id: createId(),
        tenantId: input.isGlobal ? null : context.tenantId,
        title: input.title,
        description: input.description,
        category: input.category,
        content: input.content,
        legalReference: input.legalReference,
        isGlobal: !!input.isGlobal,
        industryScope: toIndustryScopeJson(input.industryScope),
        createdBy: context.userId,
        createdAt: now,
        updatedAt: now,
      })
      .select("*")
      .single();

    if (error || !template) {
      throw { code: "ROUTINE_TEMPLATE_CREATE_FAILED", message: error?.message || "Could not create the template." };
    }

    await withAuditLog(context.tenantId, context.userId, "RoutineTemplate", template.id, "CREATED", { title: template.title });

    revalidatePath(`${PROCEDURES_PATH}/templates`);
    return { success: true as const, data: template };
  } catch (error: unknown) {
    const err = error as ActionError;
    return { success: false as const, error: err.message || "Could not create the procedure template." };
  }
}
