import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  fireDrillTypeLabel,
  FIRE_DRILL_STATUS_LABELS,
  validateFireDrillComplete,
  validateFireDrillReview,
  namedFireMarshals,
} from "../src/lib/fire-drill-uk";

describe("UK fire drill labels", () => {
  it("uses British type labels and keeps Prisma enum keys", () => {
    assert.equal(fireDrillTypeLabel("EVACUATION"), "Evacuation drill");
    assert.equal(fireDrillTypeLabel("FIRE_SUPPRESSION"), "Extinguisher training");
    assert.equal(fireDrillTypeLabel("ALARM_TEST"), "Fire alarm test");
    assert.equal(fireDrillTypeLabel("FULL_SCALE"), "Full evacuation drill");
  });

  it("requires evacuation time on an evacuation drill", () => {
    const missing = validateFireDrillComplete({
      drillType: "EVACUATION",
      completedAt: "2026-08-31T10:00:00.000Z",
      actualParticipantCount: 12,
      evacuationTimeSeconds: null,
      observations: "Alarm heard on all floors. Assembly point used.",
    });
    assert.equal(missing.ok, false);

    const alarmTest = validateFireDrillComplete({
      drillType: "ALARM_TEST",
      completedAt: "2026-08-31T10:00:00.000Z",
      actualParticipantCount: 2,
      evacuationTimeSeconds: null,
      observations: "Call point activated; panel showed the correct zone.",
    });
    assert.equal(alarmTest.ok, true);
  });

  it("requires procedure changes when the drill was not fully satisfactory", () => {
    const incomplete = validateFireDrillReview({
      objectivesAchieved: "PARTIAL",
      evaluation: "Two people used the lift.",
      improvementPoints: "Brief staff not to use lifts.",
      procedureChangesDesc: null,
    });
    assert.equal(incomplete.ok, false);

    const complete = validateFireDrillReview({
      objectivesAchieved: "PARTIAL",
      evaluation: "Two people used the lift.",
      improvementPoints: "Brief staff not to use lifts.",
      procedureChangesDesc: "Add a marshal on the lift lobby.",
    });
    assert.equal(complete.ok, true);
  });

  it("lists named fire marshals from the organisation chart", () => {
    assert.deepEqual(
      namedFireMarshals([
        { hsDutyKey: "fire", name: "Pat Cole", title: "Fire marshal" },
        { hsDutyKey: "fire", name: "  ", title: "Fire marshal" },
        { hsDutyKey: "first_aid", name: "Sam Lee", title: "First aider" },
      ]),
      [{ name: "Pat Cole", title: "Fire marshal" }],
    );
  });
});
