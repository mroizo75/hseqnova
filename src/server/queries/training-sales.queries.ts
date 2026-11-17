import { getAdminDb } from "@/lib/supabase/admin";
import { createId } from "@/lib/ids";
import { canSeeAllCrm, type PlatformStaff } from "@/lib/platform-access";
import { SITE_CONFIG } from "@/lib/seo-config";
import { OPEN_DEAL_STAGES } from "@/features/crm/lib/types";
import { trainingCourseByKey } from "@/features/training-sales/lib/catalogue";
import {
  DEFAULT_FOLLOW_UP_MONTHS,
  formatUkDate,
  parseFollowUpMonths,
  scheduleCompetence,
  trainingFollowUpTitle,
} from "@/features/training-sales/lib/follow-up";

export const TRAINING_FOLLOW_UP_KEY = "training.followUpMonths";

export const TRAINING_STATUSES = ["ENQUIRY", "INVOICED", "PAID", "CANCELLED"] as const;
export type TrainingEngagementStatus = (typeof TRAINING_STATUSES)[number];

export type TrainingEngagementRecord = {
  id: string;
  organisationId: string;
  organisationName: string;
  tenantId: string | null;
  dealId: string | null;
  ownerId: string | null;
  courseKey: string;
  courseTitle: string;
  delegateCount: number;
  preferredDate: string | null;
  courseDate: string | null;
  validityMonths: number;
  validUntil: string | null;
  followUpAt: string | null;
  followUpTaskId: string | null;
  unitPriceGbp: number | null;
  status: TrainingEngagementStatus;
  dealCreatedForTraining: boolean;
  stripeCustomerId: string | null;
  stripeInvoiceId: string | null;
  hostedInvoiceUrl: string | null;
  invoiceEmail: string | null;
  invoiceAddress: string | null;
  invoiceCity: string | null;
  invoicePostcode: string | null;
  vatNumber: string | null;
  purchaseOrderNumber: string | null;
  siteNotes: string | null;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  createdAt: string;
};

type EngagementRow = {
  id: string;
  organisationId: string;
  dealId: string | null;
  ownerId: string | null;
  courseKey: string;
  courseTitle: string;
  delegateCount: number;
  preferredDate: string | null;
  courseDate: string | null;
  validityMonths: number;
  validUntil: string | null;
  followUpAt: string | null;
  followUpTaskId: string | null;
  unitPriceGbp: number | null;
  status: string;
  dealCreatedForTraining: boolean;
  stripeCustomerId: string | null;
  stripeInvoiceId: string | null;
  hostedInvoiceUrl: string | null;
  invoiceEmail: string | null;
  invoiceAddress: string | null;
  invoiceCity: string | null;
  invoicePostcode: string | null;
  vatNumber: string | null;
  purchaseOrderNumber: string | null;
  siteNotes: string | null;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  createdAt: string;
  organisation: { name: string; ownerId: string | null; tenantId: string | null } | { name: string; ownerId: string | null; tenantId: string | null }[] | null;
};

function dateOnly(value: string | null | undefined): string | null {
  if (!value) return null;
  return value.slice(0, 10);
}

function asStatus(value: string): TrainingEngagementStatus {
  if (value === "INVOICED" || value === "PAID" || value === "CANCELLED" || value === "ENQUIRY") {
    return value;
  }
  return "ENQUIRY";
}

function organisationOf(row: EngagementRow): { name: string; ownerId: string | null; tenantId: string | null } {
  const organisation = Array.isArray(row.organisation) ? row.organisation[0] : row.organisation;
  return {
    name: organisation?.name ?? "Company",
    ownerId: organisation?.ownerId ?? null,
    tenantId: organisation?.tenantId ?? null,
  };
}

function mapRow(row: EngagementRow): TrainingEngagementRecord {
  const organisation = organisationOf(row);
  return {
    id: row.id,
    organisationId: row.organisationId,
    organisationName: organisation.name,
    tenantId: organisation.tenantId,
    dealId: row.dealId,
    ownerId: row.ownerId,
    courseKey: row.courseKey,
    courseTitle: row.courseTitle,
    delegateCount: row.delegateCount,
    preferredDate: dateOnly(row.preferredDate),
    courseDate: dateOnly(row.courseDate),
    validityMonths: row.validityMonths,
    validUntil: dateOnly(row.validUntil),
    followUpAt: dateOnly(row.followUpAt),
    followUpTaskId: row.followUpTaskId,
    unitPriceGbp: row.unitPriceGbp,
    status: asStatus(row.status),
    dealCreatedForTraining: Boolean(row.dealCreatedForTraining),
    stripeCustomerId: row.stripeCustomerId,
    stripeInvoiceId: row.stripeInvoiceId,
    hostedInvoiceUrl: row.hostedInvoiceUrl,
    invoiceEmail: row.invoiceEmail,
    invoiceAddress: row.invoiceAddress,
    invoiceCity: row.invoiceCity,
    invoicePostcode: row.invoicePostcode,
    vatNumber: row.vatNumber,
    purchaseOrderNumber: row.purchaseOrderNumber,
    siteNotes: row.siteNotes,
    contactName: row.contactName,
    contactEmail: row.contactEmail,
    contactPhone: row.contactPhone,
    createdAt: row.createdAt,
  };
}

const ENGAGEMENT_SELECT = `
  id, organisationId, dealId, ownerId, courseKey, courseTitle, delegateCount,
  preferredDate, courseDate, validityMonths, validUntil, followUpAt, followUpTaskId,
  unitPriceGbp, status, dealCreatedForTraining, stripeCustomerId, stripeInvoiceId,
  hostedInvoiceUrl, invoiceEmail, invoiceAddress, invoiceCity, invoicePostcode,
  vatNumber, purchaseOrderNumber, siteNotes, contactName, contactEmail, contactPhone, createdAt,
  organisation:CrmOrganisation(name, ownerId, tenantId)
`;

function nowIso(): string {
  return new Date().toISOString();
}

function throwIf(error: { message: string } | null, code: string): void {
  if (error) {
    throw { code, message: error.message };
  }
}

export async function getTrainingFollowUpMonths(): Promise<number> {
  const { data, error } = await getAdminDb()
    .from("PlatformSetting")
    .select("value")
    .eq("key", TRAINING_FOLLOW_UP_KEY)
    .maybeSingle();
  if (error || !data?.value) {
    return DEFAULT_FOLLOW_UP_MONTHS;
  }
  const parsed = Number(data.value);
  if (!Number.isInteger(parsed)) {
    return DEFAULT_FOLLOW_UP_MONTHS;
  }
  try {
    return parseFollowUpMonths(parsed);
  } catch {
    return DEFAULT_FOLLOW_UP_MONTHS;
  }
}

export async function saveTrainingFollowUpMonths(months: number): Promise<{ updated: number; skipped: number }> {
  const lead = parseFollowUpMonths(months);
  const db = getAdminDb();
  const now = nowIso();
  const { error } = await db.from("PlatformSetting").upsert({
    key: TRAINING_FOLLOW_UP_KEY,
    value: String(lead),
    updatedAt: now,
  });
  throwIf(error, "TRAINING_SETTING_FAILED");

  const { data, error: listError } = await db
    .from("TrainingEngagement")
    .select("id, organisationId, dealId, ownerId, courseTitle, courseDate, validityMonths, followUpTaskId, status, organisation:CrmOrganisation(name)")
    .neq("status", "CANCELLED")
    .not("courseDate", "is", null);
  throwIf(listError, "TRAINING_LIST_FAILED");

  let updated = 0;
  let skipped = 0;
  for (const row of data ?? []) {
    const courseDate = dateOnly(row.courseDate as string | null);
    if (!courseDate) {
      skipped += 1;
      continue;
    }
    let window: { validUntil: string; followUpAt: string };
    try {
      window = scheduleCompetence({
        courseDate,
        validityMonths: Number(row.validityMonths),
        followUpMonths: lead,
        today: now.slice(0, 10),
      });
    } catch {
      skipped += 1;
      continue;
    }
    const organisation = Array.isArray(row.organisation) ? row.organisation[0] : row.organisation;
    const companyName = organisation?.name ?? "Company";
    const taskId = await writeFollowUpTask({
      organisationId: String(row.organisationId),
      dealId: row.dealId ? String(row.dealId) : null,
      assignedToId: row.ownerId ? String(row.ownerId) : null,
      companyName,
      courseTitle: String(row.courseTitle),
      validUntil: window.validUntil,
      followUpAt: window.followUpAt,
      existingTaskId: row.followUpTaskId ? String(row.followUpTaskId) : null,
      actorId: row.ownerId ? String(row.ownerId) : null,
      quiet: true,
    });
    const { error: updateError } = await db
      .from("TrainingEngagement")
      .update({
        validUntil: `${window.validUntil}T00:00:00.000Z`,
        followUpAt: `${window.followUpAt}T00:00:00.000Z`,
        followUpTaskId: taskId,
        updatedAt: now,
      })
      .eq("id", row.id);
    if (updateError) {
      skipped += 1;
      continue;
    }
    updated += 1;
  }
  return { updated, skipped };
}

async function resolveTrainingOwnerId(): Promise<string | null> {
  const db = getAdminDb();
  const { data: host } = await db.from("User").select("id").eq("email", SITE_CONFIG.contactEmail.toLowerCase()).maybeSingle();
  if (host?.id) return String(host.id);
  const { data: sales } = await db
    .from("User")
    .select("id")
    .or("isSales.eq.true,isSalesManager.eq.true,isSuperAdmin.eq.true")
    .limit(1)
    .maybeSingle();
  return sales?.id ? String(sales.id) : null;
}

export async function placeTrainingEnquiry(input: {
  courseKey: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  delegateCount: number;
  preferredDate: string | null;
  siteNotes: string | null;
  ownerId?: string | null;
  courseDate?: string | null;
  unitPriceGbp?: number | null;
}): Promise<{ id: string; organisationId: string; dealId: string | null }> {
  const course = trainingCourseByKey(input.courseKey);
  if (!course) {
    throw { code: "UNKNOWN_COURSE", message: "Choose a course from the catalogue" };
  }
  const db = getAdminDb();
  const now = nowIso();
  const email = input.contactEmail.toLowerCase();
  const ownerId = input.ownerId === undefined ? await resolveTrainingOwnerId() : input.ownerId;

  const { data: existingContact } = await db
    .from("CrmContact")
    .select("id, organisationId")
    .eq("email", email)
    .limit(1)
    .maybeSingle();

  let organisationId = existingContact ? String(existingContact.organisationId) : null;
  let dealId: string | null = null;
  let dealCreatedForTraining = false;

  if (!organisationId) {
    organisationId = createId();
    const { error: orgError } = await db.from("CrmOrganisation").insert({
      id: organisationId,
      name: input.companyName,
      ownerId,
      source: "WEBSITE",
      notes: "Workplace training enquiry",
      createdAt: now,
      updatedAt: now,
    });
    throwIf(orgError, "TRAINING_ORG_FAILED");
    const { error: contactError } = await db.from("CrmContact").insert({
      id: createId(),
      organisationId,
      name: input.contactName,
      email,
      phone: input.contactPhone,
      isPrimary: true,
      createdAt: now,
      updatedAt: now,
    });
    throwIf(contactError, "TRAINING_CONTACT_FAILED");
  }

  const { data: openDeal } = await db
    .from("CrmDeal")
    .select("id")
    .eq("organisationId", organisationId)
    .in("stage", [...OPEN_DEAL_STAGES])
    .order("updatedAt", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (openDeal?.id) {
    dealId = String(openDeal.id);
  } else {
    dealId = createId();
    dealCreatedForTraining = true;
    const { error: dealError } = await db.from("CrmDeal").insert({
      id: dealId,
      organisationId,
      ownerId,
      title: `Training — ${course.title}`,
      valueGbp: input.unitPriceGbp ? input.unitPriceGbp * input.delegateCount : 0,
      currency: "GBP",
      stage: "NEW",
      createdAt: now,
      updatedAt: now,
    });
    if (dealError) {
      const { data: raced } = await db
        .from("CrmDeal")
        .select("id")
        .eq("organisationId", organisationId)
        .in("stage", [...OPEN_DEAL_STAGES])
        .limit(1)
        .maybeSingle();
      if (!raced?.id) {
        throw { code: "TRAINING_DEAL_FAILED", message: dealError.message };
      }
      dealId = String(raced.id);
      dealCreatedForTraining = false;
    }
  }

  const followUpMonths = await getTrainingFollowUpMonths();
  let validUntil: string | null = null;
  let followUpAt: string | null = null;
  if (input.courseDate) {
    const window = scheduleCompetence({
      courseDate: input.courseDate,
      validityMonths: course.defaultValidityMonths,
      followUpMonths,
      today: now.slice(0, 10),
    });
    validUntil = window.validUntil;
    followUpAt = window.followUpAt;
  }

  const id = createId();
  const { error: insertError } = await db.from("TrainingEngagement").insert({
    id,
    organisationId,
    dealId,
    ownerId,
    courseKey: course.key,
    courseTitle: course.title,
    delegateCount: input.delegateCount,
    preferredDate: input.preferredDate,
    courseDate: input.courseDate ?? null,
    validityMonths: course.defaultValidityMonths,
    validUntil: validUntil ? `${validUntil}T00:00:00.000Z` : null,
    followUpAt: followUpAt ? `${followUpAt}T00:00:00.000Z` : null,
    unitPriceGbp: input.unitPriceGbp ?? null,
    status: "ENQUIRY",
    dealCreatedForTraining,
    siteNotes: input.siteNotes,
    contactName: input.contactName,
    contactEmail: email,
    contactPhone: input.contactPhone,
    createdAt: now,
    updatedAt: now,
  });
  throwIf(insertError, "TRAINING_CREATE_FAILED");

  if (ownerId) {
    const note = [
      `Training enquiry: ${course.title}`,
      `${input.delegateCount} people`,
      `Competence period: ${course.defaultValidityMonths} months`,
      input.preferredDate ? `Preferred date: ${formatUkDate(input.preferredDate)}` : null,
      input.courseDate ? `Course date: ${formatUkDate(input.courseDate)}` : null,
      input.siteNotes,
    ]
      .filter(Boolean)
      .join("\n");
    await db.from("CrmActivity").insert({
      id: createId(),
      organisationId,
      dealId,
      type: "NOTE",
      channel: "OTHER",
      note,
      createdById: ownerId,
      createdAt: now,
    });
  }

  if (validUntil && followUpAt && ownerId) {
    const taskId = await writeFollowUpTask({
      organisationId,
      dealId,
      assignedToId: ownerId,
      companyName: input.companyName,
      courseTitle: course.title,
      validUntil,
      followUpAt,
      existingTaskId: null,
      actorId: ownerId,
      quiet: false,
    });
    await db.from("TrainingEngagement").update({ followUpTaskId: taskId, updatedAt: now }).eq("id", id);
  }

  return { id, organisationId, dealId };
}

async function writeFollowUpTask(input: {
  organisationId: string;
  dealId: string | null;
  assignedToId: string | null;
  companyName: string;
  courseTitle: string;
  validUntil: string;
  followUpAt: string;
  existingTaskId: string | null;
  actorId: string | null;
  quiet: boolean;
}): Promise<string | null> {
  if (!input.assignedToId) {
    return input.existingTaskId;
  }
  const db = getAdminDb();
  const now = nowIso();
  const title = trainingFollowUpTitle(input.companyName, input.courseTitle, input.validUntil);
  const dueAt = `${input.followUpAt}T00:00:00.000Z`;
  if (input.existingTaskId) {
    const { error } = await db
      .from("CrmTask")
      .update({
        title,
        dueAt,
        assignedToId: input.assignedToId,
        status: "OPEN",
        updatedAt: now,
      })
      .eq("id", input.existingTaskId);
    if (!error) {
      return input.existingTaskId;
    }
  }
  const id = createId();
  const { error } = await db.from("CrmTask").insert({
    id,
    organisationId: input.organisationId,
    dealId: input.dealId,
    assignedToId: input.assignedToId,
    title,
    dueAt,
    status: "OPEN",
    createdAt: now,
    updatedAt: now,
  });
  throwIf(error, "TRAINING_TASK_FAILED");
  if (!input.quiet && input.actorId) {
    await db.from("CrmActivity").insert({
      id: createId(),
      organisationId: input.organisationId,
      dealId: input.dealId,
      type: "FOLLOW_UP",
      channel: "OTHER",
      note: `Follow-up on ${formatUkDate(input.followUpAt)} so ${input.companyName} is contacted before ${input.courseTitle} expires on ${formatUkDate(input.validUntil)}.`,
      createdById: input.actorId,
      createdAt: now,
    });
  }
  return id;
}

export async function applyTrainingSchedule(input: {
  engagement: TrainingEngagementRecord;
  courseDate: string;
  validityMonths: number;
  delegateCount: number;
  unitPriceGbp: number | null;
  actorId: string;
}): Promise<TrainingEngagementRecord> {
  const followUpMonths = await getTrainingFollowUpMonths();
  const window = scheduleCompetence({
    courseDate: input.courseDate,
    validityMonths: input.validityMonths,
    followUpMonths,
    today: nowIso().slice(0, 10),
  });
  const assignedToId = input.engagement.ownerId ?? input.actorId;
  const taskId = await writeFollowUpTask({
    organisationId: input.engagement.organisationId,
    dealId: input.engagement.dealId,
    assignedToId,
    companyName: input.engagement.organisationName,
    courseTitle: input.engagement.courseTitle,
    validUntil: window.validUntil,
    followUpAt: window.followUpAt,
    existingTaskId: input.engagement.followUpTaskId,
    actorId: input.actorId,
    quiet: Boolean(input.engagement.followUpTaskId),
  });
  const now = nowIso();
  const { error } = await getAdminDb()
    .from("TrainingEngagement")
    .update({
      courseDate: input.courseDate,
      validityMonths: input.validityMonths,
      delegateCount: input.delegateCount,
      unitPriceGbp: input.unitPriceGbp,
      validUntil: `${window.validUntil}T00:00:00.000Z`,
      followUpAt: `${window.followUpAt}T00:00:00.000Z`,
      followUpTaskId: taskId,
      ownerId: input.engagement.ownerId ?? input.actorId,
      updatedAt: now,
    })
    .eq("id", input.engagement.id);
  throwIf(error, "TRAINING_SCHEDULE_FAILED");
  const saved = await getTrainingEngagementById(input.engagement.id);
  if (!saved) {
    throw { code: "TRAINING_NOT_FOUND", message: "Training booking was not found" };
  }
  return saved;
}

function canSeeEngagement(staff: PlatformStaff, row: EngagementRow): boolean {
  if (canSeeAllCrm(staff)) return true;
  const organisation = organisationOf(row);
  return row.ownerId === staff.id || organisation.ownerId === staff.id;
}

export async function listTrainingEngagements(staff: PlatformStaff): Promise<TrainingEngagementRecord[]> {
  const { data, error } = await getAdminDb()
    .from("TrainingEngagement")
    .select(ENGAGEMENT_SELECT)
    .order("createdAt", { ascending: false });
  throwIf(error, "TRAINING_LIST_FAILED");
  return ((data ?? []) as EngagementRow[])
    .filter((row) => canSeeEngagement(staff, row))
    .map(mapRow)
    .sort((a, b) => {
      if (a.followUpAt && b.followUpAt && a.followUpAt !== b.followUpAt) {
        return a.followUpAt.localeCompare(b.followUpAt);
      }
      if (a.followUpAt && !b.followUpAt) return -1;
      if (!a.followUpAt && b.followUpAt) return 1;
      return b.createdAt.localeCompare(a.createdAt);
    });
}

export async function getTrainingEngagement(
  staff: PlatformStaff,
  id: string,
): Promise<TrainingEngagementRecord | null> {
  const { data, error } = await getAdminDb()
    .from("TrainingEngagement")
    .select(ENGAGEMENT_SELECT)
    .eq("id", id)
    .maybeSingle();
  throwIf(error, "TRAINING_LOOKUP_FAILED");
  if (!data) return null;
  const row = data as EngagementRow;
  if (!canSeeEngagement(staff, row)) return null;
  return mapRow(row);
}

export async function getTrainingEngagementById(id: string): Promise<TrainingEngagementRecord | null> {
  const { data, error } = await getAdminDb()
    .from("TrainingEngagement")
    .select(ENGAGEMENT_SELECT)
    .eq("id", id)
    .maybeSingle();
  throwIf(error, "TRAINING_LOOKUP_FAILED");
  if (!data) return null;
  return mapRow(data as EngagementRow);
}

export async function markTrainingEngagementPaid(input: {
  stripeInvoiceId: string;
  engagementId?: string | null;
}): Promise<void> {
  const db = getAdminDb();
  let row: TrainingEngagementRecord | null = null;
  if (input.engagementId) {
    row = await getTrainingEngagementById(input.engagementId);
  }
  if (!row) {
    const { data, error } = await db
      .from("TrainingEngagement")
      .select("id")
      .eq("stripeInvoiceId", input.stripeInvoiceId)
      .maybeSingle();
    throwIf(error, "TRAINING_LOOKUP_FAILED");
    if (data?.id) {
      row = await getTrainingEngagementById(String(data.id));
    }
  }
  if (!row || row.status === "CANCELLED" || row.status === "PAID") {
    return;
  }
  const now = nowIso();
  const { error } = await db
    .from("TrainingEngagement")
    .update({
      status: "PAID",
      stripeInvoiceId: input.stripeInvoiceId,
      updatedAt: now,
    })
    .eq("id", row.id);
  throwIf(error, "TRAINING_PAID_FAILED");

  if (row.dealCreatedForTraining && row.dealId && row.unitPriceGbp) {
    await db
      .from("CrmDeal")
      .update({
        stage: "WON",
        valueGbp: row.unitPriceGbp * row.delegateCount,
        updatedAt: now,
      })
      .eq("id", row.dealId);
  }
  const actorId = row.ownerId;
  if (actorId) {
    await db.from("CrmActivity").insert({
      id: createId(),
      organisationId: row.organisationId,
      dealId: row.dealId,
      type: "NOTE",
      channel: "OTHER",
      note: `Training invoice paid for ${row.courseTitle}.`,
      createdById: actorId,
      createdAt: now,
    });
  }
}

export async function recordTrainingInvoice(input: {
  engagement: TrainingEngagementRecord;
  stripeCustomerId: string;
  stripeInvoiceId: string;
  hostedInvoiceUrl: string | null;
  invoiceNumber: string | null;
  amount: number;
  amountExVat: number;
  currency: string;
  dueDate: string;
  customerEmail: string;
  addressLine1: string;
  city: string;
  postcode: string;
  vatNumber: string | null;
  purchaseOrderNumber: string | null;
  actorId: string;
}): Promise<void> {
  const db = getAdminDb();
  const now = nowIso();
  const { data: current } = await db
    .from("TrainingEngagement")
    .select("status")
    .eq("id", input.engagement.id)
    .maybeSingle();
  const { error } = await db
    .from("TrainingEngagement")
    .update({
      status: current?.status === "PAID" ? "PAID" : "INVOICED",
      stripeCustomerId: input.stripeCustomerId,
      stripeInvoiceId: input.stripeInvoiceId,
      hostedInvoiceUrl: input.hostedInvoiceUrl,
      invoiceEmail: input.customerEmail,
      invoiceAddress: input.addressLine1,
      invoiceCity: input.city,
      invoicePostcode: input.postcode,
      vatNumber: input.vatNumber,
      purchaseOrderNumber: input.purchaseOrderNumber,
      unitPriceGbp: input.engagement.unitPriceGbp,
      updatedAt: now,
    })
    .eq("id", input.engagement.id);
  throwIf(error, "TRAINING_INVOICE_SAVE_FAILED");

  if (input.engagement.dealCreatedForTraining && input.engagement.dealId) {
    const { data: deal } = await db.from("CrmDeal").select("stage").eq("id", input.engagement.dealId).maybeSingle();
    if (deal && deal.stage !== "WON" && deal.stage !== "LOST") {
      await db
        .from("CrmDeal")
        .update({
          stage: "PROPOSAL",
          valueGbp: input.amountExVat,
          updatedAt: now,
        })
        .eq("id", input.engagement.dealId);
    }
  }

  await db.from("CrmActivity").insert({
    id: createId(),
    organisationId: input.engagement.organisationId,
    dealId: input.engagement.dealId,
    type: "OFFER_SENT",
    channel: "EMAIL",
    note: `Stripe invoice ${input.invoiceNumber ?? input.stripeInvoiceId} sent for ${input.engagement.courseTitle} (${input.engagement.delegateCount} people).`,
    createdById: input.actorId,
    createdAt: now,
  });

  if (input.engagement.tenantId) {
    await db.from("Invoice").insert({
      id: createId(),
      tenantId: input.engagement.tenantId,
      stripeInvoiceId: input.stripeInvoiceId,
      invoiceNumber: input.invoiceNumber,
      amount: input.amount,
      amountExVat: input.amountExVat,
      vatAmount: Math.round((input.amount - input.amountExVat) * 100) / 100,
      vatRate: input.amountExVat > 0 ? Math.round(((input.amount - input.amountExVat) / input.amountExVat) * 100) : 0,
      currency: input.currency,
      purchaseOrderNumber: input.purchaseOrderNumber,
      dueDate: input.dueDate,
      status: "SENT",
      description: input.engagement.courseTitle,
      createdAt: now,
      updatedAt: now,
    });
  }
}

export async function cancelTrainingEngagement(input: {
  engagement: TrainingEngagementRecord;
  actorId: string;
}): Promise<void> {
  const db = getAdminDb();
  const now = nowIso();
  const { error } = await db
    .from("TrainingEngagement")
    .update({ status: "CANCELLED", updatedAt: now })
    .eq("id", input.engagement.id);
  throwIf(error, "TRAINING_CANCEL_FAILED");
  if (input.engagement.followUpTaskId) {
    await db
      .from("CrmTask")
      .update({ status: "DONE", updatedAt: now })
      .eq("id", input.engagement.followUpTaskId);
  }
  await db.from("CrmActivity").insert({
    id: createId(),
    organisationId: input.engagement.organisationId,
    dealId: input.engagement.dealId,
    type: "NOTE",
    channel: "OTHER",
    note: `Training booking cancelled for ${input.engagement.courseTitle}. Any refund is handled in Stripe.`,
    createdById: input.actorId,
    createdAt: now,
  });
}

export async function rememberTrainingCustomer(engagementId: string, stripeCustomerId: string): Promise<void> {
  const { error } = await getAdminDb()
    .from("TrainingEngagement")
    .update({ stripeCustomerId, updatedAt: nowIso() })
    .eq("id", engagementId);
  throwIf(error, "TRAINING_CUSTOMER_SAVE_FAILED");
}
