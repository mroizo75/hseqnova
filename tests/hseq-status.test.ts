import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
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
    fireDrills: { hasAny: true, completedInLastYear: true },
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
