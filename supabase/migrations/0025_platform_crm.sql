-- Platform CRM + sales roles
-- Superadmin sees everything. Sales manager sees all CRM. Sales sees assigned records only.

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isSales" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isSalesManager" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "User_isSales_idx" ON "User"("isSales");
CREATE INDEX IF NOT EXISTS "User_isSalesManager_idx" ON "User"("isSalesManager");

DO $$ BEGIN
  CREATE TYPE "CrmSource" AS ENUM ('WEBSITE', 'MANUAL', 'PACKAGE', 'REFERRAL', 'OTHER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "CrmDealStage" AS ENUM ('NEW', 'QUALIFIED', 'DEMO', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "CrmActivityType" AS ENUM ('CONTACT', 'FOLLOW_UP', 'OFFER_SENT', 'MEETING', 'NOTE', 'OTHER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "CrmActivityChannel" AS ENUM ('PHONE', 'EMAIL', 'MEETING', 'OTHER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "CrmTaskStatus" AS ENUM ('OPEN', 'DONE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "CrmOrganisation" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "companyNumber" TEXT,
  "industry" TEXT,
  "employeeCount" INTEGER,
  "website" TEXT,
  "address" TEXT,
  "city" TEXT,
  "postalCode" TEXT,
  "notes" TEXT,
  "tenantId" TEXT,
  "ownerId" TEXT,
  "source" "CrmSource" NOT NULL DEFAULT 'MANUAL',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "CrmOrganisation_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL,
  CONSTRAINT "CrmOrganisation_ownerId_fkey"
    FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "CrmOrganisation_tenantId_key"
  ON "CrmOrganisation"("tenantId") WHERE "tenantId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "CrmOrganisation_ownerId_idx" ON "CrmOrganisation"("ownerId");
CREATE INDEX IF NOT EXISTS "CrmOrganisation_name_idx" ON "CrmOrganisation"("name");

CREATE TABLE IF NOT EXISTS "CrmContact" (
  "id" TEXT PRIMARY KEY,
  "organisationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "jobTitle" TEXT,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "CrmContact_organisationId_fkey"
    FOREIGN KEY ("organisationId") REFERENCES "CrmOrganisation"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "CrmContact_organisationId_idx" ON "CrmContact"("organisationId");
CREATE INDEX IF NOT EXISTS "CrmContact_email_idx" ON "CrmContact"("email");

CREATE TABLE IF NOT EXISTS "CrmDeal" (
  "id" TEXT PRIMARY KEY,
  "organisationId" TEXT NOT NULL,
  "ownerId" TEXT,
  "title" TEXT NOT NULL,
  "valueGbp" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "currency" TEXT NOT NULL DEFAULT 'GBP',
  "stage" "CrmDealStage" NOT NULL DEFAULT 'NEW',
  "expectedCloseAt" TIMESTAMPTZ,
  "lostReason" TEXT,
  "tenantOfferId" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "CrmDeal_organisationId_fkey"
    FOREIGN KEY ("organisationId") REFERENCES "CrmOrganisation"("id") ON DELETE CASCADE,
  CONSTRAINT "CrmDeal_ownerId_fkey"
    FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL,
  CONSTRAINT "CrmDeal_tenantOfferId_fkey"
    FOREIGN KEY ("tenantOfferId") REFERENCES "TenantOffer"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "CrmDeal_organisationId_idx" ON "CrmDeal"("organisationId");
CREATE INDEX IF NOT EXISTS "CrmDeal_ownerId_idx" ON "CrmDeal"("ownerId");
CREATE INDEX IF NOT EXISTS "CrmDeal_stage_idx" ON "CrmDeal"("stage");
CREATE UNIQUE INDEX IF NOT EXISTS "CrmDeal_open_org_idx"
  ON "CrmDeal"("organisationId") WHERE "stage" NOT IN ('WON', 'LOST');

CREATE TABLE IF NOT EXISTS "CrmActivity" (
  "id" TEXT PRIMARY KEY,
  "organisationId" TEXT NOT NULL,
  "dealId" TEXT,
  "type" "CrmActivityType" NOT NULL DEFAULT 'NOTE',
  "channel" "CrmActivityChannel" NOT NULL DEFAULT 'OTHER',
  "note" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "CrmActivity_organisationId_fkey"
    FOREIGN KEY ("organisationId") REFERENCES "CrmOrganisation"("id") ON DELETE CASCADE,
  CONSTRAINT "CrmActivity_dealId_fkey"
    FOREIGN KEY ("dealId") REFERENCES "CrmDeal"("id") ON DELETE SET NULL,
  CONSTRAINT "CrmActivity_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS "CrmActivity_organisationId_idx" ON "CrmActivity"("organisationId", "createdAt");
CREATE INDEX IF NOT EXISTS "CrmActivity_dealId_idx" ON "CrmActivity"("dealId");

CREATE TABLE IF NOT EXISTS "CrmTask" (
  "id" TEXT PRIMARY KEY,
  "organisationId" TEXT NOT NULL,
  "dealId" TEXT,
  "assignedToId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "dueAt" TIMESTAMPTZ,
  "status" "CrmTaskStatus" NOT NULL DEFAULT 'OPEN',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "CrmTask_organisationId_fkey"
    FOREIGN KEY ("organisationId") REFERENCES "CrmOrganisation"("id") ON DELETE CASCADE,
  CONSTRAINT "CrmTask_dealId_fkey"
    FOREIGN KEY ("dealId") REFERENCES "CrmDeal"("id") ON DELETE SET NULL,
  CONSTRAINT "CrmTask_assignedToId_fkey"
    FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS "CrmTask_assignedToId_idx" ON "CrmTask"("assignedToId");
CREATE INDEX IF NOT EXISTS "CrmTask_dueAt_idx" ON "CrmTask"("dueAt");
CREATE INDEX IF NOT EXISTS "CrmTask_status_idx" ON "CrmTask"("status");
CREATE INDEX IF NOT EXISTS "CrmTask_organisationId_idx" ON "CrmTask"("organisationId");

ALTER TABLE "CrmOrganisation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CrmContact" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CrmDeal" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CrmActivity" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CrmTask" ENABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE "CrmOrganisation" TO service_role;
GRANT ALL ON TABLE "CrmContact" TO service_role;
GRANT ALL ON TABLE "CrmDeal" TO service_role;
GRANT ALL ON TABLE "CrmActivity" TO service_role;
GRANT ALL ON TABLE "CrmTask" TO service_role;

-- Backfill organisations from existing tenants
INSERT INTO "CrmOrganisation" (
  "id", "name", "companyNumber", "industry", "employeeCount",
  "address", "city", "postalCode", "notes", "tenantId", "ownerId", "source",
  "createdAt", "updatedAt"
)
SELECT
  'corg' || substr(md5(t."id"), 1, 21),
  t."name",
  COALESCE(t."companyNumber", t."orgNumber"),
  t."industry",
  t."employeeCount",
  t."address",
  t."city",
  t."postalCode",
  t."notes",
  t."id",
  NULL,
  'WEBSITE',
  t."createdAt",
  NOW()
FROM "Tenant" t
WHERE NOT EXISTS (
  SELECT 1 FROM "CrmOrganisation" o WHERE o."tenantId" = t."id"
);

INSERT INTO "CrmContact" (
  "id", "organisationId", "name", "email", "phone", "isPrimary", "createdAt", "updatedAt"
)
SELECT
  'cct' || substr(md5(o."id"), 1, 22),
  o."id",
  COALESCE(NULLIF(t."contactPerson", ''), t."name"),
  t."contactEmail",
  t."contactPhone",
  true,
  o."createdAt",
  NOW()
FROM "CrmOrganisation" o
JOIN "Tenant" t ON t."id" = o."tenantId"
WHERE NOT EXISTS (
  SELECT 1 FROM "CrmContact" c WHERE c."organisationId" = o."id"
)
AND (
  t."contactPerson" IS NOT NULL
  OR t."contactEmail" IS NOT NULL
  OR t."contactPhone" IS NOT NULL
);

INSERT INTO "CrmDeal" (
  "id", "organisationId", "ownerId", "title", "valueGbp", "stage", "createdAt", "updatedAt"
)
SELECT
  'cdeal' || substr(md5(o."id"), 1, 20),
  o."id",
  NULL,
  t."name" || ' — HSEQ Nova',
  0,
  CASE
    WHEN t."status" IN ('CANCELLED', 'SUSPENDED') THEN 'LOST'::"CrmDealStage"
    WHEN t."status" = 'ACTIVE' THEN 'WON'::"CrmDealStage"
    WHEN t."onboardingStatus" IN ('NOT_STARTED', 'IN_PROGRESS', 'ADMIN_CREATED') THEN 'NEW'::"CrmDealStage"
    ELSE 'DEMO'::"CrmDealStage"
  END,
  o."createdAt",
  NOW()
FROM "CrmOrganisation" o
JOIN "Tenant" t ON t."id" = o."tenantId"
WHERE NOT EXISTS (
  SELECT 1 FROM "CrmDeal" d WHERE d."organisationId" = o."id"
);

-- Package waitlist / contact-me leads without a tenant
INSERT INTO "CrmOrganisation" (
  "id", "name", "notes", "ownerId", "source", "createdAt", "updatedAt"
)
SELECT
  'cpkg' || substr(md5(p."id"), 1, 21),
  COALESCE(NULLIF(p."name", ''), split_part(p."email", '@', 1), 'Package lead'),
  'Imported from package waitlist (' || p."type" || ', ' || p."tier" || ')',
  NULL,
  'PACKAGE',
  p."createdAt",
  NOW()
FROM "PackageLead" p
WHERE NOT EXISTS (
  SELECT 1 FROM "CrmOrganisation" o WHERE o."id" = 'cpkg' || substr(md5(p."id"), 1, 21)
);

INSERT INTO "CrmContact" (
  "id", "organisationId", "name", "email", "phone", "isPrimary", "createdAt", "updatedAt"
)
SELECT
  'cpkc' || substr(md5(p."id"), 1, 21),
  'cpkg' || substr(md5(p."id"), 1, 21),
  COALESCE(NULLIF(p."name", ''), split_part(p."email", '@', 1), 'Contact'),
  p."email",
  p."phone",
  true,
  p."createdAt",
  NOW()
FROM "PackageLead" p
WHERE EXISTS (
  SELECT 1 FROM "CrmOrganisation" o WHERE o."id" = 'cpkg' || substr(md5(p."id"), 1, 21)
)
AND NOT EXISTS (
  SELECT 1 FROM "CrmContact" c WHERE c."id" = 'cpkc' || substr(md5(p."id"), 1, 21)
);

INSERT INTO "CrmDeal" (
  "id", "organisationId", "title", "valueGbp", "stage", "createdAt", "updatedAt"
)
SELECT
  'cpkd' || substr(md5(p."id"), 1, 21),
  'cpkg' || substr(md5(p."id"), 1, 21),
  COALESCE(NULLIF(p."name", ''), split_part(p."email", '@', 1), 'Package lead') || ' — package enquiry',
  0,
  'NEW'::"CrmDealStage",
  p."createdAt",
  NOW()
FROM "PackageLead" p
WHERE EXISTS (
  SELECT 1 FROM "CrmOrganisation" o WHERE o."id" = 'cpkg' || substr(md5(p."id"), 1, 21)
)
AND NOT EXISTS (
  SELECT 1 FROM "CrmDeal" d WHERE d."id" = 'cpkd' || substr(md5(p."id"), 1, 21)
);
