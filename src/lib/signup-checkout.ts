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

export function needsPaymentGate(tenant: {
  onboardingStatus?: string | null;
  stripeSubscriptionId?: string | null;
}): boolean {
  return tenant.onboardingStatus === "NOT_STARTED" && !tenant.stripeSubscriptionId;
}

export function normalizeCompanyNumber(value: string): string {
  return value.replace(/\s+/g, "").toUpperCase();
}

export function appBaseUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.NEXTAUTH_URL?.trim() ||
    "http://localhost:3000";
  return raw.replace(/\/$/, "");
}
