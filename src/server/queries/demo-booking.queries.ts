import { randomBytes } from "node:crypto";
import { getAdminDb } from "@/lib/supabase/admin";
import { createId } from "@/lib/ids";
import { sendEmail } from "@/lib/email";
import { SITE_CONFIG } from "@/lib/seo-config";
import {
  bookingWindow,
  buildDemoIcs,
  buildSlotsForDay,
  demoCalendarLinks,
  DEMO_DURATION_MINUTES,
  DEMO_TIME_ZONE,
  formatDemoRange,
  getDemoHost,
  isStartWithinWindow,
  isUkWorkingDay,
  monthKeys,
  toDateKey,
  type DemoSlot,
} from "@/lib/demo-booking";
import {
  demoCancelledHtml,
  demoGuestConfirmationHtml,
  demoHostNotificationHtml,
  demoRescheduledHtml,
} from "@/lib/demo-booking-email";

export type DemoBookingRecord = {
  id: string;
  startAt: string;
  endAt: string;
  timezone: string;
  name: string;
  email: string;
  phone: string | null;
  company: string;
  jobTitle: string | null;
  notes: string | null;
  status: "CONFIRMED" | "CANCELLED";
  manageToken: string;
  crmDealId: string | null;
  sequence: number;
  cancelledAt: string | null;
};

function throwIf(error: { message: string } | null, code: string): void {
  if (error) {
    throw { code, message: error.message };
  }
}

function nowIso(): string {
  return new Date().toISOString();
}

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || SITE_CONFIG.url;
}

export function manageDemoUrl(token: string): string {
  return `${appUrl()}/book-a-demo/manage/${token}`;
}

function createManageToken(): string {
  return randomBytes(24).toString("hex");
}

function publicBooking(record: DemoBookingRecord) {
  const startAt = new Date(record.startAt);
  const endAt = new Date(record.endAt);
  const manageUrl = manageDemoUrl(record.manageToken);
  const calendar = demoCalendarLinks({
    id: record.id,
    startAt,
    endAt,
    attendeeName: record.name,
    attendeeEmail: record.email,
    company: record.company,
    manageUrl,
    manageToken: record.manageToken,
    sequence: record.sequence,
  });
  return {
    id: record.id,
    status: record.status,
    name: record.name,
    email: record.email,
    company: record.company,
    when: formatDemoRange(startAt, endAt),
    startAt: record.startAt,
    endAt: record.endAt,
    manageUrl,
    calendar,
  };
}

export async function loadConfirmedStartsBetween(fromIso: string, toIso: string): Promise<string[]> {
  const { data, error } = await getAdminDb()
    .from("DemoBooking")
    .select("startAt")
    .eq("status", "CONFIRMED")
    .gte("startAt", fromIso)
    .lte("startAt", toIso);
  throwIf(error, "DEMO_SLOTS_LOOKUP_FAILED");
  return (data ?? []).map((row) => new Date(String(row.startAt)).toISOString());
}

export async function loadMonthSlots(year: number, month: number, now = new Date()) {
  const keys = monthKeys(year, month);
  const from = `${keys[0]}T00:00:00.000Z`;
  const to = `${keys[keys.length - 1]}T23:59:59.999Z`;
  const booked = await loadConfirmedStartsBetween(from, to);
  const { startKey, endKey } = bookingWindow(now);
  const days = keys.map((dateKey) => {
    const inWindow = dateKey >= startKey && dateKey <= endKey && isUkWorkingDay(dateKey);
    const slots = inWindow ? buildSlotsForDay(dateKey, booked, now) : [];
    return { date: dateKey, slots };
  });
  return {
    timezone: DEMO_TIME_ZONE,
    durationMinutes: DEMO_DURATION_MINUTES,
    hostName: getDemoHost().name,
    days: days.filter((day) => day.slots.length > 0 || (day.date >= startKey && day.date <= endKey)),
  };
}

export async function loadDemoByToken(token: string): Promise<DemoBookingRecord | null> {
  const { data, error } = await getAdminDb()
    .from("DemoBooking")
    .select("*")
    .eq("manageToken", token)
    .maybeSingle();
  throwIf(error, "DEMO_LOOKUP_FAILED");
  return (data as DemoBookingRecord | null) ?? null;
}

export async function loadUpcomingDemos(): Promise<DemoBookingRecord[]> {
  const { data, error } = await getAdminDb()
    .from("DemoBooking")
    .select("*")
    .order("startAt", { ascending: true });
  throwIf(error, "DEMO_ADMIN_LOOKUP_FAILED");
  return (data ?? []) as DemoBookingRecord[];
}

async function resolveCrmOwnerId(): Promise<string | null> {
  const db = getAdminDb();
  const hostEmail = getDemoHost().email.toLowerCase();
  const { data: host } = await db.from("User").select("id").eq("email", hostEmail).maybeSingle();
  if (host?.id) return String(host.id);
  const { data: sales } = await db
    .from("User")
    .select("id")
    .or("isSales.eq.true,isSalesManager.eq.true,isSuperAdmin.eq.true")
    .limit(1)
    .maybeSingle();
  return sales?.id ? String(sales.id) : null;
}

async function syncCrmLead(input: {
  name: string;
  email: string;
  phone: string | null;
  company: string;
  jobTitle: string | null;
  notes: string | null;
  startAt: Date;
  endAt: Date;
}): Promise<string | null> {
  const ownerId = await resolveCrmOwnerId();
  if (!ownerId) return null;
  const db = getAdminDb();
  const now = nowIso();
  const when = formatDemoRange(input.startAt, input.endAt);

  const { data: existingContact } = await db
    .from("CrmContact")
    .select("id, organisationId")
    .eq("email", input.email.toLowerCase())
    .limit(1)
    .maybeSingle();

  let organisationId = existingContact ? String(existingContact.organisationId) : null;
  let dealId: string | null = null;

  if (!organisationId) {
    organisationId = createId();
    dealId = createId();
    const { error: orgError } = await db.from("CrmOrganisation").insert({
      id: organisationId,
      name: input.company,
      ownerId,
      source: "WEBSITE",
      notes: input.notes || "Booked a product demo from the website",
      createdAt: now,
      updatedAt: now,
    });
    throwIf(orgError, "DEMO_CRM_ORG_FAILED");
    await db.from("CrmContact").insert({
      id: createId(),
      organisationId,
      name: input.name,
      email: input.email.toLowerCase(),
      phone: input.phone,
      jobTitle: input.jobTitle,
      isPrimary: true,
      createdAt: now,
      updatedAt: now,
    });
    await db.from("CrmDeal").insert({
      id: dealId,
      organisationId,
      ownerId,
      title: `${input.company} — demo`,
      valueGbp: 0,
      currency: "GBP",
      stage: "DEMO",
      createdAt: now,
      updatedAt: now,
    });
  } else {
    const { data: openDeal } = await db
      .from("CrmDeal")
      .select("id")
      .eq("organisationId", organisationId)
      .in("stage", ["NEW", "QUALIFIED", "DEMO", "PROPOSAL", "NEGOTIATION"])
      .order("updatedAt", { ascending: false })
      .limit(1)
      .maybeSingle();
    dealId = openDeal?.id ? String(openDeal.id) : createId();
    if (!openDeal) {
      await db.from("CrmDeal").insert({
        id: dealId,
        organisationId,
        ownerId,
        title: `${input.company} — demo`,
        valueGbp: 0,
        currency: "GBP",
        stage: "DEMO",
        createdAt: now,
        updatedAt: now,
      });
    } else {
      await db.from("CrmDeal").update({ stage: "DEMO", updatedAt: now }).eq("id", dealId);
    }
  }

  await db.from("CrmActivity").insert({
    id: createId(),
    organisationId,
    dealId,
    type: "MEETING",
    channel: "MEETING",
    note: `Product demo booked for ${when}`,
    createdById: ownerId,
    createdAt: now,
  });

  await db.from("CrmTask").insert({
    id: createId(),
    organisationId,
    dealId,
    assignedToId: ownerId,
    title: `Run demo — ${input.company}`,
    dueAt: input.startAt.toISOString(),
    status: "OPEN",
    createdAt: now,
    updatedAt: now,
  });

  return dealId;
}

async function sendBookingEmails(record: DemoBookingRecord, kind: "booked" | "rescheduled") {
  const startAt = new Date(record.startAt);
  const endAt = new Date(record.endAt);
  const manageUrl = manageDemoUrl(record.manageToken);
  const calendar = demoCalendarLinks({
    id: record.id,
    startAt,
    endAt,
    attendeeName: record.name,
    attendeeEmail: record.email,
    company: record.company,
    manageUrl,
    manageToken: record.manageToken,
    sequence: record.sequence,
  });
  const ics = buildDemoIcs({
    id: record.id,
    startAt,
    endAt,
    attendeeName: record.name,
    attendeeEmail: record.email,
    company: record.company,
    manageUrl,
    method: "REQUEST",
    sequence: record.sequence,
  });
  const attachment = {
    filename: "hseq-nova-demo.ics",
    content: Buffer.from(ics, "utf8"),
    contentType: "text/calendar; charset=utf-8; method=REQUEST",
  };
  const host = getDemoHost();
  const when = formatDemoRange(startAt, endAt);
  const guestHtml =
    kind === "rescheduled"
      ? demoRescheduledHtml({
          name: record.name,
          startAt,
          endAt,
          manageUrl,
          googleUrl: calendar.google,
          outlookUrl: calendar.outlook,
        })
      : demoGuestConfirmationHtml({
          name: record.name,
          startAt,
          endAt,
          manageUrl,
          googleUrl: calendar.google,
          outlookUrl: calendar.outlook,
        });

  await sendEmail({
    to: record.email,
    subject:
      kind === "rescheduled"
        ? `Demo updated — ${when}`
        : `Demo booked — ${when}`,
    html: guestHtml,
    replyTo: `${host.name} <${host.email}>`,
    attachments: [attachment],
  });

  await sendEmail({
    to: host.email,
    subject: kind === "rescheduled" ? `Demo moved — ${record.company}` : `New demo — ${record.company}`,
    html: demoHostNotificationHtml({
      name: record.name,
      email: record.email,
      phone: record.phone,
      company: record.company,
      jobTitle: record.jobTitle,
      notes: record.notes,
      startAt,
      endAt,
      crmUrl: record.crmDealId ? `${appUrl()}/admin/crm/deals/${record.crmDealId}` : undefined,
    }),
    replyTo: record.email,
    attachments: [attachment],
  });
}

export async function createDemoBooking(input: {
  startAt: string;
  name: string;
  email: string;
  phone?: string;
  company: string;
  jobTitle?: string;
  notes?: string;
}) {
  const startAt = new Date(input.startAt);
  if (Number.isNaN(startAt.getTime())) {
    throw { code: "INVALID_SLOT", message: "That time is not available." };
  }
  if (!isStartWithinWindow(startAt)) {
    throw { code: "INVALID_SLOT", message: "That time is not available. Pick another slot." };
  }
  const dateKey = toDateKey(startAt);
  const slots = buildSlotsForDay(dateKey, [], new Date());
  const match = slots.find((slot) => slot.startAt === startAt.toISOString());
  if (!match) {
    throw { code: "INVALID_SLOT", message: "That time is not available. Pick another slot." };
  }

  const booked = await loadConfirmedStartsBetween(match.startAt, match.startAt);
  if (booked.includes(match.startAt)) {
    throw { code: "SLOT_TAKEN", message: "That time has just been taken. Please pick another slot." };
  }

  const id = createId();
  const manageToken = createManageToken();
  const now = nowIso();
  let crmDealId: string | null = null;
  try {
    crmDealId = await syncCrmLead({
      name: input.name,
      email: input.email.toLowerCase(),
      phone: input.phone || null,
      company: input.company,
      jobTitle: input.jobTitle || null,
      notes: input.notes || null,
      startAt,
      endAt: new Date(match.endAt),
    });
  } catch {
    crmDealId = null;
  }

  const record: DemoBookingRecord = {
    id,
    startAt: match.startAt,
    endAt: match.endAt,
    timezone: DEMO_TIME_ZONE,
    name: input.name,
    email: input.email.toLowerCase(),
    phone: input.phone || null,
    company: input.company,
    jobTitle: input.jobTitle || null,
    notes: input.notes || null,
    status: "CONFIRMED",
    manageToken,
    crmDealId,
    sequence: 0,
    cancelledAt: null,
  };

  const { error } = await getAdminDb().from("DemoBooking").insert({
    ...record,
    createdAt: now,
    updatedAt: now,
  });
  if (error) {
    if (error.code === "23505") {
      throw { code: "SLOT_TAKEN", message: "That time has just been taken. Please pick another slot." };
    }
    throw { code: "DEMO_CREATE_FAILED", message: error.message };
  }

  try {
    await sendBookingEmails(record, "booked");
  } catch {
    // Booking is stored; calendar file is still on the confirmation page.
  }

  return publicBooking(record);
}

export async function rescheduleDemoBooking(token: string, startAtIso: string) {
  const existing = await loadDemoByToken(token);
  if (!existing || existing.status !== "CONFIRMED") {
    throw { code: "NOT_FOUND", message: "This booking is no longer active." };
  }
  const startAt = new Date(startAtIso);
  if (!isStartWithinWindow(startAt)) {
    throw { code: "INVALID_SLOT", message: "That time is not available. Pick another slot." };
  }
  const dateKey = toDateKey(startAt);
  const slots = buildSlotsForDay(dateKey, [], new Date());
  const match = slots.find((slot) => slot.startAt === startAt.toISOString());
  if (!match) {
    throw { code: "INVALID_SLOT", message: "That time is not available. Pick another slot." };
  }
  if (match.startAt !== existing.startAt) {
    const booked = await loadConfirmedStartsBetween(match.startAt, match.startAt);
    if (booked.includes(match.startAt)) {
      throw { code: "SLOT_TAKEN", message: "That time has just been taken. Please pick another slot." };
    }
  }

  const sequence = existing.sequence + 1;
  const { data, error } = await getAdminDb()
    .from("DemoBooking")
    .update({
      startAt: match.startAt,
      endAt: match.endAt,
      sequence,
      updatedAt: nowIso(),
    })
    .eq("id", existing.id)
    .eq("status", "CONFIRMED")
    .select("*")
    .maybeSingle();
  if (error?.code === "23505") {
    throw { code: "SLOT_TAKEN", message: "That time has just been taken. Please pick another slot." };
  }
  throwIf(error, "DEMO_RESCHEDULE_FAILED");
  if (!data) {
    throw { code: "NOT_FOUND", message: "This booking is no longer active." };
  }
  const record = data as DemoBookingRecord;
  try {
    await sendBookingEmails(record, "rescheduled");
  } catch {
    // Page still shows the new time and calendar links.
  }
  return publicBooking(record);
}

export async function cancelDemoBooking(token: string) {
  const existing = await loadDemoByToken(token);
  if (!existing) {
    throw { code: "NOT_FOUND", message: "Booking not found." };
  }
  if (existing.status === "CANCELLED") {
    return publicBooking(existing);
  }
  const now = nowIso();
  const { data, error } = await getAdminDb()
    .from("DemoBooking")
    .update({
      status: "CANCELLED",
      cancelledAt: now,
      sequence: existing.sequence + 1,
      updatedAt: now,
    })
    .eq("id", existing.id)
    .select("*")
    .maybeSingle();
  throwIf(error, "DEMO_CANCEL_FAILED");
  const record = (data as DemoBookingRecord | null) ?? { ...existing, status: "CANCELLED" as const };
  const startAt = new Date(existing.startAt);
  const endAt = new Date(existing.endAt);
  const ics = buildDemoIcs({
    id: existing.id,
    startAt,
    endAt,
    attendeeName: existing.name,
    attendeeEmail: existing.email,
    company: existing.company,
    manageUrl: manageDemoUrl(existing.manageToken),
    method: "CANCEL",
    sequence: record.sequence,
  });
  const attachment = {
    filename: "hseq-nova-demo-cancelled.ics",
    content: Buffer.from(ics, "utf8"),
    contentType: "text/calendar; charset=utf-8; method=CANCEL",
  };
  const host = getDemoHost();
  try {
    await sendEmail({
      to: existing.email,
      subject: "Demo cancelled — HSEQ Nova",
      html: demoCancelledHtml({ name: existing.name, startAt, endAt, forHost: false }),
      replyTo: `${host.name} <${host.email}>`,
      attachments: [attachment],
    });
    await sendEmail({
      to: host.email,
      subject: `Demo cancelled — ${existing.company}`,
      html: demoCancelledHtml({ name: existing.name, startAt, endAt, forHost: true }),
      replyTo: existing.email,
      attachments: [attachment],
    });
  } catch {
    // Cancellation is stored even if mail fails.
  }
  return publicBooking(record);
}

export function icsForRecord(record: DemoBookingRecord): string {
  return buildDemoIcs({
    id: record.id,
    startAt: new Date(record.startAt),
    endAt: new Date(record.endAt),
    attendeeName: record.name,
    attendeeEmail: record.email,
    company: record.company,
    manageUrl: manageDemoUrl(record.manageToken),
    method: record.status === "CANCELLED" ? "CANCEL" : "REQUEST",
    sequence: record.sequence,
  });
}

export function publicView(record: DemoBookingRecord) {
  return publicBooking(record);
}

export type { DemoSlot };
