-- Accident book BI 510 fields + RIDDOR 2013 explicit triage
-- Social Security (Claims and Payments) Regulations 1979
-- Reporting of Injuries, Diseases and Dangerous Occurrences Regulations 2013

ALTER TABLE "Incident"
  ADD COLUMN IF NOT EXISTS "injuredPersonOccupation" TEXT,
  ADD COLUMN IF NOT EXISTS "injuredPersonAddress" TEXT,
  ADD COLUMN IF NOT EXISTS "injuredPersonRole" TEXT,
  ADD COLUMN IF NOT EXISTS "witnessAddress" TEXT,
  ADD COLUMN IF NOT EXISTS "shareWithSafetyRepsConsent" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "reporterAcknowledged" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "riddorReportMethod" TEXT,
  ADD COLUMN IF NOT EXISTS "overThreeDayInjury" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "specifiedInjury" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "listedOccupationalDisease" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "listedDangerousOccurrence" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "nonWorkerTakenToHospital" BOOLEAN NOT NULL DEFAULT false;
