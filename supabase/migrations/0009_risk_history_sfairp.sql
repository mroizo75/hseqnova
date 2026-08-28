-- 0009_risk_history_sfairp.sql
-- Risk version history tracking + SFAIRP control hierarchy
-- Legal basis: HSWA s.2, MHSWR reg.4 (general principles of prevention)

-- 1. Add SFAIRP values to RiskControlType enum (keep legacy values)
ALTER TYPE "RiskControlType" ADD VALUE IF NOT EXISTS 'ELIMINATION';
ALTER TYPE "RiskControlType" ADD VALUE IF NOT EXISTS 'SUBSTITUTION';
ALTER TYPE "RiskControlType" ADD VALUE IF NOT EXISTS 'ENGINEERING';
ALTER TYPE "RiskControlType" ADD VALUE IF NOT EXISTS 'ADMINISTRATIVE';
ALTER TYPE "RiskControlType" ADD VALUE IF NOT EXISTS 'PPE';

-- 2. Create RiskHistory table
CREATE TABLE IF NOT EXISTS "RiskHistory" (
    "id"              TEXT NOT NULL,
    "tenantId"        TEXT NOT NULL,
    "riskId"          TEXT NOT NULL,
    "changeType"      TEXT NOT NULL,
    "previousScore"   INTEGER,
    "newScore"        INTEGER,
    "changedFields"   TEXT,
    "changedById"     TEXT,
    "changeNote"      TEXT,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiskHistory_pkey" PRIMARY KEY ("id")
);

-- 3. Foreign keys
ALTER TABLE "RiskHistory"
    ADD CONSTRAINT "RiskHistory_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RiskHistory"
    ADD CONSTRAINT "RiskHistory_riskId_fkey"
    FOREIGN KEY ("riskId") REFERENCES "Risk"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- 4. Indexes
CREATE INDEX IF NOT EXISTS "RiskHistory_tenantId_idx" ON "RiskHistory"("tenantId");
CREATE INDEX IF NOT EXISTS "RiskHistory_riskId_idx" ON "RiskHistory"("riskId");
CREATE INDEX IF NOT EXISTS "RiskHistory_createdAt_idx" ON "RiskHistory"("createdAt");
