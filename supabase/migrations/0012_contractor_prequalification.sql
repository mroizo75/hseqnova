-- Contractor pre-qualification
-- CDM 2015: duty holders must assess competence of contractors
-- MHSWR 1999 reg.7: appointment of competent persons
-- Employers' Liability (Compulsory Insurance) Act 1969

CREATE TYPE "PreQualStatus" AS ENUM (
  'PENDING',
  'APPROVED',
  'CONDITIONALLY_APPROVED',
  'REJECTED',
  'EXPIRED'
);

CREATE TABLE "ContractorRegistration" (
  "id"                             TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "tenantId"                       TEXT NOT NULL,
  "companyName"                    TEXT NOT NULL,
  "companyNumber"                  TEXT,
  "contactName"                    TEXT NOT NULL,
  "contactEmail"                   TEXT NOT NULL,
  "contactPhone"                   TEXT,
  "address"                        TEXT,
  "tradeCategory"                  TEXT,

  -- Insurance — Employers' Liability (Compulsory Insurance) Act 1969
  "hasPublicLiabilityInsurance"    BOOLEAN,
  "publicLiabilityAmount"          TEXT,
  "publicLiabilityExpiry"          TIMESTAMPTZ,
  "hasEmployersLiabilityInsurance" BOOLEAN,
  "employersLiabilityAmount"       TEXT,
  "employersLiabilityExpiry"       TIMESTAMPTZ,

  -- H&S competence — CDM 2015, MHSWR 1999 reg.7
  "hasHealthSafetyPolicy"          BOOLEAN,
  "healthSafetyPolicyFile"         TEXT,
  "hasRiskAssessments"             BOOLEAN,
  "hasMethodStatements"            BOOLEAN,

  -- Accreditations — SSIP members (CHAS, SafeContractor, Constructionline)
  "safetyAccreditations"           TEXT,

  -- Enforcement history
  "previousEnforcementAction"      BOOLEAN,
  "enforcementDetails"             TEXT,

  -- Pre-qualification decision
  "preQualificationStatus"         "PreQualStatus" NOT NULL DEFAULT 'PENDING',
  "preQualificationNotes"          TEXT,
  "preQualifiedById"               TEXT,
  "preQualifiedAt"                 TIMESTAMPTZ,

  "createdAt"                      TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"                      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "ContractorRegistration_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ContractorRegistration_tenantId_idx"
  ON "ContractorRegistration" ("tenantId");

CREATE INDEX "ContractorRegistration_preQualificationStatus_idx"
  ON "ContractorRegistration" ("preQualificationStatus");

CREATE INDEX "ContractorRegistration_tenantId_preQualificationStatus_idx"
  ON "ContractorRegistration" ("tenantId", "preQualificationStatus");

-- RLS
ALTER TABLE "ContractorRegistration" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation" ON "ContractorRegistration"
  FOR ALL
  USING (auth.jwt() ->> 'tenantId' = "tenantId")
  WITH CHECK (auth.jwt() ->> 'tenantId' = "tenantId");
