import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isoRequirementSeedRows, ISO_45001_2018_VERSION_ID, ISO_9001_2015_VERSION_ID } from "../src/features/iso/lib/catalogue";
import { ALL_ISO_CLAUSES } from "../src/features/iso/lib/clauses";
import { EMPTY_ISO_SNAPSHOT, evaluateIsoClauses, type IsoEvidenceSnapshot } from "../src/features/iso/lib/evidence";
import { buildIsoReadiness, ISO_READY_DISCLAIMER } from "../src/features/iso/lib/readiness";
import {
  canSwitchToTenant,
  evaluateExistingUserInvite,
  EXTERNAL_CP_INVITE_DENIED,
  resolveScopedTenantId,
} from "../src/lib/external-competent-person";
import { hasIso93Input } from "../src/features/iso/lib/iso-93";

function livingSnapshot(): IsoEvidenceSnapshot {
  return {
    ...EMPTY_ISO_SNAPSHOT,
    contextCount: 2,
    interestedPartyCount: 2,
    hasScope: true,
    scopeApproved: true,
    policyPublished: true,
    policyAcknowledged: true,
    orgNodeCount: 2,
    consultationCount: 1,
    riskAssessmentCount: 1,
    riskWithControlsCount: 1,
    legalRequirementCount: 3,
    evaluatedLegalCount: 3,
    objectiveCount: 1,
    trainingRecordCount: 1,
    documentCount: 1,
    inspectionCount: 1,
    changeCount: 1,
    contractorCount: 1,
    fireDrillInYear: true,
    fireAssessment: true,
    completedAuditCount: 1,
    auditWithIsoClauses: true,
    completedReviewCount: 1,
    incidentCount: 1,
    nearMissCount: 1,
    whistleblowingCount: 0,
    actionsWithEffectiveness: 1,
    openActionCount: 0,
  };
}

describe("ISO certification readiness", () => {
  it("seeds published 45001:2018 and 9001:2015 requirements from the clause library", () => {
    const rows = isoRequirementSeedRows();
    assert.equal(rows.length, ALL_ISO_CLAUSES.length);
    assert.ok(rows.every((row) => row.shallParaphrase.length > 10));
    assert.ok(rows.some((row) => row.versionId === ISO_45001_2018_VERSION_ID && row.clauseKey === "45001-4.1"));
    assert.ok(rows.some((row) => row.versionId === ISO_9001_2015_VERSION_ID));
    assert.equal(rows.some((row) => row.versionId.includes("2027")), false);
  });

  it("is NOT READY until major gaps, IA, closed major NCs, 9.3 review and living use are all met", () => {
    const statuses = evaluateIsoClauses(EMPTY_ISO_SNAPSHOT);
    const blocked = buildIsoReadiness({
      statuses,
      assessments: [{ clauseKey: "45001-4.1", assessedLevel: "MAJOR_GAP" }],
      snapshot: EMPTY_ISO_SNAPSHOT,
      openMajorNcCount: 1,
      completedIsoAudit: false,
      managementReviewWith93: false,
      documentedNilReturn: false,
    });
    assert.equal(blocked.ready, false);
    assert.equal(blocked.label, "NOT READY");
    assert.equal(blocked.gates.find((gate) => gate.id === "major-gaps")?.met, false);
    assert.equal(blocked.gates.find((gate) => gate.id === "major-nc")?.met, false);
    assert.equal(blocked.gates.find((gate) => gate.id === "living-use")?.met, false);
    assert.equal(blocked.disclaimer, ISO_READY_DISCLAIMER);
  });

  it("is READY only when every gate is met", () => {
    const snapshot = livingSnapshot();
    const statuses = evaluateIsoClauses(snapshot);
    const readiness = buildIsoReadiness({
      statuses,
      assessments: statuses.map((item) => ({ clauseKey: item.clause.id, assessedLevel: "COMPLIANT" })),
      snapshot,
      openMajorNcCount: 0,
      completedIsoAudit: true,
      managementReviewWith93: true,
      documentedNilReturn: false,
    });
    assert.equal(readiness.ready, true);
    assert.equal(readiness.label, "READY");
    assert.equal(readiness.majorGaps, 0);
    assert.ok(readiness.chapters.every((chapter) => chapter.status === "green"));
  });

  it("rejects inviting an unflagged user who already belongs to another tenant", () => {
    const denied = evaluateExistingUserInvite({
      alreadyInThisTenant: false,
      otherTenantCount: 1,
      canBeExternalCompetentPerson: false,
    });
    assert.equal(denied.ok, false);
    if (!denied.ok) {
      assert.equal(denied.status, 403);
      assert.equal(denied.error, EXTERNAL_CP_INVITE_DENIED);
    }
  });

  it("allows a flagged external competent person to join without resetting the password", () => {
    const allowed = evaluateExistingUserInvite({
      alreadyInThisTenant: false,
      otherTenantCount: 2,
      canBeExternalCompetentPerson: true,
    });
    assert.equal(allowed.ok, true);
    if (allowed.ok) {
      assert.equal(allowed.resetPassword, false);
    }
  });

  it("forbids switching to a tenant without membership", () => {
    assert.equal(canSwitchToTenant(["tenant-a"], "tenant-b"), false);
    assert.equal(canSwitchToTenant(["tenant-a", "tenant-b"], "tenant-b"), true);
  });

  it("ignores a foreign tenantId in the request body and keeps the session tenant", () => {
    assert.equal(resolveScopedTenantId("session-tenant", "foreign-tenant"), "session-tenant");
  });

  it("requires ISO 9.3 inputs before a completed management review", () => {
    assert.equal(hasIso93Input({}), false);
    assert.equal(
      hasIso93Input({
        previousActionsStatus: "Last year's actions closed",
        interestedPartiesReview: "Workers and contractors consulted",
        complianceEvaluationReview: "Legal register evaluated this period",
        consultationReview: "H&S committee met in March",
      }),
      true,
    );
  });
});
