import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  inspectionTypeLabel,
  validateInspectionFinding,
  validateInspectionRecord,
} from "../src/lib/inspection-uk";

describe("UK workplace inspection record", () => {
  it("uses British type labels and keeps Prisma enum keys", () => {
    assert.equal(inspectionTypeLabel("VERNERUNDE"), "Workplace inspection");
    assert.equal(inspectionTypeLabel("SIKKERHETSVANDRING"), "Safety representative inspection");
    assert.equal(inspectionTypeLabel("SHA_PLAN"), "Construction site inspection");
  });

  it("requires date, workplace and inspector for F2534", () => {
    const missing = validateInspectionRecord({
      scheduledDate: "",
      location: "Warehouse",
      conductedBy: "user-1",
    });
    assert.equal(missing.ok, false);

    const ok = validateInspectionRecord({
      scheduledDate: "2026-08-22T10:00",
      location: "Warehouse",
      conductedBy: "user-1",
    });
    assert.equal(ok.ok, true);
  });

  it("requires owner and due date on a finding", () => {
    const missing = validateInspectionFinding({
      title: "Blocked fire exit",
      description: "Exit B is locked.",
      responsibleId: null,
      dueDate: null,
    });
    assert.equal(missing.ok, false);

    const ok = validateInspectionFinding({
      title: "Blocked fire exit",
      description: "Exit B is locked.",
      responsibleId: "user-2",
      dueDate: "2026-08-29",
    });
    assert.equal(ok.ok, true);
  });
});
