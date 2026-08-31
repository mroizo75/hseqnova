import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  defaultLegalBasisForType,
  inspectionTypeLabel,
  legalBasisLabel,
  resolveLegalBasis,
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

  it("maps inspection type to the statutory reason", () => {
    assert.equal(defaultLegalBasisForType("VERNERUNDE"), "monitoring");
    assert.equal(defaultLegalBasisForType("SIKKERHETSVANDRING"), "safety_rep");
    assert.equal(resolveLegalBasis("after_accident", "VERNERUNDE"), "after_accident");
    assert.equal(
      legalBasisLabel("safety_rep", "SIKKERHETSVANDRING").includes("SRSCWR 1977 reg.5(1)"),
      true,
    );
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
