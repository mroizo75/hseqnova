import assert from "node:assert/strict";
import test from "node:test";
import {
  assessShareImport,
  existingControlsForImport,
  mayImportRecord,
  mayShareRecord,
  riskContextForImport,
  shareEmailContent,
  shareExpiresAt,
  shareRecordPath,
  sharedDocumentSlug,
  SHARE_TTL_MS,
} from "../src/lib/record-share";

const permissions = {
  canCreateRisks: true,
  canReadIncidents: true,
  canCreateIncidents: true,
  canCreateDocuments: false,
  canApproveDocuments: true,
};

test("share link expires after 14 days", () => {
  const now = new Date("2026-10-15T10:00:00.000Z");
  const expires = shareExpiresAt(now);
  assert.equal(expires.getTime() - now.getTime(), SHARE_TTL_MS);
  assert.equal(shareRecordPath("abc"), "/dashboard/share/abc");
});

test("import is refused for the same organisation, an expired link, or a used link", () => {
  const now = new Date("2026-10-15T10:00:00.000Z");
  const base = {
    now,
    expiresAt: new Date("2026-10-20T10:00:00.000Z"),
    revokedAt: null,
    importedAt: null,
    sourceTenantId: "source",
    destinationTenantId: "customer",
  };
  assert.equal(assessShareImport(base).ok, true);
  assert.equal(assessShareImport({ ...base, destinationTenantId: "source" }).ok, false);
  assert.equal(
    assessShareImport({ ...base, expiresAt: new Date("2026-10-01T10:00:00.000Z") }).ok,
    false,
  );
  assert.equal(assessShareImport({ ...base, importedAt: now }).ok, false);
});

test("competent person can share assessments and incidents; document import needs create rights", () => {
  assert.equal(mayShareRecord("RISK_ASSESSMENT", permissions), true);
  assert.equal(mayShareRecord("INCIDENT", permissions), true);
  assert.equal(mayShareRecord("DOCUMENT", permissions), true);
  assert.equal(mayImportRecord("DOCUMENT", permissions), false);
  assert.equal(mayShareRecord("INCIDENT", { ...permissions, canReadIncidents: false }), false);
});

test("short risk text is expanded so the imported assessment still records who might be harmed", () => {
  assert.equal(riskContextForImport("short", "Working at height").includes("Working at height"), true);
  assert.equal(existingControlsForImport("").length >= 8, true);
  assert.equal(sharedDocumentSlug("Fire policy!", "cabc123456"), "fire-policy-shared-123456");
});

test("share email is in British English and includes the link", () => {
  const message = shareEmailContent({
    organisationName: "North Yard Ltd",
    title: "Risk assessment 2026",
    kind: "RISK_ASSESSMENT",
    url: "https://hseqnova.co.uk/dashboard/share/token",
    expiresAt: new Date("2026-10-29T10:00:00.000Z"),
    note: "Please import this",
  });
  assert.match(message.subject, /North Yard Ltd/);
  assert.match(message.html, /https:\/\/hseqnova\.co\.uk\/dashboard\/share\/token/);
  assert.doesNotMatch(message.html, /risikovurdering|Endre tittel/i);
});
