-- Using contractors: HSWA 1974 s.3; MHSWR 1999 regs 11 and 12; INDG368.
-- workToBeDone — identify the job before selecting a contractor.
-- hostInformationProvided — record that site risks, controls and emergency
-- arrangements have been given (reg.12). Not a named statutory form.

ALTER TABLE "ContractorRegistration"
  ADD COLUMN IF NOT EXISTS "workToBeDone" TEXT,
  ADD COLUMN IF NOT EXISTS "hostInformationProvided" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "hostInformationProvidedAt" TIMESTAMPTZ;
