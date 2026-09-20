-- ISO certification readiness: versioned requirements, gap assessments,
-- audit sample links, external competent person flag, org-chart member link.
-- Apply in the Supabase SQL editor. Do not prisma db push.

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "canBeExternalCompetentPerson" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "OrgChartNode"
  ADD COLUMN IF NOT EXISTS "userId" TEXT;

CREATE INDEX IF NOT EXISTS "OrgChartNode_userId_idx" ON "OrgChartNode"("userId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'OrgChartNode_userId_fkey'
  ) THEN
    ALTER TABLE "OrgChartNode"
      ADD CONSTRAINT "OrgChartNode_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "IsoStandardVersion" (
  "id"          TEXT NOT NULL,
  "standard"    TEXT NOT NULL,
  "edition"     TEXT NOT NULL,
  "status"      TEXT NOT NULL DEFAULT 'PUBLISHED',
  "publishedAt" TIMESTAMPTZ,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "IsoStandardVersion_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "IsoStandardVersion_standard_edition_key" UNIQUE ("standard", "edition")
);

INSERT INTO "IsoStandardVersion" ("id", "standard", "edition", "status", "publishedAt", "createdAt", "updatedAt")
VALUES
  ('iso-45001-2018', 'ISO_45001', '2018', 'PUBLISHED', '2018-03-12T00:00:00Z', now(), now()),
  ('iso-9001-2015', 'ISO_9001', '2015', 'PUBLISHED', '2015-09-15T00:00:00Z', now(), now())
ON CONFLICT ("id") DO NOTHING;

CREATE TABLE IF NOT EXISTS "IsoRequirement" (
  "id"              TEXT NOT NULL,
  "versionId"       TEXT NOT NULL,
  "clauseKey"       TEXT NOT NULL,
  "clause"          TEXT NOT NULL,
  "title"           TEXT NOT NULL,
  "shallParaphrase" TEXT NOT NULL,
  "phase"           TEXT NOT NULL,
  "evidenceKey"     TEXT NOT NULL,
  "doThis"          TEXT NOT NULL,
  "auditorHint"     TEXT NOT NULL,
  "href"            TEXT NOT NULL,
  "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "IsoRequirement_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "IsoRequirement_versionId_fkey"
    FOREIGN KEY ("versionId") REFERENCES "IsoStandardVersion"("id") ON DELETE CASCADE,
  CONSTRAINT "IsoRequirement_versionId_clauseKey_key" UNIQUE ("versionId", "clauseKey")
);

CREATE INDEX IF NOT EXISTS "IsoRequirement_versionId_idx" ON "IsoRequirement"("versionId");
CREATE INDEX IF NOT EXISTS "IsoRequirement_clauseKey_idx" ON "IsoRequirement"("clauseKey");

ALTER TABLE "Tenant"
  ADD COLUMN IF NOT EXISTS "iso45001VersionId" TEXT,
  ADD COLUMN IF NOT EXISTS "iso9001VersionId" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Tenant_iso45001VersionId_fkey'
  ) THEN
    ALTER TABLE "Tenant"
      ADD CONSTRAINT "Tenant_iso45001VersionId_fkey"
      FOREIGN KEY ("iso45001VersionId") REFERENCES "IsoStandardVersion"("id") ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Tenant_iso9001VersionId_fkey'
  ) THEN
    ALTER TABLE "Tenant"
      ADD CONSTRAINT "Tenant_iso9001VersionId_fkey"
      FOREIGN KEY ("iso9001VersionId") REFERENCES "IsoStandardVersion"("id") ON DELETE SET NULL;
  END IF;
END $$;

UPDATE "Tenant"
SET
  "iso45001VersionId" = COALESCE("iso45001VersionId", 'iso-45001-2018'),
  "iso9001VersionId" = COALESCE("iso9001VersionId", 'iso-9001-2015')
WHERE "deletedAt" IS NULL;

CREATE TABLE IF NOT EXISTS "IsoClauseAssessment" (
  "id"                 TEXT NOT NULL,
  "tenantId"           TEXT NOT NULL,
  "requirementId"      TEXT NOT NULL,
  "assessedLevel"      TEXT,
  "responsibleUserId"  TEXT,
  "lastReviewedAt"     TIMESTAMPTZ,
  "nextReviewAt"       TIMESTAMPTZ,
  "notes"              TEXT,
  "measureId"          TEXT,
  "createdAt"          TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"          TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "IsoClauseAssessment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "IsoClauseAssessment_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE,
  CONSTRAINT "IsoClauseAssessment_requirementId_fkey"
    FOREIGN KEY ("requirementId") REFERENCES "IsoRequirement"("id") ON DELETE CASCADE,
  CONSTRAINT "IsoClauseAssessment_tenantId_requirementId_key" UNIQUE ("tenantId", "requirementId")
);

CREATE INDEX IF NOT EXISTS "IsoClauseAssessment_tenantId_idx" ON "IsoClauseAssessment"("tenantId");
CREATE INDEX IF NOT EXISTS "IsoClauseAssessment_responsibleUserId_idx" ON "IsoClauseAssessment"("responsibleUserId");

ALTER TABLE "AuditFinding"
  ADD COLUMN IF NOT EXISTS "incidentId" TEXT,
  ADD COLUMN IF NOT EXISTS "riskId" TEXT,
  ADD COLUMN IF NOT EXISTS "trainingId" TEXT;

CREATE INDEX IF NOT EXISTS "AuditFinding_incidentId_idx" ON "AuditFinding"("incidentId");
CREATE INDEX IF NOT EXISTS "AuditFinding_riskId_idx" ON "AuditFinding"("riskId");
CREATE INDEX IF NOT EXISTS "AuditFinding_trainingId_idx" ON "AuditFinding"("trainingId");

ALTER TABLE "IsoStandardVersion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "IsoRequirement" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "IsoClauseAssessment" ENABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE "IsoStandardVersion" TO service_role;
GRANT ALL ON TABLE "IsoRequirement" TO service_role;
GRANT ALL ON TABLE "IsoClauseAssessment" TO service_role;
