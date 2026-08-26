import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildRamsBriefingSnapshot,
  parseAttendeeNames,
} from "../src/features/rams-briefing/lib/rams-briefing-snapshot";

describe("RAMS pre-start briefing", () => {
  it("takes the highest-risk hazards first", () => {
    const snapshot = buildRamsBriefingSnapshot(
      [
        { activity: "Cut", hazard: "Blade", measures: "Guard", riskLevel: 4 },
        { activity: "Lift", hazard: "Load", measures: "Two person", riskLevel: 12 },
      ],
      1,
    );
    assert.equal(snapshot.length, 1);
    assert.equal(snapshot[0].activity, "Lift");
  });

  it("parses attendee names and drops blanks", () => {
    assert.deepEqual(parseAttendeeNames("Jane Smith\n\nAlex Brown, Jane Smith"), [
      "Jane Smith",
      "Alex Brown",
    ]);
    assert.deepEqual(parseAttendeeNames("   "), []);
  });
});
