import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createSjaSchema,
  getRiskLabel,
  getSjaConclusionLabel,
  getSjaStatusLabel,
} from "../src/features/sja/schemas/sja.schema";
import { createId } from "../src/lib/ids";

describe("RAMS status labels", () => {
  it("uses British English labels", () => {
    assert.equal(getSjaStatusLabel("DRAFT"), "Draft");
    assert.equal(getSjaStatusLabel("ACTIVE"), "Live");
    assert.equal(getSjaConclusionLabel("APPROVED"), "Approved — work may start");
  });
});

describe("RAMS risk labels", () => {
  it("treats 15 or above as very high", () => {
    assert.equal(getRiskLabel(15), "Very high");
  });

  it("treats below 5 as low", () => {
    assert.equal(getRiskLabel(4), "Low");
  });
});

describe("createSjaSchema ids", () => {
  it("accepts createId values used in production", () => {
    const parsed = createSjaSchema.parse({
      tenantId: createId(),
      title: "Working at height — roof of block C",
      description: "Access via MEWP, fit edge protection, then strip tiles from the ridge.",
      workLocation: "Block C roof",
      plannedDate: new Date("2026-09-01"),
      responsibleName: "Alex Taylor",
      participants: "Alex Taylor\nSam Reed",
      hazards: [
        {
          activity: "Access the roof",
          hazard: "Fall from height",
          consequence: "Serious injury to the roofers",
          measures: "Use a MEWP and edge protection",
        },
      ],
    });
    assert.equal(parsed.title, "Working at height — roof of block C");
  });
});
