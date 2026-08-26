/**
 * Competence matrix PDF
 * HSWA 1974 s.2(2)(c) — information, instruction, training and supervision
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { loadTenantBranding } from "@/server/queries/training.queries";
import { generateBrandedPdf } from "@/lib/pdf-brand";
import { z } from "zod";
import { format } from "date-fns";
import { enGB } from "date-fns/locale";

const matrixDataSchema = z.object({
  matrixData: z.array(
    z.object({
      userName: z.string(),
      courses: z.array(
        z.object({
          courseTitle: z.string(),
          status: z.string(),
          completedAt: z.string().optional(),
          validUntil: z.string().optional(),
          isRequired: z.boolean(),
        }),
      ),
    }),
  ),
  courseHeaders: z.array(z.string()),
  tenantId: z.string(),
});

function statusText(course: { status: string; validUntil?: string }): string {
  const d = course.validUntil
    ? format(new Date(course.validUntil), "dd/MM/yy", { locale: enGB })
    : null;

  switch (course.status) {
    case "VALID":
    case "COMPLETED":
      return d ? `OK – ${d}` : "OK";
    case "EXPIRING_SOON":
      return d ? `Expires ${d}` : "Expiring soon";
    case "EXPIRED":
      return d ? `Expired ${d}` : "Expired";
    case "MISSING_REQUIRED":
      return "Missing (required)";
    default:
      return "–";
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { matrixData, courseHeaders, tenantId } = matrixDataSchema.parse(body);

    if (session.user.tenantId !== tenantId) {
      return NextResponse.json({ error: "No access" }, { status: 403 });
    }

    const tenant = await loadTenantBranding(tenantId);
    if (!tenant) {
      return NextResponse.json({ error: "Organisation not found" }, { status: 404 });
    }

    const tableRows = matrixData.map((row) => [
      row.userName,
      ...row.courses.map((course) => statusText(course)),
    ]);

    const missingRequired = matrixData.flatMap((row) =>
      row.courses
        .filter((course) => course.status === "MISSING_REQUIRED")
        .map((course) => `${row.userName}: ${course.courseTitle}`),
    );

    const pdfBuffer = await generateBrandedPdf({
      type: "formal",
      reportLabel: "Competence matrix",
      title: "Competence matrix — training overview",
      tenant: {
        name: tenant.name,
        orgNumber: tenant.orgNumber,
        logoUrl: tenant.logoUrl,
      },
      generatedAt: new Date(),
      sections: [
        {
          title: "Overview",
          content: [
            {
              type: "table",
              headers: ["Employee", ...courseHeaders],
              rows: tableRows,
            },
          ],
        },
        ...(missingRequired.length > 0
          ? [
              {
                title: "Gaps — required training",
                content: [
                  {
                    type: "alert" as const,
                    text: `The following employees are missing required training:\n${missingRequired.join("\n")}`,
                    severity: "warning" as const,
                  },
                ],
              },
            ]
          : []),
      ],
    });

    const filename = `competence-matrix-${format(new Date(), "yyyy-MM-dd")}.pdf`;

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": pdfBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Could not generate PDF" }, { status: 500 });
  }
}
