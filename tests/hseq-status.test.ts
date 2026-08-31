import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildControlJourney,
  evaluateHseqStatus,
  visibleHseqDuties,
  type HseqDutyKey,
  type HseqStatusInput,
} from "../src/lib/hseq-status";

const CORE_KEYS: HseqDutyKey[] = [
  "policy",
  "risks",
  "incidents",
  "actions",
  "inspections",
  "fireDrills",
  "training",
  "documents",
];

function healthyInput(overrides: Partial<HseqStatusInput> = {}): HseqStatusInput {
  return {
    now: new Date("2026-08-22T10:00:00.000Z"),
    enabledModules: [],
    allowedKeys: CORE_KEYS,
    policy: { hasPublished: true, lastReviewedAt: "2026-06-01T00:00:00.000Z" },
    risks: { total: 4, criticalCount: 0, overdueReviewCount: 0 },
    incidents: { openCount: 0, overdueRiddorCount: 0, pendingRiddorCount: 0 },
    actions: { overdueCount: 0, openCount: 2 },
    inspections: { total: 3, overdueCount: 0 },
    fireDrills: {
      hasAny: true,
      completedInLastYear: true,
      hasRecordedAssessment: true,
      assessmentReviewOverdue: false,
    },
    training: { expiredCount: 0 },
    documents: { total: 8 },
    ...overrides,
  };
}

describe("hseq status", () => {
  it("scores a complete core set as healthy", () => {
    const report = evaluateHseqStatus(healthyInput());
    assert.equal(report.overallLevel, "healthy");
    assert.equal(report.score, 100);
    assert.equal(report.duties.length, 8);
    assert.equal(report.criticalCount, 0);
    assert.equal(report.duties.some((duty) => duty.key === "chemicals"), false);
  });

  it("marks overdue RIDDOR as critical", () => {
    const report = evaluateHseqStatus(
      healthyInput({
        incidents: { openCount: 1, overdueRiddorCount: 1, pendingRiddorCount: 1 },
      }),
    );
    assert.equal(report.overallLevel, "critical");
    const incidents = report.duties.find((duty) => duty.key === "incidents");
    assert.equal(incidents?.level, "critical");
    assert.match(incidents?.headline ?? "", /RIDDOR/);
  });

  it("treats missing risk assessments as a gap and hides COSHH without the module", () => {
    const report = evaluateHseqStatus(
      healthyInput({
        risks: { total: 0, criticalCount: 0, overdueReviewCount: 0 },
        chemicals: { total: 0, missingSdsCount: 0, overdueReviewCount: 0 },
        allowedKeys: [...CORE_KEYS, "chemicals"],
      }),
    );
    assert.equal(report.overallLevel, "attention");
    assert.equal(report.duties.find((duty) => duty.key === "risks")?.level, "gap");
    assert.equal(report.duties.some((duty) => duty.key === "chemicals"), false);
  });

  it("shows COSHH when the tenant has the coshh add-on", () => {
    const keys = visibleHseqDuties(["coshh"], [...CORE_KEYS, "chemicals"]);
    assert.equal(keys.some((duty) => duty.key === "chemicals"), true);
    const report = evaluateHseqStatus(
      healthyInput({
        enabledModules: ["coshh"],
        allowedKeys: [...CORE_KEYS, "chemicals"],
        chemicals: { total: 0, missingSdsCount: 0, overdueReviewCount: 0 },
      }),
    );
    assert.equal(report.duties.some((duty) => duty.key === "chemicals"), true);
    assert.equal(report.duties.find((duty) => duty.key === "chemicals")?.level, "gap");
  });
});

describe("control journey", () => {
  function emptyFoundation(overrides: Partial<HseqStatusInput> = {}): HseqStatusInput {
    return healthyInput({
      policy: { hasPublished: false, lastReviewedAt: null },
      risks: { total: 0, criticalCount: 0, overdueReviewCount: 0 },
      documents: { total: 0 },
      inspections: { total: 0, overdueCount: 0 },
      fireDrills: {
        hasAny: false,
        completedInLastYear: false,
        hasRecordedAssessment: false,
        assessmentReviewOverdue: false,
      },
      ...overrides,
    });
  }

  it("opens as a wizard and points at the written policy first", () => {
    const journey = buildControlJourney(evaluateHseqStatus(emptyFoundation()));
    assert.equal(journey.mode, "wizard");
    assert.equal(journey.nextStep?.duty.key, "policy");
    assert.match(journey.nextStep?.action ?? "", /written health and safety policy/i);
    assert.equal(journey.phases[0]?.status, "current");
    assert.equal(journey.phases[1]?.status, "upcoming");
  });

  it("moves to risk assessments after the policy is published", () => {
    const journey = buildControlJourney(
      evaluateHseqStatus(
        emptyFoundation({
          policy: { hasPublished: true, lastReviewedAt: "2026-06-01T00:00:00.000Z" },
        }),
      ),
    );
    assert.equal(journey.mode, "wizard");
    assert.equal(journey.nextStep?.duty.key, "risks");
    assert.equal(journey.inPlace.some((duty) => duty.key === "policy"), true);
  });

  it("treats a missing fire risk assessment as a fire-safety gap", () => {
    const report = evaluateHseqStatus(
      healthyInput({
        fireDrills: {
          hasAny: true,
          completedInLastYear: true,
          hasRecordedAssessment: false,
          assessmentReviewOverdue: false,
        },
      }),
    );
    const fire = report.duties.find((duty) => duty.key === "fireDrills");
    assert.equal(fire?.level, "gap");
    assert.match(fire?.headline ?? "", /fire risk assessment/i);
  });

  it("leaves wizard mode once the foundation is on file", () => {
    const journey = buildControlJourney(
      evaluateHseqStatus(
        healthyInput({
          fireDrills: {
            hasAny: false,
            completedInLastYear: false,
            hasRecordedAssessment: false,
            assessmentReviewOverdue: false,
          },
        }),
      ),
    );
    assert.equal(journey.mode, "steady");
    assert.equal(journey.phases.find((phase) => phase.id === "foundation")?.status, "complete");
    assert.equal(journey.nextStep?.duty.key, "fireDrills");
  });

  it("puts overdue RIDDOR ahead of the wizard path", () => {
    const journey = buildControlJourney(
      evaluateHseqStatus(
        emptyFoundation({
          incidents: { openCount: 1, overdueRiddorCount: 1, pendingRiddorCount: 0 },
        }),
      ),
    );
    assert.equal(journey.mode, "wizard");
    assert.equal(journey.nextStep?.duty.key, "incidents");
    assert.equal(journey.critical.length, 1);
    assert.match(journey.nextStep?.action ?? "", /RIDDOR/);
  });

  it("has no next step when every duty is on track", () => {
    const journey = buildControlJourney(evaluateHseqStatus(healthyInput()));
    assert.equal(journey.mode, "steady");
    assert.equal(journey.nextStep, null);
    assert.equal(journey.inPlace.length, 8);
  });
});
