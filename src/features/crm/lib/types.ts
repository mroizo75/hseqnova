export const CRM_DEAL_STAGES = [
  "NEW",
  "QUALIFIED",
  "DEMO",
  "PROPOSAL",
  "NEGOTIATION",
  "WON",
  "LOST",
] as const;

export type CrmDealStage = (typeof CRM_DEAL_STAGES)[number];

export const OPEN_DEAL_STAGES: readonly CrmDealStage[] = [
  "NEW",
  "QUALIFIED",
  "DEMO",
  "PROPOSAL",
  "NEGOTIATION",
];

export const CRM_SOURCES = ["WEBSITE", "MANUAL", "PACKAGE", "REFERRAL", "OTHER"] as const;
export type CrmSource = (typeof CRM_SOURCES)[number];

export const CRM_ACTIVITY_TYPES = [
  "CONTACT",
  "FOLLOW_UP",
  "OFFER_SENT",
  "MEETING",
  "NOTE",
  "OTHER",
] as const;
export type CrmActivityType = (typeof CRM_ACTIVITY_TYPES)[number];

export const CRM_ACTIVITY_CHANNELS = ["PHONE", "EMAIL", "MEETING", "OTHER"] as const;
export type CrmActivityChannel = (typeof CRM_ACTIVITY_CHANNELS)[number];

export const CRM_TASK_STATUSES = ["OPEN", "DONE"] as const;
export type CrmTaskStatus = (typeof CRM_TASK_STATUSES)[number];

export type TenantCrmInput = {
  id: string;
  name: string;
  companyNumber?: string | null;
  orgNumber?: string | null;
  industry?: string | null;
  employeeCount?: number | null;
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
  notes?: string | null;
  contactPerson?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  status?: string | null;
  onboardingStatus?: string | null;
};
