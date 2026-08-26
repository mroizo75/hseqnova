import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAuthMembership } from "@/lib/auth-db";
import { resolveEffectivePermissions } from "@/lib/server-authorization";
import { insertTraining, loadTrainingsForTenant } from "@/server/queries/training.queries";
import { Role } from "@prisma/client";
import type { Training } from "@prisma/client";

function toListItem(row: Training) {
  return {
    id: row.id,
    courseKey: row.courseKey,
    title: row.title,
    provider: row.provider,
    description: row.description,
    completedAt: row.completedAt,
    validUntil: row.validUntil,
    proofDocKey: row.proofDocKey,
    isRequired: row.isRequired,
    evaluatedBy: row.evaluatedBy,
    evaluatedAt: row.evaluatedAt,
    createdAt: row.createdAt,
  };
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const membership = await getAuthMembership(session.user.id, session.user.tenantId);
    if (!membership) {
      return NextResponse.json({ error: "No organisation access" }, { status: 403 });
    }

    const permissions = await resolveEffectivePermissions(
      session.user.tenantId,
      membership.role as Role,
    );
    if (!permissions.canReadOwnTraining && !permissions.canReadAllTraining) {
      return NextResponse.json({ trainings: [] }, { status: 200 });
    }

    const trainings = await loadTrainingsForTenant(session.user.tenantId, {
      userId: permissions.canReadAllTraining ? undefined : session.user.id,
      take: 50,
    });

    return NextResponse.json({ trainings: trainings.map(toListItem) }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Could not load training" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role as Role;
    const permissions = await resolveEffectivePermissions(session.user.tenantId, userRole);

    if (!permissions.canCreateTraining) {
      return NextResponse.json(
        { error: "You do not have permission to record training", message: "You do not have permission to record training" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { title, description, provider, completedAt, proofDocKey, isRequired, effectiveness } = body;

    if (!title || !completedAt) {
      return NextResponse.json(
        { error: "Title and completion date are required", message: "Title and completion date are required" },
        { status: 400 },
      );
    }

    const training = await insertTraining({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      title,
      description: description || null,
      provider: provider || "Custom",
      completedAt: new Date(completedAt),
      proofDocKey: proofDocKey || null,
      isRequired: isRequired || false,
      effectiveness: effectiveness !== undefined ? effectiveness : null,
      courseKey: `${session.user.tenantId}-${String(title).toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
    });

    return NextResponse.json(training, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not record training", message: "Could not record training" }, { status: 500 });
  }
}
