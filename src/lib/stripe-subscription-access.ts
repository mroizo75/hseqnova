/**
 * Paid access after Stripe cancel.
 * Cancelling must not lock the tenant out of a period that is already paid.
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

export function hasPaidAccessRemaining(sub: StripePeriodSource, nowMs = Date.now()): boolean {
  const until = stripePaidUntilUnix(sub);
  return until !== null && until * 1000 > nowMs;
}

export function isVoluntaryCancel(sub: StripePeriodSource): boolean {
  const status = (sub.status ?? "").toLowerCase();
  return Boolean(sub.cancel_at_period_end) || status === "canceled" || status === "cancelled";
}

export function shouldKeepAccessAfterCancel(sub: StripePeriodSource, nowMs = Date.now()): boolean {
  return isVoluntaryCancel(sub) && hasPaidAccessRemaining(sub, nowMs);
}

export function localCancelStillPaid(
  local: { cancelAtPeriodEnd: boolean; currentPeriodEnd: string | Date | null },
  nowMs = Date.now(),
): boolean {
  if (!local.cancelAtPeriodEnd || !local.currentPeriodEnd) return false;
  return new Date(local.currentPeriodEnd).getTime() > nowMs;
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
): boolean {
  if (local && localCancelStillPaid(local, nowMs)) return true;
  if (stripe && shouldKeepAccessAfterCancel(stripe, nowMs)) return true;
  return false;
}
