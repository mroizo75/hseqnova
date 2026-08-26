import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { fireDrillTypeLabel, FIRE_DRILL_STATUS_LABELS } from "../src/lib/fire-drill-uk";

describe("UK fire drill labels", () => {
  it("uses British type labels and keeps Prisma enum keys", () => {
    assert.equal(fireDrillTypeLabel("EVACUATION"), "Evacuation drill");
    assert.equal(fireDrillTypeLabel("FIRE_SUPPRESSION"), "Extinguisher training");
    assert.equal(fireDrillTypeLabel("ALARM_TEST"), "Fire alarm test");
    assert.equal(fireDrillTypeLabel("FULL_SCALE"), "Full evacuation drill");
  });

  it("uses British status labels", () => {
    assert.equal(FIRE_DRILL_STATUS_LABELS.EVALUATED, "Reviewed");
    assert.equal(FIRE_DRILL_STATUS_LABELS.CANCELLED, "Cancelled");
  });
});
