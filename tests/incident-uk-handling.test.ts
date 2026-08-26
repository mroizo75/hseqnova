import test from "node:test";
import assert from "node:assert/strict";
import {
  canCloseUkIncident,
  getUkIncidentHandlingChecks,
} from "../src/lib/incident-uk-handling";

test("accident book injury is incomplete without place, person and injury", () => {
  const checks = getUkIncidentHandlingChecks({
    type: "ULYKKE",
    riddorReportable: false,
    measures: [],
  });
  const incomplete = checks.filter((check) => !check.done).map((check) => check.id);
  assert.deepEqual(incomplete, ["place", "injuredPerson", "injury", "investigate", "actions"]);
});

test("RIDDOR reportable events need a recorded HSE report", () => {
  const checks = getUkIncidentHandlingChecks({
    type: "ULYKKE",
    location: "Warehouse 2",
    involvedPersons: "Jane Smith, storekeeper, 1 High Street",
    injuryType: "fracture",
    riddorReportable: true,
    rootCause: "Missing edge protection on the mezzanine.",
    measures: [{ status: "DONE" }],
  });
  assert.equal(checks.find((check) => check.id === "riddor")?.done, false);
});

test("near miss can close after investigation with no actions", () => {
  assert.equal(
    canCloseUkIncident({
      rootCause: "Guard was missing; already refitted the same day.",
      status: "INVESTIGATING",
      measures: [],
    }),
    true
  );
  assert.equal(
    canCloseUkIncident({
      rootCause: "Cause recorded",
      status: "INVESTIGATING",
      measures: [{ status: "PENDING" }],
    }),
    false
  );
});
