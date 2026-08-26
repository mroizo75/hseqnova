import { NextRequest, NextResponse } from "next/server";
import { getRequiredTenantContext } from "@/lib/tenant-context";
import { generateEnvironmentalReport } from "@/lib/environment-report-generator";
import { loadEnvironmentReportData } from "@/server/queries/environment.queries";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ year: string }> }
) {
  try {
    const { tenantId } = await getRequiredTenantContext();
    const { year } = await params;
    const reportYear = parseInt(year, 10);

    if (Number.isNaN(reportYear) || reportYear < 2020 || reportYear > 2100) {
      return NextResponse.json({ error: "Invalid year" }, { status: 400 });
    }

    const reportData = await loadEnvironmentReportData(tenantId, reportYear);
    const pdfBuffer = await generateEnvironmentalReport(reportData);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="environmental-report-${reportData.tenant.name.replace(/[^a-zA-Z0-9]/g, "_")}-${reportYear}.pdf"`,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Could not generate the environmental report" }, { status: 500 });
  }
}
