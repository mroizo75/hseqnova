"use server";

import { randomBytes } from "node:crypto";
import { getAdminDb } from "@/lib/supabase/admin";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getDefaultWidgetIdsForIndustry } from "@/features/dashboard/lib/widget-registry";
import { menuPathsToWidgetIds } from "@/lib/menu-widget-sync";
import {
  DEFAULT_HMS_PULSE_ITEMS,
  ensureMandatoryHmsPulseItems,
  normalizeHmsPulseItems,
  type HmsPulseItem,
} from "@/features/dashboard/lib/hms-pulse-config";

export interface DashboardWidgetConfig {
  id: string;
  order: number;
  type?: "builtin" | "custom";
  customLabel?: string;
  customHref?: string;
  customIconName?: string;
  customColorKey?: string;
}

const ALLOWED_CUSTOM_ICONS = new Set([
  "star", "flag", "clipboard", "bell", "shield", "file", "check", "alert",
  "flame", "droplets", "zap", "hardhat", "stethoscope", "heart", "leaf",
  "wrench", "truck", "building", "utensils", "graduation", "plug",
  "thermometer", "eye", "lock", "package", "hammer", "warehouse",
]);

const ALLOWED_CUSTOM_COLORS = new Set([
  "slate", "blue", "red", "orange", "amber", "yellow", "green", "emerald",
  "teal", "cyan", "sky", "indigo", "violet", "purple", "pink", "rose",
]);

function normalizeDashboardWidgets(input: DashboardWidgetConfig[]): DashboardWidgetConfig[] {
  const seenIds = new Set<string>();
  const normalized = input
    .filter((widget) => typeof widget.id === "string" && widget.id.trim().length > 0)
    .filter((widget) => {
      if (seenIds.has(widget.id)) return false;
      seenIds.add(widget.id);
      return true;
    })
    .map((widget, index) => {
      const type = widget.type === "custom" ? "custom" : "builtin";
      if (type === "custom") {
        const customLabel = (widget.customLabel || "").trim();
        const customHref = (widget.customHref || "").trim();
        const customIconName = (widget.customIconName || "").trim().toLowerCase();
        if (customLabel.length === 0 || customHref.length === 0) {
          return null;
        }
        if (!ALLOWED_CUSTOM_ICONS.has(customIconName)) {
          return null;
        }
        const customColorKey = (widget.customColorKey || "").trim().toLowerCase();
        return {
          id: widget.id,
          order: index,
          type,
          customLabel,
          customHref,
          customIconName,
          ...(ALLOWED_CUSTOM_COLORS.has(customColorKey) ? { customColorKey } : {}),
        } satisfies DashboardWidgetConfig;
      }
      return {
        id: widget.id,
        order: index,
        type,
      } satisfies DashboardWidgetConfig;
    })
    .filter((widget) => widget !== null) as DashboardWidgetConfig[];

  return normalized;
}

function resolveActiveTenantId(
  tenantMemberships: Array<{ tenantId: string }>,
  sessionTenantId?: string
): string | null {
  if (sessionTenantId) {
    const hasMembership = tenantMemberships.some((membership) => membership.tenantId === sessionTenantId);
    if (!hasMembership) return null;
    return sessionTenantId;
  }
  return tenantMemberships[0]?.tenantId ?? null;
}

/**
 * Utled widget-IDer fra tenant-data. Prioriterer simpleMenuItems
 * slik at fliser og enkel meny alltid er i synk.
 * Faller tilbake til bransje-config hvis simpleMenuItems er tom.
 */
function deriveWidgetIdsFromTenant(
  tenant: { simpleMenuItems?: unknown; industry?: string | null } | null
): string[] {
  const menuItems = tenant?.simpleMenuItems;
  if (Array.isArray(menuItems) && menuItems.length > 0) {
    return menuPathsToWidgetIds(menuItems as string[]);
  }
  return getDefaultWidgetIdsForIndustry(tenant?.industry);
}

function createId(): string {
  return `c${randomBytes(12).toString("hex")}`.slice(0, 25);
}

async function loadDashboardContext() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return { error: "Not signed in" as const };
  }
  const db = getAdminDb();
  const { data: user } = await db.from("User").select("id").eq("email", session.user.email).maybeSingle();
  if (!user) {
    return { error: "No company found" as const };
  }
  const { data: tenants } = await db
    .from("UserTenant")
    .select("tenantId, role")
    .eq("userId", user.id);
  if (!tenants || tenants.length === 0) {
    return { error: "No company found" as const };
  }
  const tenantId = resolveActiveTenantId(
    tenants,
    (session.user as { tenantId?: string }).tenantId,
  );
  if (!tenantId) {
    return { error: "No valid company context" as const };
  }
  return {
    db,
    userId: user.id as string,
    tenantId,
    tenants: tenants as Array<{ tenantId: string; role: string }>,
  };
}

export async function getDashboardConfig(): Promise<{
  success: boolean;
  data?: DashboardWidgetConfig[];
  locked?: boolean;
  error?: string;
}> {
  try {
    const ctx = await loadDashboardContext();
    if ("error" in ctx) {
      return { success: false, error: ctx.error };
    }

    const { data: tenant } = await ctx.db
      .from("Tenant")
      .select("industry, simpleMenuItems, dashboardLocked, lockedDashboardConfig")
      .eq("id", ctx.tenantId)
      .maybeSingle();

    const membership = ctx.tenants.find((row) => row.tenantId === ctx.tenantId);
    const isAdmin = membership?.role === "ADMIN";

    if (tenant?.dashboardLocked && !isAdmin) {
      if (tenant.lockedDashboardConfig) {
        const lockedWidgets = tenant.lockedDashboardConfig as unknown as DashboardWidgetConfig[];
        return {
          success: true,
          data: normalizeDashboardWidgets(lockedWidgets),
          locked: true,
        };
      }
      const widgetIds = deriveWidgetIdsFromTenant(tenant);
      return {
        success: true,
        data: widgetIds.map((id, index) => ({ id, order: index, type: "builtin" as const })),
        locked: true,
      };
    }

    const { data: config } = await ctx.db
      .from("DashboardConfig")
      .select("widgets")
      .eq("userId", ctx.userId)
      .eq("tenantId", ctx.tenantId)
      .maybeSingle();

    if (!config) {
      const widgetIds = deriveWidgetIdsFromTenant(tenant);
      return {
        success: true,
        data: widgetIds.map((id, index) => ({ id, order: index, type: "builtin" as const })),
      };
    }

    const storedWidgets = config.widgets as unknown as DashboardWidgetConfig[];
    return { success: true, data: normalizeDashboardWidgets(storedWidgets) };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Ukjent feil";
    return { success: false, error: message };
  }
}

/**
 * Slett brukerens lagrede dashboard-config og returner bransje-defaults.
 * Brukes for "Tilbakestill"-knappen i dashboard-redigering.
 */
export async function resetDashboardToDefaults(): Promise<{
  success: boolean;
  data?: DashboardWidgetConfig[];
  error?: string;
}> {
  try {
    const ctx = await loadDashboardContext();
    if ("error" in ctx) {
      return { success: false, error: ctx.error };
    }

    await ctx.db.from("DashboardConfig").delete().eq("userId", ctx.userId).eq("tenantId", ctx.tenantId);

    const { data: tenant } = await ctx.db
      .from("Tenant")
      .select("industry, simpleMenuItems")
      .eq("id", ctx.tenantId)
      .maybeSingle();

    const defaultWidgetIds = deriveWidgetIdsFromTenant(tenant);
    return {
      success: true,
      data: defaultWidgetIds.map((id, index) => ({ id, order: index, type: "builtin" as const })),
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Ukjent feil";
    return { success: false, error: message };
  }
}

export async function saveDashboardConfig(
  widgets: DashboardWidgetConfig[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const ctx = await loadDashboardContext();
    if ("error" in ctx) {
      return { success: false, error: ctx.error };
    }

    const { data: tenantRecord } = await ctx.db
      .from("Tenant")
      .select("dashboardLocked")
      .eq("id", ctx.tenantId)
      .maybeSingle();

    const membership = ctx.tenants.find((row) => row.tenantId === ctx.tenantId);
    const isAdmin = membership?.role === "ADMIN";

    if (tenantRecord?.dashboardLocked && !isAdmin) {
      return { success: false, error: "The dashboard is locked by an administrator" };
    }

    const normalizedWidgets = normalizeDashboardWidgets(widgets);
    const { data: existing } = await ctx.db
      .from("DashboardConfig")
      .select("id")
      .eq("userId", ctx.userId)
      .eq("tenantId", ctx.tenantId)
      .maybeSingle();

    if (existing?.id) {
      await ctx.db
        .from("DashboardConfig")
        .update({ widgets: normalizedWidgets, updatedAt: new Date().toISOString() })
        .eq("id", existing.id);
    } else {
      await ctx.db.from("DashboardConfig").insert({
        id: createId(),
        userId: ctx.userId,
        tenantId: ctx.tenantId,
        widgets: normalizedWidgets,
        updatedAt: new Date().toISOString(),
      });
    }

    if (tenantRecord?.dashboardLocked && isAdmin) {
      await ctx.db
        .from("Tenant")
        .update({ lockedDashboardConfig: normalizedWidgets, updatedAt: new Date().toISOString() })
        .eq("id", ctx.tenantId);
    }

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Ukjent feil";
    return { success: false, error: message };
  }
}

export async function getHmsPulseConfig(): Promise<{
  success: boolean;
  data?: HmsPulseItem[];
  error?: string;
}> {
  try {
    const ctx = await loadDashboardContext();
    if ("error" in ctx) {
      return { success: false, error: ctx.error };
    }
    const { data: config } = await ctx.db
      .from("DashboardConfig")
      .select("hmsPulseItems")
      .eq("userId", ctx.userId)
      .eq("tenantId", ctx.tenantId)
      .maybeSingle();

    if (!config?.hmsPulseItems) {
      return { success: true, data: DEFAULT_HMS_PULSE_ITEMS };
    }

    const items = ensureMandatoryHmsPulseItems(
      normalizeHmsPulseItems(config.hmsPulseItems as unknown as HmsPulseItem[])
    );
    return { success: true, data: items.length > 0 ? items : DEFAULT_HMS_PULSE_ITEMS };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Ukjent feil";
    return { success: false, error: message };
  }
}

export async function saveHmsPulseConfig(
  items: HmsPulseItem[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const ctx = await loadDashboardContext();
    if ("error" in ctx) {
      return { success: false, error: ctx.error };
    }

    const { data: tenantData } = await ctx.db
      .from("Tenant")
      .select("dashboardLocked, industry")
      .eq("id", ctx.tenantId)
      .maybeSingle();
    if (tenantData?.dashboardLocked) {
      const membership = ctx.tenants.find((row) => row.tenantId === ctx.tenantId);
      if (!membership || membership.role !== "ADMIN") {
        return { success: false, error: "The dashboard is locked by an administrator" };
      }
    }

    const normalizedItems = ensureMandatoryHmsPulseItems(normalizeHmsPulseItems(items));
    const safeItems = normalizedItems.length > 0 ? normalizedItems : DEFAULT_HMS_PULSE_ITEMS;

    const defaultWidgetIds = getDefaultWidgetIdsForIndustry(tenantData?.industry);
    const defaultWidgets = defaultWidgetIds.map((id, index) => ({
      id,
      order: index,
      type: "builtin" as const,
    }));

    const { data: existing } = await ctx.db
      .from("DashboardConfig")
      .select("id")
      .eq("userId", ctx.userId)
      .eq("tenantId", ctx.tenantId)
      .maybeSingle();

    if (existing?.id) {
      await ctx.db
        .from("DashboardConfig")
        .update({ hmsPulseItems: safeItems, updatedAt: new Date().toISOString() })
        .eq("id", existing.id);
    } else {
      await ctx.db.from("DashboardConfig").insert({
        id: createId(),
        userId: ctx.userId,
        tenantId: ctx.tenantId,
        widgets: defaultWidgets,
        hmsPulseItems: safeItems,
        updatedAt: new Date().toISOString(),
      });
    }

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Ukjent feil";
    return { success: false, error: message };
  }
}
