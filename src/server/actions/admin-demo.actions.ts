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
import { sendEmail } from "@/lib/email";
import { sendUserInvitationEmail } from "@/lib/email-service";
import { appBaseUrl } from "@/lib/signup-checkout";
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

    await sendUserInvitationEmail({
      to: email,
      userName: validated.contactPerson,
      userEmail: email,
      tempPassword: password,
      companyName: validated.name,
      invitedByName: staff.name || "HSEQ Nova",
    });

    const loginUrl = `${appBaseUrl()}/login`;
    const endsLabel = new Date(trialEndsAt).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const packNames = ["HSEQ Nova Core", ...addonIds.map((id) => ADDON_PACKS.find((pack) => pack.id === id)?.name ?? id)];
    await sendEmail({
      to: email,
      subject: `Your ${validated.demoDays}-day HSEQ Nova demo`,
      html: `<p>Hello ${validated.contactPerson},</p>
<p>You have ${validated.demoDays} days of demo access to HSEQ Nova for <strong>${validated.name}</strong>, ending on <strong>${endsLabel}</strong>.</p>
<p>Included in this demo: ${packNames.join(", ")}.</p>
<p>Sign in at <a href="${loginUrl}">${loginUrl}</a> with the login details in the invitation email. If you want to keep the workspace, subscribe from Settings or the subscribe page before the demo ends. Stripe will then start billing Core plus the add-ons you choose.</p>
<p>HSEQ Nova</p>`,
    });

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

    revalidatePath("/admin/tenants");
    revalidatePath("/admin/crm");
    return { success: true as const, tenantId, trialEndsAt };
  } catch (error: unknown) {
    return { success: false as const, error: errorMessage(error, "Could not create the demo workspace") };
  }
}
