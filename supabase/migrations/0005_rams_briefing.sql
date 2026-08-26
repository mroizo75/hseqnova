-- Pre-start briefing drawn from an approved RAMS (MHSWR 1999 reg.13; CDM 2015 reg.15).
CREATE TABLE IF NOT EXISTS "RamsBriefing" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "sjaAnalysisId" TEXT NOT NULL,
  "briefedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "briefedByName" TEXT NOT NULL,
  "workLocation" TEXT NOT NULL,
  "methodSummary" TEXT,
  "hazardsSnapshot" JSONB NOT NULL,
  "notes" TEXT,
  "attendees" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RamsBriefing_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "RamsBriefing_tenantId_idx" ON "RamsBriefing"("tenantId");
CREATE INDEX IF NOT EXISTS "RamsBriefing_sjaAnalysisId_idx" ON "RamsBriefing"("sjaAnalysisId");

ALTER TABLE "RamsBriefing"
  ADD CONSTRAINT "RamsBriefing_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RamsBriefing"
  ADD CONSTRAINT "RamsBriefing_sjaAnalysisId_fkey"
  FOREIGN KEY ("sjaAnalysisId") REFERENCES "SjaAnalysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;
