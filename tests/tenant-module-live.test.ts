import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isLiveTenantModule } from "../src/lib/tenant-modules";
import { isAdminAddonGrantSubscription } from "../src/lib/stripe-billing";

describe("tenant module live status", () => {
  it("keeps ACTIVE modules live", () => {
    assert.equal(isLiveTenantModule({ status: "ACTIVE", endsAt: null }), true);
  });

  it("keeps TRIAL modules live until endsAt", () => {
    const future = new Date(Date.now() + 86_400_000).toISOString();
    const past = new Date(Date.now() - 86_400_000).toISOString();
    assert.equal(isLiveTenantModule({ status: "TRIAL", endsAt: future }), true);
    assert.equal(isLiveTenantModule({ status: "TRIAL", endsAt: past }), false);
  });

  it("keeps PENDING_CANCEL live until period end", () => {
    const future = new Date(Date.now() + 86_400_000).toISOString();
    const past = new Date(Date.now() - 86_400_000).toISOString();
    assert.equal(isLiveTenantModule({ status: "PENDING_CANCEL", endsAt: future }), true);
    assert.equal(isLiveTenantModule({ status: "PENDING_CANCEL", endsAt: past }), false);
  });
});

describe("admin addon grant Stripe metadata", () => {
  it("recognises grant subscriptions so the core Stripe id is not overwritten", () => {
    assert.equal(isAdminAddonGrantSubscription({ admin_addon_grant: "1" }), true);
    assert.equal(isAdminAddonGrantSubscription({}), false);
    assert.equal(isAdminAddonGrantSubscription(undefined), false);
  });
});
