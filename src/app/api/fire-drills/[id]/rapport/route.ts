import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateFireDrillReport } from "@/lib/fire-drill-pdf";
import {
  loadFireDrillById,
  loadNamedFireMarshals,
  loadTenantName,
  loadUsersById,
} from "@/server/queries/fire-drills.queries";

type RouteContext = { params: Promise<{ id: string }> };

function asDate(value: unknown): Date {
  return value instanceof Date ? value : new Date(String(value));
}

function asDateOrNull(value: unknown): Date | null {
  if (!value) return null;
  const date = asDate(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.tenantId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;
    const drill = await loadFireDrillById(session.user.tenantId, id);

    if (!drill) {
      return new NextResponse("Not found", { status: 404 });
    }

    if (drill.status !== "COMPLETED" && drill.status !== "EVALUATED") {
      return new NextResponse("The drill must be completed before a record can be downloaded", {
        status: 409,
      });
    }

    const responsibleId = String(drill.responsibleId ?? "");
    const evaluatedBy = drill.evaluatedBy ? String(drill.evaluatedBy) : null;
    const [users, tenantName, fireMarshals] = await Promise.all([
      loadUsersById([responsibleId, evaluatedBy ?? ""]),
      loadTenantName(session.user.tenantId),
      loadNamedFireMarshals(session.user.tenantId),
    ]);
    const userMap = Object.fromEntries(
      users.map((user) => [user.id, user.name ?? user.email ?? user.id]),
    );

    const pdfBuffer = await generateFireDrillReport({
      id: String(drill.id),
      title: String(drill.title ?? ""),
      drillType: String(drill.drillType ?? ""),
      isAnnounced: Boolean(drill.isAnnounced),
      status: String(drill.status ?? ""),
      plannedDate: asDate(drill.plannedDate),
      completedAt: asDateOrNull(drill.completedAt),
      location: String(drill.location ?? ""),
      responsibleName: userMap[responsibleId] ?? responsibleId,
      fireMarshals,
      objectives: String(drill.objectives ?? ""),
      scenario: drill.scenario ? String(drill.scenario) : null,
      riskAssessment: drill.riskAssessment ? String(drill.riskAssessment) : null,
      actualParticipantCount:
        drill.actualParticipantCount === null || drill.actualParticipantCount === undefined
          ? null
          : Number(drill.actualParticipantCount),
      evacuationTimeSeconds:
        drill.evacuationTimeSeconds === null || drill.evacuationTimeSeconds === undefined
          ? null
          : Number(drill.evacuationTimeSeconds),
      observations: drill.observations ? String(drill.observations) : null,
      objectivesAchieved: drill.objectivesAchieved ? String(drill.objectivesAchieved) : null,
      evaluation: drill.evaluation ? String(drill.evaluation) : null,
      improvementPoints: drill.improvementPoints ? String(drill.improvementPoints) : null,
      procedureChangesNeeded:
        drill.procedureChangesNeeded === null || drill.procedureChangesNeeded === undefined
          ? null
          : Boolean(drill.procedureChangesNeeded),
      procedureChangesDesc: drill.procedureChangesDesc ? String(drill.procedureChangesDesc) : null,
      evaluatedByName: evaluatedBy ? (userMap[evaluatedBy] ?? null) : null,
      evaluatedAt: asDateOrNull(drill.evaluatedAt),
      sharedPremises: drill.sharedPremises === undefined ? null : Boolean(drill.sharedPremises),
      buildingOwnerName: drill.buildingOwnerName ? String(drill.buildingOwnerName) : null,
      measures: drill.measures.map((measure) => ({
        title: measure.title,
        status: measure.status,
        dueAt: asDate(measure.dueAt),
        responsibleName: measure.responsible?.name ?? measure.responsible?.email ?? null,
      })),
      tenantName,
    });

    const safeName = String(drill.title ?? "")
      .replace(/[^a-zA-Z0-9æøåÆØÅ\s-]/g, "")
      .replace(/\s+/g, "-");

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Fire-drill-record-${safeName}.pdf"`,
      },
    });
  } catch {
    return new NextResponse("Could not generate the fire drill record", { status: 500 });
  }
}
