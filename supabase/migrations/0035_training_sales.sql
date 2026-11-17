-- Commercial workplace training: enquiry, Stripe invoice, competence window, CRM follow-up.
-- Apply in the Supabase SQL editor. Do not prisma db push.

DO $$ BEGIN
  CREATE TYPE "TrainingEngagementStatus" AS ENUM ('ENQUIRY', 'INVOICED', 'PAID', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "PlatformSetting" (
  "key" TEXT PRIMARY KEY,
  "value" TEXT NOT NULL,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO "PlatformSetting" ("key", "value")
VALUES ('training.followUpMonths', '4')
ON CONFLICT ("key") DO NOTHING;

CREATE TABLE IF NOT EXISTS "TrainingEngagement" (
  "id" TEXT PRIMARY KEY,
  "organisationId" TEXT NOT NULL,
  "dealId" TEXT,
  "ownerId" TEXT,
  "courseKey" TEXT NOT NULL,
  "courseTitle" TEXT NOT NULL,
  "delegateCount" INTEGER NOT NULL,
  "preferredDate" DATE,
  "courseDate" DATE,
  "validityMonths" INTEGER NOT NULL,
  "validUntil" TIMESTAMPTZ,
  "followUpAt" TIMESTAMPTZ,
  "followUpTaskId" TEXT,
  "unitPriceGbp" DOUBLE PRECISION,
  "status" "TrainingEngagementStatus" NOT NULL DEFAULT 'ENQUIRY',
  "dealCreatedForTraining" BOOLEAN NOT NULL DEFAULT false,
  "stripeCustomerId" TEXT,
  "stripeInvoiceId" TEXT,
  "hostedInvoiceUrl" TEXT,
  "invoiceEmail" TEXT,
  "invoiceAddress" TEXT,
  "invoiceCity" TEXT,
  "invoicePostcode" TEXT,
  "vatNumber" TEXT,
  "purchaseOrderNumber" TEXT,
  "siteNotes" TEXT,
  "contactName" TEXT NOT NULL,
  "contactEmail" TEXT NOT NULL,
  "contactPhone" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "TrainingEngagement_organisationId_fkey"
    FOREIGN KEY ("organisationId") REFERENCES "CrmOrganisation"("id") ON DELETE CASCADE,
  CONSTRAINT "TrainingEngagement_dealId_fkey"
    FOREIGN KEY ("dealId") REFERENCES "CrmDeal"("id") ON DELETE SET NULL,
  CONSTRAINT "TrainingEngagement_ownerId_fkey"
    FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL,
  CONSTRAINT "TrainingEngagement_followUpTaskId_fkey"
    FOREIGN KEY ("followUpTaskId") REFERENCES "CrmTask"("id") ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "TrainingEngagement_stripeInvoiceId_key"
  ON "TrainingEngagement"("stripeInvoiceId") WHERE "stripeInvoiceId" IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "TrainingEngagement_followUpTaskId_key"
  ON "TrainingEngagement"("followUpTaskId") WHERE "followUpTaskId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "TrainingEngagement_organisationId_idx" ON "TrainingEngagement"("organisationId");
CREATE INDEX IF NOT EXISTS "TrainingEngagement_ownerId_idx" ON "TrainingEngagement"("ownerId");
CREATE INDEX IF NOT EXISTS "TrainingEngagement_status_idx" ON "TrainingEngagement"("status");
CREATE INDEX IF NOT EXISTS "TrainingEngagement_followUpAt_idx" ON "TrainingEngagement"("followUpAt");
CREATE INDEX IF NOT EXISTS "TrainingEngagement_contactEmail_idx" ON "TrainingEngagement"("contactEmail");

ALTER TABLE "PlatformSetting" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TrainingEngagement" ENABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE "PlatformSetting" TO service_role;
GRANT ALL ON TABLE "TrainingEngagement" TO service_role;
