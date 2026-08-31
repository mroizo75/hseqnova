import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validateCoshhAssessment } from "../src/lib/coshh-uk";

const valid = {
  chemicalId: "chem_1",
  taskDescription: "Mixing adhesive in the workshop bay",
  exposureRoutes: "Inhalation of vapour, skin contact",
  existingControls: "LEV, nitrile gloves, goggles",
};

describe("validateCoshhAssessment", () => {
  it("accepts a linked substance, task, exposure routes and existing controls", () => {
    const result = validateCoshhAssessment(valid);
    assert.equal(result.ok, true);
  });

  it("rejects a missing substance, short task, missing routes or missing controls", () => {
    const noSubstance = validateCoshhAssessment({ ...valid, chemicalId: "  " });
    assert.equal(noSubstance.ok, false);
    if (!noSubstance.ok) assert.equal(noSubstance.code, "COSHH_SUBSTANCE_REQUIRED");

    const shortTask = validateCoshhAssessment({ ...valid, taskDescription: "Mixing" });
    assert.equal(shortTask.ok, false);
    if (!shortTask.ok) assert.equal(shortTask.code, "COSHH_TASK_REQUIRED");

    const noRoutes = validateCoshhAssessment({ ...valid, exposureRoutes: "ab" });
    assert.equal(noRoutes.ok, false);
    if (!noRoutes.ok) assert.equal(noRoutes.code, "COSHH_ROUTES_REQUIRED");

    const noControls = validateCoshhAssessment({ ...valid, existingControls: "" });
    assert.equal(noControls.ok, false);
    if (!noControls.ok) assert.equal(noControls.code, "COSHH_CONTROLS_REQUIRED");
  });
});
