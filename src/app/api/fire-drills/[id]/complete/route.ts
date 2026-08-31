import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { completeFireDrillSchema } from "@/features/fire-drills/schemas/fire-drill.schema";
import { validateFireDrillComplete } from "@/lib/fire-drill-uk";
import {
  assertFireDrillOwnership,
  loadNamedFireMarshals,
  updateFireDrillRecord,
} from "@/server/queries/fire-drills.queries";

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
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      throw error;
    }

    if (existing.status === "EVALUATED" || existing.status === "CANCELLED") {
      return NextResponse.json(
        { error: "Cannot record completion on a reviewed or cancelled drill" },
        { status: 409 },
      );
    }

    const body = await request.json();
    const validated = completeFireDrillSchema.parse({
      ...body,
      completedAt: body.completedAt ? new Date(body.completedAt) : undefined,
    });

    const check = validateFireDrillComplete({
      drillType: String(existing.drillType ?? ""),
      completedAt: validated.completedAt,
      actualParticipantCount: validated.actualParticipantCount,
      evacuationTimeSeconds: validated.evacuationTimeSeconds ?? null,
      observations: validated.observations,
    });
    if (check.ok === false) {
      return NextResponse.json(
        { code: check.code, message: check.message, error: check.message },
        { status: 400 },
      );
    }

    const [drill, fireMarshals] = await Promise.all([
      updateFireDrillRecord(id, session.user.tenantId, {
        status: "COMPLETED",
        completedAt: validated.completedAt,
        actualParticipantCount: validated.actualParticipantCount,
        evacuationTimeSeconds: validated.evacuationTimeSeconds ?? null,
        observations: validated.observations,
      }),
      loadNamedFireMarshals(session.user.tenantId),
    ]);

    return NextResponse.json({ ...drill, fireMarshals });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Check the required fields", details: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Could not record completion" }, { status: 500 });
  }
}
