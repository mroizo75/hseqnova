import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { updateFireDrillSchema } from "@/features/fire-drills/schemas/fire-drill.schema";
import {
  assertFireDrillOwnership,
  deleteFireDrillRecord,
  fireDrillDbPatchFromUpdate,
  loadFireDrillById,
  loadNamedFireMarshals,
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
    const [drill, fireMarshals] = await Promise.all([
      loadFireDrillById(session.user.tenantId, id),
      loadNamedFireMarshals(session.user.tenantId),
    ]);

    if (!drill) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ ...drill, fireMarshals });
  } catch {
    return NextResponse.json({ error: "Could not load the fire drill" }, { status: 500 });
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
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      throw error;
    }

    const body = await request.json();
    const validated = updateFireDrillSchema.parse({
      ...body,
      plannedDate: body.plannedDate ? new Date(body.plannedDate) : undefined,
    });

    const [drill, fireMarshals] = await Promise.all([
      updateFireDrillRecord(
        id,
        session.user.tenantId,
        fireDrillDbPatchFromUpdate(validated),
      ),
      loadNamedFireMarshals(session.user.tenantId),
    ]);

    return NextResponse.json({ ...drill, fireMarshals });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Check the required fields" }, { status: 400 });
    }
    return NextResponse.json({ error: "Could not update the fire drill" }, { status: 500 });
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
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      throw error;
    }

    await deleteFireDrillRecord(id, session.user.tenantId);
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "Could not delete the fire drill" }, { status: 500 });
  }
}
