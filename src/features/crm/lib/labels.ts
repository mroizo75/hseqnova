import type {
  CrmActivityChannel,
  CrmActivityType,
  CrmDealStage,
  CrmSource,
  CrmTaskStatus,
} from "./types";
import { CRM_DEAL_STAGES, OPEN_DEAL_STAGES } from "./types";

export const CRM_STAGE_LABELS: Record<CrmDealStage, string> = {
  NEW: "New lead",
  QUALIFIED: "Qualified",
  DEMO: "Demo",
  PROPOSAL: "Proposal",
  NEGOTIATION: "Negotiation",
  WON: "Won",
  LOST: "Lost",
};

export const CRM_SOURCE_LABELS: Record<CrmSource, string> = {
  WEBSITE: "Website",
  MANUAL: "Manual",
  PACKAGE: "Package enquiry",
  REFERRAL: "Referral",
  OTHER: "Other",
};

export const CRM_ACTIVITY_TYPE_LABELS: Record<CrmActivityType, string> = {
  CONTACT: "First contact",
  FOLLOW_UP: "Follow-up",
  OFFER_SENT: "Proposal sent",
  MEETING: "Meeting",
  NOTE: "Note",
  OTHER: "Other",
};

export const CRM_ACTIVITY_CHANNEL_LABELS: Record<CrmActivityChannel, string> = {
  PHONE: "Phone",
  EMAIL: "Email",
  MEETING: "Meeting",
  OTHER: "Other",
};

export const CRM_TASK_STATUS_LABELS: Record<CrmTaskStatus, string> = {
  OPEN: "Open",
  DONE: "Done",
};

export function isOpenDealStage(stage: string): boolean {
  return (OPEN_DEAL_STAGES as readonly string[]).includes(stage);
}

export function isCrmDealStage(value: string): value is CrmDealStage {
  return (CRM_DEAL_STAGES as readonly string[]).includes(value);
}

export function formatGbp(value: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}
