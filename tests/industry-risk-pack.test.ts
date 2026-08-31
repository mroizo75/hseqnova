import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { sanitizeIndustryRiskPack } from "../src/lib/industry-risk-pack";

describe("industry risk pack sanitizer", () => {
  it("keeps valid hazards and maps who-at-risk labels to MHSWR keys", () => {
    const pack = sanitizeIndustryRiskPack({
      industryLabel: "Commercial roofing",
      hazards: [
        {
          title: "Work at height on pitched roofs",
          context:
            "Operatives access pitched roofs to replace tiles. A fall from the eaves can cause fatal injury.",
          whoAtRisk: ["employees", "Contractors"],
          category: "SAFETY",
          likelihood: 4,
          consequence: 5,
          existingControls: "Scaffold, roof ladders and trained operatives.",
          legalRef: "WAHR 2005; MHSWR 1999 reg.3",
        },
      ],
    });

    assert.equal(pack.industryLabel, "Commercial roofing");
    assert.equal(pack.hazards.length, 1);
    assert.equal(pack.hazards[0]?.title, "Work at height on pitched roofs");
    assert.deepEqual(pack.hazards[0]?.whoAtRisk, ["employees", "contractors"]);
    assert.equal(pack.hazards[0]?.likelihood, 4);
    assert.equal(pack.hazards[0]?.consequence, 5);
  });

  it("drops empty rows, clamps scores and defaults unknown categories", () => {
    const pack = sanitizeIndustryRiskPack({
      industry: "Care home",
      hazards: [
        { title: "x" },
        {
          title: "Manual handling of residents",
          context: "Staff transfer residents between bed and chair several times a day.",
          whoAtRisk: ["visitors", "employees", "not-a-group"],
          category: "MADE_UP",
          likelihood: 99,
          consequence: 0,
          existingControls: "Hoists, training and two-person transfers.",
          legalRef: "",
        },
        ...Array.from({ length: 20 }, (_, index) => ({
          title: `Hazard ${index}`,
          context: "Long enough context for a significant finding in the accident book sense.",
          whoAtRisk: ["employees"],
          category: "HEALTH",
          likelihood: 2,
          consequence: 2,
          existingControls: "Typical control already in place here.",
          legalRef: "MHSWR 1999 reg.3",
        })),
      ],
    });

    assert.equal(pack.industryLabel, "Care home");
    assert.equal(pack.hazards.length, 15);
    assert.equal(pack.hazards[0]?.category, "SAFETY");
    assert.equal(pack.hazards[0]?.likelihood, 5);
    assert.equal(pack.hazards[0]?.consequence, 1);
    assert.equal(pack.hazards[0]?.legalRef, "MHSWR 1999 reg.3");
    assert.deepEqual(pack.hazards[0]?.whoAtRisk, ["employees"]);
  });
});
