import { NextResponse } from "next/server";

import { getRequiredTenantContext } from "@/lib/tenant-context";
import { getAdminDb } from "@/lib/supabase/admin";
import { getAllPendingRiddorDeadlines, getOverdueRiddorReports } from "@/lib/riddor-deadlines";
import type { RiddorCategory } from "@/lib/riddor";

/**
 * GET /api/riddor/deadlines
 *
 * Returns all RIDDOR-reportable incidents with approaching or overdue deadlines.
 * Used by the HSEQ cockpit and dashboard alerts.
 *
 * Query params:
 *  - overdue_only=true  — only return overdue reports
 */
export async function GET(request: Request) {
  try {
    const { tenantId } = await getRequiredTenantContext();
    const db = getAdminDb();

    const { data: incidents, error } = await db
      .from("Incident")
      .select(
        "id, title, type, occurredAt, riddorReportable, riddorCategory, riddorDueAt, riddorReportedAt",
      )
      .eq("tenantId", tenantId)
      .eq("riddorReportable", true);

    if (error) {
      return NextResponse.json({ error: "Failed to load incidents" }, { status: 500 });
    }

    const rows = (incidents ?? []).map((row) => ({
      id: row.id as string,
      title: row.title as string,
      type: row.type as string,
      occurredAt: row.occurredAt as string,
      riddorReportable: row.riddorReportable as boolean,
      riddorCategory: row.riddorCategory as RiddorCategory,
      riddorDueAt: row.riddorDueAt as string | null,
      riddorReportedAt: row.riddorReportedAt as string | null,
    }));

    const url = new URL(request.url);
    const overdueOnly = url.searchParams.get("overdue_only") === "true";

    const deadlines = overdueOnly
      ? getOverdueRiddorReports(rows)
      : getAllPendingRiddorDeadlines(rows);

    return NextResponse.json({
      total: deadlines.length,
      overdue: deadlines.filter((d) => d.isOverdue).length,
      deadlines: deadlines.map((d) => ({
        incidentId: d.incidentId,
        incidentTitle: d.incidentTitle,
        incidentType: d.incidentType,
        incidentDate: d.incidentDate.toISOString(),
        deadlineDate: d.deadlineDate.toISOString(),
        deadlineType: d.deadlineType,
        isOverdue: d.isOverdue,
        daysRemaining: d.daysRemaining,
        riddorCategory: d.riddorCategory,
      })),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : (err as { message?: string })?.message;
    if (message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to check RIDDOR deadlines" },
      { status: 500 },
    );
  }
}
