import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isCoreModule, tenantHasModule } from "../src/lib/tenant-modules";
import { DASHBOARD_NAV_CONFIG, UK_EXCLUDED_NAV_HREFS, CORE_HSEQ_NAV_HREFS } from "../src/lib/dashboard-nav-config";

describe("tenant modules", () => {
  it("keeps core HSEQ on for every company", () => {
    assert.equal(isCoreModule("incidents"), true);
    assert.equal(isCoreModule("risks"), true);
    assert.equal(isCoreModule("documents"), true);
    assert.equal(tenantHasModule([], "incidents"), true);
    assert.equal(tenantHasModule([], "dashboard"), true);
    assert.equal(tenantHasModule([], "risks"), true);
  });

  it("does not treat procedures or annual plans as core modules", () => {
    assert.equal(isCoreModule("routines"), false);
    assert.equal(isCoreModule("annualHmsPlan"), false);
  });

  it("gates add-ons until the company has bought them", () => {
    assert.equal(tenantHasModule([], "sja"), false);
    assert.equal(tenantHasModule(["sja"], "sja"), true);
    assert.equal(tenantHasModule([], "chemicals"), false);
    assert.equal(tenantHasModule(["coshh"], "chemicals"), true);
    assert.equal(tenantHasModule(["cdm"], "constructionCompliance"), true);
  });
});

describe("UK dashboard nav", () => {
  it("lists risk assessments and omits procedures", () => {
    const hrefs = DASHBOARD_NAV_CONFIG.map((item) => item.href);
    assert.equal(hrefs.includes("/dashboard/risks"), true);
    assert.equal(hrefs.includes("/dashboard/procedures"), false);
    assert.equal(hrefs.includes("/dashboard/time-registration"), false);
    assert.equal(UK_EXCLUDED_NAV_HREFS.has("/dashboard/procedures"), true);
    assert.equal(UK_EXCLUDED_NAV_HREFS.has("/dashboard/goals"), true);
  });

  it("does not change core HSEQ by industry", () => {
    assert.equal(CORE_HSEQ_NAV_HREFS.includes("/dashboard/risks"), true);
    assert.equal((CORE_HSEQ_NAV_HREFS as readonly string[]).includes("/dashboard/sja"), false);
    assert.equal((CORE_HSEQ_NAV_HREFS as readonly string[]).includes("/dashboard/construction-compliance"), false);
  });
});
