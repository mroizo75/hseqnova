import { getAdminDb } from "@/lib/supabase/admin";
import { createId } from "@/lib/ids";
import type { FireDrillStatus, FireDrillType } from "@/features/fire-drills/schemas/fire-drill.schema";

export type FireDrillMeasureSummary = {
  id: string;
  status: string;
  fireDrillId: string;
};

export type FireDrillListItem = {
  id: string;
  title: string;
  drillType: FireDrillType;
  isAnnounced: boolean;
  status: FireDrillStatus;
  plannedDate: string;
  completedAt: string | null;
  location: string;
  responsibleId: string;
  objectives: string;
  actualParticipantCount: number | null;
  evaluatedAt: string | null;
  measures: Array<{ id: string; status: string }>;
};

export type FireDrillRecord = Record<string, unknown> & {
  id: string;
  tenantId: string;
  status: FireDrillStatus;
};

export type FireDrillWithMeasures = FireDrillRecord & {
  measures: Array<{
    id: string;
    title: string;
    status: string;
    dueAt: string;
    responsible: { id: string; name: string | null; email: string } | null;
  }>;
};

function nowIso(): string {
  return new Date().toISOString();
}

function asIso(value: unknown): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function serializePatch(patch: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(patch)) {
    out[key] = value instanceof Date ? value.toISOString() : value;
  }
  return out;
}

export function fireDrillDbPatchFromUpdate(validated: {
  title?: string;
  drillType?: FireDrillType;
  isAnnounced?: boolean;
  plannedDate?: Date;
  location?: string;
  responsibleId?: string;
  objectives?: string;
  scenario?: string;
  riskAssessment?: string;
  participantIds?: string[];
  status?: FireDrillStatus;
  sharedPremises?: boolean;
  buildingOwnerCoordinated?: boolean;
  buildingOwnerName?: string;
  otherTenantsInformed?: boolean;
  fullBuildingEvacuation?: boolean;
  totalBuildingOccupants?: number;
}): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  if (validated.title !== undefined) patch.title = validated.title;
  if (validated.drillType !== undefined) patch.drillType = validated.drillType;
  if (validated.isAnnounced !== undefined) patch.isAnnounced = validated.isAnnounced;
  if (validated.plannedDate !== undefined) patch.plannedDate = validated.plannedDate.toISOString();
  if (validated.location !== undefined) patch.location = validated.location;
  if (validated.responsibleId !== undefined) patch.responsibleId = validated.responsibleId;
  if (validated.objectives !== undefined) patch.objectives = validated.objectives;
  if (validated.scenario !== undefined) patch.scenario = validated.scenario;
  if (validated.riskAssessment !== undefined) patch.riskAssessment = validated.riskAssessment;
  if (validated.participantIds !== undefined) {
    patch.participantIds = JSON.stringify(validated.participantIds);
  }
  if (validated.status !== undefined) patch.status = validated.status;
  if (validated.sharedPremises !== undefined) patch.sharedPremises = validated.sharedPremises;
  if (validated.buildingOwnerCoordinated !== undefined) {
    patch.buildingOwnerCoordinated = validated.buildingOwnerCoordinated;
  }
  if (validated.buildingOwnerName !== undefined) patch.buildingOwnerName = validated.buildingOwnerName;
  if (validated.otherTenantsInformed !== undefined) {
    patch.otherTenantsInformed = validated.otherTenantsInformed;
  }
  if (validated.fullBuildingEvacuation !== undefined) {
    patch.fullBuildingEvacuation = validated.fullBuildingEvacuation;
  }
  if (validated.totalBuildingOccupants !== undefined) {
    patch.totalBuildingOccupants = validated.totalBuildingOccupants;
  }
  return patch;
}

export async function loadFireDrillsForList(tenantId: string): Promise<FireDrillListItem[]> {
  const db = getAdminDb();
  const { data: rows, error } = await db
    .from("FireDrill")
    .select(
      "id, title, drillType, isAnnounced, status, plannedDate, completedAt, location, responsibleId, objectives, actualParticipantCount, evaluatedAt",
    )
    .eq("tenantId", tenantId)
    .order("plannedDate", { ascending: false });

  if (error) {
    throw { code: "FIRE_DRILL_LIST_FAILED", message: error.message };
  }

  const drills = (rows ?? []) as Array<Record<string, unknown>>;
  const ids = drills.map((row) => String(row.id));
  const measuresByDrill = new Map<string, Array<{ id: string; status: string }>>();

  if (ids.length > 0) {
    const { data: measures, error: measureError } = await db
      .from("Measure")
      .select("id, status, fireDrillId")
      .in("fireDrillId", ids);
    if (measureError) {
      throw { code: "FIRE_DRILL_MEASURE_LIST_FAILED", message: measureError.message };
    }
    for (const measure of measures ?? []) {
      const drillId = String(measure.fireDrillId);
      const list = measuresByDrill.get(drillId) ?? [];
      list.push({ id: String(measure.id), status: String(measure.status) });
      measuresByDrill.set(drillId, list);
    }
  }

  return drills.map((row) => ({
    id: String(row.id),
    title: String(row.title ?? ""),
    drillType: row.drillType as FireDrillType,
    isAnnounced: Boolean(row.isAnnounced),
    status: row.status as FireDrillStatus,
    plannedDate: asIso(row.plannedDate) ?? nowIso(),
    completedAt: asIso(row.completedAt),
    location: String(row.location ?? ""),
    responsibleId: String(row.responsibleId ?? ""),
    objectives: String(row.objectives ?? ""),
    actualParticipantCount:
      row.actualParticipantCount === null || row.actualParticipantCount === undefined
        ? null
        : Number(row.actualParticipantCount),
    evaluatedAt: asIso(row.evaluatedAt),
    measures: measuresByDrill.get(String(row.id)) ?? [],
  }));
}

export async function loadFireDrillUserNames(tenantId: string): Promise<Record<string, string>> {
  const db = getAdminDb();
  const { data: memberships } = await db.from("UserTenant").select("userId").eq("tenantId", tenantId);
  const userIds = [...new Set((memberships ?? []).map((row) => row.userId as string))];
  if (userIds.length === 0) return {};

  const { data: users } = await db.from("User").select("id, name").in("id", userIds);
  return Object.fromEntries(
    (users ?? []).map((user) => [String(user.id), String(user.name ?? user.id)]),
  );
}

export async function loadFireDrillById(
  tenantId: string,
  id: string,
): Promise<FireDrillWithMeasures | null> {
  const db = getAdminDb();
  const { data: row, error } = await db
    .from("FireDrill")
    .select("*")
    .eq("id", id)
    .eq("tenantId", tenantId)
    .maybeSingle();

  if (error) {
    throw { code: "FIRE_DRILL_LOOKUP_FAILED", message: error.message };
  }
  if (!row) return null;

  const { data: measureRows } = await db
    .from("Measure")
    .select("id, title, status, dueAt, responsibleId")
    .eq("fireDrillId", id)
    .order("dueAt", { ascending: true });

  const responsibleIds = [
    ...new Set((measureRows ?? []).map((measure) => measure.responsibleId as string).filter(Boolean)),
  ];
  const { data: people } =
    responsibleIds.length === 0
      ? { data: [] as Array<{ id: string; name: string | null; email: string }> }
      : await db.from("User").select("id, name, email").in("id", responsibleIds);
  const personById = new Map(
    ((people ?? []) as Array<{ id: string; name: string | null; email: string }>).map((person) => [
      person.id,
      person,
    ]),
  );

  return {
    ...(row as FireDrillRecord),
    measures: (measureRows ?? []).map((measure) => {
      const person = personById.get(String(measure.responsibleId ?? ""));
      return {
        id: String(measure.id),
        title: String(measure.title ?? ""),
        status: String(measure.status ?? ""),
        dueAt: asIso(measure.dueAt) ?? nowIso(),
        responsible: person
          ? { id: person.id, name: person.name, email: person.email }
          : null,
      };
    }),
  };
}

export async function assertFireDrillOwnership(id: string, tenantId: string): Promise<FireDrillRecord> {
  const db = getAdminDb();
  const { data, error } = await db
    .from("FireDrill")
    .select("*")
    .eq("id", id)
    .eq("tenantId", tenantId)
    .maybeSingle();
  if (error) {
    throw { code: "FIRE_DRILL_LOOKUP_FAILED", message: error.message };
  }
  if (!data) {
    throw { code: "FIRE_DRILL_NOT_FOUND", message: "Fire drill not found" };
  }
  return data as FireDrillRecord;
}

export async function insertFireDrill(input: {
  tenantId: string;
  title: string;
  drillType: FireDrillType;
  isAnnounced: boolean;
  plannedDate: Date;
  location: string;
  responsibleId: string;
  objectives: string;
  scenario?: string | null;
  riskAssessment?: string | null;
  participantIds?: string[] | null;
  sharedPremises?: boolean;
  buildingOwnerCoordinated?: boolean | null;
  buildingOwnerName?: string | null;
  otherTenantsInformed?: boolean | null;
  fullBuildingEvacuation?: boolean | null;
  totalBuildingOccupants?: number | null;
}): Promise<FireDrillRecord> {
  const now = nowIso();
  const { data, error } = await getAdminDb()
    .from("FireDrill")
    .insert({
      id: createId(),
      tenantId: input.tenantId,
      title: input.title,
      drillType: input.drillType,
      isAnnounced: input.isAnnounced,
      plannedDate: input.plannedDate.toISOString(),
      location: input.location,
      responsibleId: input.responsibleId,
      objectives: input.objectives,
      scenario: input.scenario ?? null,
      riskAssessment: input.riskAssessment ?? null,
      participantIds: input.participantIds ? JSON.stringify(input.participantIds) : null,
      sharedPremises: input.sharedPremises ?? false,
      buildingOwnerCoordinated: input.buildingOwnerCoordinated ?? null,
      buildingOwnerName: input.buildingOwnerName ?? null,
      otherTenantsInformed: input.otherTenantsInformed ?? null,
      fullBuildingEvacuation: input.fullBuildingEvacuation ?? null,
      totalBuildingOccupants: input.totalBuildingOccupants ?? null,
      status: "PLANNED",
      createdAt: now,
      updatedAt: now,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw { code: "FIRE_DRILL_CREATE_FAILED", message: error?.message || "Could not create fire drill" };
  }
  return data as FireDrillRecord;
}

export async function updateFireDrillRecord(
  id: string,
  tenantId: string,
  patch: Record<string, unknown>,
): Promise<FireDrillRecord> {
  const { data, error } = await getAdminDb()
    .from("FireDrill")
    .update({ ...serializePatch(patch), updatedAt: nowIso() })
    .eq("id", id)
    .eq("tenantId", tenantId)
    .select("*")
    .single();

  if (error || !data) {
    throw { code: "FIRE_DRILL_UPDATE_FAILED", message: error?.message || "Could not update fire drill" };
  }
  return data as FireDrillRecord;
}

export async function deleteFireDrillRecord(id: string, tenantId: string): Promise<void> {
  const { error } = await getAdminDb().from("FireDrill").delete().eq("id", id).eq("tenantId", tenantId);
  if (error) {
    throw { code: "FIRE_DRILL_DELETE_FAILED", message: error.message };
  }
}

export async function countFireDrills(tenantId: string): Promise<number> {
  const { count, error } = await getAdminDb()
    .from("FireDrill")
    .select("id", { count: "exact", head: true })
    .eq("tenantId", tenantId);
  if (error) {
    throw { code: "FIRE_DRILL_COUNT_FAILED", message: error.message };
  }
  return count ?? 0;
}

export async function hasCompletedFireDrillSince(tenantId: string, sinceIso: string): Promise<boolean> {
  const { data, error } = await getAdminDb()
    .from("FireDrill")
    .select("id")
    .eq("tenantId", tenantId)
    .in("status", ["COMPLETED", "EVALUATED"])
    .gte("completedAt", sinceIso)
    .limit(1)
    .maybeSingle();
  if (error) {
    throw { code: "FIRE_DRILL_LOOKUP_FAILED", message: error.message };
  }
  return Boolean(data);
}

export async function loadUsersById(
  ids: string[],
): Promise<Array<{ id: string; name: string | null; email: string | null }>> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return [];
  const { data } = await getAdminDb().from("User").select("id, name, email").in("id", unique);
  return (data ?? []) as Array<{ id: string; name: string | null; email: string | null }>;
}

export async function loadTenantName(tenantId: string): Promise<string> {
  const { data } = await getAdminDb().from("Tenant").select("name").eq("id", tenantId).maybeSingle();
  return String(data?.name ?? "Company");
}
