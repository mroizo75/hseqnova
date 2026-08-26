-- HSEQ Red Thread: standardise tracking fields and add cron execution history
-- This migration adds missing created_by_id / updated_by_id columns on core
-- HSEQ models so every mutation can be traced to a user.  It also creates the
-- CronExecution table for phase 4.
--
-- Strategy: ADDITIVE – no column renames.  Existing field names (dueAt,
-- completedDate, nextReviewAt, etc.) stay as-is to avoid breaking hundreds of
-- Supabase queries.  The Prisma schema documents the canonical concept each
-- field represents so future features can query uniformly.

-- ──────────────────────────────────────────────────────────────────────────────
-- 1. Add created_by_id / updated_by_id on core HSEQ models
-- ──────────────────────────────────────────────────────────────────────────────

ALTER TABLE "Incident"   ADD COLUMN IF NOT EXISTS "createdById"  TEXT;
ALTER TABLE "Incident"   ADD COLUMN IF NOT EXISTS "updatedById"  TEXT;

ALTER TABLE "Inspection" ADD COLUMN IF NOT EXISTS "createdById"  TEXT;
ALTER TABLE "Inspection" ADD COLUMN IF NOT EXISTS "updatedById"  TEXT;

ALTER TABLE "Measure"    ADD COLUMN IF NOT EXISTS "createdById"  TEXT;
ALTER TABLE "Measure"    ADD COLUMN IF NOT EXISTS "updatedById"  TEXT;

ALTER TABLE "Training"   ADD COLUMN IF NOT EXISTS "createdById"  TEXT;
ALTER TABLE "Training"   ADD COLUMN IF NOT EXISTS "updatedById"  TEXT;

ALTER TABLE "FireDrill"  ADD COLUMN IF NOT EXISTS "createdById"  TEXT;
ALTER TABLE "FireDrill"  ADD COLUMN IF NOT EXISTS "updatedById"  TEXT;

ALTER TABLE "Risk"       ADD COLUMN IF NOT EXISTS "createdById"  TEXT;
ALTER TABLE "Risk"       ADD COLUMN IF NOT EXISTS "updatedById"  TEXT;

ALTER TABLE "Audit"      ADD COLUMN IF NOT EXISTS "createdById"  TEXT;
ALTER TABLE "Audit"      ADD COLUMN IF NOT EXISTS "updatedById"  TEXT;

ALTER TABLE "Routine"    ADD COLUMN IF NOT EXISTS "updatedById"  TEXT;

ALTER TABLE "Meeting"    ADD COLUMN IF NOT EXISTS "createdById"  TEXT;
ALTER TABLE "Meeting"    ADD COLUMN IF NOT EXISTS "updatedById"  TEXT;

ALTER TABLE "ManagementReview" ADD COLUMN IF NOT EXISTS "createdById" TEXT;
ALTER TABLE "ManagementReview" ADD COLUMN IF NOT EXISTS "updatedById" TEXT;

ALTER TABLE "Whistleblowing" ADD COLUMN IF NOT EXISTS "updatedById" TEXT;

ALTER TABLE "Chemical"   ADD COLUMN IF NOT EXISTS "createdById"  TEXT;
ALTER TABLE "Chemical"   ADD COLUMN IF NOT EXISTS "updatedById"  TEXT;

ALTER TABLE "SjaAnalysis" ADD COLUMN IF NOT EXISTS "updatedById" TEXT;

ALTER TABLE "RuhReport"  ADD COLUMN IF NOT EXISTS "updatedById"  TEXT;

-- ──────────────────────────────────────────────────────────────────────────────
-- 2. Add createdAt where missing on business-critical models
-- ──────────────────────────────────────────────────────────────────────────────

ALTER TABLE "SubcontractorPortal" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMPTZ DEFAULT now();
ALTER TABLE "SubcontractorPortal" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ DEFAULT now();

ALTER TABLE "HmsTavleExternalLink" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMPTZ DEFAULT now();

ALTER TABLE "HmsTavleSection" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMPTZ DEFAULT now();

ALTER TABLE "HaccpCcp" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMPTZ DEFAULT now();
ALTER TABLE "HaccpCcp" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ DEFAULT now();

ALTER TABLE "SjaHazard" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMPTZ DEFAULT now();

ALTER TABLE "SjaTemplateHazard" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMPTZ DEFAULT now();

ALTER TABLE "MeetingParticipant" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMPTZ DEFAULT now();

-- ──────────────────────────────────────────────────────────────────────────────
-- 3. CronExecution table for phase 4 (cron job history)
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "CronExecution" (
  "id"          TEXT PRIMARY KEY,
  "jobName"     TEXT NOT NULL,
  "status"      TEXT NOT NULL DEFAULT 'RUNNING',
  "startedAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
  "completedAt" TIMESTAMPTZ,
  "durationMs"  INTEGER,
  "stats"       JSONB,
  "error"       TEXT,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "CronExecution_jobName_idx"
  ON "CronExecution" ("jobName");
CREATE INDEX IF NOT EXISTS "CronExecution_startedAt_idx"
  ON "CronExecution" ("startedAt" DESC);
CREATE INDEX IF NOT EXISTS "CronExecution_status_idx"
  ON "CronExecution" ("status");

-- ──────────────────────────────────────────────────────────────────────────────
-- 4. Indexes on the new user-tracking columns
-- ──────────────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS "Incident_createdById_idx"  ON "Incident"  ("createdById");
CREATE INDEX IF NOT EXISTS "Inspection_createdById_idx" ON "Inspection" ("createdById");
CREATE INDEX IF NOT EXISTS "Measure_createdById_idx"   ON "Measure"   ("createdById");
CREATE INDEX IF NOT EXISTS "Training_createdById_idx"  ON "Training"  ("createdById");
CREATE INDEX IF NOT EXISTS "FireDrill_createdById_idx"  ON "FireDrill" ("createdById");
CREATE INDEX IF NOT EXISTS "Risk_createdById_idx"      ON "Risk"      ("createdById");
CREATE INDEX IF NOT EXISTS "Audit_createdById_idx"     ON "Audit"     ("createdById");
CREATE INDEX IF NOT EXISTS "Meeting_createdById_idx"   ON "Meeting"   ("createdById");
CREATE INDEX IF NOT EXISTS "Chemical_createdById_idx"  ON "Chemical"  ("createdById");
