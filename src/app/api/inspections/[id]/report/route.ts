import { NextRequest, NextResponse } from "next/server";
import { getRequiredTenantContext } from "@/lib/tenant-context";
import { generateInspectionReport } from "@/lib/inspection-pdf";
import { loadInspectionDetail, loadTenantBranding } from "@/server/queries/inspections.queries";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantContext = await getRequiredTenantContext();
    const { id } = await params;
    const inspection = await loadInspectionDetail(tenantContext.tenantId, id);
    if (!inspection) {
      return new NextResponse("Inspection not found", { status: 404 });
    }

    const tenant = await loadTenantBranding(tenantContext.tenantId);
    const pdfBuffer = await generateInspectionReport({
      ...inspection,
      conductedBy: tenantContext.email,
      tenantName: tenant?.name,
      tenantOrgNumber: tenant?.orgNumber,
      tenantLogoUrl: tenant?.logoUrl,
    });

    return new NextResponse(pdfBuffer as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Inspection-${inspection.title.replace(/[^a-zA-Z0-9]/g, "-")}.pdf"`,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
