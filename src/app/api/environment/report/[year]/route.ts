import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateEnvironmentalReport } from "@/lib/environment-report-generator";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ year: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Ikke autorisert" }, { status: 401 });
    }

    const { year } = await params;
    const reportYear = parseInt(year);

    if (isNaN(reportYear) || reportYear < 2020 || reportYear > 2100) {
      return NextResponse.json({ error: "Ugyldig år" }, { status: 400 });
    }

    // Hent tenant-info
    const tenant = await prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
      select: {
        id: true,
        name: true,
        orgNumber: true,
        address: true,
        city: true,
        postalCode: true,
        contactEmail: true,
        contactPhone: true,
        industry: true,
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant ikke funnet" }, { status: 404 });
    }

    // Hent miljødata for året
    const startDate = new Date(reportYear, 0, 1);
    const endDate = new Date(reportYear, 11, 31, 23, 59, 59);

    const [aspects, measurements, goals, measures] = await Promise.all([
      // Miljøaspekter
      prisma.environmentalAspect.findMany({
        where: {
          tenantId: session.user.tenantId,
          createdAt: { lte: endDate },
        },
        include: {
          owner: { select: { name: true, email: true } },
          goal: { select: { title: true, targetValue: true, currentValue: true, unit: true } },
          measurements: {
            where: {
              measurementDate: { gte: startDate, lte: endDate },
            },
            orderBy: { measurementDate: "asc" },
          },
        },
        orderBy: { significanceScore: "desc" },
      }),

      // Alle målinger for året
      prisma.environmentalMeasurement.findMany({
        where: {
          tenantId: session.user.tenantId,
          measurementDate: { gte: startDate, lte: endDate },
        },
        include: {
          aspect: {
            select: {
              title: true,
              category: true,
            },
          },
          responsible: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { measurementDate: "asc" },
      }),

      // Miljømål for året
      prisma.goal.findMany({
        where: {
          tenantId: session.user.tenantId,
          category: "ENVIRONMENT",
          year: reportYear,
        },
        include: {
          measurements: {
            orderBy: { measurementDate: "asc" },
          },
        },
      }),

      // Miljøtiltak
      prisma.measure.findMany({
        where: {
          tenantId: session.user.tenantId,
          environmentalAspectId: { not: null },
          OR: [
            { createdAt: { gte: startDate, lte: endDate } },
            { completedAt: { gte: startDate, lte: endDate } },
          ],
        },
        include: {
          responsible: { select: { name: true } },
          environmentalAspect: { select: { title: true, category: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    // Generer PDF
    const pdfBuffer = await generateEnvironmentalReport({
      tenant,
      year: reportYear,
      aspects,
      measurements,
      goals,
      measures,
    });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Miljorapport_${tenant.name.replace(/[^a-zA-Z0-9]/g, "_")}_${reportYear}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Environment report generation error:", error);
    return NextResponse.json(
      { error: "Kunne ikke generere miljørapport" },
      { status: 500 }
    );
  }
}
