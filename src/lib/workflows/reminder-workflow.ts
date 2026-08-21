import { addDays, endOfDay, startOfDay } from "date-fns";
import { prisma } from "@/lib/db";
import { createReminders, sendPendingReminders } from "@/lib/reminder-service";

const DEFAULT_LOOKAHEAD_DAYS = 14;

const parseJsonArray = (value?: string | null) => {
  if (!value) return [] as string[];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
};

const asDate = (value: Date | string) => new Date(value);

export async function syncReminderWorkflows() {
  const lookahead = Number(process.env.REMINDER_LOOKAHEAD_DAYS || DEFAULT_LOOKAHEAD_DAYS);
  const today = startOfDay(new Date());
  const windowEnd = endOfDay(addDays(today, lookahead));

  const [meetings, inspections, audits, measures] = await Promise.all([
    prisma.meeting.findMany({
      where: {
        status: "PLANNED",
        scheduledDate: {
          gte: today,
          lte: windowEnd,
        },
      },
      include: {
        participants: {
          select: { userId: true },
        },
      },
    }),
    prisma.inspection.findMany({
      where: {
        status: "PLANNED",
        scheduledDate: {
          gte: today,
          lte: windowEnd,
        },
      },
      select: {
        id: true,
        tenantId: true,
        title: true,
        description: true,
        scheduledDate: true,
        participants: true,
        conductedBy: true,
        followUpById: true,
      },
    }),
    prisma.audit.findMany({
      where: {
        status: "PLANNED",
        scheduledDate: {
          gte: today,
          lte: windowEnd,
        },
      },
      select: {
        id: true,
        tenantId: true,
        title: true,
        area: true,
        scheduledDate: true,
        leadAuditorId: true,
        teamMemberIds: true,
      },
    }),
    prisma.measure.findMany({
      where: {
        status: {
          in: ["PENDING", "IN_PROGRESS"],
        },
        dueAt: {
          gte: today,
          lte: windowEnd,
        },
      },
      select: {
        id: true,
        tenantId: true,
        title: true,
        description: true,
        dueAt: true,
        responsibleId: true,
      },
    }),
  ]);

  let created = 0;

  for (const meeting of meetings) {
    const userIds = new Set<string>();
    meeting.participants.forEach((p) => {
      if (p.userId) userIds.add(p.userId);
    });
    if (meeting.organizer) {
      userIds.add(meeting.organizer);
    }

    if (userIds.size === 0) continue;

    const description = meeting.location
      ? `Sted: ${meeting.location}`
      : meeting.meetingLink
      ? `Digitalt møte (${meeting.meetingLink})`
      : undefined;

    const result = await createReminders({
      entityType: "Meeting",
      entityId: meeting.id,
      tenantId: meeting.tenantId,
      userIds: Array.from(userIds),
      scheduledDate: asDate(meeting.scheduledDate),
      title: meeting.title,
      description,
    });
    created += result.created;
  }

  for (const inspection of inspections) {
    const participants = new Set<string>();
    parseJsonArray(inspection.participants).forEach((id) => {
      if (typeof id === "string") {
        participants.add(id);
      }
    });
    if (inspection.conductedBy) {
      participants.add(inspection.conductedBy);
    }
    if (inspection.followUpById) {
      participants.add(inspection.followUpById);
    }
    if (participants.size === 0) continue;

    const result = await createReminders({
      entityType: "Inspection",
      entityId: inspection.id,
      tenantId: inspection.tenantId,
      userIds: Array.from(participants),
      scheduledDate: asDate(inspection.scheduledDate),
      title: inspection.title,
      description: inspection.description || undefined,
    });
    created += result.created;
  }

  for (const audit of audits) {
    const teamMembers = new Set<string>();
    if (audit.leadAuditorId) {
      teamMembers.add(audit.leadAuditorId);
    }
    parseJsonArray(audit.teamMemberIds).forEach((id) => {
      if (typeof id === "string") {
        teamMembers.add(id);
      }
    });
    if (teamMembers.size === 0) continue;

    const result = await createReminders({
      entityType: "Audit",
      entityId: audit.id,
      tenantId: audit.tenantId,
      userIds: Array.from(teamMembers),
      scheduledDate: asDate(audit.scheduledDate),
      title: audit.title,
      description: audit.area ? `Område: ${audit.area}` : undefined,
    });
    created += result.created;
  }

  for (const measure of measures) {
    if (!measure.responsibleId) continue;

    const result = await createReminders({
      entityType: "Measure",
      entityId: measure.id,
      tenantId: measure.tenantId,
      userIds: [measure.responsibleId],
      scheduledDate: asDate(measure.dueAt),
      title: measure.title,
      description: measure.description || undefined,
    });
    created += result.created;
  }

  return { created };
}

export async function dispatchDueReminders() {
  return await sendPendingReminders();
}

