import { getAdminDb } from "@/lib/supabase/admin";
import { createId } from "@/lib/ids";
import type { Audit, AuditFinding } from "@prisma/client";

export type AuditPerson = { id: string; name: string | null; email: string };

export type AuditListItem = Audit & {
  findings: AuditFinding[];
};

export type AuditDetail = Audit & {
  findings: AuditFinding[];
  leadAuditor: AuditPerson | null;
  teamMembers: AuditPerson[];
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

export function asAudit(row: Record<string, unknown>): Audit {
  return {
    ...row,
    scheduledDate: parseDate(row.scheduledDate) ?? new Date(0),
    completedAt: parseDate(row.completedAt),
    approvedAt: parseDate(row.approvedAt),
    createdAt: parseDate(row.createdAt) ?? new Date(0),
    updatedAt: parseDate(row.updatedAt) ?? new Date(0),
  } as Audit;
}

export function asAuditFinding(row: Record<string, unknown>): AuditFinding {
  return {
    ...row,
    dueDate: parseDate(row.dueDate),
    closedAt: parseDate(row.closedAt),
    verifiedAt: parseDate(row.verifiedAt),
    createdAt: parseDate(row.createdAt) ?? new Date(0),
    updatedAt: parseDate(row.updatedAt) ?? new Date(0),
  } as AuditFinding;
}

export function parseTeamMemberIds(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

async function loadPeopleById(ids: string[]): Promise<Map<string, AuditPerson>> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return new Map();
  const { data, error } = await getAdminDb()
    .from("User")
    .select("id, name, email")
    .in("id", unique);
  if (error) {
    throw { code: "AUDIT_USERS_FAILED", message: error.message };
  }
  return new Map(((data ?? []) as AuditPerson[]).map((person) => [person.id, person]));
}

export async function loadTenantAuditUsers(tenantId: string): Promise<AuditPerson[]> {
  const db = getAdminDb();
  const { data: memberships, error: membershipError } = await db
    .from("UserTenant")
    .select("userId")
    .eq("tenantId", tenantId);
  if (membershipError) {
    throw { code: "AUDIT_USERS_FAILED", message: membershipError.message };
  }
  const userIds = ((memberships ?? []) as Array<{ userId: string }>).map((row) => row.userId);
  if (userIds.length === 0) return [];
  const { data, error } = await db
    .from("User")
    .select("id, name, email")
    .in("id", userIds)
    .order("name", { ascending: true });
  if (error) {
    throw { code: "AUDIT_USERS_FAILED", message: error.message };
  }
  return (data ?? []) as AuditPerson[];
}

async function loadFindingsForAudits(auditIds: string[]): Promise<Map<string, AuditFinding[]>> {
  const grouped = new Map<string, AuditFinding[]>();
  if (auditIds.length === 0) return grouped;
  const { data, error } = await getAdminDb()
    .from("AuditFinding")
    .select("*")
    .in("auditId", auditIds)
    .order("createdAt", { ascending: false });
  if (error) {
    throw { code: "AUDIT_FINDINGS_FAILED", message: error.message };
  }
  for (const row of data ?? []) {
    const finding = asAuditFinding(row as Record<string, unknown>);
    const list = grouped.get(finding.auditId) ?? [];
    list.push(finding);
    grouped.set(finding.auditId, list);
  }
  return grouped;
}

export async function loadAudits(tenantId: string): Promise<AuditListItem[]> {
  const { data, error } = await getAdminDb()
    .from("Audit")
    .select("*")
    .eq("tenantId", tenantId)
    .order("scheduledDate", { ascending: false })
    .limit(50);
  if (error) {
    throw { code: "AUDIT_LIST_FAILED", message: error.message };
  }
  const audits = (data ?? []).map((row) => asAudit(row as Record<string, unknown>));
  const findingsByAudit = await loadFindingsForAudits(audits.map((audit) => audit.id));
  return audits.map((audit) => ({
    ...audit,
    findings: findingsByAudit.get(audit.id) ?? [],
  }));
}

export async function loadAudit(
  id: string,
  tenantId: string
): Promise<AuditListItem | null> {
  const { data, error } = await getAdminDb()
    .from("Audit")
    .select("*")
    .eq("id", id)
    .eq("tenantId", tenantId)
    .maybeSingle();
  if (error) {
    throw { code: "AUDIT_LOOKUP_FAILED", message: error.message };
  }
  if (!data) return null;
  const audit = asAudit(data as Record<string, unknown>);
  const findingsByAudit = await loadFindingsForAudits([audit.id]);
  return {
    ...audit,
    findings: findingsByAudit.get(audit.id) ?? [],
  };
}

export async function loadAuditDetail(
  id: string,
  tenantId: string
): Promise<AuditDetail | null> {
  const audit = await loadAudit(id, tenantId);
  if (!audit) return null;
  const teamMemberIds = parseTeamMemberIds(audit.teamMemberIds);
  const people = await loadPeopleById([audit.leadAuditorId, ...teamMemberIds]);
  return {
    ...audit,
    leadAuditor: people.get(audit.leadAuditorId) ?? null,
    teamMembers: teamMemberIds
      .map((memberId) => people.get(memberId))
      .filter((person): person is AuditPerson => Boolean(person)),
  };
}

export async function insertAudit(input: {
  tenantId: string;
  title: string;
  auditType: string;
  scope: string;
  criteria: string;
  leadAuditorId: string;
  teamMemberIds?: string[] | null;
  scheduledDate: Date;
  area: string;
  department?: string | null;
  status?: string;
}): Promise<Audit> {
  const now = nowIso();
  const { data, error } = await getAdminDb()
    .from("Audit")
    .insert({
      id: createId(),
      tenantId: input.tenantId,
      title: input.title,
      auditType: input.auditType,
      scope: input.scope,
      criteria: input.criteria,
      leadAuditorId: input.leadAuditorId,
      teamMemberIds: input.teamMemberIds?.length ? JSON.stringify(input.teamMemberIds) : null,
      scheduledDate: input.scheduledDate.toISOString(),
      area: input.area,
      department: input.department ?? null,
      status: input.status ?? "PLANNED",
      createdAt: now,
      updatedAt: now,
    })
    .select("*")
    .single();
  if (error || !data) {
    throw { code: "AUDIT_CREATE_FAILED", message: error?.message || "Could not create the audit" };
  }
  return asAudit(data as Record<string, unknown>);
}

export async function updateAuditRecord(input: {
  id: string;
  tenantId: string;
  title?: string;
  auditType?: string;
  scope?: string;
  criteria?: string;
  leadAuditorId?: string;
  teamMemberIds?: string[] | null;
  scheduledDate?: Date;
  completedAt?: Date | null;
  area?: string;
  department?: string | null;
  status?: string;
  summary?: string | null;
  conclusion?: string | null;
  approvedBy?: string | null;
  approvedAt?: Date | null;
}): Promise<Audit> {
  const payload: Record<string, unknown> = { updatedAt: nowIso() };
  if (input.title !== undefined) payload.title = input.title;
  if (input.auditType !== undefined) payload.auditType = input.auditType;
  if (input.scope !== undefined) payload.scope = input.scope;
  if (input.criteria !== undefined) payload.criteria = input.criteria;
  if (input.leadAuditorId !== undefined) payload.leadAuditorId = input.leadAuditorId;
  if (input.teamMemberIds !== undefined) {
    payload.teamMemberIds = input.teamMemberIds?.length
      ? JSON.stringify(input.teamMemberIds)
      : null;
  }
  if (input.scheduledDate !== undefined) payload.scheduledDate = input.scheduledDate.toISOString();
  if (input.completedAt !== undefined) {
    payload.completedAt = input.completedAt ? input.completedAt.toISOString() : null;
  }
  if (input.area !== undefined) payload.area = input.area;
  if (input.department !== undefined) payload.department = input.department;
  if (input.status !== undefined) payload.status = input.status;
  if (input.summary !== undefined) payload.summary = input.summary;
  if (input.conclusion !== undefined) payload.conclusion = input.conclusion;
  if (input.approvedBy !== undefined) payload.approvedBy = input.approvedBy;
  if (input.approvedAt !== undefined) {
    payload.approvedAt = input.approvedAt ? input.approvedAt.toISOString() : null;
  }

  const { data, error } = await getAdminDb()
    .from("Audit")
    .update(payload)
    .eq("id", input.id)
    .eq("tenantId", input.tenantId)
    .select("*")
    .single();
  if (error || !data) {
    throw { code: "AUDIT_UPDATE_FAILED", message: error?.message || "Could not update the audit" };
  }
  return asAudit(data as Record<string, unknown>);
}

export async function deleteAuditRecord(id: string, tenantId: string): Promise<void> {
  const { error } = await getAdminDb().from("Audit").delete().eq("id", id).eq("tenantId", tenantId);
  if (error) {
    throw { code: "AUDIT_DELETE_FAILED", message: error.message };
  }
}

export async function insertFinding(input: {
  auditId: string;
  findingType: string;
  clause: string;
  description: string;
  evidence: string;
  requirement: string;
  responsibleId: string;
  dueDate?: Date | null;
}): Promise<AuditFinding> {
  const now = nowIso();
  const { data, error } = await getAdminDb()
    .from("AuditFinding")
    .insert({
      id: createId(),
      auditId: input.auditId,
      findingType: input.findingType,
      clause: input.clause,
      description: input.description,
      evidence: input.evidence,
      requirement: input.requirement,
      responsibleId: input.responsibleId,
      dueDate: input.dueDate ? input.dueDate.toISOString() : null,
      status: "OPEN",
      createdAt: now,
      updatedAt: now,
    })
    .select("*")
    .single();
  if (error || !data) {
    throw { code: "AUDIT_FINDING_CREATE_FAILED", message: error?.message || "Could not record the finding" };
  }
  return asAuditFinding(data as Record<string, unknown>);
}

export async function updateFindingRecord(input: {
  id: string;
  findingType?: string;
  clause?: string;
  description?: string;
  evidence?: string;
  requirement?: string;
  responsibleId?: string;
  dueDate?: Date | null;
  correctiveAction?: string | null;
  rootCause?: string | null;
  status?: string;
  verifiedById?: string | null;
  verifiedAt?: Date | null;
  closedAt?: Date | null;
}): Promise<AuditFinding> {
  const payload: Record<string, unknown> = { updatedAt: nowIso() };
  if (input.findingType !== undefined) payload.findingType = input.findingType;
  if (input.clause !== undefined) payload.clause = input.clause;
  if (input.description !== undefined) payload.description = input.description;
  if (input.evidence !== undefined) payload.evidence = input.evidence;
  if (input.requirement !== undefined) payload.requirement = input.requirement;
  if (input.responsibleId !== undefined) payload.responsibleId = input.responsibleId;
  if (input.dueDate !== undefined) payload.dueDate = input.dueDate ? input.dueDate.toISOString() : null;
  if (input.correctiveAction !== undefined) payload.correctiveAction = input.correctiveAction;
  if (input.rootCause !== undefined) payload.rootCause = input.rootCause;
  if (input.status !== undefined) payload.status = input.status;
  if (input.verifiedById !== undefined) payload.verifiedById = input.verifiedById;
  if (input.verifiedAt !== undefined) {
    payload.verifiedAt = input.verifiedAt ? input.verifiedAt.toISOString() : null;
  }
  if (input.closedAt !== undefined) payload.closedAt = input.closedAt ? input.closedAt.toISOString() : null;

  const { data, error } = await getAdminDb()
    .from("AuditFinding")
    .update(payload)
    .eq("id", input.id)
    .select("*")
    .single();
  if (error || !data) {
    throw { code: "AUDIT_FINDING_UPDATE_FAILED", message: error?.message || "Could not update the finding" };
  }
  return asAuditFinding(data as Record<string, unknown>);
}

export async function deleteFindingRecord(id: string): Promise<void> {
  const { error } = await getAdminDb().from("AuditFinding").delete().eq("id", id);
  if (error) {
    throw { code: "AUDIT_FINDING_DELETE_FAILED", message: error.message };
  }
}

export async function loadFindingWithAudit(
  findingId: string
): Promise<{ finding: AuditFinding; tenantId: string } | null> {
  const { data: findingRow, error } = await getAdminDb()
    .from("AuditFinding")
    .select("*")
    .eq("id", findingId)
    .maybeSingle();
  if (error) {
    throw { code: "AUDIT_FINDING_LOOKUP_FAILED", message: error.message };
  }
  if (!findingRow) return null;
  const finding = asAuditFinding(findingRow as Record<string, unknown>);
  const { data: auditRow, error: auditError } = await getAdminDb()
    .from("Audit")
    .select("tenantId")
    .eq("id", finding.auditId)
    .maybeSingle();
  if (auditError) {
    throw { code: "AUDIT_LOOKUP_FAILED", message: auditError.message };
  }
  if (!auditRow) return null;
  return { finding, tenantId: auditRow.tenantId as string };
}
