-- MHSWR 1999 reg.3(6): record significant findings and groups especially at risk
-- Who might be harmed is stored per risk; assessment-level summary for reg.3(6)(b)

ALTER TABLE "Risk"
  ADD COLUMN IF NOT EXISTS "groupsAtRisk" TEXT;

ALTER TABLE "RiskAssessment"
  ADD COLUMN IF NOT EXISTS "groupsAtRisk" TEXT;
