import { getAdminDb } from "@/lib/supabase/admin";
import type {
  Audit,
  Document,
  Goal,
  InspectionTemplate,
  Measure,
  Project,
  Risk,
  RiskAssessment,
  RiskAuditLink,
  RiskControl,
  RiskDocumentLink,
  Role,
} from "@prisma/client";

export type RiskPerson = { id: string; name: string | null; email: string | null };

export type RiskListItem = Risk & {
  measures: Measure[];
  owner: RiskPerson | null;
  inspectionTemplate: { id: string; name: string } | null;
  kpi: { id: string; title: string } | null;
};

export type RiskAssessmentListItem = RiskAssessment & {
  _count: { risks: number };
};

export type RiskDetail = Risk & {
  measures: Measure[];
  owner: RiskPerson | null;
  kpi: { id: string; title: string } | null;
  inspectionTemplate: { id: string; name: string } | null;
  controls: Array<
    RiskControl & {
      owner: RiskPerson | null;
      evidenceDocument: { id: string; title: string | null } | null;
    }
  >;
  documentLinks: Array<
    RiskDocumentLink & {
      document: { id: string; title: string; status: string } | null;
    }
  >;
  auditLinks: Array<
    RiskAuditLink & {
      audit: { id: string; title: string; scheduledDate: Date | string | null; status: string } | null;
    }
  >;
};

export type RiskAssessmentDetail = RiskAssessment & {
  project: { id: string; name: string } | null;
  risks: Array<Risk & { owner: RiskPerson | null }>;
};

export type RiskSession = {
  user: { id: string; name: string | null; email: string };
  tenantId: string;
  role: Role;
};

function asRisk(row: Record<string, unknown>): Risk {
  return row as unknown as Risk;
}

function toPlain<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function asAssessment(row: Record<string, unknown>): RiskAssessment {
  return row as unknown as RiskAssessment;
}

async function loadPeopleById(ids: string[]): Promise<Map<string, RiskPerson>> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return new Map();
  const { data } = await getAdminDb().from("User").select("id, name, email").in("id", unique);
  return new Map(((data ?? []) as RiskPerson[]).map((person) => [person.id, person]));
}

export async function loadRiskSession(
  email: string,
  tenantId: string | null | undefined,
): Promise<RiskSession | null> {
  const db = getAdminDb();
  const { data: user } = await db
    .from("User")
    .select("id, name, email")
    .eq("email", email)
    .maybeSingle();

  if (!user?.id || !user.email) return null;

  const { data: memberships } = await db
    .from("UserTenant")
    .select("tenantId, role")
    .eq("userId", user.id);

  const selected = ((memberships ?? []) as Array<{ tenantId: string; role: Role }>).find(
    (membership) => membership.tenantId === tenantId,
  );
  if (!selected) return null;

  return {
    user: { id: user.id as string, name: (user.name as string | null) ?? null, email: user.email as string },
    tenantId: selected.tenantId,
    role: selected.role,
  };
}

export async function loadRiskAssessmentsForList(tenantId: string): Promise<RiskAssessmentListItem[]> {
  const db = getAdminDb();
  const [{ data: rows, error }, { data: riskRows }] = await Promise.all([
    db
      .from("RiskAssessment")
      .select("*")
      .eq("tenantId", tenantId)
      .order("assessmentYear", { ascending: false })
      .order("createdAt", { ascending: false }),
    db.from("Risk").select("riskAssessmentId").eq("tenantId", tenantId),
  ]);

  if (error) {
    throw { code: "RISK_ASSESSMENT_LIST_FAILED", message: error.message };
  }

  const counts = new Map<string, number>();
  for (const row of (riskRows ?? []) as Array<{ riskAssessmentId: string | null }>) {
    if (!row.riskAssessmentId) continue;
    counts.set(row.riskAssessmentId, (counts.get(row.riskAssessmentId) ?? 0) + 1);
  }

  return ((rows ?? []) as Record<string, unknown>[]).map((row) => {
    const assessment = asAssessment(row);
    return {
      ...assessment,
      _count: { risks: counts.get(assessment.id) ?? 0 },
    };
  });
}

export async function loadRisksForList(tenantId: string): Promise<RiskListItem[]> {
  const db = getAdminDb();
  const { data: rows, error } = await db
    .from("Risk")
    .select("*")
    .eq("tenantId", tenantId)
    .order("score", { ascending: false })
    .order("createdAt", { ascending: false });

  if (error) {
    throw { code: "RISK_LIST_FAILED", message: error.message };
  }

  const risks = ((rows ?? []) as Record<string, unknown>[]).map(asRisk);
  if (risks.length === 0) return [];

  const ids = risks.map((risk) => risk.id);
  const ownerIds = risks.map((risk) => risk.ownerId);
  const templateIds = risks.map((risk) => risk.inspectionTemplateId).filter(Boolean) as string[];
  const kpiIds = risks.map((risk) => risk.kpiId).filter(Boolean) as string[];

  const [{ data: measures }, people, { data: templates }, { data: goals }] = await Promise.all([
    db.from("Measure").select("*").in("riskId", ids),
    loadPeopleById(ownerIds),
    templateIds.length > 0
      ? db.from("InspectionTemplate").select("id, name").in("id", templateIds)
      : Promise.resolve({ data: [] as Array<{ id: string; name: string }> }),
    kpiIds.length > 0
      ? db.from("Goal").select("id, title").in("id", kpiIds)
      : Promise.resolve({ data: [] as Array<{ id: string; title: string }> }),
  ]);

  const measuresByRisk = new Map<string, Measure[]>();
  for (const measure of (measures ?? []) as Measure[]) {
    if (!measure.riskId) continue;
    const list = measuresByRisk.get(measure.riskId) ?? [];
    list.push(measure);
    measuresByRisk.set(measure.riskId, list);
  }

  const templateById = new Map(
    ((templates ?? []) as Array<{ id: string; name: string }>).map((item) => [item.id, item]),
  );
  const goalById = new Map(
    ((goals ?? []) as Array<{ id: string; title: string }>).map((item) => [item.id, item]),
  );

  return risks.map((risk) => ({
    ...risk,
    measures: measuresByRisk.get(risk.id) ?? [],
    owner: people.get(risk.ownerId) ?? null,
    inspectionTemplate: risk.inspectionTemplateId
      ? templateById.get(risk.inspectionTemplateId) ?? null
      : null,
    kpi: risk.kpiId ? goalById.get(risk.kpiId) ?? null : null,
  }));
}

export async function loadActiveProjects(tenantId: string): Promise<Array<{ id: string; name: string }>> {
  const { data, error } = await getAdminDb()
    .from("Project")
    .select("id, name")
    .eq("tenantId", tenantId)
    .eq("status", "ACTIVE")
    .order("name", { ascending: true });

  if (error) {
    throw { code: "PROJECT_LIST_FAILED", message: error.message };
  }

  return (data ?? []) as Array<{ id: string; name: string }>;
}

export async function loadRiskAssessmentDetail(
  tenantId: string,
  assessmentId: string,
): Promise<RiskAssessmentDetail | null> {
  const db = getAdminDb();
  const { data: row, error } = await db
    .from("RiskAssessment")
    .select("*")
    .eq("id", assessmentId)
    .eq("tenantId", tenantId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!row) return null;

  const assessment = asAssessment(row as Record<string, unknown>);
  const { data: riskRows, error: riskError } = await db
    .from("Risk")
    .select("*")
    .eq("tenantId", tenantId)
    .eq("riskAssessmentId", assessmentId)
    .order("score", { ascending: false })
    .order("assessmentDate", { ascending: false })
    .order("createdAt", { ascending: true });

  if (riskError) {
    throw new Error(riskError.message);
  }

  const risks = ((riskRows ?? []) as Record<string, unknown>[]).map(asRisk);
  const people = await loadPeopleById(risks.map((risk) => risk.ownerId));

  let project: { id: string; name: string } | null = null;
  if (assessment.projectId) {
    const { data: projectRow } = await db
      .from("Project")
      .select("id, name")
      .eq("id", assessment.projectId)
      .maybeSingle();
    project = (projectRow as { id: string; name: string } | null) ?? null;
  }

  return toPlain({
    ...assessment,
    project,
    risks: risks.map((risk) => ({
      ...risk,
      owner: people.get(risk.ownerId) ?? null,
    })),
  });
}

export async function loadTenantPeople(tenantId: string): Promise<RiskPerson[]> {
  const db = getAdminDb();
  const { data: memberships } = await db.from("UserTenant").select("userId").eq("tenantId", tenantId);
  const userIds = [...new Set(((memberships ?? []) as Array<{ userId: string }>).map((row) => row.userId))];
  if (userIds.length === 0) return [];
  const { data: users } = await db.from("User").select("id, name, email").in("id", userIds);
  return ((users ?? []) as RiskPerson[]).filter((person) => Boolean(person.email));
}

export async function loadRiskDetail(tenantId: string, riskId: string): Promise<RiskDetail | null> {
  const db = getAdminDb();
  const { data: row, error } = await db
    .from("Risk")
    .select("*")
    .eq("id", riskId)
    .eq("tenantId", tenantId)
    .maybeSingle();

  if (error) {
    throw { code: "RISK_LOAD_FAILED", message: error.message };
  }
  if (!row) return null;

  const risk = asRisk(row as Record<string, unknown>);

  const [
    { data: measures },
    { data: controls },
    { data: documentLinks },
    { data: auditLinks },
    { data: template },
    { data: goal },
  ] = await Promise.all([
    db.from("Measure").select("*").eq("riskId", risk.id).order("createdAt", { ascending: false }),
    db.from("RiskControl").select("*").eq("riskId", risk.id).order("createdAt", { ascending: false }),
    db.from("RiskDocumentLink").select("*").eq("riskId", risk.id).order("createdAt", { ascending: false }),
    db.from("RiskAuditLink").select("*").eq("riskId", risk.id).order("createdAt", { ascending: false }),
    risk.inspectionTemplateId
      ? db.from("InspectionTemplate").select("id, name").eq("id", risk.inspectionTemplateId).maybeSingle()
      : Promise.resolve({ data: null }),
    risk.kpiId
      ? db.from("Goal").select("id, title").eq("id", risk.kpiId).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const controlRows = (controls ?? []) as RiskControl[];
  const documentLinkRows = (documentLinks ?? []) as RiskDocumentLink[];
  const auditLinkRows = (auditLinks ?? []) as RiskAuditLink[];

  const people = await loadPeopleById([
    risk.ownerId,
    ...controlRows.map((control) => control.ownerId).filter(Boolean) as string[],
  ]);

  const evidenceIds = controlRows
    .map((control) => control.evidenceDocumentId)
    .filter(Boolean) as string[];
  const documentIds = documentLinkRows.map((link) => link.documentId);
  const auditIds = auditLinkRows.map((link) => link.auditId);

  const [{ data: evidenceDocs }, { data: documents }, { data: audits }] = await Promise.all([
    evidenceIds.length > 0
      ? db.from("Document").select("id, title").in("id", evidenceIds)
      : Promise.resolve({ data: [] as Array<{ id: string; title: string | null }> }),
    documentIds.length > 0
      ? db.from("Document").select("id, title, status").in("id", documentIds)
      : Promise.resolve({ data: [] as Array<{ id: string; title: string; status: string }> }),
    auditIds.length > 0
      ? db.from("Audit").select("id, title, scheduledDate, status").in("id", auditIds)
      : Promise.resolve({
          data: [] as Array<{ id: string; title: string; scheduledDate: string | null; status: string }>,
        }),
  ]);

  const evidenceById = new Map(
    ((evidenceDocs ?? []) as Array<{ id: string; title: string | null }>).map((item) => [item.id, item]),
  );
  const documentById = new Map(
    ((documents ?? []) as Array<{ id: string; title: string; status: string }>).map((item) => [item.id, item]),
  );
  const auditById = new Map(
    ((audits ?? []) as Array<{
      id: string;
      title: string;
      scheduledDate: string | null;
      status: string;
    }>).map((item) => [item.id, item]),
  );

  return {
    ...risk,
    measures: (measures ?? []) as Measure[],
    owner: people.get(risk.ownerId) ?? null,
    kpi: (goal as { id: string; title: string } | null) ?? null,
    inspectionTemplate: (template as { id: string; name: string } | null) ?? null,
    controls: controlRows.map((control) => ({
      ...control,
      owner: control.ownerId ? people.get(control.ownerId) ?? null : null,
      evidenceDocument: control.evidenceDocumentId
        ? evidenceById.get(control.evidenceDocumentId) ?? null
        : null,
    })),
    documentLinks: documentLinkRows.map((link) => ({
      ...link,
      document: documentById.get(link.documentId) ?? null,
    })),
    auditLinks: auditLinkRows.map((link) => ({
      ...link,
      audit: auditById.get(link.auditId) ?? null,
    })),
  };
}

export async function loadRiskFormOptions(tenantId: string): Promise<{
  people: RiskPerson[];
  goals: Array<Pick<Goal, "id" | "title">>;
  templates: Array<Pick<InspectionTemplate, "id" | "name">>;
  documents: Array<Pick<Document, "id" | "title" | "status">>;
  audits: Array<Pick<Audit, "id" | "title" | "scheduledDate" | "status">>;
}> {
  const db = getAdminDb();
  const people = await loadTenantPeople(tenantId);

  const [{ data: goals }, { data: tenantTemplates }, { data: globalTemplates }, { data: documents }, { data: audits }] =
    await Promise.all([
      db.from("Goal").select("id, title").eq("tenantId", tenantId).order("title", { ascending: true }),
      db.from("InspectionTemplate").select("id, name").eq("tenantId", tenantId).order("name", { ascending: true }),
      db
        .from("InspectionTemplate")
        .select("id, name")
        .is("tenantId", null)
        .eq("isGlobal", true)
        .order("name", { ascending: true }),
      db
        .from("Document")
        .select("id, title, status")
        .eq("tenantId", tenantId)
        .order("updatedAt", { ascending: false })
        .limit(100),
      db
        .from("Audit")
        .select("id, title, scheduledDate, status")
        .eq("tenantId", tenantId)
        .order("scheduledDate", { ascending: false })
        .limit(100),
    ]);

  const templates = [
    ...((tenantTemplates ?? []) as Array<{ id: string; name: string }>),
    ...((globalTemplates ?? []) as Array<{ id: string; name: string }>),
  ];
  const seen = new Set<string>();
  const uniqueTemplates = templates.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });

  return {
    people,
    goals: (goals ?? []) as Array<Pick<Goal, "id" | "title">>,
    templates: uniqueTemplates,
    documents: (documents ?? []) as Array<Pick<Document, "id" | "title" | "status">>,
    audits: (audits ?? []) as Array<Pick<Audit, "id" | "title" | "scheduledDate" | "status">>,
  };
}
