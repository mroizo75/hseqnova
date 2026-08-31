import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildOrgChartTree } from "../src/features/organization/lib/org-chart-tree";
import { assessOrgChartCoverage, dutyRequiresName } from "../src/lib/org-chart-duties";

describe("organisation chart tree", () => {
  it("nests a report under its parent", () => {
    const tree = buildOrgChartTree([
      {
        id: "md",
        parentId: null,
        title: "Managing director",
        name: "Jane Smith",
        department: "Leadership",
        hsDutyKey: "md",
        hsDuty: null,
        sortOrder: 0,
      },
      {
        id: "hse",
        parentId: "md",
        title: "HSE manager",
        name: "Alex Brown",
        department: "Health and safety",
        hsDutyKey: "competent_person",
        hsDuty: null,
        sortOrder: 1,
      },
    ]);

    assert.equal(tree.length, 1);
    assert.equal(tree[0].id, "md");
    assert.equal(tree[0].children.length, 1);
    assert.equal(tree[0].children[0].id, "hse");
  });

  it("treats an orphan parentId as a root", () => {
    const tree = buildOrgChartTree([
      {
        id: "orphan",
        parentId: "missing",
        title: "Supervisor",
        name: null,
        department: null,
        hsDutyKey: null,
        hsDuty: null,
        sortOrder: 0,
      },
    ]);

    assert.equal(tree.length, 1);
    assert.equal(tree[0].id, "orphan");
    assert.equal(tree[0].children.length, 0);
  });
});

describe("organisation chart H&S coverage (HSWA s.2(3) Part 2)", () => {
  it("requires a named competent person, MD, first aider and fire marshal", () => {
    const result = assessOrgChartCoverage([
      { hsDutyKey: "md", name: "Jane Smith" },
      { hsDutyKey: "competent_person", name: null },
    ]);
    assert.equal(result.complete, false);
    assert.ok(result.missing.includes("competent_person"));
    assert.ok(result.missing.includes("first_aid"));
    assert.ok(result.missing.includes("fire"));
    assert.equal(result.missing.includes("md"), false);
  });

  it("passes when core duty holders are named", () => {
    const result = assessOrgChartCoverage([
      { hsDutyKey: "md", name: "Jane Smith" },
      { hsDutyKey: "competent_person", name: "Alex Brown" },
      { hsDutyKey: "first_aid", name: "Sam Lee" },
      { hsDutyKey: "fire", name: "Pat Cole" },
    ]);
    assert.equal(result.complete, true);
    assert.deepEqual(result.missing, []);
  });

  it("requires a name for statutory duty holders", () => {
    assert.equal(dutyRequiresName("competent_person"), true);
    assert.equal(dutyRequiresName("line_manager"), false);
    assert.equal(dutyRequiresName(null), false);
  });
});
