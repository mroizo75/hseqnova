-- Organisation chart: H&S duty key and role description
-- HSWA 1974 s.2(3) Part 2 — names, positions and roles
-- MHSWR 1999 reg.7; First-Aid Regulations 1981 reg.4; Fire Safety Order 2005

ALTER TABLE "OrgChartNode"
  ADD COLUMN IF NOT EXISTS "hsDutyKey" TEXT,
  ADD COLUMN IF NOT EXISTS "hsDuty" TEXT;
