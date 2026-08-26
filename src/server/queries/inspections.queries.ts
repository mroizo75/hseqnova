import { getAdminDb } from "@/lib/supabase/admin";
import { createId } from "@/lib/ids";
import { generateSequenceNumber } from "@/lib/sequence";
import type {
  FormField,
  FormSubmission,
  FormTemplate,
  Inspection,
  InspectionFinding,
  InspectionStatus,
  InspectionType,
  RiskCategory,
} from "@prisma/client";

export type InspectionPerson = { id: string; name: string | null; email: string | null };

export type InspectionListItem = Inspection & {
  findings: Array<Pick<InspectionFinding, "id" | "status">>;
  template: { id: string; industryScope: unknown } | null;
};

export type InspectionDetail = Inspection & {
  findings: InspectionFinding[];
  formTemplate: (Pick<FormTemplate, "id" | "title" | "description"> & {
    fields: Pick<FormField, "id" | "fieldType" | "label" | "isRequired" | "order">[];
  }) | null;
  formSubmission: (Pick<FormSubmission, "id"> & {
    fieldValues: Array<{ id: string; fieldId: string }>;
  }) | null;
};

export type InspectionReportItem = Inspection & {
  findings: InspectionFinding[];
};

function asInspection(row: Record<string, unknown>): Inspection {
  return row as unknown as Inspection;
}

function asFinding(row: Record<string, unknown>): InspectionFinding {
  return row as unknown as InspectionFinding;
}

async function loadPeopleById(ids: string[]): Promise<Map<string, InspectionPerson>> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return new Map();
  const { data } = await getAdminDb().from("User").select("id, name, email").in("id", unique);
  return new Map(((data ?? []) as InspectionPerson[]).map((person) => [person.id, person]));
}

export function parseParticipantIds(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export async function loadTenantIndustry(tenantId: string): Promise<string | null> {
  const { data, error } = await getAdminDb()
    .from("Tenant")
    .select("industry")
    .eq("id", tenantId)
    .maybeSingle();
  if (error) {
    throw { code: "TENANT_LOOKUP_FAILED", message: error.message };
  }
  return (data?.industry as string | null | undefined) ?? null;
}

export async function loadTenantBranding(tenantId: string): Promise<{
  name: string;
  orgNumber: string | null;
  logoUrl: string | null;
} | null> {
  const { data, error } = await getAdminDb()
    .from("Tenant")
    .select("name, orgNumber, logoUrl")
    .eq("id", tenantId)
    .maybeSingle();
  if (error) {
    throw { code: "TENANT_LOOKUP_FAILED", message: error.message };
  }
  if (!data) return null;
  return {
    name: data.name as string,
    orgNumber: (data.orgNumber as string | null) ?? null,
    logoUrl: (data.logoUrl as string | null) ?? null,
  };
}

export async function loadInspectionsForList(tenantId: string): Promise<InspectionListItem[]> {
  const db = getAdminDb();
  const { data: rows, error } = await db
    .from("Inspection")
    .select("*")
    .eq("tenantId", tenantId)
    .order("scheduledDate", { ascending: false });

  if (error) {
    throw { code: "INSPECTION_LIST_FAILED", message: error.message };
  }

  const inspections = ((rows ?? []) as Record<string, unknown>[]).map(asInspection);
  const inspectionIds = inspections.map((item) => item.id);
  const templateIds = [...new Set(inspections.map((item) => item.templateId).filter(Boolean))] as string[];

  const [{ data: findingRows }, { data: templateRows }] = await Promise.all([
    inspectionIds.length === 0
      ? Promise.resolve({ data: [] as Array<{ id: string; inspectionId: string; status: string }> })
      : db
          .from("InspectionFinding")
          .select("id, inspectionId, status")
          .in("inspectionId", inspectionIds)
          .in("status", ["OPEN", "IN_PROGRESS"]),
    templateIds.length === 0
      ? Promise.resolve({ data: [] as Array<{ id: string; industryScope: unknown }> })
      : db.from("InspectionTemplate").select("id, industryScope").in("id", templateIds),
  ]);

  const findingsByInspection = new Map<string, Array<Pick<InspectionFinding, "id" | "status">>>();
  for (const finding of (findingRows ?? []) as Array<{ id: string; inspectionId: string; status: InspectionFinding["status"] }>) {
    const current = findingsByInspection.get(finding.inspectionId) ?? [];
    current.push({ id: finding.id, status: finding.status });
    findingsByInspection.set(finding.inspectionId, current);
  }

  const templatesById = new Map(
    ((templateRows ?? []) as Array<{ id: string; industryScope: unknown }>).map((template) => [template.id, template]),
  );

  return inspections.map((inspection) => ({
    ...inspection,
    findings: findingsByInspection.get(inspection.id) ?? [],
    template: inspection.templateId ? templatesById.get(inspection.templateId) ?? null : null,
  }));
}

export async function loadInspectionsForReport(
  tenantId: string,
  startDate: Date,
  endDate: Date,
): Promise<InspectionReportItem[]> {
  const db = getAdminDb();
  const { data: rows, error } = await db
    .from("Inspection")
    .select("*")
    .eq("tenantId", tenantId)
    .gte("scheduledDate", startDate.toISOString())
    .lte("scheduledDate", endDate.toISOString())
    .order("scheduledDate", { ascending: true });

  if (error) {
    throw { code: "INSPECTION_REPORT_FAILED", message: error.message };
  }

  const inspections = ((rows ?? []) as Record<string, unknown>[]).map(asInspection);
  const ids = inspections.map((item) => item.id);
  if (ids.length === 0) return [];

  const { data: findingRows, error: findingError } = await db
    .from("InspectionFinding")
    .select("*")
    .in("inspectionId", ids)
    .order("severity", { ascending: false });

  if (findingError) {
    throw { code: "INSPECTION_FINDING_LIST_FAILED", message: findingError.message };
  }

  const findingsByInspection = new Map<string, InspectionFinding[]>();
  for (const finding of ((findingRows ?? []) as Record<string, unknown>[]).map(asFinding)) {
    const current = findingsByInspection.get(finding.inspectionId) ?? [];
    current.push(finding);
    findingsByInspection.set(finding.inspectionId, current);
  }

  return inspections.map((inspection) => ({
    ...inspection,
    findings: findingsByInspection.get(inspection.id) ?? [],
  }));
}

export async function loadInspectionPeople(ids: string[]): Promise<InspectionPerson[]> {
  const map = await loadPeopleById(ids);
  return [...map.values()];
}

export async function loadInspectionDetail(
  tenantId: string,
  inspectionId: string,
): Promise<InspectionDetail | null> {
  const db = getAdminDb();
  const { data: row, error } = await db
    .from("Inspection")
    .select("*")
    .eq("id", inspectionId)
    .eq("tenantId", tenantId)
    .maybeSingle();

  if (error) {
    throw { code: "INSPECTION_DETAIL_FAILED", message: error.message };
  }
  if (!row) return null;

  const inspection = asInspection(row as Record<string, unknown>);
  const { data: findingRows, error: findingError } = await db
    .from("InspectionFinding")
    .select("*")
    .eq("inspectionId", inspection.id)
    .order("createdAt", { ascending: false });

  if (findingError) {
    throw { code: "INSPECTION_FINDING_LIST_FAILED", message: findingError.message };
  }

  let formTemplate: InspectionDetail["formTemplate"] = null;
  let formSubmission: InspectionDetail["formSubmission"] = null;

  if (inspection.formTemplateId) {
    const [{ data: template }, { data: fields }] = await Promise.all([
      db
        .from("FormTemplate")
        .select("id, title, description")
        .eq("id", inspection.formTemplateId)
        .maybeSingle(),
      db
        .from("FormField")
        .select("id, fieldType, label, isRequired, order")
        .eq("formTemplateId", inspection.formTemplateId)
        .order("order", { ascending: true }),
    ]);
    if (template) {
      formTemplate = {
        id: template.id as string,
        title: template.title as string,
        description: (template.description as string | null) ?? null,
        fields: (fields ?? []) as Array<{
          id: string;
          fieldType: FormField["fieldType"];
          label: string;
          isRequired: boolean;
          order: number;
        }>,
      };
    }
  }

  if (inspection.formSubmissionId) {
    const [{ data: submission }, { data: values }] = await Promise.all([
      db.from("FormSubmission").select("id").eq("id", inspection.formSubmissionId).maybeSingle(),
      db.from("FormFieldValue").select("id, fieldId").eq("submissionId", inspection.formSubmissionId),
    ]);
    if (submission) {
      formSubmission = {
        id: submission.id as string,
        fieldValues: (values ?? []) as Array<{ id: string; fieldId: string }>,
      };
    }
  }

  return {
    ...inspection,
    findings: ((findingRows ?? []) as Record<string, unknown>[]).map(asFinding),
    formTemplate,
    formSubmission,
  };
}

function buildChecklistFromFormTemplateFields(
  fields: Array<{ label: string; fieldType: string }>,
): Record<string, unknown> | null {
  const checklistItems = fields
    .filter((field) => {
      const normalizedType = field.fieldType.toUpperCase();
      return normalizedType !== "SECTION" && normalizedType !== "HEADING" && normalizedType !== "SECTION_HEADER";
    })
    .map((field) => ({
      type: "item" as const,
      title: field.label,
      checked: false,
      status: "UNSET" as const,
      findingTitle: "",
      findingDescription: "",
      findingSeverity: 3,
      findingLocation: "",
      findingImageKeys: [] as string[],
    }));

  if (checklistItems.length === 0) return null;
  return { items: checklistItems };
}

export async function createInspectionRecord(input: {
  tenantId: string;
  userId: string;
  title?: string;
  description?: string | null;
  type?: InspectionType;
  scheduledDate: string;
  location?: string | null;
  conductedBy?: string;
  participants?: unknown;
  templateId?: string | null;
  formTemplateId?: string | null;
  riskCategory?: RiskCategory | null;
  area?: string | null;
  durationMinutes?: number | null;
  followUpById?: string | null;
  nextInspection?: string | null;
  projectId?: string | null;
}): Promise<Inspection & { findings: InspectionFinding[] }> {
  const db = getAdminDb();
  let validatedProjectId: string | null = null;
  let selectedTemplate: {
    id: string;
    name: string;
    description: string | null;
    riskCategory: string | null;
    checklist: unknown;
  } | null = null;
  let selectedFormTemplateChecklist: Record<string, unknown> | null = null;

  if (input.projectId) {
    const { data: project } = await db
      .from("Project")
      .select("id")
      .eq("id", input.projectId)
      .eq("tenantId", input.tenantId)
      .maybeSingle();
    if (!project) {
      throw { code: "PROJECT_NOT_FOUND", message: "Project not found" };
    }
    validatedProjectId = project.id as string;
  }

  if (input.templateId) {
    const { data: template } = await db
      .from("InspectionTemplate")
      .select("id, name, description, riskCategory, checklist, tenantId, isGlobal")
      .eq("id", input.templateId)
      .maybeSingle();
    if (
      !template ||
      (template.tenantId !== input.tenantId && !(template.tenantId == null && template.isGlobal))
    ) {
      throw { code: "TEMPLATE_NOT_FOUND", message: "Template not found" };
    }
    selectedTemplate = template as typeof selectedTemplate;
  }

  if (input.formTemplateId) {
    const { data: formTemplate } = await db
      .from("FormTemplate")
      .select("id, tenantId, isGlobal")
      .eq("id", input.formTemplateId)
      .maybeSingle();
    if (
      formTemplate &&
      (formTemplate.tenantId === input.tenantId || (formTemplate.tenantId == null && formTemplate.isGlobal))
    ) {
      const { data: fields } = await db
        .from("FormField")
        .select("label, fieldType")
        .eq("formTemplateId", input.formTemplateId)
        .order("order", { ascending: true });
      selectedFormTemplateChecklist = buildChecklistFromFormTemplateFields(
        (fields ?? []) as Array<{ label: string; fieldType: string }>,
      );
    }
  }

  const now = new Date().toISOString();
  const { data: created, error } = await db
    .from("Inspection")
    .insert({
      id: createId(),
      tenantId: input.tenantId,
      title: input.title || selectedTemplate?.name || "Workplace inspection",
      description: input.description || selectedTemplate?.description || null,
      type: input.type || "VERNERUNDE",
      status: "PLANNED",
      scheduledDate: new Date(input.scheduledDate).toISOString(),
      location: input.location ?? null,
      conductedBy: input.conductedBy || input.userId,
      participants: input.participants ? JSON.stringify(input.participants) : null,
      templateId: selectedTemplate?.id ?? input.templateId ?? null,
      formTemplateId: input.formTemplateId || null,
      riskCategory: input.riskCategory || selectedTemplate?.riskCategory || null,
      area: input.area || null,
      durationMinutes: input.durationMinutes ?? null,
      followUpById: input.followUpById || null,
      nextInspection: input.nextInspection ? new Date(input.nextInspection).toISOString() : null,
      checklist: selectedTemplate?.checklist ?? selectedFormTemplateChecklist ?? null,
      projectId: validatedProjectId,
      createdAt: now,
      updatedAt: now,
    })
    .select("*")
    .single();

  if (error || !created) {
    throw { code: "INSPECTION_CREATE_FAILED", message: error?.message || "Could not create inspection" };
  }

  return { ...asInspection(created as Record<string, unknown>), findings: [] };
}

export async function updateInspectionRecord(input: {
  tenantId: string;
  inspectionId: string;
  title?: string;
  description?: string | null;
  type?: InspectionType;
  status?: InspectionStatus;
  scheduledDate?: string;
  completedDate?: string | null;
  location?: string | null;
  conductedBy?: string;
  participants?: unknown;
  checklist?: unknown;
}): Promise<Inspection & { findings: InspectionFinding[] }> {
  const db = getAdminDb();
  const { data: existing } = await db
    .from("Inspection")
    .select("id")
    .eq("id", input.inspectionId)
    .eq("tenantId", input.tenantId)
    .maybeSingle();
  if (!existing) {
    throw { code: "INSPECTION_NOT_FOUND", message: "Inspection not found" };
  }

  const patch: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  if (input.title) patch.title = input.title;
  if (input.description !== undefined) patch.description = input.description;
  if (input.type) patch.type = input.type;
  if (input.status) patch.status = input.status;
  if (input.scheduledDate) patch.scheduledDate = new Date(input.scheduledDate).toISOString();
  if (input.completedDate) patch.completedDate = new Date(input.completedDate).toISOString();
  if (input.location !== undefined) patch.location = input.location;
  if (input.conductedBy) patch.conductedBy = input.conductedBy;
  if (input.participants !== undefined) {
    patch.participants = input.participants ? JSON.stringify(input.participants) : null;
  }
  if (input.checklist !== undefined) patch.checklist = input.checklist;

  const { data: updated, error } = await db
    .from("Inspection")
    .update(patch)
    .eq("id", input.inspectionId)
    .select("*")
    .single();

  if (error || !updated) {
    throw { code: "INSPECTION_UPDATE_FAILED", message: error?.message || "Could not update inspection" };
  }

  const { data: findings } = await db.from("InspectionFinding").select("*").eq("inspectionId", input.inspectionId);
  return {
    ...asInspection(updated as Record<string, unknown>),
    findings: ((findings ?? []) as Record<string, unknown>[]).map(asFinding),
  };
}

export async function deleteInspectionRecord(tenantId: string, inspectionId: string): Promise<void> {
  const db = getAdminDb();
  const { data: existing } = await db
    .from("Inspection")
    .select("id")
    .eq("id", inspectionId)
    .eq("tenantId", tenantId)
    .maybeSingle();
  if (!existing) {
    throw { code: "INSPECTION_NOT_FOUND", message: "Inspection not found" };
  }
  const { error } = await db.from("Inspection").delete().eq("id", inspectionId);
  if (error) {
    throw { code: "INSPECTION_DELETE_FAILED", message: error.message };
  }
}

export async function createInspectionFindingRecord(input: {
  tenantId: string;
  userId: string;
  inspectionId: string;
  title: string;
  description: string;
  severity?: number;
  location?: string | null;
  imageKeys?: unknown;
  responsibleId?: string | null;
  dueDate?: string | null;
}): Promise<InspectionFinding> {
  const db = getAdminDb();
  const { data: inspection } = await db
    .from("Inspection")
    .select("id, tenantId, title, location")
    .eq("id", input.inspectionId)
    .eq("tenantId", input.tenantId)
    .maybeSingle();
  if (!inspection) {
    throw { code: "INSPECTION_NOT_FOUND", message: "Inspection not found" };
  }

  const now = new Date().toISOString();
  const { data: finding, error } = await db
    .from("InspectionFinding")
    .insert({
      id: createId(),
      inspectionId: inspection.id,
      title: input.title,
      description: input.description,
      severity: input.severity || 3,
      location: input.location ?? null,
      imageKeys: input.imageKeys ? JSON.stringify(input.imageKeys) : null,
      status: "OPEN",
      responsibleId: input.responsibleId ?? null,
      dueDate: input.dueDate ? new Date(input.dueDate).toISOString() : null,
      createdAt: now,
      updatedAt: now,
    })
    .select("*")
    .single();

  if (error || !finding) {
    throw { code: "FINDING_CREATE_FAILED", message: error?.message || "Could not record finding" };
  }

  const occurredAt = new Date();
  const avviksnummer = await generateSequenceNumber(input.tenantId, "AVVIK", occurredAt.getFullYear());
  const findingDescription = input.description.trim();
  const findingLocation = (input.location ?? "").trim();
  const inspectionContext = `Source: workplace inspection "${inspection.title as string}"`;
  const incidentDescription = findingLocation
    ? `${inspectionContext}\nFinding location: ${findingLocation}\n\n${findingDescription}`
    : `${inspectionContext}\n\n${findingDescription}`;

  await db.from("Incident").insert({
    id: createId(),
    tenantId: input.tenantId,
    avviksnummer,
    type: "AVVIK",
    title: `[Inspection] ${input.title}`,
    description: incidentDescription,
    severity: typeof input.severity === "number" ? Math.max(1, Math.min(5, input.severity)) : null,
    occurredAt: occurredAt.toISOString(),
    reportedBy: input.userId,
    location: findingLocation || (inspection.location as string | null) || null,
    updatedAt: now,
  });

  return asFinding(finding as Record<string, unknown>);
}

export async function updateInspectionFindingRecord(input: {
  tenantId: string;
  findingId: string;
  title?: string;
  description?: string;
  severity?: number;
  location?: string | null;
  imageKeys?: unknown;
  status?: InspectionFinding["status"];
  responsibleId?: string | null;
  dueDate?: string | null;
  resolutionNotes?: string | null;
}): Promise<InspectionFinding> {
  const db = getAdminDb();
  const { data: existing } = await db
    .from("InspectionFinding")
    .select("id, inspectionId")
    .eq("id", input.findingId)
    .maybeSingle();
  if (!existing) {
    throw { code: "FINDING_NOT_FOUND", message: "Finding not found" };
  }

  const { data: inspection } = await db
    .from("Inspection")
    .select("id")
    .eq("id", existing.inspectionId)
    .eq("tenantId", input.tenantId)
    .maybeSingle();
  if (!inspection) {
    throw { code: "FINDING_NOT_FOUND", message: "Finding not found" };
  }

  const patch: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  if (input.title) patch.title = input.title;
  if (input.description) patch.description = input.description;
  if (input.severity) patch.severity = input.severity;
  if (input.location !== undefined) patch.location = input.location;
  if (input.imageKeys !== undefined) {
    patch.imageKeys = input.imageKeys ? JSON.stringify(input.imageKeys) : null;
  }
  if (input.status) patch.status = input.status;
  if (input.responsibleId !== undefined) patch.responsibleId = input.responsibleId;
  if (input.dueDate !== undefined) {
    patch.dueDate = input.dueDate ? new Date(input.dueDate).toISOString() : null;
  }
  if (input.resolutionNotes !== undefined) patch.resolutionNotes = input.resolutionNotes;
  if (input.status === "RESOLVED") patch.resolvedAt = new Date().toISOString();

  const { data: updated, error } = await db
    .from("InspectionFinding")
    .update(patch)
    .eq("id", input.findingId)
    .select("*")
    .single();

  if (error || !updated) {
    throw { code: "FINDING_UPDATE_FAILED", message: error?.message || "Could not update finding" };
  }
  return asFinding(updated as Record<string, unknown>);
}

export async function deleteInspectionFindingRecord(tenantId: string, findingId: string): Promise<void> {
  const db = getAdminDb();
  const { data: existing } = await db
    .from("InspectionFinding")
    .select("id, inspectionId")
    .eq("id", findingId)
    .maybeSingle();
  if (!existing) {
    throw { code: "FINDING_NOT_FOUND", message: "Finding not found" };
  }
  const { data: inspection } = await db
    .from("Inspection")
    .select("id")
    .eq("id", existing.inspectionId)
    .eq("tenantId", tenantId)
    .maybeSingle();
  if (!inspection) {
    throw { code: "FINDING_NOT_FOUND", message: "Finding not found" };
  }
  const { error } = await db.from("InspectionFinding").delete().eq("id", findingId);
  if (error) {
    throw { code: "FINDING_DELETE_FAILED", message: error.message };
  }
}

export async function loadInspectionFindings(tenantId: string, inspectionId: string): Promise<InspectionFinding[]> {
  const db = getAdminDb();
  const { data: inspection } = await db
    .from("Inspection")
    .select("id")
    .eq("id", inspectionId)
    .eq("tenantId", tenantId)
    .maybeSingle();
  if (!inspection) {
    throw { code: "INSPECTION_NOT_FOUND", message: "Inspection not found" };
  }
  const { data, error } = await db
    .from("InspectionFinding")
    .select("*")
    .eq("inspectionId", inspectionId)
    .order("createdAt", { ascending: false });
  if (error) {
    throw { code: "INSPECTION_FINDING_LIST_FAILED", message: error.message };
  }
  return ((data ?? []) as Record<string, unknown>[]).map(asFinding);
}
