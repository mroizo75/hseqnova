import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { completeFireDrillSchema } from "@/features/fire-drills/schemas/fire-drill.schema";
import { assertFireDrillOwnership, updateFireDrillRecord } from "@/server/queries/fire-drills.queries";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
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

    if (existing.status === "EVALUATED" || existing.status === "CANCELLED") {
      return NextResponse.json(
        { error: "Kan ikke registrere gjennomføring på en evaluert eller avlyst øvelse" },
        { status: 409 },
      );
    }

    const body = await request.json();
    const validated = completeFireDrillSchema.parse({
      ...body,
      completedAt: body.completedAt ? new Date(body.completedAt) : undefined,
    });

    const drill = await updateFireDrillRecord(id, session.user.tenantId, {
      status: "COMPLETED",
      completedAt: validated.completedAt,
      actualParticipantCount: validated.actualParticipantCount,
      evacuationTimeSeconds: validated.evacuationTimeSeconds ?? null,
      observations: validated.observations,
    });

    return NextResponse.json(drill);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Ugyldig data", details: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Intern feil" }, { status: 500 });
  }
}
