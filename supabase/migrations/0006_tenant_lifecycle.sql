-- Add subscription lifecycle fields to Tenant
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "suspendedAt" TIMESTAMPTZ;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMPTZ;

-- Add PENDING_CANCEL to TenantModuleStatus enum
ALTER TYPE "TenantModuleStatus" ADD VALUE IF NOT EXISTS 'PENDING_CANCEL' AFTER 'TRIAL';
