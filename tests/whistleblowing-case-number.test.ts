import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { nextWhistleblowingCaseNumber } from "../src/server/queries/whistleblowing.queries";

describe("whistleblowing case numbers", () => {
  it("starts at WB-YYYY-001 when none exist", () => {
    assert.equal(nextWhistleblowingCaseNumber(null, 2026), "WB-2026-001");
  });

  it("increments the sequence and ignores a malformed previous number", () => {
    assert.equal(nextWhistleblowingCaseNumber("WB-2026-007", 2026), "WB-2026-008");
    assert.equal(nextWhistleblowingCaseNumber("WB-2025-099", 2026), "WB-2026-001");
    assert.equal(nextWhistleblowingCaseNumber("not-a-case", 2026), "WB-2026-001");
  });
});
