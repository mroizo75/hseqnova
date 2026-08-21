import test from "node:test";
import assert from "node:assert/strict";
import { getExposureLevel, summarizeControls } from "../src/features/risks/utils/risk-register";

test("getExposureLevel bruker residual score når tilgjengelig", () => {
  assert.equal(getExposureLevel(16, 4), "LOW");
  assert.equal(getExposureLevel(4, null), "LOW");
  assert.equal(getExposureLevel(21, undefined), "CRITICAL");
});

test("summarizeControls teller effektive og gap", () => {
  const summary = summarizeControls([
    { status: "ACTIVE", effectiveness: "EFFECTIVE" },
    { status: "NEEDS_IMPROVEMENT", effectiveness: "PARTIAL" },
    { status: "ACTIVE", effectiveness: "INEFFECTIVE" },
    { status: "RETIRED", effectiveness: "NOT_TESTED" },
  ]);

  assert.deepEqual(summary, { effective: 1, gaps: 2, retired: 1 });
});

