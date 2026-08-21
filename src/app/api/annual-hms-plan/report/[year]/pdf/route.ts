import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getAnnualPlanChecklist } from "@/server/actions/annual-hms-plan.actions";
import { generateAnnualHmsPlanReport } from "@/lib/annual-hms-plan-report-generator";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ year: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Ikke autorisert" }, { status: 401 });
    }

    const { year } = await params;
    const reportYear = Number.parseInt(year, 10);

    if (!Number.isFinite(reportYear) || reportYear < 2020 || reportYear > 2100) {
      return NextResponse.json({ error: "Ugyldig år" }, { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
      select: {
        name: true,
        orgNumber: true,
        address: true,
        city: true,
        postalCode: true,
        contactEmail: true,
        contactPhone: true,
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant ikke funnet" }, { status: 404 });
    }

    const checklistResult = await getAnnualPlanChecklist(session.user.tenantId, reportYear);

    if (!checklistResult.success) {
      const message = "error" in checklistResult ? checklistResult.error : "Kunne ikke hente sjekkliste";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const pdfBuffer = await generateAnnualHmsPlanReport({
      tenant,
      checklist: checklistResult.data,
    });

    const safeTenantName = tenant.name.replace(/[^a-zA-Z0-9]/g, "_");

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="HMS_arsplan_${safeTenantName}_${reportYear}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Annual HMS plan PDF generation error:", error);
    return NextResponse.json(
      { error: "Kunne ikke generere PDF for årlig HMS-plan" },
      { status: 500 }
    );
  }
}

