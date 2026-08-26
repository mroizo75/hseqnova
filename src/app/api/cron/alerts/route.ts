import { NextRequest, NextResponse } from "next/server";
import { runScheduledAlerts } from "@/lib/scheduled-alerts";
import { validateCronRequest } from "@/lib/cron-auth";
import { startCronExecution } from "@/lib/cron-tracker";

/**
 * Cron Job API Route for HMS Nova Alerts
 * 
 * Denne ruten kjøres automatisk av en cron job (f.eks. Vercel Cron eller eksterne tjenester)
 * Anbefalt schedule: Daglig kl. 08:00
 * 
 * Headers:
 * - Authorization: Bearer {CRON_SECRET}
 * 
 * For Vercel Cron, legg til i vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/alerts",
 *     "schedule": "0 8 * * *"
 *   }]
 * }
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60; // 60 sekunder timeout

export async function GET(request: NextRequest) {
  const cron = await startCronExecution("alerts");
  try {
    const unauthorizedResponse = validateCronRequest(request);
    if (unauthorizedResponse) {
      return unauthorizedResponse;
    }

    const alertResults = await runScheduledAlerts();

    const totalTenants = alertResults.length;
    const totalNotifications = alertResults.reduce((sum, r) => sum + r.totalNotifications, 0);
    const totalAlerts = alertResults.reduce((sum, r) => sum + r.alerts.length, 0);

    const stats = {
      tenantsProcessed: totalTenants,
      alertsFound: totalAlerts,
      notificationsCreated: totalNotifications,
    };

    await cron.succeed(stats);

    return NextResponse.json({
      success: true,
      message: "Scheduled alerts completed",
      stats,
      results: alertResults.map(r => ({
        tenant: r.tenantName,
        notifications: r.totalNotifications,
        alertTypes: r.alerts.map(a => a.type),
      })),
    });
  } catch (error) {
    await cron.fail(error);
    console.error("Cron job failed:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}

// POST for manuell triggering
export async function POST(request: NextRequest) {
  return GET(request);
}

