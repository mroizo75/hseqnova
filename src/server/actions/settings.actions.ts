"use server";

import { revalidatePath } from "next/cache";
import { getAdminDb } from "@/lib/supabase/admin";
import { getAuthContext } from "@/lib/server-authorization";
import { createId } from "@/lib/ids";
import bcrypt from "bcryptjs";
import ExcelJS from "exceljs";
import { AuditLog } from "@/lib/audit-log";
import { assertNoManagerCycle } from "@/lib/incident-notification-routing";
import { Role } from "@prisma/client";
import { loadTenantWithSubscription } from "@/server/queries/settings.queries";
import { validateInviteName } from "@/lib/competent-person-uk";

type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  password: string | null;
  tenants: Array<{ tenantId: string; role: Role }>;
};

async function getSessionContext(): Promise<{ user: SessionUser; tenantId: string }> {
  const auth = await getAuthContext();
  if (!auth) {
    throw new Error("User not associated with a tenant");
  }

  const { data: user, error } = await getAdminDb()
    .from("User")
    .select("id, email, name, password")
    .eq("id", auth.userId)
    .maybeSingle();

  if (error) {
    throw { code: "USER_LOOKUP_FAILED", message: error.message };
  }
  if (!user) {
    throw new Error("User not associated with a tenant");
  }

  return {
    user: {
      id: user.id as string,
      email: user.email as string,
      name: (user.name as string | null) ?? null,
      password: (user.password as string | null) ?? null,
      tenants: [{ tenantId: auth.tenantId, role: auth.role }],
    },
    tenantId: auth.tenantId,
  };
}

function nowIso(): string {
  return new Date().toISOString();
}

function revalidateSettings() {
  revalidatePath("/dashboard/settings");
}

function revalidateUsers() {
  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/users");
}

async function countTenantUsers(tenantId: string): Promise<number> {
  const { count, error } = await getAdminDb()
    .from("UserTenant")
    .select("id", { count: "exact", head: true })
    .eq("tenantId", tenantId);
  if (error) {
    throw { code: "USER_COUNT_FAILED", message: error.message };
  }
  return count ?? 0;
}

async function findUserByEmail(email: string) {
  const { data, error } = await getAdminDb()
    .from("User")
    .select("id, email, name, password")
    .eq("email", email)
    .maybeSingle();
  if (error) {
    throw { code: "USER_LOOKUP_FAILED", message: error.message };
  }
  return data;
}

async function findMembership(userId: string, tenantId: string) {
  const { data, error } = await getAdminDb()
    .from("UserTenant")
    .select("*")
    .eq("userId", userId)
    .eq("tenantId", tenantId)
    .maybeSingle();
  if (error) {
    throw { code: "MEMBERSHIP_LOOKUP_FAILED", message: error.message };
  }
  return data;
}

const VALID_ROLES: Role[] = ["ADMIN", "HMS", "LEDER", "VERNEOMBUD", "ANSATT", "BHT", "REVISOR"];
const ROLE_ALIASES: Record<string, Role> = {
  administrator: "ADMIN",
  admin: "ADMIN",
  leder: "LEDER",
  "line-manager": "LEDER",
  manager: "LEDER",
  supervisor: "LEDER",
  hms: "HMS",
  "hms-ansvarlig": "HMS",
  "hse-manager": "HMS",
  hse: "HMS",
  "competent-person": "HMS",
  verneombud: "VERNEOMBUD",
  "safety-representative": "VERNEOMBUD",
  ansatt: "ANSATT",
  employee: "ANSATT",
  bht: "BHT",
  "bedriftshelsetjeneste": "BHT",
  "occupational-health": "BHT",
  revisor: "REVISOR",
  auditor: "REVISOR",
};

function isImportHeaderRow(email: string, name: string, role: string): boolean {
  const n = name.toLowerCase();
  const r = role.toLowerCase();
  return (
    email === "email" ||
    email === "e-post" ||
    n === "navn" ||
    n === "name" ||
    r === "rolle" ||
    r === "role"
  );
}

function normalizeRole(value: string): Role | null {
  const key = value.trim().toLowerCase().replace(/\s+/g, "-");
  if (VALID_ROLES.includes(value.trim().toUpperCase() as Role)) {
    return value.trim().toUpperCase() as Role;
  }
  return ROLE_ALIASES[key] ?? null;
}

const MAX_IMPORT_ROWS = 500;
const MAX_IMPORT_FILE_SIZE = 2 * 1024 * 1024; // 2MB

interface ImportRow {
  email: string;
  name: string;
  role: Role;
  /** Stillingstittel, kolonne 4. Valgfri. */
  position: string | null;
  /** E-post til nærmeste leder, kolonne 5. Valgfri, kobles etter at alle brukere er opprettet. */
  managerEmail: string | null;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeOptionalCell(value: unknown): string | null {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text.slice(0, 100) : null;
}

function normalizeManagerEmail(value: unknown): string | null {
  const email = String(value ?? "").toLowerCase().trim();
  return EMAIL_PATTERN.test(email) ? email : null;
}

function parseCsvToRows(buffer: Buffer): ImportRow[] {
  const text = buffer.toString("utf-8").replace(/^\uFEFF/, "");
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const rows: ImportRow[] = [];
  const sep = lines[0]?.includes(";") ? ";" : ",";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const cells = line.split(sep).map((c) => c.replace(/^"|"$/g, "").trim());
    if (cells.length < 3) continue;
    const [emailRaw, nameRaw, roleRaw, positionRaw, managerRaw] = cells;
    const email = emailRaw?.toLowerCase().trim() ?? "";
    const name = nameRaw?.trim() ?? "";
    const role = normalizeRole(roleRaw ?? "");
    if (!email || !name || !role) continue;
    const isHeader = i === 0 && isImportHeaderRow(email, name, String(roleRaw ?? ""));
    if (isHeader) continue;
    if (!EMAIL_PATTERN.test(email)) continue;
    if (!VALID_ROLES.includes(role)) continue;
    rows.push({
      email,
      name,
      role,
      position: normalizeOptionalCell(positionRaw),
      managerEmail: normalizeManagerEmail(managerRaw),
    });
  }
  return rows;
}

async function parseExcelToRows(buffer: Buffer): Promise<ImportRow[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as Parameters<ExcelJS.Workbook["xlsx"]["load"]>[0]);
  const sheet = workbook.worksheets[0];
  if (!sheet) return [];
  const rows: ImportRow[] = [];
  sheet.eachRow((row, rowNumber) => {
    const cells = row.values as (string | number | undefined)[];
    const email = String(cells[1] ?? "").toLowerCase().trim();
    const name = String(cells[2] ?? "").trim();
    const role = normalizeRole(String(cells[3] ?? ""));
    if (!email || !name || !role) return;
    const isHeader = rowNumber === 1 && isImportHeaderRow(email, name, String(cells[3] ?? ""));
    if (isHeader) return;
    if (!EMAIL_PATTERN.test(email)) return;
    if (!VALID_ROLES.includes(role)) return;
    rows.push({
      email,
      name,
      role,
      position: normalizeOptionalCell(cells[4]),
      managerEmail: normalizeManagerEmail(cells[5]),
    });
  });
  return rows;
}

// ============================================================================
// TENANT SETTINGS
// ============================================================================

export async function updateTenantSettings(data: {
  name: string;
  companyNumber?: string;
  vatNumber?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  hmsContactName?: string;
  hmsContactPhone?: string;
  hmsContactEmail?: string;
}) {
  try {
    const { user, tenantId } = await getSessionContext();

    const userTenant = user.tenants.find((t) => t.tenantId === tenantId);
    if (!userTenant || userTenant.role !== "ADMIN") {
      return { success: false, error: "Only administrators can change company settings" };
    }

    const { data: tenant, error } = await getAdminDb()
      .from("Tenant")
      .update({
        name: data.name,
        companyNumber: data.companyNumber,
        vatNumber: data.vatNumber,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        address: data.address,
        city: data.city,
        postalCode: data.postalCode,
        hmsContactName: data.hmsContactName,
        hmsContactPhone: data.hmsContactPhone,
        hmsContactEmail: data.hmsContactEmail,
        updatedAt: nowIso(),
      })
      .eq("id", tenantId)
      .select("*")
      .maybeSingle();
    if (error || !tenant) {
      throw { code: "TENANT_UPDATE_FAILED", message: error?.message ?? "Tenant not found" };
    }

    await AuditLog.log(tenantId, user.id, "TENANT_SETTINGS_UPDATED", "Tenant", tenantId, {
      name: tenant.name,
    });

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard");
    return { success: true, data: tenant };
  } catch (error: any) {
    console.error("Update tenant settings error:", error);
    return { success: false, error: error.message || "Could not update settings" };
  }
}

export async function updateTenantBilling(data: {
  invoiceEmail?: string;
  purchaseOrderNumber?: string;
  billingMethod: "INVOICE" | "DIRECT_DEBIT" | "CARD";
}) {
  try {
    const { user, tenantId } = await getSessionContext();
    const userTenant = user.tenants.find((t) => t.tenantId === tenantId);
    if (!userTenant || userTenant.role !== "ADMIN") {
      return { success: false, error: "Only administrators can change billing details" };
    }

    const { error } = await getAdminDb()
      .from("Tenant")
      .update({
        invoiceEmail: data.invoiceEmail?.trim() || null,
        purchaseOrderNumber: data.purchaseOrderNumber?.trim() || null,
        billingMethod: data.billingMethod,
        updatedAt: nowIso(),
      })
      .eq("id", tenantId);
    if (error) {
      throw { code: "TENANT_BILLING_UPDATE_FAILED", message: error.message };
    }

    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Could not save billing details" };
  }
}

export async function openStripeBillingPortal() {
  try {
    const { user, tenantId } = await getSessionContext();
    const userTenant = user.tenants.find((t) => t.tenantId === tenantId);
    if (!userTenant || userTenant.role !== "ADMIN") {
      return { success: false, error: "Only administrators can open billing" };
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "https://hseqnova.co.uk";
    const { createBillingPortalSession } = await import("@/lib/stripe-billing");
    const { url } = await createBillingPortalSession({
      tenantId,
      returnUrl: `${appUrl.replace(/\/$/, "")}/dashboard/settings`,
    });
    return { success: true, url };
  } catch (error: any) {
    return { success: false, error: error.message || "Could not open the billing portal" };
  }
}

export async function updateDashboardLocked(locked: boolean) {
  try {
    const { user, tenantId } = await getSessionContext();

    const userTenant = user.tenants.find((t) => t.tenantId === tenantId);
    if (!userTenant || userTenant.role !== "ADMIN") {
      return { success: false, error: "Only administrators can change dashboard lock" };
    }

    let lockedDashboardConfig: import("@prisma/client").Prisma.InputJsonValue | null = null;
    let lockedSimpleMenuItems: string[] | undefined;

    if (locked) {
      const { data: adminConfig } = await getAdminDb()
        .from("DashboardConfig")
        .select("widgets, simpleMenuItems")
        .eq("userId", user.id)
        .eq("tenantId", tenantId)
        .maybeSingle();

      if (adminConfig?.widgets) {
        lockedDashboardConfig = adminConfig.widgets as import("@prisma/client").Prisma.InputJsonValue;
      } else {
        const { getDefaultWidgetIdsForIndustry } = await import("@/features/dashboard/lib/widget-registry");
        const { data: tenant } = await getAdminDb()
          .from("Tenant")
          .select("industry")
          .eq("id", tenantId)
          .maybeSingle();
        const defaultIds = getDefaultWidgetIdsForIndustry(tenant?.industry as string | null | undefined);
        lockedDashboardConfig = defaultIds.map((id, i) => ({
          id,
          order: i,
          type: "builtin",
        })) as unknown as import("@prisma/client").Prisma.InputJsonValue;
      }

      if (Array.isArray(adminConfig?.simpleMenuItems)) {
        lockedSimpleMenuItems = adminConfig.simpleMenuItems as string[];
      }
    }

    const { error } = await getAdminDb()
      .from("Tenant")
      .update({
        dashboardLocked: locked,
        lockedDashboardConfig,
        ...(lockedSimpleMenuItems ? { simpleMenuItems: lockedSimpleMenuItems } : {}),
        updatedAt: nowIso(),
      })
      .eq("id", tenantId);
    if (error) {
      throw { code: "TENANT_UPDATE_FAILED", message: error.message };
    }

    await AuditLog.log(tenantId, user.id, "DASHBOARD_LOCK_TOGGLED", "Tenant", tenantId, {
      locked,
    });

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Could not update the dashboard lock" };
  }
}

export async function updateTenantSimpleMenuItems(hrefs: string[]) {
  try {
    const { user, tenantId } = await getSessionContext();
    const { normalizeSimpleMenuHrefs } = await import("@/lib/dashboard-nav-config");
    const menuHrefs = normalizeSimpleMenuHrefs(hrefs);

    const { data: tenant } = await getAdminDb()
      .from("Tenant")
      .select("dashboardLocked")
      .eq("id", tenantId)
      .maybeSingle();

    const userTenant = user.tenants.find((t) => t.tenantId === tenantId);
    const isAdmin = userTenant?.role === "ADMIN";
    const menuLocked = Boolean(tenant?.dashboardLocked);

    if (menuLocked && !isAdmin) {
      return { success: false, error: "The simple menu is locked by an administrator" };
    }

    if (menuLocked && isAdmin) {
      const { error } = await getAdminDb()
        .from("Tenant")
        .update({ simpleMenuItems: menuHrefs, updatedAt: nowIso() })
        .eq("id", tenantId);
      if (error) {
        throw { code: "TENANT_UPDATE_FAILED", message: error.message };
      }
    } else {
      const db = getAdminDb();
      const { data: existing } = await db
        .from("DashboardConfig")
        .select("id")
        .eq("userId", user.id)
        .eq("tenantId", tenantId)
        .maybeSingle();

      if (existing?.id) {
        const { error } = await db
          .from("DashboardConfig")
          .update({ simpleMenuItems: menuHrefs, updatedAt: nowIso() })
          .eq("id", existing.id);
        if (error) {
          throw { code: "DASHBOARD_CONFIG_UPDATE_FAILED", message: error.message };
        }
      } else {
        const { getDefaultWidgetIdsForIndustry } = await import("@/features/dashboard/lib/widget-registry");
        const { data: tenantRow } = await db
          .from("Tenant")
          .select("industry, simpleMenuItems")
          .eq("id", tenantId)
          .maybeSingle();
        const { menuPathsToWidgetIds } = await import("@/lib/menu-widget-sync");
        const widgetIds =
          Array.isArray(tenantRow?.simpleMenuItems)
            ? menuPathsToWidgetIds(tenantRow.simpleMenuItems as string[])
            : getDefaultWidgetIdsForIndustry(tenantRow?.industry as string | null | undefined);
        const widgets = widgetIds.map((id, order) => ({ id, order, type: "builtin" as const }));
        const { error } = await db.from("DashboardConfig").insert({
          id: createId(),
          userId: user.id,
          tenantId,
          widgets,
          simpleMenuItems: menuHrefs,
          updatedAt: nowIso(),
        });
        if (error) {
          throw { code: "DASHBOARD_CONFIG_CREATE_FAILED", message: error.message };
        }
      }
    }

    await AuditLog.log(tenantId, user.id, "TENANT_SIMPLE_MENU_UPDATED", "Tenant", tenantId, {
      count: menuHrefs.length,
      companyWide: menuLocked && isAdmin,
    });

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard", "layout");
    return { success: true };
  } catch (error: any) {
    console.error("Update simple menu error:", error);
    return { success: false, error: error.message || "Could not update the simple menu" };
  }
}

// ============================================================================
// USER SETTINGS
// ============================================================================

export async function updateUserProfile(data: {
  name?: string;
  email?: string;
  phone?: string;
  preferredLocale?: string;
}) {
  try {
    const { user, tenantId } = await getSessionContext();
    const allowedLocales = new Set(["en-GB"]);
    const preferredLocale = data.preferredLocale && allowedLocales.has(data.preferredLocale)
      ? data.preferredLocale
      : "en-GB";
    const phone = data.phone?.trim() ? data.phone.trim().slice(0, 40) : null;

    if (data.email && data.email !== user.email) {
      const existingUser = await findUserByEmail(data.email);
      if (existingUser) {
        return { success: false, error: "That email address is already in use" };
      }
    }

    const { data: updatedUser, error } = await getAdminDb()
      .from("User")
      .update({
        name: data.name,
        email: data.email,
        phone,
        preferredLocale,
        updatedAt: nowIso(),
      })
      .eq("id", user.id)
      .select("id, name, email, phone, preferredLocale")
      .maybeSingle();
    if (error || !updatedUser) {
      throw { code: "USER_UPDATE_FAILED", message: error?.message ?? "User not found" };
    }

    await getAdminDb()
      .from("UserTenant")
      .update({ phone, updatedAt: nowIso() })
      .eq("userId", user.id)
      .eq("tenantId", tenantId);

    revalidatePath("/dashboard/settings");
    return { success: true, data: updatedUser };
  } catch (error: any) {
    return { success: false, error: error.message || "Could not update profile" };
  }
}

export async function updateUserPassword(data: {
  currentPassword: string;
  newPassword: string;
}) {
  try {
    const { user } = await getSessionContext();

    // Verifiser nåværende passord
    if (!user.password) {
      return { success: false, error: "This account cannot change password here" };
    }

    const isValid = await bcrypt.compare(data.currentPassword, user.password);
    if (!isValid) {
      return { success: false, error: "Current password is incorrect" };
    }

    // Hash nytt passord
    const hashedPassword = await bcrypt.hash(data.newPassword, 10);

    const { error } = await getAdminDb()
      .from("User")
      .update({ password: hashedPassword, updatedAt: nowIso() })
      .eq("id", user.id);
    if (error) {
      throw { code: "USER_UPDATE_FAILED", message: error.message };
    }

    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error: any) {
    console.error("Update password error:", error);
    return { success: false, error: error.message || "Could not change password" };
  }
}

// ============================================================================
// USER MANAGEMENT (Admin only)
// ============================================================================

export async function getTenantUsers() {
  try {
    const { tenantId } = await getSessionContext();

    const { loadManagedUsers } = await import("@/server/queries/settings.queries");
    const userTenants = await loadManagedUsers(tenantId);

    return { success: true, data: userTenants };
  } catch (error: any) {
    console.error("Get tenant users error:", error);
    return { success: false, error: error.message || "Could not load people" };
  }
}

type InviteContext = {
  user: Awaited<ReturnType<typeof getSessionContext>>["user"];
  tenantId: string;
  tenantName: string;
};

async function inviteSingleUser(ctx: InviteContext, data: { email: string; name: string; role: string }): Promise<{ success: true } | { success: false; error: string }> {
    const named = validateInviteName(data.name);
    if (named.ok === false) {
      return { success: false, error: named.message };
    }

    const normalizedEmail = data.email.toLowerCase().trim();
  const db = getAdminDb();

  let existingUser = await findUserByEmail(normalizedEmail);

  if (existingUser) {
    const inTenant = await findMembership(existingUser.id as string, ctx.tenantId);
    if (inTenant) {
      return { success: false, error: `${normalizedEmail} is already a member` };
    }
  }

  const generateSecurePassword = () => {
    const charset = "abcdefghijklmnopqrstuvwxyz0123456789";
    let password = "";
    for (let i = 0; i < 16; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  };
  const tempPassword = generateSecurePassword();
  const hashedPassword = await bcrypt.hash(tempPassword, 10);
  const stamp = nowIso();

  if (!existingUser) {
    const userId = createId();
    const { data: createdUser, error: userError } = await db
      .from("User")
      .insert({
        id: userId,
        email: normalizedEmail,
        name: named.name,
        password: hashedPassword,
        updatedAt: stamp,
      })
          .select("id, email, name, password")
          .maybeSingle();
    if (userError || !createdUser) {
      throw { code: "USER_CREATE_FAILED", message: userError?.message ?? "Could not create user" };
    }
    existingUser = createdUser;

    const { error: membershipError } = await db.from("UserTenant").insert({
      id: createId(),
      userId,
      tenantId: ctx.tenantId,
      role: data.role as Role,
      invitationSentAt: stamp,
      updatedAt: stamp,
    });
    if (membershipError) {
      throw { code: "MEMBERSHIP_CREATE_FAILED", message: membershipError.message };
    }
  } else {
    const { error: passwordError } = await db
      .from("User")
      .update({ password: hashedPassword, updatedAt: stamp })
      .eq("id", existingUser.id);
    if (passwordError) {
      throw { code: "USER_UPDATE_FAILED", message: passwordError.message };
    }

    const { error: membershipError } = await db.from("UserTenant").insert({
      id: createId(),
      userId: existingUser.id,
      tenantId: ctx.tenantId,
      role: data.role as Role,
      invitationSentAt: stamp,
      updatedAt: stamp,
    });
    if (membershipError) {
      throw { code: "MEMBERSHIP_CREATE_FAILED", message: membershipError.message };
    }
  }

  try {
    const { sendUserInvitationEmail } = await import("@/lib/email-service");
    await sendUserInvitationEmail({
      to: normalizedEmail,
      userName: named.name,
      userEmail: normalizedEmail,
      tempPassword,
      companyName: ctx.tenantName,
      invitedByName: ctx.user.name || ctx.user.email,
    });
  } catch {
    // User is created; email failed
  }

  await AuditLog.log(ctx.tenantId, ctx.user.id, "USER_INVITED", "User", existingUser.id as string, {
    email: normalizedEmail,
    role: data.role,
  });

  return { success: true };
}

export async function inviteUser(data: { email: string; name: string; role: string }) {
  try {
    const { user, tenantId } = await getSessionContext();

    const userTenant = user.tenants.find((t) => t.tenantId === tenantId);
    if (!userTenant || userTenant.role !== "ADMIN") {
      return { success: false, error: "Only administrators can invite people" };
    }

    const { data: tenant } = await getAdminDb()
      .from("Tenant")
      .select("name")
      .eq("id", tenantId)
      .maybeSingle();
    if (!tenant) {
      return { success: false, error: "Company not found" };
    }

    const ctx: InviteContext = {
      user,
      tenantId,
      tenantName: tenant.name || "your company",
    };
    const result = await inviteSingleUser(ctx, data);

    if (!result.success) {
      const err = "error" in result ? result.error : "Could not send the invitation";
      return { success: false, error: err };
    }

    revalidateUsers();
    return { success: true, data: {} };
  } catch (error: any) {
    return { success: false, error: error.message || "Could not send the invitation" };
  }
}

export type ImportUsersResult =
  | { success: true; imported: number; skipped: number; errors: string[] }
  | { success: false; error: string };

export async function importUsersFromFile(formData: FormData): Promise<ImportUsersResult> {
  try {
    const { user, tenantId } = await getSessionContext();

    const userTenant = user.tenants.find((t) => t.tenantId === tenantId);
    if (!userTenant || userTenant.role !== "ADMIN") {
      return { success: false, error: "Only administrators can import people" };
    }

    const file = formData.get("file") as File | null;
    if (!file || !(file instanceof File)) {
      return { success: false, error: "No file selected" };
    }

    if (file.size > MAX_IMPORT_FILE_SIZE) {
      return { success: false, error: "File is too large. Maximum 2 MB." };
    }

    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
    if (ext !== ".csv" && ext !== ".xlsx") {
      return { success: false, error: "Only CSV or Excel (.xlsx) is allowed" };
    }

    const { data: tenant } = await getAdminDb()
      .from("Tenant")
      .select("pricingTier")
      .eq("id", tenantId)
      .maybeSingle();
    if (!tenant) {
      return { success: false, error: "Company not found" };
    }

    const currentUserCount = await countTenantUsers(tenantId);
    const { getSubscriptionLimits } = await import("@/lib/subscription");
    const limits = getSubscriptionLimits(tenant.pricingTier as any);

    let rows: ImportRow[];
    const buffer = Buffer.from(await file.arrayBuffer());

    if (ext === ".csv") {
      rows = parseCsvToRows(buffer);
    } else {
      rows = await parseExcelToRows(buffer);
    }

    if (rows.length === 0) {
      return {
        success: false,
        error: "No valid rows. Use columns: email, name, role, and optionally job title and manager.",
      };
    }

    if (rows.length > MAX_IMPORT_ROWS) {
      return {
        success: false,
        error: `Maximum ${MAX_IMPORT_ROWS} people per import. The file has ${rows.length} rows.`,
      };
    }

    if (currentUserCount + rows.length > limits.maxUsers && limits.maxUsers !== 999) {
      return {
        success: false,
        error: `Importen vil overskride brukergrensen (${limits.maxUsers}). Du har ${currentUserCount} brukere.`,
      };
    }

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];
    const db = getAdminDb();

    for (const row of rows) {
      const normalizedEmail = row.email.toLowerCase().trim();
      const stamp = nowIso();

      let existingUser = await findUserByEmail(normalizedEmail);

      const existingInTenant = existingUser
        ? await findMembership(existingUser.id as string, tenantId)
        : null;

      if (existingInTenant) {
        skipped++;
        continue;
      }

      if (!existingUser) {
        const userId = createId();
        const { data: createdUser, error: userError } = await db
          .from("User")
          .insert({
            id: userId,
            email: normalizedEmail,
            name: row.name,
            password: null,
            updatedAt: stamp,
          })
          .select("id, email, name, password")
          .maybeSingle();
        if (userError || !createdUser) {
          errors.push(`${normalizedEmail}: ${userError?.message ?? "could not create the user"}`);
          continue;
        }
        existingUser = createdUser;

        const { error: membershipError } = await db.from("UserTenant").insert({
          id: createId(),
          userId,
          tenantId,
          role: row.role,
          position: row.position,
          invitationSentAt: null,
          updatedAt: stamp,
        });
        if (membershipError) {
          errors.push(`${normalizedEmail}: ${membershipError.message}`);
          continue;
        }
      } else {
        const { error: membershipError } = await db.from("UserTenant").insert({
          id: createId(),
          userId: existingUser.id,
          tenantId,
          role: row.role,
          position: row.position,
          invitationSentAt: null,
          updatedAt: stamp,
        });
        if (membershipError) {
          errors.push(`${normalizedEmail}: ${membershipError.message}`);
          continue;
        }
      }
      imported++;
    }

    const managerAssignments = rows.filter((row) => row.managerEmail !== null);
    if (managerAssignments.length > 0) {
      const { data: memberships } = await db
        .from("UserTenant")
        .select("userId")
        .eq("tenantId", tenantId);
      const memberIds = (memberships ?? []).map((row) => row.userId as string);
      const { data: memberUsers } = memberIds.length
        ? await db.from("User").select("id, email").in("id", memberIds)
        : { data: [] as Array<{ id: string; email: string }> };
      const userIdByEmail = new Map(
        (memberUsers ?? []).map((member) => [
          String(member.email).toLowerCase(),
          member.id as string,
        ]),
      );

      for (const row of managerAssignments) {
        const managerId = userIdByEmail.get(row.managerEmail!);
        const employeeId = userIdByEmail.get(row.email);

        if (!employeeId) continue;
        if (!managerId) {
          errors.push(`${row.email}: no member with manager email ${row.managerEmail}`);
          continue;
        }
        if (managerId === employeeId) {
          errors.push(`${row.email}: cannot be their own line manager`);
          continue;
        }

        try {
          await assertNoManagerCycle(employeeId, managerId, createManagerLookup(tenantId));
          const { error } = await db
            .from("UserTenant")
            .update({ managerId, updatedAt: nowIso() })
            .eq("userId", employeeId)
            .eq("tenantId", tenantId);
          if (error) {
            throw { code: "MEMBERSHIP_UPDATE_FAILED", message: error.message };
          }
        } catch (cycleError: any) {
          errors.push(`${row.email}: ${cycleError.message}`);
        }
      }
    }

    await AuditLog.log(tenantId, user.id, "USERS_IMPORTED", "User", "", {
      imported,
      skipped,
      total: rows.length,
      managerWarnings: errors.length,
    });

    revalidateUsers();
    return { success: true, imported, skipped, errors };
  } catch (error: any) {
    console.error("Import users error:", error);
    return { success: false, error: error.message || "Could not import people" };
  }
}

export async function activateUserInTenant(userId: string): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const { user, tenantId } = await getSessionContext();

    const adminTenant = user.tenants.find((t) => t.tenantId === tenantId);
    if (!adminTenant || adminTenant.role !== "ADMIN") {
      return { success: false, error: "Only administrators can send invitations" };
    }
    if (userId === user.id) {
      return { success: false, error: "You cannot activate yourself" };
    }

    const userTenant = await findMembership(userId, tenantId);

    if (!userTenant) {
      return { success: false, error: "This person is not in the company" };
    }
    if (userTenant.invitationSentAt) {
      return { success: false, error: "This person has already been invited" };
    }

    const { data: targetUser } = await getAdminDb()
      .from("User")
      .select("email, name")
      .eq("id", userId)
      .maybeSingle();
    if (!targetUser) {
      return { success: false, error: "This person is not in the company" };
    }

    const { data: tenant } = await getAdminDb()
      .from("Tenant")
      .select("name")
      .eq("id", tenantId)
      .maybeSingle();
    const tenantName = tenant?.name ?? "your company";

    const generateSecurePassword = () => {
      const charset = "abcdefghijklmnopqrstuvwxyz0123456789";
      let password = "";
      for (let i = 0; i < 16; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
      }
      return password;
    };
    const tempPassword = generateSecurePassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const stamp = nowIso();
    const { error: passwordError } = await getAdminDb()
      .from("User")
      .update({ password: hashedPassword, updatedAt: stamp })
      .eq("id", userId);
    if (passwordError) {
      throw { code: "USER_UPDATE_FAILED", message: passwordError.message };
    }

    const { error: membershipError } = await getAdminDb()
      .from("UserTenant")
      .update({ invitationSentAt: stamp, updatedAt: stamp })
      .eq("id", userTenant.id);
    if (membershipError) {
      throw { code: "MEMBERSHIP_UPDATE_FAILED", message: membershipError.message };
    }

    try {
      const { sendUserInvitationEmail } = await import("@/lib/email-service");
      await sendUserInvitationEmail({
        to: targetUser.email,
        userName: targetUser.name ?? targetUser.email,
        userEmail: targetUser.email,
        tempPassword,
        companyName: tenantName,
        invitedByName: user.name || user.email,
      });
    } catch {
      // User is activated; email failed
    }

    await AuditLog.log(tenantId, user.id, "USER_ACTIVATED", "User", userId, {
      email: targetUser.email,
    });

    revalidateUsers();
    return { success: true };
  } catch (error: any) {
    console.error("Activate user error:", error);
    return { success: false, error: error.message || "Could not send the invitation" };
  }
}

export type ActivateAllResult =
  | { success: true; activated: number; failed: number; errors: string[] }
  | { success: false; error: string };

export async function activateAllPendingUsers(): Promise<ActivateAllResult> {
  try {
    const { user, tenantId } = await getSessionContext();

    const adminTenant = user.tenants.find((t) => t.tenantId === tenantId);
    if (!adminTenant || adminTenant.role !== "ADMIN") {
      return { success: false, error: "Only administrators can send invitations" };
    }

    const { data: pendingRows } = await getAdminDb()
      .from("UserTenant")
      .select("id, userId")
      .eq("tenantId", tenantId)
      .is("invitationSentAt", null)
      .neq("userId", user.id);

    const pendingMemberships = (pendingRows ?? []).filter(Boolean);
    if (pendingMemberships.length === 0) {
      return { success: false, error: "No one left to invite. Everyone imported already has an invitation." };
    }

    const pendingUserIds = pendingMemberships.map((row) => row.userId as string);
    const { data: pendingUsers } = await getAdminDb()
      .from("User")
      .select("id, email, name")
      .in("id", pendingUserIds);
    const userById = new Map((pendingUsers ?? []).map((row) => [row.id as string, row]));

    const pending = pendingMemberships.flatMap((row) => {
      const target = userById.get(row.userId as string);
      if (!target) return [];
      return [{ id: row.id as string, userId: row.userId as string, user: target }];
    });

    if (pending.length === 0) {
      return { success: false, error: "No one left to invite. Everyone imported already has an invitation." };
    }

    const { data: tenant } = await getAdminDb()
      .from("Tenant")
      .select("name")
      .eq("id", tenantId)
      .maybeSingle();
    const tenantName = tenant?.name ?? "your company";

    const generateSecurePassword = () => {
      const charset = "abcdefghijklmnopqrstuvwxyz0123456789";
      let password = "";
      for (let i = 0; i < 16; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
      }
      return password;
    };

    let activated = 0;
    let failed = 0;
    const errors: string[] = [];
    const { sendUserInvitationEmail } = await import("@/lib/email-service");

    for (const ut of pending) {
      try {
        const tempPassword = generateSecurePassword();
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        const stamp = nowIso();
        const { error: passwordError } = await getAdminDb()
          .from("User")
          .update({ password: hashedPassword, updatedAt: stamp })
          .eq("id", ut.userId);
        if (passwordError) {
          throw { code: "USER_UPDATE_FAILED", message: passwordError.message };
        }

        const { error: membershipError } = await getAdminDb()
          .from("UserTenant")
          .update({ invitationSentAt: stamp, updatedAt: stamp })
          .eq("id", ut.id);
        if (membershipError) {
          throw { code: "MEMBERSHIP_UPDATE_FAILED", message: membershipError.message };
        }

        await sendUserInvitationEmail({
          to: ut.user.email,
          userName: ut.user.name ?? ut.user.email,
          userEmail: ut.user.email,
          tempPassword,
          companyName: tenantName,
          invitedByName: user.name || user.email,
        });

        await AuditLog.log(tenantId, user.id, "USER_ACTIVATED", "User", ut.userId, {
          email: ut.user.email,
        });
        activated++;
      } catch (err) {
        failed++;
        errors.push(`${ut.user.email}: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    }

    revalidateUsers();
    return { success: true, activated, failed, errors };
  } catch (error: any) {
    console.error("Activate all users error:", error);
    return { success: false, error: error.message ?? "Could not send invitations" };
  }
}

export async function updateUserRole(userId: string, role: string) {
  try {
    const { user, tenantId } = await getSessionContext();

    // Sjekk om bruker er admin
    const userTenant = user.tenants.find((t) => t.tenantId === tenantId);
    if (!userTenant || userTenant.role !== "ADMIN") {
      return { success: false, error: "Only administrators can change roles" };
    }

    if (userId === user.id) {
      return { success: false, error: "You cannot change your own role" };
    }

    const { data: updatedUserTenant, error } = await getAdminDb()
      .from("UserTenant")
      .update({ role: role as Role, updatedAt: nowIso() })
      .eq("userId", userId)
      .eq("tenantId", tenantId)
      .select("*")
      .maybeSingle();
    if (error || !updatedUserTenant) {
      throw { code: "MEMBERSHIP_UPDATE_FAILED", message: error?.message ?? "Membership not found" };
    }

    await AuditLog.log(tenantId, user.id, "USER_ROLE_UPDATED", "User", userId, {
      newRole: role,
    });

    revalidateUsers();
    return { success: true, data: updatedUserTenant };
  } catch (error: any) {
    console.error("Update user role error:", error);
    return { success: false, error: error.message || "Could not update the role" };
  }
}

export async function removeUserFromTenant(userId: string) {
  try {
    const { user, tenantId } = await getSessionContext();

    // Sjekk om bruker er admin
    const userTenant = user.tenants.find((t) => t.tenantId === tenantId);
    if (!userTenant || userTenant.role !== "ADMIN") {
      return { success: false, error: "Only administrators can remove people" };
    }

    if (userId === user.id) {
      return { success: false, error: "You cannot remove yourself" };
    }

    const { error } = await getAdminDb()
      .from("UserTenant")
      .delete()
      .eq("userId", userId)
      .eq("tenantId", tenantId);
    if (error) {
      throw { code: "MEMBERSHIP_DELETE_FAILED", message: error.message };
    }

    await AuditLog.log(tenantId, user.id, "USER_REMOVED", "User", userId, {});

    revalidateUsers();
    return { success: true };
  } catch (error: any) {
    console.error("Remove user error:", error);
    return { success: false, error: error.message || "Could not remove this person" };
  }
}

// ============================================================================
// EMPLOYEE NUMBER
// ============================================================================

export async function updateEmployeeNumber(userId: string, employeeNumber: string) {
  try {
    const { user, tenantId } = await getSessionContext();

    const userTenant = user.tenants.find((t) => t.tenantId === tenantId);
    if (!userTenant || userTenant.role !== "ADMIN") {
      return { success: false, error: "Only administrators can set employee numbers" };
    }

    const value = employeeNumber.trim() || null;

    const { error } = await getAdminDb()
      .from("UserTenant")
      .update({ employeeNumber: value, updatedAt: nowIso() })
      .eq("userId", userId)
      .eq("tenantId", tenantId);
    if (error) {
      throw { code: "MEMBERSHIP_UPDATE_FAILED", message: error.message };
    }

    revalidateUsers();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Could not update the employee number" };
  }
}

// ============================================================================
// ORGANISASJONSHIERARKI (AML § 3-1: HMS-ansvar plassert i linjen)
// ============================================================================

async function requireAdminContext() {
  const { user, tenantId } = await getSessionContext();
  const userTenant = user.tenants.find((t) => t.tenantId === tenantId);
  if (!userTenant || userTenant.role !== "ADMIN") {
    throw new Error("Only administrators can change the organisation chart");
  }
  return { user, tenantId };
}

function createManagerLookup(tenantId: string) {
  return async (userId: string): Promise<string | null> => {
    const membership = await findMembership(userId, tenantId);
    return (membership?.managerId as string | null | undefined) ?? null;
  };
}

async function assertMembership(userId: string, tenantId: string) {
  const membership = await findMembership(userId, tenantId);
  if (!membership) {
    throw new Error("This person is not a member of the company");
  }
}

export async function updateUserManager(userId: string, managerId: string | null) {
  try {
    const { user, tenantId } = await requireAdminContext();
    await assertMembership(userId, tenantId);

    if (managerId) {
      await assertMembership(managerId, tenantId);
      await assertNoManagerCycle(userId, managerId, createManagerLookup(tenantId));
    }

    const { error } = await getAdminDb()
      .from("UserTenant")
      .update({ managerId, updatedAt: nowIso() })
      .eq("userId", userId)
      .eq("tenantId", tenantId);
    if (error) {
      throw { code: "MEMBERSHIP_UPDATE_FAILED", message: error.message };
    }

    await AuditLog.log(tenantId, user.id, "USER_MANAGER_UPDATED", "UserTenant", userId, {
      managerId,
    });

    revalidateUsers();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Could not update the line manager" };
  }
}

export async function updateUserPosition(userId: string, position: string) {
  try {
    const { user, tenantId } = await requireAdminContext();
    await assertMembership(userId, tenantId);

    const value = position.trim().slice(0, 100) || null;

    const { error } = await getAdminDb()
      .from("UserTenant")
      .update({ position: value, updatedAt: nowIso() })
      .eq("userId", userId)
      .eq("tenantId", tenantId);
    if (error) {
      throw { code: "MEMBERSHIP_UPDATE_FAILED", message: error.message };
    }

    await AuditLog.log(tenantId, user.id, "USER_POSITION_UPDATED", "UserTenant", userId, {
      position: value,
    });

    revalidateUsers();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Could not update the job title" };
  }
}

export async function assignManagerToUsers(userIds: string[], managerId: string | null) {
  try {
    const { user, tenantId } = await requireAdminContext();

    const uniqueUserIds = Array.from(new Set(userIds.filter((id) => id.trim().length > 0)));
    if (uniqueUserIds.length === 0) {
      return { success: false, error: "No people selected" };
    }
    if (managerId && uniqueUserIds.includes(managerId)) {
      return { success: false, error: "A person cannot be their own line manager" };
    }

    const { data: memberships } = await getAdminDb()
      .from("UserTenant")
      .select("userId")
      .eq("tenantId", tenantId)
      .in("userId", uniqueUserIds);
    if ((memberships ?? []).length !== uniqueUserIds.length) {
      return { success: false, error: "One or more of the selected people are not in this company" };
    }

    if (managerId) {
      await assertMembership(managerId, tenantId);
      const lookup = createManagerLookup(tenantId);
      for (const id of uniqueUserIds) {
        await assertNoManagerCycle(id, managerId, lookup);
      }
    }

    const { data: updated, error } = await getAdminDb()
      .from("UserTenant")
      .update({ managerId, updatedAt: nowIso() })
      .eq("tenantId", tenantId)
      .in("userId", uniqueUserIds)
      .select("userId");
    if (error) {
      throw { code: "MEMBERSHIP_UPDATE_FAILED", message: error.message };
    }

    await AuditLog.log(tenantId, user.id, "USER_MANAGER_BULK_UPDATED", "UserTenant", tenantId, {
      managerId,
      userCount: (updated ?? []).length,
    });

    revalidateUsers();
    return { success: true, updated: (updated ?? []).length };
  } catch (error: any) {
    return { success: false, error: error.message || "Could not assign the line manager" };
  }
}

// ============================================================================
// SUBSCRIPTION & INVOICES
// ============================================================================

export async function getSubscriptionInfo() {
  try {
    const { tenantId } = await getSessionContext();

    const tenant = await loadTenantWithSubscription(tenantId);
    if (!tenant) {
      return { success: false, error: "Tenant ikke funnet" };
    }

    const { data: invoices } = await getAdminDb()
      .from("Invoice")
      .select("*")
      .eq("tenantId", tenantId)
      .order("createdAt", { ascending: false })
      .limit(10);

    return { success: true, data: { ...tenant, invoices: invoices ?? [] } };
  } catch (error: any) {
    console.error("Get subscription info error:", error);
    return { success: false, error: error.message || "Kunne ikke hente abonnementsinformasjon" };
  }
}

// ============================================================================
// MODUL-SYNLIGHET
// ============================================================================

export async function updateModuleVisibility(config: Record<string, string[]>) {
  try {
    const { user, tenantId } = await getSessionContext();

    const userTenant = user.tenants.find((t) => t.tenantId === tenantId);
    if (!userTenant || userTenant.role !== "ADMIN") {
      return { success: false, error: "Kun administratorer kan endre modul-synlighet" };
    }

    const { parseModuleVisibilityConfig } = await import("@/lib/module-visibility");
    const validated = parseModuleVisibilityConfig(config);

    const { data: previous } = await getAdminDb()
      .from("Tenant")
      .select("moduleVisibilityConfig")
      .eq("id", tenantId)
      .maybeSingle();

    const { error } = await getAdminDb()
      .from("Tenant")
      .update({ moduleVisibilityConfig: validated ?? {}, updatedAt: nowIso() })
      .eq("id", tenantId);
    if (error) {
      throw { code: "TENANT_UPDATE_FAILED", message: error.message };
    }

    await AuditLog.log(
      tenantId,
      user.id,
      "MODULE_VISIBILITY_UPDATED",
      "Tenant",
      tenantId,
      {
        before: parseModuleVisibilityConfig(previous?.moduleVisibilityConfig),
        after: validated ?? {},
      }
    );

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Kunne ikke oppdatere modul-synlighet" };
  }
}

export async function getModuleVisibilityConfig() {
  try {
    const { tenantId } = await getSessionContext();

    const { data: tenant } = await getAdminDb()
      .from("Tenant")
      .select("moduleVisibilityConfig")
      .eq("id", tenantId)
      .maybeSingle();

    const { parseModuleVisibilityConfig } = await import("@/lib/module-visibility");
    const config = parseModuleVisibilityConfig(tenant?.moduleVisibilityConfig);
    return { success: true, data: config };
  } catch (error: any) {
    return { success: false, error: error.message || "Kunne ikke hente modul-synlighet" };
  }
}

// ============================================================================
// RUH-MODUL
// ============================================================================

/**
 * Slår RUH-modulen av eller på for virksomheten.
 * IK-HMS § 5 stiller krav om systematisk avviksbehandling, men ikke om at
 * uønskede hendelser må registreres i et eget spor. Virksomheter som samler alt
 * under Avvik kan derfor skjule RUH.
 */
export async function updateRuhModuleEnabled(enabled: boolean) {
  try {
    const { user, tenantId } = await getSessionContext();

    const userTenant = user.tenants.find((t) => t.tenantId === tenantId);
    if (!userTenant || userTenant.role !== "ADMIN") {
      return { success: false, error: "Kun administratorer kan endre RUH-modulen" };
    }

    const { data: previous } = await getAdminDb()
      .from("Tenant")
      .select("ruhModuleEnabled")
      .eq("id", tenantId)
      .maybeSingle();

    const { error } = await getAdminDb()
      .from("Tenant")
      .update({ ruhModuleEnabled: enabled, updatedAt: nowIso() })
      .eq("id", tenantId);
    if (error) {
      throw { code: "TENANT_UPDATE_FAILED", message: error.message };
    }

    await AuditLog.log(tenantId, user.id, "RUH_MODULE_UPDATED", "Tenant", tenantId, {
      before: previous?.ruhModuleEnabled ?? true,
      after: enabled,
    });

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/incidents");
    revalidatePath("/ansatt");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Kunne ikke oppdatere RUH-modulen" };
  }
}

