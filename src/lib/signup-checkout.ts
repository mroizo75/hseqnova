import {
  ADDON_PACKS,
  HSEQ_CORE,
  getAddonPack,
  stripePriceIdFromEnv,
  type AddonPackId,
} from "@/lib/billing-catalog";

export const SIGNUP_FLOW = "signup";

export type SignupBillingMethod = "CARD" | "DIRECT_DEBIT";

export type SignupPriceLookup = (envName: string) => string | null;

export type SignupCheckoutMetadata = {
  flow: typeof SIGNUP_FLOW;
  tenantId: string;
  addonIds: string;
};

export function isAddonPackId(value: string): value is AddonPackId {
  return ADDON_PACKS.some((pack) => pack.id === value);
}

export function parseSignupAddonIds(raw: string | string[] | null | undefined): AddonPackId[] {
  const values = Array.isArray(raw)
    ? raw
    : typeof raw === "string"
      ? raw.split(",")
      : [];
  const unique = new Set<AddonPackId>();
  for (const value of values) {
    const id = value.trim();
    if (isAddonPackId(id)) {
      unique.add(id);
    }
  }
  return ADDON_PACKS.map((pack) => pack.id).filter((id) => unique.has(id));
}

export function serializeSignupAddonIds(addonIds: Iterable<string>): string {
  return parseSignupAddonIds([...addonIds]).join(",");
}

export function buildSignupMetadata(
  tenantId: string,
  addonIds: Iterable<string>,
): SignupCheckoutMetadata {
  return {
    flow: SIGNUP_FLOW,
    tenantId,
    addonIds: serializeSignupAddonIds(addonIds),
  };
}

export function parseSignupCheckoutMetadata(
  metadata: Record<string, string> | null | undefined,
): { tenantId: string; addonIds: AddonPackId[] } | null {
  if (!metadata || metadata.flow !== SIGNUP_FLOW) {
    return null;
  }
  const tenantId = metadata.tenantId?.trim();
  if (!tenantId) {
    return null;
  }
  return {
    tenantId,
    addonIds: parseSignupAddonIds(metadata.addonIds),
  };
}

export function resolveSignupPriceIds(
  addonIds: Iterable<string>,
  lookup: SignupPriceLookup = stripePriceIdFromEnv,
): { priceIds: string[]; missing: string[] } {
  const packs = parseSignupAddonIds([...addonIds]).map((id) => getAddonPack(id)!);
  const envNames = [HSEQ_CORE.stripePriceEnv, ...packs.map((pack) => pack.stripePriceEnv)];
  const priceIds: string[] = [];
  const missing: string[] = [];
  for (const envName of envNames) {
    const priceId = lookup(envName);
    if (priceId) {
      priceIds.push(priceId);
    } else {
      missing.push(envName);
    }
  }
  return { priceIds, missing };
}

export type SignupTenantGate = {
  onboardingStatus?: string | null;
  stripeSubscriptionId?: string | null;
  status?: string | null;
};

/**
 * Unpaid self-serve drafts must be able to retry Stripe.
 * Do not treat a leftover incomplete subscription id as "already paid":
 * Checkout creates that row before the customer finishes payment.
 */
export function needsPaymentGate(tenant: SignupTenantGate): boolean {
  const onboarding = tenant.onboardingStatus ?? "NOT_STARTED";
  if (onboarding !== "NOT_STARTED") {
    return false;
  }
  if (tenant.status === "ACTIVE") {
    return false;
  }
  return true;
}

export function pickResumableSignupTenant<T extends SignupTenantGate & { id: string }>(
  tenants: T[],
): { resume: T | null; blocked: boolean } {
  const resume = tenants.find((tenant) => needsPaymentGate(tenant)) ?? null;
  if (resume) {
    return { resume, blocked: false };
  }
  return { resume: null, blocked: tenants.length > 0 };
}

export function normalizeCompanyNumber(value: string): string {
  return value.replace(/\s+/g, "").toUpperCase();
}

export const COMPANY_NUMBER_IN_USE_MESSAGE =
  "This Companies House number is already in use. Each organisation must have its own unique number. Sign in if this is your company, or contact hello@hseqnova.co.uk.";

export function publicCheckoutError(error: unknown, fallback = "Could not start checkout"): string {
  const message =
    error && typeof error === "object" && "message" in error && typeof error.message === "string"
      ? error.message
      : error instanceof Error
        ? error.message
        : "";
  if (/no such price/i.test(message)) {
    return "Payment could not start because a Stripe price ID is not on this Stripe account. Live prices must be used with the live secret key on the server. Contact hello@hseqnova.co.uk.";
  }
  if (/no such customer/i.test(message)) {
    return "Payment could not start because the saved Stripe customer is from a different Stripe account or mode. Contact hello@hseqnova.co.uk.";
  }
  return message || fallback;
}

export function appBaseUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.NEXTAUTH_URL?.trim() ||
    "http://localhost:3000";
  return raw.replace(/\/$/, "");
}
