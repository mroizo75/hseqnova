import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isChemicalReviewDueSoon,
  isChemicalReviewOverdue,
} from "../src/features/chemicals/lib/chemical-review";

describe("COSHH review dates", () => {
  const now = new Date("2026-08-22T12:00:00.000Z");

  it("treats a past review date as overdue", () => {
    assert.equal(isChemicalReviewOverdue("2026-08-01T00:00:00.000Z", now), true);
  });

  it("treats a missing review date as not overdue", () => {
    assert.equal(isChemicalReviewOverdue(null, now), false);
  });

  it("treats a date within 30 days as due soon", () => {
    assert.equal(isChemicalReviewDueSoon("2026-09-10T00:00:00.000Z", 30, now), true);
  });

  it("does not treat a date beyond the window as due soon", () => {
    assert.equal(isChemicalReviewDueSoon("2026-10-01T00:00:00.000Z", 30, now), false);
  });
});
