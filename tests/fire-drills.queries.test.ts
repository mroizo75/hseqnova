import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { fireDrillDbPatchFromUpdate } from "../src/server/queries/fire-drills.queries";

describe("fire drill update patch", () => {
  it("serialises plannedDate and participantIds for Supabase", () => {
    const plannedDate = new Date("2026-08-22T10:00:00.000Z");
    const patch = fireDrillDbPatchFromUpdate({
      title: "Warehouse evacuation",
      plannedDate,
      participantIds: ["user-1", "user-2"],
    });

    assert.equal(patch.title, "Warehouse evacuation");
    assert.equal(patch.plannedDate, "2026-08-22T10:00:00.000Z");
    assert.equal(patch.participantIds, JSON.stringify(["user-1", "user-2"]));
  });

  it("omits unspecified fields", () => {
    const patch = fireDrillDbPatchFromUpdate({ location: "Yard" });
    assert.deepEqual(patch, { location: "Yard" });
  });
});
