import { NextRequest, NextResponse } from "next/server";

import { getRequiredTenantContext } from "@/lib/tenant-context";
import { generateBoardReportPdf } from "@/lib/board-report-pdf";

/**
 * GET /api/board-report/pdf?quarter=1&year=2026
 *
 * Generates and returns a branded HSEQ board report PDF for the
 * specified quarter. Defaults to the current quarter if omitted.
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId, email } = await getRequiredTenantContext();

    const { searchParams } = request.nextUrl;
    const now = new Date();
    const currentQuarter = Math.ceil((now.getMonth() + 1) / 3);

    const quarter = Number(searchParams.get("quarter")) || currentQuarter;
    const year = Number(searchParams.get("year")) || now.getFullYear();

    if (quarter < 1 || quarter > 4) {
      return NextResponse.json(
        { error: "Quarter must be between 1 and 4" },
        { status: 400 },
      );
    }

    const pdf = await generateBoardReportPdf({
      tenantId,
      quarter,
      year,
      generatedBy: email,
    });

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="board-report-Q${quarter}-${year}.pdf"`,
        "Content-Length": String(pdf.length),
      },
    });
  } catch (err: any) {
    if (err?.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to generate board report" },
      { status: 500 },
    );
  }
}
