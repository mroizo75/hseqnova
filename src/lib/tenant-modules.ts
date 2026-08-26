export const CORE_MODULE_KEYS = [
  "dashboard",
  "hmsHandbok",
  "documents",
  "incidents",
  "risks",
  "inspections",
  "training",
  "actions",
  "fireDrills",
  "settings",
] as const;

export type CoreModuleKey = (typeof CORE_MODULE_KEYS)[number];

export const ADDON_MODULE_KEYS = [
  "sja",
  "chemicals",
  "exposureRegister",
  "constructionCompliance",
  "hmsTavle",
  "audits",
  "environment",
  "coshh",
  "cdm",
  "permitToWork",
] as const;

export type AddonModuleKey = (typeof ADDON_MODULE_KEYS)[number];
export type ModuleKey = CoreModuleKey | AddonModuleKey;

const CORE_SET = new Set<string>(CORE_MODULE_KEYS);

export const NAV_PERMISSION_TO_MODULE_KEY: Record<string, ModuleKey> = {
  dashboard: "dashboard",
  hmsHandbok: "hmsHandbok",
  documents: "documents",
  incidents: "incidents",
  risks: "risks",
  inspections: "inspections",
  training: "training",
  actions: "actions",
  settings: "settings",
  sja: "sja",
  chemicals: "chemicals",
  exposureRegister: "chemicals",
  constructionCompliance: "constructionCompliance",
  hmsTavle: "hmsTavle",
  audits: "audits",
  managementReviews: "audits",
  environment: "environment",
};

export function isCoreModule(moduleKey: string): boolean {
  return CORE_SET.has(moduleKey);
}

export function tenantHasModule(
  enabledKeys: Iterable<string>,
  moduleKey: string,
): boolean {
  if (isCoreModule(moduleKey)) {
    return true;
  }
  const enabled = new Set(enabledKeys);
  if (moduleKey === "chemicals") {
    return enabled.has("chemicals") || enabled.has("coshh");
  }
  if (moduleKey === "constructionCompliance") {
    return enabled.has("constructionCompliance") || enabled.has("cdm");
  }
  return enabled.has(moduleKey);
}

/** Projects live under CDM 2015 — not core HSEQ. */
export function tenantHasProjectsAddon(enabledKeys: Iterable<string>): boolean {
  return (
    tenantHasModule(enabledKeys, "constructionCompliance") ||
    tenantHasModule(enabledKeys, "cdm")
  );
}
