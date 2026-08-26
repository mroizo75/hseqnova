import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { shouldRefreshMembership } from "../src/lib/auth-session";

describe("membership refresh throttle", () => {
  it("refreshes when never checked", () => {
    assert.equal(shouldRefreshMembership(undefined, 100_000), true);
  });

  it("skips a check inside the interval", () => {
    assert.equal(shouldRefreshMembership(90_000, 100_000, 60_000), false);
  });

  it("refreshes after the interval", () => {
    assert.equal(shouldRefreshMembership(10_000, 100_000, 60_000), true);
  });
});
