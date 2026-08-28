-- Asset / Equipment Register (PUWER 1998, LOLER 1998)

-- Enums
CREATE TYPE "AssetCategory" AS ENUM (
  'LIFTING_EQUIPMENT',
  'PRESSURE_EQUIPMENT',
  'ELECTRICAL',
  'VEHICLES',
  'POWER_TOOLS',
  'HAND_TOOLS',
  'PPE',
  'FIRE_EQUIPMENT',
  'SCAFFOLDING',
  'OTHER'
);

CREATE TYPE "AssetStatus" AS ENUM (
  'ACTIVE',
  'OUT_OF_SERVICE',
  'UNDER_REPAIR',
  'DECOMMISSIONED',
  'DISPOSED'
);

CREATE TYPE "AssetInspectionType" AS ENUM (
  'ROUTINE',
  'THOROUGH_EXAMINATION',
  'PRE_USE',
  'POST_INCIDENT',
  'RETURN_TO_SERVICE'
);

CREATE TYPE "AssetInspectionResult" AS ENUM (
  'PASS',
  'CONDITIONAL_PASS',
  'FAIL',
  'REQUIRES_REPAIR'
);

-- Asset table
CREATE TABLE "Asset" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "assetTag" TEXT,
  "category" "AssetCategory" NOT NULL,
  "manufacturer" TEXT,
  "model" TEXT,
  "serialNumber" TEXT,
  "location" TEXT,
  "department" TEXT,
  "purchaseDate" TIMESTAMP(3),
  "commissionDate" TIMESTAMP(3),
  "decommissionDate" TIMESTAMP(3),
  "status" "AssetStatus" NOT NULL DEFAULT 'ACTIVE',
  "notes" TEXT,
  "inspectionFrequency" "ControlFrequency" DEFAULT 'ANNUAL',
  "lastInspectionDate" TIMESTAMP(3),
  "nextInspectionDue" TIMESTAMP(3),
  "inspectionProvider" TEXT,
  "safeWorkingLoad" TEXT,
  "thoroughExamDue" TIMESTAMP(3),
  "lastThoroughExam" TIMESTAMP(3),
  "insuranceCertKey" TEXT,
  "certificationExpiry" TIMESTAMP(3),
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- AssetInspection table
CREATE TABLE "AssetInspection" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "assetId" TEXT NOT NULL,
  "inspectionDate" TIMESTAMP(3) NOT NULL,
  "inspectedBy" TEXT NOT NULL,
  "inspectionType" "AssetInspectionType" NOT NULL DEFAULT 'ROUTINE',
  "result" "AssetInspectionResult" NOT NULL DEFAULT 'PASS',
  "findings" TEXT,
  "actionRequired" TEXT,
  "nextDueDate" TIMESTAMP(3),
  "certificateKey" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "AssetInspection_pkey" PRIMARY KEY ("id")
);

-- AssetMaintenance table
CREATE TABLE "AssetMaintenance" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "assetId" TEXT NOT NULL,
  "maintenanceDate" TIMESTAMP(3) NOT NULL,
  "performedBy" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "cost" DECIMAL(10, 2),
  "nextDueDate" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "AssetMaintenance_pkey" PRIMARY KEY ("id")
);

-- Foreign keys
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AssetInspection" ADD CONSTRAINT "AssetInspection_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AssetInspection" ADD CONSTRAINT "AssetInspection_assetId_fkey"
  FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AssetMaintenance" ADD CONSTRAINT "AssetMaintenance_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AssetMaintenance" ADD CONSTRAINT "AssetMaintenance_assetId_fkey"
  FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Indexes
CREATE INDEX "Asset_tenantId_idx" ON "Asset"("tenantId");
CREATE INDEX "Asset_status_idx" ON "Asset"("status");
CREATE INDEX "Asset_category_idx" ON "Asset"("category");
CREATE INDEX "Asset_nextInspectionDue_idx" ON "Asset"("nextInspectionDue");
CREATE INDEX "Asset_thoroughExamDue_idx" ON "Asset"("thoroughExamDue");
CREATE INDEX "Asset_certificationExpiry_idx" ON "Asset"("certificationExpiry");

CREATE INDEX "AssetInspection_tenantId_idx" ON "AssetInspection"("tenantId");
CREATE INDEX "AssetInspection_assetId_idx" ON "AssetInspection"("assetId");
CREATE INDEX "AssetInspection_inspectionDate_idx" ON "AssetInspection"("inspectionDate");

CREATE INDEX "AssetMaintenance_tenantId_idx" ON "AssetMaintenance"("tenantId");
CREATE INDEX "AssetMaintenance_assetId_idx" ON "AssetMaintenance"("assetId");
CREATE INDEX "AssetMaintenance_maintenanceDate_idx" ON "AssetMaintenance"("maintenanceDate");
