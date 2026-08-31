import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  computeRetentionUntilDate,
  deriveExposureStatus,
  effectiveExposureStatus,
  isHealthSurveillancePending,
} from "../src/features/exposure-register/lib/exposure-status";
import { isValidNiNumber, niNumberStatus, normalizeNiNumber } from "../src/features/exposure-register/lib/ni-number";
import { validateHealthRecord } from "../src/lib/health-record-uk";

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

  it("will not keep a health record for less than 40 years", () => {
    const until = computeRetentionUntilDate(5, new Date("2026-08-22T00:00:00.000Z"));
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

const validRecord = {
  employeeName: "Alex Taylor",
  homeAddress: "12 High Street, Leeds, LS1 1AA",
  exposureAgent: "Respirable crystalline silica",
  exposureStartDate: new Date("2026-01-15"),
  duration: "3 days/week, 2 hours/day",
  ppeUsed: "LEV and FFP3 respirator",
  healthCheckRequired: true,
  healthCheckDone: true,
  fitnessForWork: "FIT",
};

describe("validateHealthRecord", () => {
  it("accepts name, address, substance, start, frequency, PPE and fitness", () => {
    const result = validateHealthRecord(validRecord);
    assert.equal(result.ok, true);
  });

  it("rejects a missing address, frequency, PPE or fitness conclusion", () => {
    const noAddress = validateHealthRecord({ ...validRecord, homeAddress: "LS1" });
    assert.equal(noAddress.ok, false);
    if (!noAddress.ok) assert.equal(noAddress.code, "HEALTH_RECORD_ADDRESS_REQUIRED");

    const noFrequency = validateHealthRecord({ ...validRecord, duration: "" });
    assert.equal(noFrequency.ok, false);
    if (!noFrequency.ok) assert.equal(noFrequency.code, "HEALTH_RECORD_FREQUENCY_REQUIRED");

    const noPpe = validateHealthRecord({ ...validRecord, ppeUsed: "" });
    assert.equal(noPpe.ok, false);
    if (!noPpe.ok) assert.equal(noPpe.code, "HEALTH_RECORD_PPE_REQUIRED");

    const pendingAfterDone = validateHealthRecord({
      ...validRecord,
      fitnessForWork: "PENDING",
    });
    assert.equal(pendingAfterDone.ok, false);
    if (!pendingAfterDone.ok) assert.equal(pendingAfterDone.code, "HEALTH_RECORD_FITNESS_CONCLUSION");
  });
});
