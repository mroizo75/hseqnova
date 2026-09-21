import { getAdminDb } from "@/lib/supabase/admin";

export type AuthTenant = {
  id: string;
  status: string;
  name: string;
  isTavleOnly: boolean;
};

export type AuthMembership = {
  tenantId: string;
  role: string;
  updatedAt: string;
  tenant: AuthTenant | null;
};

export type AuthEnterpriseMembership = {
  enterpriseId: string;
  role: string;
  name: string;
  status: string;
};

export type AuthUserRow = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  password: string | null;
  isSuperAdmin: boolean;
  isSupport: boolean;
  isSales: boolean;
  isSalesManager: boolean;
  lastTenantId: string | null;
  lastEnterpriseId: string | null;
  preferredLocale: string;
  failedLoginAttempts: number;
  lockedUntil: string | null;
  tenants: AuthMembership[];
  enterprises: AuthEnterpriseMembership[];
};

function asMemberships(
  rows: Array<{ tenantId: string; role: string; updatedAt: string }> | null,
  tenants: AuthTenant[] | null,
): AuthMembership[] {
  const byId = new Map((tenants ?? []).map((tenant) => [tenant.id, tenant]));
  return (rows ?? []).map((row) => ({
    tenantId: row.tenantId,
    role: row.role,
    updatedAt: row.updatedAt,
    tenant: byId.get(row.tenantId) ?? null,
  }));
}

async function withMemberships(user: Omit<AuthUserRow, "tenants" | "enterprises">): Promise<AuthUserRow> {
  const db = getAdminDb();
  const { data: rows, error } = await db
    .from("UserTenant")
    .select("tenantId, role, updatedAt")
    .eq("userId", user.id);

  if (error) {
    throw { code: "MEMBERSHIP_LOOKUP_FAILED", message: error.message };
  }

  const tenantIds = (rows ?? []).map((row) => row.tenantId as string);
  let tenants: AuthTenant[] = [];
  if (tenantIds.length > 0) {
    const { data: tenantRows, error: tenantError } = await db
      .from("Tenant")
      .select("id, status, name, isTavleOnly")
      .in("id", tenantIds);
    if (tenantError) {
      throw { code: "TENANT_LOOKUP_FAILED", message: tenantError.message };
    }
    tenants = (tenantRows ?? []) as AuthTenant[];
  }

  const { data: enterpriseRows } = await db
    .from("EnterpriseUser")
    .select("enterpriseId, role")
    .eq("userId", user.id);

  const enterpriseIds = ((enterpriseRows ?? []) as Array<{ enterpriseId: string }>).map(
    (row) => row.enterpriseId,
  );
  let enterprises: AuthEnterpriseMembership[] = [];
  if (enterpriseIds.length > 0) {
    const { data: orgs } = await db
      .from("EnterpriseOrganisation")
      .select("id, name, status")
      .in("id", enterpriseIds);
    const byId = new Map(
      ((orgs ?? []) as Array<{ id: string; name: string; status: string }>).map((org) => [org.id, org]),
    );
    enterprises = ((enterpriseRows ?? []) as Array<{ enterpriseId: string; role: string }>)
      .map((row) => {
        const org = byId.get(row.enterpriseId);
        if (!org) return null;
        return {
          enterpriseId: row.enterpriseId,
          role: row.role,
          name: org.name,
          status: org.status,
        };
      })
      .filter((row): row is AuthEnterpriseMembership => row !== null);
  }

  return {
    ...user,
    tenants: asMemberships(rows as Array<{ tenantId: string; role: string; updatedAt: string }> | null, tenants),
    enterprises,
  };
}

export async function getAuthUserByEmail(email: string): Promise<AuthUserRow | null> {
  const { data, error } = await getAdminDb()
    .from("User")
    .select(
      "id, email, name, image, password, isSuperAdmin, isSupport, isSales, isSalesManager, lastTenantId, lastEnterpriseId, preferredLocale, failedLoginAttempts, lockedUntil",
    )
    .eq("email", email)
    .maybeSingle();

  if (error) {
    throw { code: "USER_LOOKUP_FAILED", message: error.message };
  }
  if (!data) {
    return null;
  }
  return withMemberships(data as Omit<AuthUserRow, "tenants" | "enterprises">);
}

export async function getAuthUserById(id: string): Promise<AuthUserRow | null> {
  const db = getAdminDb();
  const { data, error } = await db
    .from("User")
    .select(
      "id, email, name, image, password, isSuperAdmin, isSupport, isSales, isSalesManager, lastTenantId, lastEnterpriseId, preferredLocale, failedLoginAttempts, lockedUntil",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw { code: "USER_LOOKUP_FAILED", message: error.message };
  }
  if (!data) {
    return null;
  }
  return withMemberships(data as Omit<AuthUserRow, "tenants" | "enterprises">);
}

export async function getAuthMembership(userId: string, tenantId: string) {
  const { data, error } = await getAdminDb()
    .from("UserTenant")
    .select("role, updatedAt")
    .eq("userId", userId)
    .eq("tenantId", tenantId)
    .maybeSingle();

  if (error) {
    throw { code: "MEMBERSHIP_LOOKUP_FAILED", message: error.message };
  }
  return data as { role: string; updatedAt: string } | null;
}

export async function recordFailedLogin(userId: string, attempts: number, lockedUntil: Date | null) {
  const { error } = await getAdminDb()
    .from("User")
    .update({
      failedLoginAttempts: attempts,
      lastLoginAttempt: new Date().toISOString(),
      lockedUntil: lockedUntil ? lockedUntil.toISOString() : null,
      updatedAt: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    throw { code: "LOGIN_UPDATE_FAILED", message: error.message };
  }
}

export async function resetFailedLogins(userId: string) {
  const { error } = await getAdminDb()
    .from("User")
    .update({
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAttempt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    throw { code: "LOGIN_UPDATE_FAILED", message: error.message };
  }
}

export async function countOverdueInvoices(tenantId: string): Promise<number> {
  const { count, error } = await getAdminDb()
    .from("Invoice")
    .select("id", { count: "exact", head: true })
    .eq("tenantId", tenantId)
    .eq("status", "OVERDUE");

  if (error) {
    throw { code: "INVOICE_LOOKUP_FAILED", message: error.message };
  }
  return count ?? 0;
}
