/**
 * Server-side authorization utility
 * 
 * Bruk denne for å sjekke tilganger i server actions
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAdminDb } from "@/lib/supabase/admin";
import { getAppUser, resolveTenantId } from "@/lib/membership";
import { Role } from "@prisma/client";
import { type RolePermissions } from "@/lib/permissions";
import {
  parseModuleVisibilityConfig,
  getEffectivePermissions,
  type ModuleVisibilityConfig,
} from "@/lib/module-visibility";

export interface AuthContext {
  userId: string;
  userEmail: string;
  tenantId: string;
  role: Role;
  permissions: RolePermissions;
  moduleVisibilityConfig: ModuleVisibilityConfig | null;
}

/**
 * Hent effektiv tilgang for en rolle i en tenant.
 * Respekterer moduleVisibilityConfig (null = MODULE_DEFAULTS).
 * Bruk denne i API-ruter i stedet for rå getPermissions(role).
 */
export async function resolveEffectivePermissions(
  tenantId: string,
  role: Role
): Promise<RolePermissions> {
  const { data: tenant } = await getAdminDb()
    .from("Tenant")
    .select("moduleVisibilityConfig")
    .eq("id", tenantId)
    .maybeSingle();

  return getEffectivePermissions(
    role,
    parseModuleVisibilityConfig(tenant?.moduleVisibilityConfig)
  );
}

/**
 * Hent brukerens context og sjekk autorisasjon.
 * Inkluderer tenant-spesifikk modul-synlighet som overstyrer standard rolePermissions.
 */
export async function getAuthContext(): Promise<AuthContext | null> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return null;
  }

  const user = session.user.id
    ? await getAppUser({ id: session.user.id })
    : await getAppUser({ email: session.user.email });

  if (!user) {
    return null;
  }

  const tenantId = await resolveTenantId(user.id, session.user.tenantId);
  if (!tenantId) {
    return null;
  }

  const { data: userTenant } = await getAdminDb()
    .from("UserTenant")
    .select("tenantId, role")
    .eq("userId", user.id)
    .eq("tenantId", tenantId)
    .maybeSingle();

  if (!userTenant) {
    return null;
  }

  const role = userTenant.role as Role;

  const { data: tenant } = await getAdminDb()
    .from("Tenant")
    .select("moduleVisibilityConfig")
    .eq("id", userTenant.tenantId)
    .maybeSingle();

  const moduleVisibilityConfig = parseModuleVisibilityConfig(
    tenant?.moduleVisibilityConfig
  );

  const permissions = getEffectivePermissions(role, moduleVisibilityConfig);

  return {
    userId: user.id,
    userEmail: user.email,
    tenantId: userTenant.tenantId,
    role,
    permissions,
    moduleVisibilityConfig,
  };
}

/**
 * Sjekk om brukeren har en spesifikk tilgang
 * Kaster feil hvis ikke autorisert
 */
export async function requirePermission(
  permission: keyof RolePermissions
): Promise<AuthContext> {
  const context = await getAuthContext();

  if (!context) {
    throw new Error("Ikke autentisert");
  }

  if (!context.permissions[permission]) {
    throw new Error("Ikke autorisert til å utføre denne handlingen");
  }

  return context;
}

/**
 * Sjekk om brukeren har tilgang til en bestemt tenant
 */
export async function requireTenantAccess(tenantId: string): Promise<AuthContext> {
  const context = await getAuthContext();

  if (!context) {
    throw new Error("Ikke autentisert");
  }

  if (context.tenantId !== tenantId) {
    throw new Error("Ikke autorisert til å aksessere denne bedriften");
  }

  return context;
}

/**
 * Sjekk om brukeren eier en ressurs (eller har tilgang til den)
 */
export async function requireResourceAccess(
  resourceType: "document" | "risk" | "incident" | "measure" | "audit" | "training" | "goal" | "chemical",
  resourceId: string
): Promise<AuthContext> {
  const context = await getAuthContext();

  if (!context) {
    throw new Error("Ikke autentisert");
  }

  // Hent ressursen for å sjekke tenantId
  let resource: { tenantId: string; [key: string]: any } | null = null;

  switch (resourceType) {
    case "document":
      resource = (await getAdminDb().from("Document").select("tenantId").eq("id", resourceId).maybeSingle()).data;
      break;
    case "risk":
      resource = (await getAdminDb().from("Risk").select("tenantId").eq("id", resourceId).maybeSingle()).data;
      break;
    case "incident":
      resource = (await getAdminDb().from("Incident").select("tenantId").eq("id", resourceId).maybeSingle()).data;
      break;
    case "measure":
      resource = (await getAdminDb().from("Measure").select("tenantId").eq("id", resourceId).maybeSingle()).data;
      break;
    case "audit":
      resource = (await getAdminDb().from("Audit").select("tenantId").eq("id", resourceId).maybeSingle()).data;
      break;
    case "training":
      resource = (await getAdminDb().from("Training").select("tenantId").eq("id", resourceId).maybeSingle()).data;
      break;
    case "goal":
      resource = (await getAdminDb().from("Goal").select("tenantId").eq("id", resourceId).maybeSingle()).data;
      break;
    case "chemical":
      resource = (await getAdminDb().from("Chemical").select("tenantId").eq("id", resourceId).maybeSingle()).data;
      break;
  }

  if (!resource) {
    throw new Error("Ressurs ikke funnet");
  }

  if (resource.tenantId !== context.tenantId) {
    throw new Error("Ikke autorisert til å aksessere denne ressursen");
  }

  return context;
}

