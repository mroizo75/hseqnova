export const CORE_MODULE_KEYS = [
  "dashboard",
  "hmsHandbok",
  "incidents",
  "risks",
  "routines",
  "inspections",
  "training",
  "fireDrills",
  "annualHmsPlan",
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
  "meetings",
  "whistleblowing",
  "timeRegistration",
  "ikMat",
  "aktivitetssikkerhet",
  "transport",
  "bhtNattarbeid",
  "electro",
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
  incidents: "incidents",
  hseStatistics: "incidents",
  risks: "risks",
  routines: "routines",
  inspections: "inspections",
  training: "training",
  annualHmsPlan: "annualHmsPlan",
  settings: "settings",
  sja: "sja",
  chemicals: "chemicals",
  exposureRegister: "exposureRegister",
  constructionCompliance: "constructionCompliance",
  hmsTavle: "hmsTavle",
  audits: "audits",
  managementReviews: "audits",
  environment: "environment",
  meetings: "meetings",
  whistleblowing: "whistleblowing",
  timeRegistration: "timeRegistration",
  ikMat: "ikMat",
  aktivitetssikkerhet: "aktivitetssikkerhet",
  transport: "transport",
  bhtNattarbeid: "bhtNattarbeid",
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
  return enabled.has(moduleKey);
}
