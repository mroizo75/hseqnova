import { getAdminDb } from "@/lib/supabase/admin";
import { createId } from "@/lib/ids";
import type { Measure } from "@prisma/client";

export type MeasurePerson = { id: string; name: string | null; email: string };
export type MeasureRelated = { id: string; title: string };

export type MeasureListItem = Measure & {
  risk: MeasureRelated | null;
  incident: MeasureRelated | null;
  audit: MeasureRelated | null;
  goal: MeasureRelated | null;
  fireDrill: MeasureRelated | null;
  responsible: MeasurePerson | null;
};

function nowIso(): string {
  return new Date().toISOString();
}

function toIso(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function parseDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

function asMeasure(row: Record<string, unknown>): Measure {
  return {
    ...row,
    dueAt: parseDate(row.dueAt) ?? new Date(0),
    completedAt: parseDate(row.completedAt),
    createdAt: parseDate(row.createdAt) ?? new Date(0),
    updatedAt: parseDate(row.updatedAt) ?? new Date(0),
  } as Measure;
}

async function insertMeasureAudit(input: {
  tenantId: string;
  userId: string;
  action: string;
  resource: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const { error } = await getAdminDb().from("AuditLog").insert({
    id: createId(),
    tenantId: input.tenantId,
    userId: input.userId,
    action: input.action,
    resource: input.resource,
    metadata: input.metadata ? JSON.stringify(input.metadata) : null,
    createdAt: nowIso(),
  });
  if (error) {
    throw { code: "AUDIT_LOG_FAILED", message: error.message };
  }
}

export async function loadMeasurePeople(tenantId: string): Promise<MeasurePerson[]> {
  const { data: memberships, error } = await getAdminDb()
    .from("UserTenant")
    .select("userId")
    .eq("tenantId", tenantId);
  if (error) {
    throw { code: "MEASURE_PEOPLE_FAILED", message: error.message };
  }
  const userIds = [...new Set((memberships ?? []).map((row) => String(row.userId)))];
  if (userIds.length === 0) return [];

  const { data: users, error: userError } = await getAdminDb()
    .from("User")
    .select("id, name, email")
    .in("id", userIds);
  if (userError) {
    throw { code: "MEASURE_PEOPLE_FAILED", message: userError.message };
  }
  return ((users ?? []) as Array<{ id: string; name: string | null; email: string }>).map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
  }));
}

async function loadTitles(
  table: "Risk" | "Incident" | "Audit" | "Goal" | "FireDrill",
  ids: string[],
): Promise<Map<string, string>> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return new Map();
  const { data, error } = await getAdminDb().from(table).select("id, title").in("id", unique);
  if (error) {
    throw { code: "MEASURE_RELATED_FAILED", message: error.message };
  }
  return new Map((data ?? []).map((row) => [String(row.id), String(row.title ?? "")]));
}

async function attachRelated(tenantId: string, rows: Measure[]): Promise<MeasureListItem[]> {
  if (rows.length === 0) return [];
  const [risks, incidents, audits, goals, fireDrills, people] = await Promise.all([
    loadTitles("Risk", rows.map((row) => row.riskId ?? "").filter(Boolean)),
    loadTitles("Incident", rows.map((row) => row.incidentId ?? "").filter(Boolean)),
    loadTitles("Audit", rows.map((row) => row.auditId ?? "").filter(Boolean)),
    loadTitles("Goal", rows.map((row) => row.goalId ?? "").filter(Boolean)),
    loadTitles("FireDrill", rows.map((row) => row.fireDrillId ?? "").filter(Boolean)),
    loadMeasurePeople(tenantId),
  ]);
  const peopleById = new Map(people.map((person) => [person.id, person]));

  return rows.map((row) => ({
    ...row,
    risk: row.riskId && risks.has(row.riskId) ? { id: row.riskId, title: risks.get(row.riskId) ?? "" } : null,
    incident:
      row.incidentId && incidents.has(row.incidentId)
        ? { id: row.incidentId, title: incidents.get(row.incidentId) ?? "" }
        : null,
    audit: row.auditId && audits.has(row.auditId) ? { id: row.auditId, title: audits.get(row.auditId) ?? "" } : null,
    goal: row.goalId && goals.has(row.goalId) ? { id: row.goalId, title: goals.get(row.goalId) ?? "" } : null,
    fireDrill:
      row.fireDrillId && fireDrills.has(row.fireDrillId)
        ? { id: row.fireDrillId, title: fireDrills.get(row.fireDrillId) ?? "" }
        : null,
    responsible: peopleById.get(row.responsibleId) ?? null,
  }));
}

export async function loadMeasuresForTenant(
  tenantId: string,
  opts?: { riskId?: string },
): Promise<MeasureListItem[]> {
  let query = getAdminDb().from("Measure").select("*").eq("tenantId", tenantId);
  if (opts?.riskId) {
    query = query.eq("riskId", opts.riskId);
  }
  const { data, error } = await query.order("status", { ascending: true }).order("dueAt", { ascending: true });
  if (error) {
    throw { code: "MEASURE_LIST_FAILED", message: error.message };
  }
  const measures = (data ?? []).map((row) => asMeasure(row as Record<string, unknown>));
  return attachRelated(tenantId, measures);
}

export async function loadMeasureById(id: string, tenantId: string): Promise<MeasureListItem | null> {
  const { data, error } = await getAdminDb()
    .from("Measure")
    .select("*")
    .eq("id", id)
    .eq("tenantId", tenantId)
    .maybeSingle();
  if (error) {
    throw { code: "MEASURE_LOOKUP_FAILED", message: error.message };
  }
  if (!data) return null;
  const [item] = await attachRelated(tenantId, [asMeasure(data as Record<string, unknown>)]);
  return item ?? null;
}

export async function loadFireDrillForTenant(
  fireDrillId: string,
  tenantId: string,
): Promise<{ id: string; title: string } | null> {
  const { data, error } = await getAdminDb()
    .from("FireDrill")
    .select("id, title")
    .eq("id", fireDrillId)
    .eq("tenantId", tenantId)
    .maybeSingle();
  if (error) {
    throw { code: "FIRE_DRILL_LOOKUP_FAILED", message: error.message };
  }
  if (!data) return null;
  return { id: String(data.id), title: String(data.title ?? "") };
}

export async function loadProjectForTenant(
  projectId: string,
  tenantId: string,
): Promise<{ id: string; name: string } | null> {
  const { data, error } = await getAdminDb()
    .from("Project")
    .select("id, name")
    .eq("id", projectId)
    .eq("tenantId", tenantId)
    .maybeSingle();
  if (error) {
    throw { code: "PROJECT_LOOKUP_FAILED", message: error.message };
  }
  if (!data) return null;
  return { id: String(data.id), name: String(data.name ?? "") };
}

export async function insertMeasure(input: {
  tenantId: string;
  projectId?: string | null;
  riskId?: string | null;
  incidentId?: string | null;
  auditId?: string | null;
  goalId?: string | null;
  fireDrillId?: string | null;
  title: string;
  description?: string | null;
  dueAt: Date | string;
  responsibleId: string;
  status?: string;
  category?: string;
  followUpFrequency?: string | null;
  costEstimate?: number | null;
  benefitEstimate?: number | null;
}): Promise<Measure> {
  const now = nowIso();
  const { data, error } = await getAdminDb()
    .from("Measure")
    .insert({
      id: createId(),
      tenantId: input.tenantId,
      projectId: input.projectId ?? null,
      riskId: input.riskId ?? null,
      incidentId: input.incidentId ?? null,
      auditId: input.auditId ?? null,
      goalId: input.goalId ?? null,
      fireDrillId: input.fireDrillId ?? null,
      title: input.title,
      description: input.description ?? null,
      dueAt: toIso(input.dueAt),
      responsibleId: input.responsibleId,
      status: input.status ?? "PENDING",
      category: input.category ?? "CORRECTIVE",
      followUpFrequency: input.followUpFrequency ?? "ANNUAL",
      costEstimate: input.costEstimate ?? null,
      benefitEstimate: input.benefitEstimate ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .select("*")
    .single();
  if (error || !data) {
    throw { code: "MEASURE_CREATE_FAILED", message: error?.message || "Could not create the action" };
  }
  return asMeasure(data as Record<string, unknown>);
}

export async function updateMeasureRecord(
  id: string,
  tenantId: string,
  patch: Record<string, unknown>,
): Promise<Measure> {
  const serialized: Record<string, unknown> = { updatedAt: nowIso() };
  for (const [key, value] of Object.entries(patch)) {
    if (key === "id" || key === "tenantId") continue;
    serialized[key] = value instanceof Date ? value.toISOString() : value;
  }
  const { data, error } = await getAdminDb()
    .from("Measure")
    .update(serialized)
    .eq("id", id)
    .eq("tenantId", tenantId)
    .select("*")
    .single();
  if (error || !data) {
    throw { code: "MEASURE_UPDATE_FAILED", message: error?.message || "Could not update the action" };
  }
  return asMeasure(data as Record<string, unknown>);
}

export async function deleteMeasureRecord(id: string, tenantId: string): Promise<void> {
  const { error } = await getAdminDb().from("Measure").delete().eq("id", id).eq("tenantId", tenantId);
  if (error) {
    throw { code: "MEASURE_DELETE_FAILED", message: error.message };
  }
}

export async function markRiskMitigating(riskId: string, tenantId: string): Promise<void> {
  const { error } = await getAdminDb()
    .from("Risk")
    .update({ status: "MITIGATING", updatedAt: nowIso() })
    .eq("id", riskId)
    .eq("tenantId", tenantId);
  if (error) {
    throw { code: "RISK_UPDATE_FAILED", message: error.message };
  }
}

export async function closeRiskIfAllMeasuresDone(riskId: string, tenantId: string): Promise<void> {
  const { data, error } = await getAdminDb()
    .from("Measure")
    .select("status")
    .eq("riskId", riskId)
    .eq("tenantId", tenantId);
  if (error) {
    throw { code: "MEASURE_LIST_FAILED", message: error.message };
  }
  const allDone = (data ?? []).length > 0 && (data ?? []).every((row) => row.status === "DONE");
  if (!allDone) return;
  const { error: updateError } = await getAdminDb()
    .from("Risk")
    .update({ status: "CLOSED", updatedAt: nowIso() })
    .eq("id", riskId)
    .eq("tenantId", tenantId);
  if (updateError) {
    throw { code: "RISK_UPDATE_FAILED", message: updateError.message };
  }
}

export async function updateIncidentActionStage(
  incidentId: string,
  tenantId: string,
  stage: "ACTIONS_DEFINED" | "ACTIONS_COMPLETE",
  status?: string,
): Promise<void> {
  const patch: Record<string, unknown> = { stage, updatedAt: nowIso() };
  if (status) patch.status = status;
  const { error } = await getAdminDb()
    .from("Incident")
    .update(patch)
    .eq("id", incidentId)
    .eq("tenantId", tenantId);
  if (error) {
    throw { code: "INCIDENT_UPDATE_FAILED", message: error.message };
  }
}

export async function incidentMeasuresAllDone(incidentId: string, tenantId: string): Promise<boolean> {
  const { data, error } = await getAdminDb()
    .from("Measure")
    .select("status")
    .eq("incidentId", incidentId)
    .eq("tenantId", tenantId);
  if (error) {
    throw { code: "MEASURE_LIST_FAILED", message: error.message };
  }
  return (data ?? []).length > 0 && (data ?? []).every((row) => row.status === "DONE");
}

export async function logMeasureAction(input: {
  tenantId: string;
  userId: string;
  action: string;
  resource: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await insertMeasureAudit(input);
}
