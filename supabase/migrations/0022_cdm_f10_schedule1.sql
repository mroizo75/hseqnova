-- CDM 2015 reg.6 / Schedule 1: F10 particulars.
-- Para 3 — local authority where the site is located.
-- Para 15 — client declaration that they are aware of the client duties.
-- Notify HSE on hse.gov.uk/forms/notification/f10.htm — this table is the record,
-- not the submission.

ALTER TABLE "ConstructionPreNotification"
  ADD COLUMN IF NOT EXISTS "localAuthority" TEXT,
  ADD COLUMN IF NOT EXISTS "clientDutyAcknowledged" BOOLEAN NOT NULL DEFAULT false;
