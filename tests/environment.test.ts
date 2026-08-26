import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calculateSignificance,
  getMeasurementStatus,
} from "../src/server/queries/environment.queries";

describe("environmental measurement status", () => {
  it("is non-compliant when the reading exceeds the legal limit", () => {
    assert.equal(getMeasurementStatus(12, 10, 8), "NON_COMPLIANT");
  });

  it("is a warning when the reading exceeds the target but not the limit", () => {
    assert.equal(getMeasurementStatus(9, 10, 8), "WARNING");
  });

  it("is compliant when the reading is within the target", () => {
    assert.equal(getMeasurementStatus(7, 10, 8), "COMPLIANT");
  });
});

describe("environmental significance", () => {
  it("multiplies severity by likelihood", () => {
    assert.equal(calculateSignificance(5, 4), 20);
  });
});
