-- Fire Risk Assessment module
-- Legal basis: Regulatory Reform (Fire Safety) Order 2005, Article 9

CREATE TYPE "FireRiskAssessmentStatus" AS ENUM (
  'DRAFT',
  'IN_PROGRESS',
  'COMPLETED',
  'REVIEW_DUE',
  'ARCHIVED'
);

CREATE TABLE "FireRiskAssessment" (
  "id"                    TEXT NOT NULL,
  "tenantId"              TEXT NOT NULL,
  "title"                 TEXT NOT NULL,
  "buildingName"          TEXT NOT NULL,
  "buildingAddress"       TEXT,
  "assessedById"          TEXT,
  "assessedAt"            TIMESTAMPTZ,
  "reviewDate"            TIMESTAMPTZ,
  "status"                "FireRiskAssessmentStatus" NOT NULL DEFAULT 'DRAFT',

  "ignitionSources"       TEXT,
  "fuelSources"           TEXT,
  "oxygenSources"         TEXT,

  "peopleAtRisk"          TEXT,
  "maxOccupancy"          INTEGER,

  "fireDetection"         TEXT,
  "fireAlarmSystem"       TEXT,
  "emergencyLighting"     TEXT,
  "fireExtinguishers"     TEXT,
  "escapeRoutes"          TEXT,
  "signage"               TEXT,

  "likelihoodOfFire"      INTEGER,
  "consequenceSeverity"   INTEGER,
  "overallRiskLevel"      TEXT,

  "additionalMeasures"    TEXT,

  "createdAt"             TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"             TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "FireRiskAssessment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "FireRiskAssessment_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE
);

CREATE INDEX "FireRiskAssessment_tenantId_idx" ON "FireRiskAssessment"("tenantId");
CREATE INDEX "FireRiskAssessment_status_idx"   ON "FireRiskAssessment"("status");
