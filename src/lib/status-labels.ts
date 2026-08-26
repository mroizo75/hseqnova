/**
 * Shared Status Label & Colour Registry
 *
 * Single source of truth for status labels and colour coding across all
 * HSEQ modules.  Replaces duplicated getStatusLabel/getStatusColor helpers
 * scattered across 10+ feature components.
 *
 * Colour convention:
 *   green  — completed / approved / effective
 *   blue   — in progress / investigating
 *   amber  — attention / due soon / partial
 *   red    — overdue / rejected / failed
 *   slate  — draft / planned / not started
 */

export type StatusColour = "green" | "blue" | "amber" | "red" | "slate" | "purple";

export interface StatusDef {
  label: string;
  colour: StatusColour;
}

const incident: Record<string, StatusDef> = {
  OPEN: { label: "Open", colour: "red" },
  INVESTIGATING: { label: "Investigating", colour: "blue" },
  ACTION_TAKEN: { label: "Action taken", colour: "amber" },
  CLOSED: { label: "Closed", colour: "green" },
};

const measure: Record<string, StatusDef> = {
  PENDING: { label: "Pending", colour: "slate" },
  IN_PROGRESS: { label: "In progress", colour: "blue" },
  DONE: { label: "Completed", colour: "green" },
  OVERDUE: { label: "Overdue", colour: "red" },
};

const inspection: Record<string, StatusDef> = {
  PLANNED: { label: "Planned", colour: "slate" },
  IN_PROGRESS: { label: "In progress", colour: "blue" },
  COMPLETED: { label: "Completed", colour: "green" },
  CANCELLED: { label: "Cancelled", colour: "slate" },
};

const audit: Record<string, StatusDef> = {
  PLANNED: { label: "Planned", colour: "slate" },
  IN_PROGRESS: { label: "In progress", colour: "blue" },
  COMPLETED: { label: "Completed", colour: "amber" },
  APPROVED: { label: "Approved", colour: "green" },
  CANCELLED: { label: "Cancelled", colour: "slate" },
};

const fireDrill: Record<string, StatusDef> = {
  PLANNED: { label: "Planned", colour: "slate" },
  IN_PROGRESS: { label: "In progress", colour: "blue" },
  COMPLETED: { label: "Completed", colour: "amber" },
  EVALUATED: { label: "Evaluated", colour: "green" },
  CANCELLED: { label: "Cancelled", colour: "slate" },
};

const document: Record<string, StatusDef> = {
  DRAFT: { label: "Draft", colour: "slate" },
  APPROVED: { label: "Approved", colour: "green" },
  ARCHIVED: { label: "Archived", colour: "slate" },
};

const risk: Record<string, StatusDef> = {
  OPEN: { label: "Open", colour: "red" },
  MITIGATING: { label: "Mitigating", colour: "blue" },
  ACCEPTED: { label: "Accepted", colour: "amber" },
  CLOSED: { label: "Closed", colour: "green" },
};

const routine: Record<string, StatusDef> = {
  ACTIVE: { label: "Active", colour: "green" },
  DRAFT: { label: "Draft", colour: "slate" },
  NEEDS_REVIEW: { label: "Needs review", colour: "amber" },
  ARCHIVED: { label: "Archived", colour: "slate" },
};

const meeting: Record<string, StatusDef> = {
  PLANNED: { label: "Planned", colour: "slate" },
  IN_PROGRESS: { label: "In progress", colour: "blue" },
  COMPLETED: { label: "Completed", colour: "green" },
  CANCELLED: { label: "Cancelled", colour: "slate" },
};

const managementReview: Record<string, StatusDef> = {
  PLANNED: { label: "Planned", colour: "slate" },
  IN_PROGRESS: { label: "In progress", colour: "blue" },
  COMPLETED: { label: "Completed", colour: "amber" },
  APPROVED: { label: "Approved", colour: "green" },
};

const whistleblowing: Record<string, StatusDef> = {
  RECEIVED: { label: "Received", colour: "red" },
  ACKNOWLEDGED: { label: "Acknowledged", colour: "amber" },
  UNDER_INVESTIGATION: { label: "Under investigation", colour: "blue" },
  ACTION_TAKEN: { label: "Action taken", colour: "blue" },
  RESOLVED: { label: "Resolved", colour: "green" },
  CLOSED: { label: "Closed", colour: "green" },
  DISMISSED: { label: "Dismissed", colour: "slate" },
};

const chemical: Record<string, StatusDef> = {
  ACTIVE: { label: "Active", colour: "green" },
  PHASED_OUT: { label: "Phasing out", colour: "amber" },
  ARCHIVED: { label: "Archived", colour: "slate" },
};

const sja: Record<string, StatusDef> = {
  DRAFT: { label: "Draft", colour: "slate" },
  ACTIVE: { label: "Active", colour: "blue" },
  COMPLETED: { label: "Completed", colour: "green" },
  CANCELLED: { label: "Cancelled", colour: "slate" },
};

const ruh: Record<string, StatusDef> = {
  SUBMITTED: { label: "Submitted", colour: "amber" },
  UNDER_REVIEW: { label: "Under review", colour: "blue" },
  COMPLETED: { label: "Completed", colour: "green" },
};

const goal: Record<string, StatusDef> = {
  ACTIVE: { label: "Active", colour: "blue" },
  ACHIEVED: { label: "Achieved", colour: "green" },
  AT_RISK: { label: "At risk", colour: "red" },
  FAILED: { label: "Not achieved", colour: "red" },
  ARCHIVED: { label: "Archived", colour: "slate" },
};

const finding: Record<string, StatusDef> = {
  OPEN: { label: "Open", colour: "red" },
  IN_PROGRESS: { label: "In progress", colour: "blue" },
  RESOLVED: { label: "Resolved", colour: "amber" },
  VERIFIED: { label: "Verified", colour: "green" },
};

const project: Record<string, StatusDef> = {
  PLANNING: { label: "Planning", colour: "slate" },
  ACTIVE: { label: "Active", colour: "green" },
  ON_HOLD: { label: "On hold", colour: "amber" },
  COMPLETED: { label: "Completed", colour: "green" },
  ARCHIVED: { label: "Archived", colour: "slate" },
};

const effectiveness: Record<string, StatusDef> = {
  NOT_EVALUATED: { label: "Not evaluated", colour: "slate" },
  EFFECTIVE: { label: "Effective", colour: "green" },
  PARTIALLY_EFFECTIVE: { label: "Partially effective", colour: "amber" },
  INEFFECTIVE: { label: "Ineffective", colour: "red" },
};

const STATUS_REGISTRY: Record<string, Record<string, StatusDef>> = {
  incident,
  measure,
  inspection,
  audit,
  fireDrill,
  document,
  risk,
  routine,
  meeting,
  managementReview,
  whistleblowing,
  chemical,
  sja,
  ruh,
  goal,
  finding,
  project,
  effectiveness,
};

const FALLBACK: StatusDef = { label: "Unknown", colour: "slate" };

export function getStatusDef(module: string, status: string): StatusDef {
  return STATUS_REGISTRY[module]?.[status] ?? FALLBACK;
}

export function getStatusLabel(module: string, status: string): string {
  return getStatusDef(module, status).label;
}

export function getStatusColour(module: string, status: string): StatusColour {
  return getStatusDef(module, status).colour;
}

/**
 * Tailwind classes for each status colour.
 * Use with Badge, Chip, or inline spans.
 */
export const STATUS_COLOUR_CLASSES: Record<StatusColour, { bg: string; text: string; dot: string }> = {
  green: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  blue: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  amber: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  red: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
  slate: { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" },
  purple: { bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-500" },
};

export function getStatusClasses(module: string, status: string) {
  const colour = getStatusColour(module, status);
  return STATUS_COLOUR_CLASSES[colour];
}
