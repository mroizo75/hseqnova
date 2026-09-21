-- ISO audit-grade IMS: clause-linked controlled documents (7.5),
-- QMS processes (9001 4.4), and justified 8.3 design exclusion (9001 4.3).
-- Apply in the Supabase SQL editor. Do not prisma db push.

ALTER TABLE "IsoScope"
  ADD COLUMN IF NOT EXISTS "excludeDesign" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "excludeDesignJustification" TEXT;

CREATE TABLE IF NOT EXISTS "IsoClauseDocument" (
  "id"            TEXT NOT NULL,
  "tenantId"      TEXT NOT NULL,
  "documentId"    TEXT NOT NULL,
  "requirementId" TEXT NOT NULL,
  "clauseKey"     TEXT NOT NULL,
  "role"          TEXT NOT NULL DEFAULT 'PROCEDURE',
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "IsoClauseDocument_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "IsoClauseDocument_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE,
  CONSTRAINT "IsoClauseDocument_documentId_fkey"
    FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE,
  CONSTRAINT "IsoClauseDocument_requirementId_fkey"
    FOREIGN KEY ("requirementId") REFERENCES "IsoRequirement"("id") ON DELETE CASCADE,
  CONSTRAINT "IsoClauseDocument_tenantId_documentId_requirementId_key"
    UNIQUE ("tenantId", "documentId", "requirementId")
);

CREATE INDEX IF NOT EXISTS "IsoClauseDocument_tenantId_idx" ON "IsoClauseDocument"("tenantId");
CREATE INDEX IF NOT EXISTS "IsoClauseDocument_clauseKey_idx" ON "IsoClauseDocument"("clauseKey");
CREATE INDEX IF NOT EXISTS "IsoClauseDocument_documentId_idx" ON "IsoClauseDocument"("documentId");

CREATE TABLE IF NOT EXISTS "IsoProcess" (
  "id"        TEXT NOT NULL,
  "tenantId"  TEXT NOT NULL,
  "name"      TEXT NOT NULL,
  "purpose"   TEXT NOT NULL,
  "ownerId"   TEXT,
  "inputs"    TEXT,
  "outputs"   TEXT,
  "sequence"  INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "IsoProcess_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "IsoProcess_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "IsoProcess_tenantId_idx" ON "IsoProcess"("tenantId");
CREATE INDEX IF NOT EXISTS "IsoProcess_ownerId_idx" ON "IsoProcess"("ownerId");

ALTER TABLE "IsoClauseDocument" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "IsoProcess" ENABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE "IsoClauseDocument" TO service_role;
GRANT ALL ON TABLE "IsoProcess" TO service_role;
