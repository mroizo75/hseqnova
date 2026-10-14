"use server";

import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePlatformStaff } from "@/lib/require-platform-staff";
import { canSeeOrganisations } from "@/lib/platform-access";
import { getAdminDb } from "@/lib/supabase/admin";
import { createId } from "@/lib/ids";
import { ADDON_PACKS, getAddonPack } from "@/lib/billing-catalog";
import { parseSignupAddonIds } from "@/lib/signup-checkout";
import { DEMO_DURATION_DAYS, DEMO_REGISTRATION_TYPE, demoEndsAt } from "@/lib/demo-access";
import { normalizeIndustryValue } from "@/lib/industry-packages";
import { activateAddonPackForTenant } from "@/server/queries/billing.queries";
import { sendDemoWorkspaceWelcomeEmail } from "@/lib/demo-workspace-email";
import { syncCrmFromTenant } from "@/features/crm/lib/sync-from-tenant";

const createDemoSchema = z.object({
  name: z.string().trim().min(2).max(120),
  companyNumber: z.string().trim().max(20).optional(),
  contactPerson: z.string().trim().min(2).max(80),
  contactEmail: z.string().trim().email().transform((value) => value.toLowerCase()),
  contactPhone: z.string().trim().max(30).optional(),
  industry: z.string().min(1),
  demoDays: z.number().int().refine((value) => (DEMO_DURATION_DAYS as readonly number[]).includes(value)),
  addonIds: z.array(z.string()),
});

function errorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

function nowIso(): string {
  return new Date().toISOString();
}

function temporaryPassword(): string {
  return `Hn-${randomBytes(6).toString("base64url")}`;
}

function toSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return base || "demo";
}

async function uniqueSlug(base: string): Promise<string> {
  const { data, error } = await getAdminDb().from("Tenant").select("slug").eq("slug", base).maybeSingle();
  if (error) {
    throw { code: "SLUG_LOOKUP_FAILED", message: error.message };
  }
  return data?.slug ? `${base}-${Date.now()}` : base;
}

export async function createDemoOrganisation(input: z.infer<typeof createDemoSchema>) {
  try {
    const staff = await requirePlatformStaff();
    if (!staff || !canSeeOrganisations(staff)) {
      return { success: false as const, error: "Only platform staff can create demo workspaces" };
    }

    const validated = createDemoSchema.parse(input);
    const addonIds = parseSignupAddonIds(validated.addonIds);
    for (const packId of addonIds) {
      if (!getAddonPack(packId)) {
        return { success: false as const, error: "Unknown add-on pack" };
      }
    }

    const db = getAdminDb();
    const now = nowIso();
    const trialEndsAt = demoEndsAt(validated.demoDays).toISOString();
    const tenantId = createId();
    const slug = await uniqueSlug(toSlug(validated.name));
    const industry = normalizeIndustryValue(validated.industry);
    const password = temporaryPassword();
    const hashed = await bcrypt.hash(password, 10);
    const email = validated.contactEmail;

    const { error: tenantError } = await db.from("Tenant").insert({
      id: tenantId,
      name: validated.name,
      slug,
      companyNumber: validated.companyNumber?.replace(/\s+/g, "").toUpperCase() || null,
      orgNumber: validated.companyNumber?.replace(/\s+/g, "").toUpperCase() || null,
      contactPerson: validated.contactPerson,
      contactEmail: email,
      contactPhone: validated.contactPhone || null,
      industry: industry || "other",
      employeeCount: 1,
      salesRep: staff.name || staff.email,
      status: "TRIAL",
      onboardingStatus: "ADMIN_CREATED",
      onboardingCompletedAt: now,
      registrationType: DEMO_REGISTRATION_TYPE,
      trialEndsAt,
      startpakkeCompleted: true,
      setupGuideHidden: true,
      hmsAnnualPlanEnabled: true,
      managementReviewFrequencyMonths: 12,
      notes: `Demo workspace (${validated.demoDays} days). Packs: ${["core", ...addonIds].join(", ")}.`,
      createdAt: now,
      updatedAt: now,
    });
    if (tenantError) {
      throw { code: "TENANT_CREATE_FAILED", message: tenantError.message };
    }

    for (const packId of addonIds) {
      await activateAddonPackForTenant({
        tenantId,
        packId,
        status: "TRIAL",
        endsAt: trialEndsAt,
      });
    }

    const { data: existingUser, error: userLookupError } = await db
      .from("User")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    if (userLookupError) {
      throw { code: "USER_LOOKUP_FAILED", message: userLookupError.message };
    }

    const userId = existingUser?.id ? String(existingUser.id) : createId();
    if (existingUser?.id) {
      const { error } = await db
        .from("User")
        .update({
          name: validated.contactPerson,
          password: hashed,
          emailVerified: now,
          lastTenantId: tenantId,
          updatedAt: now,
        })
        .eq("id", userId);
      if (error) {
        throw { code: "USER_UPDATE_FAILED", message: error.message };
      }
    } else {
      const { error } = await db.from("User").insert({
        id: userId,
        email,
        name: validated.contactPerson,
        password: hashed,
        emailVerified: now,
        preferredLocale: "en-GB",
        lastTenantId: tenantId,
        createdAt: now,
        updatedAt: now,
      });
      if (error) {
        throw { code: "USER_CREATE_FAILED", message: error.message };
      }
    }

    const { data: membership, error: membershipLookupError } = await db
      .from("UserTenant")
      .select("id")
      .eq("userId", userId)
      .eq("tenantId", tenantId)
      .maybeSingle();
    if (membershipLookupError) {
      throw { code: "MEMBERSHIP_LOOKUP_FAILED", message: membershipLookupError.message };
    }
    if (!membership?.id) {
      const { error } = await db.from("UserTenant").insert({
        id: createId(),
        userId,
        tenantId,
        role: "ADMIN",
        createdAt: now,
        updatedAt: now,
      });
      if (error) {
        throw { code: "MEMBERSHIP_CREATE_FAILED", message: error.message };
      }
    }

    const packNames = [
      "HSEQ Nova Core",
      ...addonIds.map((id) => ADDON_PACKS.find((pack) => pack.id === id)?.name ?? id),
    ];

    try {
      await sendDemoWorkspaceWelcomeEmail({
        to: email,
        contactName: validated.contactPerson,
        companyName: validated.name,
        password,
        demoDays: validated.demoDays,
        endsAt: new Date(trialEndsAt),
        packNames,
      });
    } catch (error: unknown) {
      return {
        success: false as const,
        error: `Demo workspace was created, but the login email could not be sent: ${errorMessage(error, "email provider error")}. Open the organisation and use “Send login email”.`,
        tenantId,
        trialEndsAt,
        emailSent: false as const,
      };
    }

    try {
      await syncCrmFromTenant(
        {
          id: tenantId,
          name: validated.name,
          companyNumber: validated.companyNumber,
          contactPerson: validated.contactPerson,
          contactEmail: email,
          contactPhone: validated.contactPhone,
          industry,
          status: "TRIAL",
          onboardingStatus: "ADMIN_CREATED",
          notes: `Demo ${validated.demoDays} days`,
        },
        { source: "MANUAL", stage: "DEMO", ownerId: staff.id },
      );
    } catch {
      // Workspace and email already succeeded.
    }

    revalidatePath("/admin/tenants");
    revalidatePath("/admin/crm");
    return {
      success: true as const,
      tenantId,
      trialEndsAt,
      emailSent: true as const,
      email,
    };
  } catch (error: unknown) {
    return { success: false as const, error: errorMessage(error, "Could not create the demo workspace") };
  }
}

export async function resendDemoWorkspaceEmail(tenantId: string) {
  try {
    const staff = await requirePlatformStaff();
    if (!staff || !canSeeOrganisations(staff)) {
      return { success: false as const, error: "Only platform staff can send demo login emails" };
    }

    const db = getAdminDb();
    const { data: tenant, error: tenantError } = await db
      .from("Tenant")
      .select("id, name, contactPerson, contactEmail, trialEndsAt, registrationType, notes")
      .eq("id", tenantId)
      .maybeSingle();
    if (tenantError || !tenant) {
      return { success: false as const, error: "Organisation not found" };
    }
    if (tenant.registrationType !== DEMO_REGISTRATION_TYPE) {
      return { success: false as const, error: "This is not a demo workspace" };
    }

    const email = String(tenant.contactEmail || "").trim().toLowerCase();
    if (!email) {
      return { success: false as const, error: "The demo has no contact email" };
    }

    const { data: membership, error: membershipError } = await db
      .from("UserTenant")
      .select("userId")
      .eq("tenantId", tenantId)
      .eq("role", "ADMIN")
      .limit(1)
      .maybeSingle();
    if (membershipError || !membership?.userId) {
      return { success: false as const, error: "No admin user on this demo" };
    }

    const password = temporaryPassword();
    const hashed = await bcrypt.hash(password, 10);
    const now = nowIso();
    const { error: userError } = await db
      .from("User")
      .update({ password: hashed, emailVerified: now, updatedAt: now })
      .eq("id", membership.userId);
    if (userError) {
      throw { code: "USER_UPDATE_FAILED", message: userError.message };
    }

    const notes = String(tenant.notes ?? "");
    const demoDaysMatch = notes.match(/Demo workspace \((\d+) days\)/);
    const demoDays = demoDaysMatch ? Number(demoDaysMatch[1]) : 7;
    const packIds = notes
      .split("Packs:")[1]
      ?.split(".")[0]
      ?.split(",")
      .map((value) => value.trim())
      .filter((value) => value && value !== "core") ?? [];
    const packNames = [
      "HSEQ Nova Core",
      ...packIds.map((id) => ADDON_PACKS.find((pack) => pack.id === id)?.name ?? id),
    ];
    const endsAt = tenant.trialEndsAt ? new Date(String(tenant.trialEndsAt)) : demoEndsAt(demoDays);

    await sendDemoWorkspaceWelcomeEmail({
      to: email,
      contactName: String(tenant.contactPerson || "there"),
      companyName: String(tenant.name),
      password,
      demoDays,
      endsAt,
      packNames,
    });

    revalidatePath(`/admin/tenants/${tenantId}`);
    return { success: true as const, email };
  } catch (error: unknown) {
    return { success: false as const, error: errorMessage(error, "Could not send the demo login email") };
  }
}
