import { getAdminDb } from "@/lib/supabase/admin";
import { createId } from "@/lib/ids";
import type { CourseTemplate, Training } from "@prisma/client";

export type TrainingPerson = { id: string; name: string | null; email: string };

export type TrainingListItem = Training & {
  user?: TrainingPerson;
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

function asTraining(row: Record<string, unknown>): Training {
  return {
    ...row,
    completedAt: parseDate(row.completedAt),
    validUntil: parseDate(row.validUntil),
    evaluatedAt: parseDate(row.evaluatedAt),
    createdAt: parseDate(row.createdAt) ?? new Date(0),
    updatedAt: parseDate(row.updatedAt) ?? new Date(0),
  } as Training;
}

function asCourseTemplate(row: Record<string, unknown>): CourseTemplate {
  return {
    ...row,
    createdAt: parseDate(row.createdAt) ?? new Date(0),
    updatedAt: parseDate(row.updatedAt) ?? new Date(0),
  } as CourseTemplate;
}

async function insertTrainingAudit(input: {
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
    name: String(data.name ?? ""),
    orgNumber: (data.orgNumber as string | null) ?? null,
    logoUrl: (data.logoUrl as string | null) ?? null,
  };
}

export async function loadTrainingPeople(tenantId: string): Promise<TrainingPerson[]> {
  const { data: memberships, error } = await getAdminDb()
    .from("UserTenant")
    .select("userId")
    .eq("tenantId", tenantId);
  if (error) {
    throw { code: "TRAINING_PEOPLE_FAILED", message: error.message };
  }
  const userIds = [...new Set((memberships ?? []).map((row) => String(row.userId)))];
  if (userIds.length === 0) return [];

  const { data: users, error: userError } = await getAdminDb()
    .from("User")
    .select("id, name, email")
    .in("id", userIds);
  if (userError) {
    throw { code: "TRAINING_PEOPLE_FAILED", message: userError.message };
  }
  return ((users ?? []) as Array<{ id: string; name: string | null; email: string }>).map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
  }));
}

export async function loadCourseTemplatesForTenant(
  tenantId: string,
  opts?: { activeOnly?: boolean },
): Promise<CourseTemplate[]> {
  const db = getAdminDb();
  let tenantQuery = db.from("CourseTemplate").select("*").eq("tenantId", tenantId);
  let globalQuery = db.from("CourseTemplate").select("*").eq("isGlobal", true);
  if (opts?.activeOnly !== false) {
    tenantQuery = tenantQuery.eq("isActive", true);
    globalQuery = globalQuery.eq("isActive", true);
  }

  const [tenantResult, globalResult] = await Promise.all([tenantQuery, globalQuery]);
  if (tenantResult.error) {
    throw { code: "COURSE_TEMPLATE_LIST_FAILED", message: tenantResult.error.message };
  }
  if (globalResult.error) {
    throw { code: "COURSE_TEMPLATE_LIST_FAILED", message: globalResult.error.message };
  }

  const byId = new Map<string, CourseTemplate>();
  for (const row of [...(globalResult.data ?? []), ...(tenantResult.data ?? [])]) {
    const template = asCourseTemplate(row as Record<string, unknown>);
    byId.set(template.id, template);
  }
  return [...byId.values()].sort((a, b) => a.title.localeCompare(b.title, "en"));
}

export async function loadActiveCourseTemplatesSplit(tenantId: string): Promise<{
  globalCourses: CourseTemplate[];
  tenantCourses: CourseTemplate[];
}> {
  const db = getAdminDb();
  const [globalResult, tenantResult] = await Promise.all([
    db.from("CourseTemplate").select("*").eq("isGlobal", true).eq("isActive", true).order("title"),
    db.from("CourseTemplate").select("*").eq("tenantId", tenantId).eq("isActive", true).order("title"),
  ]);
  if (globalResult.error) {
    throw { code: "COURSE_TEMPLATE_LIST_FAILED", message: globalResult.error.message };
  }
  if (tenantResult.error) {
    throw { code: "COURSE_TEMPLATE_LIST_FAILED", message: tenantResult.error.message };
  }
  return {
    globalCourses: (globalResult.data ?? []).map((row) => asCourseTemplate(row as Record<string, unknown>)),
    tenantCourses: (tenantResult.data ?? []).map((row) => asCourseTemplate(row as Record<string, unknown>)),
  };
}

export async function loadTrainingsForTenant(
  tenantId: string,
  opts?: { userId?: string; take?: number; orderBy?: "createdAt" | "courseKey" | "completedAt" },
): Promise<Training[]> {
  let query = getAdminDb().from("Training").select("*").eq("tenantId", tenantId);
  if (opts?.userId) {
    query = query.eq("userId", opts.userId);
  }
  const orderBy = opts?.orderBy ?? "createdAt";
  query = query.order(orderBy, { ascending: orderBy === "courseKey" });
  if (opts?.take) {
    query = query.limit(opts.take);
  }
  const { data, error } = await query;
  if (error) {
    throw { code: "TRAINING_LIST_FAILED", message: error.message };
  }
  return (data ?? []).map((row) => asTraining(row as Record<string, unknown>));
}

export async function loadRequiredTrainings(tenantId: string): Promise<Training[]> {
  const { data, error } = await getAdminDb()
    .from("Training")
    .select("*")
    .eq("tenantId", tenantId)
    .eq("isRequired", true)
    .order("title", { ascending: true });
  if (error) {
    throw { code: "TRAINING_LIST_FAILED", message: error.message };
  }
  return (data ?? []).map((row) => asTraining(row as Record<string, unknown>));
}

export async function loadTrainingById(input: {
  id: string;
  tenantId: string;
  userId?: string;
}): Promise<Training | null> {
  let query = getAdminDb()
    .from("Training")
    .select("*")
    .eq("id", input.id)
    .eq("tenantId", input.tenantId);
  if (input.userId) {
    query = query.eq("userId", input.userId);
  }
  const { data, error } = await query.maybeSingle();
  if (error) {
    throw { code: "TRAINING_LOOKUP_FAILED", message: error.message };
  }
  return data ? asTraining(data as Record<string, unknown>) : null;
}

export async function loadPersonById(id: string): Promise<TrainingPerson | null> {
  const { data, error } = await getAdminDb()
    .from("User")
    .select("id, name, email")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    throw { code: "USER_LOOKUP_FAILED", message: error.message };
  }
  if (!data) return null;
  return { id: String(data.id), name: (data.name as string | null) ?? null, email: String(data.email ?? "") };
}

export async function findDuplicateTraining(input: {
  tenantId: string;
  userId: string;
  courseKey: string;
  completedAt?: Date | null;
}): Promise<Training | null> {
  let query = getAdminDb()
    .from("Training")
    .select("*")
    .eq("tenantId", input.tenantId)
    .eq("userId", input.userId)
    .eq("courseKey", input.courseKey);
  const completedAt = toIso(input.completedAt ?? null);
  query = completedAt ? query.eq("completedAt", completedAt) : query.is("completedAt", null);
  const { data, error } = await query.limit(1).maybeSingle();
  if (error) {
    throw { code: "TRAINING_LOOKUP_FAILED", message: error.message };
  }
  return data ? asTraining(data as Record<string, unknown>) : null;
}

export async function findTrainingByCourseKey(input: {
  tenantId: string;
  userId: string;
  courseKey: string;
}): Promise<Training | null> {
  const { data, error } = await getAdminDb()
    .from("Training")
    .select("*")
    .eq("tenantId", input.tenantId)
    .eq("userId", input.userId)
    .eq("courseKey", input.courseKey)
    .order("createdAt", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    throw { code: "TRAINING_LOOKUP_FAILED", message: error.message };
  }
  return data ? asTraining(data as Record<string, unknown>) : null;
}

export async function insertTraining(input: {
  tenantId: string;
  userId: string;
  courseKey: string;
  title: string;
  provider: string;
  description?: string | null;
  completedAt?: Date | string | null;
  validUntil?: Date | string | null;
  proofDocKey?: string | null;
  isRequired?: boolean;
  effectiveness?: string | null;
}): Promise<Training> {
  const now = nowIso();
  const { data, error } = await getAdminDb()
    .from("Training")
    .insert({
      id: createId(),
      tenantId: input.tenantId,
      userId: input.userId,
      courseKey: input.courseKey,
      title: input.title,
      provider: input.provider,
      description: input.description ?? null,
      completedAt: toIso(input.completedAt ?? null),
      validUntil: toIso(input.validUntil ?? null),
      proofDocKey: input.proofDocKey ?? null,
      isRequired: input.isRequired ?? false,
      effectiveness: input.effectiveness ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .select("*")
    .single();
  if (error || !data) {
    throw { code: "TRAINING_CREATE_FAILED", message: error?.message || "Could not create training" };
  }
  return asTraining(data as Record<string, unknown>);
}

export async function insertTrainings(
  rows: Array<Parameters<typeof insertTraining>[0]>,
): Promise<Training[]> {
  const now = nowIso();
  const payload = rows.map((input) => ({
    id: createId(),
    tenantId: input.tenantId,
    userId: input.userId,
    courseKey: input.courseKey,
    title: input.title,
    provider: input.provider,
    description: input.description ?? null,
    completedAt: toIso(input.completedAt ?? null),
    validUntil: toIso(input.validUntil ?? null),
    proofDocKey: input.proofDocKey ?? null,
    isRequired: input.isRequired ?? false,
    effectiveness: input.effectiveness ?? null,
    createdAt: now,
    updatedAt: now,
  }));
  const { data, error } = await getAdminDb().from("Training").insert(payload).select("*");
  if (error) {
    throw { code: "TRAINING_CREATE_FAILED", message: error.message };
  }
  return (data ?? []).map((row) => asTraining(row as Record<string, unknown>));
}

export async function updateTrainingRecord(
  id: string,
  tenantId: string,
  patch: Record<string, unknown>,
): Promise<Training> {
  const serialized: Record<string, unknown> = { updatedAt: nowIso() };
  for (const [key, value] of Object.entries(patch)) {
    if (key === "id" || key === "tenantId") continue;
    serialized[key] = value instanceof Date ? value.toISOString() : value;
  }
  const { data, error } = await getAdminDb()
    .from("Training")
    .update(serialized)
    .eq("id", id)
    .eq("tenantId", tenantId)
    .select("*")
    .single();
  if (error || !data) {
    throw { code: "TRAINING_UPDATE_FAILED", message: error?.message || "Could not update training" };
  }
  return asTraining(data as Record<string, unknown>);
}

export async function deleteTrainingRecord(id: string, tenantId: string): Promise<void> {
  const { error } = await getAdminDb().from("Training").delete().eq("id", id).eq("tenantId", tenantId);
  if (error) {
    throw { code: "TRAINING_DELETE_FAILED", message: error.message };
  }
}

export async function logTrainingAction(input: {
  tenantId: string;
  userId: string;
  action: string;
  resource: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await insertTrainingAudit(input);
}

export async function findCourseTemplateByTenantKey(
  tenantId: string,
  courseKey: string,
): Promise<CourseTemplate | null> {
  const { data, error } = await getAdminDb()
    .from("CourseTemplate")
    .select("*")
    .eq("tenantId", tenantId)
    .eq("courseKey", courseKey)
    .maybeSingle();
  if (error) {
    throw { code: "COURSE_TEMPLATE_LOOKUP_FAILED", message: error.message };
  }
  return data ? asCourseTemplate(data as Record<string, unknown>) : null;
}

export async function findCourseTemplateById(id: string): Promise<CourseTemplate | null> {
  const { data, error } = await getAdminDb()
    .from("CourseTemplate")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    throw { code: "COURSE_TEMPLATE_LOOKUP_FAILED", message: error.message };
  }
  return data ? asCourseTemplate(data as Record<string, unknown>) : null;
}

export async function findCourseTemplateForTenant(
  id: string,
  tenantId: string,
): Promise<CourseTemplate | null> {
  const template = await findCourseTemplateById(id);
  if (!template || template.tenantId !== tenantId) return null;
  return template;
}

export type HealthcareAlertTenant = {
  id: string;
  name: string;
  industry: string | null;
  status: string;
};

export async function loadTenantsForHealthcareAlerts(
  tenantId?: string,
): Promise<HealthcareAlertTenant[]> {
  let query = getAdminDb().from("Tenant").select("id, name, industry, status");
  query = tenantId ? query.eq("id", tenantId) : query.eq("status", "ACTIVE");
  const { data, error } = await query;
  if (error) {
    throw { code: "TENANT_LOOKUP_FAILED", message: error.message };
  }
  return (data ?? []).map((row) => ({
    id: String(row.id),
    name: String(row.name ?? ""),
    industry: (row.industry as string | null) ?? null,
    status: String(row.status ?? ""),
  }));
}

export async function loadRequiredTrainingsExpiringBy(
  tenantId: string,
  until: Date,
): Promise<Training[]> {
  const { data, error } = await getAdminDb()
    .from("Training")
    .select("*")
    .eq("tenantId", tenantId)
    .eq("isRequired", true)
    .lte("validUntil", until.toISOString())
    .order("validUntil", { ascending: true })
    .limit(200);
  if (error) {
    throw { code: "TRAINING_LIST_FAILED", message: error.message };
  }
  return (data ?? []).map((row) => asTraining(row as Record<string, unknown>));
}

export async function loadTrainingAlertRecipients(tenantId: string): Promise<
  Array<{ userId: string; notifyTraining: boolean }>
> {
  const { data, error } = await getAdminDb()
    .from("UserTenant")
    .select("userId, notifyTraining")
    .eq("tenantId", tenantId)
    .in("role", ["ADMIN", "HMS", "LEDER"]);
  if (error) {
    throw { code: "TRAINING_ALERT_RECIPIENTS_FAILED", message: error.message };
  }
  return (data ?? []).map((row) => ({
    userId: String(row.userId),
    notifyTraining: row.notifyTraining !== false,
  }));
}

export async function loadPeopleByIds(ids: string[]): Promise<TrainingPerson[]> {
  if (ids.length === 0) return [];
  const { data, error } = await getAdminDb()
    .from("User")
    .select("id, name, email")
    .in("id", ids);
  if (error) {
    throw { code: "USER_LOOKUP_FAILED", message: error.message };
  }
  return ((data ?? []) as Array<{ id: string; name: string | null; email: string }>).map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
  }));
}

export async function findExistingTrainingAlert(input: {
  tenantId: string;
  userId: string;
  type: "TRAINING_DUE" | "TRAINING_EXPIRED";
  title: string;
  link: string;
  createdSince: Date;
}): Promise<boolean> {
  const { data, error } = await getAdminDb()
    .from("Notification")
    .select("id")
    .eq("tenantId", input.tenantId)
    .eq("userId", input.userId)
    .eq("type", input.type)
    .eq("title", input.title)
    .eq("link", input.link)
    .gte("createdAt", input.createdSince.toISOString())
    .limit(1);
  if (error) {
    throw { code: "NOTIFICATION_LOOKUP_FAILED", message: error.message };
  }
  return (data ?? []).length > 0;
}

export async function insertTrainingAlertNotification(input: {
  tenantId: string;
  userId: string;
  type: "TRAINING_DUE" | "TRAINING_EXPIRED";
  title: string;
  message: string;
  link: string;
}): Promise<{ id: string }> {
  const row = {
    id: createId(),
    tenantId: input.tenantId,
    userId: input.userId,
    type: input.type,
    title: input.title,
    message: input.message,
    link: input.link,
    isRead: false,
    readAt: null,
    createdAt: nowIso(),
  };
  const { data, error } = await getAdminDb().from("Notification").insert(row).select("id").single();
  if (error || !data) {
    throw { code: "NOTIFICATION_CREATE_FAILED", message: error?.message || "Could not create notification" };
  }
  return { id: String(data.id) };
}

export async function insertCourseTemplate(input: {
  tenantId: string;
  courseKey: string;
  title: string;
  description?: string | null;
  provider?: string | null;
  isRequired?: boolean;
  validityYears?: number | null;
}): Promise<CourseTemplate> {
  const now = nowIso();
  const { data, error } = await getAdminDb()
    .from("CourseTemplate")
    .insert({
      id: createId(),
      tenantId: input.tenantId,
      courseKey: input.courseKey,
      title: input.title,
      description: input.description ?? null,
      provider: input.provider ?? null,
      isRequired: input.isRequired ?? false,
      validityYears: input.validityYears ?? null,
      isGlobal: false,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    })
    .select("*")
    .single();
  if (error || !data) {
    throw { code: "COURSE_TEMPLATE_CREATE_FAILED", message: error?.message || "Could not create course template" };
  }
  return asCourseTemplate(data as Record<string, unknown>);
}

export async function updateCourseTemplateRecord(
  id: string,
  tenantId: string,
  patch: Record<string, unknown>,
): Promise<CourseTemplate> {
  const { data, error } = await getAdminDb()
    .from("CourseTemplate")
    .update({ ...patch, updatedAt: nowIso() })
    .eq("id", id)
    .eq("tenantId", tenantId)
    .select("*")
    .single();
  if (error || !data) {
    throw { code: "COURSE_TEMPLATE_UPDATE_FAILED", message: error?.message || "Could not update course template" };
  }
  return asCourseTemplate(data as Record<string, unknown>);
}
