import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  employeeMaySeeDocument,
  isCurrentWorkingCopy,
  mayOpenDocumentFile,
  parseVisibleToRoles,
} from "../src/lib/document-uk";

describe("isCurrentWorkingCopy", () => {
  it("is the approved copy", () => {
    assert.equal(isCurrentWorkingCopy({ status: "APPROVED" }), true);
  });

  it("is not a draft", () => {
    assert.equal(isCurrentWorkingCopy({ status: "DRAFT" }), false);
  });
});

describe("employeeMaySeeDocument", () => {
  it("lets every role see an unrestricted approved document", () => {
    assert.equal(
      employeeMaySeeDocument({
        status: "APPROVED",
        visibleToRoles: null,
        role: "ANSATT",
      }),
      true,
    );
  });

  it("hides a draft even if the role is listed", () => {
    assert.equal(
      employeeMaySeeDocument({
        status: "DRAFT",
        visibleToRoles: ["ANSATT"],
        role: "ANSATT",
      }),
      false,
    );
  });
});

describe("parseVisibleToRoles", () => {
  it("reads a JSON string of roles", () => {
    assert.deepEqual(parseVisibleToRoles('["ANSATT","LEDER"]'), ["ANSATT", "LEDER"]);
  });
});

describe("mayOpenDocumentFile", () => {
  it("lets an approver open a draft", () => {
    assert.equal(
      mayOpenDocumentFile({
        status: "DRAFT",
        visibleToRoles: null,
        role: "HMS",
        canCreateDocuments: true,
        canApproveDocuments: true,
      }),
      true,
    );
  });
});
