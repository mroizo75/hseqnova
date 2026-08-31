import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validateFireRiskRecorded } from "../src/lib/fire-risk-uk";

const complete: Parameters<typeof validateFireRiskRecorded>[0] = {
  buildingName: "Main warehouse",
  responsiblePersonName: "Alex Morgan",
  responsiblePersonAddress: "12 High Street, Manchester, M1 1AA",
  assessorName: "Alex Morgan",
  peopleAtRisk: JSON.stringify({ employees: true, visitors: false }),
  escapeRoutes: "Two stair cores to a place of safety",
  reviewDate: "2027-03-01",
};

describe("validateFireRiskRecorded", () => {
  it("accepts a full recorded assessment", () => {
    const result = validateFireRiskRecorded(complete);
    assert.equal(result.ok, true);
  });

  it("rejects a missing responsible person address", () => {
    const result = validateFireRiskRecorded({
      ...complete,
      responsiblePersonAddress: "",
    });
    assert.equal(result.ok, false);
    if (result.ok === false) {
      assert.equal(result.code, "FRA_RP_ADDRESS_REQUIRED");
    }
  });
});
