import { NextRequest, NextResponse } from "next/server";
import { validateCronRequest } from "@/lib/cron-auth";
import { getAdminDb } from "@/lib/supabase/admin";
import { startCronExecution } from "@/lib/cron-tracker";
import { sendEmail } from "@/lib/email";
import { suspensionWarning14Days, suspensionWarning7Days } from "@/lib/email-suspension";
import { permanentlyDeleteTenant } from "@/server/actions/tenant-deletion";
import { suspendExpiredCancelledSubscriptions } from "@/server/queries/billing.queries";

export const runtime = "nodejs";
export const maxDuration = 300;

function daysSince(isoDate: string): number {
  const ms = Date.now() - new Date(isoDate).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function addDays(isoDate: string, days: number): string {
  const d = new Date(isoDate);
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export async function GET(request: NextRequest) {
  const cron = await startCronExecution("tenant-lifecycle");
  const authError = validateCronRequest(request);
  if (authError) return authError;

  try {
    const db = getAdminDb();
    const endedCancels = await suspendExpiredCancelledSubscriptions();

    const { data: suspendedTenants } = await db
      .from("Tenant")
      .select("id, name, suspendedAt, contactEmail")
      .eq("status", "SUSPENDED")
      .not("suspendedAt", "is", null);

    const results = {
      processed: 0,
      endedCancels,
      warnings14: 0,
      warnings7: 0,
      deleted: 0,
      errors: [] as string[],
    };

    for (const tenant of suspendedTenants ?? []) {
      results.processed++;
      const days = daysSince(tenant.suspendedAt as string);
      const deletionDate = addDays(tenant.suspendedAt as string, 90);
      const email = tenant.contactEmail as string | null;

      try {
        if (days >= 90) {
          await permanentlyDeleteTenant(tenant.id as string);
          results.deleted++;
        } else if (days >= 83 && days < 84) {
          if (email) {
            const template = suspensionWarning7Days({
              companyName: tenant.name as string,
              deletionDate,
            });
            await sendEmail({ to: email, ...template });
          }
          results.warnings7++;
        } else if (days >= 76 && days < 77) {
          if (email) {
            const template = suspensionWarning14Days({
              companyName: tenant.name as string,
              deletionDate,
            });
            await sendEmail({ to: email, ...template });
          }
          results.warnings14++;
        }
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        results.errors.push(`${tenant.id}: ${msg}`);
      }
    }

    await cron.succeed(results);

    return NextResponse.json({
      ok: true,
      ...results,
    });
  } catch (error) {
    await cron.fail(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
