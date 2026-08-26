import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { updateFireDrillSchema } from "@/features/fire-drills/schemas/fire-drill.schema";
import {
  assertFireDrillOwnership,
  deleteFireDrillRecord,
  fireDrillDbPatchFromUpdate,
  loadFireDrillById,
  updateFireDrillRecord,
} from "@/server/queries/fire-drills.queries";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const drill = await loadFireDrillById(session.user.tenantId, id);

    if (!drill) {
      return NextResponse.json({ error: "Ikke funnet" }, { status: 404 });
    }

    return NextResponse.json(drill);
  } catch {
    return NextResponse.json({ error: "Intern feil" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    try {
      await assertFireDrillOwnership(id, session.user.tenantId);
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "FIRE_DRILL_NOT_FOUND") {
        return NextResponse.json({ error: "Ikke funnet" }, { status: 404 });
      }
      throw error;
    }

    const body = await request.json();
    const validated = updateFireDrillSchema.parse({
      ...body,
      plannedDate: body.plannedDate ? new Date(body.plannedDate) : undefined,
    });

    const drill = await updateFireDrillRecord(
      id,
      session.user.tenantId,
      fireDrillDbPatchFromUpdate(validated),
    );

    return NextResponse.json(drill);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Ugyldig data" }, { status: 400 });
    }
    return NextResponse.json({ error: "Intern feil" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    try {
      await assertFireDrillOwnership(id, session.user.tenantId);
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "FIRE_DRILL_NOT_FOUND") {
        return NextResponse.json({ error: "Ikke funnet" }, { status: 404 });
      }
      throw error;
    }

    await deleteFireDrillRecord(id, session.user.tenantId);
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "Intern feil" }, { status: 500 });
  }
}
