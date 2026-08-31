import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  validateContractorForApproval,
  validateContractorRegistration,
} from "../src/lib/contractor-uk";

const validRegistration = {
  companyName: "Site Build Ltd",
  contactName: "Alex Patel",
  contactEmail: "alex@sitebuild.example",
  workToBeDone: "Annual boiler service at the Manchester depot",
};

describe("validateContractorRegistration", () => {
  it("accepts a named contractor and a described job", () => {
    const result = validateContractorRegistration(validRegistration);
    assert.equal(result.ok, true);
  });

  it("rejects a missing job description", () => {
    const result = validateContractorRegistration({
      ...validRegistration,
      workToBeDone: "Boiler",
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.code, "CONTRACTOR_WORK_REQUIRED");
  });
});

describe("validateContractorForApproval", () => {
  it("accepts a described job after host information has been given", () => {
    const result = validateContractorForApproval({
      workToBeDone: validRegistration.workToBeDone,
      hostInformationProvided: true,
    });
    assert.equal(result.ok, true);
  });

  it("rejects approval when host information has not been recorded (MHSWR reg.12)", () => {
    const result = validateContractorForApproval({
      workToBeDone: validRegistration.workToBeDone,
      hostInformationProvided: false,
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.code, "CONTRACTOR_HOST_INFO_REQUIRED");
  });
});
