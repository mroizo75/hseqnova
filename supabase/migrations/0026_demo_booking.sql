-- Public product-demo bookings. Service role only; no anon policies.

DO $$ BEGIN
  CREATE TYPE "DemoBookingStatus" AS ENUM ('CONFIRMED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "DemoBooking" (
  "id" TEXT PRIMARY KEY,
  "startAt" TIMESTAMPTZ NOT NULL,
  "endAt" TIMESTAMPTZ NOT NULL,
  "timezone" TEXT NOT NULL DEFAULT 'Europe/London',
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT,
  "company" TEXT NOT NULL,
  "jobTitle" TEXT,
  "notes" TEXT,
  "status" "DemoBookingStatus" NOT NULL DEFAULT 'CONFIRMED',
  "manageToken" TEXT NOT NULL,
  "crmDealId" TEXT,
  "sequence" INTEGER NOT NULL DEFAULT 0,
  "cancelledAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS "DemoBooking_manageToken_key"
  ON "DemoBooking"("manageToken");
CREATE UNIQUE INDEX IF NOT EXISTS "DemoBooking_confirmed_startAt_key"
  ON "DemoBooking"("startAt")
  WHERE "status" = 'CONFIRMED';
CREATE INDEX IF NOT EXISTS "DemoBooking_startAt_idx" ON "DemoBooking"("startAt");
CREATE INDEX IF NOT EXISTS "DemoBooking_status_startAt_idx" ON "DemoBooking"("status", "startAt");
CREATE INDEX IF NOT EXISTS "DemoBooking_email_idx" ON "DemoBooking"("email");

ALTER TABLE "DemoBooking" ENABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE "DemoBooking" TO service_role;
