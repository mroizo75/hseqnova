import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  computeRetentionUntilDate,
  deriveExposureStatus,
  effectiveExposureStatus,
  isHealthSurveillancePending,
} from "../src/features/exposure-register/lib/exposure-status";
import { isValidNiNumber, niNumberStatus, normalizeNiNumber } from "../src/features/exposure-register/lib/ni-number";

describe("COSHH health record status", () => {
  const now = new Date("2026-08-22T12:00:00.000Z");

  it("treats a past end date as inactive", () => {
    assert.equal(deriveExposureStatus("2026-08-01T00:00:00.000Z", null, now), "INACTIVE");
  });

  it("keeps an explicit archived status", () => {
    assert.equal(deriveExposureStatus(null, "ARCHIVED", now), "ARCHIVED");
  });

  it("shows ongoing records with a past end date as ended", () => {
    assert.equal(effectiveExposureStatus("ACTIVE", "2026-01-01T00:00:00.000Z", now), "INACTIVE");
  });

  it("flags incomplete health surveillance", () => {
    assert.equal(isHealthSurveillancePending(true, false), true);
    assert.equal(isHealthSurveillancePending(true, true), false);
  });

  it("adds 40 years for COSHH retention", () => {
    const until = computeRetentionUntilDate(40, new Date("2026-08-22T00:00:00.000Z"));
    assert.equal(until.getFullYear(), 2066);
  });
});

describe("National Insurance number", () => {
  it("accepts a valid NINO", () => {
    assert.equal(isValidNiNumber("AB 12 34 56 C"), true);
    assert.equal(normalizeNiNumber("ab 123456 c"), "AB123456C");
  });

  it("rejects an incomplete or invalid NINO", () => {
    assert.equal(niNumberStatus("AB12"), "incomplete");
    assert.equal(isValidNiNumber("QQ123456C"), false);
  });
});
