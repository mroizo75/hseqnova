import { NextRequest, NextResponse } from "next/server";
import { validateCronRequest } from "@/lib/cron-auth";
import { startCronExecution } from "@/lib/cron-tracker";
import { runEnterpriseSnapshots } from "@/lib/enterprise-snapshot-job";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const cron = await startCronExecution("enterprise-snapshots");
  try {
    const unauthorizedResponse = validateCronRequest(request);
    if (unauthorizedResponse) {
      return unauthorizedResponse;
    }
    const stats = await runEnterpriseSnapshots();
    await cron.succeed(stats);
    return NextResponse.json({ success: true, stats });
  } catch (error) {
    await cron.fail(error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
