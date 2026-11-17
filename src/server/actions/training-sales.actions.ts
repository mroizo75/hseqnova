"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requirePlatformStaff } from "@/lib/require-platform-staff";
import { isSalesStaff } from "@/lib/platform-access";
import { sendEmail } from "@/lib/email";
import { SITE_CONFIG } from "@/lib/seo-config";
import { defaultInvoiceDueDate, requireInvoiceCustomer } from "@/lib/invoice-lines";
import {
  ensureTrainingStripeCustomer,
  sendTrainingStripeInvoice,
  voidTrainingStripeInvoice,
} from "@/lib/send-training-invoice";
import { TRAINING_COURSES, trainingCourseByKey } from "@/features/training-sales/lib/catalogue";
import {
  MAX_FOLLOW_UP_MONTHS,
  MIN_FOLLOW_UP_MONTHS,
  parseFollowUpMonths,
  parseValidityMonths,
} from "@/features/training-sales/lib/follow-up";
import {
  applyTrainingSchedule,
  cancelTrainingEngagement,
  getTrainingEngagement,
  getTrainingFollowUpMonths,
  placeTrainingEnquiry,
  recordTrainingInvoice,
  rememberTrainingCustomer,
  saveTrainingFollowUpMonths,
} from "@/server/queries/training-sales.queries";

type ActionResult<T = undefined> = {
  success: boolean;
  data?: T;
  error?: string;
};

function fail(message: string): ActionResult<never> {
  return { success: false, error: message };
}

function messageOf(error: unknown): string {
  if (error instanceof z.ZodError) {
    return error.issues[0]?.message ?? "Check the form and try again";
  }
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  return "Something went wrong. Try again.";
}

function revalidateTraining(id?: string) {
  revalidatePath("/admin/crm");
  revalidatePath("/admin/crm/training");
  revalidatePath("/admin/crm/tasks");
  revalidatePath("/admin/crm/pipeline");
  revalidatePath("/admin/settings");
  if (id) {
    revalidatePath(`/admin/crm/training/${id}`);
  }
}

const enquirySchema = z.object({
  courseKey: z.string().min(1, "Choose a course"),
  companyName: z.string().trim().min(2, "Enter the company name").max(160),
  contactName: z.string().trim().min(2, "Enter your name").max(120),
  contactEmail: z.string().trim().email("Enter a valid email").max(160),
  contactPhone: z.string().trim().max(40).optional().or(z.literal("")),
  delegateCount: z.coerce.number().int().min(1, "At least one person").max(500),
  preferredDate: z.string().trim().optional().or(z.literal("")),
  siteNotes: z.string().trim().max(2000).optional().or(z.literal("")),
  website: z.string().optional(),
});

function optionalDate(value: string | undefined, label: string): string | null {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    throw { code: "INVALID_DATE", message: `${label} must be a date` };
  }
  return trimmed;
}

async function notifyEnquiry(input: {
  id: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  courseTitle: string;
  delegateCount: number;
  preferredDate: string | null;
  siteNotes: string | null;
}) {
  const crmUrl = `${SITE_CONFIG.url}/admin/crm/training/${input.id}`;
  try {
    await sendEmail({
      to: input.contactEmail,
      replyTo: SITE_CONFIG.contactEmail,
      subject: `Training enquiry — ${input.courseTitle}`,
      html: `<p>Hello ${escapeHtml(input.contactName)},</p>
        <p>We have your enquiry for <strong>${escapeHtml(input.courseTitle)}</strong> for ${input.delegateCount} ${input.delegateCount === 1 ? "person" : "people"} at ${escapeHtml(input.companyName)}.</p>
        <p>We will confirm the date and send an invoice in pounds. The invoice is payable by bank transfer.</p>
        <p>${escapeHtml(SITE_CONFIG.contactName)}<br />${escapeHtml(SITE_CONFIG.name)}</p>`,
    });
  } catch {
    // The booking is stored. A failed email must not lose the enquiry.
  }
  try {
    await sendEmail({
      to: SITE_CONFIG.contactEmail,
      replyTo: input.contactEmail,
      subject: `Training enquiry — ${input.companyName}`,
      html: `<p><strong>${escapeHtml(input.companyName)}</strong> asked for ${escapeHtml(input.courseTitle)}.</p>
        <p>${escapeHtml(input.contactName)} · ${escapeHtml(input.contactEmail)}${input.contactPhone ? ` · ${escapeHtml(input.contactPhone)}` : ""}</p>
        <p>${input.delegateCount} people${input.preferredDate ? ` · preferred ${escapeHtml(input.preferredDate)}` : ""}</p>
        ${input.siteNotes ? `<p>${escapeHtml(input.siteNotes)}</p>` : ""}
        <p><a href="${crmUrl}">Open the booking</a></p>`,
    });
  } catch {
    // Sales can still see the booking in CRM.
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function submitTrainingEnquiry(
  input: z.infer<typeof enquirySchema>,
): Promise<ActionResult<{ received: true }>> {
  try {
    const parsed = enquirySchema.parse(input);
    if (parsed.website?.trim()) {
      return { success: true, data: { received: true } };
    }
    if (!trainingCourseByKey(parsed.courseKey)) {
      return fail("Choose a course from the catalogue");
    }
    const preferredDate = optionalDate(parsed.preferredDate, "Preferred date");
    const placed = await placeTrainingEnquiry({
      courseKey: parsed.courseKey,
      companyName: parsed.companyName,
      contactName: parsed.contactName,
      contactEmail: parsed.contactEmail,
      contactPhone: parsed.contactPhone || null,
      delegateCount: parsed.delegateCount,
      preferredDate,
      siteNotes: parsed.siteNotes || null,
    });
    const course = trainingCourseByKey(parsed.courseKey);
    await notifyEnquiry({
      id: placed.id,
      companyName: parsed.companyName,
      contactName: parsed.contactName,
      contactEmail: parsed.contactEmail,
      contactPhone: parsed.contactPhone || null,
      courseTitle: course?.title ?? "Training",
      delegateCount: parsed.delegateCount,
      preferredDate,
      siteNotes: parsed.siteNotes || null,
    });
    revalidateTraining(placed.id);
    return { success: true, data: { received: true } };
  } catch (error) {
    return fail(messageOf(error));
  }
}

const staffSchema = enquirySchema.extend({
  courseDate: z.string().trim().optional().or(z.literal("")),
  unitPriceGbp: z.preprocess(
    (value) => (value === "" || value === null || value === undefined || Number.isNaN(value) ? undefined : value),
    z.coerce.number().positive().max(100000).optional(),
  ),
});

export async function createStaffTrainingBooking(
  input: z.infer<typeof staffSchema>,
): Promise<ActionResult<{ id: string }>> {
  try {
    const staff = await requirePlatformStaff();
    if (!staff || !isSalesStaff(staff)) {
      return fail("You do not have access to training bookings");
    }
    const parsed = staffSchema.parse(input);
    if (!trainingCourseByKey(parsed.courseKey)) {
      return fail("Choose a course from the catalogue");
    }
    const courseDate = optionalDate(parsed.courseDate, "Course date");
    const placed = await placeTrainingEnquiry({
      courseKey: parsed.courseKey,
      companyName: parsed.companyName,
      contactName: parsed.contactName,
      contactEmail: parsed.contactEmail,
      contactPhone: parsed.contactPhone || null,
      delegateCount: parsed.delegateCount,
      preferredDate: optionalDate(parsed.preferredDate, "Preferred date"),
      siteNotes: parsed.siteNotes || null,
      ownerId: staff.id,
      courseDate,
      unitPriceGbp: parsed.unitPriceGbp && Number.isFinite(parsed.unitPriceGbp) ? parsed.unitPriceGbp : null,
    });
    revalidateTraining(placed.id);
    return { success: true, data: { id: placed.id } };
  } catch (error) {
    return fail(messageOf(error));
  }
}

const scheduleSchema = z.object({
  id: z.string().min(1),
  courseDate: z.string().trim().min(1, "Enter the course date"),
  validityMonths: z.coerce.number().int(),
  delegateCount: z.coerce.number().int().min(1).max(500),
  unitPriceGbp: z.coerce.number().positive("Enter a price per person").max(100000),
});

export async function saveTrainingBooking(
  input: z.infer<typeof scheduleSchema>,
): Promise<ActionResult> {
  try {
    const staff = await requirePlatformStaff();
    if (!staff || !isSalesStaff(staff)) {
      return fail("You do not have access to training bookings");
    }
    const parsed = scheduleSchema.parse(input);
    optionalDate(parsed.courseDate, "Course date");
    const engagement = await getTrainingEngagement(staff, parsed.id);
    if (!engagement) {
      return fail("Training booking was not found");
    }
    if (engagement.status === "CANCELLED") {
      return fail("This booking is cancelled");
    }
    const followUpMonths = await getTrainingFollowUpMonths();
    parseValidityMonths(parsed.validityMonths, followUpMonths);
    await applyTrainingSchedule({
      engagement,
      courseDate: parsed.courseDate,
      validityMonths: parsed.validityMonths,
      delegateCount: parsed.delegateCount,
      unitPriceGbp: parsed.unitPriceGbp,
      actorId: staff.id,
    });
    revalidateTraining(parsed.id);
    return { success: true };
  } catch (error) {
    return fail(messageOf(error));
  }
}

const invoiceSchema = scheduleSchema.extend({
  dueDate: z.string().trim().min(1, "Choose a due date"),
  invoiceEmail: z.string().trim().email("Enter an invoice email"),
  addressLine1: z.string().trim().min(1, "Enter the first line of the invoice address").max(200),
  city: z.string().trim().min(1, "Enter the invoice city").max(80),
  postcode: z.string().trim().min(2, "Enter the invoice postcode").max(12),
  vatNumber: z.string().trim().max(20).optional().or(z.literal("")),
  purchaseOrderNumber: z.string().trim().max(40).optional().or(z.literal("")),
  note: z.string().trim().max(500).optional().or(z.literal("")),
});

export async function sendTrainingBookingInvoice(
  input: z.infer<typeof invoiceSchema>,
): Promise<ActionResult<{ hostedInvoiceUrl: string | null }>> {
  try {
    const staff = await requirePlatformStaff();
    if (!staff || !isSalesStaff(staff)) {
      return fail("You do not have access to training bookings");
    }
    const parsed = invoiceSchema.parse(input);
    const engagement = await getTrainingEngagement(staff, parsed.id);
    if (!engagement) {
      return fail("Training booking was not found");
    }
    if (engagement.status === "CANCELLED") {
      return fail("This booking is cancelled");
    }
    if (engagement.stripeInvoiceId) {
      return fail("An invoice has already been sent. Open it from this booking.");
    }
    const followUpMonths = await getTrainingFollowUpMonths();
    parseValidityMonths(parsed.validityMonths, followUpMonths);
    const scheduled = await applyTrainingSchedule({
      engagement,
      courseDate: parsed.courseDate,
      validityMonths: parsed.validityMonths,
      delegateCount: parsed.delegateCount,
      unitPriceGbp: parsed.unitPriceGbp,
      actorId: staff.id,
    });
    const customer = requireInvoiceCustomer({
      email: parsed.invoiceEmail,
      addressLine1: parsed.addressLine1,
      city: parsed.city,
      postcode: parsed.postcode,
      vatNumber: parsed.vatNumber || null,
      purchaseOrderNumber: parsed.purchaseOrderNumber || null,
    });
    const stripeCustomerId = await ensureTrainingStripeCustomer({
      existingCustomerId: scheduled.stripeCustomerId,
      companyName: scheduled.organisationName,
      engagementId: scheduled.id,
      organisationId: scheduled.organisationId,
      customer,
    });
    await rememberTrainingCustomer(scheduled.id, stripeCustomerId);
    const validUntil = scheduled.validUntil;
    const note = [
      parsed.note?.trim() || "",
      validUntil ? `Competence record runs until ${validUntil}.` : "",
    ]
      .filter(Boolean)
      .join(" ");
    const sent = await sendTrainingStripeInvoice({
      stripeCustomerId,
      engagementId: scheduled.id,
      organisationId: scheduled.organisationId,
      courseKey: scheduled.courseKey,
      dueDate: parsed.dueDate || defaultInvoiceDueDate(),
      note,
      customer,
      lines: [
        {
          description: `${scheduled.courseTitle} — workplace competence training`,
          quantity: scheduled.delegateCount,
          unitAmount: parsed.unitPriceGbp,
        },
      ],
    });
    await recordTrainingInvoice({
      engagement: { ...scheduled, unitPriceGbp: parsed.unitPriceGbp, delegateCount: parsed.delegateCount },
      stripeCustomerId,
      stripeInvoiceId: sent.stripeInvoiceId,
      hostedInvoiceUrl: sent.hostedInvoiceUrl,
      invoiceNumber: sent.invoiceNumber,
      amount: sent.amount,
      amountExVat: sent.amountExVat,
      currency: sent.currency,
      dueDate: sent.dueDate,
      customerEmail: customer.email,
      addressLine1: customer.addressLine1,
      city: customer.city,
      postcode: customer.postcode,
      vatNumber: customer.vatNumber,
      purchaseOrderNumber: customer.purchaseOrderNumber,
      actorId: staff.id,
    });
    revalidateTraining(parsed.id);
    return { success: true, data: { hostedInvoiceUrl: sent.hostedInvoiceUrl } };
  } catch (error) {
    return fail(messageOf(error));
  }
}

export async function cancelTrainingBooking(id: string): Promise<ActionResult> {
  try {
    const staff = await requirePlatformStaff();
    if (!staff || !isSalesStaff(staff)) {
      return fail("You do not have access to training bookings");
    }
    const engagement = await getTrainingEngagement(staff, id);
    if (!engagement) {
      return fail("Training booking was not found");
    }
    if (engagement.status === "CANCELLED") {
      return { success: true };
    }
    if (engagement.stripeInvoiceId && engagement.status === "INVOICED") {
      await voidTrainingStripeInvoice(engagement.stripeInvoiceId);
    }
    await cancelTrainingEngagement({ engagement, actorId: staff.id });
    revalidateTraining(id);
    return { success: true };
  } catch (error) {
    return fail(messageOf(error));
  }
}

const settingSchema = z.object({
  months: z.coerce.number().int().min(MIN_FOLLOW_UP_MONTHS).max(MAX_FOLLOW_UP_MONTHS),
});

export async function updateTrainingFollowUpSetting(
  input: z.infer<typeof settingSchema>,
): Promise<ActionResult<{ updated: number; skipped: number }>> {
  try {
    const staff = await requirePlatformStaff();
    if (!staff?.isSuperAdmin && !staff?.isSalesManager) {
      return fail("Only a superadmin or sales manager can change this setting");
    }
    const parsed = settingSchema.parse(input);
    parseFollowUpMonths(parsed.months);
    const result = await saveTrainingFollowUpMonths(parsed.months);
    revalidateTraining();
    return { success: true, data: result };
  } catch (error) {
    return fail(messageOf(error));
  }
}

export async function trainingCourseOptions() {
  return TRAINING_COURSES.map((course) => ({
    key: course.key,
    title: course.title,
    defaultValidityMonths: course.defaultValidityMonths,
  }));
}
