import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { demoEndsAt, isDemoAccessExpired, isDemoRegistration } from "../src/lib/demo-access";

describe("admin demo access", () => {
  it("recognises DEMO registration type", () => {
    assert.equal(isDemoRegistration("DEMO"), true);
    assert.equal(isDemoRegistration("STANDARD"), false);
  });

  it("keeps a live demo open until trialEndsAt", () => {
    const future = new Date(Date.now() + 86_400_000).toISOString();
    assert.equal(
      isDemoAccessExpired({ registrationType: "DEMO", status: "TRIAL", trialEndsAt: future }),
      false,
    );
  });

  it("expires a demo after trialEndsAt unless the tenant is ACTIVE", () => {
    const past = new Date(Date.now() - 86_400_000).toISOString();
    assert.equal(
      isDemoAccessExpired({ registrationType: "DEMO", status: "TRIAL", trialEndsAt: past }),
      true,
    );
    assert.equal(
      isDemoAccessExpired({ registrationType: "DEMO", status: "ACTIVE", trialEndsAt: past }),
      false,
    );
  });

  it("adds calendar days for the demo window", () => {
    const from = new Date("2026-10-01T12:00:00.000Z");
    assert.equal(demoEndsAt(7, from).toISOString().slice(0, 10), "2026-10-08");
  });
});
