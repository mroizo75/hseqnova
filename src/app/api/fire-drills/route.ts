import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { createFireDrillSchema } from "@/features/fire-drills/schemas/fire-drill.schema";
import { insertFireDrill, loadFireDrillsForList } from "@/server/queries/fire-drills.queries";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const drills = await loadFireDrillsForList(session.user.tenantId);
    return NextResponse.json(drills);
  } catch {
    return NextResponse.json({ error: "Could not load fire drills" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const validated = createFireDrillSchema.parse({
      ...body,
      plannedDate: body.plannedDate ? new Date(body.plannedDate) : undefined,
    });

    const drill = await insertFireDrill({
      tenantId: session.user.tenantId,
      title: validated.title,
      drillType: validated.drillType,
      isAnnounced: validated.isAnnounced,
      plannedDate: validated.plannedDate,
      location: validated.location,
      responsibleId: validated.responsibleId,
      objectives: validated.objectives,
      scenario: validated.scenario ?? null,
      riskAssessment: validated.riskAssessment ?? null,
      participantIds: validated.participantIds ?? null,
      sharedPremises: validated.sharedPremises,
      buildingOwnerCoordinated: validated.buildingOwnerCoordinated ?? null,
      buildingOwnerName: validated.buildingOwnerName ?? null,
      otherTenantsInformed: validated.otherTenantsInformed ?? null,
      fullBuildingEvacuation: validated.fullBuildingEvacuation ?? null,
      totalBuildingOccupants: validated.totalBuildingOccupants ?? null,
    });

    return NextResponse.json(drill, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Check the required fields", details: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Could not plan the drill" }, { status: 500 });
  }
}
