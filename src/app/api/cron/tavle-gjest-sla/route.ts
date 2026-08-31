import { NextRequest, NextResponse } from "next/server";
import { validateCronRequest } from "@/lib/cron-auth";
import { prisma } from "@/lib/db";
import { startCronExecution } from "@/lib/cron-tracker";
import { getStorage } from "@/lib/storage";
import { getPlanLimits } from "@/features/hms-tavle/lib/tavle-plan-limits";
import {
  GUEST_RETENTION_MONTHS,
  parseGuestAttachments,
  type GuestPriority,
  type GuestType,
} from "@/features/hms-tavle/lib/gjesteservice-config";
import { notifyGuestSlaBreach } from "@/features/hms-tavle/lib/gjesteservice-notify";
import { calculateRetentionCutoff } from "@/features/hms-tavle/lib/oversiktsliste-config";

/**
 * Hourly digital safety board jobs.
 *
 * 1. Escalate guest messages past the service promise.
 * 2. Delete guest messages older than the retention period — UK GDPR storage limitation.
 * 3. Delete operational site-register rows six months after work ends — not a CDM duty.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Deletes operational site-register rows after the retention period.
 * Six months after work ends is an operational choice, not a CDM statutory period.
 */
async function slettUtgaatteOversiktslister(
  now: Date,
  results: { deletedCheckins: number; checkinListsCleared: number }
): Promise<void> {
  const grupper = await prisma.tavleCheckin.groupBy({
    by: ["tavleId"],
    _max: { checkedInAt: true },
  });
  if (grupper.length === 0) return;

  const tavler = await prisma.hmsTavle.findMany({
    where: { id: { in: grupper.map((gruppe) => gruppe.tavleId) } },
    select: {
      id: true,
      workEndedAt: true,
      project: { select: { endDate: true } },
    },
  });
  const tavleById = new Map(tavler.map((tavle) => [tavle.id, tavle]));

  for (const gruppe of grupper) {
    const tavle = tavleById.get(gruppe.tavleId);
    if (!tavle) continue;

    const { cutoff } = calculateRetentionCutoff(
      tavle.workEndedAt ?? tavle.project?.endDate ?? null,
      gruppe._max.checkedInAt,
      now
    );
    if (!cutoff || cutoff > now) continue;

    const deleted = await prisma.tavleCheckin.deleteMany({
      where: { tavleId: gruppe.tavleId },
    });
    results.deletedCheckins += deleted.count;
    results.checkinListsCleared++;
  }
}

export async function GET(request: NextRequest) {
  const cron = await startCronExecution("tavle-gjest-sla");
  const unauthorizedResponse = validateCronRequest(request);
  if (unauthorizedResponse) return unauthorizedResponse;

  const now = new Date();
  const results = {
    escalated: 0,
    skippedByPlan: 0,
    deletedSubmissions: 0,
    deletedAttachments: 0,
    deletedCheckins: 0,
    checkinListsCleared: 0,
  };

  try {
    const overdue = await prisma.tavleGuestSubmission.findMany({
      where: {
        status: "NY",
        escalatedAt: null,
        slaDueAt: { lt: now },
      },
      select: {
        id: true,
        type: true,
        priority: true,
        slaDueAt: true,
        tavle: { select: { id: true, name: true, tenantId: true } },
      },
      take: 200,
    });

    for (const submission of overdue) {
      const subscription = await prisma.hmsTavleSubscription.findUnique({
        where: { tenantId: submission.tavle.tenantId },
        select: { plan: true, status: true },
      });

      if (
        !subscription ||
        subscription.status === "EXPIRED" ||
        !getPlanLimits(subscription.plan).hasGuestSlaEscalation
      ) {
        results.skippedByPlan++;
        continue;
      }

      await notifyGuestSlaBreach({
        tenantId: submission.tavle.tenantId,
        tavleId: submission.tavle.id,
        tavleName: submission.tavle.name,
        type: submission.type as GuestType,
        priority: submission.priority as GuestPriority,
        slaDueAt: submission.slaDueAt ?? now,
      });

      await prisma.tavleGuestSubmission.update({
        where: { id: submission.id },
        data: { escalatedAt: now },
      });
      results.escalated++;
    }

    const retentionCutoff = new Date(now);
    retentionCutoff.setMonth(retentionCutoff.getMonth() - GUEST_RETENTION_MONTHS);

    const expired = await prisma.tavleGuestSubmission.findMany({
      where: { createdAt: { lt: retentionCutoff } },
      select: { id: true, attachments: true },
      take: 500,
    });

    if (expired.length > 0) {
      const storage = getStorage();

      for (const submission of expired) {
        for (const attachment of parseGuestAttachments(submission.attachments)) {
          try {
            await storage.delete(attachment.key);
            results.deletedAttachments++;
          } catch (error) {
            console.error("[tavle-gjest-sla] Kunne ikke slette vedlegg:", attachment.key, error);
          }
        }
      }

      const deleted = await prisma.tavleGuestSubmission.deleteMany({
        where: { id: { in: expired.map((submission) => submission.id) } },
      });
      results.deletedSubmissions = deleted.count;
    }

    await slettUtgaatteOversiktslister(now, results);

    await cron.succeed(results);

    return NextResponse.json({ success: true, timestamp: now.toISOString(), results });
  } catch (error) {
    await cron.fail(error);
    const message = error instanceof Error ? error.message : "Ukjent feil";
    return NextResponse.json({ success: false, error: message, results }, { status: 500 });
  }
}
