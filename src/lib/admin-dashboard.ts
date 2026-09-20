export type AttentionSeverity = "critical" | "warning" | "info";

export type AttentionItem = {
  id: string;
  severity: AttentionSeverity;
  title: string;
  description: string;
  href: string;
};

export type OrganisationStatusCounts = {
  active: number;
  trial: number;
  suspended: number;
  cancelled: number;
};

const SEVERITY_ORDER: Record<AttentionSeverity, number> = {
  critical: 0,
  warning: 1,
  info: 2,
};

export function greetingForHour(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function londonHour(now = new Date()): number {
  const hour = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    hour: "numeric",
    hourCycle: "h23",
  }).format(now);
  return Number.parseInt(hour, 10);
}

export function organisationInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "OR";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export function monthlyRecurringGbp(
  subscriptions: Array<{ price: number; billingInterval: string; status: string }>,
): number {
  return subscriptions.reduce((sum, subscription) => {
    if (subscription.status !== "ACTIVE" && subscription.status !== "TRIAL") return sum;
    const price = Number(subscription.price) || 0;
    if (subscription.billingInterval === "YEARLY") return sum + price / 12;
    return sum + price;
  }, 0);
}

export function daysUntil(target: Date, now = new Date()): number {
  const start = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const end = Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), target.getUTCDate());
  return Math.round((end - start) / 86_400_000);
}

export function organisationLiveMix(counts: OrganisationStatusCounts) {
  const live = counts.active + counts.trial;
  return {
    live,
    total: live + counts.suspended + counts.cancelled,
    activeShare: live === 0 ? 0 : Math.round((counts.active / live) * 100),
    trialShare: live === 0 ? 0 : Math.round((counts.trial / live) * 100),
  };
}

export function buildAttentionQueue(input: {
  overdueInvoiceCount: number;
  overdueInvoiceGbp: number;
  openSupportCount: number;
  trialsEndingSoon: number;
  pendingRegistrations: number;
  overdueCrmTasks: number;
  suspendedCount: number;
}): AttentionItem[] {
  const items: AttentionItem[] = [];

  if (input.overdueInvoiceCount > 0) {
    items.push({
      id: "invoices",
      severity: "critical",
      title: `${input.overdueInvoiceCount} overdue invoice${input.overdueInvoiceCount === 1 ? "" : "s"}`,
      description: `${formatCompactGbp(input.overdueInvoiceGbp)} waiting to be collected`,
      href: "/admin/invoices",
    });
  }

  if (input.openSupportCount > 0) {
    items.push({
      id: "support",
      severity: input.openSupportCount >= 5 ? "critical" : "warning",
      title: `${input.openSupportCount} open support ticket${input.openSupportCount === 1 ? "" : "s"}`,
      description: "Customers are waiting for a reply",
      href: "/admin/support",
    });
  }

  if (input.trialsEndingSoon > 0) {
    items.push({
      id: "trials",
      severity: "warning",
      title: `${input.trialsEndingSoon} trial${input.trialsEndingSoon === 1 ? "" : "s"} ending within 14 days`,
      description: "Convert or follow up before access lapses",
      href: "/admin/tenants",
    });
  }

  if (input.pendingRegistrations > 0) {
    items.push({
      id: "registrations",
      severity: "warning",
      title: `${input.pendingRegistrations} registration${input.pendingRegistrations === 1 ? "" : "s"} to review`,
      description: "Onboarding has not been completed",
      href: "/admin/registrations",
    });
  }

  if (input.overdueCrmTasks > 0) {
    items.push({
      id: "crm-tasks",
      severity: "warning",
      title: `${input.overdueCrmTasks} overdue sales follow-up${input.overdueCrmTasks === 1 ? "" : "s"}`,
      description: "Pipeline tasks past their due date",
      href: "/admin/crm/tasks",
    });
  }

  if (input.suspendedCount > 0) {
    items.push({
      id: "suspended",
      severity: "info",
      title: `${input.suspendedCount} suspended organisation${input.suspendedCount === 1 ? "" : "s"}`,
      description: "Access is blocked until billing or compliance is restored",
      href: "/admin/tenants",
    });
  }

  return items.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}

export function formatCompactGbp(value: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: value % 1 === 0 ? 0 : 0,
  }).format(Math.round(value));
}
