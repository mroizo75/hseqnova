import test from "node:test";
import assert from "node:assert/strict";
import { buildInspectionImageKey, sanitizeInspectionFileName } from "../src/lib/inspection-image-upload";

test("buildInspectionImageKey lager nøkkel med tenant og inspeksjon", () => {
  const key = buildInspectionImageKey({
    tenantId: "tenant-123",
    inspectionId: "insp-456",
    fileName: "test.jpeg",
    timestamp: 123456,
  });

  assert.equal(key, "tenants/tenant-123/inspections/insp-456/123456-test.jpeg");
});

test("buildInspectionImageKey saniterer filnavn og håndterer spesialtegn", () => {
  const key = buildInspectionImageKey({
    tenantId: "tenant",
    inspectionId: "insp",
    fileName: "måling 1 ?.png",
    timestamp: 99,
  });

  assert.equal(key, "tenants/tenant/inspections/insp/99-m_ling_1__.png");
});

test("sanitizeInspectionFileName faller tilbake til standardverdi", () => {
  assert.equal(sanitizeInspectionFileName(""), "image");
  assert.equal(sanitizeInspectionFileName("   "), "image");
});


