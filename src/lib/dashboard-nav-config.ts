/**
 * UK dashboard menu. Core HSEQ is always listed. Add-ons appear when TenantModule is on.
 * Simple/advanced is not used — that hid legal duties such as risk assessment.
 */

export type NavPermission =
  | "dashboard"
  | "documents"
  | "incidents"
  | "risks"
  | "inspections"
  | "training"
  | "actions"
  | "sja"
  | "chemicals"
  | "assets"
  | "exposureRegister"
  | "constructionCompliance"
  | "hmsTavle"
  | "environment"
  | "audits"
  | "managementReviews"
  | "settings"
  | "support"
  | "hmsHandbok"
  | "whistleblowing"
  | "hseqCockpit"
  | "permits"
  | "fireRisk"
  | "contractors";

export interface DashboardNavItemConfig {
  href: string;
  label: string;
  permission: NavPermission;
  defaultSimple: boolean;
}

/** Not offered in the UK product. Hidden from menu, widgets and simple-menu settings. */
export const UK_EXCLUDED_NAV_HREFS = new Set([
  "/dashboard/procedures",
  "/dashboard/rutiner",
  "/dashboard/juridisk-register",
  "/dashboard/incidents/statistics",
  "/dashboard/risk-register",
  "/dashboard/wellbeing",
  "/dashboard/complaints",
  "/dashboard/feedback",
  "/dashboard/bcm",
  "/dashboard/annual-hms-plan",
  "/dashboard/meetings",
  "/dashboard/time-registration",
  "/dashboard/medarbeidersamtale",
  "/dashboard/hms-cockpit",
  "/dashboard/benchmark",
  "/dashboard/transport",
  "/dashboard/samsvarserklaringer",
  "/dashboard/ik-mat",
  "/dashboard/beredskap-reiseliv",
  "/dashboard/aktivitetssikkerhet",
  "/dashboard/bht-nattarbeid",
  "/dashboard/ruh",
  "/dashboard/hms-pulse",
  "/dashboard/hms-handbok",
  "/dashboard/goals",
]);

export const DASHBOARD_NAV_CONFIG: DashboardNavItemConfig[] = [
  { href: "/dashboard", label: "nav.dashboard", permission: "dashboard", defaultSimple: true },
  { href: "/dashboard/health-safety-policy", label: "nav.hmsHandbok", permission: "hmsHandbok", defaultSimple: true },
  { href: "/dashboard/documents", label: "nav.documents", permission: "documents", defaultSimple: true },
  { href: "/dashboard/incidents", label: "nav.incidents", permission: "incidents", defaultSimple: true },
  { href: "/dashboard/risks", label: "nav.risks", permission: "risks", defaultSimple: true },
  { href: "/dashboard/inspections", label: "nav.inspections", permission: "inspections", defaultSimple: true },
  { href: "/dashboard/fire-drills", label: "nav.fireDrills", permission: "inspections", defaultSimple: true },
  { href: "/dashboard/training", label: "nav.training", permission: "training", defaultSimple: true },
  { href: "/dashboard/actions", label: "nav.actions", permission: "actions", defaultSimple: true },
  { href: "/dashboard/sja", label: "nav.sja", permission: "sja", defaultSimple: true },
  { href: "/dashboard/permits", label: "nav.permits", permission: "permits", defaultSimple: true },
  { href: "/dashboard/chemicals", label: "nav.chemicals", permission: "chemicals", defaultSimple: true },
  { href: "/dashboard/coshh-assessments", label: "nav.coshhAssessments", permission: "chemicals", defaultSimple: true },
  { href: "/dashboard/assets", label: "nav.assets", permission: "assets", defaultSimple: true },
  { href: "/dashboard/exposure-register", label: "nav.exposureRegister", permission: "exposureRegister", defaultSimple: true },
  { href: "/dashboard/projects", label: "nav.projects", permission: "constructionCompliance", defaultSimple: true },
  { href: "/dashboard/construction-compliance", label: "nav.constructionCompliance", permission: "constructionCompliance", defaultSimple: true },
  { href: "/dashboard/contractors", label: "nav.contractors", permission: "contractors", defaultSimple: true },
  { href: "/dashboard/hms-tavle", label: "nav.hmsTavle", permission: "hmsTavle", defaultSimple: true },
  { href: "/dashboard/hseq-cockpit", label: "nav.hseqCockpit", permission: "hseqCockpit", defaultSimple: true },
  { href: "/dashboard/fire-risk", label: "nav.fireRisk", permission: "fireRisk", defaultSimple: true },
  { href: "/dashboard/environment", label: "nav.environment", permission: "environment", defaultSimple: true },
  { href: "/dashboard/audits", label: "nav.audits", permission: "audits", defaultSimple: true },
  { href: "/dashboard/management-reviews", label: "nav.managementReviews", permission: "managementReviews", defaultSimple: true },
  { href: "/dashboard/whistleblowing", label: "nav.whistleblowing", permission: "whistleblowing", defaultSimple: true },
  { href: "/dashboard/organisasjonskart", label: "nav.orgChart", permission: "settings", defaultSimple: true },
  { href: "/dashboard/users", label: "nav.users", permission: "settings", defaultSimple: true },
  { href: "/dashboard/support", label: "nav.support", permission: "support", defaultSimple: true },
  { href: "/dashboard/settings", label: "nav.settings", permission: "settings", defaultSimple: true },
];

export const DEFAULT_SIMPLE_MENU_HREFS = DASHBOARD_NAV_CONFIG.filter((i) => i.defaultSimple).map(
  (i) => i.href
);

/** Always-on UK HSEQ. Industry does not change this list. */
export const CORE_HSEQ_NAV_HREFS = [
  "/dashboard",
  "/dashboard/health-safety-policy",
  "/dashboard/documents",
  "/dashboard/incidents",
  "/dashboard/risks",
  "/dashboard/inspections",
  "/dashboard/fire-drills",
  "/dashboard/training",
  "/dashboard/actions",
  "/dashboard/organisasjonskart",
  "/dashboard/users",
  "/dashboard/support",
  "/dashboard/settings",
] as const;

const ALLOWED_MENU_HREFS = new Set(
  DASHBOARD_NAV_CONFIG.map((item) => item.href).filter((href) => !UK_EXCLUDED_NAV_HREFS.has(href))
);

export function normalizeSimpleMenuHrefs(hrefs: string[]): string[] {
  const unique: string[] = [];
  for (const href of hrefs) {
    if (!ALLOWED_MENU_HREFS.has(href) || unique.includes(href)) continue;
    unique.push(href);
  }
  if (!unique.includes("/dashboard")) {
    unique.unshift("/dashboard");
  }
  return unique;
}

export function resolveSimpleMenuItems(opts: {
  dashboardLocked: boolean;
  tenantItems: string[] | null;
  userItems: string[] | null;
}): string[] | null {
  const tenantItems = Array.isArray(opts.tenantItems) ? opts.tenantItems : null;
  const userItems = Array.isArray(opts.userItems) ? opts.userItems : null;
  if (opts.dashboardLocked) return tenantItems;
  return userItems ?? tenantItems;
}
