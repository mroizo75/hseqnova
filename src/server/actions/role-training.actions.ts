"use server";

import { revalidatePath } from "next/cache";
import { getRequiredTenantContext } from "@/lib/tenant-context";
import { getAdminDb } from "@/lib/supabase/admin";
import { createId } from "@/lib/ids";

const REVALIDATE_PATH = "/dashboard/training/roles";

function errorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

export type RoleTrainingRequirement = {
  id: string;
  tenantId: string;
  role: string;
  courseKey: string;
  isMandatory: boolean;
  reason: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function asRequirement(row: Record<string, unknown>): RoleTrainingRequirement {
  return {
    id: String(row.id),
    tenantId: String(row.tenantId),
    role: String(row.role),
    courseKey: String(row.courseKey),
    isMandatory: Boolean(row.isMandatory),
    reason: (row.reason as string | null) ?? null,
    createdAt: new Date(String(row.createdAt)),
    updatedAt: new Date(String(row.updatedAt)),
  };
}

export async function listRoleTrainingRequirements() {
  try {
    const { tenantId } = await getRequiredTenantContext();
    const { data, error } = await getAdminDb()
      .from("RoleTrainingRequirement")
      .select("*")
      .eq("tenantId", tenantId)
      .order("role")
      .order("courseKey");
    if (error) {
      throw { code: "ROLE_TRAINING_LIST_FAILED", message: error.message };
    }
    return {
      success: true as const,
      data: (data ?? []).map((row) => asRequirement(row as Record<string, unknown>)),
    };
  } catch (error: unknown) {
    return { success: false as const, error: errorMessage(error, "Could not load role training requirements") };
  }
}

export async function setRoleTrainingRequirement(input: {
  role: string;
  courseKey: string;
  isMandatory: boolean;
  reason?: string | null;
}) {
  try {
    const { tenantId } = await getRequiredTenantContext();
    const now = new Date().toISOString();
    const db = getAdminDb();

    const { data: existing } = await db
      .from("RoleTrainingRequirement")
      .select("id")
      .eq("tenantId", tenantId)
      .eq("role", input.role)
      .eq("courseKey", input.courseKey)
      .maybeSingle();

    if (existing) {
      const { data, error } = await db
        .from("RoleTrainingRequirement")
        .update({
          isMandatory: input.isMandatory,
          reason: input.reason ?? null,
          updatedAt: now,
        })
        .eq("id", existing.id)
        .select("*")
        .single();
      if (error || !data) {
        throw { code: "ROLE_TRAINING_UPDATE_FAILED", message: error?.message ?? "Could not update requirement" };
      }
      revalidatePath(REVALIDATE_PATH);
      return { success: true as const, data: asRequirement(data as Record<string, unknown>) };
    }

    const { data, error } = await db
      .from("RoleTrainingRequirement")
      .insert({
        id: createId(),
        tenantId,
        role: input.role,
        courseKey: input.courseKey,
        isMandatory: input.isMandatory,
        reason: input.reason ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .select("*")
      .single();
    if (error || !data) {
      throw { code: "ROLE_TRAINING_CREATE_FAILED", message: error?.message ?? "Could not create requirement" };
    }
    revalidatePath(REVALIDATE_PATH);
    return { success: true as const, data: asRequirement(data as Record<string, unknown>) };
  } catch (error: unknown) {
    return { success: false as const, error: errorMessage(error, "Could not save role training requirement") };
  }
}

export async function removeRoleTrainingRequirement(input: {
  role: string;
  courseKey: string;
}) {
  try {
    const { tenantId } = await getRequiredTenantContext();
    const { error } = await getAdminDb()
      .from("RoleTrainingRequirement")
      .delete()
      .eq("tenantId", tenantId)
      .eq("role", input.role)
      .eq("courseKey", input.courseKey);
    if (error) {
      throw { code: "ROLE_TRAINING_DELETE_FAILED", message: error.message };
    }
    revalidatePath(REVALIDATE_PATH);
    return { success: true as const };
  } catch (error: unknown) {
    return { success: false as const, error: errorMessage(error, "Could not remove role training requirement") };
  }
}

export type RoleGapUser = {
  userId: string;
  userName: string | null;
  email: string;
  role: string;
  requiredCourses: Array<{
    courseKey: string;
    courseTitle: string;
    isMandatory: boolean;
  }>;
  completedCourses: Array<{
    courseKey: string;
    courseTitle: string;
    status: "VALID" | "EXPIRING_SOON" | "EXPIRED";
    validUntil: Date | null;
  }>;
  missingCourses: Array<{
    courseKey: string;
    courseTitle: string;
    isMandatory: boolean;
  }>;
};

export async function getRoleGaps() {
  try {
    const { tenantId } = await getRequiredTenantContext();
    const db = getAdminDb();

    const [reqResult, memberResult, trainingResult, templateResult] = await Promise.all([
      db.from("RoleTrainingRequirement").select("*").eq("tenantId", tenantId),
      db.from("UserTenant").select("userId, role").eq("tenantId", tenantId),
      db.from("Training").select("*").eq("tenantId", tenantId),
      db.from("CourseTemplate")
        .select("courseKey, title")
        .or(`tenantId.eq.${tenantId},isGlobal.eq.true`)
        .eq("isActive", true),
    ]);

    if (reqResult.error) throw { code: "ROLE_GAPS_FAILED", message: reqResult.error.message };
    if (memberResult.error) throw { code: "ROLE_GAPS_FAILED", message: memberResult.error.message };
    if (trainingResult.error) throw { code: "ROLE_GAPS_FAILED", message: trainingResult.error.message };
    if (templateResult.error) throw { code: "ROLE_GAPS_FAILED", message: templateResult.error.message };

    const requirements = (reqResult.data ?? []) as Array<{
      role: string;
      courseKey: string;
      isMandatory: boolean;
    }>;
    const members = (memberResult.data ?? []) as Array<{ userId: string; role: string }>;
    const trainings = (trainingResult.data ?? []) as Array<{
      userId: string;
      courseKey: string;
      completedAt: string | null;
      validUntil: string | null;
      title: string;
    }>;

    const courseTitleMap = new Map<string, string>();
    for (const t of templateResult.data ?? []) {
      courseTitleMap.set(String(t.courseKey), String(t.title));
    }
    for (const t of trainings) {
      if (!courseTitleMap.has(t.courseKey)) {
        courseTitleMap.set(t.courseKey, t.title);
      }
    }

    const reqsByRole = new Map<string, Array<{ courseKey: string; isMandatory: boolean }>>();
    for (const r of requirements) {
      const list = reqsByRole.get(r.role) ?? [];
      list.push({ courseKey: r.courseKey, isMandatory: r.isMandatory });
      reqsByRole.set(r.role, list);
    }

    const userIds = [...new Set(members.map((m) => m.userId))];
    if (userIds.length === 0) {
      return { success: true as const, data: [] as RoleGapUser[] };
    }

    const { data: users, error: usersError } = await db
      .from("User")
      .select("id, name, email")
      .in("id", userIds);
    if (usersError) throw { code: "ROLE_GAPS_FAILED", message: usersError.message };

    const userMap = new Map<string, { name: string | null; email: string }>();
    for (const u of users ?? []) {
      userMap.set(String(u.id), { name: u.name as string | null, email: String(u.email) });
    }

    const now = new Date();
    const gaps: RoleGapUser[] = [];

    for (const member of members) {
      const roleReqs = reqsByRole.get(member.role);
      if (!roleReqs || roleReqs.length === 0) continue;

      const userTrainings = trainings.filter((t) => t.userId === member.role ? false : t.userId === member.userId);
      const user = userMap.get(member.userId);
      if (!user) continue;

      const requiredCourses = roleReqs.map((r) => ({
        courseKey: r.courseKey,
        courseTitle: courseTitleMap.get(r.courseKey) ?? r.courseKey,
        isMandatory: r.isMandatory,
      }));

      const completedCourses: RoleGapUser["completedCourses"] = [];
      const missingCourses: RoleGapUser["missingCourses"] = [];

      for (const req of roleReqs) {
        const matching = userTrainings
          .filter((t) => t.courseKey === req.courseKey && t.completedAt)
          .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());
        const latest = matching[0];

        if (!latest) {
          missingCourses.push({
            courseKey: req.courseKey,
            courseTitle: courseTitleMap.get(req.courseKey) ?? req.courseKey,
            isMandatory: req.isMandatory,
          });
          continue;
        }

        const validUntil = latest.validUntil ? new Date(latest.validUntil) : null;
        let status: "VALID" | "EXPIRING_SOON" | "EXPIRED" = "VALID";
        if (validUntil) {
          const daysLeft = Math.ceil((validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          if (daysLeft <= 0) {
            status = "EXPIRED";
          } else if (daysLeft <= 30) {
            status = "EXPIRING_SOON";
          }
        }

        if (status === "EXPIRED") {
          missingCourses.push({
            courseKey: req.courseKey,
            courseTitle: courseTitleMap.get(req.courseKey) ?? req.courseKey,
            isMandatory: req.isMandatory,
          });
        }

        completedCourses.push({
          courseKey: req.courseKey,
          courseTitle: latest.title,
          status,
          validUntil,
        });
      }

      if (missingCourses.length > 0) {
        gaps.push({
          userId: member.userId,
          userName: user.name,
          email: user.email,
          role: member.role,
          requiredCourses,
          completedCourses,
          missingCourses,
        });
      }
    }

    gaps.sort((a, b) => b.missingCourses.length - a.missingCourses.length);
    return { success: true as const, data: gaps };
  } catch (error: unknown) {
    return { success: false as const, error: errorMessage(error, "Could not compute training gaps") };
  }
}
