import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { evaluateFireDrillSchema } from "@/features/fire-drills/schemas/fire-drill.schema";
import { assertFireDrillOwnership, updateFireDrillRecord } from "@/server/queries/fire-drills.queries";

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
        return NextResponse.json({ error: "Ikke funnet" }, { status: 404 });
      }
      throw error;
    }

    if (existing.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "Øvelsen må være gjennomført før evaluering" },
        { status: 409 },
      );
    }

    const body = await request.json();
    const validated = evaluateFireDrillSchema.parse(body);

    const drill = await updateFireDrillRecord(id, session.user.tenantId, {
      status: "EVALUATED",
      objectivesAchieved: validated.objectivesAchieved,
      evaluation: validated.evaluation,
      improvementPoints: validated.improvementPoints,
      procedureChangesNeeded: validated.procedureChangesNeeded,
      procedureChangesDesc: validated.procedureChangesDesc ?? null,
      evaluatedBy: session.user.id,
      evaluatedAt: new Date(),
    });

    return NextResponse.json(drill);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Ugyldig data", details: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Intern feil" }, { status: 500 });
  }
}
