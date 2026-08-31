import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { evaluateFireDrillSchema } from "@/features/fire-drills/schemas/fire-drill.schema";
import { validateFireDrillReview } from "@/lib/fire-drill-uk";
import {
  assertFireDrillOwnership,
  loadNamedFireMarshals,
  updateFireDrillRecord,
} from "@/server/queries/fire-drills.queries";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId || !session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    let existing;
    try {
      existing = await assertFireDrillOwnership(id, session.user.tenantId);
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "FIRE_DRILL_NOT_FOUND") {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      throw error;
    }

    if (existing.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "The drill must be completed before it can be reviewed" },
        { status: 409 },
      );
    }

    const body = await request.json();
    const validated = evaluateFireDrillSchema.parse(body);

    const check = validateFireDrillReview({
      objectivesAchieved: validated.objectivesAchieved,
      evaluation: validated.evaluation,
      improvementPoints: validated.improvementPoints,
      procedureChangesDesc: validated.procedureChangesDesc ?? null,
    });
    if (check.ok === false) {
      return NextResponse.json(
        { code: check.code, message: check.message, error: check.message },
        { status: 400 },
      );
    }

    const procedureChangesNeeded =
      validated.objectivesAchieved !== "FULL" || validated.procedureChangesNeeded;

    const [drill, fireMarshals] = await Promise.all([
      updateFireDrillRecord(id, session.user.tenantId, {
        status: "EVALUATED",
        objectivesAchieved: validated.objectivesAchieved,
        evaluation: validated.evaluation,
        improvementPoints: validated.improvementPoints,
        procedureChangesNeeded,
        procedureChangesDesc: validated.procedureChangesDesc ?? null,
        evaluatedBy: session.user.id,
        evaluatedAt: new Date(),
      }),
      loadNamedFireMarshals(session.user.tenantId),
    ]);

    return NextResponse.json({ ...drill, fireMarshals });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Check the required fields", details: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Could not save the review" }, { status: 500 });
  }
}
