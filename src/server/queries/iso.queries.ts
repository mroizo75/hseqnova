import { getAdminDb } from "@/lib/supabase/admin";
import { createId } from "@/lib/ids";
import { tenantHasModule } from "@/lib/tenant-modules";
import { EMPTY_ISO_SNAPSHOT, evaluateIsoClauses, type IsoClauseStatus, type IsoEvidenceSnapshot } from "@/features/iso/lib/evidence";
import { ALL_ISO_CLAUSES, type IsoClause } from "@/features/iso/lib/clauses";
import {
  ISO_45001_2018_VERSION_ID,
  ISO_9001_2015_VERSION_ID,
  clauseFromRequirement,
  isoRequirementSeedRows,
  PUBLISHED_ISO_VERSIONS,
} from "@/features/iso/lib/catalogue";
import { hasIso93Input, parseManagementReviewActions } from "@/features/iso/lib/iso-93";
import { isJustifiedDesignExclusion } from "@/features/iso/lib/documented-information";
import { buildIsoReadiness, type IsoAssessedLevel, type IsoReadiness } from "@/features/iso/lib/readiness";
import { insertMeasure } from "@/server/queries/measures.queries";

function parseDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

function nowIso(): string {
  return new Date().toISOString();
}

function countRows(data: unknown): number {
  return Array.isArray(data) ? data.length : 0;
}

export type IsoContextIssueRow = {
  id: string;
  tenantId: string;
  kind: string;
  title: string;
  description: string | null;
  relevance: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type IsoInterestedPartyRow = {
  id: string;
  tenantId: string;
  name: string;
  partyType: string;
  needs: string;
  expectations: string;
  consultationMethod: string | null;
  reviewedAt: Date | null;
};

export type IsoScopeRow = {
  id: string;
  tenantId: string;
  ohAndSScope: string;
  qualityScope: string | null;
  inclusions: string | null;
  exclusions: string | null;
  sites: string | null;
  excludeDesign: boolean;
  excludeDesignJustification: string | null;
  approvedAt: Date | null;
  approvedById: string | null;
};

export type IsoLegalRequirementRow = {
  id: string;
  tenantId: string;
  title: string;
  source: string;
  reference: string | null;
  appliesBecause: string | null;
  ownerId: string | null;
  nextEvaluationDate: Date | null;
  lastEvaluationDate: Date | null;
  lastEvaluationResult: string | null;
  lastEvaluationNotes: string | null;
};

export type IsoChangeRow = {
  id: string;
  tenantId: string;
  title: string;
  description: string;
  changeType: string;
  status: string;
  riskImpact: string | null;
  trainingImpact: string | null;
  documentImpact: string | null;
  approvedAt: Date | null;
  implementedAt: Date | null;
  createdAt: Date;
};

function asContext(row: Record<string, unknown>): IsoContextIssueRow {
  return {
    id: String(row.id),
    tenantId: String(row.tenantId),
    kind: String(row.kind),
    title: String(row.title),
    description: row.description ? String(row.description) : null,
    relevance: row.relevance ? String(row.relevance) : null,
    reviewedAt: parseDate(row.reviewedAt),
    createdAt: parseDate(row.createdAt) ?? new Date(0),
    updatedAt: parseDate(row.updatedAt) ?? new Date(0),
  };
}

function asParty(row: Record<string, unknown>): IsoInterestedPartyRow {
  return {
    id: String(row.id),
    tenantId: String(row.tenantId),
    name: String(row.name),
    partyType: String(row.partyType),
    needs: String(row.needs ?? ""),
    expectations: String(row.expectations ?? ""),
    consultationMethod: row.consultationMethod ? String(row.consultationMethod) : null,
    reviewedAt: parseDate(row.reviewedAt),
  };
}

function asScope(row: Record<string, unknown>): IsoScopeRow {
  return {
    id: String(row.id),
    tenantId: String(row.tenantId),
    ohAndSScope: String(row.ohAndSScope ?? ""),
    qualityScope: row.qualityScope ? String(row.qualityScope) : null,
    inclusions: row.inclusions ? String(row.inclusions) : null,
    exclusions: row.exclusions ? String(row.exclusions) : null,
    sites: row.sites ? String(row.sites) : null,
    excludeDesign: Boolean(row.excludeDesign),
    excludeDesignJustification: row.excludeDesignJustification
      ? String(row.excludeDesignJustification)
      : null,
    approvedAt: parseDate(row.approvedAt),
    approvedById: row.approvedById ? String(row.approvedById) : null,
  };
}

function asLegal(row: Record<string, unknown>): IsoLegalRequirementRow {
  return {
    id: String(row.id),
    tenantId: String(row.tenantId),
    title: String(row.title),
    source: String(row.source),
    reference: row.reference ? String(row.reference) : null,
    appliesBecause: row.appliesBecause ? String(row.appliesBecause) : null,
    ownerId: row.ownerId ? String(row.ownerId) : null,
    nextEvaluationDate: parseDate(row.nextEvaluationDate),
    lastEvaluationDate: parseDate(row.lastEvaluationDate),
    lastEvaluationResult: row.lastEvaluationResult ? String(row.lastEvaluationResult) : null,
    lastEvaluationNotes: row.lastEvaluationNotes ? String(row.lastEvaluationNotes) : null,
  };
}

function asChange(row: Record<string, unknown>): IsoChangeRow {
  return {
    id: String(row.id),
    tenantId: String(row.tenantId),
    title: String(row.title),
    description: String(row.description ?? ""),
    changeType: String(row.changeType),
    status: String(row.status),
    riskImpact: row.riskImpact ? String(row.riskImpact) : null,
    trainingImpact: row.trainingImpact ? String(row.trainingImpact) : null,
    documentImpact: row.documentImpact ? String(row.documentImpact) : null,
    approvedAt: parseDate(row.approvedAt),
    implementedAt: parseDate(row.implementedAt),
    createdAt: parseDate(row.createdAt) ?? new Date(0),
  };
}

export async function loadIsoContextIssues(tenantId: string): Promise<IsoContextIssueRow[]> {
  const { data } = await getAdminDb()
    .from("IsoContextIssue")
    .select("*")
    .eq("tenantId", tenantId)
    .order("createdAt", { ascending: false });
  return ((data ?? []) as Record<string, unknown>[]).map(asContext);
}

export async function insertIsoContextIssue(input: {
  tenantId: string;
  kind: string;
  title: string;
  description?: string | null;
  relevance?: string | null;
}): Promise<IsoContextIssueRow> {
  const row = {
    id: createId(),
    tenantId: input.tenantId,
    kind: input.kind,
    title: input.title,
    description: input.description ?? null,
    relevance: input.relevance ?? null,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  const { data, error } = await getAdminDb().from("IsoContextIssue").insert(row).select("*").single();
  if (error || !data) {
    throw { code: "ISO_CONTEXT_CREATE_FAILED", message: error?.message ?? "Could not save context issue" };
  }
  return asContext(data as Record<string, unknown>);
}

export async function deleteIsoContextIssue(tenantId: string, id: string): Promise<void> {
  const { error } = await getAdminDb().from("IsoContextIssue").delete().eq("tenantId", tenantId).eq("id", id);
  if (error) {
    throw { code: "ISO_CONTEXT_DELETE_FAILED", message: error.message };
  }
}

export async function loadIsoInterestedParties(tenantId: string): Promise<IsoInterestedPartyRow[]> {
  const { data } = await getAdminDb()
    .from("IsoInterestedParty")
    .select("*")
    .eq("tenantId", tenantId)
    .order("name", { ascending: true });
  return ((data ?? []) as Record<string, unknown>[]).map(asParty);
}

export async function insertIsoInterestedParty(input: {
  tenantId: string;
  name: string;
  partyType: string;
  needs: string;
  expectations: string;
  consultationMethod?: string | null;
}): Promise<IsoInterestedPartyRow> {
  const row = {
    id: createId(),
    ...input,
    consultationMethod: input.consultationMethod ?? null,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  const { data, error } = await getAdminDb().from("IsoInterestedParty").insert(row).select("*").single();
  if (error || !data) {
    throw { code: "ISO_PARTY_CREATE_FAILED", message: error?.message ?? "Could not save interested party" };
  }
  return asParty(data as Record<string, unknown>);
}

export async function deleteIsoInterestedParty(tenantId: string, id: string): Promise<void> {
  const { error } = await getAdminDb().from("IsoInterestedParty").delete().eq("tenantId", tenantId).eq("id", id);
  if (error) {
    throw { code: "ISO_PARTY_DELETE_FAILED", message: error.message };
  }
}

export async function loadIsoScope(tenantId: string): Promise<IsoScopeRow | null> {
  const { data } = await getAdminDb().from("IsoScope").select("*").eq("tenantId", tenantId).maybeSingle();
  return data ? asScope(data as Record<string, unknown>) : null;
}

export async function upsertIsoScope(input: {
  tenantId: string;
  ohAndSScope: string;
  qualityScope?: string | null;
  inclusions?: string | null;
  exclusions?: string | null;
  sites?: string | null;
  excludeDesign?: boolean;
  excludeDesignJustification?: string | null;
  approvedById?: string | null;
  approve?: boolean;
}): Promise<IsoScopeRow> {
  const existing = await loadIsoScope(input.tenantId);
  const payload = {
    ohAndSScope: input.ohAndSScope,
    qualityScope: input.qualityScope ?? null,
    inclusions: input.inclusions ?? null,
    exclusions: input.exclusions ?? null,
    sites: input.sites ?? null,
    excludeDesign: Boolean(input.excludeDesign),
    excludeDesignJustification: input.excludeDesignJustification ?? null,
    updatedAt: nowIso(),
    ...(input.approve
      ? { approvedAt: nowIso(), approvedById: input.approvedById ?? null }
      : {}),
  };
  if (existing) {
    const { data, error } = await getAdminDb()
      .from("IsoScope")
      .update(payload)
      .eq("id", existing.id)
      .select("*")
      .single();
    if (error || !data) {
      throw { code: "ISO_SCOPE_UPDATE_FAILED", message: error?.message ?? "Could not save scope" };
    }
    return asScope(data as Record<string, unknown>);
  }
  const { data, error } = await getAdminDb()
    .from("IsoScope")
    .insert({
      id: createId(),
      tenantId: input.tenantId,
      createdAt: nowIso(),
      ...payload,
    })
    .select("*")
    .single();
  if (error || !data) {
    throw { code: "ISO_SCOPE_CREATE_FAILED", message: error?.message ?? "Could not save scope" };
  }
  return asScope(data as Record<string, unknown>);
}

export async function loadIsoLegalRequirements(tenantId: string): Promise<IsoLegalRequirementRow[]> {
  const { data } = await getAdminDb()
    .from("IsoLegalRequirement")
    .select("*")
    .eq("tenantId", tenantId)
    .order("title", { ascending: true });
  return ((data ?? []) as Record<string, unknown>[]).map(asLegal);
}

export async function insertIsoLegalRequirement(input: {
  tenantId: string;
  title: string;
  source: string;
  reference?: string | null;
  appliesBecause?: string | null;
  ownerId?: string | null;
}): Promise<IsoLegalRequirementRow> {
  const row = {
    id: createId(),
    tenantId: input.tenantId,
    title: input.title,
    source: input.source,
    reference: input.reference ?? null,
    appliesBecause: input.appliesBecause ?? null,
    ownerId: input.ownerId ?? null,
    lastEvaluationResult: "NOT_EVALUATED",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  const { data, error } = await getAdminDb().from("IsoLegalRequirement").insert(row).select("*").single();
  if (error || !data) {
    throw { code: "ISO_LEGAL_CREATE_FAILED", message: error?.message ?? "Could not save legal requirement" };
  }
  return asLegal(data as Record<string, unknown>);
}

export async function evaluateIsoLegalRequirement(input: {
  tenantId: string;
  id: string;
  result: string;
  notes?: string | null;
  nextEvaluationDate?: Date | null;
}): Promise<void> {
  const { error } = await getAdminDb()
    .from("IsoLegalRequirement")
    .update({
      lastEvaluationResult: input.result,
      lastEvaluationNotes: input.notes ?? null,
      lastEvaluationDate: nowIso(),
      nextEvaluationDate: input.nextEvaluationDate?.toISOString() ?? null,
      updatedAt: nowIso(),
    })
    .eq("tenantId", input.tenantId)
    .eq("id", input.id);
  if (error) {
    throw { code: "ISO_LEGAL_EVAL_FAILED", message: error.message };
  }
}

export async function deleteIsoLegalRequirement(tenantId: string, id: string): Promise<void> {
  const { error } = await getAdminDb().from("IsoLegalRequirement").delete().eq("tenantId", tenantId).eq("id", id);
  if (error) {
    throw { code: "ISO_LEGAL_DELETE_FAILED", message: error.message };
  }
}

export const DEFAULT_UK_LEGAL_REQUIREMENTS = [
  {
    title: "Health and Safety at Work etc. Act 1974",
    source: "HSWA 1974",
    reference: "s.2",
    appliesBecause: "Employer duties, including a written policy where there are five or more employees.",
  },
  {
    title: "Management of Health and Safety at Work Regulations 1999",
    source: "MHSWR 1999",
    reference: "reg.3",
    appliesBecause: "Suitable and sufficient risk assessments and competent person.",
  },
  {
    title: "RIDDOR 2013",
    source: "RIDDOR 2013",
    reference: null,
    appliesBecause: "Reportable deaths, specified injuries, over-seven-day injuries, disease and dangerous occurrences.",
  },
  {
    title: "ISO 45001:2018",
    source: "Other requirement",
    reference: "OHSMS",
    appliesBecause: "The organisation has chosen to operate an occupational health and safety management system.",
  },
  {
    title: "ISO 9001:2015",
    source: "Other requirement",
    reference: "QMS",
    appliesBecause: "The organisation has chosen to operate a quality management system.",
  },
] as const;

export async function seedDefaultLegalRequirements(tenantId: string): Promise<number> {
  const existing = await loadIsoLegalRequirements(tenantId);
  if (existing.length > 0) return 0;
  for (const item of DEFAULT_UK_LEGAL_REQUIREMENTS) {
    await insertIsoLegalRequirement({ tenantId, ...item });
  }
  return DEFAULT_UK_LEGAL_REQUIREMENTS.length;
}

export async function loadIsoChanges(tenantId: string): Promise<IsoChangeRow[]> {
  const { data } = await getAdminDb()
    .from("IsoChange")
    .select("*")
    .eq("tenantId", tenantId)
    .order("createdAt", { ascending: false });
  return ((data ?? []) as Record<string, unknown>[]).map(asChange);
}

export async function insertIsoChange(input: {
  tenantId: string;
  title: string;
  description: string;
  changeType: string;
  riskImpact?: string | null;
  trainingImpact?: string | null;
  documentImpact?: string | null;
  createdById?: string | null;
}): Promise<IsoChangeRow> {
  const row = {
    id: createId(),
    tenantId: input.tenantId,
    title: input.title,
    description: input.description,
    changeType: input.changeType,
    status: "PROPOSED",
    riskImpact: input.riskImpact ?? null,
    trainingImpact: input.trainingImpact ?? null,
    documentImpact: input.documentImpact ?? null,
    createdById: input.createdById ?? null,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  const { data, error } = await getAdminDb().from("IsoChange").insert(row).select("*").single();
  if (error || !data) {
    throw { code: "ISO_CHANGE_CREATE_FAILED", message: error?.message ?? "Could not save change" };
  }
  return asChange(data as Record<string, unknown>);
}

export async function updateIsoChangeStatus(input: {
  tenantId: string;
  id: string;
  status: string;
  approvedById?: string | null;
}): Promise<void> {
  const extra: Record<string, unknown> = { status: input.status, updatedAt: nowIso() };
  if (input.status === "APPROVED") {
    extra.approvedAt = nowIso();
    extra.approvedById = input.approvedById ?? null;
  }
  if (input.status === "IMPLEMENTED" || input.status === "CLOSED") {
    extra.implementedAt = nowIso();
  }
  const { error } = await getAdminDb()
    .from("IsoChange")
    .update(extra)
    .eq("tenantId", input.tenantId)
    .eq("id", input.id);
  if (error) {
    throw { code: "ISO_CHANGE_UPDATE_FAILED", message: error.message };
  }
}

export type IsoConsultationMeeting = {
  id: string;
  title: string;
  scheduledDate: Date;
  status: string;
  type: string;
};

export async function loadIsoConsultationMeetings(tenantId: string): Promise<IsoConsultationMeeting[]> {
  const { data } = await getAdminDb()
    .from("Meeting")
    .select("id, title, scheduledDate, status, type")
    .eq("tenantId", tenantId)
    .order("scheduledDate", { ascending: false })
    .limit(50);
  return ((data ?? []) as Record<string, unknown>[]).map((row) => ({
    id: String(row.id),
    title: String(row.title),
    scheduledDate: parseDate(row.scheduledDate) ?? new Date(0),
    status: String(row.status ?? "PLANNED"),
    type: String(row.type ?? "HMS_COMMITTEE"),
  }));
}

export async function insertIsoConsultationMeeting(input: {
  tenantId: string;
  title: string;
  scheduledDate: Date;
  organizer: string;
  location?: string | null;
  notes?: string | null;
}): Promise<IsoConsultationMeeting> {
  const row = {
    id: createId(),
    tenantId: input.tenantId,
    type: "HMS_COMMITTEE",
    title: input.title,
    scheduledDate: input.scheduledDate.toISOString(),
    location: input.location ?? null,
    notes: input.notes ?? null,
    organizer: input.organizer,
    status: "PLANNED",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  const { data, error } = await getAdminDb().from("Meeting").insert(row).select("id, title, scheduledDate, status, type").single();
  if (error || !data) {
    throw { code: "ISO_MEETING_CREATE_FAILED", message: error?.message ?? "Could not save meeting" };
  }
  const mapped = data as Record<string, unknown>;
  return {
    id: String(mapped.id),
    title: String(mapped.title),
    scheduledDate: parseDate(mapped.scheduledDate) ?? input.scheduledDate,
    status: String(mapped.status ?? "PLANNED"),
    type: String(mapped.type ?? "HMS_COMMITTEE"),
  };
}

export async function completeIsoConsultationMeeting(tenantId: string, id: string, summary: string): Promise<void> {
  const { error } = await getAdminDb()
    .from("Meeting")
    .update({
      status: "COMPLETED",
      summary,
      completedAt: nowIso(),
      updatedAt: nowIso(),
    })
    .eq("tenantId", tenantId)
    .eq("id", id);
  if (error) {
    throw { code: "ISO_MEETING_UPDATE_FAILED", message: error.message };
  }
}

export async function loadIsoEvidenceSnapshot(
  tenantId: string,
  enabledModules: string[],
): Promise<IsoEvidenceSnapshot> {
  const db = getAdminDb();
  const yearAgo = new Date();
  yearAgo.setFullYear(yearAgo.getFullYear() - 1);

  const [
    contextRes,
    partiesRes,
    scopeRes,
    legalRes,
    changeRes,
    meetingsRes,
    policyRes,
    orgRes,
    risksRes,
    controlsRes,
    goalsRes,
    trainingRes,
    documentsRes,
    inspectionsRes,
    contractorsRes,
    drillsRes,
    fraRes,
    auditsRes,
    reviewsRes,
    incidentsRes,
    measuresRes,
    handbookRes,
    whistleRes,
    processRes,
    feedbackRes,
    clauseDocRes,
  ] = await Promise.all([
    db.from("IsoContextIssue").select("id, kind").eq("tenantId", tenantId),
    db.from("IsoInterestedParty").select("id").eq("tenantId", tenantId),
    db.from("IsoScope").select("id, qualityScope, approvedAt, excludeDesign, excludeDesignJustification").eq("tenantId", tenantId).maybeSingle(),
    db.from("IsoLegalRequirement").select("id, lastEvaluationResult").eq("tenantId", tenantId),
    db.from("IsoChange").select("id").eq("tenantId", tenantId),
    db.from("Meeting").select("id").eq("tenantId", tenantId),
    db.from("Document").select("id, title, ownerId, nextReviewDate, version").eq("tenantId", tenantId).eq("status", "APPROVED").limit(80),
    db.from("OrgChartNode").select("id").eq("tenantId", tenantId),
    db.from("RiskAssessment").select("id").eq("tenantId", tenantId),
    db.from("RiskControl").select("id, controlType").eq("tenantId", tenantId),
    db.from("Goal").select("id, category, status").eq("tenantId", tenantId).neq("status", "ARCHIVED"),
    db.from("Training").select("id, expiresAt").eq("tenantId", tenantId),
    db.from("Document").select("id").eq("tenantId", tenantId),
    db.from("Inspection").select("id").eq("tenantId", tenantId),
    db.from("ContractorRegistration").select("id").eq("tenantId", tenantId),
    db.from("FireDrill").select("id, completedAt, status").eq("tenantId", tenantId),
    db.from("FireRiskAssessment").select("id").eq("tenantId", tenantId).limit(1),
    db.from("Audit").select("id, status, completedAt").eq("tenantId", tenantId),
    db.from("ManagementReview").select("id, status").eq("tenantId", tenantId),
    db.from("Incident").select("id, type").eq("tenantId", tenantId),
    db.from("Measure").select("id, status, effectiveness").eq("tenantId", tenantId),
    db.from("HmsHandbook").select("id, currentVersionId").eq("tenantId", tenantId).maybeSingle(),
    db.from("Whistleblowing").select("id").eq("tenantId", tenantId),
    db.from("IsoProcess").select("id").eq("tenantId", tenantId),
    db.from("CustomerFeedback").select("id").eq("tenantId", tenantId),
    db.from("IsoClauseDocument").select("clauseKey, documentId").eq("tenantId", tenantId),
  ]);

  const contextRows = (contextRes.data ?? []) as Array<{ kind?: string }>;
  const legalRows = (legalRes.data ?? []) as Array<{ lastEvaluationResult?: string | null }>;
  const trainingRows = (trainingRes.data ?? []) as Array<{ expiresAt?: string | null }>;
  const now = Date.now();
  const expiredTrainingCount = trainingRows.filter((row) => {
    if (!row.expiresAt) return false;
    const expires = new Date(row.expiresAt).getTime();
    return !Number.isNaN(expires) && expires < now;
  }).length;

  const drillRows = (drillsRes.data ?? []) as Array<{ completedAt?: string | null; status?: string }>;
  const fireDrillInYear = drillRows.some((row) => {
    const completed = row.completedAt ? new Date(row.completedAt).getTime() : 0;
    return completed >= yearAgo.getTime() || row.status === "COMPLETED" || row.status === "EVALUATED";
  });

  const auditRows = (auditsRes.data ?? []) as Array<{ id: string; status?: string }>;
  const completedAudits = auditRows.filter((row) => row.status === "COMPLETED" || row.status === "APPROVED");
  const completedIds = completedAudits.map((row) => row.id);
  let auditWithIsoClauses = false;
  let auditCovers45001 = false;
  let auditCovers9001 = false;
  const handbook = handbookRes.data as { id?: string; currentVersionId?: string | null } | null;
  let signatureCount = 0;
  if (completedIds.length > 0 || handbook?.id) {
    const extra: Array<Promise<{ data: unknown[] | null }>> = [];
    if (completedIds.length > 0) {
      extra.push(
        db.from("AuditFinding").select("clause, auditId").in("auditId", completedIds) as unknown as Promise<{
          data: unknown[] | null;
        }>,
      );
    }
    if (handbook?.id) {
      extra.push(
        db.from("HandbookSignature").select("id").eq("handbookId", handbook.id).limit(1) as unknown as Promise<{
          data: unknown[] | null;
        }>,
      );
    }
    const extraRows = await Promise.all(extra);
    if (completedIds.length > 0) {
      const findingRows = (extraRows[0]?.data ?? []) as Array<{ clause?: string }>;
      auditCovers45001 = findingRows.some((row) => String(row.clause ?? "").includes("45001"));
      auditCovers9001 = findingRows.some((row) => String(row.clause ?? "").includes("9001"));
      auditWithIsoClauses = auditCovers45001 || auditCovers9001;
    }
    const sigIndex = completedIds.length > 0 ? 1 : 0;
    if (handbook?.id) {
      signatureCount = countRows(extraRows[sigIndex]?.data);
    }
  }

  const reviewRows = (reviewsRes.data ?? []) as Array<{ status?: string }>;
  const measureRows = (measuresRes.data ?? []) as Array<{ status?: string; effectiveness?: string | null }>;
  const policyDocs = (policyRes.data ?? []) as Array<{
    id?: string;
    title?: string;
    ownerId?: string | null;
    nextReviewDate?: string | null;
    version?: string | null;
  }>;
  const qualityDocs = policyDocs.some((doc) => /quality/i.test(String(doc.title ?? "")));
  const scope = scopeRes.data as {
    qualityScope?: string | null;
    approvedAt?: string | null;
    excludeDesign?: boolean;
    excludeDesignJustification?: string | null;
  } | null;
  const approvedIds = new Set(policyDocs.map((doc) => String(doc.id ?? "")).filter(Boolean));
  const clauseDocRows = (clauseDocRes.error ? [] : (clauseDocRes.data ?? [])) as Array<{
    clauseKey?: string;
    documentId?: string;
  }>;
  const approvedClauseKeys = [
    ...new Set(
      clauseDocRows
        .filter((row) => approvedIds.has(String(row.documentId ?? "")))
        .map((row) => String(row.clauseKey ?? ""))
        .filter(Boolean),
    ),
  ];
  const documentControlAdequate = policyDocs.some(
    (doc) => Boolean(doc.ownerId) && Boolean(doc.nextReviewDate) && Boolean(doc.version),
  );
  const excludeDesign = Boolean(scope?.excludeDesign);
  const excludeDesignJustified = isJustifiedDesignExclusion({
    excludeDesign,
    excludeDesignJustification: scope?.excludeDesignJustification ?? null,
  });

  const controls = (controlsRes.data ?? []) as Array<{ controlType?: string }>;
  const hierarchyTypes = new Set(["ELIMINATION", "SUBSTITUTION", "ENGINEERING", "ADMINISTRATIVE", "PPE"]);

  return {
    ...EMPTY_ISO_SNAPSHOT,
    contextCount: contextRows.filter((row) => row.kind !== "OPPORTUNITY").length,
    opportunityCount: contextRows.filter((row) => row.kind === "OPPORTUNITY").length,
    interestedPartyCount: countRows(partiesRes.data),
    hasScope: Boolean(scope),
    scopeApproved: Boolean(scope?.approvedAt),
    hasQualityScope: Boolean(scope?.qualityScope && String(scope.qualityScope).trim().length > 20),
    policyPublished: Boolean(handbook?.currentVersionId) || policyDocs.length > 0,
    policyAcknowledged: signatureCount > 0,
    hasQualityPolicy: qualityDocs || Boolean(scope?.qualityScope && String(scope.qualityScope).trim().length > 20),
    orgNodeCount: countRows(orgRes.data),
    consultationCount: countRows(meetingsRes.data),
    riskAssessmentCount: countRows(risksRes.data),
    riskWithControlsCount: controls.filter((row) => hierarchyTypes.has(String(row.controlType))).length,
    legalRequirementCount: legalRows.length,
    evaluatedLegalCount: legalRows.filter(
      (row) => row.lastEvaluationResult && row.lastEvaluationResult !== "NOT_EVALUATED",
    ).length,
    objectiveCount: countRows(goalsRes.data),
    expiredTrainingCount,
    trainingRecordCount: trainingRows.length,
    documentCount: countRows(documentsRes.data),
    inspectionCount: countRows(inspectionsRes.data),
    hasRams: tenantHasModule(enabledModules, "sja"),
    hasCoshh: tenantHasModule(enabledModules, "chemicals"),
    changeCount: countRows(changeRes.data),
    contractorCount: countRows(contractorsRes.data),
    fireDrillInYear,
    fireAssessment: countRows(fraRes.data) > 0,
    completedAuditCount: completedAudits.length,
    auditWithIsoClauses,
    auditCovers45001,
    auditCovers9001,
    completedReviewCount: reviewRows.filter((row) => row.status === "COMPLETED" || row.status === "APPROVED").length,
    incidentCount: countRows(incidentsRes.data),
    nearMissCount: ((incidentsRes.data ?? []) as Array<{ type?: string }>).filter(
      (row) => row.type === "NESTEN" || row.type === "FARLIG_SITUASJON",
    ).length,
    whistleblowingCount: countRows(whistleRes.data),
    actionsWithEffectiveness: measureRows.filter(
      (row) => row.effectiveness && row.effectiveness !== "NOT_EVALUATED",
    ).length,
    openActionCount: measureRows.filter((row) => row.status !== "DONE").length,
    processCount: processRes.error ? 0 : countRows(processRes.data),
    customerFeedbackCount: feedbackRes.error ? 0 : countRows(feedbackRes.data),
    approvedClauseKeys,
    documentControlAdequate,
    excludeDesign,
    excludeDesignJustified,
  };
}

export type IsoTenantMember = { id: string; name: string | null; email: string };

export type IsoRequirementRow = {
  id: string;
  versionId: string;
  clauseKey: string;
  clause: string;
  title: string;
  shallParaphrase: string;
  phase: string;
  evidenceKey: string;
  doThis: string;
  auditorHint: string;
  href: string;
};

export type IsoClauseAssessmentRow = {
  id: string;
  tenantId: string;
  requirementId: string;
  assessedLevel: IsoAssessedLevel | null;
  responsibleUserId: string | null;
  lastReviewedAt: Date | null;
  nextReviewAt: Date | null;
  notes: string | null;
  measureId: string | null;
};

export type IsoMatrixRow = {
  requirement: IsoRequirementRow;
  clause: IsoClause;
  autoLevel: IsoClauseStatus["level"];
  autoDetail: string;
  assessment: IsoClauseAssessmentRow | null;
  documents: IsoLinkedDocument[];
};

export type IsoLinkedDocument = {
  id: string;
  linkId: string;
  title: string;
  version: string;
  status: string;
  ownerId: string | null;
  nextReviewDate: Date | null;
  role: string;
};

export type IsoProcessRow = {
  id: string;
  name: string;
  purpose: string;
  ownerId: string | null;
  inputs: string | null;
  outputs: string | null;
  sequence: number;
};

export type IsoDocumentOption = {
  id: string;
  title: string;
  version: string;
  status: string;
};

export type IsoConsultationHub = {
  meetings: IsoConsultationMeeting[];
  incidents: Array<{
    id: string;
    title: string;
    type: string;
    status: string;
    reportedBy: string | null;
    occurredAt: Date | null;
  }>;
  actions: Array<{
    id: string;
    title: string;
    status: string;
    incidentId: string | null;
    dueAt: Date | null;
    effectiveness: string | null;
  }>;
  whistleblowing: Array<{
    id: string;
    caseNumber: string;
    title: string;
    status: string;
    isAnonymous: boolean;
  }>;
};

export type IsoAuditSamplePool = {
  incidents: Array<{ id: string; title: string; type: string; status: string; rootCause: string | null; closedAt: Date | null }>;
  risks: Array<{ id: string; title: string }>;
  trainings: Array<{ id: string; title: string; userId: string; validUntil: Date | null }>;
};

function asRequirement(row: Record<string, unknown>): IsoRequirementRow {
  return {
    id: String(row.id),
    versionId: String(row.versionId),
    clauseKey: String(row.clauseKey),
    clause: String(row.clause),
    title: String(row.title),
    shallParaphrase: String(row.shallParaphrase ?? ""),
    phase: String(row.phase),
    evidenceKey: String(row.evidenceKey),
    doThis: String(row.doThis ?? ""),
    auditorHint: String(row.auditorHint ?? ""),
    href: String(row.href ?? ""),
  };
}

function asAssessment(row: Record<string, unknown>): IsoClauseAssessmentRow {
  const level = row.assessedLevel ? String(row.assessedLevel) : null;
  const assessedLevel =
    level === "COMPLIANT" || level === "PARTIAL" || level === "GAP" || level === "MAJOR_GAP"
      ? level
      : null;
  return {
    id: String(row.id),
    tenantId: String(row.tenantId),
    requirementId: String(row.requirementId),
    assessedLevel,
    responsibleUserId: row.responsibleUserId ? String(row.responsibleUserId) : null,
    lastReviewedAt: parseDate(row.lastReviewedAt),
    nextReviewAt: parseDate(row.nextReviewAt),
    notes: row.notes ? String(row.notes) : null,
    measureId: row.measureId ? String(row.measureId) : null,
  };
}

export async function ensureIsoCatalogue(tenantId: string): Promise<void> {
  const db = getAdminDb();
  const stamp = nowIso();
  const { error: versionError } = await db.from("IsoStandardVersion").upsert(
    PUBLISHED_ISO_VERSIONS.map((version) => ({
      id: version.id,
      standard: version.standard,
      edition: version.edition,
      status: version.status,
      publishedAt: version.edition === "2018" ? "2018-03-12T00:00:00.000Z" : "2015-09-15T00:00:00.000Z",
      updatedAt: stamp,
    })),
    { onConflict: "id" },
  );
  if (versionError) return;
  await db.from("IsoRequirement").upsert(
    isoRequirementSeedRows().map((row) => ({ ...row, updatedAt: stamp })),
    { onConflict: "id" },
  );
  const { data: tenant } = await db
    .from("Tenant")
    .select("iso45001VersionId, iso9001VersionId")
    .eq("id", tenantId)
    .maybeSingle();
  if (!tenant?.iso45001VersionId || !tenant?.iso9001VersionId) {
    await db
      .from("Tenant")
      .update({
        iso45001VersionId: tenant?.iso45001VersionId ?? ISO_45001_2018_VERSION_ID,
        iso9001VersionId: tenant?.iso9001VersionId ?? ISO_9001_2015_VERSION_ID,
      })
      .eq("id", tenantId);
  }
}

export async function loadActiveIsoRequirements(tenantId: string): Promise<IsoRequirementRow[]> {
  await ensureIsoCatalogue(tenantId);
  const db = getAdminDb();
  const { data: tenant } = await db
    .from("Tenant")
    .select("iso45001VersionId, iso9001VersionId")
    .eq("id", tenantId)
    .maybeSingle();
  const versionIds = [
    String(tenant?.iso45001VersionId ?? ISO_45001_2018_VERSION_ID),
    String(tenant?.iso9001VersionId ?? ISO_9001_2015_VERSION_ID),
  ];
  const { data, error } = await db.from("IsoRequirement").select("*").in("versionId", versionIds);
  if (error) return isoRequirementSeedRows();
  const rows = ((data ?? []) as Record<string, unknown>[]).map(asRequirement);
  if (rows.length > 0) {
    const order = new Map(ALL_ISO_CLAUSES.map((clause, index) => [clause.id, index]));
    return rows.sort((a, b) => (order.get(a.clauseKey) ?? 999) - (order.get(b.clauseKey) ?? 999));
  }
  return isoRequirementSeedRows();
}

export async function loadIsoClauseAssessments(tenantId: string): Promise<IsoClauseAssessmentRow[]> {
  const { data, error } = await getAdminDb().from("IsoClauseAssessment").select("*").eq("tenantId", tenantId);
  if (error) return [];
  return ((data ?? []) as Record<string, unknown>[]).map(asAssessment);
}

export async function loadIsoClauseMatrix(
  tenantId: string,
  statuses: IsoClauseStatus[],
): Promise<IsoMatrixRow[]> {
  const [requirements, assessments, documentsByClause] = await Promise.all([
    loadActiveIsoRequirements(tenantId),
    loadIsoClauseAssessments(tenantId),
    loadIsoClauseDocumentsByClause(tenantId),
  ]);
  const statusByKey = new Map(statuses.map((item) => [item.clause.id, item]));
  const assessmentByReq = new Map(assessments.map((item) => [item.requirementId, item]));
  return requirements.map((requirement) => {
    const clause = clauseFromRequirement(requirement);
    const status = statusByKey.get(requirement.clauseKey);
    return {
      requirement,
      clause,
      autoLevel: status?.level ?? "missing",
      autoDetail: status?.detail ?? "Not evaluated",
      assessment: assessmentByReq.get(requirement.id) ?? null,
      documents: documentsByClause.get(requirement.clauseKey) ?? [],
    };
  });
}

export async function upsertIsoClauseAssessment(input: {
  tenantId: string;
  requirementId: string;
  assessedLevel?: IsoAssessedLevel | null;
  responsibleUserId?: string | null;
  lastReviewedAt?: Date | null;
  nextReviewAt?: Date | null;
  notes?: string | null;
  measureId?: string | null;
}): Promise<IsoClauseAssessmentRow> {
  const db = getAdminDb();
  const { data: existing } = await db
    .from("IsoClauseAssessment")
    .select("*")
    .eq("tenantId", input.tenantId)
    .eq("requirementId", input.requirementId)
    .maybeSingle();
  const payload: Record<string, unknown> = { updatedAt: nowIso() };
  if (input.assessedLevel !== undefined) payload.assessedLevel = input.assessedLevel;
  if (input.responsibleUserId !== undefined) payload.responsibleUserId = input.responsibleUserId;
  if (input.lastReviewedAt !== undefined) {
    payload.lastReviewedAt = input.lastReviewedAt ? input.lastReviewedAt.toISOString() : null;
  }
  if (input.nextReviewAt !== undefined) {
    payload.nextReviewAt = input.nextReviewAt ? input.nextReviewAt.toISOString() : null;
  }
  if (input.notes !== undefined) payload.notes = input.notes;
  if (input.measureId !== undefined) payload.measureId = input.measureId;

  if (existing) {
    const { data, error } = await db
      .from("IsoClauseAssessment")
      .update(payload)
      .eq("id", existing.id)
      .eq("tenantId", input.tenantId)
      .select("*")
      .single();
    if (error || !data) {
      throw { code: "ISO_ASSESSMENT_UPDATE_FAILED", message: error?.message ?? "Could not save assessment" };
    }
    return asAssessment(data as Record<string, unknown>);
  }

  const { data, error } = await db
    .from("IsoClauseAssessment")
    .insert({
      id: createId(),
      tenantId: input.tenantId,
      requirementId: input.requirementId,
      assessedLevel: input.assessedLevel ?? null,
      responsibleUserId: input.responsibleUserId ?? null,
      lastReviewedAt: input.lastReviewedAt?.toISOString() ?? nowIso(),
      nextReviewAt: input.nextReviewAt?.toISOString() ?? null,
      notes: input.notes ?? null,
      measureId: input.measureId ?? null,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    })
    .select("*")
    .single();
  if (error || !data) {
    throw { code: "ISO_ASSESSMENT_CREATE_FAILED", message: error?.message ?? "Could not save assessment" };
  }
  return asAssessment(data as Record<string, unknown>);
}

export async function loadIsoTenantMembers(tenantId: string): Promise<IsoTenantMember[]> {
  const db = getAdminDb();
  const { data: memberships } = await db.from("UserTenant").select("userId").eq("tenantId", tenantId);
  const userIds = [...new Set(((memberships ?? []) as Array<{ userId: string }>).map((row) => row.userId))];
  if (userIds.length === 0) return [];
  const { data: users } = await db.from("User").select("id, name, email").in("id", userIds);
  return ((users ?? []) as Array<{ id: string; name: string | null; email: string }>).map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
  }));
}

export async function assertUserIsTenantMember(tenantId: string, userId: string): Promise<boolean> {
  const { data } = await getAdminDb()
    .from("UserTenant")
    .select("id")
    .eq("tenantId", tenantId)
    .eq("userId", userId)
    .maybeSingle();
  return Boolean(data);
}

export async function loadIsoReadiness(tenantId: string, enabledModules: string[]): Promise<{
  snapshot: IsoEvidenceSnapshot;
  statuses: IsoClauseStatus[];
  matrix: IsoMatrixRow[];
  readiness: IsoReadiness;
}> {
  const snapshot = await loadIsoEvidenceSnapshot(tenantId, enabledModules);
  const statuses = evaluateIsoClauses(snapshot);
  const matrix = await loadIsoClauseMatrix(tenantId, statuses);
  const db = getAdminDb();
  const [{ data: audits }, { data: reviews }, { data: nilIssues }] = await Promise.all([
    db.from("Audit").select("id").eq("tenantId", tenantId),
    db
      .from("ManagementReview")
      .select(
        "id, status, previousActionsStatus, interestedPartiesReview, complianceEvaluationReview, consultationReview",
      )
      .eq("tenantId", tenantId),
    db.from("IsoContextIssue").select("id, title").eq("tenantId", tenantId).ilike("title", "%nil return%"),
  ]);
  const auditIds = ((audits ?? []) as Array<{ id: string }>).map((row) => row.id);
  const { data: findings } =
    auditIds.length > 0
      ? await db.from("AuditFinding").select("id, findingType, status").in("auditId", auditIds)
      : { data: [] };

  const findingRows = (findings ?? []) as Array<{ findingType?: string; status?: string }>;
  const openMajorNcCount = findingRows.filter(
    (row) => row.findingType === "MAJOR_NC" && row.status !== "VERIFIED",
  ).length;
  const reviewRows = (reviews ?? []) as Array<{
    status?: string;
    previousActionsStatus?: string | null;
    interestedPartiesReview?: string | null;
    complianceEvaluationReview?: string | null;
    consultationReview?: string | null;
  }>;
  const managementReviewWith93 = reviewRows.some(
    (row) =>
      (row.status === "COMPLETED" || row.status === "APPROVED") &&
      hasIso93Input(row),
  );
  const documentedNilReturn = countRows(nilIssues) > 0;

  const readiness = buildIsoReadiness({
    statuses,
    assessments: matrix.map((row) => ({
      clauseKey: row.requirement.clauseKey,
      assessedLevel: row.assessment?.assessedLevel ?? null,
    })),
    snapshot,
    openMajorNcCount,
    completedIsoAudit: snapshot.completedAuditCount > 0 && snapshot.auditWithIsoClauses,
    managementReviewWith93,
    documentedNilReturn,
  });

  return { snapshot, statuses, matrix, readiness };
}

export async function generateIsoImplementationTasks(input: {
  tenantId: string;
  responsibleFallbackId: string;
  matrix: IsoMatrixRow[];
}): Promise<number> {
  let created = 0;
  const due = new Date();
  due.setDate(due.getDate() + 30);
  for (const row of input.matrix) {
    const assessed = row.assessment?.assessedLevel;
    const isOpen =
      assessed === "GAP" ||
      assessed === "MAJOR_GAP" ||
      (!assessed && (row.autoLevel === "missing" || row.autoLevel === "partial"));
    if (!isOpen) continue;
    if (row.assessment?.measureId) continue;
    const ownerId = row.assessment?.responsibleUserId ?? input.responsibleFallbackId;
    const measure = await insertMeasure({
      tenantId: input.tenantId,
      title: `ISO ${row.clause.standard === "ISO_45001" ? "45001" : "9001"} ${row.clause.clause}: ${row.clause.title}`,
      description: row.clause.doThis,
      dueAt: due,
      responsibleId: ownerId,
      status: "PENDING",
      category: "IMPROVEMENT",
    });
    await upsertIsoClauseAssessment({
      tenantId: input.tenantId,
      requirementId: row.requirement.id,
      assessedLevel: assessed ?? null,
      responsibleUserId: ownerId,
      measureId: measure.id,
    });
    created += 1;
  }
  return created;
}

export async function loadIsoConsultationHub(tenantId: string): Promise<IsoConsultationHub> {
  const db = getAdminDb();
  const [meetings, incidentsRes, actionsRes, whistleRes] = await Promise.all([
    loadIsoConsultationMeetings(tenantId),
    db
      .from("Incident")
      .select("id, title, type, status, reportedBy, occurredAt")
      .eq("tenantId", tenantId)
      .order("occurredAt", { ascending: false })
      .limit(40),
    db
      .from("Measure")
      .select("id, title, status, incidentId, dueAt, effectiveness")
      .eq("tenantId", tenantId)
      .not("incidentId", "is", null)
      .order("dueAt", { ascending: true })
      .limit(40),
    db
      .from("Whistleblowing")
      .select("id, caseNumber, title, status, isAnonymous")
      .eq("tenantId", tenantId)
      .order("createdAt", { ascending: false })
      .limit(20),
  ]);

  return {
    meetings,
    incidents: ((incidentsRes.data ?? []) as Record<string, unknown>[]).map((row) => ({
      id: String(row.id),
      title: String(row.title),
      type: String(row.type ?? ""),
      status: String(row.status ?? ""),
      reportedBy: row.reportedBy ? String(row.reportedBy) : null,
      occurredAt: parseDate(row.occurredAt),
    })),
    actions: ((actionsRes.data ?? []) as Record<string, unknown>[]).map((row) => ({
      id: String(row.id),
      title: String(row.title),
      status: String(row.status ?? ""),
      incidentId: row.incidentId ? String(row.incidentId) : null,
      dueAt: parseDate(row.dueAt),
      effectiveness: row.effectiveness ? String(row.effectiveness) : null,
    })),
    whistleblowing: ((whistleRes.data ?? []) as Record<string, unknown>[]).map((row) => ({
      id: String(row.id),
      caseNumber: String(row.caseNumber ?? ""),
      title: String(row.title ?? ""),
      status: String(row.status ?? ""),
      isAnonymous: Boolean(row.isAnonymous),
    })),
  };
}

export async function loadIsoAuditSamplePool(tenantId: string): Promise<IsoAuditSamplePool> {
  const db = getAdminDb();
  const [incidentsRes, risksRes, trainingRes] = await Promise.all([
    db
      .from("Incident")
      .select("id, title, type, status, rootCause, closedAt")
      .eq("tenantId", tenantId)
      .order("occurredAt", { ascending: false })
      .limit(12),
    db.from("RiskAssessment").select("id, title").eq("tenantId", tenantId).order("createdAt", { ascending: false }).limit(12),
    db
      .from("Training")
      .select("id, title, userId, validUntil")
      .eq("tenantId", tenantId)
      .order("createdAt", { ascending: false })
      .limit(12),
  ]);
  return {
    incidents: ((incidentsRes.data ?? []) as Record<string, unknown>[]).map((row) => ({
      id: String(row.id),
      title: String(row.title),
      type: String(row.type ?? ""),
      status: String(row.status ?? ""),
      rootCause: row.rootCause ? String(row.rootCause) : null,
      closedAt: parseDate(row.closedAt),
    })),
    risks: ((risksRes.data ?? []) as Record<string, unknown>[]).map((row) => ({
      id: String(row.id),
      title: String(row.title),
    })),
    trainings: ((trainingRes.data ?? []) as Record<string, unknown>[]).map((row) => ({
      id: String(row.id),
      title: String(row.title),
      userId: String(row.userId ?? ""),
      validUntil: parseDate(row.validUntil),
    })),
  };
}

export async function assertSampleRecordInTenant(
  tenantId: string,
  kind: "incident" | "risk" | "training",
  id: string,
): Promise<boolean> {
  const table = kind === "incident" ? "Incident" : kind === "risk" ? "RiskAssessment" : "Training";
  const { data } = await getAdminDb().from(table).select("id").eq("id", id).eq("tenantId", tenantId).maybeSingle();
  return Boolean(data);
}

export async function createMeasuresFromReviewPlan(
  tenantId: string,
  actionPlan: unknown,
): Promise<number> {
  const items = parseManagementReviewActions(actionPlan);
  let created = 0;
  const dueDefault = new Date();
  dueDefault.setDate(dueDefault.getDate() + 30);
  for (const item of items) {
    const member = await assertUserIsTenantMember(tenantId, item.ownerId);
    if (!member) continue;
    await insertMeasure({
      tenantId,
      title: item.title,
      description: "From management review (ISO 45001 / 9001 9.3)",
      dueAt: item.dueDate ? new Date(item.dueDate) : dueDefault,
      responsibleId: item.ownerId,
      status: "PENDING",
      category: "IMPROVEMENT",
    });
    created += 1;
  }
  return created;
}

export async function loadIsoClauseDocumentsByClause(
  tenantId: string,
): Promise<Map<string, IsoLinkedDocument[]>> {
  const db = getAdminDb();
  const { data: links, error } = await db
    .from("IsoClauseDocument")
    .select("id, clauseKey, documentId, role")
    .eq("tenantId", tenantId);
  const map = new Map<string, IsoLinkedDocument[]>();
  if (error || !links || links.length === 0) return map;
  const documentIds = [...new Set((links as Array<{ documentId: string }>).map((row) => row.documentId))];
  const { data: documents } = await db
    .from("Document")
    .select("id, title, version, status, ownerId, nextReviewDate")
    .eq("tenantId", tenantId)
    .in("id", documentIds);
  const byId = new Map(
    ((documents ?? []) as Array<Record<string, unknown>>).map((row) => [String(row.id), row] as const),
  );
  for (const link of links as Array<{ id: string; clauseKey: string; documentId: string; role: string }>) {
    const document = byId.get(link.documentId);
    if (!document) continue;
    const list = map.get(link.clauseKey) ?? [];
    list.push({
      id: String(document.id),
      linkId: link.id,
      title: String(document.title ?? ""),
      version: String(document.version ?? ""),
      status: String(document.status ?? ""),
      ownerId: document.ownerId ? String(document.ownerId) : null,
      nextReviewDate: parseDate(document.nextReviewDate),
      role: link.role,
    });
    map.set(link.clauseKey, list);
  }
  return map;
}

export async function loadIsoDocumentOptions(tenantId: string): Promise<IsoDocumentOption[]> {
  const { data } = await getAdminDb()
    .from("Document")
    .select("id, title, version, status")
    .eq("tenantId", tenantId)
    .order("title", { ascending: true });
  return ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id),
    title: String(row.title ?? ""),
    version: String(row.version ?? ""),
    status: String(row.status ?? ""),
  }));
}

export async function linkIsoClauseDocument(input: {
  tenantId: string;
  documentId: string;
  requirementId: string;
  clauseKey: string;
  role?: string;
}): Promise<void> {
  const db = getAdminDb();
  const { data: document } = await db
    .from("Document")
    .select("id")
    .eq("id", input.documentId)
    .eq("tenantId", input.tenantId)
    .maybeSingle();
  if (!document) {
    throw { code: "DOCUMENT_NOT_IN_TENANT", message: "That document is not in this organisation." };
  }
  const { error } = await db.from("IsoClauseDocument").upsert(
    {
      id: createId(),
      tenantId: input.tenantId,
      documentId: input.documentId,
      requirementId: input.requirementId,
      clauseKey: input.clauseKey,
      role: input.role ?? "PROCEDURE",
      updatedAt: nowIso(),
      createdAt: nowIso(),
    },
    { onConflict: "tenantId,documentId,requirementId" },
  );
  if (error) {
    throw { code: "ISO_DOC_LINK_FAILED", message: error.message };
  }
}

export async function unlinkIsoClauseDocument(tenantId: string, linkId: string): Promise<void> {
  const { error } = await getAdminDb()
    .from("IsoClauseDocument")
    .delete()
    .eq("tenantId", tenantId)
    .eq("id", linkId);
  if (error) {
    throw { code: "ISO_DOC_UNLINK_FAILED", message: error.message };
  }
}

export async function loadIsoProcesses(tenantId: string): Promise<IsoProcessRow[]> {
  const { data, error } = await getAdminDb()
    .from("IsoProcess")
    .select("*")
    .eq("tenantId", tenantId)
    .order("sequence", { ascending: true });
  if (error) return [];
  return ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id),
    name: String(row.name ?? ""),
    purpose: String(row.purpose ?? ""),
    ownerId: row.ownerId ? String(row.ownerId) : null,
    inputs: row.inputs ? String(row.inputs) : null,
    outputs: row.outputs ? String(row.outputs) : null,
    sequence: Number(row.sequence ?? 0),
  }));
}

export async function insertIsoProcess(input: {
  tenantId: string;
  name: string;
  purpose: string;
  ownerId?: string | null;
  inputs?: string | null;
  outputs?: string | null;
}): Promise<IsoProcessRow> {
  const existing = await loadIsoProcesses(input.tenantId);
  const row = {
    id: createId(),
    tenantId: input.tenantId,
    name: input.name,
    purpose: input.purpose,
    ownerId: input.ownerId ?? null,
    inputs: input.inputs ?? null,
    outputs: input.outputs ?? null,
    sequence: existing.length,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  const { data, error } = await getAdminDb().from("IsoProcess").insert(row).select("*").single();
  if (error || !data) {
    throw { code: "ISO_PROCESS_CREATE_FAILED", message: error?.message ?? "Could not save the process" };
  }
  return {
    id: String(data.id),
    name: String(data.name),
    purpose: String(data.purpose),
    ownerId: data.ownerId ? String(data.ownerId) : null,
    inputs: data.inputs ? String(data.inputs) : null,
    outputs: data.outputs ? String(data.outputs) : null,
    sequence: Number(data.sequence ?? 0),
  };
}

export async function deleteIsoProcess(tenantId: string, id: string): Promise<void> {
  const { error } = await getAdminDb().from("IsoProcess").delete().eq("tenantId", tenantId).eq("id", id);
  if (error) {
    throw { code: "ISO_PROCESS_DELETE_FAILED", message: error.message };
  }
}

export async function insertIsoCustomerFeedback(input: {
  tenantId: string;
  recordedById: string;
  summary: string;
  source?: string;
  sentiment?: string;
  customerCompany?: string | null;
}): Promise<void> {
  const { error } = await getAdminDb().from("CustomerFeedback").insert({
    id: createId(),
    tenantId: input.tenantId,
    recordedById: input.recordedById,
    summary: input.summary,
    source: input.source ?? "OTHER",
    sentiment: input.sentiment ?? "NEUTRAL",
    customerCompany: input.customerCompany ?? null,
    followUpStatus: "NEW",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  });
  if (error) {
    throw { code: "ISO_FEEDBACK_CREATE_FAILED", message: error.message };
  }
}

export async function loadIsoCustomerFeedback(tenantId: string): Promise<
  Array<{ id: string; summary: string; sentiment: string; customerCompany: string | null; recordedAt: Date | null }>
> {
  const { data, error } = await getAdminDb()
    .from("CustomerFeedback")
    .select("id, summary, sentiment, customerCompany, recordedAt")
    .eq("tenantId", tenantId)
    .order("recordedAt", { ascending: false })
    .limit(20);
  if (error) return [];
  return ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id),
    summary: String(row.summary ?? ""),
    sentiment: String(row.sentiment ?? ""),
    customerCompany: row.customerCompany ? String(row.customerCompany) : null,
    recordedAt: parseDate(row.recordedAt),
  }));
}

