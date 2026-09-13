import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ADDON_PACKS,
  ANNUAL_DISCOUNT_PERCENT,
  HSEQ_CORE,
  billedTotalGbp,
  catalogStripePriceEnv,
  getAddonPack,
  isAddonPackActive,
  monthlyTotalGbp,
  yearlyPriceGbp,
} from "../src/lib/billing-catalog";

describe("HSEQ Nova billing catalog", () => {
  it("prices HSEQ Nova Core at £29 per month", () => {
    assert.equal(HSEQ_CORE.name, "HSEQ Nova Core");
    assert.equal(HSEQ_CORE.monthlyPriceGbp, 29);
  });

  it("treats an add-on as active when its entitlement module is on", () => {
    assert.equal(isAddonPackActive(["sja"], getAddonPack("rams")!), true);
    assert.equal(isAddonPackActive(["coshh"], getAddonPack("coshh")!), true);
    assert.equal(isAddonPackActive(["cdm"], getAddonPack("cdm")!), true);
  });

  it("does not treat an add-on as active without the pack", () => {
    assert.equal(isAddonPackActive([], getAddonPack("rams")!), false);
    assert.equal(isAddonPackActive(["audits"], getAddonPack("cdm")!), false);
    assert.equal(monthlyTotalGbp([]), 29);
    assert.equal(monthlyTotalGbp(["sja"]), 29 + 15);
    assert.equal(ADDON_PACKS.length, 6);
  });

  it("applies 10% off when billed yearly", () => {
    assert.equal(ANNUAL_DISCOUNT_PERCENT, 10);
    assert.equal(yearlyPriceGbp(29), 313.2);
    assert.equal(yearlyPriceGbp(15), 162);
    assert.equal(yearlyPriceGbp(19), 205.2);
    assert.equal(yearlyPriceGbp(30), 324);
    assert.equal(billedTotalGbp([], "month"), 29);
    assert.equal(billedTotalGbp([], "year"), 313.2);
    assert.equal(billedTotalGbp(["sja"], "year"), yearlyPriceGbp(29 + 15));
    assert.equal(catalogStripePriceEnv(HSEQ_CORE, "year"), "STRIPE_PRICE_CORE_YEARLY");
    assert.equal(catalogStripePriceEnv(HSEQ_CORE, "month"), "STRIPE_PRICE_CORE_MONTHLY");
  });
});
