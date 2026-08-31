import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createMeasureSchema,
  getMeasureStatusLabel,
  isMeasureOverdue,
} from "../src/features/measures/schemas/measure.schema";
import { createId } from "../src/lib/ids";
import {
  validateHsg245Action,
  validateOwnerProgress,
} from "../src/lib/measure-uk";

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

describe("validateHsg245Action", () => {
  it("accepts what, who and when", () => {
    const result = validateHsg245Action({
      title: "Fit a guardrail on the roof",
      responsibleId: createId(),
      dueAt: new Date("2026-12-01"),
    });
    assert.equal(result.ok, true);
  });

  it("rejects a missing owner", () => {
    const result = validateHsg245Action({
      title: "Fit a guardrail on the roof",
      responsibleId: "",
      dueAt: new Date("2026-12-01"),
    });
    assert.equal(result.ok, false);
    if (result.ok === false) {
      assert.equal(result.code, "ACTION_WHO_REQUIRED");
    }
  });
});

describe("validateOwnerProgress", () => {
  it("lets the owner start without a note", () => {
    const result = validateOwnerProgress({ status: "IN_PROGRESS" });
    assert.equal(result.ok, true);
  });

  it("requires a completion note to close", () => {
    const result = validateOwnerProgress({ status: "DONE", completionNote: "done" });
    assert.equal(result.ok, false);
    if (result.ok === false) {
      assert.equal(result.code, "ACTION_DONE_NOTE_REQUIRED");
    }
  });
});
