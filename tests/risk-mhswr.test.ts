import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  assessMhswrRecord,
  formatGroupsAtRiskLabels,
  hasSignificantFindings,
  parseGroupsAtRisk,
  serializeGroupsAtRisk,
} from "../src/lib/risk-mhswr";

describe("MHSWR 1999 reg.3 significant findings", () => {
  it("requires hazard, who might be harmed, and existing controls", () => {
    assert.equal(
      hasSignificantFindings({
        title: "Work at height",
        context: "Short",
        existingControls: "Harnesses",
      }),
      false,
    );
    assert.equal(
      hasSignificantFindings({
        title: "Work at height",
        context: "Operatives on the mezzanine could fall.",
        existingControls: "Edge protection and harnesses.",
      }),
      true,
    );
  });

  it("records groups especially at risk as JSON", () => {
    const stored = serializeGroupsAtRisk(["young_persons", "none"]);
    assert.deepEqual(parseGroupsAtRisk(stored), ["young_persons", "none"]);
    assert.deepEqual(parseGroupsAtRisk(null), []);
    assert.deepEqual(formatGroupsAtRiskLabels('["young_persons","none"]'), [
      "Young persons",
      "None identified",
    ]);
  });

  it("treats an assessment as complete when findings, groups and review are recorded", () => {
    const incomplete = assessMhswrRecord({
      risks: [{ title: "Slips", context: "Staff in the kitchen", existingControls: null }],
      groupsAtRisk: null,
      reviewedAt: null,
      participants: "Jane Smith",
    });
    assert.equal(incomplete.complete, false);
    assert.equal(incomplete.consulted, true);

    const complete = assessMhswrRecord({
      risks: [
        {
          title: "Slips",
          context: "Kitchen staff on wet floors after wash-down.",
          existingControls: "Mats, signs and scheduled cleaning.",
          nextReviewDate: "2027-01-01",
        },
      ],
      groupsAtRisk: '["none"]',
      reviewedAt: null,
      participants: "Jane Smith",
    });
    assert.equal(complete.significantFindings, true);
    assert.equal(complete.groupsRecorded, true);
    assert.equal(complete.reviewRecorded, true);
    assert.equal(complete.complete, true);
  });
});
