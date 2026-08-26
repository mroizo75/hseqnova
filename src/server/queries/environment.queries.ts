import { getAdminDb } from "@/lib/supabase/admin";
import { createId } from "@/lib/ids";
import type {
  EnvironmentalAspect,
  EnvironmentalMeasurement,
  EnvironmentalMeasurementStatus,
  Goal,
  Measure,
} from "@prisma/client";

export type EnvironmentPerson = { id: string; name: string | null; email: string | null };
export type EnvironmentGoalOption = { id: string; title: string };

export type AspectListItem = EnvironmentalAspect & {
  owner: EnvironmentPerson | null;
  goal: EnvironmentGoalOption | null;
  measurements: EnvironmentalMeasurement[];
};

export type AspectDetail = EnvironmentalAspect & {
  owner: EnvironmentPerson | null;
  goal: EnvironmentGoalOption | null;
  measurements: Array<
    EnvironmentalMeasurement & {
      responsible: EnvironmentPerson | null;
    }
  >;
};

export type YearMeasurement = EnvironmentalMeasurement & {
  aspect: Pick<EnvironmentalAspect, "category" | "title">;
};

function parseDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

function nowIso(): string {
  return new Date().toISOString();
}

export function asEnvironmentalAspect(row: Record<string, unknown>): EnvironmentalAspect {
  return {
    ...row,
    severity: Number(row.severity ?? 0),
    likelihood: Number(row.likelihood ?? 0),
    significanceScore: Number(row.significanceScore ?? 0),
    nextReviewDate: parseDate(row.nextReviewDate),
    lastMeasurementDate: parseDate(row.lastMeasurementDate),
    createdAt: parseDate(row.createdAt) ?? new Date(0),
    updatedAt: parseDate(row.updatedAt) ?? new Date(0),
  } as EnvironmentalAspect;
}

export function asEnvironmentalMeasurement(row: Record<string, unknown>): EnvironmentalMeasurement {
  return {
    ...row,
    limitValue: row.limitValue === null || row.limitValue === undefined ? null : Number(row.limitValue),
    targetValue: row.targetValue === null || row.targetValue === undefined ? null : Number(row.targetValue),
    measuredValue: Number(row.measuredValue ?? 0),
    measurementDate: parseDate(row.measurementDate) ?? new Date(0),
    createdAt: parseDate(row.createdAt) ?? new Date(0),
    updatedAt: parseDate(row.updatedAt) ?? new Date(0),
  } as EnvironmentalMeasurement;
}

export function calculateSignificance(severity: number, likelihood: number): number {
  return severity * likelihood;
}

export function getMeasurementStatus(
  measuredValue: number,
  limitValue?: number | null,
  targetValue?: number | null
): EnvironmentalMeasurementStatus {
  if (typeof limitValue === "number" && measuredValue > limitValue) {
    return "NON_COMPLIANT";
  }
  if (typeof targetValue === "number" && measuredValue > targetValue) {
    return "WARNING";
  }
  return "COMPLIANT";
}

async function loadPeopleById(ids: string[]): Promise<Map<string, EnvironmentPerson>> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return new Map();
  const { data, error } = await getAdminDb()
    .from("User")
    .select("id, name, email")
    .in("id", unique);
  if (error) {
    throw { code: "ENVIRONMENT_USERS_FAILED", message: error.message };
  }
  return new Map(((data ?? []) as EnvironmentPerson[]).map((person) => [person.id, person]));
}

async function loadGoalsById(ids: string[]): Promise<Map<string, EnvironmentGoalOption>> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return new Map();
  const { data, error } = await getAdminDb()
    .from("Goal")
    .select("id, title")
    .in("id", unique);
  if (error) {
    throw { code: "ENVIRONMENT_GOALS_FAILED", message: error.message };
  }
  return new Map(((data ?? []) as EnvironmentGoalOption[]).map((goal) => [goal.id, goal]));
}

export async function loadEnvironmentUsers(tenantId: string): Promise<EnvironmentPerson[]> {
  const db = getAdminDb();
  const { data: memberships, error: membershipError } = await db
    .from("UserTenant")
    .select("userId")
    .eq("tenantId", tenantId);
  if (membershipError) {
    throw { code: "ENVIRONMENT_USERS_FAILED", message: membershipError.message };
  }
  const userIds = ((memberships ?? []) as Array<{ userId: string }>).map((row) => row.userId);
  if (userIds.length === 0) return [];
  const { data, error } = await db
    .from("User")
    .select("id, name, email")
    .in("id", userIds)
    .order("name", { ascending: true });
  if (error) {
    throw { code: "ENVIRONMENT_USERS_FAILED", message: error.message };
  }
  return (data ?? []) as EnvironmentPerson[];
}

export async function loadEnvironmentGoals(tenantId: string): Promise<EnvironmentGoalOption[]> {
  const { data, error } = await getAdminDb()
    .from("Goal")
    .select("id, title")
    .eq("tenantId", tenantId)
    .order("title", { ascending: true });
  if (error) {
    throw { code: "ENVIRONMENT_GOALS_FAILED", message: error.message };
  }
  return (data ?? []) as EnvironmentGoalOption[];
}

export async function loadTenantName(tenantId: string): Promise<string> {
  const { data, error } = await getAdminDb()
    .from("Tenant")
    .select("name")
    .eq("id", tenantId)
    .maybeSingle();
  if (error) {
    throw { code: "ENVIRONMENT_TENANT_FAILED", message: error.message };
  }
  return (data?.name as string | undefined) ?? "Organisation";
}

export async function loadEnvironmentalAspects(tenantId: string): Promise<AspectListItem[]> {
  const db = getAdminDb();
  const { data, error } = await db
    .from("EnvironmentalAspect")
    .select("*")
    .eq("tenantId", tenantId)
    .order("significanceScore", { ascending: false })
    .order("createdAt", { ascending: false });
  if (error) {
    throw { code: "ENVIRONMENT_LIST_FAILED", message: error.message };
  }
  const aspects = (data ?? []).map((row) => asEnvironmentalAspect(row as Record<string, unknown>));
  const aspectIds = aspects.map((aspect) => aspect.id);
  const { data: measurementRows, error: measurementError } = aspectIds.length
    ? await db
        .from("EnvironmentalMeasurement")
        .select("*")
        .in("aspectId", aspectIds)
        .order("measurementDate", { ascending: false })
    : { data: [], error: null };
  if (measurementError) {
    throw { code: "ENVIRONMENT_MEASUREMENTS_FAILED", message: measurementError.message };
  }

  const latestByAspect = new Map<string, EnvironmentalMeasurement>();
  for (const row of measurementRows ?? []) {
    const measurement = asEnvironmentalMeasurement(row as Record<string, unknown>);
    if (!latestByAspect.has(measurement.aspectId)) {
      latestByAspect.set(measurement.aspectId, measurement);
    }
  }

  const people = await loadPeopleById(aspects.map((aspect) => aspect.ownerId ?? ""));
  const goals = await loadGoalsById(aspects.map((aspect) => aspect.goalId ?? ""));

  return aspects.map((aspect) => ({
    ...aspect,
    owner: aspect.ownerId ? people.get(aspect.ownerId) ?? null : null,
    goal: aspect.goalId ? goals.get(aspect.goalId) ?? null : null,
    measurements: latestByAspect.get(aspect.id) ? [latestByAspect.get(aspect.id)!] : [],
  }));
}

export async function loadEnvironmentalAspect(
  id: string,
  tenantId: string
): Promise<AspectDetail | null> {
  const db = getAdminDb();
  const { data, error } = await db
    .from("EnvironmentalAspect")
    .select("*")
    .eq("id", id)
    .eq("tenantId", tenantId)
    .maybeSingle();
  if (error) {
    throw { code: "ENVIRONMENT_LOOKUP_FAILED", message: error.message };
  }
  if (!data) return null;

  const aspect = asEnvironmentalAspect(data as Record<string, unknown>);
  const { data: measurementRows, error: measurementError } = await db
    .from("EnvironmentalMeasurement")
    .select("*")
    .eq("aspectId", aspect.id)
    .order("measurementDate", { ascending: false });
  if (measurementError) {
    throw { code: "ENVIRONMENT_MEASUREMENTS_FAILED", message: measurementError.message };
  }

  const measurements = (measurementRows ?? []).map((row) =>
    asEnvironmentalMeasurement(row as Record<string, unknown>)
  );
  const people = await loadPeopleById([
    aspect.ownerId ?? "",
    ...measurements.map((measurement) => measurement.responsibleId ?? ""),
  ]);
  const goals = await loadGoalsById([aspect.goalId ?? ""]);

  return {
    ...aspect,
    owner: aspect.ownerId ? people.get(aspect.ownerId) ?? null : null,
    goal: aspect.goalId ? goals.get(aspect.goalId) ?? null : null,
    measurements: measurements.map((measurement) => ({
      ...measurement,
      responsible: measurement.responsibleId ? people.get(measurement.responsibleId) ?? null : null,
    })),
  };
}

export async function countNonCompliantMeasurements(tenantId: string): Promise<number> {
  const { count, error } = await getAdminDb()
    .from("EnvironmentalMeasurement")
    .select("id", { count: "exact", head: true })
    .eq("tenantId", tenantId)
    .eq("status", "NON_COMPLIANT");
  if (error) {
    throw { code: "ENVIRONMENT_MEASUREMENTS_FAILED", message: error.message };
  }
  return count ?? 0;
}

export async function loadYearMeasurements(tenantId: string, year: number): Promise<YearMeasurement[]> {
  const start = new Date(year, 0, 1).toISOString();
  const end = new Date(year, 11, 31, 23, 59, 59).toISOString();
  const db = getAdminDb();
  const { data, error } = await db
    .from("EnvironmentalMeasurement")
    .select("*")
    .eq("tenantId", tenantId)
    .gte("measurementDate", start)
    .lte("measurementDate", end)
    .order("measurementDate", { ascending: false });
  if (error) {
    throw { code: "ENVIRONMENT_MEASUREMENTS_FAILED", message: error.message };
  }
  const measurements = (data ?? []).map((row) =>
    asEnvironmentalMeasurement(row as Record<string, unknown>)
  );
  const aspectIds = [...new Set(measurements.map((measurement) => measurement.aspectId))];
  const { data: aspectRows, error: aspectError } = aspectIds.length
    ? await db.from("EnvironmentalAspect").select("id, category, title").in("id", aspectIds)
    : { data: [], error: null };
  if (aspectError) {
    throw { code: "ENVIRONMENT_LIST_FAILED", message: aspectError.message };
  }
  const aspects = new Map(
    ((aspectRows ?? []) as Array<{ id: string; category: EnvironmentalAspect["category"]; title: string }>).map(
      (aspect) => [aspect.id, aspect]
    )
  );
  return measurements.flatMap((measurement) => {
    const aspect = aspects.get(measurement.aspectId);
    if (!aspect) return [];
    return [{ ...measurement, aspect: { category: aspect.category, title: aspect.title } }];
  });
}

export async function insertEnvironmentalAspect(input: {
  tenantId: string;
  title: string;
  description?: string | null;
  process?: string | null;
  location?: string | null;
  category: string;
  impactType: string;
  severity: number;
  likelihood: number;
  significanceScore: number;
  legalRequirement?: string | null;
  controlMeasures?: string | null;
  monitoringMethod?: string | null;
  monitoringFrequency?: string | null;
  ownerId?: string | null;
  goalId?: string | null;
  status?: string;
  nextReviewDate?: Date | null;
}): Promise<EnvironmentalAspect> {
  const now = nowIso();
  const { data, error } = await getAdminDb()
    .from("EnvironmentalAspect")
    .insert({
      id: createId(),
      tenantId: input.tenantId,
      title: input.title,
      description: input.description ?? null,
      process: input.process ?? null,
      location: input.location ?? null,
      category: input.category,
      impactType: input.impactType,
      severity: input.severity,
      likelihood: input.likelihood,
      significanceScore: input.significanceScore,
      legalRequirement: input.legalRequirement ?? null,
      controlMeasures: input.controlMeasures ?? null,
      monitoringMethod: input.monitoringMethod ?? null,
      monitoringFrequency: input.monitoringFrequency ?? null,
      ownerId: input.ownerId ?? null,
      goalId: input.goalId ?? null,
      status: input.status ?? "ACTIVE",
      nextReviewDate: input.nextReviewDate ? input.nextReviewDate.toISOString() : null,
      createdAt: now,
      updatedAt: now,
    })
    .select("*")
    .single();
  if (error || !data) {
    throw { code: "ENVIRONMENT_CREATE_FAILED", message: error?.message || "Could not create the environmental aspect" };
  }
  return asEnvironmentalAspect(data as Record<string, unknown>);
}

export async function updateEnvironmentalAspectRecord(
  id: string,
  tenantId: string,
  payload: Record<string, unknown>
): Promise<EnvironmentalAspect> {
  const { data, error } = await getAdminDb()
    .from("EnvironmentalAspect")
    .update({ ...payload, updatedAt: nowIso() })
    .eq("id", id)
    .eq("tenantId", tenantId)
    .select("*")
    .single();
  if (error || !data) {
    throw { code: "ENVIRONMENT_UPDATE_FAILED", message: error?.message || "Could not update the environmental aspect" };
  }
  return asEnvironmentalAspect(data as Record<string, unknown>);
}

export async function deleteEnvironmentalAspectRecord(id: string, tenantId: string): Promise<void> {
  const { error } = await getAdminDb()
    .from("EnvironmentalAspect")
    .delete()
    .eq("id", id)
    .eq("tenantId", tenantId);
  if (error) {
    throw { code: "ENVIRONMENT_DELETE_FAILED", message: error.message };
  }
}

export async function insertEnvironmentalMeasurement(input: {
  tenantId: string;
  aspectId: string;
  parameter: string;
  unit?: string | null;
  method?: string | null;
  limitValue?: number | null;
  targetValue?: number | null;
  measuredValue: number;
  measurementDate: Date;
  status: EnvironmentalMeasurementStatus;
  notes?: string | null;
  responsibleId?: string | null;
}): Promise<EnvironmentalMeasurement> {
  const now = nowIso();
  const { data, error } = await getAdminDb()
    .from("EnvironmentalMeasurement")
    .insert({
      id: createId(),
      tenantId: input.tenantId,
      aspectId: input.aspectId,
      parameter: input.parameter,
      unit: input.unit ?? null,
      method: input.method ?? null,
      limitValue: input.limitValue ?? null,
      targetValue: input.targetValue ?? null,
      measuredValue: input.measuredValue,
      measurementDate: input.measurementDate.toISOString(),
      status: input.status,
      notes: input.notes ?? null,
      responsibleId: input.responsibleId ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .select("*")
    .single();
  if (error || !data) {
    throw {
      code: "ENVIRONMENT_MEASUREMENT_CREATE_FAILED",
      message: error?.message || "Could not record the measurement",
    };
  }
  return asEnvironmentalMeasurement(data as Record<string, unknown>);
}

export async function loadEnvironmentReportData(tenantId: string, year: number) {
  const db = getAdminDb();
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31, 23, 59, 59);
  const startIso = start.toISOString();
  const endIso = end.toISOString();

  const { data: tenant, error: tenantError } = await db
    .from("Tenant")
    .select("id, name, orgNumber, address, city, postalCode, contactEmail, contactPhone, industry")
    .eq("id", tenantId)
    .maybeSingle();
  if (tenantError) {
    throw { code: "ENVIRONMENT_TENANT_FAILED", message: tenantError.message };
  }
  if (!tenant) {
    throw { code: "ENVIRONMENT_TENANT_NOT_FOUND", message: "Organisation not found" };
  }

  const { data: aspectRows, error: aspectError } = await db
    .from("EnvironmentalAspect")
    .select("*")
    .eq("tenantId", tenantId)
    .lte("createdAt", endIso)
    .order("significanceScore", { ascending: false });
  if (aspectError) {
    throw { code: "ENVIRONMENT_LIST_FAILED", message: aspectError.message };
  }
  const aspects = (aspectRows ?? []).map((row) => asEnvironmentalAspect(row as Record<string, unknown>));

  const measurements = await loadYearMeasurements(tenantId, year);
  const measurementsByAspect = new Map<string, EnvironmentalMeasurement[]>();
  for (const measurement of measurements) {
    const list = measurementsByAspect.get(measurement.aspectId) ?? [];
    list.push(measurement);
    measurementsByAspect.set(measurement.aspectId, list);
  }

  const people = await loadPeopleById([
    ...aspects.map((aspect) => aspect.ownerId ?? ""),
    ...measurements.map((measurement) => measurement.responsibleId ?? ""),
  ]);
  const { data: goalRows, error: goalLookupError } = aspects.some((aspect) => aspect.goalId)
    ? await db
        .from("Goal")
        .select("id, title, targetValue, currentValue, unit")
        .in(
          "id",
          aspects.map((aspect) => aspect.goalId).filter((id): id is string => Boolean(id))
        )
    : { data: [], error: null };
  if (goalLookupError) {
    throw { code: "ENVIRONMENT_GOALS_FAILED", message: goalLookupError.message };
  }
  const goalById = new Map(
    ((goalRows ?? []) as Array<{
      id: string;
      title: string;
      targetValue: number | null;
      currentValue: number | null;
      unit: string | null;
    }>).map((goal) => [goal.id, goal])
  );

  const { data: environmentGoals, error: envGoalError } = await db
    .from("Goal")
    .select("*")
    .eq("tenantId", tenantId)
    .eq("category", "ENVIRONMENT")
    .eq("year", year);
  if (envGoalError) {
    throw { code: "ENVIRONMENT_GOALS_FAILED", message: envGoalError.message };
  }
  const goals = (environmentGoals ?? []) as Goal[];
  const goalIds = goals.map((goal) => goal.id);
  const { data: kpiRows, error: kpiError } = goalIds.length
    ? await db
        .from("KpiMeasurement")
        .select("goalId, measurementDate, value")
        .in("goalId", goalIds)
        .order("measurementDate", { ascending: true })
    : { data: [], error: null };
  if (kpiError) {
    throw { code: "ENVIRONMENT_GOALS_FAILED", message: kpiError.message };
  }
  const kpisByGoal = new Map<string, Array<{ measurementDate: Date; value: number }>>();
  for (const row of kpiRows ?? []) {
    const list = kpisByGoal.get(row.goalId as string) ?? [];
    list.push({
      measurementDate: parseDate(row.measurementDate) ?? new Date(0),
      value: Number(row.value ?? 0),
    });
    kpisByGoal.set(row.goalId as string, list);
  }

  const { data: measureRows, error: measureError } = await db
    .from("Measure")
    .select("*")
    .eq("tenantId", tenantId)
    .not("environmentalAspectId", "is", null)
    .order("createdAt", { ascending: false });
  if (measureError) {
    throw { code: "ENVIRONMENT_MEASURES_FAILED", message: measureError.message };
  }
  const measures = ((measureRows ?? []) as Measure[]).filter((measure) => {
    const created = parseDate(measure.createdAt);
    const completed = parseDate(measure.completedAt);
    return (
      (created && created >= start && created <= end) ||
      (completed && completed >= start && completed <= end)
    );
  });
  const measurePeople = await loadPeopleById(measures.map((measure) => measure.responsibleId ?? ""));
  const aspectById = new Map(aspects.map((aspect) => [aspect.id, aspect]));

  return {
    tenant,
    year,
    aspects: aspects.map((aspect) => ({
      ...aspect,
      owner: aspect.ownerId ? people.get(aspect.ownerId) ?? null : null,
      goal: aspect.goalId ? goalById.get(aspect.goalId) ?? null : null,
      measurements: (measurementsByAspect.get(aspect.id) ?? []).slice().reverse(),
    })),
    measurements: measurements
      .slice()
      .reverse()
      .map((measurement) => ({
        ...measurement,
        aspect: measurement.aspect,
        responsible: measurement.responsibleId
          ? { name: people.get(measurement.responsibleId)?.name ?? null }
          : null,
      })),
    goals: goals.map((goal) => ({
      ...goal,
      measurements: kpisByGoal.get(goal.id) ?? [],
    })),
    measures: measures.map((measure) => {
      const linked = measure.environmentalAspectId
        ? aspectById.get(measure.environmentalAspectId)
        : null;
      return {
        ...measure,
        responsible: { name: measurePeople.get(measure.responsibleId ?? "")?.name ?? null },
        environmentalAspect: linked
          ? { title: linked.title, category: linked.category }
          : null,
      };
    }),
  };
}
