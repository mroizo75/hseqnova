import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createTrainingSchema,
  getTrainingStatus,
  uniqueByCourseKey,
} from "../src/features/training/schemas/training.schema";
import { createId } from "../src/lib/ids";
import { PERSONNEL_DOCUMENT_TYPES, validateTrainingMhswrReason } from "../src/lib/training-uk";

describe("training status", () => {
  it("treats completed training without expiry as completed", () => {
    assert.equal(
      getTrainingStatus({ completedAt: new Date("2026-01-01"), validUntil: null }),
      "COMPLETED",
    );
  });

  it("marks training expired after validUntil", () => {
    assert.equal(
      getTrainingStatus({
        completedAt: new Date("2024-01-01"),
        validUntil: new Date("2024-06-01"),
      }),
      "EXPIRED",
    );
  });
});

describe("uniqueByCourseKey", () => {
  it("keeps the first record per course", () => {
    const rows = uniqueByCourseKey([
      { courseKey: "first-aid", id: "a" },
      { courseKey: "fire-safety", id: "b" },
      { courseKey: "first-aid", id: "c" },
    ]);
    assert.deepEqual(rows.map((row) => row.id), ["a", "b"]);
  });
});

describe("createTrainingSchema ids", () => {
  it("accepts createId values used in production", () => {
    const parsed = createTrainingSchema.parse({
      tenantId: createId(),
      userId: createId(),
      courseKey: "first-aid",
      title: "First aid",
      provider: "St John Ambulance",
      mhswrReason: "recruitment",
    });
    assert.equal(parsed.courseKey, "first-aid");
    assert.equal(parsed.mhswrReason, "recruitment");
  });
});

describe("personnel documents", () => {
  it("includes CV and diploma types for the employee file", () => {
    assert.equal(PERSONNEL_DOCUMENT_TYPES[0].key, "cv");
    assert.equal(PERSONNEL_DOCUMENT_TYPES[0].expires, false);
    assert.equal(PERSONNEL_DOCUMENT_TYPES[1].title, "Diploma / qualification");
  });
});

describe("MHSWR training reason", () => {
  it("requires a reg.13 reason", () => {
    const missing = validateTrainingMhswrReason(null);
    assert.equal(missing.ok, false);
  });

  it("accepts recruitment as induction", () => {
    const ok = validateTrainingMhswrReason("recruitment");
    assert.equal(ok.ok, true);
    if (ok.ok) assert.equal(ok.reason, "recruitment");
  });
});
