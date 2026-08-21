import test from "node:test";
import assert from "node:assert/strict";
import { generateSecurePassword } from "../src/lib/privileged-users";

test("generateSecurePassword returnerer sterkt passord med alle tegnklasser", () => {
  const password = generateSecurePassword();

  assert.equal(password.length, 16);
  assert.match(password, /[A-Z]/, "mangler store bokstaver");
  assert.match(password, /[a-z]/, "mangler små bokstaver");
  assert.match(password, /[0-9]/, "mangler tall");
  assert.match(password, /[!@#$%^&*()\-_=+]/, "mangler spesialtegn");
});

test("generateSecurePassword krever minimumslengde", () => {
  assert.throws(() => generateSecurePassword(8), /Passordlengde må være et heltall/);
});

