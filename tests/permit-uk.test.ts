import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  parsePermitPayload,
  permitTypeLabel,
  validatePermitCreate,
  validatePermitIssue,
} from "../src/lib/permit-uk";

const validCreate = {
  type: "HOT_WORK",
  title: "Hot work on roof level 3",
  location: "Building A roof",
  validFrom: new Date("2026-09-01T08:00:00Z"),
  validTo: new Date("2026-09-01T18:00:00Z"),
  description: "Cut and weld the handrail on the leading edge.",
  hazards: "Fire, burns, falling objects",
  controlMeasures: "Fire watch, extinguisher, exclusion zone",
};

describe("permitTypeLabel", () => {
  it("uses British English labels", () => {
    assert.equal(permitTypeLabel("HOT_WORK"), "Hot work");
    assert.equal(permitTypeLabel("CONFINED_SPACE"), "Confined space");
  });
});

describe("validatePermitCreate", () => {
  it("accepts a time-limited permit with hazards and controls", () => {
    const result = validatePermitCreate(validCreate);
    assert.equal(result.ok, true);
  });

  it("rejects a permit without an end time", () => {
    const result = validatePermitCreate({ ...validCreate, validTo: null });
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.code, "PERMIT_UNTIL_REQUIRED");
  });

  it("requires rescue arrangements for confined space", () => {
    const result = validatePermitCreate({
      ...validCreate,
      type: "CONFINED_SPACE",
      emergencyArrangements: "",
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.code, "PERMIT_RESCUE_REQUIRED");
  });
});

describe("validatePermitIssue", () => {
  it("requires a named issuer and acceptor", () => {
    const payload = parsePermitPayload(JSON.stringify({
      description: validCreate.description,
      hazards: validCreate.hazards,
      controlMeasures: validCreate.controlMeasures,
    }));
    const missing = validatePermitIssue({
      type: "HOT_WORK",
      validTo: validCreate.validTo,
      location: validCreate.location,
      payload,
      issuerName: "",
      acceptorName: "Sam Reed",
    });
    assert.equal(missing.ok, false);
    if (!missing.ok) assert.equal(missing.code, "PERMIT_ISSUER_REQUIRED");

    const ok = validatePermitIssue({
      type: "HOT_WORK",
      validTo: validCreate.validTo,
      location: validCreate.location,
      payload,
      issuerName: "Alex Taylor",
      acceptorName: "Sam Reed",
    });
    assert.equal(ok.ok, true);
  });
});
