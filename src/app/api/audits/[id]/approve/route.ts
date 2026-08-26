import { NextRequest, NextResponse } from "next/server";
import { addMonths } from "date-fns";
import { getAuthContext } from "@/lib/server-authorization";
import { getAdminDb } from "@/lib/supabase/admin";
import { loadAudit, updateAuditRecord } from "@/server/queries/audits.queries";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!auth.permissions.canCreateAudits) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const audit = await loadAudit(id, auth.tenantId);
    if (!audit) {
      return NextResponse.json({ error: "Audit not found" }, { status: 404 });
    }
    if (audit.status === "APPROVED") {
      return NextResponse.json({ error: "Already approved" }, { status: 400 });
    }

    const now = new Date();
    const db = getAdminDb();
    const { data: documents, error } = await db
      .from("Document")
      .select("id, reviewIntervalMonths")
      .eq("tenantId", auth.tenantId)
      .lte("nextReviewDate", audit.scheduledDate.toISOString());
    if (error) {
      throw { code: "AUDIT_APPROVE_FAILED", message: error.message };
    }

    await updateAuditRecord({
      id,
      tenantId: auth.tenantId,
      status: "APPROVED",
      approvedBy: auth.userId,
      approvedAt: now,
    });

    const documentsToReview = documents ?? [];
    for (const document of documentsToReview) {
      const nextReviewDate = addMonths(now, Number(document.reviewIntervalMonths ?? 12));
      const { error: documentError } = await db
        .from("Document")
        .update({
          status: "APPROVED",
          approvedBy: auth.userId,
          approvedAt: now.toISOString(),
          nextReviewDate: nextReviewDate.toISOString(),
          updatedAt: now.toISOString(),
        })
        .eq("id", document.id)
        .eq("tenantId", auth.tenantId);
      if (documentError) {
        throw { code: "AUDIT_APPROVE_FAILED", message: documentError.message };
      }
    }

    return NextResponse.json({
      success: true,
      message: `Audit approved. ${documentsToReview.length} documents updated.`,
      documentsUpdated: documentsToReview.length,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
