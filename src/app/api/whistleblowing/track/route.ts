import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  loadWhistleblowingByCase,
  markWhistleblowMessagesReadByReporter,
} from "@/server/queries/whistleblowing.queries";

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

    const report = await loadWhistleblowingByCase({ caseNumber, accessCode });

    if (!report) {
      return NextResponse.json(
        { error: "Invalid case number or access code" },
        { status: 404 },
      );
    }

    await markWhistleblowMessagesReadByReporter(report.id);

    const { handledBy, assignedTo, investigationNotes, ...publicData } = report;

    return NextResponse.json({ data: publicData });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
