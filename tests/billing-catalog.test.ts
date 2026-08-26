import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ADDON_PACKS,
  HSEQ_CORE,
  getAddonPack,
  isAddonPackActive,
  monthlyTotalGbp,
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
});
