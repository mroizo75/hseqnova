import { getAdminDb } from "@/lib/supabase/admin";
import { createId } from "@/lib/ids";

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

function toDateOnly(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function asBool(value: unknown): boolean {
  return value === true || value === "true";
}

export type ShaPlanRow = Record<string, unknown> & {
  id: string;
  tenantId: string;
  projectId: string;
  status: string;
  organizationChart: string | null;
  progressPlan: string | null;
  specificMeasures: string | null;
  changeProcedure: string | null;
  builderName: string | null;
  builderRepresentativeName: string | null;
  builderRepresentativeContact: string | null;
  coordinatorPlanningName: string | null;
  coordinatorExecutionName: string | null;
  conflictAssessmentDocumented: boolean;
  availableOnSite: boolean;
  lastReviewedAt: Date | null;
};

export type PreNotificationRow = Record<string, unknown> & {
  id: string;
  tenantId: string;
  projectId: string;
  status: string;
  sentAt: Date | null;
  submissionDate: Date | null;
  projectAddress: string;
  projectType: string;
  builderName: string;
  builderOrgNumber: string | null;
  builderAddress: string | null;
  builderPhone: string | null;
  builderRepresentativeName: string | null;
  builderRepresentativePhone: string | null;
  coordinators: string | null;
  designers: string | null;
  contractors: string | null;
  expectedStartDate: Date;
  expectedEndDate: Date | null;
  maxWorkersSimultaneous: number | null;
  plannedBusinessesCount: number | null;
  visibleAtSite: boolean;
};

export type RosterEntryRow = {
  id: string;
  tenantId: string;
  projectId: string;
  fullName: string;
  birthDate: Date;
  employerName: string;
  employerOrgNumber: string | null;
  hiringCompanyName: string | null;
  hmsCardNumber: string | null;
  startedAtSiteDate: Date | null;
  endedAtSiteDate: Date | null;
  isActive: boolean;
  notes: string | null;
};

export type RosterCheckRow = {
  id: string;
  tenantId: string;
  projectId: string;
  checkedDate: Date;
  checkedById: string;
  notes: string | null;
  checkedBy: { id: string; name: string | null; email: string } | null;
};

export type CdmEmployeeOption = {
  userId: string;
  name: string;
  email: string;
  employeeNumber: string | null;
  phone: string | null;
};

export type CdmChangeLogRow = {
  id: string;
  action: string;
  userId: string;
  metadata: string | null;
  createdAt: Date;
};

export type CdmOverviewProject = {
  id: string;
  name: string;
  location: string | null;
  hasShaPlan: boolean;
  hasPreNotification: boolean;
  activeWorkers: number;
  lastCheckDate: Date | null;
};

function asShaPlan(row: Record<string, unknown>): ShaPlanRow {
  return {
    ...row,
    conflictAssessmentDocumented: asBool(row.conflictAssessmentDocumented),
    availableOnSite: asBool(row.availableOnSite),
    lastReviewedAt: parseDate(row.lastReviewedAt),
    createdAt: parseDate(row.createdAt) ?? new Date(0),
    updatedAt: parseDate(row.updatedAt) ?? new Date(0),
  } as unknown as ShaPlanRow;
}

function asPreNotification(row: Record<string, unknown>): PreNotificationRow {
  return {
    ...row,
    sentAt: parseDate(row.sentAt),
    submissionDate: parseDate(row.submissionDate),
    expectedStartDate: parseDate(row.expectedStartDate) ?? new Date(0),
    expectedEndDate: parseDate(row.expectedEndDate),
    maxWorkersSimultaneous: row.maxWorkersSimultaneous == null ? null : Number(row.maxWorkersSimultaneous),
    plannedBusinessesCount: row.plannedBusinessesCount == null ? null : Number(row.plannedBusinessesCount),
    visibleAtSite: asBool(row.visibleAtSite),
    createdAt: parseDate(row.createdAt) ?? new Date(0),
    updatedAt: parseDate(row.updatedAt) ?? new Date(0),
  } as unknown as PreNotificationRow;
}

function asRosterEntry(row: Record<string, unknown>): RosterEntryRow {
  return {
    id: row.id as string,
    tenantId: row.tenantId as string,
    projectId: row.projectId as string,
    fullName: row.fullName as string,
    birthDate: parseDate(row.birthDate) ?? new Date(0),
    employerName: row.employerName as string,
    employerOrgNumber: (row.employerOrgNumber as string | null) ?? null,
    hiringCompanyName: (row.hiringCompanyName as string | null) ?? null,
    hmsCardNumber: (row.hmsCardNumber as string | null) ?? null,
    startedAtSiteDate: parseDate(row.startedAtSiteDate),
    endedAtSiteDate: parseDate(row.endedAtSiteDate),
    isActive: asBool(row.isActive),
    notes: (row.notes as string | null) ?? null,
  };
}

export async function loadShaPlan(projectId: string): Promise<ShaPlanRow | null> {
  const { data, error } = await getAdminDb()
    .from("ConstructionShaPlan")
    .select("*")
    .eq("projectId", projectId)
    .maybeSingle();
  if (error) {
    throw { code: "SHA_PLAN_LOOKUP_FAILED", message: error.message };
  }
  return data ? asShaPlan(data as Record<string, unknown>) : null;
}

export async function loadPreNotification(projectId: string): Promise<PreNotificationRow | null> {
  const { data, error } = await getAdminDb()
    .from("ConstructionPreNotification")
    .select("*")
    .eq("projectId", projectId)
    .maybeSingle();
  if (error) {
    throw { code: "F10_LOOKUP_FAILED", message: error.message };
  }
  return data ? asPreNotification(data as Record<string, unknown>) : null;
}

export async function loadRosterEntries(projectId: string, tenantId: string): Promise<RosterEntryRow[]> {
  const { data, error } = await getAdminDb()
    .from("ConstructionRosterEntry")
    .select("*")
    .eq("projectId", projectId)
    .eq("tenantId", tenantId)
    .order("isActive", { ascending: false })
    .order("fullName", { ascending: true });
  if (error) {
    throw { code: "ROSTER_LIST_FAILED", message: error.message };
  }
  return (data ?? []).map((row) => asRosterEntry(row as Record<string, unknown>));
}

export async function loadRosterChecks(
  projectId: string,
  tenantId: string,
  limit?: number,
): Promise<RosterCheckRow[]> {
  let query = getAdminDb()
    .from("ConstructionRosterDailyCheck")
    .select("*")
    .eq("projectId", projectId)
    .eq("tenantId", tenantId)
    .order("checkedDate", { ascending: false });
  if (limit) query = query.limit(limit);
  const { data, error } = await query;
  if (error) {
    throw { code: "ROSTER_CHECK_LIST_FAILED", message: error.message };
  }
  const rows = data ?? [];
  const userIds = [...new Set(rows.map((row) => row.checkedById as string))];
  const users =
    userIds.length > 0
      ? await getAdminDb().from("User").select("id, name, email").in("id", userIds)
      : { data: [], error: null };
  if (users.error) {
    throw { code: "ROSTER_CHECK_LIST_FAILED", message: users.error.message };
  }
  const userById = new Map(
    (users.data ?? []).map((row) => [
      row.id as string,
      { id: row.id as string, name: (row.name as string | null) ?? null, email: row.email as string },
    ]),
  );
  return rows.map((row) => ({
    id: row.id as string,
    tenantId: row.tenantId as string,
    projectId: row.projectId as string,
    checkedDate: parseDate(row.checkedDate) ?? new Date(0),
    checkedById: row.checkedById as string,
    notes: (row.notes as string | null) ?? null,
    checkedBy: userById.get(row.checkedById as string) ?? null,
  }));
}

export async function loadCdmEmployees(tenantId: string): Promise<CdmEmployeeOption[]> {
  const { data, error } = await getAdminDb()
    .from("UserTenant")
    .select("userId, employeeNumber, displayName, phone")
    .eq("tenantId", tenantId);
  if (error) {
    throw { code: "CDM_EMPLOYEE_LIST_FAILED", message: error.message };
  }
  const rows = data ?? [];
  const userIds = rows.map((row) => row.userId as string);
  const users = userIds.length
    ? await getAdminDb().from("User").select("id, name, email, phone").in("id", userIds)
    : { data: [], error: null };
  if (users.error) {
    throw { code: "CDM_EMPLOYEE_LIST_FAILED", message: users.error.message };
  }
  const userById = new Map((users.data ?? []).map((row) => [row.id as string, row]));
  return rows
    .map((row) => {
      const user = userById.get(row.userId as string);
      const name =
        (row.displayName as string | null) || (user?.name as string | null) || (user?.email as string) || "";
      return {
        userId: row.userId as string,
        name,
        email: (user?.email as string) ?? "",
        employeeNumber: (row.employeeNumber as string | null) ?? null,
        phone: ((row.phone as string | null) || (user?.phone as string | null)) ?? null,
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name, "en-GB"));
}

export async function loadCdmChangeLogs(tenantId: string, projectId: string): Promise<CdmChangeLogRow[]> {
  const { data, error } = await getAdminDb()
    .from("AuditLog")
    .select("id, action, userId, metadata, createdAt")
    .eq("tenantId", tenantId)
    .eq("resource", `Project:${projectId}`)
    .in("action", ["CONSTRUCTION_SHA_PLAN_UPDATED", "CONSTRUCTION_PRE_NOTIFICATION_UPDATED"])
    .order("createdAt", { ascending: false })
    .limit(30);
  if (error) {
    throw { code: "CDM_AUDIT_FAILED", message: error.message };
  }
  return (data ?? []).map((row) => ({
    id: row.id as string,
    action: row.action as string,
    userId: row.userId as string,
    metadata: (row.metadata as string | null) ?? null,
    createdAt: parseDate(row.createdAt) ?? new Date(0),
  }));
}

export async function loadUsersByIds(
  ids: string[],
): Promise<Map<string, { id: string; name: string | null; email: string }>> {
  const unique = [...new Set(ids.filter(Boolean))];
  const map = new Map<string, { id: string; name: string | null; email: string }>();
  if (unique.length === 0) return map;
  const { data, error } = await getAdminDb().from("User").select("id, name, email").in("id", unique);
  if (error) {
    throw { code: "CDM_USER_LOOKUP_FAILED", message: error.message };
  }
  for (const row of data ?? []) {
    map.set(row.id as string, {
      id: row.id as string,
      name: (row.name as string | null) ?? null,
      email: row.email as string,
    });
  }
  return map;
}

export async function loadTenantOrg(tenantId: string): Promise<{ name: string; orgNumber: string | null } | null> {
  const { data, error } = await getAdminDb()
    .from("Tenant")
    .select("name, orgNumber")
    .eq("id", tenantId)
    .maybeSingle();
  if (error) {
    throw { code: "TENANT_LOOKUP_FAILED", message: error.message };
  }
  if (!data) return null;
  return { name: data.name as string, orgNumber: (data.orgNumber as string | null) ?? null };
}

export async function upsertShaPlan(input: {
  tenantId: string;
  projectId: string;
  create: Record<string, unknown>;
  update: Record<string, unknown>;
}): Promise<void> {
  const existing = await loadShaPlan(input.projectId);
  const now = nowIso();
  if (!existing) {
    const { error } = await getAdminDb().from("ConstructionShaPlan").insert({
      id: createId(),
      tenantId: input.tenantId,
      projectId: input.projectId,
      ...serializeDates(input.create),
      createdAt: now,
      updatedAt: now,
    });
    if (error) {
      throw { code: "SHA_PLAN_CREATE_FAILED", message: error.message };
    }
    return;
  }
  const { error } = await getAdminDb()
    .from("ConstructionShaPlan")
    .update({ ...serializeDates(input.update), updatedAt: now })
    .eq("id", existing.id);
  if (error) {
    throw { code: "SHA_PLAN_UPDATE_FAILED", message: error.message };
  }
}

export async function upsertPreNotification(input: {
  tenantId: string;
  projectId: string;
  create: Record<string, unknown>;
  update: Record<string, unknown>;
}): Promise<void> {
  const existing = await loadPreNotification(input.projectId);
  const now = nowIso();
  if (!existing) {
    const { error } = await getAdminDb().from("ConstructionPreNotification").insert({
      id: createId(),
      tenantId: input.tenantId,
      projectId: input.projectId,
      ...serializeDates(input.create),
      createdAt: now,
      updatedAt: now,
    });
    if (error) {
      throw { code: "F10_CREATE_FAILED", message: error.message };
    }
    return;
  }
  const { error } = await getAdminDb()
    .from("ConstructionPreNotification")
    .update({ ...serializeDates(input.update), updatedAt: now })
    .eq("id", existing.id);
  if (error) {
    throw { code: "F10_UPDATE_FAILED", message: error.message };
  }
}

export async function insertRosterEntry(input: Record<string, unknown>): Promise<RosterEntryRow> {
  const now = nowIso();
  const { data, error } = await getAdminDb()
    .from("ConstructionRosterEntry")
    .insert({
      id: createId(),
      ...serializeDates(input),
      createdAt: now,
      updatedAt: now,
    })
    .select("*")
    .single();
  if (error || !data) {
    throw { code: "ROSTER_CREATE_FAILED", message: error?.message || "Could not add the site register entry" };
  }
  return asRosterEntry(data as Record<string, unknown>);
}

export async function loadRosterEntry(
  id: string,
  projectId: string,
  tenantId: string,
): Promise<RosterEntryRow | null> {
  const { data, error } = await getAdminDb()
    .from("ConstructionRosterEntry")
    .select("*")
    .eq("id", id)
    .eq("projectId", projectId)
    .eq("tenantId", tenantId)
    .maybeSingle();
  if (error) {
    throw { code: "ROSTER_LOOKUP_FAILED", message: error.message };
  }
  return data ? asRosterEntry(data as Record<string, unknown>) : null;
}

export async function updateRosterEntry(id: string, patch: Record<string, unknown>): Promise<RosterEntryRow> {
  const { data, error } = await getAdminDb()
    .from("ConstructionRosterEntry")
    .update({ ...serializeDates(patch), updatedAt: nowIso() })
    .eq("id", id)
    .select("*")
    .single();
  if (error || !data) {
    throw { code: "ROSTER_UPDATE_FAILED", message: error?.message || "Could not update the site register entry" };
  }
  return asRosterEntry(data as Record<string, unknown>);
}

export async function upsertDailyCheck(input: {
  tenantId: string;
  projectId: string;
  checkedDate: string;
  checkedById: string;
  notes: string | null;
}): Promise<RosterCheckRow> {
  const dateOnly = toDateOnly(input.checkedDate);
  if (!dateOnly) {
    throw { code: "ROSTER_CHECK_INVALID_DATE", message: "A valid check date is required" };
  }
  const existing = await getAdminDb()
    .from("ConstructionRosterDailyCheck")
    .select("*")
    .eq("projectId", input.projectId)
    .eq("checkedDate", dateOnly)
    .maybeSingle();
  if (existing.error) {
    throw { code: "ROSTER_CHECK_LOOKUP_FAILED", message: existing.error.message };
  }

  const now = nowIso();
  const row = existing.data
    ? await getAdminDb()
        .from("ConstructionRosterDailyCheck")
        .update({
          checkedById: input.checkedById,
          notes: input.notes,
          updatedAt: now,
        })
        .eq("id", existing.data.id as string)
        .select("*")
        .single()
    : await getAdminDb()
        .from("ConstructionRosterDailyCheck")
        .insert({
          id: createId(),
          tenantId: input.tenantId,
          projectId: input.projectId,
          checkedDate: dateOnly,
          checkedById: input.checkedById,
          notes: input.notes,
          createdAt: now,
          updatedAt: now,
        })
        .select("*")
        .single();

  if (row.error || !row.data) {
    throw { code: "ROSTER_CHECK_SAVE_FAILED", message: row.error?.message || "Could not save the daily check" };
  }

  const users = await loadUsersByIds([input.checkedById]);
  return {
    id: row.data.id as string,
    tenantId: row.data.tenantId as string,
    projectId: row.data.projectId as string,
    checkedDate: parseDate(row.data.checkedDate) ?? new Date(0),
    checkedById: row.data.checkedById as string,
    notes: (row.data.notes as string | null) ?? null,
    checkedBy: users.get(input.checkedById) ?? null,
  };
}

export async function loadCdmOverviewProjects(tenantId: string): Promise<CdmOverviewProject[]> {
  const db = getAdminDb();
  const [projects, shaPlans, notifications, roster, checks] = await Promise.all([
    db.from("Project").select("id, name, location").eq("tenantId", tenantId).order("name", { ascending: true }),
    db.from("ConstructionShaPlan").select("projectId").eq("tenantId", tenantId),
    db.from("ConstructionPreNotification").select("projectId").eq("tenantId", tenantId),
    db.from("ConstructionRosterEntry").select("projectId").eq("tenantId", tenantId).eq("isActive", true),
    db.from("ConstructionRosterDailyCheck").select("projectId, checkedDate").eq("tenantId", tenantId),
  ]);
  if (projects.error) throw { code: "CDM_OVERVIEW_FAILED", message: projects.error.message };
  if (shaPlans.error) throw { code: "CDM_OVERVIEW_FAILED", message: shaPlans.error.message };
  if (notifications.error) throw { code: "CDM_OVERVIEW_FAILED", message: notifications.error.message };
  if (roster.error) throw { code: "CDM_OVERVIEW_FAILED", message: roster.error.message };
  if (checks.error) throw { code: "CDM_OVERVIEW_FAILED", message: checks.error.message };

  const shaIds = new Set((shaPlans.data ?? []).map((row) => row.projectId as string));
  const f10Ids = new Set((notifications.data ?? []).map((row) => row.projectId as string));
  const activeByProject = new Map<string, number>();
  for (const row of roster.data ?? []) {
    const projectId = row.projectId as string;
    activeByProject.set(projectId, (activeByProject.get(projectId) ?? 0) + 1);
  }
  const lastCheckByProject = new Map<string, Date>();
  for (const row of checks.data ?? []) {
    const projectId = row.projectId as string;
    const checked = parseDate(row.checkedDate);
    if (!checked) continue;
    const current = lastCheckByProject.get(projectId);
    if (!current || checked > current) {
      lastCheckByProject.set(projectId, checked);
    }
  }

  return (projects.data ?? []).map((row) => ({
    id: row.id as string,
    name: row.name as string,
    location: (row.location as string | null) ?? null,
    hasShaPlan: shaIds.has(row.id as string),
    hasPreNotification: f10Ids.has(row.id as string),
    activeWorkers: activeByProject.get(row.id as string) ?? 0,
    lastCheckDate: lastCheckByProject.get(row.id as string) ?? null,
  }));
}

function serializeDates(patch: Record<string, unknown>): Record<string, unknown> {
  const dateOnlyKeys = new Set([
    "birthDate",
    "startedAtSiteDate",
    "endedAtSiteDate",
    "checkedDate",
  ]);
  const serialized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(patch)) {
    if (value instanceof Date) {
      serialized[key] = dateOnlyKeys.has(key) ? toDateOnly(value) : value.toISOString();
      continue;
    }
    serialized[key] = value;
  }
  return serialized;
}

export { toIso, toDateOnly };
