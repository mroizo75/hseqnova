import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ALL_ISO_CLAUSES, auditClauseOptions, ISO_45001_CLAUSES, ISO_9001_CLAUSES } from "../src/features/iso/lib/clauses";
import {
  buildIsoJourney,
  EMPTY_ISO_SNAPSHOT,
  evaluateIsoClauses,
  type IsoEvidenceSnapshot,
} from "../src/features/iso/lib/evidence";
import { getAddonPack, isAddonPackActive } from "../src/lib/billing-catalog";
import { tenantHasIsoPack, tenantHasModule } from "../src/lib/tenant-modules";

describe("ISO IMS pack", () => {
  it("treats existing audits tenants as ISO customers", () => {
    assert.equal(tenantHasIsoPack(["audits"]), true);
    assert.equal(tenantHasModule(["iso"], "audits"), true);
    assert.equal(isAddonPackActive(["audits"], getAddonPack("iso")!), true);
    assert.equal(getAddonPack("iso")?.name, "ISO 45001 & 9001");
  });

  it("ships both ISO 45001 and ISO 9001 clauses with auditor hints", () => {
    assert.ok(ISO_45001_CLAUSES.length >= 20);
    assert.ok(ISO_9001_CLAUSES.length >= 10);
    assert.ok(ALL_ISO_CLAUSES.every((clause) => clause.auditorHint.length > 10));
    assert.ok(auditClauseOptions().some((option) => option.value.startsWith("45001:")));
    assert.ok(auditClauseOptions().some((option) => option.value.startsWith("9001:")));
  });

  it("marks context as missing until issues exist, then covered", () => {
    const empty = evaluateIsoClauses(EMPTY_ISO_SNAPSHOT);
    const context = empty.find((item) => item.clause.id === "45001-4.1");
    assert.equal(context?.level, "missing");

    const filled: IsoEvidenceSnapshot = {
      ...EMPTY_ISO_SNAPSHOT,
      contextCount: 2,
      interestedPartyCount: 2,
      hasScope: true,
      scopeApproved: true,
    };
    const journey = buildIsoJourney(evaluateIsoClauses(filled));
    assert.equal(journey.mode, "steady");
    assert.ok(journey.percent > 0);
    const coveredContext = evaluateIsoClauses(filled).find((item) => item.clause.id === "45001-4.1");
    assert.equal(coveredContext?.level, "covered");
  });
});
