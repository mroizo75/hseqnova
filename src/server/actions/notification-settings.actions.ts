"use server";

import { revalidatePath } from "next/cache";
import { Role } from "@prisma/client";
import { getRequiredTenantContext } from "@/lib/tenant-context";
import { getAdminDb } from "@/lib/supabase/admin";
import { getAuthContext } from "@/lib/server-authorization";

const ALERT_ROLES: Role[] = ["ADMIN", "HMS", "LEDER"];

async function getSessionContext() {
  const tenantContext = await getRequiredTenantContext().catch(() => null);
  if (!tenantContext) {
    return { error: "Not signed in" };
  }

  const { data: user } = await getAdminDb()
    .from("User")
    .select("id, phone")
    .eq("id", tenantContext.userId)
    .maybeSingle();

  if (!user) {
    return { error: "User not found" };
  }

  const auth = await getAuthContext();
  return {
    user: { ...user, tenants: [{ tenantId: tenantContext.tenantId, role: auth?.role }] },
    tenantId: tenantContext.tenantId,
  };
}

export async function updateNotificationSettings(data: {
  notifyByEmail: boolean;
  notifyBySms: boolean;
  reminderDaysBefore: number;
  notifyMeetings: boolean;
  notifyInspections: boolean;
  notifyAudits: boolean;
  notifyMeasures: boolean;
  notifyIncidents: boolean;
  notifyDocuments: boolean;
  notifyTraining: boolean;
  notifyRisks: boolean;
  dailyDigest: boolean;
  weeklyDigest: boolean;
  constructionDailyCheckAlertsEnabled?: boolean;
  constructionDailyCheckAlertRole?: Role;
}) {
  try {
    const context = await getSessionContext();
    if ("error" in context) {
      return { success: false, error: context.error };
    }

    const { user, tenantId } = context;

    if (data.reminderDaysBefore < 0 || data.reminderDaysBefore > 30) {
      return {
        success: false,
        error: "Reminder lead time must be between 0 and 30 days",
      };
    }

    const { data: userTenant } = await getAdminDb()
      .from("UserTenant")
      .select("phone")
      .eq("userId", user.id)
      .eq("tenantId", tenantId)
      .maybeSingle();

    if (data.notifyBySms && !userTenant?.phone && !user.phone) {
      return {
        success: false,
        error: "Add a telephone number on your profile before turning on text messages",
      };
    }

    const { error } = await getAdminDb()
      .from("UserTenant")
      .update({
        notifyByEmail: data.notifyByEmail,
        notifyBySms: data.notifyBySms,
        reminderDaysBefore: data.reminderDaysBefore,
        notifyMeetings: data.notifyMeetings,
        notifyInspections: data.notifyInspections,
        notifyAudits: data.notifyAudits,
        notifyMeasures: data.notifyMeasures,
        notifyIncidents: data.notifyIncidents,
        notifyDocuments: data.notifyDocuments,
        notifyTraining: data.notifyTraining,
        notifyRisks: data.notifyRisks,
        dailyDigest: data.dailyDigest,
        weeklyDigest: data.weeklyDigest,
        updatedAt: new Date().toISOString(),
      })
      .eq("userId", user.id)
      .eq("tenantId", tenantId);
    if (error) {
      throw { code: "NOTIFICATION_UPDATE_FAILED", message: error.message };
    }

    const membership = user.tenants.find((tenant) => tenant.tenantId === tenantId);
    if (
      membership?.role === "ADMIN" &&
      data.constructionDailyCheckAlertsEnabled !== undefined &&
      data.constructionDailyCheckAlertRole &&
      ALERT_ROLES.includes(data.constructionDailyCheckAlertRole)
    ) {
      const { error: tenantError } = await getAdminDb()
        .from("Tenant")
        .update({
          constructionDailyCheckAlertsEnabled: data.constructionDailyCheckAlertsEnabled,
          constructionDailyCheckAlertRole: data.constructionDailyCheckAlertRole,
          updatedAt: new Date().toISOString(),
        })
        .eq("id", tenantId);
      if (tenantError) {
        throw { code: "TENANT_UPDATE_FAILED", message: tenantError.message };
      }
    }

    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not save notification settings",
    };
  }
}
