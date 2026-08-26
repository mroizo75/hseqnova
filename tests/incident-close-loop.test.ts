import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { evaluateIncidentCloseLoop } from "../src/lib/incident-close-loop";

describe("incident close loop", () => {
  it("allows close when every action is done", () => {
    const result = evaluateIncidentCloseLoop({
      measureStatuses: ["DONE", "DONE"],
      noActionReason: "",
    });
    assert.deepEqual(result, { ok: true, path: "actions" });
  });

  it("blocks close when an action is still open", () => {
    const result = evaluateIncidentCloseLoop({
      measureStatuses: ["DONE", "OPEN"],
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.code, "ACTIONS_OPEN");
  });

  it("requires a recorded reason when there is no action", () => {
    const missing = evaluateIncidentCloseLoop({ measureStatuses: [] });
    assert.equal(missing.ok, false);

    const recorded = evaluateIncidentCloseLoop({
      measureStatuses: [],
      noActionReason: "Near miss stopped at source; no remaining risk after the immediate stop.",
    });
    assert.deepEqual(recorded, { ok: true, path: "no_action" });
  });
});
