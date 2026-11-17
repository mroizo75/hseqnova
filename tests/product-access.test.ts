import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { billingMark, decideProductAccess, hasCurrentPayment, isOpenDemo } from "../src/lib/product-access";

const now = Date.parse("2026-11-17T12:00:00.000Z");
const future = Math.floor(Date.parse("2026-12-17T00:00:00.000Z") / 1000);
const past = Math.floor(Date.parse("2026-10-01T00:00:00.000Z") / 1000);

describe("product access", () => {
  it("lets an open demo in and blocks it after the end date", () => {
    const open = {
      status: "TRIAL",
      registrationType: "DEMO",
      trialEndsAt: "2026-11-19T12:00:00.000Z",
    };
    assert.equal(isOpenDemo(open, now), true);
    assert.equal(decideProductAccess(open, {}, now), "ok");
    assert.equal(
      decideProductAccess({ ...open, trialEndsAt: "2026-11-13T08:00:00.000Z" }, {}, now),
      "pay",
    );
  });

  it("sends an active company with no live payment to the payment page", () => {
    const tenant = { status: "ACTIVE", registrationType: "STANDARD", trialEndsAt: null };
    assert.equal(decideProductAccess(tenant, {}, now), "pay");
    assert.equal(decideProductAccess(tenant, { stripeStatus: "past_due", paidUntilUnix: future }, now), "pay");
    assert.equal(decideProductAccess(tenant, { stripeStatus: "trialing", paidUntilUnix: future }, now), "pay");
    assert.equal(billingMark(tenant, {}, now), "unpaid");
  });

  it("keeps access for an active subscription and for a cancel that is still paid", () => {
    const tenant = { status: "ACTIVE", registrationType: "STANDARD" };
    assert.equal(hasCurrentPayment({ stripeStatus: "active", paidUntilUnix: future }, now), true);
    assert.equal(decideProductAccess(tenant, { stripeStatus: "active", paidUntilUnix: future }, now), "ok");
    assert.equal(
      decideProductAccess(tenant, { stripeStatus: "canceled", paidUntilUnix: future }, now),
      "ok",
    );
    assert.equal(
      decideProductAccess(tenant, { stripeStatus: "canceled", paidUntilUnix: past }, now),
      "pay",
    );
    assert.equal(billingMark(tenant, { stripeStatus: "active", paidUntilUnix: future }, now), "paid");
  });
});
