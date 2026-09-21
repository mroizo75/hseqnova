-- Enterprise / Group / Portfolio layer
-- Relationship model: tenants stay independent. Apply in the Supabase SQL editor.
-- Do not prisma db push.

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastEnterpriseId" TEXT;

DO $$ BEGIN
  CREATE TYPE "EnterpriseOrgType" AS ENUM (
    'INSURER', 'BROKER', 'MGA', 'CORPORATE_GROUP', 'FRANCHISE',
    'CONTRACTOR_NETWORK', 'TRADE_ASSOCIATION', 'OTHER'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "EnterpriseOrgStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'ARCHIVED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "EnterpriseRole" AS ENUM (
    'OWNER', 'ADMIN', 'PORTFOLIO_MANAGER', 'HSEQ_MANAGER',
    'RISK_MANAGER', 'ADVISOR', 'AUDITOR', 'READ_ONLY'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "EnterpriseRelationshipType" AS ENUM (
    'GROUP_SUBSIDIARY', 'INSURED', 'CONTRACTOR', 'FRANCHISEE',
    'MEMBER', 'SUPPLY_CHAIN', 'OTHER'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "EnterpriseMembershipStatus" AS ENUM (
    'INVITED', 'PENDING', 'ACTIVE', 'SUSPENDED', 'DECLINED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "EnterpriseVisibilityLevel" AS ENUM (
    'NONE', 'STATUS', 'AGGREGATED', 'SHARED_EVIDENCE', 'FULL'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "EnterpriseDomainKey" AS ENUM (
    'RISKS', 'RAMS', 'COSHH', 'INCIDENTS', 'INCIDENT_STATS', 'ACTIONS',
    'TRAINING', 'INSPECTIONS', 'AUDITS', 'ISO_45001', 'ISO_9001',
    'MANAGEMENT_REVIEW', 'DOCUMENTS', 'ACTIVITY'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "EnterpriseAssuranceBand" AS ENUM ('GREEN', 'AMBER', 'RED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "EnterpriseTrend" AS ENUM ('IMPROVING', 'STABLE', 'DETERIORATING');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "EnterpriseAlertSeverity" AS ENUM ('INFO', 'WARNING', 'CRITICAL');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "EnterpriseAdvisorScope" AS ENUM ('ENTERPRISE', 'PORTFOLIO', 'MEMBERSHIP');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "EnterpriseInviteStatus" AS ENUM (
    'INVITED', 'ACCEPTED', 'DECLINED', 'ACTIVE', 'EXPIRED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "EnterpriseImportStatus" AS ENUM (
    'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "EnterpriseImprovementStatus" AS ENUM (
    'REQUESTED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'DECLINED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "EnterpriseOrganisation" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "type" "EnterpriseOrgType" NOT NULL DEFAULT 'OTHER',
  "status" "EnterpriseOrgStatus" NOT NULL DEFAULT 'ACTIVE',
  "homeTenantId" TEXT,
  "logoUrl" TEXT,
  "programmeName" TEXT,
  "welcomeText" TEXT,
  "primaryColour" TEXT,
  "onboardingMessage" TEXT,
  "showPoweredBy" BOOLEAN NOT NULL DEFAULT true,
  "analyticsEnabled" BOOLEAN NOT NULL DEFAULT false,
  "benchmarkEnabled" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "EnterpriseOrganisation_homeTenantId_fkey"
    FOREIGN KEY ("homeTenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "EnterpriseOrganisation_status_idx" ON "EnterpriseOrganisation"("status");
CREATE INDEX IF NOT EXISTS "EnterpriseOrganisation_type_idx" ON "EnterpriseOrganisation"("type");
CREATE INDEX IF NOT EXISTS "EnterpriseOrganisation_homeTenantId_idx" ON "EnterpriseOrganisation"("homeTenantId");

CREATE TABLE IF NOT EXISTS "EnterpriseStandard" (
  "id" TEXT PRIMARY KEY,
  "enterpriseId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "EnterpriseStandard_enterpriseId_fkey"
    FOREIGN KEY ("enterpriseId") REFERENCES "EnterpriseOrganisation"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "EnterpriseStandard_enterpriseId_idx" ON "EnterpriseStandard"("enterpriseId");

CREATE TABLE IF NOT EXISTS "EnterpriseStandardRequirement" (
  "id" TEXT PRIMARY KEY,
  "standardId" TEXT NOT NULL,
  "domainKey" "EnterpriseDomainKey" NOT NULL,
  "ruleKey" TEXT NOT NULL,
  "threshold" INTEGER,
  "label" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "EnterpriseStandardRequirement_standardId_fkey"
    FOREIGN KEY ("standardId") REFERENCES "EnterpriseStandard"("id") ON DELETE CASCADE,
  CONSTRAINT "EnterpriseStandardRequirement_standardId_ruleKey_key"
    UNIQUE ("standardId", "ruleKey")
);

CREATE INDEX IF NOT EXISTS "EnterpriseStandardRequirement_standardId_idx"
  ON "EnterpriseStandardRequirement"("standardId");

CREATE TABLE IF NOT EXISTS "EnterprisePortfolio" (
  "id" TEXT PRIMARY KEY,
  "enterpriseId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "sector" TEXT,
  "region" TEXT,
  "standardId" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "EnterprisePortfolio_enterpriseId_fkey"
    FOREIGN KEY ("enterpriseId") REFERENCES "EnterpriseOrganisation"("id") ON DELETE CASCADE,
  CONSTRAINT "EnterprisePortfolio_standardId_fkey"
    FOREIGN KEY ("standardId") REFERENCES "EnterpriseStandard"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "EnterprisePortfolio_enterpriseId_idx" ON "EnterprisePortfolio"("enterpriseId");
CREATE INDEX IF NOT EXISTS "EnterprisePortfolio_standardId_idx" ON "EnterprisePortfolio"("standardId");

CREATE TABLE IF NOT EXISTS "EnterpriseUser" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "enterpriseId" TEXT NOT NULL,
  "role" "EnterpriseRole" NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "EnterpriseUser_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  CONSTRAINT "EnterpriseUser_enterpriseId_fkey"
    FOREIGN KEY ("enterpriseId") REFERENCES "EnterpriseOrganisation"("id") ON DELETE CASCADE,
  CONSTRAINT "EnterpriseUser_userId_enterpriseId_key" UNIQUE ("userId", "enterpriseId")
);

CREATE INDEX IF NOT EXISTS "EnterpriseUser_userId_idx" ON "EnterpriseUser"("userId");
CREATE INDEX IF NOT EXISTS "EnterpriseUser_enterpriseId_idx" ON "EnterpriseUser"("enterpriseId");

CREATE TABLE IF NOT EXISTS "EnterpriseUserPortfolio" (
  "id" TEXT PRIMARY KEY,
  "enterpriseUserId" TEXT NOT NULL,
  "portfolioId" TEXT NOT NULL,
  CONSTRAINT "EnterpriseUserPortfolio_enterpriseUserId_fkey"
    FOREIGN KEY ("enterpriseUserId") REFERENCES "EnterpriseUser"("id") ON DELETE CASCADE,
  CONSTRAINT "EnterpriseUserPortfolio_portfolioId_fkey"
    FOREIGN KEY ("portfolioId") REFERENCES "EnterprisePortfolio"("id") ON DELETE CASCADE,
  CONSTRAINT "EnterpriseUserPortfolio_user_portfolio_key" UNIQUE ("enterpriseUserId", "portfolioId")
);

CREATE INDEX IF NOT EXISTS "EnterpriseUserPortfolio_portfolioId_idx" ON "EnterpriseUserPortfolio"("portfolioId");

CREATE TABLE IF NOT EXISTS "EnterpriseMembership" (
  "id" TEXT PRIMARY KEY,
  "portfolioId" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "relationshipType" "EnterpriseRelationshipType" NOT NULL DEFAULT 'OTHER',
  "status" "EnterpriseMembershipStatus" NOT NULL DEFAULT 'PENDING',
  "requiresCompanyConsent" BOOLEAN NOT NULL DEFAULT true,
  "shareLossStatistics" BOOLEAN NOT NULL DEFAULT false,
  "invitedAt" TIMESTAMPTZ,
  "acceptedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "EnterpriseMembership_portfolioId_fkey"
    FOREIGN KEY ("portfolioId") REFERENCES "EnterprisePortfolio"("id") ON DELETE CASCADE,
  CONSTRAINT "EnterpriseMembership_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE,
  CONSTRAINT "EnterpriseMembership_portfolioId_tenantId_key" UNIQUE ("portfolioId", "tenantId")
);

CREATE INDEX IF NOT EXISTS "EnterpriseMembership_tenantId_idx" ON "EnterpriseMembership"("tenantId");
CREATE INDEX IF NOT EXISTS "EnterpriseMembership_portfolioId_status_idx"
  ON "EnterpriseMembership"("portfolioId", "status");

CREATE TABLE IF NOT EXISTS "EnterpriseMembershipAccess" (
  "id" TEXT PRIMARY KEY,
  "membershipId" TEXT NOT NULL,
  "domainKey" "EnterpriseDomainKey" NOT NULL,
  "visibilityLevel" "EnterpriseVisibilityLevel" NOT NULL DEFAULT 'NONE',
  CONSTRAINT "EnterpriseMembershipAccess_membershipId_fkey"
    FOREIGN KEY ("membershipId") REFERENCES "EnterpriseMembership"("id") ON DELETE CASCADE,
  CONSTRAINT "EnterpriseMembershipAccess_membership_domain_key" UNIQUE ("membershipId", "domainKey")
);

CREATE INDEX IF NOT EXISTS "EnterpriseMembershipAccess_membershipId_idx"
  ON "EnterpriseMembershipAccess"("membershipId");

CREATE TABLE IF NOT EXISTS "EnterpriseAssuranceSnapshot" (
  "id" TEXT PRIMARY KEY,
  "membershipId" TEXT NOT NULL,
  "portfolioId" TEXT NOT NULL,
  "enterpriseId" TEXT NOT NULL,
  "standardId" TEXT,
  "overallPercent" INTEGER NOT NULL,
  "overallBand" "EnterpriseAssuranceBand" NOT NULL,
  "domainBands" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "activityAt" TIMESTAMPTZ,
  "trend" "EnterpriseTrend",
  "capturedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "EnterpriseAssuranceSnapshot_membershipId_fkey"
    FOREIGN KEY ("membershipId") REFERENCES "EnterpriseMembership"("id") ON DELETE CASCADE,
  CONSTRAINT "EnterpriseAssuranceSnapshot_portfolioId_fkey"
    FOREIGN KEY ("portfolioId") REFERENCES "EnterprisePortfolio"("id") ON DELETE CASCADE,
  CONSTRAINT "EnterpriseAssuranceSnapshot_enterpriseId_fkey"
    FOREIGN KEY ("enterpriseId") REFERENCES "EnterpriseOrganisation"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "EnterpriseAssuranceSnapshot_membership_captured_idx"
  ON "EnterpriseAssuranceSnapshot"("membershipId", "capturedAt" DESC);
CREATE INDEX IF NOT EXISTS "EnterpriseAssuranceSnapshot_portfolio_captured_idx"
  ON "EnterpriseAssuranceSnapshot"("portfolioId", "capturedAt" DESC);
CREATE INDEX IF NOT EXISTS "EnterpriseAssuranceSnapshot_enterprise_band_idx"
  ON "EnterpriseAssuranceSnapshot"("enterpriseId", "overallBand", "capturedAt" DESC);

CREATE TABLE IF NOT EXISTS "EnterpriseAlert" (
  "id" TEXT PRIMARY KEY,
  "enterpriseId" TEXT NOT NULL,
  "portfolioId" TEXT,
  "membershipId" TEXT,
  "type" TEXT NOT NULL,
  "severity" "EnterpriseAlertSeverity" NOT NULL DEFAULT 'WARNING',
  "title" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "countValue" INTEGER,
  "acknowledgedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "EnterpriseAlert_enterpriseId_fkey"
    FOREIGN KEY ("enterpriseId") REFERENCES "EnterpriseOrganisation"("id") ON DELETE CASCADE,
  CONSTRAINT "EnterpriseAlert_portfolioId_fkey"
    FOREIGN KEY ("portfolioId") REFERENCES "EnterprisePortfolio"("id") ON DELETE SET NULL,
  CONSTRAINT "EnterpriseAlert_membershipId_fkey"
    FOREIGN KEY ("membershipId") REFERENCES "EnterpriseMembership"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "EnterpriseAlert_enterprise_created_idx"
  ON "EnterpriseAlert"("enterpriseId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "EnterpriseAlert_membershipId_idx" ON "EnterpriseAlert"("membershipId");

CREATE TABLE IF NOT EXISTS "EnterpriseEvidenceShare" (
  "id" TEXT PRIMARY KEY,
  "membershipId" TEXT NOT NULL,
  "documentId" TEXT NOT NULL,
  "sharedByUserId" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "EnterpriseEvidenceShare_membershipId_fkey"
    FOREIGN KEY ("membershipId") REFERENCES "EnterpriseMembership"("id") ON DELETE CASCADE,
  CONSTRAINT "EnterpriseEvidenceShare_documentId_fkey"
    FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE,
  CONSTRAINT "EnterpriseEvidenceShare_membership_document_key" UNIQUE ("membershipId", "documentId")
);

CREATE INDEX IF NOT EXISTS "EnterpriseEvidenceShare_membershipId_idx" ON "EnterpriseEvidenceShare"("membershipId");

CREATE TABLE IF NOT EXISTS "EnterpriseImprovementRequest" (
  "id" TEXT PRIMARY KEY,
  "membershipId" TEXT NOT NULL,
  "requestedByUserId" TEXT,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "status" "EnterpriseImprovementStatus" NOT NULL DEFAULT 'REQUESTED',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "EnterpriseImprovementRequest_membershipId_fkey"
    FOREIGN KEY ("membershipId") REFERENCES "EnterpriseMembership"("id") ON DELETE CASCADE,
  CONSTRAINT "EnterpriseImprovementRequest_requestedByUserId_fkey"
    FOREIGN KEY ("requestedByUserId") REFERENCES "User"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "EnterpriseImprovementRequest_membershipId_idx"
  ON "EnterpriseImprovementRequest"("membershipId");

ALTER TABLE "Measure" ADD COLUMN IF NOT EXISTS "enterpriseImprovementRequestId" TEXT;
DO $$ BEGIN
  ALTER TABLE "Measure"
    ADD CONSTRAINT "Measure_enterpriseImprovementRequestId_fkey"
    FOREIGN KEY ("enterpriseImprovementRequestId")
    REFERENCES "EnterpriseImprovementRequest"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
CREATE INDEX IF NOT EXISTS "Measure_enterpriseImprovementRequestId_idx"
  ON "Measure"("enterpriseImprovementRequestId");

CREATE TABLE IF NOT EXISTS "EnterpriseAdvisorAssignment" (
  "id" TEXT PRIMARY KEY,
  "enterpriseId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "scopeType" "EnterpriseAdvisorScope" NOT NULL,
  "scopeId" TEXT NOT NULL,
  "canAssistInWorkspace" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "EnterpriseAdvisorAssignment_enterpriseId_fkey"
    FOREIGN KEY ("enterpriseId") REFERENCES "EnterpriseOrganisation"("id") ON DELETE CASCADE,
  CONSTRAINT "EnterpriseAdvisorAssignment_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "EnterpriseAdvisorAssignment_enterpriseId_idx"
  ON "EnterpriseAdvisorAssignment"("enterpriseId");
CREATE INDEX IF NOT EXISTS "EnterpriseAdvisorAssignment_userId_idx"
  ON "EnterpriseAdvisorAssignment"("userId");
CREATE INDEX IF NOT EXISTS "EnterpriseAdvisorAssignment_scope_idx"
  ON "EnterpriseAdvisorAssignment"("scopeType", "scopeId");

CREATE TABLE IF NOT EXISTS "EnterpriseInvite" (
  "id" TEXT PRIMARY KEY,
  "enterpriseId" TEXT NOT NULL,
  "portfolioId" TEXT NOT NULL,
  "tenantId" TEXT,
  "companyName" TEXT NOT NULL,
  "companyNumber" TEXT,
  "contactEmail" TEXT NOT NULL,
  "token" TEXT NOT NULL UNIQUE,
  "status" "EnterpriseInviteStatus" NOT NULL DEFAULT 'INVITED',
  "relationshipType" "EnterpriseRelationshipType" NOT NULL DEFAULT 'OTHER',
  "createdByUserId" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "respondedAt" TIMESTAMPTZ,
  CONSTRAINT "EnterpriseInvite_enterpriseId_fkey"
    FOREIGN KEY ("enterpriseId") REFERENCES "EnterpriseOrganisation"("id") ON DELETE CASCADE,
  CONSTRAINT "EnterpriseInvite_portfolioId_fkey"
    FOREIGN KEY ("portfolioId") REFERENCES "EnterprisePortfolio"("id") ON DELETE CASCADE,
  CONSTRAINT "EnterpriseInvite_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "EnterpriseInvite_enterpriseId_idx" ON "EnterpriseInvite"("enterpriseId");
CREATE INDEX IF NOT EXISTS "EnterpriseInvite_token_idx" ON "EnterpriseInvite"("token");
CREATE INDEX IF NOT EXISTS "EnterpriseInvite_contactEmail_idx" ON "EnterpriseInvite"("contactEmail");

CREATE TABLE IF NOT EXISTS "EnterpriseImportBatch" (
  "id" TEXT PRIMARY KEY,
  "enterpriseId" TEXT NOT NULL,
  "portfolioId" TEXT,
  "filename" TEXT NOT NULL,
  "status" "EnterpriseImportStatus" NOT NULL DEFAULT 'PENDING',
  "createdByUserId" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "completedAt" TIMESTAMPTZ,
  CONSTRAINT "EnterpriseImportBatch_enterpriseId_fkey"
    FOREIGN KEY ("enterpriseId") REFERENCES "EnterpriseOrganisation"("id") ON DELETE CASCADE,
  CONSTRAINT "EnterpriseImportBatch_portfolioId_fkey"
    FOREIGN KEY ("portfolioId") REFERENCES "EnterprisePortfolio"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "EnterpriseImportBatch_enterpriseId_idx" ON "EnterpriseImportBatch"("enterpriseId");

CREATE TABLE IF NOT EXISTS "EnterpriseImportRow" (
  "id" TEXT PRIMARY KEY,
  "batchId" TEXT NOT NULL,
  "companyName" TEXT NOT NULL,
  "companyNumber" TEXT,
  "email" TEXT,
  "portfolioName" TEXT,
  "status" "EnterpriseInviteStatus" NOT NULL DEFAULT 'INVITED',
  "tenantId" TEXT,
  "error" TEXT,
  CONSTRAINT "EnterpriseImportRow_batchId_fkey"
    FOREIGN KEY ("batchId") REFERENCES "EnterpriseImportBatch"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "EnterpriseImportRow_batchId_idx" ON "EnterpriseImportRow"("batchId");

CREATE TABLE IF NOT EXISTS "EnterpriseStatSnapshot" (
  "id" TEXT PRIMARY KEY,
  "membershipId" TEXT NOT NULL,
  "portfolioId" TEXT NOT NULL,
  "enterpriseId" TEXT NOT NULL,
  "period" TEXT NOT NULL,
  "periodType" TEXT NOT NULL,
  "industry" TEXT,
  "city" TEXT,
  "region" TEXT,
  "sizeBand" TEXT,
  "relationshipType" "EnterpriseRelationshipType" NOT NULL,
  "incidentTotal" INTEGER NOT NULL DEFAULT 0,
  "incidentOpen" INTEGER NOT NULL DEFAULT 0,
  "nearMissCount" INTEGER NOT NULL DEFAULT 0,
  "accidentCount" INTEGER NOT NULL DEFAULT 0,
  "fatalCount" INTEGER NOT NULL DEFAULT 0,
  "lostTimeCount" INTEGER NOT NULL DEFAULT 0,
  "riddorCount" INTEGER NOT NULL DEFAULT 0,
  "firstAidCount" INTEGER NOT NULL DEFAULT 0,
  "specifiedInjuryCount" INTEGER NOT NULL DEFAULT 0,
  "overSevenDayCount" INTEGER NOT NULL DEFAULT 0,
  "lostWorkdays" INTEGER NOT NULL DEFAULT 0,
  "estimatedDamageCost" DOUBLE PRECISION,
  "trir" DOUBLE PRECISION,
  "ltir" DOUBLE PRECISION,
  "avgMttrDays" DOUBLE PRECISION,
  "byType" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "bySeverity" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "capturedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "EnterpriseStatSnapshot_membershipId_fkey"
    FOREIGN KEY ("membershipId") REFERENCES "EnterpriseMembership"("id") ON DELETE CASCADE,
  CONSTRAINT "EnterpriseStatSnapshot_portfolioId_fkey"
    FOREIGN KEY ("portfolioId") REFERENCES "EnterprisePortfolio"("id") ON DELETE CASCADE,
  CONSTRAINT "EnterpriseStatSnapshot_enterpriseId_fkey"
    FOREIGN KEY ("enterpriseId") REFERENCES "EnterpriseOrganisation"("id") ON DELETE CASCADE,
  CONSTRAINT "EnterpriseStatSnapshot_membership_period_key" UNIQUE ("membershipId", "period", "periodType")
);

CREATE INDEX IF NOT EXISTS "EnterpriseStatSnapshot_enterprise_period_idx"
  ON "EnterpriseStatSnapshot"("enterpriseId", "period");
CREATE INDEX IF NOT EXISTS "EnterpriseStatSnapshot_portfolio_period_idx"
  ON "EnterpriseStatSnapshot"("portfolioId", "period");

CREATE TABLE IF NOT EXISTS "EnterpriseStatRollup" (
  "id" TEXT PRIMARY KEY,
  "enterpriseId" TEXT NOT NULL,
  "portfolioId" TEXT,
  "dimension" TEXT NOT NULL,
  "dimensionValue" TEXT NOT NULL,
  "period" TEXT NOT NULL,
  "periodType" TEXT NOT NULL,
  "companyCount" INTEGER NOT NULL DEFAULT 0,
  "incidentTotal" INTEGER NOT NULL DEFAULT 0,
  "nearMissCount" INTEGER NOT NULL DEFAULT 0,
  "accidentCount" INTEGER NOT NULL DEFAULT 0,
  "fatalCount" INTEGER NOT NULL DEFAULT 0,
  "lostTimeCount" INTEGER NOT NULL DEFAULT 0,
  "riddorCount" INTEGER NOT NULL DEFAULT 0,
  "avgTrir" DOUBLE PRECISION,
  "avgLtir" DOUBLE PRECISION,
  "metrics" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "capturedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "EnterpriseStatRollup_enterpriseId_fkey"
    FOREIGN KEY ("enterpriseId") REFERENCES "EnterpriseOrganisation"("id") ON DELETE CASCADE,
  CONSTRAINT "EnterpriseStatRollup_portfolioId_fkey"
    FOREIGN KEY ("portfolioId") REFERENCES "EnterprisePortfolio"("id") ON DELETE CASCADE,
  CONSTRAINT "EnterpriseStatRollup_unique" UNIQUE (
    "enterpriseId", "portfolioId", "dimension", "dimensionValue", "period", "periodType"
  )
);

CREATE INDEX IF NOT EXISTS "EnterpriseStatRollup_enterprise_dimension_period_idx"
  ON "EnterpriseStatRollup"("enterpriseId", "dimension", "period");

-- RLS: current_enterprise_ids() mirrors current_tenant_ids()
CREATE OR REPLACE FUNCTION public.current_enterprise_ids()
RETURNS SETOF TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT eu."enterpriseId"
  FROM public."EnterpriseUser" eu
  JOIN public."User" u ON u.id = eu."userId"
  WHERE u.id::text = auth.uid()::text OR u."supabaseUserId"::text = auth.uid()::text;
$$;

CREATE OR REPLACE FUNCTION public.enterprise_portfolio_ids()
RETURNS SETOF TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id
  FROM public."EnterprisePortfolio" p
  WHERE p."enterpriseId" IN (SELECT public.current_enterprise_ids());
$$;

ALTER TABLE public."EnterpriseOrganisation" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS enterprise_org_member_select ON public."EnterpriseOrganisation";
CREATE POLICY enterprise_org_member_select ON public."EnterpriseOrganisation"
  FOR SELECT
  USING (id IN (SELECT public.current_enterprise_ids()) OR public.is_super_admin());

ALTER TABLE public."EnterpriseUser" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS enterprise_user_select ON public."EnterpriseUser";
CREATE POLICY enterprise_user_select ON public."EnterpriseUser"
  FOR SELECT
  USING ("enterpriseId" IN (SELECT public.current_enterprise_ids()) OR public.is_super_admin());

ALTER TABLE public."EnterprisePortfolio" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS enterprise_portfolio_select ON public."EnterprisePortfolio";
CREATE POLICY enterprise_portfolio_select ON public."EnterprisePortfolio"
  FOR SELECT
  USING ("enterpriseId" IN (SELECT public.current_enterprise_ids()) OR public.is_super_admin());

ALTER TABLE public."EnterpriseUserPortfolio" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS enterprise_user_portfolio_select ON public."EnterpriseUserPortfolio";
CREATE POLICY enterprise_user_portfolio_select ON public."EnterpriseUserPortfolio"
  FOR SELECT
  USING (
    "portfolioId" IN (SELECT public.enterprise_portfolio_ids())
    OR public.is_super_admin()
  );

ALTER TABLE public."EnterpriseStandard" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS enterprise_standard_select ON public."EnterpriseStandard";
CREATE POLICY enterprise_standard_select ON public."EnterpriseStandard"
  FOR SELECT
  USING ("enterpriseId" IN (SELECT public.current_enterprise_ids()) OR public.is_super_admin());

ALTER TABLE public."EnterpriseStandardRequirement" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS enterprise_standard_req_select ON public."EnterpriseStandardRequirement";
CREATE POLICY enterprise_standard_req_select ON public."EnterpriseStandardRequirement"
  FOR SELECT
  USING (
    "standardId" IN (
      SELECT id FROM public."EnterpriseStandard"
      WHERE "enterpriseId" IN (SELECT public.current_enterprise_ids())
    )
    OR public.is_super_admin()
  );

ALTER TABLE public."EnterpriseMembership" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS enterprise_membership_select ON public."EnterpriseMembership";
CREATE POLICY enterprise_membership_select ON public."EnterpriseMembership"
  FOR SELECT
  USING (
    "tenantId" IN (SELECT public.current_tenant_ids())
    OR "portfolioId" IN (SELECT public.enterprise_portfolio_ids())
    OR public.is_super_admin()
  );

ALTER TABLE public."EnterpriseMembershipAccess" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS enterprise_membership_access_select ON public."EnterpriseMembershipAccess";
CREATE POLICY enterprise_membership_access_select ON public."EnterpriseMembershipAccess"
  FOR SELECT
  USING (
    "membershipId" IN (SELECT id FROM public."EnterpriseMembership")
    OR public.is_super_admin()
  );

ALTER TABLE public."EnterpriseAssuranceSnapshot" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS enterprise_assurance_select ON public."EnterpriseAssuranceSnapshot";
CREATE POLICY enterprise_assurance_select ON public."EnterpriseAssuranceSnapshot"
  FOR SELECT
  USING (
    "enterpriseId" IN (SELECT public.current_enterprise_ids())
    OR public.is_super_admin()
  );

ALTER TABLE public."EnterpriseAlert" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS enterprise_alert_select ON public."EnterpriseAlert";
CREATE POLICY enterprise_alert_select ON public."EnterpriseAlert"
  FOR SELECT
  USING (
    "enterpriseId" IN (SELECT public.current_enterprise_ids())
    OR public.is_super_admin()
  );

ALTER TABLE public."EnterpriseEvidenceShare" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS enterprise_evidence_select ON public."EnterpriseEvidenceShare";
CREATE POLICY enterprise_evidence_select ON public."EnterpriseEvidenceShare"
  FOR SELECT
  USING (
    "membershipId" IN (SELECT id FROM public."EnterpriseMembership")
    OR public.is_super_admin()
  );

ALTER TABLE public."EnterpriseImprovementRequest" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS enterprise_improvement_select ON public."EnterpriseImprovementRequest";
CREATE POLICY enterprise_improvement_select ON public."EnterpriseImprovementRequest"
  FOR SELECT
  USING (
    "membershipId" IN (SELECT id FROM public."EnterpriseMembership")
    OR public.is_super_admin()
  );

ALTER TABLE public."EnterpriseAdvisorAssignment" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS enterprise_advisor_select ON public."EnterpriseAdvisorAssignment";
CREATE POLICY enterprise_advisor_select ON public."EnterpriseAdvisorAssignment"
  FOR SELECT
  USING (
    "enterpriseId" IN (SELECT public.current_enterprise_ids())
    OR public.is_super_admin()
  );

ALTER TABLE public."EnterpriseInvite" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS enterprise_invite_select ON public."EnterpriseInvite";
CREATE POLICY enterprise_invite_select ON public."EnterpriseInvite"
  FOR SELECT
  USING (
    "enterpriseId" IN (SELECT public.current_enterprise_ids())
    OR public.is_super_admin()
  );

ALTER TABLE public."EnterpriseImportBatch" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS enterprise_import_batch_select ON public."EnterpriseImportBatch";
CREATE POLICY enterprise_import_batch_select ON public."EnterpriseImportBatch"
  FOR SELECT
  USING (
    "enterpriseId" IN (SELECT public.current_enterprise_ids())
    OR public.is_super_admin()
  );

ALTER TABLE public."EnterpriseImportRow" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS enterprise_import_row_select ON public."EnterpriseImportRow";
CREATE POLICY enterprise_import_row_select ON public."EnterpriseImportRow"
  FOR SELECT
  USING (
    "batchId" IN (SELECT id FROM public."EnterpriseImportBatch")
    OR public.is_super_admin()
  );

ALTER TABLE public."EnterpriseStatSnapshot" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS enterprise_stat_snapshot_select ON public."EnterpriseStatSnapshot";
CREATE POLICY enterprise_stat_snapshot_select ON public."EnterpriseStatSnapshot"
  FOR SELECT
  USING (
    "enterpriseId" IN (SELECT public.current_enterprise_ids())
    OR public.is_super_admin()
  );

ALTER TABLE public."EnterpriseStatRollup" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS enterprise_stat_rollup_select ON public."EnterpriseStatRollup";
CREATE POLICY enterprise_stat_rollup_select ON public."EnterpriseStatRollup"
  FOR SELECT
  USING (
    "enterpriseId" IN (SELECT public.current_enterprise_ids())
    OR public.is_super_admin()
  );
