import { getAdminDb } from "@/lib/supabase/admin";
import { createId } from "@/lib/ids";
import { tenantHasModule } from "@/lib/tenant-modules";
import { EMPTY_ISO_SNAPSHOT, type IsoEvidenceSnapshot } from "@/features/iso/lib/evidence";

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
  ] = await Promise.all([
    db.from("IsoContextIssue").select("id, kind").eq("tenantId", tenantId),
    db.from("IsoInterestedParty").select("id").eq("tenantId", tenantId),
    db.from("IsoScope").select("id, qualityScope, approvedAt").eq("tenantId", tenantId).maybeSingle(),
    db.from("IsoLegalRequirement").select("id, lastEvaluationResult").eq("tenantId", tenantId),
    db.from("IsoChange").select("id").eq("tenantId", tenantId),
    db.from("Meeting").select("id").eq("tenantId", tenantId),
    db.from("Document").select("id, title").eq("tenantId", tenantId).eq("status", "APPROVED").limit(50),
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
    db.from("Incident").select("id").eq("tenantId", tenantId),
    db.from("Measure").select("id, status, effectiveness").eq("tenantId", tenantId),
    db.from("HmsHandbook").select("id, currentVersionId").eq("tenantId", tenantId).maybeSingle(),
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
      auditWithIsoClauses = findingRows.some(
        (row) => String(row.clause ?? "").includes("45001") || String(row.clause ?? "").includes("9001"),
      );
    }
    const sigIndex = completedIds.length > 0 ? 1 : 0;
    if (handbook?.id) {
      signatureCount = countRows(extraRows[sigIndex]?.data);
    }
  }

  const reviewRows = (reviewsRes.data ?? []) as Array<{ status?: string }>;
  const measureRows = (measuresRes.data ?? []) as Array<{ status?: string; effectiveness?: string | null }>;
  const policyDocs = (policyRes.data ?? []) as Array<{ title?: string }>;
  const qualityDocs = policyDocs.some((doc) => /quality/i.test(String(doc.title ?? "")));
  const scope = scopeRes.data as { qualityScope?: string | null; approvedAt?: string | null } | null;

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
    completedReviewCount: reviewRows.filter((row) => row.status === "COMPLETED" || row.status === "APPROVED").length,
    incidentCount: countRows(incidentsRes.data),
    actionsWithEffectiveness: measureRows.filter(
      (row) => row.effectiveness && row.effectiveness !== "NOT_EVALUATED",
    ).length,
    openActionCount: measureRows.filter((row) => row.status !== "DONE").length,
  };
}
