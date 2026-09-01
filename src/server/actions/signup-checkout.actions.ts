"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { getAdminDb } from "@/lib/supabase/admin";
import { createId } from "@/lib/ids";
import { getAuthContext } from "@/lib/server-authorization";
import { createCheckoutSession } from "@/lib/stripe-billing";
import { type AddonPackId } from "@/lib/billing-catalog";
import {
  appBaseUrl,
  buildSignupMetadata,
  COMPANY_NUMBER_IN_USE_MESSAGE,
  needsPaymentGate,
  normalizeCompanyNumber,
  parseSignupAddonIds,
  pickResumableSignupTenant,
  publicCheckoutError,
  resolveSignupPriceIds,
} from "@/lib/signup-checkout";
import { syncCrmFromTenant } from "@/features/crm/lib/sync-from-tenant";

const signupSchema = z.object({
  companyName: z.string().trim().min(2, "Company name must be at least 2 characters").max(120),
  companyNumber: z
    .string()
    .transform(normalizeCompanyNumber)
    .refine((value) => /^[A-Z0-9]{8}$/.test(value), "Enter an 8-character Companies House number"),
  contactName: z.string().trim().min(2, "Contact name is required").max(80),
  email: z.string().trim().email("Enter a valid work email").transform((value) => value.toLowerCase()),
  password: z.string().min(8, "Password must be at least 8 characters").max(200).optional(),
  phone: z.string().trim().max(30).optional(),
  vatNumber: z
    .string()
    .trim()
    .max(20)
    .optional()
    .transform((value) => (value && value.length > 0 ? value.toUpperCase().replace(/\s+/g, "") : undefined)),
  billingMethod: z.enum(["CARD", "DIRECT_DEBIT"]),
  addonIds: z.array(z.string()),
  acceptedTerms: z.literal(true, { message: "You must accept the terms" }),
  resume: z.boolean().optional(),
});

export type StartSelfServeCheckoutInput = z.input<typeof signupSchema>;

function errorMessage(error: unknown, fallback: string): string {
  return publicCheckoutError(error, fallback);
}

function nowIso(): string {
  return new Date().toISOString();
}

function toSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return base || "company";
}

async function uniqueSlug(base: string): Promise<string> {
  const { data, error } = await getAdminDb()
    .from("Tenant")
    .select("slug")
    .eq("slug", base)
    .maybeSingle();
  if (error) {
    throw { code: "SLUG_LOOKUP_FAILED", message: error.message };
  }
  return data?.slug ? `${base}-${Date.now()}` : base;
}

async function checkoutUrl(input: {
  tenantId: string;
  addonIds: AddonPackId[];
  billingMethod: "CARD" | "DIRECT_DEBIT";
}): Promise<string> {
  const { priceIds, missing } = resolveSignupPriceIds(input.addonIds);
  if (missing.length > 0) {
    throw {
      code: "STRIPE_PRICE_MISSING",
      message: "Stripe prices are not configured. Contact hello@hseqnova.co.uk.",
      details: missing,
    };
  }

  const base = appBaseUrl();
  const metadata = buildSignupMetadata(input.tenantId, input.addonIds);
  const { url } = await createCheckoutSession({
    tenantId: input.tenantId,
    priceIds,
    billingMethod: input.billingMethod,
    successUrl: `${base}/login?checkout=success`,
    cancelUrl: `${base}/register?cancelled=1`,
    metadata,
  });
  return url;
}

function reopenUnpaidSignupPayload(now: string) {
  return {
    status: "TRIAL",
    suspendedAt: null,
    onboardingStatus: "NOT_STARTED",
    updatedAt: now,
  };
}

async function findUnpaidTenantForUser(userId: string): Promise<{
  id: string;
  onboardingStatus: string | null;
  stripeSubscriptionId: string | null;
  status: string | null;
} | null> {
  const { data: memberships, error } = await getAdminDb()
    .from("UserTenant")
    .select("tenantId")
    .eq("userId", userId);
  if (error) {
    throw { code: "MEMBERSHIP_LOOKUP_FAILED", message: error.message };
  }
  const tenantIds = (memberships ?? []).map((row) => String(row.tenantId));
  if (tenantIds.length === 0) return null;

  const { data: tenants, error: tenantError } = await getAdminDb()
    .from("Tenant")
    .select("id, onboardingStatus, stripeSubscriptionId, status")
    .in("id", tenantIds);
  if (tenantError) {
    throw { code: "TENANT_LOOKUP_FAILED", message: tenantError.message };
  }
  return (tenants ?? []).find((tenant) => needsPaymentGate(tenant)) ?? null;
}

export async function startSelfServeCheckout(
  raw: StartSelfServeCheckoutInput,
): Promise<{ success: true; url: string } | { success: false; error: string }> {
  try {
    const parsed = signupSchema.safeParse(raw);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Check the form and try again" };
    }

    const data = parsed.data;
    const addonIds = parseSignupAddonIds(data.addonIds);
    const db = getAdminDb();
    const now = nowIso();

    const { data: existingUser, error: userError } = await db
      .from("User")
      .select("id, email")
      .eq("email", data.email)
      .maybeSingle();
    if (userError) {
      throw { code: "USER_LOOKUP_FAILED", message: userError.message };
    }

    if (existingUser?.id) {
      const unpaid = await findUnpaidTenantForUser(existingUser.id);
      if (!unpaid) {
        return {
          success: false,
          error: "This email is already registered. Sign in, or contact hello@hseqnova.co.uk.",
        };
      }

      if (data.password) {
        const hashed = await bcrypt.hash(data.password, 10);
        const { error: passwordError } = await db
          .from("User")
          .update({ password: hashed, name: data.contactName, updatedAt: now })
          .eq("id", existingUser.id);
        if (passwordError) {
          throw { code: "USER_UPDATE_FAILED", message: passwordError.message };
        }
      }

      const { error: tenantError } = await db
        .from("Tenant")
        .update({
          ...reopenUnpaidSignupPayload(now),
          billingMethod: data.billingMethod,
          contactPerson: data.contactName,
          contactPhone: data.phone || null,
          vatNumber: data.vatNumber || null,
        })
        .eq("id", unpaid.id);
      if (tenantError) {
        throw { code: "TENANT_UPDATE_FAILED", message: tenantError.message };
      }

      const url = await checkoutUrl({
        tenantId: unpaid.id,
        addonIds,
        billingMethod: data.billingMethod,
      });
      return { success: true, url };
    }

    if (data.resume) {
      return { success: false, error: "No unpaid registration was found for this email. Sign up again." };
    }
    if (!data.password) {
      return { success: false, error: "Password must be at least 8 characters" };
    }

    const { data: companyRows, error: companyError } = await db
      .from("Tenant")
      .select("id, onboardingStatus, stripeSubscriptionId, status")
      .or(`companyNumber.eq.${data.companyNumber},orgNumber.eq.${data.companyNumber}`);
    if (companyError) {
      throw { code: "COMPANY_LOOKUP_FAILED", message: companyError.message };
    }
    const { resume: existingCompany, blocked } = pickResumableSignupTenant(
      (companyRows ?? []).map((row) => ({
        id: String(row.id),
        onboardingStatus: (row.onboardingStatus as string | null) ?? null,
        stripeSubscriptionId: (row.stripeSubscriptionId as string | null) ?? null,
        status: (row.status as string | null) ?? null,
      })),
    );
    if (blocked) {
      return {
        success: false,
        error: COMPANY_NUMBER_IN_USE_MESSAGE,
      };
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const tenantId = existingCompany?.id ?? createId();
    const userId = createId();

    if (existingCompany) {
      const { error: reuseError } = await db
        .from("Tenant")
        .update({
          name: data.companyName,
          contactEmail: data.email,
          invoiceEmail: data.email,
          contactPhone: data.phone || null,
          contactPerson: data.contactName,
          billingMethod: data.billingMethod,
          termsAcceptedAt: now,
          vatNumber: data.vatNumber || null,
          ...reopenUnpaidSignupPayload(now),
        })
        .eq("id", existingCompany.id);
      if (reuseError) {
        throw { code: "TENANT_UPDATE_FAILED", message: reuseError.message };
      }
    }

    if (!existingCompany) {
      const slug = await uniqueSlug(toSlug(data.companyName));
      const { error: insertTenantError } = await db.from("Tenant").insert({
        id: tenantId,
        name: data.companyName,
        slug,
        orgNumber: data.companyNumber,
        companyNumber: data.companyNumber,
        status: "TRIAL",
        contactEmail: data.email,
        invoiceEmail: data.email,
        contactPhone: data.phone || null,
        contactPerson: data.contactName,
        billingMethod: data.billingMethod,
        vatNumber: data.vatNumber || null,
        onboardingStatus: "NOT_STARTED",
        registrationType: "STANDARD",
        termsAcceptedAt: now,
        createdAt: now,
        updatedAt: now,
      });
      if (insertTenantError) {
        throw { code: "TENANT_CREATE_FAILED", message: insertTenantError.message };
      }
    }

    const { error: insertUserError } = await db.from("User").insert({
      id: userId,
      email: data.email,
      name: data.contactName,
      password: hashedPassword,
      emailVerified: now,
      preferredLocale: "en-GB",
      lastTenantId: tenantId,
      createdAt: now,
      updatedAt: now,
    });
    if (insertUserError) {
      throw { code: "USER_CREATE_FAILED", message: insertUserError.message };
    }

    const { error: membershipError } = await db.from("UserTenant").insert({
      id: createId(),
      userId,
      tenantId,
      role: "ADMIN",
      createdAt: now,
      updatedAt: now,
    });
    if (membershipError) {
      throw { code: "MEMBERSHIP_CREATE_FAILED", message: membershipError.message };
    }

    await syncCrmFromTenant(
      {
        id: tenantId,
        name: data.companyName,
        companyNumber: data.companyNumber,
        orgNumber: data.companyNumber,
        contactPerson: data.contactName,
        contactEmail: data.email,
        contactPhone: data.phone || null,
        status: "TRIAL",
        onboardingStatus: "NOT_STARTED",
      },
      { source: "WEBSITE", stage: "NEW" },
    );

    const url = await checkoutUrl({
      tenantId,
      addonIds,
      billingMethod: data.billingMethod,
    });
    return { success: true, url };
  } catch (error: unknown) {
    return { success: false, error: errorMessage(error, "Could not start checkout") };
  }
}

export async function resumeSelfServeCheckout(input: {
  addonIds: string[];
  billingMethod: "CARD" | "DIRECT_DEBIT";
}): Promise<{ success: true; url: string } | { success: false; error: string }> {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return { success: false, error: "Sign in to finish payment" };
    }

    const addonIds = parseSignupAddonIds(input.addonIds);
    if (input.billingMethod !== "CARD" && input.billingMethod !== "DIRECT_DEBIT") {
      return { success: false, error: "Choose card or Bacs Direct Debit" };
    }

    const unpaid = await findUnpaidTenantForUser(auth.userId);
    if (!unpaid || unpaid.id !== auth.tenantId) {
      if (!unpaid) {
        return { success: false, error: "This company does not have an unpaid signup" };
      }
    }

    const tenantId = unpaid?.id ?? auth.tenantId;
    const { data: tenant, error } = await getAdminDb()
      .from("Tenant")
      .select("id, onboardingStatus, stripeSubscriptionId, status")
      .eq("id", tenantId)
      .maybeSingle();
    if (error) {
      throw { code: "TENANT_LOOKUP_FAILED", message: error.message };
    }
    if (!tenant || !needsPaymentGate(tenant)) {
      return { success: false, error: "This company does not have an unpaid signup" };
    }

    const { error: updateError } = await getAdminDb()
      .from("Tenant")
      .update({
        ...reopenUnpaidSignupPayload(nowIso()),
        billingMethod: input.billingMethod,
      })
      .eq("id", tenant.id);
    if (updateError) {
      throw { code: "TENANT_UPDATE_FAILED", message: updateError.message };
    }

    const url = await checkoutUrl({
      tenantId: tenant.id,
      addonIds,
      billingMethod: input.billingMethod,
    });
    return { success: true, url };
  } catch (error: unknown) {
    return { success: false, error: errorMessage(error, "Could not resume checkout") };
  }
}

export async function loadUnpaidSignupTenant(tenantId: string): Promise<boolean> {
  const { data, error } = await getAdminDb()
    .from("Tenant")
    .select("onboardingStatus, stripeSubscriptionId, status")
    .eq("id", tenantId)
    .maybeSingle();
  if (error || !data) {
    return false;
  }
  return needsPaymentGate(data);
}
