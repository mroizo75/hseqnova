import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createMeasureSchema,
  getMeasureStatusLabel,
  isMeasureOverdue,
} from "../src/features/measures/schemas/measure.schema";
import { createId } from "../src/lib/ids";

describe("isMeasureOverdue", () => {
  it("returns false when the action is complete", () => {
    assert.equal(isMeasureOverdue(new Date("2000-01-01"), "DONE"), false);
  });

  it("returns true when the due date is in the past", () => {
    assert.equal(isMeasureOverdue(new Date("2000-01-01"), "PENDING"), true);
  });
});

describe("getMeasureStatusLabel", () => {
  it("uses British English labels", () => {
    assert.equal(getMeasureStatusLabel("PENDING"), "Not started");
    assert.equal(getMeasureStatusLabel("OVERDUE"), "Overdue");
  });
});

describe("createMeasureSchema ids", () => {
  it("accepts createId values used in production", () => {
    const parsed = createMeasureSchema.parse({
      tenantId: createId(),
      title: "Fit a guardrail on the roof",
      dueAt: new Date("2026-12-01"),
      responsibleId: createId(),
    });
    assert.equal(parsed.title, "Fit a guardrail on the roof");
    assert.equal(parsed.status, "PENDING");
  });
});
