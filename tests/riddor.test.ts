import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { assessRiddor } from "../src/lib/riddor";

describe("assessRiddor", () => {
  it("flags a fatality as immediately reportable", () => {
    const result = assessRiddor({
      type: "ULYKKE",
      isFatal: true,
      occurredAt: new Date("2026-08-01T08:00:00Z"),
    });
    assert.equal(result.reportable, true);
    assert.equal(result.category, "death");
    assert.equal(result.dueAt?.toISOString(), "2026-08-01T08:00:00.000Z");
  });

  it("gives over-seven-day injuries a 15-day deadline", () => {
    const occurredAt = new Date("2026-08-01T08:00:00Z");
    const result = assessRiddor({
      type: "ULYKKE",
      overSevenDayInjury: true,
      occurredAt,
    });
    assert.equal(result.reportable, true);
    assert.equal(result.category, "over_seven_day");
    assert.equal(result.dueAt?.getUTCDate(), 16);
  });
});
