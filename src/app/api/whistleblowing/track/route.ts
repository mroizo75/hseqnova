import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

export const dynamic = "force-dynamic";

const trackSchema = z.object({
  caseNumber: z.string().min(1),
  accessCode: z.string().min(1),
});

/** POST /api/whistleblowing/track — look up a report by case number + access code */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { caseNumber, accessCode } = trackSchema.parse(body);

    const report = await prisma.whistleblowing.findFirst({
      where: { caseNumber, accessCode },
      include: {
        messages: {
          where: { isInternal: false },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!report) {
      return NextResponse.json(
        { error: "Invalid case number or access code" },
        { status: 404 },
      );
    }

    await prisma.whistleblowMessage.updateMany({
      where: {
        whistleblowingId: report.id,
        readByReporter: false,
      },
      data: { readByReporter: true },
    });

    const { handledBy, assignedTo, investigationNotes, ...publicData } = report;

    return NextResponse.json({ data: publicData });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
