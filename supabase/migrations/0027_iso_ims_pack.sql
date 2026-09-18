-- ISO 45001 & 9001 IMS pack
-- Tenant-scoped registers for context, interested parties, scope,
-- legal requirements / compliance evaluation, and management of change.
-- Management review gains the remaining ISO 9.3 inputs.

ALTER TABLE "ManagementReview"
  ADD COLUMN IF NOT EXISTS "previousActionsStatus" TEXT,
  ADD COLUMN IF NOT EXISTS "interestedPartiesReview" TEXT,
  ADD COLUMN IF NOT EXISTS "complianceEvaluationReview" TEXT,
  ADD COLUMN IF NOT EXISTS "consultationReview" TEXT,
  ADD COLUMN IF NOT EXISTS "communicationReview" TEXT;

CREATE TABLE IF NOT EXISTS "IsoContextIssue" (
  "id"          TEXT NOT NULL,
  "tenantId"    TEXT NOT NULL,
  "kind"        TEXT NOT NULL,
  "title"       TEXT NOT NULL,
  "description" TEXT,
  "relevance"   TEXT,
  "reviewedAt"  TIMESTAMPTZ,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "IsoContextIssue_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "IsoContextIssue_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "IsoContextIssue_tenantId_idx" ON "IsoContextIssue"("tenantId");
CREATE INDEX IF NOT EXISTS "IsoContextIssue_kind_idx" ON "IsoContextIssue"("kind");

CREATE TABLE IF NOT EXISTS "IsoInterestedParty" (
  "id"                 TEXT NOT NULL,
  "tenantId"           TEXT NOT NULL,
  "name"               TEXT NOT NULL,
  "partyType"          TEXT NOT NULL,
  "needs"              TEXT NOT NULL,
  "expectations"       TEXT NOT NULL,
  "consultationMethod" TEXT,
  "reviewedAt"         TIMESTAMPTZ,
  "createdAt"          TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"          TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "IsoInterestedParty_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "IsoInterestedParty_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "IsoInterestedParty_tenantId_idx" ON "IsoInterestedParty"("tenantId");

CREATE TABLE IF NOT EXISTS "IsoScope" (
  "id"           TEXT NOT NULL,
  "tenantId"     TEXT NOT NULL,
  "ohAndSScope"  TEXT NOT NULL,
  "qualityScope" TEXT,
  "inclusions"   TEXT,
  "exclusions"   TEXT,
  "sites"        TEXT,
  "approvedAt"   TIMESTAMPTZ,
  "approvedById" TEXT,
  "createdAt"    TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "IsoScope_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "IsoScope_tenantId_key" UNIQUE ("tenantId"),
  CONSTRAINT "IsoScope_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "IsoLegalRequirement" (
  "id"                   TEXT NOT NULL,
  "tenantId"             TEXT NOT NULL,
  "title"                TEXT NOT NULL,
  "source"               TEXT NOT NULL,
  "reference"            TEXT,
  "appliesBecause"       TEXT,
  "ownerId"              TEXT,
  "nextEvaluationDate"   TIMESTAMPTZ,
  "lastEvaluationDate"   TIMESTAMPTZ,
  "lastEvaluationResult" TEXT,
  "lastEvaluationNotes"  TEXT,
  "createdAt"            TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"            TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "IsoLegalRequirement_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "IsoLegalRequirement_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "IsoLegalRequirement_tenantId_idx" ON "IsoLegalRequirement"("tenantId");
CREATE INDEX IF NOT EXISTS "IsoLegalRequirement_nextEvaluationDate_idx" ON "IsoLegalRequirement"("nextEvaluationDate");

CREATE TABLE IF NOT EXISTS "IsoChange" (
  "id"             TEXT NOT NULL,
  "tenantId"       TEXT NOT NULL,
  "title"          TEXT NOT NULL,
  "description"    TEXT NOT NULL,
  "changeType"     TEXT NOT NULL,
  "status"         TEXT NOT NULL DEFAULT 'PROPOSED',
  "riskImpact"     TEXT,
  "trainingImpact" TEXT,
  "documentImpact" TEXT,
  "approvedById"   TEXT,
  "approvedAt"     TIMESTAMPTZ,
  "implementedAt"  TIMESTAMPTZ,
  "createdById"    TEXT,
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "IsoChange_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "IsoChange_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "IsoChange_tenantId_idx" ON "IsoChange"("tenantId");
CREATE INDEX IF NOT EXISTS "IsoChange_status_idx" ON "IsoChange"("status");

ALTER TABLE "IsoContextIssue" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "IsoInterestedParty" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "IsoScope" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "IsoLegalRequirement" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "IsoChange" ENABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE "IsoContextIssue" TO service_role;
GRANT ALL ON TABLE "IsoInterestedParty" TO service_role;
GRANT ALL ON TABLE "IsoScope" TO service_role;
GRANT ALL ON TABLE "IsoLegalRequirement" TO service_role;
GRANT ALL ON TABLE "IsoChange" TO service_role;
