import { NextResponse } from "next/server";
import { getRequiredTenantContext } from "@/lib/tenant-context";
import { getAdminDb } from "@/lib/supabase/admin";

/**
 * GET /api/hseq-cockpit/overview
 *
 * Aggregated HSEQ overview for the cockpit dashboard.
 * Returns counts, deadlines, and compliance indicators across all modules.
 */
export async function GET() {
  try {
    const { tenantId } = await getRequiredTenantContext();
    const db = getAdminDb();
    const now = new Date().toISOString();
    const sevenDays = new Date(Date.now() + 7 * 86_400_000).toISOString();

    const [
      openIncidents,
      overdueMeasures,
      upcomingMeasures,
      expiringTraining,
      upcomingInspections,
      overdueDocReviews,
      plannedAudits,
      openRisks,
      recentActivity,
      hmsScore,
    ] = await Promise.all([
      db.from("Incident").select("id", { count: "exact", head: true })
        .eq("tenantId", tenantId).in("status", ["OPEN", "INVESTIGATING"]),

      db.from("Measure").select("id", { count: "exact", head: true })
        .eq("tenantId", tenantId).neq("status", "DONE").lt("dueAt", now),

      db.from("Measure").select("id, title, dueAt, status, responsibleId")
        .eq("tenantId", tenantId).neq("status", "DONE")
        .gte("dueAt", now).lte("dueAt", sevenDays)
        .order("dueAt", { ascending: true }).limit(10),

      db.from("Training").select("id", { count: "exact", head: true })
        .eq("tenantId", tenantId).lt("validUntil", sevenDays)
        .not("validUntil", "is", null),

      db.from("Inspection").select("id, title, scheduledDate, status")
        .eq("tenantId", tenantId).in("status", ["PLANNED", "IN_PROGRESS"])
        .gte("scheduledDate", now)
        .order("scheduledDate", { ascending: true }).limit(5),

      db.from("Document").select("id", { count: "exact", head: true })
        .eq("tenantId", tenantId).eq("status", "APPROVED")
        .lt("nextReviewDate", now).not("nextReviewDate", "is", null),

      db.from("Audit").select("id, title, scheduledDate, status")
        .eq("tenantId", tenantId).in("status", ["PLANNED", "IN_PROGRESS"])
        .order("scheduledDate", { ascending: true }).limit(5),

      db.from("Risk").select("id", { count: "exact", head: true })
        .eq("tenantId", tenantId).in("status", ["OPEN", "MITIGATING"]),

      db.from("AuditLog").select("id, userId, action, resource, metadata, createdAt")
        .eq("tenantId", tenantId)
        .order("createdAt", { ascending: false }).limit(15),

      db.from("TenantHmsScore").select("*")
        .eq("tenantId", tenantId)
        .order("scoreDate", { ascending: false }).limit(1).maybeSingle(),
    ]);

    return NextResponse.json({
      openIncidents: openIncidents.count ?? 0,
      overdueMeasures: overdueMeasures.count ?? 0,
      upcomingMeasures: upcomingMeasures.data ?? [],
      expiringTraining: expiringTraining.count ?? 0,
      upcomingInspections: upcomingInspections.data ?? [],
      overdueDocReviews: overdueDocReviews.count ?? 0,
      plannedAudits: plannedAudits.data ?? [],
      openRisks: openRisks.count ?? 0,
      recentActivity: recentActivity.data ?? [],
      hmsScore: hmsScore.data ?? null,
    });
  } catch {
    return NextResponse.json({ error: "Failed to load cockpit data" }, { status: 500 });
  }
}
