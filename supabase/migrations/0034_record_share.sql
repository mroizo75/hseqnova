-- Share a risk assessment, incident or document into another HSEQ Nova organisation.
-- The recipient imports a copy. The source record stays where it was written.
-- Accident book copies: Social Security (Claims and Payments) Regulations 1979.
-- Risk assessments: MHSWR 1999 reg.3.

CREATE TABLE IF NOT EXISTS "RecordShare" (
  "id" TEXT PRIMARY KEY,
  "token" TEXT NOT NULL,
  "sourceTenantId" TEXT NOT NULL,
  "recordType" TEXT NOT NULL,
  "recordId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "recipientEmail" TEXT,
  "note" TEXT,
  "payload" JSONB NOT NULL,
  "sourceFileKey" TEXT,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "importedAt" TIMESTAMP(3),
  "importedByTenantId" TEXT,
  "importedRecordId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RecordShare_token_key" UNIQUE ("token"),
  CONSTRAINT "RecordShare_sourceTenantId_fkey"
    FOREIGN KEY ("sourceTenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "RecordShare_sourceTenantId_idx" ON "RecordShare"("sourceTenantId");
CREATE INDEX IF NOT EXISTS "RecordShare_record_idx" ON "RecordShare"("recordType", "recordId");

ALTER TABLE public."RecordShare" ENABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE public."RecordShare" TO service_role;
