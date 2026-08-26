import { getAdminDb } from "@/lib/supabase/admin";
import { createId } from "@/lib/ids";
import type { ExposureRegister, ExposureRegisterStatus, ExposureType } from "@prisma/client";
import { decryptField } from "@/lib/field-encryption";

function nowIso(): string {
  return new Date().toISOString();
}

function parseDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

function toIso(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function asBool(value: unknown): boolean {
  return value === true || value === "true";
}

export function asExposureRegister(row: Record<string, unknown>): ExposureRegister {
  return {
    ...row,
    retentionYears: row.retentionYears == null ? 40 : Number(row.retentionYears),
    riskAssessmentDone: asBool(row.riskAssessmentDone),
    healthCheckRequired: asBool(row.healthCheckRequired),
    healthCheckDone: asBool(row.healthCheckDone),
    employmentStartDate: parseDate(row.employmentStartDate),
    employmentEndDate: parseDate(row.employmentEndDate),
    exposureStartDate: parseDate(row.exposureStartDate) ?? new Date(0),
    exposureEndDate: parseDate(row.exposureEndDate),
    healthCheckDate: parseDate(row.healthCheckDate),
    retentionUntilDate: parseDate(row.retentionUntilDate) ?? new Date(0),
    archivedAt: parseDate(row.archivedAt),
    createdAt: parseDate(row.createdAt) ?? new Date(0),
    updatedAt: parseDate(row.updatedAt) ?? new Date(0),
    exposureType: (row.exposureType as ExposureType) ?? "INHALATION",
    status: (row.status as ExposureRegisterStatus) ?? "ACTIVE",
  } as ExposureRegister;
}

export type ExposureEmployee = { id: string; name: string | null; email: string };
export type ExposureChemicalRef = { id: string; productName: string; casNumber: string | null };
export type ExposureRuhRef = { id: string; ruhNummer: string | null; title: string; occurredAt: Date };
export type ExposureRiskRef = {
  id: string;
  title: string;
  score: number;
  likelihood: number;
  consequence: number;
  status: string;
  riskAssessment: { title: string; assessmentYear: number } | null;
};

export type ExposureListItem = Omit<ExposureRegister, "employeeBirthNumber"> & {
  employee: ExposureEmployee | null;
  chemical: ExposureChemicalRef | null;
  ruhReport: ExposureRuhRef | null;
  risk: ExposureRiskRef | null;
};

export type ExposureEmployeeOption = {
  id: string;
  name: string | null;
  email: string;
  department: string | null;
  employeeNumber: string | null;
};

function omitBirthNumber(entry: ExposureRegister): Omit<ExposureRegister, "employeeBirthNumber"> {
  const { employeeBirthNumber: _hidden, ...rest } = entry;
  return rest;
}

async function hydrateRelations(rows: ExposureRegister[]): Promise<ExposureListItem[]> {
  const db = getAdminDb();
  const employeeIds = [...new Set(rows.map((row) => row.employeeId).filter((id): id is string => Boolean(id)))];
  const chemicalIds = [...new Set(rows.map((row) => row.chemicalId).filter((id): id is string => Boolean(id)))];
  const ruhIds = [...new Set(rows.map((row) => row.ruhReportId).filter((id): id is string => Boolean(id)))];
  const riskIds = [...new Set(rows.map((row) => row.riskId).filter((id): id is string => Boolean(id)))];

  const [employees, chemicals, ruhReports, risks] = await Promise.all([
    employeeIds.length
      ? db.from("User").select("id, name, email").in("id", employeeIds)
      : Promise.resolve({ data: [], error: null }),
    chemicalIds.length
      ? db.from("Chemical").select("id, productName, casNumber").in("id", chemicalIds)
      : Promise.resolve({ data: [], error: null }),
    ruhIds.length
      ? db.from("RuhReport").select("id, ruhNummer, title, occurredAt").in("id", ruhIds)
      : Promise.resolve({ data: [], error: null }),
    riskIds.length
      ? db.from("Risk").select("id, title, score, likelihood, consequence, status, riskAssessmentId").in("id", riskIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (employees.error) throw { code: "EXPOSURE_REL_FAILED", message: employees.error.message };
  if (chemicals.error) throw { code: "EXPOSURE_REL_FAILED", message: chemicals.error.message };
  if (ruhReports.error) throw { code: "EXPOSURE_REL_FAILED", message: ruhReports.error.message };
  if (risks.error) throw { code: "EXPOSURE_REL_FAILED", message: risks.error.message };

  const assessmentIds = [
    ...new Set(
      (risks.data ?? [])
        .map((row) => row.riskAssessmentId as string | null)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const assessments = assessmentIds.length
    ? await db.from("RiskAssessment").select("id, title, assessmentYear").in("id", assessmentIds)
    : { data: [], error: null };
  if (assessments.error) throw { code: "EXPOSURE_REL_FAILED", message: assessments.error.message };

  const employeeById = new Map(
    ((employees.data ?? []) as ExposureEmployee[]).map((row) => [row.id, row]),
  );
  const chemicalById = new Map(
    ((chemicals.data ?? []) as ExposureChemicalRef[]).map((row) => [row.id, row]),
  );
  const ruhById = new Map(
    (ruhReports.data ?? []).map((row) => [
      String(row.id),
      {
        id: String(row.id),
        ruhNummer: (row.ruhNummer as string | null) ?? null,
        title: String(row.title ?? ""),
        occurredAt: parseDate(row.occurredAt) ?? new Date(0),
      } satisfies ExposureRuhRef,
    ]),
  );
  const assessmentById = new Map(
    (assessments.data ?? []).map((row) => [
      String(row.id),
      { title: String(row.title ?? ""), assessmentYear: Number(row.assessmentYear ?? 0) },
    ]),
  );
  const riskById = new Map(
    (risks.data ?? []).map((row) => {
      const assessmentId = row.riskAssessmentId as string | null;
      return [
        String(row.id),
        {
          id: String(row.id),
          title: String(row.title ?? ""),
          score: Number(row.score ?? 0),
          likelihood: Number(row.likelihood ?? 0),
          consequence: Number(row.consequence ?? 0),
          status: String(row.status ?? ""),
          riskAssessment: assessmentId ? assessmentById.get(assessmentId) ?? null : null,
        } satisfies ExposureRiskRef,
      ];
    }),
  );

  return rows.map((row) => ({
    ...omitBirthNumber(row),
    employee: row.employeeId ? employeeById.get(row.employeeId) ?? null : null,
    chemical: row.chemicalId ? chemicalById.get(row.chemicalId) ?? null : null,
    ruhReport: row.ruhReportId ? ruhById.get(row.ruhReportId) ?? null : null,
    risk: row.riskId ? riskById.get(row.riskId) ?? null : null,
  }));
}

export async function loadExposureRegistersForTenant(tenantId: string): Promise<ExposureListItem[]> {
  const { data, error } = await getAdminDb()
    .from("ExposureRegister")
    .select("*")
    .eq("tenantId", tenantId)
    .neq("status", "ARCHIVED")
    .order("createdAt", { ascending: false });
  if (error) {
    throw { code: "EXPOSURE_LIST_FAILED", message: error.message };
  }
  return hydrateRelations((data ?? []).map((row) => asExposureRegister(row as Record<string, unknown>)));
}

export async function loadExposuresForEmployee(
  tenantId: string,
  employeeId: string,
): Promise<ExposureListItem[]> {
  const { data, error } = await getAdminDb()
    .from("ExposureRegister")
    .select("*")
    .eq("tenantId", tenantId)
    .eq("employeeId", employeeId)
    .order("exposureStartDate", { ascending: false });
  if (error) {
    throw { code: "EXPOSURE_LIST_FAILED", message: error.message };
  }
  return hydrateRelations((data ?? []).map((row) => asExposureRegister(row as Record<string, unknown>)));
}

export async function loadExposureById(
  id: string,
  tenantId: string,
  opts?: { decryptNi?: boolean },
): Promise<ExposureRegister | null> {
  const { data, error } = await getAdminDb()
    .from("ExposureRegister")
    .select("*")
    .eq("id", id)
    .eq("tenantId", tenantId)
    .maybeSingle();
  if (error) {
    throw { code: "EXPOSURE_LOOKUP_FAILED", message: error.message };
  }
  if (!data) return null;
  const entry = asExposureRegister(data as Record<string, unknown>);
  if (opts?.decryptNi) {
    return { ...entry, employeeBirthNumber: decryptField(entry.employeeBirthNumber) };
  }
  return entry;
}

export async function insertExposureRegister(input: Record<string, unknown>): Promise<ExposureRegister> {
  const now = nowIso();
  const { data, error } = await getAdminDb()
    .from("ExposureRegister")
    .insert({
      id: createId(),
      ...input,
      createdAt: now,
      updatedAt: now,
    })
    .select("*")
    .single();
  if (error || !data) {
    throw { code: "EXPOSURE_CREATE_FAILED", message: error?.message || "Could not create the health record" };
  }
  return asExposureRegister(data as Record<string, unknown>);
}

export async function updateExposureRecord(
  id: string,
  tenantId: string,
  patch: Record<string, unknown>,
): Promise<ExposureRegister> {
  const serialized: Record<string, unknown> = { updatedAt: nowIso() };
  for (const [key, value] of Object.entries(patch)) {
    if (key === "id" || key === "tenantId") continue;
    serialized[key] = value instanceof Date ? value.toISOString() : value;
  }
  const { data, error } = await getAdminDb()
    .from("ExposureRegister")
    .update(serialized)
    .eq("id", id)
    .eq("tenantId", tenantId)
    .select("*")
    .single();
  if (error || !data) {
    throw { code: "EXPOSURE_UPDATE_FAILED", message: error?.message || "Could not update the health record" };
  }
  return asExposureRegister(data as Record<string, unknown>);
}

export async function membershipExists(userId: string, tenantId: string): Promise<boolean> {
  const { data, error } = await getAdminDb()
    .from("UserTenant")
    .select("userId")
    .eq("userId", userId)
    .eq("tenantId", tenantId)
    .maybeSingle();
  if (error) {
    throw { code: "MEMBERSHIP_LOOKUP_FAILED", message: error.message };
  }
  return Boolean(data);
}

export async function chemicalExistsInTenant(id: string, tenantId: string): Promise<boolean> {
  const { data, error } = await getAdminDb()
    .from("Chemical")
    .select("id")
    .eq("id", id)
    .eq("tenantId", tenantId)
    .maybeSingle();
  if (error) {
    throw { code: "CHEMICAL_LOOKUP_FAILED", message: error.message };
  }
  return Boolean(data);
}

export async function ruhReportExistsInTenant(id: string, tenantId: string): Promise<boolean> {
  const { data, error } = await getAdminDb()
    .from("RuhReport")
    .select("id")
    .eq("id", id)
    .eq("tenantId", tenantId)
    .maybeSingle();
  if (error) {
    throw { code: "RUH_LOOKUP_FAILED", message: error.message };
  }
  return Boolean(data);
}

export async function riskExistsInTenant(id: string, tenantId: string): Promise<boolean> {
  const { data, error } = await getAdminDb()
    .from("Risk")
    .select("id")
    .eq("id", id)
    .eq("tenantId", tenantId)
    .maybeSingle();
  if (error) {
    throw { code: "RISK_LOOKUP_FAILED", message: error.message };
  }
  return Boolean(data);
}

export async function loadEmployeesForTenant(tenantId: string): Promise<ExposureEmployeeOption[]> {
  const db = getAdminDb();
  const { data: memberships, error } = await db
    .from("UserTenant")
    .select("userId, department, employeeNumber")
    .eq("tenantId", tenantId);
  if (error) {
    throw { code: "EMPLOYEE_LIST_FAILED", message: error.message };
  }
  const userIds = [...new Set((memberships ?? []).map((row) => String(row.userId)))];
  if (userIds.length === 0) return [];

  const { data: users, error: userError } = await db.from("User").select("id, name, email").in("id", userIds);
  if (userError) {
    throw { code: "EMPLOYEE_LIST_FAILED", message: userError.message };
  }

  const userById = new Map(
    ((users ?? []) as Array<{ id: string; name: string | null; email: string }>).map((user) => [user.id, user]),
  );
  const options = (memberships ?? [])
    .map((row) => {
      const user = userById.get(String(row.userId));
      if (!user) return null;
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        department: (row.department as string | null) ?? null,
        employeeNumber: (row.employeeNumber as string | null) ?? null,
      } satisfies ExposureEmployeeOption;
    })
    .filter((row): row is ExposureEmployeeOption => row !== null);

  return options.sort((a, b) => (a.name || a.email).localeCompare(b.name || b.email, "en-GB"));
}

export async function loadActiveChemicalsForSelect(
  tenantId: string,
): Promise<ExposureChemicalRef[]> {
  const { data, error } = await getAdminDb()
    .from("Chemical")
    .select("id, productName, casNumber")
    .eq("tenantId", tenantId)
    .eq("status", "ACTIVE")
    .order("productName", { ascending: true });
  if (error) {
    throw { code: "CHEMICAL_LIST_FAILED", message: error.message };
  }
  return ((data ?? []) as ExposureChemicalRef[]).map((row) => ({
    id: row.id,
    productName: row.productName,
    casNumber: row.casNumber,
  }));
}

export async function loadRuhReportsForSelect(tenantId: string): Promise<ExposureRuhRef[]> {
  const { data, error } = await getAdminDb()
    .from("RuhReport")
    .select("id, ruhNummer, title, occurredAt")
    .eq("tenantId", tenantId)
    .order("occurredAt", { ascending: false });
  if (error) {
    throw { code: "RUH_LIST_FAILED", message: error.message };
  }
  return (data ?? []).map((row) => ({
    id: String(row.id),
    ruhNummer: (row.ruhNummer as string | null) ?? null,
    title: String(row.title ?? ""),
    occurredAt: parseDate(row.occurredAt) ?? new Date(0),
  }));
}

export async function loadOpenRisksForSelect(tenantId: string): Promise<ExposureRiskRef[]> {
  const db = getAdminDb();
  const { data, error } = await db
    .from("Risk")
    .select("id, title, score, likelihood, consequence, status, riskAssessmentId")
    .eq("tenantId", tenantId)
    .neq("status", "CLOSED")
    .order("score", { ascending: false });
  if (error) {
    throw { code: "RISK_LIST_FAILED", message: error.message };
  }
  const rows = data ?? [];
  const assessmentIds = [
    ...new Set(rows.map((row) => row.riskAssessmentId as string | null).filter((id): id is string => Boolean(id))),
  ];
  const assessments = assessmentIds.length
    ? await db.from("RiskAssessment").select("id, title, assessmentYear").in("id", assessmentIds)
    : { data: [], error: null };
  if (assessments.error) {
    throw { code: "RISK_LIST_FAILED", message: assessments.error.message };
  }
  const assessmentById = new Map(
    (assessments.data ?? []).map((row) => [
      String(row.id),
      { title: String(row.title ?? ""), assessmentYear: Number(row.assessmentYear ?? 0) },
    ]),
  );
  return rows.map((row) => {
    const assessmentId = row.riskAssessmentId as string | null;
    return {
      id: String(row.id),
      title: String(row.title ?? ""),
      score: Number(row.score ?? 0),
      likelihood: Number(row.likelihood ?? 0),
      consequence: Number(row.consequence ?? 0),
      status: String(row.status ?? ""),
      riskAssessment: assessmentId ? assessmentById.get(assessmentId) ?? null : null,
    };
  });
}

export async function loadUserNameEmail(userId: string): Promise<{ id: string; name: string | null; email: string } | null> {
  const { data, error } = await getAdminDb()
    .from("User")
    .select("id, name, email")
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    throw { code: "USER_LOOKUP_FAILED", message: error.message };
  }
  if (!data) return null;
  return { id: String(data.id), name: (data.name as string | null) ?? null, email: String(data.email ?? "") };
}

export { toIso };
