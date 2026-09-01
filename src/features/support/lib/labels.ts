import type {
  SupportTicketCategory,
  SupportTicketPriority,
  SupportTicketStatus,
} from "@prisma/client";

export const SUPPORT_CATEGORY_LABELS: Record<SupportTicketCategory, string> = {
  QUESTION: "Product question",
  HMS_ADVICE: "HSEQ advice",
  TECHNICAL: "Technical issue",
  BILLING: "Billing / subscription",
  FEATURE: "Feature request",
  OTHER: "Other",
};

export const SUPPORT_PRIORITY_LABELS: Record<SupportTicketPriority, string> = {
  LOW: "Low",
  NORMAL: "Normal",
  HIGH: "High",
  URGENT: "Urgent",
};

export const SUPPORT_STATUS_LABELS: Record<SupportTicketStatus, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In progress",
  WAITING_CUSTOMER: "Waiting for customer",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

export function formatSupportTicketNumber(year: number, sequence: number): string {
  return `SUP-${year}-${String(sequence).padStart(4, "0")}`;
}
