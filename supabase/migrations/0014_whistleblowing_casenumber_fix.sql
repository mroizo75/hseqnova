-- Fix whistleblowing case number uniqueness: tenant-scoped instead of global
-- This prevents duplicate case numbers when multiple tenants create reports concurrently

-- Drop the old global unique constraint
ALTER TABLE "Whistleblowing" DROP CONSTRAINT IF EXISTS "Whistleblowing_caseNumber_key";

-- Drop old index if it exists
DROP INDEX IF EXISTS "Whistleblowing_caseNumber_key";
DROP INDEX IF EXISTS "Whistleblowing_caseNumber_idx";

-- Add tenant-scoped unique constraint
CREATE UNIQUE INDEX "Whistleblowing_tenantId_caseNumber_key"
  ON "Whistleblowing" ("tenantId", "caseNumber");
