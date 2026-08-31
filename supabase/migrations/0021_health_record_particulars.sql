-- COSHH 2002 reg.11(3): health record with particulars approved by the Executive.
-- HSE G401 / COSHH FAQ: name, home address, National Insurance number;
-- fitness for work (not clinical notes). Keep 40 years from the last entry.
-- Not submitted to the HSE unless the employer ceases to trade (reg.11(4)(c)).

ALTER TABLE "ExposureRegister"
  ADD COLUMN IF NOT EXISTS "homeAddress" TEXT,
  ADD COLUMN IF NOT EXISTS "fitnessForWork" TEXT;
