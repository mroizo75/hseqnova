/**
 * Paid access after Stripe cancel.
 * Cancelling must not lock the tenant out of a period that is already paid.
 * Stripe Basil (2025-03-31) removed current_period_end from Subscription;
 * period lives on items.data[] and on invoice line `period.end`.
 */
export type StripePeriodSource = {
  status?: string | null;
  cancel_at_period_end?: boolean | null;
  current_period_end?: number | null;
  current_period_start?: number | null;
  cancel_at?: number | null;
  items?: {
    data?: Array<{
      current_period_end?: number | null;
      current_period_start?: number | null;
    }>;
  };
};

export type StripeInvoicePeriodSource = {
  period_end?: number | null;
  lines?: {
    data?: Array<{ period?: { end?: number | null; start?: number | null } | null }>;
  };
};

function maxUnix(values: Array<number | null | undefined>): number | null {
  const nums = values.filter((n): n is number => typeof n === "number" && n > 0);
  return nums.length > 0 ? Math.max(...nums) : null;
}

function minUnix(values: Array<number | null | undefined>): number | null {
  const nums = values.filter((n): n is number => typeof n === "number" && n > 0);
  return nums.length > 0 ? Math.min(...nums) : null;
}

export function stripePaidUntilUnix(sub: StripePeriodSource): number | null {
  const fromItems = (sub.items?.data ?? []).map((item) => item.current_period_end);
  return maxUnix([sub.current_period_end, sub.cancel_at, ...fromItems]);
}

export function stripePeriodStartUnix(sub: StripePeriodSource): number | null {
  const fromItems = (sub.items?.data ?? []).map((item) => item.current_period_start);
  return minUnix([sub.current_period_start, ...fromItems]);
}

export function paidUntilFromInvoice(invoice: StripeInvoicePeriodSource | null | undefined): number | null {
  if (!invoice) return null;
  const fromLines = (invoice.lines?.data ?? []).map((line) => line.period?.end);
  return maxUnix([invoice.period_end, ...fromLines]);
}

export function hasPaidAccessRemaining(sub: StripePeriodSource, nowMs = Date.now()): boolean {
  const until = stripePaidUntilUnix(sub);
  return until !== null && until * 1000 > nowMs;
}

export function isVoluntaryCancel(sub: StripePeriodSource): boolean {
  const status = (sub.status ?? "").toLowerCase();
  return Boolean(sub.cancel_at_period_end) || status === "canceled" || status === "cancelled";
}

export function isFailedRenewal(sub: StripePeriodSource): boolean {
  const status = (sub.status ?? "").toLowerCase();
  return status === "past_due" || status === "unpaid" || status === "incomplete" || status === "incomplete_expired";
}

export function coverageStillActive(untilUnix: number | null, nowMs = Date.now()): boolean {
  return untilUnix !== null && untilUnix * 1000 > nowMs;
}

/**
 * Keep access on cancel when the paid period is still running.
 * If Basil omitted period fields, do not lock the customer out.
 */
export function shouldKeepAccessAfterCancel(sub: StripePeriodSource, nowMs = Date.now()): boolean {
  if (!isVoluntaryCancel(sub)) return false;
  const until = stripePaidUntilUnix(sub);
  if (until === null) return true;
  return until * 1000 > nowMs;
}

export function localPeriodStillOpen(
  currentPeriodEnd: string | Date | null | undefined,
  nowMs = Date.now(),
): boolean {
  if (!currentPeriodEnd) return false;
  return new Date(currentPeriodEnd).getTime() > nowMs;
}

export function localCancelStillPaid(
  local: { cancelAtPeriodEnd: boolean; currentPeriodEnd: string | Date | null },
  nowMs = Date.now(),
): boolean {
  if (!local.cancelAtPeriodEnd) return false;
  return localPeriodStillOpen(local.currentPeriodEnd, nowMs);
}

export function isPaidCancelPeriodExpired(
  local: { cancelAtPeriodEnd: boolean; currentPeriodEnd: string | Date | null },
  nowMs = Date.now(),
): boolean {
  if (!local.cancelAtPeriodEnd || !local.currentPeriodEnd) return false;
  return new Date(local.currentPeriodEnd).getTime() <= nowMs;
}

export function shouldRestoreSuspendedTenant(
  local: { cancelAtPeriodEnd: boolean; currentPeriodEnd: string | Date | null } | null,
  stripe: StripePeriodSource | null,
  nowMs = Date.now(),
  paidUntilUnix: number | null = null,
): boolean {
  if (stripe && isFailedRenewal(stripe)) return false;
  if (coverageStillActive(paidUntilUnix, nowMs)) return true;
  if (stripe && shouldKeepAccessAfterCancel(stripe, nowMs)) return true;
  if (stripe && hasPaidAccessRemaining(stripe, nowMs)) return true;
  if (local && localPeriodStillOpen(local.currentPeriodEnd, nowMs)) return true;
  return false;
}
