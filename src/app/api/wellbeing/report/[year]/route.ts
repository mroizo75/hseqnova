import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getWellbeingReport } from "@/server/actions/wellbeing.actions";

/**
 * GET /api/wellbeing/report/[year]
 * Hent psykososial rapport for et år (JSON)
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

    // Hent rapport
    const report = await getWellbeingReport(session.user.tenantId, yearNum);

    return NextResponse.json({ success: true, data: report });
  } catch (error: any) {
    console.error("Wellbeing report error:", error);
    return NextResponse.json(
      { error: error.message || "Kunne ikke hente rapport" },
      { status: 500 }
    );
  }
}
