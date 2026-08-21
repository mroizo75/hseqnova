import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isCoreModule, tenantHasModule } from "../src/lib/tenant-modules";

describe("tenant modules", () => {
  it("keeps core HSEQ on for every company", () => {
    assert.equal(isCoreModule("incidents"), true);
    assert.equal(tenantHasModule([], "incidents"), true);
    assert.equal(tenantHasModule([], "dashboard"), true);
  });

  it("gates add-ons until the company has bought them", () => {
    assert.equal(tenantHasModule([], "sja"), false);
    assert.equal(tenantHasModule(["sja"], "sja"), true);
  });
});
