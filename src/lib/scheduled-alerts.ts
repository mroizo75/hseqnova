import { prisma } from "@/lib/db";
import { createNotification, notifyUsersByRole } from "@/server/actions/notification.actions";
import { addDays, addMonths, subDays, startOfDay, endOfDay, differenceInDays } from "date-fns";
import { NotificationType, Role } from "@prisma/client";

/**
 * HSEQ Nova Scheduled Alerts System
 * 
 * Denne tjenesten kjører automatisk og sjekker alle elementer som trenger oppfølging:
 * - Avvik som ikke er behandlet
 * - Tiltak som forfaller
 * - Opplæring som utløper
 * - Vernerunder som er planlagt/forfalt
 * - Dokumenter som trenger revisjon
 * - Risikoer som trenger gjennomgang
 * - Kjemikalier/SDS som trenger oppdatering
 * - Mål som er i fare
 * - Ledelsens gjennomgang
 * - AMU/VO-møter
 * - Revisjoner og revisjonsfunn
 */

interface AlertResult {
  type: string;
  count: number;
  notifications: number;
}

interface TenantAlertSummary {
  tenantId: string;
  tenantName: string;
  alerts: AlertResult[];
  totalNotifications: number;
}

// ============================================
// HOVEDFUNKSJON - Kjør alle varselssjekker
// ============================================

export async function runScheduledAlerts(): Promise<TenantAlertSummary[]> {
  console.log("🔔 Starting scheduled alerts check...");
  
  const tenants = await prisma.tenant.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, name: true },
  });

  const results: TenantAlertSummary[] = [];

  for (const tenant of tenants) {
    const tenantAlerts: AlertResult[] = [];
    let totalNotifications = 0;

    // Kjør alle sjekker for denne tenant
    const checks = [
      checkOverdueIncidents(tenant.id),
      checkOverdueMeasures(tenant.id),
      checkUpcomingMeasures(tenant.id),
      checkExpiringTraining(tenant.id),
      checkExpiredTraining(tenant.id),
      checkUpcomingInspections(tenant.id),
      checkOverdueInspections(tenant.id),
      checkDocumentReviews(tenant.id),
      checkChemicalReviews(tenant.id),
      checkRiskReviews(tenant.id),
      checkGoalsAtRisk(tenant.id),
      checkUpcomingMeetings(tenant.id),
      checkUpcomingAudits(tenant.id),
      checkOpenAuditFindings(tenant.id),
      checkManagementReviewDue(tenant.id),
      checkInspectionFindings(tenant.id),
      checkConstructionDailyRosterControl(tenant.id),
      checkRoutineReviews(tenant.id),
    ];

    const checkResults = await Promise.all(checks);
    
    for (const result of checkResults) {
      if (result.count > 0) {
        tenantAlerts.push(result);
        totalNotifications += result.notifications;
      }
    }

    results.push({
      tenantId: tenant.id,
      tenantName: tenant.name,
      alerts: tenantAlerts,
      totalNotifications,
    });
  }

  console.log(`✅ Scheduled alerts completed. Processed ${tenants.length} tenants.`);
  return results;
}

async function checkRoutineReviews(tenantId: string): Promise<AlertResult> {
  const now = new Date();
  let notifications = 0;

  const dueRoutines = await prisma.routine.findMany({
    where: {
      tenantId,
      status: { in: ["ACTIVE", "NEEDS_REVIEW"] },
      nextReviewAt: {
        lte: endOfDay(addDays(now, 7)),
      },
    },
    select: {
      id: true,
      title: true,
      nextReviewAt: true,
      responsibleId: true,
    },
  });

  for (const routine of dueRoutines) {
    const recentNotification = await prisma.notification.findFirst({
      where: {
        tenantId,
        type: "ROUTINE_REVIEW_DUE",
        link: { contains: routine.id },
        createdAt: { gt: subDays(now, 5) },
      },
      select: { id: true },
    });

    if (recentNotification) {
      continue;
    }

    const reviewDateText = routine.nextReviewAt
      ? new Date(routine.nextReviewAt).toLocaleDateString("en-GB")
      : "as soon as possible";

    if (routine.responsibleId) {
      await createNotification({
        tenantId,
        userId: routine.responsibleId,
        type: "ROUTINE_REVIEW_DUE",
        title: "Procedure requires review",
        message: `The procedure "${routine.title}" must be reviewed by ${reviewDateText}.`,
        link: `/dashboard/procedures/${routine.id}`,
      });
    }

    await notifyUsersByRole(tenantId, "LEDER", {
      type: "ROUTINE_REVIEW_DUE",
      title: "Manager follow-up: procedure review due",
      message: `The procedure "${routine.title}" needs follow-up by ${reviewDateText}.`,
      link: `/dashboard/procedures/${routine.id}`,
    });
    await notifyUsersByRole(tenantId, "HMS", {
      type: "ROUTINE_REVIEW_DUE",
      title: "HSE follow-up: procedure review due",
      message: `The procedure "${routine.title}" needs follow-up by ${reviewDateText}.`,
      link: `/dashboard/procedures/${routine.id}`,
    });
    notifications += 1;
  }

  return { type: "ROUTINE_REVIEW_DUE", count: dueRoutines.length, notifications };
}

// ============================================
// BYGG/ANLEGG - Daglig kontroll av oversiktsliste
// ============================================

async function checkConstructionDailyRosterControl(tenantId: string): Promise<AlertResult> {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  let notifications = 0;
  const tenantSettings = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      constructionDailyCheckAlertsEnabled: true,
      constructionDailyCheckAlertRole: true,
    },
  });
  if (!tenantSettings?.constructionDailyCheckAlertsEnabled) {
    return {
      type: "CONSTRUCTION_DAILY_CHECK_MISSING",
      count: 0,
      notifications: 0,
    };
  }

  // Finn prosjekter med aktive personer på byggeplassen
  const projectsWithActiveRoster = await prisma.project.findMany({
    where: {
      tenantId,
      constructionRosterEntries: {
        some: {
          isActive: true,
        },
      },
    },
    select: {
      id: true,
      name: true,
    },
  });

  let missingCount = 0;
  const selectedRole = tenantSettings.constructionDailyCheckAlertRole;
  const selectedRoleCount = await prisma.userTenant.count({
    where: {
      tenantId,
      role: selectedRole,
    },
  });
  const notifyRole: Role = selectedRoleCount > 0 ? selectedRole : Role.ADMIN;

  for (const project of projectsWithActiveRoster) {
    const hasDailyCheckToday = await prisma.constructionRosterDailyCheck.findFirst({
      where: {
        tenantId,
        projectId: project.id,
        checkedDate: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      select: { id: true },
    });

    if (hasDailyCheckToday) {
      continue;
    }

    missingCount += 1;

    // Unngå spam: maks ett varsel per prosjekt per dag
    const recentNotification = await prisma.notification.findFirst({
      where: {
        tenantId,
        type: "SYSTEM_ALERT",
        link: `/dashboard/projects/${project.id}/construction-compliance`,
        title: "⚠️ Daily check missing (construction)",
        createdAt: {
          gt: todayStart,
        },
      },
      select: { id: true },
    });

    if (recentNotification) {
      continue;
    }

    await notifyUsersByRole(tenantId, notifyRole, {
      type: "SYSTEM_ALERT",
      title: "⚠️ Daily check missing (construction)",
      message: `Project "${project.name}" has active persons on the roster but no daily check has been recorded today.`,
      link: `/dashboard/projects/${project.id}/construction-compliance`,
    });
    notifications += 1;
  }

  return {
    type: "CONSTRUCTION_DAILY_CHECK_MISSING",
    count: missingCount,
    notifications,
  };
}

// ============================================
// AVVIK - Sjekk ubehandlede/forfalt
// ============================================

async function checkOverdueIncidents(tenantId: string): Promise<AlertResult> {
  const now = new Date();
  let notifications = 0;

  // Finn avvik som har vært åpne i mer enn 7 dager uten behandling
  const overdueIncidents = await prisma.incident.findMany({
    where: {
      tenantId,
      status: { in: ["OPEN", "INVESTIGATING"] },
      createdAt: { lt: subDays(now, 7) },
    },
  });

  for (const incident of overdueIncidents) {
    // Sjekk om vi allerede har sendt varsel de siste 3 dagene
    const recentNotification = await prisma.notification.findFirst({
      where: {
        tenantId,
        type: "INCIDENT_OVERDUE",
        link: { contains: incident.id },
        createdAt: { gt: subDays(now, 3) },
      },
    });

    if (!recentNotification && incident.responsibleId) {
      await createNotification({
        tenantId,
        userId: incident.responsibleId,
        type: "INCIDENT_OVERDUE",
        title: "⚠️ Incident needs follow-up",
        message: `The incident "${incident.title}" has not been addressed for over 7 days. Please follow up.`,
        link: `/dashboard/incidents/${incident.id}`,
      });
      notifications++;
    }
  }

  return { type: "INCIDENT_OVERDUE", count: overdueIncidents.length, notifications };
}

// ============================================
// TILTAK - Sjekk forfalt og kommende
// ============================================

async function checkOverdueMeasures(tenantId: string): Promise<AlertResult> {
  const now = new Date();
  let notifications = 0;

  const overdueMeasures = await prisma.measure.findMany({
    where: {
      tenantId,
      status: { in: ["PENDING", "IN_PROGRESS"] },
      dueAt: { lt: startOfDay(now) },
    },
  });

  for (const measure of overdueMeasures) {
    const recentNotification = await prisma.notification.findFirst({
      where: {
        tenantId,
        type: "MEASURE_OVERDUE",
        link: { contains: measure.id },
        createdAt: { gt: subDays(now, 3) },
      },
    });

    if (!recentNotification && measure.responsibleId) {
      const daysOverdue = differenceInDays(now, measure.dueAt!);
      await createNotification({
        tenantId,
        userId: measure.responsibleId,
        type: "MEASURE_OVERDUE",
        title: "🚨 Action overdue!",
        message: `The action "${measure.title}" is ${daysOverdue} days past the deadline. Please complete or update the status.`,
        link: `/dashboard/actions`,
      });
      notifications++;
    }
  }

  return { type: "MEASURE_OVERDUE", count: overdueMeasures.length, notifications };
}

async function checkUpcomingMeasures(tenantId: string): Promise<AlertResult> {
  const now = new Date();
  const in7Days = addDays(now, 7);
  let notifications = 0;

  const upcomingMeasures = await prisma.measure.findMany({
    where: {
      tenantId,
      status: { in: ["PENDING", "IN_PROGRESS"] },
      dueAt: {
        gte: startOfDay(now),
        lte: endOfDay(in7Days),
      },
    },
  });

  for (const measure of upcomingMeasures) {
    const recentNotification = await prisma.notification.findFirst({
      where: {
        tenantId,
        type: "MEASURE_DUE_SOON",
        link: { contains: measure.id },
        createdAt: { gt: subDays(now, 7) },
      },
    });

    if (!recentNotification && measure.responsibleId) {
      const daysUntil = differenceInDays(measure.dueAt!, now);
      await createNotification({
        tenantId,
        userId: measure.responsibleId,
        type: "MEASURE_DUE_SOON",
        title: "⏰ Action due soon",
        message: `The action "${measure.title}" is due in ${daysUntil} day${daysUntil !== 1 ? "s" : ""}.`,
        link: `/dashboard/actions`,
      });
      notifications++;
    }
  }

  return { type: "MEASURE_DUE_SOON", count: upcomingMeasures.length, notifications };
}

// ============================================
// OPPLÆRING - Sjekk utløpende og utløpt
// ============================================

async function checkExpiringTraining(tenantId: string): Promise<AlertResult> {
  const now = new Date();
  const in30Days = addDays(now, 30);
  let notifications = 0;

  const expiringTraining = await prisma.training.findMany({
    where: {
      tenantId,
      validUntil: {
        gte: startOfDay(now),
        lte: endOfDay(in30Days),
      },
    },
  });

  // Grupper etter bruker
  const userTrainings = new Map<string, typeof expiringTraining>();
  for (const training of expiringTraining) {
    if (!userTrainings.has(training.userId)) {
      userTrainings.set(training.userId, []);
    }
    userTrainings.get(training.userId)!.push(training);
  }

  for (const [userId, trainings] of userTrainings) {
    const recentNotification = await prisma.notification.findFirst({
      where: {
        tenantId,
        userId,
        type: "TRAINING_DUE",
        createdAt: { gt: subDays(now, 14) },
      },
    });

    if (!recentNotification) {
      const titles = trainings.map(t => t.title).join(", ");
      await createNotification({
        tenantId,
        userId,
        type: "TRAINING_DUE",
        title: "📚 Training expiring soon",
        message: `The following training/certification expires within 30 days: ${titles}`,
        link: `/dashboard/training`,
      });
      notifications++;
    }
  }

  return { type: "TRAINING_DUE", count: expiringTraining.length, notifications };
}

async function checkExpiredTraining(tenantId: string): Promise<AlertResult> {
  const now = new Date();
  let notifications = 0;

  const expiredTraining = await prisma.training.findMany({
    where: {
      tenantId,
      validUntil: { lt: startOfDay(now) },
      isRequired: true,
    },
  });

  // Varsle HMS-ansvarlig om utløpt obligatorisk opplæring
  if (expiredTraining.length > 0) {
    await notifyUsersByRole(tenantId, "HMS", {
      type: "TRAINING_EXPIRED",
      title: "🚨 Expired mandatory training",
      message: `${expiredTraining.length} employees have expired mandatory training/certification that must be renewed.`,
      link: `/dashboard/training`,
    });
    notifications++;
  }

  return { type: "TRAINING_EXPIRED", count: expiredTraining.length, notifications };
}

// ============================================
// VERNERUNDER/INSPEKSJONER
// ============================================

async function checkUpcomingInspections(tenantId: string): Promise<AlertResult> {
  const now = new Date();
  const in7Days = addDays(now, 7);
  let notifications = 0;

  const upcomingInspections = await prisma.inspection.findMany({
    where: {
      tenantId,
      status: "PLANNED",
      scheduledDate: {
        gte: startOfDay(now),
        lte: endOfDay(in7Days),
      },
    },
  });

  for (const inspection of upcomingInspections) {
    const recentNotification = await prisma.notification.findFirst({
      where: {
        tenantId,
        type: "INSPECTION_REMINDER",
        link: { contains: inspection.id },
        createdAt: { gt: subDays(now, 3) },
      },
    });

    if (!recentNotification && inspection.conductedBy) {
      const daysUntil = differenceInDays(inspection.scheduledDate!, now);
      await createNotification({
        tenantId,
        userId: inspection.conductedBy,
        type: "INSPECTION_REMINDER",
        title: "🔍 Workplace inspection scheduled",
        message: `The workplace inspection "${inspection.title}" is scheduled in ${daysUntil} day${daysUntil !== 1 ? "s" : ""}.`,
        link: `/dashboard/inspections/${inspection.id}`,
      });
      notifications++;
    }
  }

  return { type: "INSPECTION_REMINDER", count: upcomingInspections.length, notifications };
}

async function checkOverdueInspections(tenantId: string): Promise<AlertResult> {
  const now = new Date();
  let notifications = 0;

  // Finn inspeksjoner som skulle vært gjennomført
  const overdueInspections = await prisma.inspection.findMany({
    where: {
      tenantId,
      status: "PLANNED",
      scheduledDate: { lt: startOfDay(now) },
    },
  });

  if (overdueInspections.length > 0) {
    const recentNotification = await prisma.notification.findFirst({
      where: {
        tenantId,
        type: "INSPECTION_OVERDUE",
        createdAt: { gt: subDays(now, 7) },
      },
    });

    if (!recentNotification) {
      await notifyUsersByRole(tenantId, "HMS", {
        type: "INSPECTION_OVERDUE",
        title: "⚠️ Workplace inspections not completed",
        message: `${overdueInspections.length} workplace inspection(s) have not been completed as planned.`,
        link: `/dashboard/inspections`,
      });
      notifications++;
    }
  }

  return { type: "INSPECTION_OVERDUE", count: overdueInspections.length, notifications };
}

async function checkInspectionFindings(tenantId: string): Promise<AlertResult> {
  const now = new Date();
  let notifications = 0;

  // Finn åpne funn fra inspeksjoner med forfalt frist
  const openFindings = await prisma.inspectionFinding.findMany({
    where: {
      inspection: { tenantId },
      status: "OPEN",
      dueDate: { lt: startOfDay(now) },
    },
    include: {
      inspection: true,
    },
  });

  for (const finding of openFindings) {
    if (finding.responsibleId) {
      const recentNotification = await prisma.notification.findFirst({
        where: {
          tenantId,
          userId: finding.responsibleId,
          type: "INSPECTION_FINDING",
          link: { contains: finding.inspectionId },
          createdAt: { gt: subDays(now, 7) },
        },
      });

      if (!recentNotification) {
        await createNotification({
          tenantId,
          userId: finding.responsibleId,
          type: "INSPECTION_FINDING",
          title: "🔴 Inspection finding overdue",
          message: `The finding "${finding.title}" from the workplace inspection has a past-due deadline.`,
          link: `/dashboard/inspections/${finding.inspectionId}`,
        });
        notifications++;
      }
    }
  }

  return { type: "INSPECTION_FINDING", count: openFindings.length, notifications };
}

// ============================================
// DOKUMENTER
// ============================================

async function checkDocumentReviews(tenantId: string): Promise<AlertResult> {
  const now = new Date();
  const in30Days = addDays(now, 30);
  let notifications = 0;

  const documentsNeedingReview = await prisma.document.findMany({
    where: {
      tenantId,
      status: "APPROVED",
      nextReviewDate: {
        gte: startOfDay(now),
        lte: endOfDay(in30Days),
      },
    },
  });

  if (documentsNeedingReview.length > 0) {
    const recentNotification = await prisma.notification.findFirst({
      where: {
        tenantId,
        type: "DOCUMENT_REVIEW_DUE",
        createdAt: { gt: subDays(now, 14) },
      },
    });

    if (!recentNotification) {
      await notifyUsersByRole(tenantId, "HMS", {
        type: "DOCUMENT_REVIEW_DUE",
        title: "📄 Documents need review",
        message: `${documentsNeedingReview.length} document(s) need review within 30 days.`,
        link: `/dashboard/documents`,
      });
      notifications++;
    }
  }

  return { type: "DOCUMENT_REVIEW_DUE", count: documentsNeedingReview.length, notifications };
}

// ============================================
// KJEMIKALIER/STOFFKARTOTEK
// ============================================

async function checkChemicalReviews(tenantId: string): Promise<AlertResult> {
  const now = new Date();
  const in30Days = addDays(now, 30);
  let notifications = 0;

  const chemicalsNeedingReview = await prisma.chemical.findMany({
    where: {
      tenantId,
      status: "ACTIVE",
      nextReviewDate: {
        lte: endOfDay(in30Days),
      },
    },
  });

  // Separer forfalt og kommende
  const expired = chemicalsNeedingReview.filter(c => c.nextReviewDate && c.nextReviewDate < now);
  const upcoming = chemicalsNeedingReview.filter(c => c.nextReviewDate && c.nextReviewDate >= now);

  if (expired.length > 0) {
    const recentNotification = await prisma.notification.findFirst({
      where: {
        tenantId,
        type: "CHEMICAL_EXPIRED",
        createdAt: { gt: subDays(now, 7) },
      },
    });

    if (!recentNotification) {
      await notifyUsersByRole(tenantId, "HMS", {
        type: "CHEMICAL_EXPIRED",
        title: "🧪 Chemicals need review!",
        message: `${expired.length} chemical(s) have a past-due review date and need updating.`,
        link: `/dashboard/chemicals`,
      });
      notifications++;
    }
  }

  if (upcoming.length > 0) {
    const recentNotification = await prisma.notification.findFirst({
      where: {
        tenantId,
        type: "CHEMICAL_SDS_REVIEW",
        createdAt: { gt: subDays(now, 14) },
      },
    });

    if (!recentNotification) {
      await notifyUsersByRole(tenantId, "HMS", {
        type: "CHEMICAL_SDS_REVIEW",
        title: "📋 SDS review approaching",
        message: `${upcoming.length} chemical(s) need SDS review within 30 days.`,
        link: `/dashboard/chemicals`,
      });
      notifications++;
    }
  }

  return { type: "CHEMICAL_SDS_REVIEW", count: chemicalsNeedingReview.length, notifications };
}

// ============================================
// RISIKOER
// ============================================

async function checkRiskReviews(tenantId: string): Promise<AlertResult> {
  const now = new Date();
  const in30Days = addDays(now, 30);
  let notifications = 0;

  const risksNeedingReview = await prisma.risk.findMany({
    where: {
      tenantId,
      status: { in: ["OPEN", "MITIGATING"] },
      nextReviewDate: {
        lte: endOfDay(in30Days),
      },
    },
  });

  // Finn høyrisikoer som trenger umiddelbar oppmerksomhet
  const highRisks = risksNeedingReview.filter(r => r.score && r.score >= 12);

  if (highRisks.length > 0) {
    const recentNotification = await prisma.notification.findFirst({
      where: {
        tenantId,
        type: "RISK_HIGH_SCORE",
        createdAt: { gt: subDays(now, 7) },
      },
    });

    if (!recentNotification) {
      await notifyUsersByRole(tenantId, "HMS", {
        type: "RISK_HIGH_SCORE",
        title: "🔴 High risks need review",
        message: `${highRisks.length} high risk(s) need review.`,
        link: `/dashboard/risks`,
      });
      notifications++;
    }
  }

  if (risksNeedingReview.length > highRisks.length) {
    const recentNotification = await prisma.notification.findFirst({
      where: {
        tenantId,
        type: "RISK_REVIEW_DUE",
        createdAt: { gt: subDays(now, 14) },
      },
    });

    if (!recentNotification) {
      await notifyUsersByRole(tenantId, "HMS", {
        type: "RISK_REVIEW_DUE",
        title: "⚠️ Risks need review",
        message: `${risksNeedingReview.length} risk(s) need review within 30 days.`,
        link: `/dashboard/risks`,
      });
      notifications++;
    }
  }

  return { type: "RISK_REVIEW_DUE", count: risksNeedingReview.length, notifications };
}

// ============================================
// MÅL/KPI
// ============================================

async function checkGoalsAtRisk(tenantId: string): Promise<AlertResult> {
  const now = new Date();
  let notifications = 0;

  const goalsAtRisk = await prisma.goal.findMany({
    where: {
      tenantId,
      status: "AT_RISK",
      year: new Date().getFullYear(),
    },
  });

  if (goalsAtRisk.length > 0) {
    const recentNotification = await prisma.notification.findFirst({
      where: {
        tenantId,
        type: "GOAL_AT_RISK",
        createdAt: { gt: subDays(now, 7) },
      },
    });

    if (!recentNotification) {
      await notifyUsersByRole(tenantId, "ADMIN", {
        type: "GOAL_AT_RISK",
        title: "🎯 Objectives at risk",
        message: `${goalsAtRisk.length} objective(s) are marked as "at risk" and need follow-up.`,
        link: `/dashboard/goals`,
      });
      notifications++;
    }
  }

  return { type: "GOAL_AT_RISK", count: goalsAtRisk.length, notifications };
}

// ============================================
// MØTER
// ============================================

async function checkUpcomingMeetings(tenantId: string): Promise<AlertResult> {
  const now = new Date();
  const in7Days = addDays(now, 7);
  let notifications = 0;

  const upcomingMeetings = await prisma.meeting.findMany({
    where: {
      tenantId,
      status: "PLANNED",
      scheduledDate: {
        gte: startOfDay(now),
        lte: endOfDay(in7Days),
      },
    },
    include: {
      participants: {
        include: {
          user: true,
        },
      },
    },
  });

  for (const meeting of upcomingMeetings) {
    const daysUntil = differenceInDays(meeting.scheduledDate, now);
    
    // Send påminnelse til alle deltakere
    for (const participant of meeting.participants) {
      const recentNotification = await prisma.notification.findFirst({
        where: {
          tenantId,
          userId: participant.userId,
          type: "MEETING_REMINDER",
          link: { contains: meeting.id },
          createdAt: { gt: subDays(now, 3) },
        },
      });

      if (!recentNotification) {
        await createNotification({
          tenantId,
          userId: participant.userId,
          type: "MEETING_REMINDER",
          title: `📅 ${meeting.type} meeting in ${daysUntil} day${daysUntil !== 1 ? "s" : ""}`,
          message: `You are invited to "${meeting.title}" ${meeting.location ? `at ${meeting.location}` : ""}.`,
          link: `/dashboard/meetings/${meeting.id}`,
        });
        notifications++;
      }
    }
  }

  return { type: "MEETING_REMINDER", count: upcomingMeetings.length, notifications };
}

// ============================================
// REVISJONER
// ============================================

async function checkUpcomingAudits(tenantId: string): Promise<AlertResult> {
  const now = new Date();
  const in14Days = addDays(now, 14);
  let notifications = 0;

  const upcomingAudits = await prisma.audit.findMany({
    where: {
      tenantId,
      status: "PLANNED",
      scheduledDate: {
        gte: startOfDay(now),
        lte: endOfDay(in14Days),
      },
    },
  });

  for (const audit of upcomingAudits) {
    if (audit.leadAuditorId) {
      const recentNotification = await prisma.notification.findFirst({
        where: {
          tenantId,
          userId: audit.leadAuditorId,
          type: "AUDIT_REMINDER",
          link: { contains: audit.id },
          createdAt: { gt: subDays(now, 7) },
        },
      });

      if (!recentNotification) {
        const daysUntil = differenceInDays(audit.scheduledDate!, now);
        await createNotification({
          tenantId,
          userId: audit.leadAuditorId,
          type: "AUDIT_REMINDER",
          title: "📋 Audit scheduled",
          message: `The audit "${audit.title}" is scheduled in ${daysUntil} day${daysUntil !== 1 ? "s" : ""}.`,
          link: `/dashboard/audits/${audit.id}`,
        });
        notifications++;
      }
    }
  }

  return { type: "AUDIT_REMINDER", count: upcomingAudits.length, notifications };
}

async function checkOpenAuditFindings(tenantId: string): Promise<AlertResult> {
  const now = new Date();
  let notifications = 0;

  const openFindings = await prisma.auditFinding.findMany({
    where: {
      audit: { tenantId },
      status: "OPEN",
      dueDate: { lt: startOfDay(now) },
    },
    include: {
      audit: true,
    },
  });

  for (const finding of openFindings) {
    if (finding.responsibleId) {
      const recentNotification = await prisma.notification.findFirst({
        where: {
          tenantId,
          userId: finding.responsibleId,
          type: "AUDIT_FINDING_OPEN",
          link: { contains: finding.auditId },
          createdAt: { gt: subDays(now, 7) },
        },
      });

      if (!recentNotification) {
        await createNotification({
          tenantId,
          userId: finding.responsibleId,
          type: "AUDIT_FINDING_OPEN",
          title: "🔴 Audit finding overdue",
          message: `The audit finding "${finding.description?.substring(0, 50)}..." has a past-due deadline.`,
          link: `/dashboard/audits/${finding.auditId}`,
        });
        notifications++;
      }
    }
  }

  return { type: "AUDIT_FINDING_OPEN", count: openFindings.length, notifications };
}

// ============================================
// LEDELSENS GJENNOMGANG
// ============================================

async function checkManagementReviewDue(tenantId: string): Promise<AlertResult> {
  const now = new Date();
  const in30Days = addDays(now, 30);
  let notifications = 0;

  // Finn siste gjennomgang
  const lastReview = await prisma.managementReview.findFirst({
    where: {
      tenantId,
      status: "COMPLETED",
    },
    orderBy: { reviewDate: "desc" },
  });

  // Finn planlagte gjennomganger
  const upcomingReviews = await prisma.managementReview.findMany({
    where: {
      tenantId,
      status: { in: ["PLANNED", "IN_PROGRESS"] },
      reviewDate: {
        gte: startOfDay(now),
        lte: endOfDay(in30Days),
      },
    },
  });

  // Hent tenant-konfig for årlig HMS-plan / frekvens
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      hmsAnnualPlanEnabled: true,
      managementReviewFrequencyMonths: true,
    },
  });

  if (!tenant || !tenant.hmsAnnualPlanEnabled) {
    return {
      type: "MGMT_REVIEW_DUE",
      count: 0,
      notifications: 0,
    };
  }

  const frequencyMonths = tenant.managementReviewFrequencyMonths || 12;

  // Sjekk om det er på tide med ny gjennomgang basert på tenant-spesifikk frekvens
  const lastReviewDate = lastReview?.reviewDate || new Date(0);
  const nextPlannedReviewDate =
    lastReview && frequencyMonths > 0
      ? addMonths(lastReviewDate, frequencyMonths)
      : lastReviewDate;

  const daysSinceLastReview = differenceInDays(now, lastReviewDate);
  const isDueForNewReview =
    (!lastReview && upcomingReviews.length === 0) ||
    (lastReview &&
      frequencyMonths > 0 &&
      now > nextPlannedReviewDate &&
      upcomingReviews.length === 0);

  if (isDueForNewReview) {
    const recentNotification = await prisma.notification.findFirst({
      where: {
        tenantId,
        type: "MGMT_REVIEW_DUE",
        createdAt: { gt: subDays(now, 30) },
      },
    });

    if (!recentNotification) {
      await notifyUsersByRole(tenantId, "ADMIN", {
        type: "MGMT_REVIEW_DUE",
        title: "📊 Time for management review",
        message: `It has been over ${daysSinceLastReview} days since the last management review. It is recommended to schedule a new one.`,
        link: `/dashboard/management-reviews`,
      });
      notifications++;
    }
  }

  // Varsle om kommende planlagte gjennomganger
  for (const review of upcomingReviews) {
    const recentNotification = await prisma.notification.findFirst({
      where: {
        tenantId,
        type: "MGMT_REVIEW_SCHEDULED",
        link: { contains: review.id },
        createdAt: { gt: subDays(now, 14) },
      },
    });

    if (!recentNotification) {
      await notifyUsersByRole(tenantId, "ADMIN", {
        type: "MGMT_REVIEW_SCHEDULED",
        title: "📊 Management review approaching",
        message: `"${review.title}" is scheduled for ${new Date(review.reviewDate).toLocaleDateString("en-GB")}.`,
        link: `/dashboard/management-reviews/${review.id}`,
      });
      notifications++;
    }
  }

  return { 
    type: "MGMT_REVIEW_DUE", 
    count: daysSinceLastReview > 90 ? 1 : upcomingReviews.length, 
    notifications 
  };
}

// ============================================
// EKSPORTER HJELPEFUNKSJONER
// ============================================

export async function getTaskSummaryForUser(userId: string, tenantId: string) {
  const now = new Date();
  const in7Days = addDays(now, 7);
  const in14Days = addDays(now, 14);
  const in30Days = addDays(now, 30);

  const [
    overdueIncidents,
    overdueMeasures,
    upcomingMeasures,
    expiringTraining,
    upcomingInspections,
    upcomingMeetings,
    upcomingAudits,
  ] = await Promise.all([
    // Mine avvik
    prisma.incident.count({
      where: {
        tenantId,
        responsibleId: userId,
        status: { in: ["OPEN", "INVESTIGATING"] },
      },
    }),
    // Mine forfalte tiltak
    prisma.measure.count({
      where: {
        tenantId,
        responsibleId: userId,
        status: { in: ["PENDING", "IN_PROGRESS"] },
        dueAt: { lt: startOfDay(now) },
      },
    }),
    // Mine kommende tiltak
    prisma.measure.count({
      where: {
        tenantId,
        responsibleId: userId,
        status: { in: ["PENDING", "IN_PROGRESS"] },
        dueAt: {
          gte: startOfDay(now),
          lte: endOfDay(in7Days),
        },
      },
    }),
    // Min utløpende opplæring
    prisma.training.count({
      where: {
        tenantId,
        userId,
        validUntil: {
          gte: startOfDay(now),
          lte: endOfDay(in30Days),
        },
      },
    }),
    // Mine kommende inspeksjoner
    prisma.inspection.count({
      where: {
        tenantId,
        conductedBy: userId,
        status: "PLANNED",
        scheduledDate: {
          gte: startOfDay(now),
          lte: endOfDay(in7Days),
        },
      },
    }),
    // Mine kommende møter
    prisma.meetingParticipant.count({
      where: {
        userId,
        meeting: {
          tenantId,
          status: "PLANNED",
          scheduledDate: {
            gte: startOfDay(now),
            lte: endOfDay(in7Days),
          },
        },
      },
    }),
    // Mine kommende revisjoner
    prisma.audit.count({
      where: {
        tenantId,
        leadAuditorId: userId,
        status: "PLANNED",
        scheduledDate: {
          gte: startOfDay(now),
          lte: endOfDay(in14Days),
        },
      },
    }),
  ]);

  return {
    overdueIncidents,
    overdueMeasures,
    upcomingMeasures,
    expiringTraining,
    upcomingInspections,
    upcomingMeetings,
    upcomingAudits,
    totalTasks: overdueIncidents + overdueMeasures + upcomingMeasures + upcomingInspections + upcomingMeetings + upcomingAudits,
    criticalTasks: overdueMeasures + overdueIncidents,
  };
}



