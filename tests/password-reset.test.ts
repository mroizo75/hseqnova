import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { generateResetToken } from "../src/lib/password-reset";

describe("generateResetToken", () => {
  it("returns a 64-character hex string", () => {
    const token = generateResetToken();
    assert.equal(token.length, 64);
    assert.match(token, /^[a-f0-9]+$/);
  });

  it("returns a unique value on each call", () => {
    const first = generateResetToken();
    const second = generateResetToken();
    assert.notEqual(first, second);
  });
});
