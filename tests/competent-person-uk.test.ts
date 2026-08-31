import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  hasNamedCompetentPerson,
  namedCompetentPersons,
  validateInviteName,
} from "../src/lib/competent-person-uk";
import { getRoleDescription } from "../src/lib/permissions";

describe("namedCompetentPersons", () => {
  it("returns named appointments", () => {
    const names = namedCompetentPersons([
      { hsDutyKey: "competent_person", name: "Alex Brown" },
      { hsDutyKey: "fire", name: "Sam Lee" },
    ]);
    assert.deepEqual(names, ["Alex Brown"]);
  });

  it("is false when the hat has no name", () => {
    assert.equal(
      hasNamedCompetentPerson([{ hsDutyKey: "competent_person", name: "  " }]),
      false,
    );
  });
});

describe("validateInviteName", () => {
  it("accepts a real name", () => {
    const result = validateInviteName("Jane Smith");
    assert.equal(result.ok, true);
  });

  it("rejects a blank name", () => {
    const result = validateInviteName(" ");
    assert.equal(result.ok, false);
    if (result.ok === false) {
      assert.equal(result.code, "NAME_REQUIRED");
    }
  });
});

describe("getRoleDescription", () => {
  it("does not treat the HSE manager role as the legal appointment", () => {
    const text = getRoleDescription("HMS");
    assert.equal(text.includes("organisation chart"), true);
    assert.equal(text.startsWith("Competent person."), false);
  });
});
