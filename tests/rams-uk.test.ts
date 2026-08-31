import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  validateRamsMethod,
  validateWhoMightBeHarmed,
} from "../src/lib/rams-uk";
import { createSjaSchema } from "../src/features/sja/schemas/sja.schema";
import { createId } from "../src/lib/ids";

const validHazard = {
  activity: "Access the roof",
  hazard: "Fall from height",
  consequence: "Serious injury to the roofers",
  measures: "Use a MEWP and edge protection",
};

describe("validateRamsMethod", () => {
  it("accepts a method of work of at least 20 characters", () => {
    const result = validateRamsMethod("Access via MEWP, then edge protection before any work starts.");
    assert.equal(result.ok, true);
  });

  it("rejects a missing or short method", () => {
    const missing = validateRamsMethod("   ");
    assert.equal(missing.ok, false);
    if (!missing.ok) assert.equal(missing.code, "RAMS_METHOD_REQUIRED");
  });
});

describe("validateWhoMightBeHarmed", () => {
  it("accepts how someone might be harmed", () => {
    const result = validateWhoMightBeHarmed("Roofers falling from the leading edge");
    assert.equal(result.ok, true);
  });

  it("rejects a blank consequence", () => {
    const missing = validateWhoMightBeHarmed("");
    assert.equal(missing.ok, false);
    if (!missing.ok) assert.equal(missing.code, "RAMS_HARM_REQUIRED");
  });
});

describe("createSjaSchema RAMS duties", () => {
  it("requires a method of work and who might be harmed", () => {
    const parsed = createSjaSchema.parse({
      tenantId: createId(),
      title: "Working at height — roof of block C",
      description: "Access via MEWP, fit edge protection, then strip tiles from the ridge.",
      workLocation: "Block C roof",
      plannedDate: new Date("2026-09-01"),
      responsibleName: "Alex Taylor",
      participants: "Alex Taylor\nSam Reed",
      hazards: [validHazard],
    });
    assert.equal(parsed.description?.startsWith("Access via MEWP"), true);
    assert.equal(parsed.hazards[0]?.consequence, "Serious injury to the roofers");
  });

  it("rejects RAMS without a method of work", () => {
    assert.throws(() =>
      createSjaSchema.parse({
        tenantId: createId(),
        title: "Working at height — roof of block C",
        workLocation: "Block C roof",
        plannedDate: new Date("2026-09-01"),
        responsibleName: "Alex Taylor",
        participants: "Alex Taylor",
        hazards: [validHazard],
      }),
    );
  });
});
