import { getAdminDb } from "@/lib/supabase/admin";
import { createId } from "@/lib/ids";
import type { Project, ProjectStatus } from "@prisma/client";

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

export type ProjectPerson = { id: string; name: string | null; email: string };

export type ProjectListItem = Project & {
  projectManager: ProjectPerson | null;
  createdBy: ProjectPerson | null;
  _count: {
    incidents: number;
    sjaAnalyses: number;
    inspections: number;
    measures: number;
    timeEntries: number;
  };
};

export type ProjectIncidentRow = {
  id: string;
  avviksnummer: string | null;
  title: string;
  type: string;
  severity: number | null;
  status: string;
  occurredAt: Date;
  isFatal: boolean;
  isLostTimeIncident: boolean;
  lostWorkdays: number | null;
  isRestrictedWork: boolean;
  medicalAttentionRequired: boolean;
};

export type ProjectSjaRow = {
  id: string;
  sjaNummer: string | null;
  title: string;
  status: string;
  plannedDate: Date;
  workLocation: string;
  responsibleName?: string;
  conclusion?: string;
};

export type ProjectInspectionRow = {
  id: string;
  title: string;
  type: string;
  status: string;
  scheduledDate: Date;
  location: string | null;
};

export type ProjectMeasureRow = {
  id: string;
  title: string;
  status: string;
  dueAt: Date;
  category: string;
  riskId?: string | null;
  incidentId?: string | null;
  projectId?: string | null;
};

export type ProjectTimeEntryRow = {
  id: string;
  date: Date;
  hours: number;
  timeType: string;
  comment: string | null;
  user: { name: string | null; email: string };
};

export type ProjectFormSubmissionRow = {
  id: string;
  submissionNumber: string | null;
  status: string;
  createdAt: Date;
  formTemplateId: string;
  formTemplate: { title: string };
  submittedBy: { name: string | null; email: string } | null;
};

export type ProjectAttachmentRow = {
  id: string;
  fileKey: string;
  name: string;
  mime: string;
  size: number | null;
  createdAt: Date;
};

export type ProjectDetail = Project & {
  createdBy: ProjectPerson;
  projectManager: ProjectPerson | null;
  incidents: ProjectIncidentRow[];
  sjaAnalyses: ProjectSjaRow[];
  inspections: ProjectInspectionRow[];
  measures: ProjectMeasureRow[];
  timeEntries: ProjectTimeEntryRow[];
  formSubmissions: ProjectFormSubmissionRow[];
  attachments: ProjectAttachmentRow[];
};

export type ProjectReportBundle = {
  project: ProjectDetail;
  tenantName: string | null;
};

export type ProjectSummary = {
  id: string;
  tenantId: string;
  name: string;
  location: string | null;
  clientName: string | null;
};

export type ProjectPersonOption = { id: string; name: string | null; email: string };

export type RosterRetentionSummary = {
  total: number;
  active: number;
  lastEndedAt: Date | null;
};

export function asProject(row: Record<string, unknown>): Project {
  return {
    ...row,
    startDate: parseDate(row.startDate),
    endDate: parseDate(row.endDate),
    createdAt: parseDate(row.createdAt) ?? new Date(0),
    updatedAt: parseDate(row.updatedAt) ?? new Date(0),
    status: (row.status as ProjectStatus) ?? "PLANNING",
  } as Project;
}

async function countByProjectIds(table: string, projectIds: string[]): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (projectIds.length === 0) return counts;
  const { data, error } = await getAdminDb().from(table).select("projectId").in("projectId", projectIds);
  if (error) {
    throw { code: "PROJECT_COUNT_FAILED", message: error.message };
  }
  for (const row of data ?? []) {
    const projectId = row.projectId as string | null;
    if (!projectId) continue;
    counts.set(projectId, (counts.get(projectId) ?? 0) + 1);
  }
  return counts;
}

async function loadUsersByIds(ids: string[]): Promise<Map<string, ProjectPerson>> {
  const unique = [...new Set(ids.filter(Boolean))];
  const map = new Map<string, ProjectPerson>();
  if (unique.length === 0) return map;
  const { data, error } = await getAdminDb().from("User").select("id, name, email").in("id", unique);
  if (error) {
    throw { code: "PROJECT_USER_LOOKUP_FAILED", message: error.message };
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

export async function loadProjectPeopleForTenant(tenantId: string): Promise<ProjectPersonOption[]> {
  const { data, error } = await getAdminDb()
    .from("UserTenant")
    .select("userId")
    .eq("tenantId", tenantId);
  if (error) {
    throw { code: "PROJECT_PEOPLE_FAILED", message: error.message };
  }
  const userIds = (data ?? []).map((row) => row.userId as string);
  const users = await loadUsersByIds(userIds);
  return [...users.values()].sort((left, right) =>
    (left.name || left.email).localeCompare(right.name || right.email, "en-GB"),
  );
}

export async function loadProjectById(id: string, tenantId: string): Promise<Project | null> {
  const { data, error } = await getAdminDb()
    .from("Project")
    .select("*")
    .eq("id", id)
    .eq("tenantId", tenantId)
    .maybeSingle();
  if (error) {
    throw { code: "PROJECT_LOOKUP_FAILED", message: error.message };
  }
  return data ? asProject(data as Record<string, unknown>) : null;
}

export async function loadProjectSummary(id: string, tenantId: string): Promise<ProjectSummary | null> {
  const { data, error } = await getAdminDb()
    .from("Project")
    .select("id, tenantId, name, location, clientName")
    .eq("id", id)
    .eq("tenantId", tenantId)
    .maybeSingle();
  if (error) {
    throw { code: "PROJECT_LOOKUP_FAILED", message: error.message };
  }
  if (!data) return null;
  return {
    id: data.id as string,
    tenantId: data.tenantId as string,
    name: data.name as string,
    location: (data.location as string | null) ?? null,
    clientName: (data.clientName as string | null) ?? null,
  };
}

export async function loadTenantName(tenantId: string): Promise<string | null> {
  const { data, error } = await getAdminDb()
    .from("Tenant")
    .select("name")
    .eq("id", tenantId)
    .maybeSingle();
  if (error) {
    throw { code: "TENANT_LOOKUP_FAILED", message: error.message };
  }
  return (data?.name as string | null) ?? null;
}

export async function loadProjectsForTenant(
  tenantId: string,
  opts?: { status?: string },
): Promise<ProjectListItem[]> {
  let query = getAdminDb().from("Project").select("*").eq("tenantId", tenantId);
  if (opts?.status) {
    query = query.eq("status", opts.status);
  }
  const { data, error } = await query.order("status", { ascending: true }).order("createdAt", { ascending: false });
  if (error) {
    throw { code: "PROJECT_LIST_FAILED", message: error.message };
  }
  const projects = (data ?? []).map((row) => asProject(row as Record<string, unknown>));
  const ids = projects.map((project) => project.id);
  const managerIds = projects.map((project) => project.projectManagerId).filter((id): id is string => Boolean(id));
  const creatorIds = projects.map((project) => project.createdById);
  const [users, incidents, sja, inspections, measures, timeEntries] = await Promise.all([
    loadUsersByIds([...managerIds, ...creatorIds]),
    countByProjectIds("Incident", ids),
    countByProjectIds("SjaAnalysis", ids),
    countByProjectIds("Inspection", ids),
    countByProjectIds("Measure", ids),
    countByProjectIds("TimeEntry", ids),
  ]);

  return projects.map((project) => ({
    ...project,
    projectManager: project.projectManagerId ? users.get(project.projectManagerId) ?? null : null,
    createdBy: users.get(project.createdById) ?? null,
    _count: {
      incidents: incidents.get(project.id) ?? 0,
      sjaAnalyses: sja.get(project.id) ?? 0,
      inspections: inspections.get(project.id) ?? 0,
      measures: measures.get(project.id) ?? 0,
      timeEntries: timeEntries.get(project.id) ?? 0,
    },
  }));
}

export async function loadProjectAttachments(
  tenantId: string,
  projectId: string,
): Promise<ProjectAttachmentRow[]> {
  const { data, error } = await getAdminDb()
    .from("Attachment")
    .select("id, fileKey, name, mime, size, createdAt")
    .eq("tenantId", tenantId)
    .eq("objectType", "PROJECT")
    .eq("objectId", projectId)
    .order("createdAt", { ascending: false });
  if (error) {
    throw { code: "PROJECT_ATTACHMENT_LIST_FAILED", message: error.message };
  }
  return (data ?? []).map((row) => ({
    id: row.id as string,
    fileKey: row.fileKey as string,
    name: row.name as string,
    mime: row.mime as string,
    size: row.size == null ? null : Number(row.size),
    createdAt: parseDate(row.createdAt) ?? new Date(0),
  }));
}

export async function loadProjectDetail(id: string, tenantId: string): Promise<ProjectDetail | null> {
  const project = await loadProjectById(id, tenantId);
  if (!project) return null;

  const db = getAdminDb();
  const [incidents, sja, inspections, measures, timeEntries, submissions, attachments, users] = await Promise.all([
    db
      .from("Incident")
      .select(
        "id, avviksnummer, title, type, severity, status, occurredAt, isFatal, isLostTimeIncident, lostWorkdays, isRestrictedWork, medicalAttentionRequired",
      )
      .eq("projectId", id)
      .order("occurredAt", { ascending: false }),
    db
      .from("SjaAnalysis")
      .select("id, sjaNummer, title, status, plannedDate, workLocation, responsibleName, conclusion")
      .eq("projectId", id)
      .order("plannedDate", { ascending: false }),
    db
      .from("Inspection")
      .select("id, title, type, status, scheduledDate, location")
      .eq("projectId", id)
      .order("scheduledDate", { ascending: false }),
    db
      .from("Measure")
      .select("id, title, status, dueAt, category, riskId, incidentId, projectId")
      .eq("projectId", id)
      .order("dueAt", { ascending: true }),
    db
      .from("TimeEntry")
      .select("id, date, hours, timeType, comment, userId")
      .eq("projectId", id)
      .order("date", { ascending: false })
      .limit(20),
    db
      .from("FormSubmission")
      .select("id, submissionNumber, status, createdAt, formTemplateId, submittedById")
      .eq("tenantId", tenantId)
      .eq("projectId", id)
      .order("createdAt", { ascending: false })
      .limit(20),
    loadProjectAttachments(tenantId, id),
    loadUsersByIds(
      [project.createdById, project.projectManagerId].filter((userId): userId is string => Boolean(userId)),
    ),
  ]);

  if (incidents.error) throw { code: "PROJECT_REL_FAILED", message: incidents.error.message };
  if (sja.error) throw { code: "PROJECT_REL_FAILED", message: sja.error.message };
  if (inspections.error) throw { code: "PROJECT_REL_FAILED", message: inspections.error.message };
  if (measures.error) throw { code: "PROJECT_REL_FAILED", message: measures.error.message };
  if (timeEntries.error) throw { code: "PROJECT_REL_FAILED", message: timeEntries.error.message };
  if (submissions.error) throw { code: "PROJECT_REL_FAILED", message: submissions.error.message };

  const timeUserIds = (timeEntries.data ?? []).map((row) => row.userId as string);
  const submitterIds = (submissions.data ?? [])
    .map((row) => row.submittedById as string | null)
    .filter((userId): userId is string => Boolean(userId));
  const templateIds = [...new Set((submissions.data ?? []).map((row) => row.formTemplateId as string))];
  const [relatedUsers, templates] = await Promise.all([
    loadUsersByIds([...timeUserIds, ...submitterIds]),
    templateIds.length
      ? db.from("FormTemplate").select("id, title").in("id", templateIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (templates.error) throw { code: "PROJECT_REL_FAILED", message: templates.error.message };
  const templateById = new Map((templates.data ?? []).map((row) => [row.id as string, row.title as string]));

  const createdBy = users.get(project.createdById) ?? {
    id: project.createdById,
    name: null,
    email: "",
  };

  return {
    ...project,
    createdBy,
    projectManager: project.projectManagerId ? users.get(project.projectManagerId) ?? null : null,
    incidents: (incidents.data ?? []).map((row) => ({
      id: row.id as string,
      avviksnummer: (row.avviksnummer as string | null) ?? null,
      title: row.title as string,
      type: row.type as string,
      severity: row.severity == null ? null : Number(row.severity),
      status: row.status as string,
      occurredAt: parseDate(row.occurredAt) ?? new Date(0),
      isFatal: asBool(row.isFatal),
      isLostTimeIncident: asBool(row.isLostTimeIncident),
      lostWorkdays: row.lostWorkdays == null ? null : Number(row.lostWorkdays),
      isRestrictedWork: asBool(row.isRestrictedWork),
      medicalAttentionRequired: asBool(row.medicalAttentionRequired),
    })),
    sjaAnalyses: (sja.data ?? []).map((row) => ({
      id: row.id as string,
      sjaNummer: (row.sjaNummer as string | null) ?? null,
      title: row.title as string,
      status: row.status as string,
      plannedDate: parseDate(row.plannedDate) ?? new Date(0),
      workLocation: (row.workLocation as string) ?? "",
      responsibleName: (row.responsibleName as string) ?? "",
      conclusion: (row.conclusion as string) ?? "",
    })),
    inspections: (inspections.data ?? []).map((row) => ({
      id: row.id as string,
      title: row.title as string,
      type: row.type as string,
      status: row.status as string,
      scheduledDate: parseDate(row.scheduledDate) ?? new Date(0),
      location: (row.location as string | null) ?? null,
    })),
    measures: (measures.data ?? []).map((row) => ({
      id: row.id as string,
      title: row.title as string,
      status: row.status as string,
      dueAt: parseDate(row.dueAt) ?? new Date(0),
      category: row.category as string,
      riskId: (row.riskId as string | null) ?? null,
      incidentId: (row.incidentId as string | null) ?? null,
      projectId: (row.projectId as string | null) ?? null,
    })),
    timeEntries: (timeEntries.data ?? []).map((row) => {
      const person = relatedUsers.get(row.userId as string);
      return {
        id: row.id as string,
        date: parseDate(row.date) ?? new Date(0),
        hours: Number(row.hours ?? 0),
        timeType: row.timeType as string,
        comment: (row.comment as string | null) ?? null,
        user: { name: person?.name ?? null, email: person?.email ?? "" },
      };
    }),
    formSubmissions: (submissions.data ?? []).map((row) => {
      const submitter = row.submittedById ? relatedUsers.get(row.submittedById as string) ?? null : null;
      return {
        id: row.id as string,
        submissionNumber: (row.submissionNumber as string | null) ?? null,
        status: row.status as string,
        createdAt: parseDate(row.createdAt) ?? new Date(0),
        formTemplateId: row.formTemplateId as string,
        formTemplate: { title: templateById.get(row.formTemplateId as string) ?? "Form" },
        submittedBy: submitter,
      };
    }),
    attachments,
  };
}

export async function loadProjectReportBundle(
  id: string,
  tenantId: string,
): Promise<ProjectReportBundle | null> {
  const [project, tenantName] = await Promise.all([
    loadProjectDetail(id, tenantId),
    loadTenantName(tenantId),
  ]);
  if (!project) return null;
  return { project, tenantName };
}

export async function insertProject(input: {
  tenantId: string;
  name: string;
  code?: string | null;
  orderNumber?: string | null;
  clientName?: string | null;
  location?: string | null;
  description?: string | null;
  status: ProjectStatus;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  projectManagerId?: string | null;
  createdById: string;
}): Promise<Project> {
  const now = nowIso();
  const { data, error } = await getAdminDb()
    .from("Project")
    .insert({
      id: createId(),
      tenantId: input.tenantId,
      name: input.name,
      code: input.code ?? null,
      orderNumber: input.orderNumber ?? null,
      clientName: input.clientName ?? null,
      location: input.location ?? null,
      description: input.description ?? null,
      status: input.status,
      startDate: toIso(input.startDate ?? null),
      endDate: toIso(input.endDate ?? null),
      projectManagerId: input.projectManagerId ?? null,
      createdById: input.createdById,
      createdAt: now,
      updatedAt: now,
    })
    .select("*")
    .single();
  if (error || !data) {
    throw { code: "PROJECT_CREATE_FAILED", message: error?.message || "Could not create the project" };
  }
  return asProject(data as Record<string, unknown>);
}

export async function updateProjectRecord(
  id: string,
  tenantId: string,
  patch: Record<string, unknown>,
): Promise<Project> {
  const serialized: Record<string, unknown> = { updatedAt: nowIso() };
  for (const [key, value] of Object.entries(patch)) {
    if (key === "id" || key === "tenantId") continue;
    serialized[key] = value instanceof Date ? value.toISOString() : value;
  }
  const { data, error } = await getAdminDb()
    .from("Project")
    .update(serialized)
    .eq("id", id)
    .eq("tenantId", tenantId)
    .select("*")
    .single();
  if (error || !data) {
    throw { code: "PROJECT_UPDATE_FAILED", message: error?.message || "Could not update the project" };
  }
  return asProject(data as Record<string, unknown>);
}

export async function loadRosterRetentionSummary(
  projectId: string,
  tenantId: string,
): Promise<RosterRetentionSummary> {
  const { data, error } = await getAdminDb()
    .from("ConstructionRosterEntry")
    .select("isActive, endedAtSiteDate")
    .eq("projectId", projectId)
    .eq("tenantId", tenantId);
  if (error) {
    throw { code: "PROJECT_ROSTER_FAILED", message: error.message };
  }
  const rows = data ?? [];
  let lastEndedAt: Date | null = null;
  let active = 0;
  for (const row of rows) {
    if (asBool(row.isActive)) active += 1;
    const ended = parseDate(row.endedAtSiteDate);
    if (ended && (!lastEndedAt || ended > lastEndedAt)) {
      lastEndedAt = ended;
    }
  }
  return { total: rows.length, active, lastEndedAt };
}

export async function insertProjectAttachment(input: {
  tenantId: string;
  projectId: string;
  fileKey: string;
  name: string;
  mime: string;
  size: number;
}): Promise<ProjectAttachmentRow> {
  const { data, error } = await getAdminDb()
    .from("Attachment")
    .insert({
      id: createId(),
      tenantId: input.tenantId,
      objectType: "PROJECT",
      objectId: input.projectId,
      fileKey: input.fileKey,
      name: input.name,
      mime: input.mime,
      size: input.size,
      createdAt: nowIso(),
    })
    .select("id, fileKey, name, mime, size, createdAt")
    .single();
  if (error || !data) {
    throw { code: "PROJECT_ATTACHMENT_CREATE_FAILED", message: error?.message || "Could not save the attachment" };
  }
  return {
    id: data.id as string,
    fileKey: data.fileKey as string,
    name: data.name as string,
    mime: data.mime as string,
    size: data.size == null ? null : Number(data.size),
    createdAt: parseDate(data.createdAt) ?? new Date(0),
  };
}

export async function loadProjectAttachment(
  attachmentId: string,
  projectId: string,
  tenantId: string,
): Promise<{ id: string; fileKey: string } | null> {
  const { data, error } = await getAdminDb()
    .from("Attachment")
    .select("id, fileKey")
    .eq("id", attachmentId)
    .eq("tenantId", tenantId)
    .eq("objectType", "PROJECT")
    .eq("objectId", projectId)
    .maybeSingle();
  if (error) {
    throw { code: "PROJECT_ATTACHMENT_LOOKUP_FAILED", message: error.message };
  }
  if (!data) return null;
  return { id: data.id as string, fileKey: data.fileKey as string };
}

export async function deleteProjectAttachment(id: string): Promise<void> {
  const { error } = await getAdminDb().from("Attachment").delete().eq("id", id);
  if (error) {
    throw { code: "PROJECT_ATTACHMENT_DELETE_FAILED", message: error.message };
  }
}

export type CdmDutyHolderRow = {
  id: string;
  tenantId: string;
  projectId: string;
  role: string;
  organisationName: string;
  companyNumber: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
};

function asDutyHolder(row: Record<string, unknown>): CdmDutyHolderRow {
  return {
    id: row.id as string,
    tenantId: row.tenantId as string,
    projectId: row.projectId as string,
    role: row.role as string,
    organisationName: row.organisationName as string,
    companyNumber: (row.companyNumber as string | null) ?? null,
    contactName: (row.contactName as string | null) ?? null,
    contactEmail: (row.contactEmail as string | null) ?? null,
    contactPhone: (row.contactPhone as string | null) ?? null,
  };
}

export async function loadDutyHoldersForProject(
  projectId: string,
  tenantId: string,
): Promise<CdmDutyHolderRow[]> {
  const { data, error } = await getAdminDb()
    .from("CdmDutyHolder")
    .select("id, tenantId, projectId, role, organisationName, companyNumber, contactName, contactEmail, contactPhone")
    .eq("projectId", projectId)
    .eq("tenantId", tenantId)
    .order("createdAt", { ascending: true });
  if (error) {
    throw { code: "CDM_DUTY_HOLDER_LIST_FAILED", message: error.message };
  }
  return (data ?? []).map((row) => asDutyHolder(row as Record<string, unknown>));
}

export async function replaceDutyHoldersForProject(input: {
  tenantId: string;
  projectId: string;
  holders: Array<{
    id?: string;
    role: string;
    organisationName: string;
    companyNumber?: string | null;
    contactName?: string | null;
    contactEmail?: string | null;
    contactPhone?: string | null;
  }>;
}): Promise<CdmDutyHolderRow[]> {
  const existing = await loadDutyHoldersForProject(input.projectId, input.tenantId);
  const keepIds = new Set(input.holders.map((holder) => holder.id).filter((id): id is string => Boolean(id)));
  const toDelete = existing.filter((row) => !keepIds.has(row.id)).map((row) => row.id);
  if (toDelete.length > 0) {
    const { error } = await getAdminDb().from("CdmDutyHolder").delete().in("id", toDelete).eq("tenantId", input.tenantId);
    if (error) {
      throw { code: "CDM_DUTY_HOLDER_DELETE_FAILED", message: error.message };
    }
  }

  const now = nowIso();
  const saved: CdmDutyHolderRow[] = [];
  for (const holder of input.holders) {
    const existingRow = holder.id ? existing.find((row) => row.id === holder.id) : null;
    if (existingRow) {
      const { data, error } = await getAdminDb()
        .from("CdmDutyHolder")
        .update({
          role: holder.role,
          organisationName: holder.organisationName,
          companyNumber: holder.companyNumber ?? null,
          contactName: holder.contactName ?? null,
          contactEmail: holder.contactEmail ?? null,
          contactPhone: holder.contactPhone ?? null,
          updatedAt: now,
        })
        .eq("id", existingRow.id)
        .eq("tenantId", input.tenantId)
        .select("id, tenantId, projectId, role, organisationName, companyNumber, contactName, contactEmail, contactPhone")
        .single();
      if (error || !data) {
        throw { code: "CDM_DUTY_HOLDER_UPDATE_FAILED", message: error?.message || "Could not update the duty holder" };
      }
      saved.push(asDutyHolder(data as Record<string, unknown>));
      continue;
    }

    const { data, error } = await getAdminDb()
      .from("CdmDutyHolder")
      .insert({
        id: createId(),
        tenantId: input.tenantId,
        projectId: input.projectId,
        role: holder.role,
        organisationName: holder.organisationName,
        companyNumber: holder.companyNumber ?? null,
        contactName: holder.contactName ?? null,
        contactEmail: holder.contactEmail ?? null,
        contactPhone: holder.contactPhone ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .select("id, tenantId, projectId, role, organisationName, companyNumber, contactName, contactEmail, contactPhone")
      .single();
    if (error || !data) {
      throw { code: "CDM_DUTY_HOLDER_CREATE_FAILED", message: error?.message || "Could not save the duty holder" };
    }
    saved.push(asDutyHolder(data as Record<string, unknown>));
  }

  return saved;
}

export async function syncCdmFreeTextFromDutyHolders(
  projectId: string,
  tenantId: string,
  holders: CdmDutyHolderRow[],
): Promise<void> {
  const client = holders.find((holder) => holder.role === "CLIENT");
  const designer = holders.find((holder) => holder.role === "PRINCIPAL_DESIGNER");
  const contractor = holders.find((holder) => holder.role === "PRINCIPAL_CONTRACTOR");
  const now = nowIso();
  const db = getAdminDb();

  const sha = await db.from("ConstructionShaPlan").select("id").eq("projectId", projectId).eq("tenantId", tenantId).maybeSingle();
  if (sha.error) {
    throw { code: "SHA_PLAN_LOOKUP_FAILED", message: sha.error.message };
  }
  if (sha.data) {
    const { error } = await db
      .from("ConstructionShaPlan")
      .update({
        builderName: client?.organisationName ?? null,
        builderRepresentativeName: client?.contactName ?? null,
        builderRepresentativeContact: client?.contactEmail ?? client?.contactPhone ?? null,
        coordinatorPlanningName: designer?.organisationName ?? null,
        coordinatorExecutionName: contractor?.organisationName ?? null,
        updatedAt: now,
      })
      .eq("id", sha.data.id);
    if (error) {
      throw { code: "SHA_PLAN_UPDATE_FAILED", message: error.message };
    }
  }

  const f10 = await db.from("ConstructionPreNotification").select("id").eq("projectId", projectId).eq("tenantId", tenantId).maybeSingle();
  if (f10.error) {
    throw { code: "F10_LOOKUP_FAILED", message: f10.error.message };
  }
  if (f10.data) {
    const coordinators = [designer, contractor]
      .filter(Boolean)
      .map((holder) => `${holder!.organisationName}${holder!.contactName ? ` (${holder!.contactName})` : ""}`)
      .join("\n");
    const { error } = await db
      .from("ConstructionPreNotification")
      .update({
        builderName: client?.organisationName ?? null,
        builderOrgNumber: client?.companyNumber ?? null,
        builderRepresentativeName: client?.contactName ?? null,
        builderRepresentativePhone: client?.contactPhone ?? null,
        coordinators: coordinators || null,
        updatedAt: now,
      })
      .eq("id", f10.data.id);
    if (error) {
      throw { code: "F10_UPDATE_FAILED", message: error.message };
    }
  }
}

export async function deleteProjectRecord(id: string, tenantId: string): Promise<void> {
  const db = getAdminDb();
  const unlink = [
    db.from("Incident").update({ projectId: null }).eq("projectId", id),
    db.from("SjaAnalysis").update({ projectId: null }).eq("projectId", id),
    db.from("Inspection").update({ projectId: null }).eq("projectId", id),
    db.from("Measure").update({ projectId: null }).eq("projectId", id),
  ];
  const results = await Promise.all(unlink);
  const failed = results.find((result) => result.error);
  if (failed?.error) {
    throw { code: "PROJECT_UNLINK_FAILED", message: failed.error.message };
  }

  const { error: attachmentError } = await db
    .from("Attachment")
    .delete()
    .eq("tenantId", tenantId)
    .eq("objectType", "PROJECT")
    .eq("objectId", id);
  if (attachmentError) {
    throw { code: "PROJECT_ATTACHMENT_DELETE_FAILED", message: attachmentError.message };
  }

  const { error } = await db.from("Project").delete().eq("id", id).eq("tenantId", tenantId);
  if (error) {
    throw { code: "PROJECT_DELETE_FAILED", message: error.message };
  }
}

export { toIso };
