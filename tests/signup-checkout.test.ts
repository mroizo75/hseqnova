import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { HSEQ_CORE } from "../src/lib/billing-catalog";
import {
  SIGNUP_FLOW,
  buildSignupMetadata,
  needsPaymentGate,
  normalizeCompanyNumber,
  parseSignupAddonIds,
  parseSignupCheckoutMetadata,
  resolveSignupPriceIds,
  serializeSignupAddonIds,
} from "../src/lib/signup-checkout";

describe("self-serve signup checkout", () => {
  it("resolves Core plus selected add-on Stripe price IDs", () => {
    const env: Record<string, string> = {
      STRIPE_PRICE_CORE_MONTHLY: "price_core",
      STRIPE_PRICE_RAMS_MONTHLY: "price_rams",
      STRIPE_PRICE_ENVIRONMENT_MONTHLY: "price_env",
    };
    const result = resolveSignupPriceIds(["environment", "rams", "unknown"], (name) => env[name] ?? null);
    assert.deepEqual(result.priceIds, ["price_core", "price_rams", "price_env"]);
    assert.deepEqual(result.missing, []);
  });

  it("lists missing Stripe price env names", () => {
    const result = resolveSignupPriceIds(["cdm"], () => null);
    assert.deepEqual(result.priceIds, []);
    assert.deepEqual(result.missing, [HSEQ_CORE.stripePriceEnv, "STRIPE_PRICE_CDM_MONTHLY"]);
  });

  it("builds and parses signup checkout metadata for the webhook", () => {
    const metadata = buildSignupMetadata("tenant_1", ["audits", "coshh", "audits"]);
    assert.equal(metadata.flow, SIGNUP_FLOW);
    assert.equal(metadata.tenantId, "tenant_1");
    assert.equal(metadata.addonIds, "coshh,audits");
    assert.equal(serializeSignupAddonIds(["audits", "coshh"]), "coshh,audits");

    const parsed = parseSignupCheckoutMetadata(metadata);
    assert.deepEqual(parsed, { tenantId: "tenant_1", addonIds: ["coshh", "audits"] });
    assert.equal(parseSignupCheckoutMetadata({ flow: "addon", tenantId: "x" }), null);
    assert.deepEqual(parseSignupAddonIds("rams,not-a-pack,environment"), ["rams", "environment"]);
  });

  it("gates unpaid self-serve tenants only", () => {
    assert.equal(needsPaymentGate({ onboardingStatus: "NOT_STARTED", stripeSubscriptionId: null }), true);
    assert.equal(
      needsPaymentGate({ onboardingStatus: "NOT_STARTED", stripeSubscriptionId: "sub_123" }),
      false,
    );
    assert.equal(needsPaymentGate({ onboardingStatus: "COMPLETED", stripeSubscriptionId: null }), false);
    assert.equal(normalizeCompanyNumber(" sc 123456 "), "SC123456");
  });
});
