-- Role-based training requirements
-- HSWA 1974 s.2(2)(c): duty to provide training per job role

CREATE TABLE IF NOT EXISTS "RoleTrainingRequirement" (
  "id"          TEXT        NOT NULL,
  "tenantId"    TEXT        NOT NULL,
  "role"        TEXT        NOT NULL,
  "courseKey"    TEXT        NOT NULL,
  "isMandatory" BOOLEAN     NOT NULL DEFAULT true,
  "reason"      TEXT,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "RoleTrainingRequirement_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "RoleTrainingRequirement_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "RoleTrainingRequirement_tenantId_role_courseKey_key"
    UNIQUE ("tenantId", "role", "courseKey")
);

CREATE INDEX IF NOT EXISTS "RoleTrainingRequirement_tenantId_idx"
  ON "RoleTrainingRequirement" ("tenantId");

CREATE INDEX IF NOT EXISTS "RoleTrainingRequirement_role_idx"
  ON "RoleTrainingRequirement" ("role");
