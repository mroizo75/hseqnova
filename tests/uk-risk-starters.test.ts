import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getUkRiskStarterByKeys,
  getUkRiskStarterHazards,
  getUkRiskStarterPack,
  resolveUkRiskStarterIndustry,
} from "../src/lib/uk-risk-starters";

describe("UK risk starters", () => {
  it("maps aliases onto a starter pack and always includes workplace hazards", () => {
    assert.equal(resolveUkRiskStarterIndustry("bygg"), "construction");
    assert.equal(resolveUkRiskStarterIndustry(null), "other");

    const construction = getUkRiskStarterPack("construction");
    assert.equal(construction.groups.length, 2);
    assert.ok(construction.groups[0]?.hazards.some((hazard) => hazard.key === "slips-trips"));
    assert.ok(construction.groups[1]?.hazards.some((hazard) => hazard.key === "work-at-height"));
  });

  it("keeps hazard keys unique and scores inside the 5×5 matrix", () => {
    const hazards = getUkRiskStarterHazards("construction");
    const keys = hazards.map((hazard) => hazard.key);
    assert.equal(keys.length, new Set(keys).size);

    for (const hazard of hazards) {
      assert.ok(hazard.likelihood >= 1 && hazard.likelihood <= 5);
      assert.ok(hazard.consequence >= 1 && hazard.consequence <= 5);
      assert.ok(hazard.context.length >= 10);
      assert.ok(hazard.legalRef.length > 0);
    }
  });

  it("returns only requested hazards and ignores unknown keys", () => {
    const selected = getUkRiskStarterByKeys("construction", [
      "work-at-height",
      "missing",
      "work-at-height",
      "fire",
    ]);
    assert.deepEqual(
      selected.map((hazard) => hazard.key),
      ["fire", "work-at-height"],
    );
  });

  it("does not attach an industry group to the general workplace pack", () => {
    const pack = getUkRiskStarterPack("other");
    assert.equal(pack.groups.length, 1);
    assert.equal(pack.groups[0]?.id, "workplace");
  });
});
