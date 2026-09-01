import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  hasPaidAccessRemaining,
  isFailedRenewal,
  isPaidCancelPeriodExpired,
  isVoluntaryCancel,
  localCancelStillPaid,
  paidUntilFromInvoice,
  shouldKeepAccessAfterCancel,
  shouldRestoreSuspendedTenant,
  stripePaidUntilUnix,
  stripePeriodStartUnix,
} from "../src/lib/stripe-subscription-access";

const nowMs = Date.parse("2026-09-01T12:00:00.000Z");
const futureUnix = Math.floor(Date.parse("2026-09-20T00:00:00.000Z") / 1000);
const pastUnix = Math.floor(Date.parse("2026-08-01T00:00:00.000Z") / 1000);

describe("stripe subscription paid access", () => {
  it("reads period end from the subscription, then from items", () => {
    assert.equal(stripePaidUntilUnix({ current_period_end: futureUnix }), futureUnix);
    assert.equal(
      stripePaidUntilUnix({
        items: { data: [{ current_period_end: futureUnix }] },
      }),
      futureUnix,
    );
    assert.equal(
      stripePaidUntilUnix({
        current_period_end: pastUnix,
        items: { data: [{ current_period_end: futureUnix }] },
      }),
      futureUnix,
    );
    assert.equal(stripePeriodStartUnix({ current_period_start: pastUnix }), pastUnix);
    assert.equal(
      paidUntilFromInvoice({
        lines: { data: [{ period: { end: futureUnix } }] },
      }),
      futureUnix,
    );
  });

  it("keeps access when a paid month is cancelled immediately", () => {
    const sub = { status: "canceled", current_period_end: futureUnix };
    assert.equal(isVoluntaryCancel(sub), true);
    assert.equal(hasPaidAccessRemaining(sub, nowMs), true);
    assert.equal(shouldKeepAccessAfterCancel(sub, nowMs), true);
  });

  it("keeps access when Basil omits period fields on a cancel payload", () => {
    assert.equal(shouldKeepAccessAfterCancel({ status: "canceled" }, nowMs), true);
    assert.equal(
      shouldKeepAccessAfterCancel(
        { status: "canceled", items: { data: [{ current_period_end: futureUnix }] } },
        nowMs,
      ),
      true,
    );
  });

  it("keeps access when cancel_at_period_end is set on a live subscription", () => {
    const sub = {
      status: "active",
      cancel_at_period_end: true,
      items: { data: [{ current_period_end: futureUnix }] },
    };
    assert.equal(shouldKeepAccessAfterCancel(sub, nowMs), true);
  });

  it("locks out after the paid period has ended", () => {
    const sub = { status: "canceled", current_period_end: pastUnix };
    assert.equal(shouldKeepAccessAfterCancel(sub, nowMs), false);
    assert.equal(
      isPaidCancelPeriodExpired(
        { cancelAtPeriodEnd: true, currentPeriodEnd: "2026-08-01T00:00:00.000Z" },
        nowMs,
      ),
      true,
    );
  });

  it("does not treat a failed renewal as a paid cancel", () => {
    const sub = { status: "past_due", current_period_end: futureUnix };
    assert.equal(isVoluntaryCancel(sub), false);
    assert.equal(isFailedRenewal(sub), true);
    assert.equal(shouldKeepAccessAfterCancel(sub, nowMs), false);
  });

  it("restores a wrongly suspended tenant from Stripe, invoices, or local period", () => {
    assert.equal(
      shouldRestoreSuspendedTenant(null, { status: "canceled", current_period_end: futureUnix }, nowMs),
      true,
    );
    assert.equal(
      localCancelStillPaid(
        { cancelAtPeriodEnd: true, currentPeriodEnd: "2026-09-20T00:00:00.000Z" },
        nowMs,
      ),
      true,
    );
    assert.equal(
      shouldRestoreSuspendedTenant(
        { cancelAtPeriodEnd: false, currentPeriodEnd: "2026-09-20T00:00:00.000Z" },
        null,
        nowMs,
      ),
      true,
    );
    assert.equal(
      shouldRestoreSuspendedTenant(null, null, nowMs, futureUnix),
      true,
    );
    assert.equal(
      shouldRestoreSuspendedTenant(
        { cancelAtPeriodEnd: false, currentPeriodEnd: "2026-09-20T00:00:00.000Z" },
        { status: "past_due", current_period_end: futureUnix },
        nowMs,
      ),
      false,
    );
  });
});
