"use server";

import { getAdminDb } from "@/lib/supabase/admin";
import { getAuthContext } from "@/lib/server-authorization";
import { createId } from "@/lib/ids";
import { revalidatePath } from "next/cache";
import type { Role } from "@prisma/client";

async function getSessionContext() {
  const auth = await getAuthContext();
  if (!auth) {
    return { error: "Not signed in" };
  }
  if (auth.role !== "ADMIN") {
    return { error: "Only administrators can change Microsoft 365 sign-in" };
  }
  return { userId: auth.userId, tenantId: auth.tenantId, role: auth.role };
}

const allowedRoles: Role[] = ["ADMIN", "HMS", "LEDER", "VERNEOMBUD", "ANSATT", "BHT", "REVISOR"];

/**
 * Oppdater Azure AD/Microsoft SSO innstillinger for tenant
 * FORENKLET: Krever kun domene, ikke Tenant ID fra kunde
 */
export async function updateAzureAdSettings(data: {
  azureAdEnabled?: boolean;
  azureAdDomain?: string;
  azureAdAutoRole?: string;
}) {
  try {
    const context = await getSessionContext();
    if ("error" in context) {
      return { success: false, error: context.error };
    }

    const { tenantId } = context;

    // Valider domene-format (påkrevd hvis SSO aktiveres)
    if (data.azureAdEnabled && !data.azureAdDomain) {
      return {
        success: false,
        error: "Email domain is required to turn on Microsoft sign-in",
      };
    }

    if (data.azureAdDomain) {
      const domainRegex = /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/i;
      if (!domainRegex.test(data.azureAdDomain)) {
        return {
          success: false,
          error: "Invalid domain. Example: company.co.uk (no @)",
        };
      }
    }

    if (data.azureAdAutoRole && !allowedRoles.includes(data.azureAdAutoRole as Role)) {
      return {
        success: false,
        error: "Invalid default role",
      };
    }

    const { error } = await getAdminDb()
      .from("Tenant")
      .update({
        azureAdEnabled: data.azureAdEnabled,
        azureAdDomain: data.azureAdDomain?.toLowerCase(),
        azureAdAutoRole: data.azureAdAutoRole ? (data.azureAdAutoRole as Role) : null,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", tenantId);
    if (error) {
      throw { code: "TENANT_UPDATE_FAILED", message: error.message };
    }

    revalidatePath("/dashboard/settings");
    
    return { success: true };
  } catch (error) {
    console.error("Error updating Azure AD settings:", error);
    return {
      success: false,
      error: "Could not save Microsoft 365 settings",
    };
  }
}

/**
 * @deprecated Synkronisering krever Microsoft Graph API admin consent fra HVER kunde.
 * Dette er for komplisert for små bedrifter. Bruk heller JIT provisioning (automatisk opprettelse ved innlogging).
 * Beholdes for bakoverkompatibilitet.
 */
export async function syncAzureAdUsers() {
  try {
    const context = await getSessionContext();
    if ("error" in context) {
      return { success: false, error: context.error };
    }

    const { tenantId } = context;

    // Hent tenant med Azure AD konfigurasjon
    const { data: tenant } = await getAdminDb()
      .from("Tenant")
      .select("id, azureAdTenantId, azureAdEnabled, azureAdDomain, azureAdAutoRole")
      .eq("id", tenantId)
      .maybeSingle();

    if (!tenant?.azureAdEnabled || !tenant.azureAdTenantId) {
      return {
        success: false,
        error: "Azure AD er ikke konfigurert for denne bedriften",
      };
    }

    // Hent brukere fra Azure AD via Microsoft Graph API
    const { fetchAzureAdUsers } = await import("@/lib/microsoft-graph");
    const graphResult = await fetchAzureAdUsers(
      tenant.azureAdTenantId,
      tenant.azureAdDomain || undefined
    );

    if (!graphResult.success || !graphResult.users) {
      return {
        success: false,
        error: graphResult.error || "Kunne ikke hente brukere fra Azure AD",
      };
    }

    let createdCount = 0;
    let updatedCount = 0;

    // Opprett eller oppdater brukere i HMS Nova
    for (const azureUser of graphResult.users) {
      const email = azureUser.mail || azureUser.userPrincipalName;
      if (!email) continue;

      // Sjekk om bruker allerede eksisterer
      const { data: existingUser } = await getAdminDb()
        .from("User")
        .select("id, name")
        .eq("email", email.toLowerCase())
        .maybeSingle();

      if (existingUser) {
        const { data: membership } = await getAdminDb()
          .from("UserTenant")
          .select("id")
          .eq("userId", existingUser.id)
          .eq("tenantId", tenant.id)
          .maybeSingle();

        if (!membership) {
          const { error } = await getAdminDb().from("UserTenant").insert({
            id: createId(),
            userId: existingUser.id,
            tenantId: tenant.id,
            role: (tenant.azureAdAutoRole as Role) || "ANSATT",
            department: azureUser.department || undefined,
            updatedAt: new Date().toISOString(),
          });
          if (error) {
            throw { code: "MEMBERSHIP_CREATE_FAILED", message: error.message };
          }
          createdCount++;
        } else if (azureUser.displayName && existingUser.name !== azureUser.displayName) {
          const { error } = await getAdminDb()
            .from("User")
            .update({ name: azureUser.displayName, updatedAt: new Date().toISOString() })
            .eq("id", existingUser.id);
          if (error) {
            throw { code: "USER_UPDATE_FAILED", message: error.message };
          }
          updatedCount++;
        }
      } else {
        const userId = createId();
        const stamp = new Date().toISOString();
        const { error: userError } = await getAdminDb().from("User").insert({
          id: userId,
          email: email.toLowerCase(),
          name: azureUser.displayName,
          emailVerified: stamp,
          phone: azureUser.mobilePhone || azureUser.businessPhones?.[0] || undefined,
          updatedAt: stamp,
        });
        if (userError) {
          throw { code: "USER_CREATE_FAILED", message: userError.message };
        }
        const { error: membershipError } = await getAdminDb().from("UserTenant").insert({
          id: createId(),
          userId,
          tenantId: tenant.id,
          role: (tenant.azureAdAutoRole as Role) || "ANSATT",
          department: azureUser.department || undefined,
          updatedAt: stamp,
        });
        if (membershipError) {
          throw { code: "MEMBERSHIP_CREATE_FAILED", message: membershipError.message };
        }
        createdCount++;
      }
    }

    // Oppdater sist synkronisert
    const { error } = await getAdminDb()
      .from("Tenant")
      .update({ azureAdLastSync: new Date().toISOString(), updatedAt: new Date().toISOString() })
      .eq("id", tenantId);
    if (error) {
      throw { code: "TENANT_UPDATE_FAILED", message: error.message };
    }

    revalidatePath("/dashboard/settings");

    return {
      success: true,
      data: {
        created: createdCount,
        updated: updatedCount,
        total: graphResult.users.length,
      },
    };
  } catch (error) {
    console.error("Error syncing Azure AD users:", error);
    return {
      success: false,
      error: "Kunne ikke synkronisere brukere fra Azure AD",
    };
  }
}

/**
 * Validerer om en bruker kan logge inn via Azure AD basert på tenant-konfigurasjon
 * @param upnOrEmail - UserPrincipalName fra Azure AD (for domene-sjekk)
 * @param primaryEmail - Primær e-post som skal brukes for brukeroppretting (optional)
 */
export async function validateAzureAdLogin(
  upnOrEmail: string,
  primaryEmail?: string
): Promise<{
  allowed: boolean;
  tenantId?: string;
  role?: Role;
  error?: string;
  email?: string; // E-posten som skal brukes for brukeren
}> {
  try {
    // Hent domene fra UPN/e-post (for tenant-matching)
    const domain = upnOrEmail.split("@")[1];
    if (!domain) {
      return { allowed: false, error: "Ugyldig e-postadresse" };
    }

    console.log(`🔍 Validating SSO: UPN domain="${domain}", primaryEmail="${primaryEmail || upnOrEmail}"`);

    // Finn tenant med matching domene og aktivert Azure AD
    const { data: tenant } = await getAdminDb()
      .from("Tenant")
      .select("id, azureAdAutoRole, status, name")
      .eq("azureAdEnabled", true)
      .eq("azureAdDomain", domain.toLowerCase())
      .maybeSingle();

    if (!tenant) {
      console.log(`❌ No tenant found for domain: ${domain}`);
      return {
        allowed: false,
        error: "Ingen aktiv HMS Nova-konto funnet for dette domenet",
      };
    }

    if (tenant.status === "SUSPENDED" || tenant.status === "CANCELLED") {
      return {
        allowed: false,
        error: "Bedriftskontoen er suspendert. Kontakt support@hmsnova.com",
      };
    }

    // Bruk primær e-post hvis oppgitt, ellers UPN
    const userEmail = (primaryEmail || upnOrEmail).toLowerCase();

    console.log(`✅ Tenant found: ${tenant.name} (${tenant.id}) for domain ${domain}`);
    console.log(`📧 User email to use: ${userEmail}`);

    // Sjekk om bruker allerede eksisterer (med HVILKEN SOM HELST e-post)
    // Dette håndterer tilfeller hvor bruker har byttet fra gmail.com til bedrift.no
    const { data: existingUser } = await getAdminDb()
      .from("User")
      .select("id")
      .eq("email", userEmail)
      .maybeSingle();

    if (existingUser) {
      const { data: tenantMembership } = await getAdminDb()
        .from("UserTenant")
        .select("tenantId, role")
        .eq("userId", existingUser.id)
        .eq("tenantId", tenant.id)
        .maybeSingle();
      if (!tenantMembership) {
        return {
          allowed: true,
          tenantId: tenant.id,
          role: (tenant.azureAdAutoRole as Role) || "ANSATT",
          email: userEmail,
        };
      }
      // Bruker eksisterer allerede
      console.log(`✅ Existing user found with tenant: ${userEmail}`);
      return {
        allowed: true,
        tenantId: tenant.id,
        role: tenantMembership.role,
        email: userEmail,
      };
    }

    // Ny bruker - skal opprettes med standard rolle
    console.log(`🆕 New user will be created: ${userEmail} in tenant ${tenant.name}`);
    return {
      allowed: true,
      tenantId: tenant.id,
      role: (tenant.azureAdAutoRole as Role) || "ANSATT",
      email: userEmail,
    };
  } catch (error) {
    console.error("Error validating Azure AD login:", error);
    return {
      allowed: false,
      error: "Kunne ikke validere innlogging",
    };
  }
}

