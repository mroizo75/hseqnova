-- MHSWR 1999 reg.5 / SRSCWR 1977 regs 5–6 / CDM 2015
-- Record why the workplace inspection is taking place (F2534 is the record, not a filing to HSE)

ALTER TABLE "Inspection"
  ADD COLUMN IF NOT EXISTS "legalBasis" TEXT;
