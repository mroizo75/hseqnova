import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_POLICY_SECTIONS,
  HEALTH_SAFETY_POLICY_EMPLOYEE_PATH,
  HEALTH_SAFETY_POLICY_PATH,
  POLICY_NOTIFY_EMPLOYEE_ROLES,
  POLICY_NOTIFY_MANAGER_ROLES,
  policyPartForSectionKey,
  policySectionNeedsUkSync,
} from "../src/lib/health-safety-policy";

describe("health and safety policy (HSWA 1974 s.2(3))", () => {
  it("is structured as statement, organisation and arrangements", () => {
    assert.equal(policyPartForSectionKey("s1"), "statement");
    assert.equal(policyPartForSectionKey("s2"), "organisation");
    assert.equal(policyPartForSectionKey("s7a"), "arrangements");
  });

  it("includes first aid as a standard arrangement", () => {
    const firstAid = DEFAULT_POLICY_SECTIONS.find((section) => section.sectionKey === "s7a");
    assert.ok(firstAid);
    assert.equal(firstAid?.title, "First aid");
    assert.equal(firstAid?.legalRef, "Health and Safety (First-Aid) Regulations 1981");
    assert.match(firstAid?.content ?? "", /adequate and appropriate/i);
  });

  it("notifies employees on the employee portal, not the dashboard", () => {
    assert.equal(HEALTH_SAFETY_POLICY_EMPLOYEE_PATH, "/ansatt/hms-handbok");
    assert.ok(POLICY_NOTIFY_EMPLOYEE_ROLES.includes("ANSATT"));
    assert.ok(POLICY_NOTIFY_EMPLOYEE_ROLES.includes("VERNEOMBUD"));
    assert.equal(
      (POLICY_NOTIFY_EMPLOYEE_ROLES as readonly string[]).includes("EMPLOYEE"),
      false,
    );
    assert.ok(POLICY_NOTIFY_MANAGER_ROLES.includes("ADMIN"));
    assert.ok(HEALTH_SAFETY_POLICY_PATH.startsWith("/dashboard/"));
  });

  it("does not overwrite a custom English first-aid arrangement", () => {
    const needsSync = policySectionNeedsUkSync({
      sectionKey: "s7a",
      sectionNumber: "10",
      title: "First aid",
      legalRef: "Health and Safety (First-Aid) Regulations 1981",
      content: `<p>${"Named first aiders are listed on the organisation chart. Kits are at reception and in the workshop. ".repeat(8)}</p>`,
    });
    assert.equal(needsSync, false);
  });
});
