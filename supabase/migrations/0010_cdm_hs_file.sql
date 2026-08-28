-- CDM 2015 reg.12(5) — Health & Safety File

CREATE TYPE "HsFileCategory" AS ENUM (
  'AS_BUILT_DRAWINGS',
  'DESIGN_CRITERIA',
  'HAZARDOUS_MATERIALS',
  'MAINTENANCE_PROCEDURES',
  'SERVICES_INFORMATION',
  'STRUCTURAL_INFORMATION',
  'EQUIPMENT_MANUALS',
  'EMERGENCY_PROCEDURES',
  'CLEANING_PROCEDURES',
  'OTHER'
);

CREATE TABLE "HealthSafetyFileEntry" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "category" "HsFileCategory" NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "fileKey" TEXT,
  "fileName" TEXT,
  "addedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "HealthSafetyFileEntry_pkey" PRIMARY KEY ("id")
);

-- Foreign keys
ALTER TABLE "HealthSafetyFileEntry" ADD CONSTRAINT "HealthSafetyFileEntry_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "HealthSafetyFileEntry" ADD CONSTRAINT "HealthSafetyFileEntry_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Indexes
CREATE INDEX "HealthSafetyFileEntry_tenantId_idx" ON "HealthSafetyFileEntry"("tenantId");
CREATE INDEX "HealthSafetyFileEntry_projectId_idx" ON "HealthSafetyFileEntry"("projectId");
CREATE INDEX "HealthSafetyFileEntry_category_idx" ON "HealthSafetyFileEntry"("category");
