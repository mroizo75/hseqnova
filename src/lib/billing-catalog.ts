import { tenantHasModule } from "@/lib/tenant-modules";

export const UK_VAT_PERCENT = 20;

export const HSEQ_CORE = {
  id: "core",
  name: "HSEQ Nova Core",
  description: "Health and safety policy, accident book, RIDDOR triage, risk assessments, inspections, training and fire drills. Unlimited users.",
  monthlyPriceGbp: 29,
  legalHook: "HSWA 1974; MHSWR 1999; RIDDOR 2013",
  stripePriceEnv: "STRIPE_PRICE_CORE_MONTHLY",
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

export function stripePriceIdFromEnv(envName: string): string | null {
  const value = process.env[envName];
  if (!value) return null;
  const trimmed = value.trim().replace(/^['"]|['"]$/g, "");
  return trimmed.length > 0 ? trimmed : null;
}
