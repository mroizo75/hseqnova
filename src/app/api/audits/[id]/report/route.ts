import { NextRequest, NextResponse } from "next/server";
import { getRequiredTenantContext } from "@/lib/tenant-context";
import { generateAuditReport } from "@/lib/audit-pdf";
import { loadAudit } from "@/server/queries/audits.queries";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await getRequiredTenantContext();
    const { id } = await params;
    const audit = await loadAudit(id, tenantId);
    if (!audit) {
      return new NextResponse("Audit not found", { status: 404 });
    }

    const pdfBuffer = await generateAuditReport(audit);
    return new NextResponse(pdfBuffer as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="audit-report-${audit.title.replace(/[^a-zA-Z0-9]/g, "-")}.pdf"`,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
