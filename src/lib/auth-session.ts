export const MEMBERSHIP_REFRESH_MS = 60_000;

export function shouldRefreshMembership(
  checkedAt: unknown,
  now = Date.now(),
  intervalMs = MEMBERSHIP_REFRESH_MS,
): boolean {
  const last = typeof checkedAt === "number" && Number.isFinite(checkedAt) ? checkedAt : 0;
  return now - last >= intervalMs;
}
