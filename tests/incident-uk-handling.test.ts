import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { canCloseUkIncident, getUkIncidentHandlingChecks } from "../src/lib/incident-uk-handling";
import { composeInvolvedPersons, titleFromDescription } from "../src/lib/accident-book";

describe("accident book helpers", () => {
  it("builds a title from the first line of the description", () => {
    assert.equal(titleFromDescription("Slipped on wet floor\nMore detail"), "Slipped on wet floor");
  });

  it("composes BI 510 person lines", () => {
    const text = composeInvolvedPersons({
      name: "Jane Smith",
      occupation: "Joiner",
      address: "1 High Street",
      role: "employee",
    });
    assert.match(text ?? "", /Jane Smith/);
    assert.match(text ?? "", /Occupation: Joiner/);
    assert.match(text ?? "", /Address: 1 High Street/);
  });
});

describe("UK incident handling checks", () => {
  const base = {
    type: "ULYKKE",
    location: "Yard",
    involvedPersons: "Jane Smith",
    injuredPersonOccupation: "Joiner",
    injuredPersonAddress: "1 High Street",
    injuryDescription: "Cut to left hand",
    shareWithSafetyRepsConsent: true,
    reporterAcknowledged: true,
    riddorReportable: false,
    rootCause: "Missing edge protection on the scaffold",
    measures: [] as Array<{ status: string }>,
    status: "INVESTIGATING",
  };

  it("is complete for a non-RIDDOR injury with BI 510 fields", () => {
    const checks = getUkIncidentHandlingChecks(base);
    assert.equal(checks.every((check) => check.done), true);
    assert.equal(canCloseUkIncident(base), true);
  });

  it("blocks close until RIDDOR method and reference are recorded", () => {
    const incident = {
      ...base,
      riddorReportable: true,
      riddorReportedAt: new Date(),
      riddorReference: null,
      riddorReportMethod: "online",
    };
    assert.equal(canCloseUkIncident(incident), false);
  });
});
