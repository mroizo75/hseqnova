import { tenantHasModule } from "@/lib/tenant-modules";

export const UK_VAT_PERCENT = 20;

/**
 * Norwegian supplier selling B2B SaaS to UK organisations.
 * Stripe Tax stays on: collect a UK VAT number and let Stripe apply reverse charge
 * (0% collected, reverse-charge note on the invoice). Do not disable automatic tax.
 * VAT Act 1994 s.7A / VAT Notice 741A; merverdiavgiftsloven for remote B2B exports.
 */
export const VAT_REVERSE_CHARGE_NOTE =
  "VAT is not collected by HSEQ Nova. Enter your UK VAT number on the Stripe page so reverse charge can apply. VAT-registered customers account for UK VAT themselves.";

export const ANNUAL_DISCOUNT_PERCENT = 10;

export type BillingInterval = "month" | "year";

/** 10% off the monthly rate when billed once a year. */
export function yearlyPriceGbp(monthlyPriceGbp: number): number {
  return Math.round(monthlyPriceGbp * 12 * (1 - ANNUAL_DISCOUNT_PERCENT / 100) * 100) / 100;
}

export const HSEQ_CORE = {
  id: "core",
  name: "HSEQ Nova Core",
  description: "Health and safety policy, accident book, RIDDOR triage, risk assessments, inspections, training and fire drills. Unlimited users.",
  monthlyPriceGbp: 29,
  legalHook: "HSWA 1974; MHSWR 1999; RIDDOR 2013",
  stripePriceEnv: "STRIPE_PRICE_CORE_MONTHLY",
  stripeYearlyPriceEnv: "STRIPE_PRICE_CORE_YEARLY",
} as const;

export type AddonPackId = "rams" | "coshh" | "cdm" | "safety-board" | "audits" | "environment";

export type AddonPack = {
  id: AddonPackId;
  name: string;
  description: string;
  legalHook: string;
  monthlyPriceGbp: number;
  entitlementKey: string;
  moduleKeys: readonly string[];
  stripePriceEnv: string;
  stripeYearlyPriceEnv: string;
};

export const ADDON_PACKS: readonly AddonPack[] = [
  {
    id: "rams",
    name: "RAMS",
    description: "Risk assessments and method statements that site teams can follow.",
    legalHook: "MHSWR 1999; CDM 2015",
    monthlyPriceGbp: 15,
    entitlementKey: "sja",
    moduleKeys: ["sja"],
    stripePriceEnv: "STRIPE_PRICE_RAMS_MONTHLY",
    stripeYearlyPriceEnv: "STRIPE_PRICE_RAMS_YEARLY",
  },
  {
    id: "coshh",
    name: "COSHH",
    description: "COSHH assessments, register and health records kept for 40 years.",
    legalHook: "COSHH 2002",
    monthlyPriceGbp: 19,
    entitlementKey: "chemicals",
    moduleKeys: ["chemicals", "coshh", "exposureRegister"],
    stripePriceEnv: "STRIPE_PRICE_COSHH_MONTHLY",
    stripeYearlyPriceEnv: "STRIPE_PRICE_COSHH_YEARLY",
  },
  {
    id: "cdm",
    name: "CDM 2015",
    description: "Client, principal designer and principal contractor duties, CPP, F10 and the health and safety file.",
    legalHook: "CDM 2015",
    monthlyPriceGbp: 29,
    entitlementKey: "constructionCompliance",
    moduleKeys: ["constructionCompliance", "cdm", "permitToWork"],
    stripePriceEnv: "STRIPE_PRICE_CDM_MONTHLY",
    stripeYearlyPriceEnv: "STRIPE_PRICE_CDM_YEARLY",
  },
  {
    id: "safety-board",
    name: "Digital safety board",
    description: "Site induction, QR access and kiosk display for the site gate.",
    legalHook: "CDM 2015 site information",
    monthlyPriceGbp: 30,
    entitlementKey: "hmsTavle",
    moduleKeys: ["hmsTavle"],
    stripePriceEnv: "STRIPE_PRICE_TAVLE_MONTHLY",
    stripeYearlyPriceEnv: "STRIPE_PRICE_TAVLE_YEARLY",
  },
  {
    id: "audits",
    name: "Audits",
    description: "Internal audits and management review. Optional — useful for tenders and ISO 45001, not a legal duty.",
    legalHook: "ISO 45001 (optional)",
    monthlyPriceGbp: 15,
    entitlementKey: "audits",
    moduleKeys: ["audits"],
    stripePriceEnv: "STRIPE_PRICE_AUDITS_MONTHLY",
    stripeYearlyPriceEnv: "STRIPE_PRICE_AUDITS_YEARLY",
  },
  {
    id: "environment",
    name: "Environment",
    description: "Environmental aspects and records. ISO 14001 if you want a certified EMS — not an HSWA duty.",
    legalHook: "ISO 14001 (optional)",
    monthlyPriceGbp: 15,
    entitlementKey: "environment",
    moduleKeys: ["environment"],
    stripePriceEnv: "STRIPE_PRICE_ENVIRONMENT_MONTHLY",
    stripeYearlyPriceEnv: "STRIPE_PRICE_ENVIRONMENT_YEARLY",
  },
];

export function getAddonPack(packId: string): AddonPack | null {
  return ADDON_PACKS.find((pack) => pack.id === packId) ?? null;
}

export function isAddonPackActive(enabledKeys: Iterable<string>, pack: AddonPack): boolean {
  return tenantHasModule(enabledKeys, pack.entitlementKey);
}

export function sumActiveAddonPriceGbp(enabledKeys: Iterable<string>): number {
  return ADDON_PACKS.filter((pack) => isAddonPackActive(enabledKeys, pack)).reduce(
    (sum, pack) => sum + pack.monthlyPriceGbp,
    0,
  );
}

export function monthlyTotalGbp(enabledKeys: Iterable<string>): number {
  return HSEQ_CORE.monthlyPriceGbp + sumActiveAddonPriceGbp(enabledKeys);
}

export function billedTotalGbp(enabledKeys: Iterable<string>, interval: BillingInterval): number {
  const monthly = monthlyTotalGbp(enabledKeys);
  return interval === "year" ? yearlyPriceGbp(monthly) : monthly;
}

export function catalogStripePriceEnv(
  item: { stripePriceEnv: string; stripeYearlyPriceEnv: string },
  interval: BillingInterval,
): string {
  return interval === "year" ? item.stripeYearlyPriceEnv : item.stripePriceEnv;
}

export function packStripePriceIds(pack: AddonPack): string[] {
  return [pack.stripePriceEnv, pack.stripeYearlyPriceEnv]
    .map((envName) => stripePriceIdFromEnv(envName))
    .filter((id): id is string => Boolean(id));
}

export function stripePriceIdFromEnv(envName: string): string | null {
  const value = process.env[envName];
  if (!value) return null;
  const trimmed = value.trim().replace(/^['"]|['"]$/g, "");
  return trimmed.length > 0 ? trimmed : null;
}
