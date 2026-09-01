"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import {
  SupportSenderType,
  SupportTicketCategory,
  SupportTicketPriority,
  SupportTicketStatus,
} from "@prisma/client";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getAdminDb } from "@/lib/supabase/admin";
import { withAuditLog } from "@/lib/audit-log";
import { sendEmail } from "@/lib/email";
import { getRequiredTenantContext } from "@/lib/tenant-context";
import { createNotification } from "@/server/actions/notification.actions";
import { formatSupportTicketNumber } from "@/features/support/lib/labels";

type ActionError = { code: string; message: string };
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: ActionError };

const createTicketSchema = z.object({
  subject: z.string().trim().min(3, "Emne må være minst 3 tegn").max(200),
  body: z.string().trim().min(5, "Melding må være minst 5 tegn").max(10000),
  category: z.nativeEnum(SupportTicketCategory).default(SupportTicketCategory.QUESTION),
  priority: z.nativeEnum(SupportTicketPriority).default(SupportTicketPriority.NORMAL),
});

const replySchema = z.object({
  ticketId: z.string().min(1),
  body: z.string().trim().min(1, "Melding kan ikke være tom").max(10000),
  isInternal: z.boolean().optional(),
});

const updateStatusSchema = z.object({
  ticketId: z.string().min(1),
  status: z.nativeEnum(SupportTicketStatus),
});

const assignSchema = z.object({
  ticketId: z.string().min(1),
  assignedToId: z.string().nullable(),
});

function fail(code: string, message: string): ActionResult<never> {
  return { success: false, error: { code, message } };
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function requireStaffUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return null;
  }

  const { data: user, error } = await getAdminDb()
    .from("User")
    .select("id, name, email, isSuperAdmin, isSupport, isSales, isSalesManager")
    .eq("email", session.user.email)
    .maybeSingle();

  if (error || !user || (!user.isSuperAdmin && !user.isSupport && !user.isSales && !user.isSalesManager)) {
    return null;
  }

  return user as {
    id: string;
    name: string | null;
    email: string;
    isSuperAdmin: boolean;
    isSupport: boolean;
    isSales: boolean;
    isSalesManager: boolean;
  };
}

async function nextTicketNumber(retries = 3): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `SUP-${year}-`;
  const latest = await prisma.supportTicket.findFirst({
    where: { ticketNumber: { startsWith: prefix } },
    orderBy: { ticketNumber: "desc" },
    select: { ticketNumber: true },
  });

  const lastSeq = latest?.ticketNumber
    ? Number.parseInt(latest.ticketNumber.slice(prefix.length), 10)
    : 0;
  const nextSeq = Number.isFinite(lastSeq) ? lastSeq + 1 : 1;
  const candidate = formatSupportTicketNumber(year, nextSeq);

  const exists = await prisma.supportTicket.findUnique({
    where: { ticketNumber: candidate },
    select: { id: true },
  });

  if (exists && retries > 0) {
    return nextTicketNumber(retries - 1);
  }

  return candidate;
}

async function sendPushToStaff(title: string, body: string, link?: string) {
  const staffUsers = await prisma.user.findMany({
    where: { OR: [{ isSupport: true }, { isSuperAdmin: true }] },
    select: { id: true },
  });

  const staffIds = staffUsers.map((u) => u.id);
  if (staffIds.length === 0) return;

  const tokens = await prisma.notificationPushToken.findMany({
    where: { userId: { in: staffIds } },
    select: { expoPushToken: true },
  });

  const validTokens = tokens
    .map((t) => t.expoPushToken.trim())
    .filter((t) => /^(ExpoPushToken|ExponentPushToken)\[[A-Za-z0-9_-]+\]$/.test(t));

  if (validTokens.length === 0) return;

  const messages = validTokens.map((token) => ({
    to: token,
    sound: "default",
    title,
    body,
    data: { link: link ?? "/admin/support" },
    priority: "high",
    channelId: "support",
  }));

  await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(messages),
  });
}

async function notifySupportInbox(input: {
  subject: string;
  ticketNumber: string;
  tenantName: string;
  ticketId: string;
  preview: string;
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "https://hseqnova.com";
  const supportInbox = process.env.SUPPORT_EMAIL ?? "support@hseqnova.com";
  const staff = await prisma.user.findMany({
    where: {
      OR: [{ isSupport: true }, { isSuperAdmin: true }],
    },
    select: { email: true },
  });

  const recipients = Array.from(
    new Set([supportInbox, ...staff.map((u) => u.email).filter(Boolean)])
  );

  const html = `
    <h2>Ny support-sak: ${escapeHtml(input.ticketNumber)}</h2>
    <p><strong>Bedrift:</strong> ${escapeHtml(input.tenantName)}</p>
    <p><strong>Emne:</strong> ${escapeHtml(input.subject)}</p>
    <p>${escapeHtml(input.preview)}</p>
    <p><a href="${appUrl}/admin/support/${encodeURIComponent(input.ticketId)}">Åpne saken i admin</a></p>
  `;

  await Promise.allSettled([
    ...recipients.map((to) =>
      sendEmail({
        to,
        subject: `HSEQ Nova support: ${input.ticketNumber} – ${input.subject}`,
        html,
      })
    ),
    sendPushToStaff(
      `Support: ${input.ticketNumber}`,
      `${input.tenantName}: ${input.subject}`,
      `${appUrl}/admin/support/${input.ticketId}`
    ),
  ]);
}

export async function createSupportTicket(
  raw: z.infer<typeof createTicketSchema>
): Promise<ActionResult<{ id: string; ticketNumber: string }>> {
  try {
    const input = createTicketSchema.parse(raw);
    const ctx = await getRequiredTenantContext();

    const tenant = await prisma.tenant.findUnique({
      where: { id: ctx.tenantId },
      select: { id: true, name: true },
    });
    if (!tenant) {
      return fail("TENANT_NOT_FOUND", "Bedrift ikke funnet");
    }

    const ticketNumber = await nextTicketNumber();

    const ticket = await prisma.supportTicket.create({
      data: {
        tenantId: ctx.tenantId,
        ticketNumber,
        subject: input.subject,
        category: input.category,
        priority: input.priority,
        status: SupportTicketStatus.OPEN,
        createdById: ctx.userId,
        lastMessageAt: new Date(),
        messages: {
          create: {
            senderUserId: ctx.userId,
            senderType: SupportSenderType.CUSTOMER,
            body: input.body,
          },
        },
      },
      select: { id: true, ticketNumber: true },
    });

    await withAuditLog(ctx.tenantId, ctx.userId, "SupportTicket", ticket.id, "CREATED", { ticketNumber: ticket.ticketNumber, subject: input.subject });

    try {
      await notifySupportInbox({
        subject: input.subject,
        ticketNumber: ticket.ticketNumber,
        tenantName: tenant.name,
        ticketId: ticket.id,
        preview: input.body.slice(0, 400),
      });
    } catch {
      // Ikke blokker opprettelse hvis e-post feiler
    }

    revalidatePath("/dashboard/support");
    revalidatePath("/admin/support");
    return { success: true, data: ticket };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail("VALIDATION", error.issues[0]?.message ?? "Ugyldig data");
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return fail("UNAUTHORIZED", "Du må være innlogget");
    }
    return fail("INTERNAL", "Kunne ikke opprette support-sak");
  }
}

export async function listMySupportTickets(): Promise<
  ActionResult<
    Array<{
      id: string;
      ticketNumber: string;
      subject: string;
      category: SupportTicketCategory;
      priority: SupportTicketPriority;
      status: SupportTicketStatus;
      lastMessageAt: Date;
      createdAt: Date;
      messageCount: number;
    }>
  >
> {
  try {
    const ctx = await getRequiredTenantContext();
    const tickets = await prisma.supportTicket.findMany({
      where: { tenantId: ctx.tenantId },
      orderBy: { lastMessageAt: "desc" },
      include: {
        _count: { select: { messages: true } },
      },
    });

    return {
      success: true,
      data: tickets.map((t) => ({
        id: t.id,
        ticketNumber: t.ticketNumber,
        subject: t.subject,
        category: t.category,
        priority: t.priority,
        status: t.status,
        lastMessageAt: t.lastMessageAt,
        createdAt: t.createdAt,
        messageCount: t._count.messages,
      })),
    };
  } catch {
    return fail("UNAUTHORIZED", "Kunne ikke hente support-saker");
  }
}

export async function getSupportTicketForCustomer(
  ticketId: string
): Promise<ActionResult<unknown>> {
  try {
    const ctx = await getRequiredTenantContext();
    const ticket = await prisma.supportTicket.findFirst({
      where: { id: ticketId, tenantId: ctx.tenantId },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        messages: {
          where: { isInternal: false },
          orderBy: { createdAt: "asc" },
          include: {
            sender: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    if (!ticket) {
      return fail("NOT_FOUND", "Ticket not found");
    }

    return { success: true, data: ticket };
  } catch {
    return fail("UNAUTHORIZED", "Ikke autentisert");
  }
}

export async function replyToSupportTicketAsCustomer(
  raw: z.infer<typeof replySchema>
): Promise<ActionResult<{ id: string }>> {
  try {
    const input = replySchema.parse(raw);
    const ctx = await getRequiredTenantContext();

    const ticket = await prisma.supportTicket.findFirst({
      where: { id: input.ticketId, tenantId: ctx.tenantId },
      include: { tenant: { select: { name: true } } },
    });

    if (!ticket) {
      return fail("NOT_FOUND", "Ticket not found");
    }
    if (ticket.status === SupportTicketStatus.CLOSED) {
      return fail("CLOSED", "Saken er lukket. Opprett en ny sak om du trenger mer hjelp.");
    }

    const message = await prisma.$transaction(async (tx) => {
      const created = await tx.supportMessage.create({
        data: {
          ticketId: ticket.id,
          senderUserId: ctx.userId,
          senderType: SupportSenderType.CUSTOMER,
          body: input.body,
        },
        select: { id: true },
      });

      await tx.supportTicket.update({
        where: { id: ticket.id },
        data: {
          lastMessageAt: new Date(),
          status:
            ticket.status === SupportTicketStatus.WAITING_CUSTOMER ||
            ticket.status === SupportTicketStatus.RESOLVED
              ? SupportTicketStatus.OPEN
              : ticket.status,
          closedAt: null,
        },
      });

      return created;
    });

    await withAuditLog(ctx.tenantId, ctx.userId, "SupportTicket", ticket.id, "UPDATED", { action: "customer_reply" });

    try {
      await notifySupportInbox({
        subject: `Svar på ${ticket.ticketNumber}`,
        ticketNumber: ticket.ticketNumber,
        tenantName: ticket.tenant.name,
        ticketId: ticket.id,
        preview: input.body.slice(0, 400),
      });
    } catch {
      // ignore email failure
    }

    revalidatePath(`/dashboard/support/${ticket.id}`);
    revalidatePath("/dashboard/support");
    revalidatePath(`/admin/support/${ticket.id}`);
    revalidatePath("/admin/support");
    return { success: true, data: message };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail("VALIDATION", error.issues[0]?.message ?? "Ugyldig data");
    }
    return fail("INTERNAL", "Kunne ikke sende melding");
  }
}

export async function listAdminSupportTickets(filters?: {
  status?: SupportTicketStatus | "ALL";
}): Promise<ActionResult<unknown>> {
  try {
    const staff = await requireStaffUser();
    if (!staff) {
      return fail("FORBIDDEN", "Access denied");
    }

    const db = getAdminDb();
    const status = filters?.status && filters.status !== "ALL" ? filters.status : undefined;
    let query = db.from("SupportTicket").select("*").order("lastMessageAt", { ascending: false });
    if (status) {
      query = query.eq("status", status);
    }
    const { data: tickets, error } = await query;
    if (error) {
      throw { code: "TICKET_LIST_FAILED", message: error.message };
    }

    const rows = tickets ?? [];
    const tenantIds = [...new Set(rows.map((row) => row.tenantId as string))];
    const userIds = [
      ...new Set(
        rows.flatMap((row) => [row.createdById as string, row.assignedToId as string | null].filter(Boolean) as string[]),
      ),
    ];
    const ticketIds = rows.map((row) => row.id as string);

    const [tenantsRes, usersRes, messagesRes] = await Promise.all([
      tenantIds.length
        ? db.from("Tenant").select("id, name, orgNumber").in("id", tenantIds)
        : Promise.resolve({ data: [], error: null }),
      userIds.length
        ? db.from("User").select("id, name, email").in("id", userIds)
        : Promise.resolve({ data: [], error: null }),
      ticketIds.length
        ? db.from("SupportMessage").select("ticketId, body, createdAt, senderType").in("ticketId", ticketIds).order("createdAt", { ascending: false })
        : Promise.resolve({ data: [], error: null }),
    ]);
    if (tenantsRes.error || usersRes.error || messagesRes.error) {
      throw { code: "TICKET_HYDRATE_FAILED", message: tenantsRes.error?.message ?? usersRes.error?.message ?? messagesRes.error?.message ?? "hydrate failed" };
    }

    const tenantById = new Map((tenantsRes.data ?? []).map((tenant) => [tenant.id as string, tenant]));
    const userById = new Map((usersRes.data ?? []).map((user) => [user.id as string, user]));
    const lastByTicket = new Map<string, { body: string; createdAt: string; senderType: string }>();
    const countByTicket = new Map<string, number>();
    for (const message of messagesRes.data ?? []) {
      const ticketId = message.ticketId as string;
      countByTicket.set(ticketId, (countByTicket.get(ticketId) ?? 0) + 1);
      if (!lastByTicket.has(ticketId)) {
        lastByTicket.set(ticketId, {
          body: String(message.body),
          createdAt: String(message.createdAt),
          senderType: String(message.senderType),
        });
      }
    }

    const hydrated = rows.map((row) => {
      const last = lastByTicket.get(row.id as string);
      return {
        ...row,
        lastMessageAt: new Date(row.lastMessageAt as string),
        tenant: tenantById.get(row.tenantId as string) ?? { id: row.tenantId, name: "Organisation", orgNumber: null },
        createdBy: userById.get(row.createdById as string) ?? { id: row.createdById, name: null, email: "" },
        assignedTo: row.assignedToId ? userById.get(row.assignedToId as string) ?? null : null,
        _count: { messages: countByTicket.get(row.id as string) ?? 0 },
        messages: last ? [last] : [],
      };
    });

    return { success: true, data: hydrated };
  } catch {
    return fail("INTERNAL", "Could not load support tickets");
  }
}

export async function getSupportTicketForAdmin(
  ticketId: string,
): Promise<ActionResult<unknown>> {
  try {
    const staff = await requireStaffUser();
    if (!staff) {
      return fail("FORBIDDEN", "Access denied");
    }

    const db = getAdminDb();
    const { data: ticket, error } = await db.from("SupportTicket").select("*").eq("id", ticketId).maybeSingle();
    if (error) {
      throw { code: "TICKET_LOOKUP_FAILED", message: error.message };
    }
    if (!ticket) {
      return fail("NOT_FOUND", "Ticket not found");
    }

    const [{ data: tenant }, { data: createdBy }, { data: assignedTo }, { data: messages }] = await Promise.all([
      db.from("Tenant").select("id, name, orgNumber").eq("id", ticket.tenantId as string).maybeSingle(),
      db.from("User").select("id, name, email").eq("id", ticket.createdById as string).maybeSingle(),
      ticket.assignedToId
        ? db.from("User").select("id, name, email").eq("id", ticket.assignedToId as string).maybeSingle()
        : Promise.resolve({ data: null }),
      db.from("SupportMessage").select("*").eq("ticketId", ticketId).order("createdAt", { ascending: true }),
    ]);

    const senderIds = [...new Set((messages ?? []).map((row) => row.senderUserId as string))];
    const { data: senders } = senderIds.length
      ? await db.from("User").select("id, name, email").in("id", senderIds)
      : { data: [] };
    const senderById = new Map((senders ?? []).map((user) => [user.id as string, user]));

    return {
      success: true,
      data: {
        ...ticket,
        tenant: tenant ?? { name: "Organisation", orgNumber: null },
        createdBy: createdBy ?? { name: null, email: "" },
        assignedTo: assignedTo ?? null,
        messages: (messages ?? []).map((row) => ({
          ...row,
          createdAt: new Date(row.createdAt as string),
          sender: senderById.get(row.senderUserId as string) ?? {
            id: row.senderUserId,
            name: null,
            email: "",
          },
        })),
      },
    };
  } catch {
    return fail("INTERNAL", "Could not load the ticket");
  }
}

export async function replyToSupportTicketAsStaff(
  raw: z.infer<typeof replySchema>
): Promise<ActionResult<{ id: string }>> {
  try {
    const input = replySchema.parse(raw);
    const staff = await requireStaffUser();
    if (!staff) {
      return fail("FORBIDDEN", "No access");
    }

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: input.ticketId },
      select: {
        id: true,
        tenantId: true,
        ticketNumber: true,
        subject: true,
        createdById: true,
        assignedToId: true,
        status: true,
      },
    });

    if (!ticket) {
      return fail("NOT_FOUND", "Ticket not found");
    }

    const isInternal = Boolean(input.isInternal);

    const message = await prisma.$transaction(async (tx) => {
      const created = await tx.supportMessage.create({
        data: {
          ticketId: ticket.id,
          senderUserId: staff.id,
          senderType: SupportSenderType.SUPPORT,
          body: input.body,
          isInternal,
        },
        select: { id: true },
      });

      await tx.supportTicket.update({
        where: { id: ticket.id },
        data: {
          lastMessageAt: new Date(),
          assignedToId: ticket.assignedToId ?? staff.id,
          status: isInternal
            ? ticket.status === SupportTicketStatus.OPEN
              ? SupportTicketStatus.IN_PROGRESS
              : ticket.status
            : SupportTicketStatus.WAITING_CUSTOMER,
          closedAt: null,
        },
      });

      return created;
    });

    await withAuditLog(ticket.tenantId, staff.id, "SupportTicket", ticket.id, "UPDATED", { action: "staff_reply", isInternal });

    if (!isInternal) {
      try {
        const membership = await prisma.userTenant.findUnique({
          where: {
            userId_tenantId: {
              userId: ticket.createdById,
              tenantId: ticket.tenantId,
            },
          },
          select: { role: true },
        });
        const linkBase =
          membership?.role === "ANSATT" ? "/ansatt/hjelp" : "/dashboard/support";

        await createNotification({
          tenantId: ticket.tenantId,
          userId: ticket.createdById,
          type: "SUPPORT_MSG",
          title: `Svar på ${ticket.ticketNumber}`,
          message: input.body.slice(0, 200),
          link: `${linkBase}/${ticket.id}`,
        });
      } catch {
        // ignore notification failure
      }
    }

    revalidatePath(`/admin/support/${ticket.id}`);
    revalidatePath("/admin/support");
    revalidatePath(`/dashboard/support/${ticket.id}`);
    revalidatePath("/dashboard/support");
    return { success: true, data: message };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail("VALIDATION", error.issues[0]?.message ?? "Ugyldig data");
    }
    return fail("INTERNAL", "Kunne ikke sende melding");
  }
}

export async function updateSupportTicketStatus(
  raw: z.infer<typeof updateStatusSchema>
): Promise<ActionResult<{ id: string }>> {
  try {
    const input = updateStatusSchema.parse(raw);
    const staff = await requireStaffUser();
    if (!staff) {
      return fail("FORBIDDEN", "No access");
    }

    const ticket = await prisma.supportTicket.update({
      where: { id: input.ticketId },
      data: {
        status: input.status,
        closedAt:
          input.status === SupportTicketStatus.CLOSED ||
          input.status === SupportTicketStatus.RESOLVED
            ? new Date()
            : null,
        assignedToId:
          input.status === SupportTicketStatus.IN_PROGRESS
            ? undefined
            : undefined,
      },
      select: {
        id: true,
        tenantId: true,
        createdById: true,
        ticketNumber: true,
        status: true,
      },
    });

    await withAuditLog(ticket.tenantId, staff.id, "SupportTicket", ticket.id, "UPDATED", { status: input.status });

    if (
      input.status === SupportTicketStatus.RESOLVED ||
      input.status === SupportTicketStatus.CLOSED
    ) {
      try {
        const membership = await prisma.userTenant.findUnique({
          where: {
            userId_tenantId: {
              userId: ticket.createdById,
              tenantId: ticket.tenantId,
            },
          },
          select: { role: true },
        });
        const linkBase =
          membership?.role === "ANSATT" ? "/ansatt/hjelp" : "/dashboard/support";

        await createNotification({
          tenantId: ticket.tenantId,
          userId: ticket.createdById,
          type: "SUPPORT_TICKET",
          title: `${ticket.ticketNumber} er ${input.status === "RESOLVED" ? "løst" : "lukket"}`,
          message: "Du kan åpne saken igjen ved å sende en ny melding, eller opprette en ny sak.",
          link: `${linkBase}/${ticket.id}`,
        });
      } catch {
        // ignore
      }
    }

    revalidatePath(`/admin/support/${ticket.id}`);
    revalidatePath("/admin/support");
    revalidatePath(`/dashboard/support/${ticket.id}`);
    return { success: true, data: { id: ticket.id } };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail("VALIDATION", error.issues[0]?.message ?? "Ugyldig data");
    }
    return fail("INTERNAL", "Kunne ikke oppdatere status");
  }
}

export async function assignSupportTicket(
  raw: z.infer<typeof assignSchema>
): Promise<ActionResult<{ id: string }>> {
  try {
    const input = assignSchema.parse(raw);
    const staff = await requireStaffUser();
    if (!staff) {
      return fail("FORBIDDEN", "No access");
    }

    if (input.assignedToId) {
      const { data: assignee } = await getAdminDb()
        .from("User")
        .select("id, isSupport, isSuperAdmin, isSales, isSalesManager")
        .eq("id", input.assignedToId)
        .maybeSingle();
      if (
        !assignee ||
        (!assignee.isSupport && !assignee.isSuperAdmin && !assignee.isSales && !assignee.isSalesManager)
      ) {
        return fail("INVALID_ASSIGNEE", "The assignee must be a platform staff member");
      }
    }

    const ticket = await prisma.supportTicket.update({
      where: { id: input.ticketId },
      data: {
        assignedToId: input.assignedToId,
        status:
          input.assignedToId && input.assignedToId === staff.id
            ? SupportTicketStatus.IN_PROGRESS
            : undefined,
      },
      select: { id: true, tenantId: true },
    });

    await withAuditLog(ticket.tenantId, staff.id, "SupportTicket", ticket.id, "UPDATED", { assignedTo: input.assignedToId });

    revalidatePath(`/admin/support/${ticket.id}`);
    revalidatePath("/admin/support");
    return { success: true, data: ticket };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail("VALIDATION", error.issues[0]?.message ?? "Ugyldig data");
    }
    return fail("INTERNAL", "Kunne ikke tildele sak");
  }
}

export async function claimSupportTicket(
  ticketId: string
): Promise<ActionResult<{ id: string }>> {
  const staff = await requireStaffUser();
  if (!staff) {
    return fail("FORBIDDEN", "No access");
  }
  return assignSupportTicket({ ticketId, assignedToId: staff.id });
}

export async function getSupportStaffOptions(): Promise<
  ActionResult<Array<{ id: string; name: string | null; email: string }>>
> {
  const staff = await requireStaffUser();
  if (!staff) {
    return fail("FORBIDDEN", "No access");
  }

  const users = await prisma.user.findMany({
    where: { OR: [{ isSupport: true }, { isSuperAdmin: true }] },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });

  return { success: true, data: users };
}

export async function getUnreadSupportCount(): Promise<number> {
  const staff = await requireStaffUser();
  if (!staff) return 0;

  const count = await prisma.supportTicket.count({
    where: {
      status: { in: ["OPEN", "IN_PROGRESS"] },
    },
  });

  return count;
}
