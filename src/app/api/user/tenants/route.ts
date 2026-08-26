import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAdminDb } from "@/lib/supabase/admin";
import { getAppUser, getMemberships } from "@/lib/membership";
import { getTenantFeaturesForIndustry } from "@/lib/tenant-features";
import { parseModuleVisibilityConfig } from "@/lib/module-visibility";

type TenantListRow = {
  id: string;
  name: string;
  slug: string;
  status: string;
  employeeCount: number | null;
  industry: string | null;
  moduleVisibilityConfig: unknown;
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id && !session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user.id
      ? await getAppUser({ id: session.user.id })
      : await getAppUser({ email: session.user.email! });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const memberships = await getMemberships(user.id);
    const tenantIds = memberships.map((membership) => membership.tenantId);
    const { data: tenants } = tenantIds.length
      ? await getAdminDb()
          .from("Tenant")
          .select("id, name, slug, status, employeeCount, industry, moduleVisibilityConfig")
          .in("id", tenantIds)
      : { data: [] as TenantListRow[] };

    const { data: modules } = tenantIds.length
      ? await getAdminDb()
          .from("TenantModule")
          .select("tenantId, moduleKey, status")
          .in("tenantId", tenantIds)
          .in("status", ["ACTIVE", "TRIAL"])
      : { data: [] as Array<{ tenantId: string; moduleKey: string }> };

    const modulesByTenant = new Map<string, string[]>();
    for (const row of modules ?? []) {
      const list = modulesByTenant.get(row.tenantId) ?? [];
      list.push(row.moduleKey);
      modulesByTenant.set(row.tenantId, list);
    }

    const tenantRows = (tenants ?? []) as TenantListRow[];
    const tenantById = new Map(tenantRows.map((tenant) => [tenant.id, tenant]));

    const payload = memberships.flatMap((membership) => {
      const tenant = tenantById.get(membership.tenantId);
      if (!tenant) {
        return [];
      }
      return [
        {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          status: tenant.status,
          role: membership.role,
          employeeCount: tenant.employeeCount,
          industry: tenant.industry,
          features: getTenantFeaturesForIndustry(tenant.industry as string | null),
          moduleVisibilityConfig: parseModuleVisibilityConfig(tenant.moduleVisibilityConfig),
          enabledModules: modulesByTenant.get(membership.tenantId) ?? [],
        },
      ];
    });

    return NextResponse.json({
      tenants: payload,
      hasMultipleTenants: payload.length > 1,
      lastTenantId: user.lastTenantId,
    });
  } catch (error) {
    console.error("Get tenants error:", error);
    return NextResponse.json({ error: "Could not load companies" }, { status: 500 });
  }
}
