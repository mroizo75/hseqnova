import { getAdminDb } from "@/lib/supabase/admin";
import type { Incident, Measure, Project, Risk } from "@prisma/client";

export type IncidentListItem = Incident & {
  measures: Measure[];
  risk: Pick<Risk, "id" | "title" | "category"> | null;
};

export type IncidentPerson = { id: string; name: string | null; email: string };

export type IncidentDetail = Incident & {
  measures: Array<
    Measure & {
      responsible: { name: string | null; email: string } | null;
    }
  >;
  attachments: Array<{
    id: string;
    name: string;
    mime: string;
    size: number;
    fileKey: string;
  }>;
  risk: Pick<Risk, "id" | "title" | "category" | "score"> | null;
  people: {
    reportedBy: IncidentPerson | null;
    reportedFor: IncidentPerson | null;
    investigatedBy: IncidentPerson | null;
    responsible: IncidentPerson | null;
    closedBy: IncidentPerson | null;
  };
};

export type IncidentFormUser = { id: string; name: string | null; email: string };
export type IncidentFormProject = Pick<Project, "id" | "name" | "code" | "status">;
export type IncidentFormRisk = Pick<Risk, "id" | "title" | "category" | "score">;

function asIncident(row: Record<string, unknown>): Incident {
  return row as unknown as Incident;
}

export async function loadEnabledModuleKeys(tenantId: string): Promise<string[]> {
  const { data } = await getAdminDb()
    .from("TenantModule")
    .select("moduleKey")
    .eq("tenantId", tenantId)
    .in("status", ["ACTIVE", "TRIAL"]);
  return ((data ?? []) as Array<{ moduleKey: string }>).map((row) => row.moduleKey);
}

export async function loadIncidentsForList(input: {
  tenantId: string;
  reportedBy?: string;
}): Promise<IncidentListItem[]> {
  const db = getAdminDb();
  let query = db
    .from("Incident")
    .select("*")
    .eq("tenantId", input.tenantId)
    .order("occurredAt", { ascending: false });

  if (input.reportedBy) {
    query = query.eq("reportedBy", input.reportedBy);
  }

  const { data: rows, error } = await query;
  if (error) {
    throw { code: "INCIDENT_LIST_FAILED", message: error.message };
  }

  const incidents = (rows ?? []) as Record<string, unknown>[];
  if (incidents.length === 0) return [];

  const ids = incidents.map((row) => row.id as string);
  const riskIds = [
    ...new Set(
      incidents
        .map((row) => row.riskReferenceId as string | null)
        .filter((id): id is string => Boolean(id))
    ),
  ];

  const [{ data: measures }, { data: risks }] = await Promise.all([
    db.from("Measure").select("*").in("incidentId", ids),
    riskIds.length > 0
      ? db.from("Risk").select("id, title, category").in("id", riskIds)
      : Promise.resolve({ data: [] as Array<Pick<Risk, "id" | "title" | "category">> }),
  ]);

  const measuresByIncident = new Map<string, Measure[]>();
  for (const measure of (measures ?? []) as Measure[]) {
    const list = measuresByIncident.get(measure.incidentId ?? "") ?? [];
    list.push(measure);
    if (measure.incidentId) measuresByIncident.set(measure.incidentId, list);
  }

  const riskById = new Map(
    ((risks ?? []) as Array<Pick<Risk, "id" | "title" | "category">>).map((risk) => [
      risk.id,
      risk,
    ])
  );

  return incidents.map((row) => {
    const incident = asIncident(row);
    return {
      ...incident,
      measures: measuresByIncident.get(incident.id) ?? [],
      risk: incident.riskReferenceId
        ? (riskById.get(incident.riskReferenceId) ?? null)
        : null,
    };
  });
}

export async function loadNewIncidentFormData(tenantId: string): Promise<{
  risks: IncidentFormRisk[];
  users: IncidentFormUser[];
  projects: IncidentFormProject[];
}> {
  const db = getAdminDb();
  const [{ data: memberships }, { data: projects }] = await Promise.all([
    db.from("UserTenant").select("userId").eq("tenantId", tenantId),
    db
      .from("Project")
      .select("id, name, code, status")
      .eq("tenantId", tenantId)
      .in("status", ["PLANNING", "ACTIVE"])
      .order("name", { ascending: true }),
  ]);

  const userIds = ((memberships ?? []) as Array<{ userId: string }>).map((row) => row.userId);
  let users: IncidentFormUser[] = [];
  if (userIds.length > 0) {
    const { data: userRows } = await db
      .from("User")
      .select("id, name, email")
      .in("id", userIds)
      .order("name", { ascending: true });
    users = (userRows ?? []) as IncidentFormUser[];
  }

  return {
    risks: [],
    users,
    projects: (projects ?? []) as IncidentFormProject[],
  };
}

export async function loadIncidentDetail(input: {
  id: string;
  tenantId: string;
  reportedBy?: string;
}): Promise<IncidentDetail | null> {
  const db = getAdminDb();
  let query = db
    .from("Incident")
    .select("*")
    .eq("id", input.id)
    .eq("tenantId", input.tenantId);

  if (input.reportedBy) {
    query = query.eq("reportedBy", input.reportedBy);
  }

  const { data: row, error } = await query.maybeSingle();
  if (error) {
    throw { code: "INCIDENT_DETAIL_FAILED", message: error.message };
  }
  if (!row) return null;

  const incident = asIncident(row as Record<string, unknown>);

  const [{ data: measures }, { data: attachments }, { data: risk }] = await Promise.all([
    db
      .from("Measure")
      .select("*")
      .eq("incidentId", incident.id)
      .order("createdAt", { ascending: false }),
    db.from("Attachment").select("id, name, mime, size, fileKey").eq("incidentId", incident.id),
    incident.riskReferenceId
      ? db
          .from("Risk")
          .select("id, title, category, score")
          .eq("id", incident.riskReferenceId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const measureRows = (measures ?? []) as Measure[];
  const peopleIds = [
    ...new Set(
      [
        ...measureRows.map((measure) => measure.responsibleId),
        incident.reportedBy,
        incident.reportedForUserId,
        incident.investigatedBy,
        incident.responsibleId,
        incident.closedBy,
      ].filter((id): id is string => Boolean(id))
    ),
  ];
  let peopleById = new Map<string, IncidentPerson>();
  if (peopleIds.length > 0) {
    const { data: people } = await db
      .from("User")
      .select("id, name, email")
      .in("id", peopleIds);
    peopleById = new Map(
      ((people ?? []) as IncidentPerson[]).map((person) => [person.id, person])
    );
  }

  return {
    ...incident,
    measures: measureRows.map((measure) => ({
      ...measure,
      responsible: peopleById.get(measure.responsibleId) ?? null,
    })),
    attachments: (attachments ?? []) as IncidentDetail["attachments"],
    risk: (risk as IncidentDetail["risk"]) ?? null,
    people: {
      reportedBy: peopleById.get(incident.reportedBy) ?? null,
      reportedFor: incident.reportedForUserId
        ? peopleById.get(incident.reportedForUserId) ?? null
        : null,
      investigatedBy: incident.investigatedBy
        ? peopleById.get(incident.investigatedBy) ?? null
        : null,
      responsible: incident.responsibleId
        ? peopleById.get(incident.responsibleId) ?? null
        : null,
      closedBy: incident.closedBy ? peopleById.get(incident.closedBy) ?? null : null,
    },
  };
}

export async function loadTenantDirectory(tenantId: string): Promise<{
  users: IncidentFormUser[];
  projects: IncidentFormProject[];
  tenant: {
    name: string;
    orgNumber: string | null;
    address: string | null;
    contactPhone: string | null;
    logoUrl: string | null;
  } | null;
}> {
  const db = getAdminDb();
  const [{ data: memberships }, { data: projects }, { data: tenant }] = await Promise.all([
    db.from("UserTenant").select("userId").eq("tenantId", tenantId),
    db
      .from("Project")
      .select("id, name, code, status")
      .eq("tenantId", tenantId)
      .order("name", { ascending: true }),
    db
      .from("Tenant")
      .select("name, orgNumber, address, contactPhone, logoUrl")
      .eq("id", tenantId)
      .maybeSingle(),
  ]);

  const userIds = ((memberships ?? []) as Array<{ userId: string }>).map((row) => row.userId);
  let users: IncidentFormUser[] = [];
  if (userIds.length > 0) {
    const { data: userRows } = await db
      .from("User")
      .select("id, name, email")
      .in("id", userIds)
      .order("name", { ascending: true });
    users = (userRows ?? []) as IncidentFormUser[];
  }

  return {
    users,
    projects: (projects ?? []) as IncidentFormProject[],
    tenant: (tenant as {
      name: string;
      orgNumber: string | null;
      address: string | null;
      contactPhone: string | null;
      logoUrl: string | null;
    } | null) ?? null,
  };
}

export async function loadHseStatisticsYear(input: {
  tenantId: string;
  fromIso: string;
  toIso: string;
}): Promise<{
  incidents: Array<{
    isFatal: boolean;
    isLostTimeIncident: boolean;
    lostWorkdays: number | null;
    isRestrictedWork: boolean;
    medicalAttentionRequired: boolean;
  }>;
  hours: number;
}> {
  const db = getAdminDb();
  const [{ data: incidents }, { data: timeEntries }] = await Promise.all([
    db
      .from("Incident")
      .select("isFatal, isLostTimeIncident, lostWorkdays, isRestrictedWork, medicalAttentionRequired")
      .eq("tenantId", input.tenantId)
      .gte("occurredAt", input.fromIso)
      .lt("occurredAt", input.toIso)
      .in("type", ["ULYKKE", "NESTEN", "YRKESSYKDOM"]),
    db
      .from("TimeEntry")
      .select("hours")
      .eq("tenantId", input.tenantId)
      .gte("date", input.fromIso)
      .lt("date", input.toIso),
  ]);

  const hours = ((timeEntries ?? []) as Array<{ hours: number | string | null }>).reduce(
    (sum, entry) => sum + Number(entry.hours ?? 0),
    0
  );

  return {
    incidents: (incidents ?? []) as Array<{
      isFatal: boolean;
      isLostTimeIncident: boolean;
      lostWorkdays: number | null;
      isRestrictedWork: boolean;
      medicalAttentionRequired: boolean;
    }>,
    hours,
  };
}
