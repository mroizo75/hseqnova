import { getAdminDb } from "@/lib/supabase/admin";
import { createId } from "@/lib/ids";
import type { Attachment, SjaAnalysis, SjaHazard, SjaTemplate, SjaTemplateHazard } from "@prisma/client";

export type SjaHazardInput = {
  activity: string;
  hazard: string;
  consequence?: string | null;
  probability: number;
  severity: number;
  measures: string;
  responsibleName?: string | null;
};

export type SjaAnalysisWithHazards = SjaAnalysis & { hazards: SjaHazard[] };
export type SjaAnalysisDetail = SjaAnalysisWithHazards & { attachments: Attachment[] };
export type SjaTemplateWithHazards = SjaTemplate & { hazards: SjaTemplateHazard[] };
export type SjaProjectOption = { id: string; name: string; location: string | null };

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

function asAnalysis(row: Record<string, unknown>): SjaAnalysis {
  return {
    ...row,
    plannedDate: parseDate(row.plannedDate) ?? new Date(0),
    submittedAt: parseDate(row.submittedAt),
    approvedAt: parseDate(row.approvedAt),
    createdAt: parseDate(row.createdAt) ?? new Date(0),
    updatedAt: parseDate(row.updatedAt) ?? new Date(0),
  } as SjaAnalysis;
}

function asHazard(row: Record<string, unknown>): SjaHazard {
  return {
    ...row,
    probability: Number(row.probability ?? 1),
    severity: Number(row.severity ?? 1),
    riskLevel: Number(row.riskLevel ?? 1),
    sortOrder: Number(row.sortOrder ?? 0),
    completed: Boolean(row.completed),
  } as SjaHazard;
}

function asTemplate(row: Record<string, unknown>): SjaTemplate {
  return {
    ...row,
    isActive: Boolean(row.isActive),
    createdAt: parseDate(row.createdAt) ?? new Date(0),
    updatedAt: parseDate(row.updatedAt) ?? new Date(0),
  } as SjaTemplate;
}

function asTemplateHazard(row: Record<string, unknown>): SjaTemplateHazard {
  return {
    ...row,
    probability: Number(row.probability ?? 1),
    severity: Number(row.severity ?? 1),
    sortOrder: Number(row.sortOrder ?? 0),
  } as SjaTemplateHazard;
}

function asAttachment(row: Record<string, unknown>): Attachment {
  return {
    ...row,
    createdAt: parseDate(row.createdAt) ?? new Date(0),
  } as Attachment;
}

async function insertSjaAudit(input: {
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

async function loadHazardsForAnalyses(ids: string[]): Promise<Map<string, SjaHazard[]>> {
  if (ids.length === 0) return new Map();
  const { data, error } = await getAdminDb()
    .from("SjaHazard")
    .select("*")
    .in("sjaAnalysisId", ids)
    .order("sortOrder", { ascending: true });
  if (error) {
    throw { code: "SJA_HAZARD_LIST_FAILED", message: error.message };
  }
  const grouped = new Map<string, SjaHazard[]>();
  for (const row of data ?? []) {
    const hazard = asHazard(row as Record<string, unknown>);
    const list = grouped.get(hazard.sjaAnalysisId) ?? [];
    list.push(hazard);
    grouped.set(hazard.sjaAnalysisId, list);
  }
  return grouped;
}

async function loadTemplateHazards(ids: string[]): Promise<Map<string, SjaTemplateHazard[]>> {
  if (ids.length === 0) return new Map();
  const { data, error } = await getAdminDb()
    .from("SjaTemplateHazard")
    .select("*")
    .in("templateId", ids)
    .order("sortOrder", { ascending: true });
  if (error) {
    throw { code: "SJA_TEMPLATE_HAZARD_FAILED", message: error.message };
  }
  const grouped = new Map<string, SjaTemplateHazard[]>();
  for (const row of data ?? []) {
    const hazard = asTemplateHazard(row as Record<string, unknown>);
    const list = grouped.get(hazard.templateId) ?? [];
    list.push(hazard);
    grouped.set(hazard.templateId, list);
  }
  return grouped;
}

export async function loadSjaAnalysesForTenant(
  tenantId: string,
  opts?: { createdById?: string; take?: number },
): Promise<SjaAnalysisWithHazards[]> {
  let query = getAdminDb().from("SjaAnalysis").select("*").eq("tenantId", tenantId);
  if (opts?.createdById) {
    query = query.eq("createdById", opts.createdById);
  }
  query = query.order("plannedDate", { ascending: false });
  if (opts?.take) {
    query = query.limit(opts.take);
  }
  const { data, error } = await query;
  if (error) {
    throw { code: "SJA_LIST_FAILED", message: error.message };
  }
  const analyses = (data ?? []).map((row) => asAnalysis(row as Record<string, unknown>));
  const hazards = await loadHazardsForAnalyses(analyses.map((row) => row.id));
  return analyses.map((row) => ({ ...row, hazards: hazards.get(row.id) ?? [] }));
}

export async function loadSjaById(
  id: string,
  tenantId: string,
  opts?: { createdById?: string },
): Promise<SjaAnalysisDetail | null> {
  let query = getAdminDb().from("SjaAnalysis").select("*").eq("id", id).eq("tenantId", tenantId);
  if (opts?.createdById) {
    query = query.eq("createdById", opts.createdById);
  }
  const { data, error } = await query.maybeSingle();
  if (error) {
    throw { code: "SJA_LOOKUP_FAILED", message: error.message };
  }
  if (!data) return null;

  const analysis = asAnalysis(data as Record<string, unknown>);
  const [hazards, attachments] = await Promise.all([
    loadHazardsForAnalyses([analysis.id]),
    loadSjaAttachments(analysis.id),
  ]);
  return {
    ...analysis,
    hazards: hazards.get(analysis.id) ?? [],
    attachments,
  };
}

export async function loadSjaAttachments(sjaAnalysisId: string): Promise<Attachment[]> {
  const { data, error } = await getAdminDb()
    .from("Attachment")
    .select("*")
    .eq("sjaAnalysisId", sjaAnalysisId)
    .order("createdAt", { ascending: true });
  if (error) {
    throw { code: "SJA_ATTACHMENT_FAILED", message: error.message };
  }
  return (data ?? []).map((row) => asAttachment(row as Record<string, unknown>));
}

export async function loadSjaTemplates(
  tenantId: string,
  opts?: { id?: string },
): Promise<SjaTemplateWithHazards[]> {
  let query = getAdminDb()
    .from("SjaTemplate")
    .select("*")
    .eq("tenantId", tenantId)
    .eq("isActive", true);
  if (opts?.id) {
    query = query.eq("id", opts.id);
  }
  const { data, error } = await query.order("name", { ascending: true });
  if (error) {
    throw { code: "SJA_TEMPLATE_LIST_FAILED", message: error.message };
  }
  const templates = (data ?? []).map((row) => asTemplate(row as Record<string, unknown>));
  const hazards = await loadTemplateHazards(templates.map((row) => row.id));
  return templates.map((row) => ({ ...row, hazards: hazards.get(row.id) ?? [] }));
}

export async function loadSjaTemplateById(
  id: string,
  tenantId: string,
): Promise<SjaTemplateWithHazards | null> {
  const templates = await loadSjaTemplates(tenantId, { id });
  return templates[0] ?? null;
}

export async function loadActiveProjects(tenantId: string): Promise<SjaProjectOption[]> {
  const { data, error } = await getAdminDb()
    .from("Project")
    .select("id, name, location")
    .eq("tenantId", tenantId)
    .in("status", ["PLANNING", "ACTIVE"])
    .order("name", { ascending: true });
  if (error) {
    throw { code: "PROJECT_LIST_FAILED", message: error.message };
  }
  return (data ?? []).map((row) => ({
    id: String(row.id),
    name: String(row.name ?? ""),
    location: (row.location as string | null) ?? null,
  }));
}

export async function loadSjaProject(
  projectId: string,
  tenantId: string,
): Promise<SjaProjectOption | null> {
  const { data, error } = await getAdminDb()
    .from("Project")
    .select("id, name, location")
    .eq("id", projectId)
    .eq("tenantId", tenantId)
    .maybeSingle();
  if (error) {
    throw { code: "PROJECT_LOOKUP_FAILED", message: error.message };
  }
  if (!data) return null;
  return {
    id: String(data.id),
    name: String(data.name ?? ""),
    location: (data.location as string | null) ?? null,
  };
}

function hazardRows(sjaAnalysisId: string, hazards: SjaHazardInput[]) {
  return hazards.map((hazard, index) => ({
    id: createId(),
    sjaAnalysisId,
    sortOrder: index,
    activity: hazard.activity,
    hazard: hazard.hazard,
    consequence: hazard.consequence ?? null,
    probability: hazard.probability,
    severity: hazard.severity,
    riskLevel: hazard.probability * hazard.severity,
    measures: hazard.measures,
    responsibleName: hazard.responsibleName ?? null,
    completed: false,
  }));
}

export async function insertSjaAnalysis(input: {
  tenantId: string;
  sjaNummer: string;
  title: string;
  description?: string | null;
  workLocation: string;
  plannedDate: Date | string;
  responsibleName: string;
  participants: string;
  additionalConditions?: string | null;
  weatherConditions?: string | null;
  createdById: string;
  createdByName: string;
  templateId?: string | null;
  templateName?: string | null;
  projectId?: string | null;
  hazards: SjaHazardInput[];
}): Promise<SjaAnalysisWithHazards> {
  const now = nowIso();
  const id = createId();
  const { data, error } = await getAdminDb()
    .from("SjaAnalysis")
    .insert({
      id,
      tenantId: input.tenantId,
      sjaNummer: input.sjaNummer,
      title: input.title,
      description: input.description ?? null,
      workLocation: input.workLocation,
      plannedDate: toIso(input.plannedDate),
      responsibleName: input.responsibleName,
      participants: input.participants,
      additionalConditions: input.additionalConditions ?? null,
      weatherConditions: input.weatherConditions ?? null,
      createdById: input.createdById,
      createdByName: input.createdByName,
      templateId: input.templateId ?? null,
      templateName: input.templateName ?? null,
      projectId: input.projectId ?? null,
      submittedAt: now,
      signedByNames: input.participants,
      status: "DRAFT",
      conclusion: "NOT_DECIDED",
      createdAt: now,
      updatedAt: now,
    })
    .select("*")
    .single();
  if (error || !data) {
    throw { code: "SJA_CREATE_FAILED", message: error?.message || "Could not create the RAMS" };
  }

  const rows = hazardRows(id, input.hazards);
  const { error: hazardError } = await getAdminDb().from("SjaHazard").insert(rows);
  if (hazardError) {
    throw { code: "SJA_HAZARD_CREATE_FAILED", message: hazardError.message };
  }

  return {
    ...asAnalysis(data as Record<string, unknown>),
    hazards: rows.map((row) => asHazard(row)),
  };
}

export async function updateSjaAnalysisRecord(
  id: string,
  tenantId: string,
  patch: Record<string, unknown>,
  hazards?: SjaHazardInput[],
): Promise<SjaAnalysisWithHazards> {
  const serialized: Record<string, unknown> = { updatedAt: nowIso() };
  for (const [key, value] of Object.entries(patch)) {
    if (key === "id" || key === "tenantId" || key === "hazards") continue;
    serialized[key] = value instanceof Date ? value.toISOString() : value;
  }

  if (hazards) {
    const { error: deleteError } = await getAdminDb().from("SjaHazard").delete().eq("sjaAnalysisId", id);
    if (deleteError) {
      throw { code: "SJA_HAZARD_DELETE_FAILED", message: deleteError.message };
    }
    const { error: insertError } = await getAdminDb().from("SjaHazard").insert(hazardRows(id, hazards));
    if (insertError) {
      throw { code: "SJA_HAZARD_CREATE_FAILED", message: insertError.message };
    }
  }

  const { data, error } = await getAdminDb()
    .from("SjaAnalysis")
    .update(serialized)
    .eq("id", id)
    .eq("tenantId", tenantId)
    .select("*")
    .single();
  if (error || !data) {
    throw { code: "SJA_UPDATE_FAILED", message: error?.message || "Could not update the RAMS" };
  }

  const grouped = await loadHazardsForAnalyses([id]);
  return {
    ...asAnalysis(data as Record<string, unknown>),
    hazards: grouped.get(id) ?? [],
  };
}

export async function deleteSjaAnalysisRecord(id: string, tenantId: string): Promise<void> {
  const { error: hazardError } = await getAdminDb().from("SjaHazard").delete().eq("sjaAnalysisId", id);
  if (hazardError) {
    throw { code: "SJA_HAZARD_DELETE_FAILED", message: hazardError.message };
  }
  const { error: attachmentError } = await getAdminDb().from("Attachment").delete().eq("sjaAnalysisId", id);
  if (attachmentError) {
    throw { code: "SJA_ATTACHMENT_DELETE_FAILED", message: attachmentError.message };
  }
  const { error } = await getAdminDb().from("SjaAnalysis").delete().eq("id", id).eq("tenantId", tenantId);
  if (error) {
    throw { code: "SJA_DELETE_FAILED", message: error.message };
  }
}

export async function insertSjaTemplate(input: {
  tenantId: string;
  name: string;
  description?: string | null;
  workLocation?: string | null;
  createdById: string;
  createdByName: string;
  hazards: SjaHazardInput[];
}): Promise<SjaTemplateWithHazards> {
  const now = nowIso();
  const id = createId();
  const { data, error } = await getAdminDb()
    .from("SjaTemplate")
    .insert({
      id,
      tenantId: input.tenantId,
      name: input.name,
      description: input.description ?? null,
      workLocation: input.workLocation ?? null,
      isActive: true,
      createdById: input.createdById,
      createdByName: input.createdByName,
      createdAt: now,
      updatedAt: now,
    })
    .select("*")
    .single();
  if (error || !data) {
    throw { code: "SJA_TEMPLATE_CREATE_FAILED", message: error?.message || "Could not create the RAMS template" };
  }

  const hazardPayload = input.hazards.map((hazard, index) => ({
    id: createId(),
    templateId: id,
    sortOrder: index,
    activity: hazard.activity,
    hazard: hazard.hazard,
    consequence: hazard.consequence ?? null,
    probability: hazard.probability,
    severity: hazard.severity,
    measures: hazard.measures,
    responsibleName: hazard.responsibleName ?? null,
  }));
  const { error: hazardError } = await getAdminDb().from("SjaTemplateHazard").insert(hazardPayload);
  if (hazardError) {
    throw { code: "SJA_TEMPLATE_HAZARD_FAILED", message: hazardError.message };
  }

  return {
    ...asTemplate(data as Record<string, unknown>),
    hazards: hazardPayload.map((row) => asTemplateHazard(row)),
  };
}

export async function deactivateSjaTemplate(id: string, tenantId: string): Promise<SjaTemplate | null> {
  const { data, error } = await getAdminDb()
    .from("SjaTemplate")
    .update({ isActive: false, updatedAt: nowIso() })
    .eq("id", id)
    .eq("tenantId", tenantId)
    .select("*")
    .maybeSingle();
  if (error) {
    throw { code: "SJA_TEMPLATE_DELETE_FAILED", message: error.message };
  }
  return data ? asTemplate(data as Record<string, unknown>) : null;
}

export async function insertSjaAttachment(input: {
  tenantId: string;
  sjaAnalysisId: string;
  fileKey: string;
  name: string;
  mime: string;
  size: number;
}): Promise<void> {
  const { error } = await getAdminDb().from("Attachment").insert({
    id: createId(),
    tenantId: input.tenantId,
    sjaAnalysisId: input.sjaAnalysisId,
    fileKey: input.fileKey,
    name: input.name,
    mime: input.mime,
    size: input.size,
    createdAt: nowIso(),
  });
  if (error) {
    throw { code: "SJA_ATTACHMENT_CREATE_FAILED", message: error.message };
  }
}

export async function logSjaAction(input: {
  tenantId: string;
  userId: string;
  action: string;
  resource: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await insertSjaAudit(input);
}
