import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getWellbeingReport } from "@/server/actions/wellbeing.actions";
import { generateWellbeingReportPDF } from "@/lib/adobe-pdf";
import { prisma } from "@/lib/db";

/**
 * GET /api/wellbeing/report/[year]/pdf
 * Generer og last ned PDF-rapport for psykososialt arbeidsmiljø
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ year: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { year } = await params;
    const yearNum = parseInt(year, 10);

    if (isNaN(yearNum) || yearNum < 2020 || yearNum > 2100) {
      return NextResponse.json({ error: "Ugyldig år" }, { status: 400 });
    }

    // Hent tenant-navn
    const tenant = await prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
      select: { name: true },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant ikke funnet" }, { status: 404 });
    }

    // Hent rapport-data
    const reportData = await getWellbeingReport(session.user.tenantId, yearNum);

    if (reportData.totalResponses === 0) {
      return NextResponse.json(
        { error: `Ingen psykososiale kartlegginger funnet for ${yearNum}` },
        { status: 404 }
      );
    }

    // Generer PDF
    const pdfBuffer = await generateWellbeingReportPDF(reportData, tenant.name);

    // Returner PDF
    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Psykososial-Rapport-${tenant.name}-${yearNum}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error("PDF generation error:", error);
    return NextResponse.json(
      { error: error.message || "Kunne ikke generere PDF" },
      { status: 500 }
    );
  }
}
