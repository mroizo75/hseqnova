import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  addCalendarMonths,
  parseFollowUpMonths,
  scheduleCompetence,
  trainingFollowUpTitle,
} from "../src/features/training-sales/lib/follow-up";

describe("training competence follow-up", () => {
  it("dates the contact four months before a three-year record expires", () => {
    const window = scheduleCompetence({
      courseDate: "2026-11-17",
      validityMonths: 36,
      followUpMonths: 4,
      today: "2026-11-17",
    });
    assert.equal(window.validUntil, "2029-11-17");
    assert.equal(window.followUpAt, "2029-07-17");
  });

  it("refuses a lead time shorter than four months", () => {
    assert.throws(() => parseFollowUpMonths(3), (error: { code?: string }) => error.code === "FOLLOW_UP_MONTHS");
  });

  it("clamps month-end dates", () => {
    assert.equal(addCalendarMonths("2026-01-31", 1), "2026-02-28");
  });

  it("brings an overdue follow-up forward to today", () => {
    const window = scheduleCompetence({
      courseDate: "2024-01-01",
      validityMonths: 12,
      followUpMonths: 4,
      today: "2026-11-17",
    });
    assert.equal(window.validUntil, "2025-01-01");
    assert.equal(window.followUpAt, "2026-11-17");
  });

  it("names the company, the course and the expiry in the task", () => {
    assert.equal(
      trainingFollowUpTitle("Acme Ltd", "Work at height and fall protection", "2029-11-17"),
      "Contact Acme Ltd before Work at height and fall protection expires (17 Nov 2029)",
    );
  });
});
