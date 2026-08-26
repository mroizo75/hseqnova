import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildOrgChartTree } from "../src/features/organization/lib/org-chart-tree";

describe("organisation chart tree", () => {
  it("nests a report under its parent", () => {
    const tree = buildOrgChartTree([
      {
        id: "md",
        parentId: null,
        title: "Managing director",
        name: "Jane Smith",
        department: "Leadership",
        sortOrder: 0,
      },
      {
        id: "hse",
        parentId: "md",
        title: "HSE manager",
        name: "Alex Brown",
        department: "Health and safety",
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
        sortOrder: 0,
      },
    ]);

    assert.equal(tree.length, 1);
    assert.equal(tree[0].id, "orphan");
    assert.equal(tree[0].children.length, 0);
  });
});
