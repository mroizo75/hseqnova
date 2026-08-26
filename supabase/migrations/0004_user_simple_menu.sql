-- Per-user simple menu (used unless Tenant.dashboardLocked is true).
ALTER TABLE "DashboardConfig"
  ADD COLUMN IF NOT EXISTS "simpleMenuItems" JSONB;
