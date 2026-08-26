import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseTeamMemberIds } from "../src/server/queries/audits.queries";

describe("audit team members", () => {
  it("parses a JSON array of user ids", () => {
    assert.deepEqual(parseTeamMemberIds('["user-1","user-2"]'), ["user-1", "user-2"]);
  });

  it("returns an empty list for missing or invalid values", () => {
    assert.deepEqual(parseTeamMemberIds(null), []);
    assert.deepEqual(parseTeamMemberIds(undefined), []);
    assert.deepEqual(parseTeamMemberIds("not-json"), []);
    assert.deepEqual(parseTeamMemberIds('{"id":"user-1"}'), []);
  });
});
