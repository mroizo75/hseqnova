import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  countWorkdaysInclusive,
  isF10Notifiable,
  evaluatePreNotificationRequirement,
} from "../src/lib/construction-compliance-rules";
import {
  clientNameFromDutyHolders,
  mergeDutyHoldersForForm,
  normalizeDutyHolders,
  validateDutyHolders,
} from "../src/features/projects/lib/cdm-duty-holders";

describe("CDM 2015 F10 notifiable", () => {
  it("is required when work lasts more than 30 working days with more than 20 workers", () => {
    const result = isF10Notifiable({
      workDays: 31,
      maxWorkers: 21,
      personDays: 31 * 21,
    });
    assert.equal(result.isRequired, true);
    assert.ok(result.reasons.some((reason) => reason.includes("30 working days")));
  });

  it("is required when estimated work exceeds 500 person days", () => {
    const result = isF10Notifiable({
      workDays: 20,
      maxWorkers: 26,
      personDays: 520,
    });
    assert.equal(result.isRequired, true);
    assert.ok(result.reasons.some((reason) => reason.includes("500 person days")));
  });

  it("is not required for a short site with few workers", () => {
    const result = isF10Notifiable({
      workDays: 20,
      maxWorkers: 10,
      personDays: 200,
    });
    assert.equal(result.isRequired, false);
    assert.deepEqual(result.reasons, []);
  });

  it("evaluates F10 from planned dates using CDM thresholds, not the Norwegian 15/250 rule", () => {
    const start = new Date("2026-03-02");
    const end = new Date("2026-03-27");
    assert.equal(countWorkdaysInclusive(start, end), 20);

    const notNotifiable = evaluatePreNotificationRequirement({
      expectedStartDate: start,
      expectedEndDate: end,
      maxWorkersSimultaneous: 10,
    });
    assert.equal(notNotifiable.isRequired, false);

    const notifiable = evaluatePreNotificationRequirement({
      expectedStartDate: "2026-01-05",
      expectedEndDate: "2026-03-27",
      maxWorkersSimultaneous: 25,
    });
    assert.equal(notifiable.isRequired, true);
    assert.ok((notifiable.workDays ?? 0) > 30);
  });
});

describe("CDM 2015 duty holders", () => {
  it("requires a Client organisation and copies that name onto the project", () => {
    const missing = validateDutyHolders([
      { role: "PRINCIPAL_CONTRACTOR", organisationName: "Site Build Ltd" },
    ]);
    assert.equal(missing.ok, false);

    const holders = [
      { role: "CLIENT" as const, organisationName: "  City of Manchester  ", contactEmail: "" },
      { role: "PRINCIPAL_DESIGNER" as const, organisationName: "" },
      { role: "PRINCIPAL_CONTRACTOR" as const, organisationName: "Site Build Ltd" },
    ];
    const valid = validateDutyHolders(holders);
    assert.equal(valid.ok, true);
    assert.equal(clientNameFromDutyHolders(holders), "City of Manchester");
    assert.deepEqual(
      normalizeDutyHolders(holders).map((holder) => holder.role),
      ["CLIENT", "PRINCIPAL_CONTRACTOR"],
    );
  });

  it("keeps one appointment per core role and allows extra designers", () => {
    const holders = normalizeDutyHolders([
      { role: "CLIENT", organisationName: "Client A" },
      { role: "CLIENT", organisationName: "Client B" },
      { role: "DESIGNER", organisationName: "Steel Design Ltd" },
      { role: "DESIGNER", organisationName: "M&E Design Ltd" },
    ]);
    assert.equal(holders.filter((holder) => holder.role === "CLIENT").length, 1);
    assert.equal(holders.filter((holder) => holder.role === "DESIGNER").length, 2);
  });

  it("pre-fills the Client appointment from the existing project client name", () => {
    const form = mergeDutyHoldersForForm([], "North West Developments Ltd");
    assert.equal(form[0].role, "CLIENT");
    assert.equal(form[0].organisationName, "North West Developments Ltd");
    assert.equal(form[1].role, "PRINCIPAL_DESIGNER");
    assert.equal(form[2].role, "PRINCIPAL_CONTRACTOR");
  });
});
