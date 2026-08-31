ALTER TABLE "FireRiskAssessment"
  ADD COLUMN IF NOT EXISTS "responsiblePersonName" TEXT,
  ADD COLUMN IF NOT EXISTS "responsiblePersonAddress" TEXT,
  ADD COLUMN IF NOT EXISTS "assessorName" TEXT,
  ADD COLUMN IF NOT EXISTS "assessorOrganisation" TEXT;
