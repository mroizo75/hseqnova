-- HSWA 1974 s.2(2)(c) / MHSWR 1999 reg.13
-- Record why health and safety training was given. Not submitted to the HSE.

ALTER TABLE "Training"
  ADD COLUMN IF NOT EXISTS "mhswrReason" TEXT;

-- Relabel global course templates that still use Norwegian HMS copy.
UPDATE "CourseTemplate"
SET
  title = 'Health and safety induction',
  description = 'Information, instruction and training for new employees (HSWA 1974 s.2(2)(c); MHSWR 1999 reg.13(2)(a)).',
  provider = NULL
WHERE "isGlobal" = true AND "courseKey" = 'hms-intro';

UPDATE "CourseTemplate"
SET
  title = 'Working at height',
  description = 'Safe use of ladders, scaffolding and fall-arrest equipment (Work at Height Regulations 2005).',
  provider = NULL
WHERE "isGlobal" = true AND "courseKey" = 'working-at-height';

UPDATE "CourseTemplate"
SET
  title = 'First aid',
  description = 'Emergency first aid and resuscitation (Health and Safety (First-Aid) Regulations 1981).',
  provider = 'St John Ambulance'
WHERE "isGlobal" = true AND "courseKey" = 'first-aid';

UPDATE "CourseTemplate"
SET
  title = 'Fire safety',
  description = 'Fire precautions, escape routes and extinguishers (Fire Safety Order 2005 art.21).',
  provider = NULL
WHERE "isGlobal" = true AND "courseKey" = 'fire-safety';

UPDATE "CourseTemplate"
SET
  title = 'COSHH / hazardous substances',
  description = 'Safe handling and storage of hazardous substances (COSHH 2002).',
  provider = NULL
WHERE "isGlobal" = true AND "courseKey" = 'chemical-handling';

UPDATE "CourseTemplate"
SET
  title = 'Lift-truck operator',
  description = 'Operator training before using a lift truck (HSE ACOP L117).',
  provider = NULL
WHERE "isGlobal" = true AND "courseKey" = 'forklift';

UPDATE "CourseTemplate"
SET
  title = 'Hot work',
  description = 'Permit and competence for welding, cutting or other hot work.',
  provider = NULL
WHERE "isGlobal" = true AND "courseKey" = 'hot-work';

UPDATE "CourseTemplate"
SET
  title = 'Confined spaces',
  description = 'Safe working in confined spaces (Confined Spaces Regulations 1997).',
  provider = NULL
WHERE "isGlobal" = true AND "courseKey" = 'confined-space';
